"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentWebhook = exports.createPaymentIntent = exports.generatePreCheckInLink = exports.generateNCF = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();
exports.generateNCF = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Debes iniciar sesión.");
    }
    const { companyId, type } = data; // type: 'B01', 'B02', etc.
    if (!companyId || !type) {
        throw new functions.https.HttpsError("invalid-argument", "Faltan parámetros companyId o type.");
    }
    const sequenceQuery = db.collection("ncfSequences")
        .where("companyId", "==", companyId)
        .where("type", "==", type)
        .where("isActive", "==", true)
        .limit(1);
    try {
        return await db.runTransaction(async (transaction) => {
            const sequenceSnapshot = await transaction.get(sequenceQuery);
            if (sequenceSnapshot.empty) {
                throw new functions.https.HttpsError("not-found", "No hay secuencia NCF activa para este tipo.");
            }
            const doc = sequenceSnapshot.docs[0];
            const seqData = doc.data();
            // Validar Expiración DGII
            const expirationDate = new Date(seqData.expirationDate);
            if (new Date() > expirationDate) {
                throw new functions.https.HttpsError("failed-precondition", "La secuencia NCF ha expirado.");
            }
            // Validar Límite de la Secuencia
            const nextNumber = seqData.currentNumber + 1;
            if (seqData.endNumber && nextNumber > seqData.endNumber) {
                throw new functions.https.HttpsError("resource-exhausted", "Se ha agotado el rango de NCF autorizado.");
            }
            // Incrementar y actualizar
            transaction.update(doc.ref, { currentNumber: nextNumber });
            // Formatear: B01 + 00000001 (padding de 8 dígitos usualmente en RD)
            const paddedNumber = String(nextNumber).padStart(8, '0');
            const ncfString = `${seqData.prefix}${paddedNumber}`;
            return { ncf: ncfString };
        });
    }
    catch (error) {
        console.error("Transaction Error:", error);
        // Rethrow valid HttpsErrors
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError("internal", error.message || "Error al generar NCF.");
    }
});
exports.generatePreCheckInLink = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Debes iniciar sesión.");
    }
    const { reservationId } = data;
    if (!reservationId) {
        throw new functions.https.HttpsError("invalid-argument", "Falta reservationId.");
    }
    const token = require('crypto').randomUUID();
    try {
        const reservationRef = db.collection("reservations").doc(reservationId);
        // Validar que exista la reserva
        const docSnap = await reservationRef.get();
        if (!docSnap.exists) {
            throw new functions.https.HttpsError("not-found", "Reserva no encontrada.");
        }
        await reservationRef.update({
            preCheckInToken: token,
            preCheckInStatus: "pending"
        });
        // Construir la URL del frontend
        // En produccion puede usarse una variable de entorno, aqui devolvemos path
        return { token, reservationId };
    }
    catch (error) {
        console.error("Error generating pre-check-in link:", error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError("internal", error.message || "Error al generar enlace.");
    }
});
exports.createPaymentIntent = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Debes iniciar sesión.");
    }
    const { reservationId, amount, currency } = data;
    if (!reservationId || !amount || !currency) {
        throw new functions.https.HttpsError("invalid-argument", "Faltan parámetros reservationId, amount o currency.");
    }
    try {
        const reservationRef = db.collection("reservations").doc(reservationId);
        const reservationSnap = await reservationRef.get();
        if (!reservationSnap.exists) {
            throw new functions.https.HttpsError("not-found", "Reserva no encontrada.");
        }
        const reservationData = reservationSnap.data();
        const companyId = reservationData.companyId;
        // Fetch payment settings
        const settingsRef = db.collection("paymentSettings").doc(companyId);
        const settingsSnap = await settingsRef.get();
        if (!settingsSnap.exists) {
            throw new functions.https.HttpsError("failed-precondition", "La empresa no tiene configurada una pasarela de pago.");
        }
        const settingsData = settingsSnap.data();
        const intentId = db.collection("paymentIntents").doc().id;
        // Mock API call to gateway
        // In a real scenario, we would use axios/fetch to call Pagadito or dLocal API here
        // using settingsData.apiKey and settingsData.apiSecret
        let paymentUrl = '';
        let gatewayReference = `MOCK_REF_${Date.now()}`;
        if (settingsData.gateway === 'mock' || settingsData.testMode) {
            paymentUrl = `https://mock.gateway.app/pay/${intentId}?ref=${gatewayReference}`;
        }
        else {
            // Simulate a real gateway call
            paymentUrl = `https://checkout.sandbox.pagadito.com/pay/${intentId}`;
        }
        const newIntent = {
            id: intentId,
            companyId: companyId,
            branchId: reservationData.branchId || '',
            reservationId: reservationId,
            amount: amount,
            currency: currency,
            status: 'pending',
            gateway: settingsData.gateway || 'mock',
            gatewayReference: gatewayReference,
            paymentUrl: paymentUrl,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await db.collection("paymentIntents").doc(intentId).set(newIntent);
        return { paymentIntent: newIntent };
    }
    catch (error) {
        console.error("Error creating payment intent:", error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError("internal", error.message || "Error al crear intento de pago.");
    }
});
// Webhook for gateway notifications (e.g. from Pagadito/dLocal)
exports.paymentWebhook = functions.https.onRequest(async (req, res) => {
    // Configurando CORS básico
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    // En un entorno real, debemos validar el webhook signature (e.g. HMAC)
    // req.headers['x-signature']
    // Soportar tanto query params (GET mock) como body (POST webhook real)
    const intentId = req.body.intentId || req.query.intentId;
    const status = req.body.status || req.query.status;
    const gatewayReference = req.body.gatewayReference || req.query.gatewayReference;
    if (!intentId || !status) {
        res.status(400).send("Faltan parámetros");
        return;
    }
    try {
        const intentRef = db.collection("paymentIntents").doc(intentId);
        const intentSnap = await intentRef.get();
        if (!intentSnap.exists) {
            res.status(404).send("PaymentIntent no encontrado");
            return;
        }
        const intentData = intentSnap.data();
        if (intentData.status === 'approved') {
            res.status(200).send("Ya estaba procesado");
            return;
        }
        if (status === 'approved') {
            await db.runTransaction(async (transaction) => {
                // Actualizamos intent
                transaction.update(intentRef, {
                    status: 'approved',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                // Buscamos si hay un turno abierto para ese branch
                const sessionQuery = db.collection('cashSessions')
                    .where('branchId', '==', intentData.branchId)
                    .where('status', '==', 'open')
                    .limit(1);
                const sessionSnap = await transaction.get(sessionQuery);
                let targetSessionId = 'ONLINE_WEBHOOK';
                if (!sessionSnap.empty) {
                    targetSessionId = sessionSnap.docs[0].id;
                    const currentExpectedCard = sessionSnap.docs[0].data().expectedCard || 0;
                    transaction.update(sessionSnap.docs[0].ref, {
                        expectedCard: currentExpectedCard + intentData.amount
                    });
                }
                const txRef = db.collection('cashTransactions').doc();
                transaction.set(txRef, {
                    id: txRef.id,
                    sessionId: targetSessionId,
                    companyId: intentData.companyId,
                    branchId: intentData.branchId,
                    contractId: intentData.reservationId,
                    type: 'INCOME',
                    category: 'RENTAL',
                    amount: intentData.amount,
                    method: 'CARD',
                    reference: gatewayReference || intentId,
                    notes: `Cobro en línea (Webhook) - ${intentData.gateway}`,
                    currency: intentData.currency || 'DOP',
                    date: admin.firestore.FieldValue.serverTimestamp(),
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
            });
            res.status(200).send("Aprobado y registrado en caja");
        }
        else {
            await intentRef.update({
                status: status,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            res.status(200).send("Estado actualizado");
        }
    }
    catch (error) {
        console.error("Webhook error:", error);
        res.status(500).send("Error interno");
    }
});
//# sourceMappingURL=index.js.map