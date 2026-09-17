import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db, storage } from '../../core/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useReservationStore, type Reservation } from '../../app/store/useReservationStore';
import SignatureCanvas from 'react-signature-canvas';
import { Camera, Upload, CheckCircle, AlertTriangle, ShieldCheck, User, MapPin } from 'lucide-react';

export function PreCheckInForm() {
  const { reservationId, token } = useParams<{ reservationId: string, token: string }>();
  const { completePreCheckIn } = useReservationStore();

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [step, setStep] = useState(1);
  const sigPad = useRef<SignatureCanvas>(null);

  // Form State
  const [driverLicenseNumber, setDriverLicenseNumber] = useState('');
  const [driverLicenseCountry] = useState('República Dominicana');
  const [driverLicenseExpiry, setDriverLicenseExpiry] = useState('');
  const [customerFullName, setCustomerFullName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Photos (Base64 for compression before upload)
  const [licenseFrontBase64, setLicenseFrontBase64] = useState('');
  const [idPhotoBase64, setIdPhotoBase64] = useState('');

  useEffect(() => {
    async function loadReservation() {
      if (!reservationId || !token) {
        setError('Enlace inválido.');
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'reservations', reservationId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setError('Reserva no encontrada.');
          setLoading(false);
          return;
        }

        const data = docSnap.data() as Reservation;

        if (data.preCheckInToken !== token) {
          setError('El token de seguridad es inválido o ha expirado.');
          setLoading(false);
          return;
        }

        if (data.preCheckInStatus === 'completed') {
          setError('El pre-check-in ya ha sido completado para esta reserva.');
          setLoading(false);
          return;
        }

        setReservation({ ...data, id: docSnap.id });
        setLoading(false);
      } catch (err: any) {
        setError('Error al cargar la reserva: ' + err.message);
        setLoading(false);
      }
    }

    loadReservation();
  }, [reservationId, token]);

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Here we could add a canvas resizing step to compress it
        // For MVP, we will directly set base64 (browser scales it slightly or we upload raw if small enough)
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadBase64ToStorage = async (base64: string, path: string) => {
    const storageRef = ref(storage, path);
    await uploadString(storageRef, base64, 'data_url');
    return await getDownloadURL(storageRef);
  };

  const handleSubmit = async () => {
    if (!reservationId || !reservation) return;
    
    if (!driverLicenseExpiry) {
      alert("La fecha de expiración de la licencia es requerida.");
      return;
    }

    // INTRANT Validation: Vencimiento
    const expiryDate = new Date(driverLicenseExpiry);
    const startDate = new Date(reservation.startDate);
    
    if (expiryDate < startDate) {
      alert("La licencia introducida estará vencida antes de iniciar la renta. Por ley INTRANT no podemos proceder.");
      return;
    }

    if (!licenseFrontBase64 || !idPhotoBase64) {
      alert("Debe proveer foto de la licencia y del documento de identidad.");
      return;
    }

    if (sigPad.current?.isEmpty()) {
      alert("Debe firmar digitalmente el formulario.");
      return;
    }

    setSubmitting(true);
    try {
      const signatureData = sigPad.current?.getTrimmedCanvas().toDataURL('image/png') || '';

      // Upload to storage securely
      const licenseUrl = await uploadBase64ToStorage(licenseFrontBase64, `precheckin/${reservationId}/license_${Date.now()}.jpg`);
      const idUrl = await uploadBase64ToStorage(idPhotoBase64, `precheckin/${reservationId}/id_${Date.now()}.jpg`);
      const sigUrl = await uploadBase64ToStorage(signatureData, `precheckin/${reservationId}/signature_${Date.now()}.png`);

      await completePreCheckIn(reservationId, {
        customerFullName,
        customerAddress,
        driverLicenseNumber,
        driverLicenseCountry,
        driverLicenseExpiry,
        driverLicensePhotoUrl: licenseUrl,
        idDocumentPhotoUrl: idUrl,
        customerSignatureUrl: sigUrl,
      });

      setStep(4); // Success step
    } catch (err: any) {
      alert("Error al enviar el formulario: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Cargando enlace seguro...</div>;

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 glass rounded-2xl text-center border border-red-500/20">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-2">Enlace no disponible</h1>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pt-10 px-4 pb-20">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-8">
          <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-foreground">Pre-Check-In Digital</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cumplimiento INTRANT (Art. 32)
          </p>
        </div>

        {/* Step 1: Datos Personales */}
        {step === 1 && (
          <div className="glass p-6 rounded-2xl animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-lg font-bold text-foreground mb-4">1. Verificación de Identidad</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Nombre Completo (como aparece en ID)</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={customerFullName}
                    onChange={(e) => setCustomerFullName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg"
                    placeholder="Ej. Juan Pérez"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Dirección de Residencia</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg"
                    placeholder="Dirección completa"
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  if (!customerFullName || !customerAddress) {
                    alert("Complete todos los campos.");
                    return;
                  }
                  setStep(2);
                }}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 rounded-xl mt-6 transition-colors"
              >
                Siguiente Paso
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Licencia y Cédula */}
        {step === 2 && (
          <div className="glass p-6 rounded-2xl animate-in fade-in slide-in-from-bottom-4 space-y-6">
            <h2 className="text-lg font-bold text-foreground">2. Documentos Legales</h2>
            
            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">Licencia de Conducir</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    placeholder="No. Licencia"
                    value={driverLicenseNumber}
                    onChange={(e) => setDriverLicenseNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                  />
                </div>
                <div>
                  <input
                    type="date"
                    title="Fecha de Vencimiento"
                    value={driverLicenseExpiry}
                    onChange={(e) => setDriverLicenseExpiry(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                  />
                </div>
              </div>
              
              <div className={`mt-2 border-2 border-dashed ${licenseFrontBase64 ? 'border-primary bg-primary/5' : 'border-border'} rounded-xl p-4 text-center relative overflow-hidden`}>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handlePhotoCapture(e, setLicenseFrontBase64)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                {licenseFrontBase64 ? (
                  <div className="relative">
                    <img src={licenseFrontBase64} alt="Licencia" className="max-h-32 mx-auto rounded-lg" />
                    <p className="text-xs text-primary font-medium mt-2">Toca para cambiar foto</p>
                  </div>
                ) : (
                  <div className="py-2">
                    <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium text-foreground">Tomar Foto Licencia</p>
                    <p className="text-xs text-muted-foreground mt-1">Debe ser legible</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <label className="block text-sm font-medium text-foreground">Documento de Identidad (Cédula/Pasaporte)</label>
              <div className={`border-2 border-dashed ${idPhotoBase64 ? 'border-primary bg-primary/5' : 'border-border'} rounded-xl p-4 text-center relative overflow-hidden`}>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handlePhotoCapture(e, setIdPhotoBase64)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                {idPhotoBase64 ? (
                  <div className="relative">
                    <img src={idPhotoBase64} alt="ID" className="max-h-32 mx-auto rounded-lg" />
                    <p className="text-xs text-primary font-medium mt-2">Toca para cambiar foto</p>
                  </div>
                ) : (
                  <div className="py-2">
                    <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium text-foreground">Tomar Foto ID</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={() => setStep(1)} className="px-4 py-3 border border-border rounded-xl text-foreground font-medium w-1/3">Atrás</button>
              <button
                onClick={() => {
                  if (!driverLicenseNumber || !driverLicenseExpiry || !licenseFrontBase64 || !idPhotoBase64) {
                    alert("Debe completar todos los datos de la licencia y adjuntar ambas fotografías.");
                    return;
                  }
                  setStep(3);
                }}
                className="bg-primary text-primary-foreground font-medium py-3 rounded-xl flex-1"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Firma y Envío */}
        {step === 3 && (
          <div className="glass p-6 rounded-2xl animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-lg font-bold text-foreground mb-4">3. Firma Digital</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Al firmar, usted certifica que los documentos e informaciones provistas son veraces y válidas, en cumplimiento con las regulaciones de renta de vehículos.
            </p>

            <div className="bg-background border border-border rounded-xl overflow-hidden mb-2">
              <SignatureCanvas
                ref={sigPad}
                penColor="black"
                canvasProps={{
                  className: 'w-full h-48 cursor-crosshair touch-none',
                }}
              />
            </div>
            <button
              onClick={() => sigPad.current?.clear()}
              className="text-xs text-primary hover:underline mb-6"
            >
              Limpiar firma
            </button>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="px-4 py-3 border border-border rounded-xl text-foreground font-medium w-1/3">Atrás</button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 rounded-xl flex-1 flex justify-center items-center gap-2"
              >
                {submitting ? 'Procesando...' : (
                  <>
                    <Upload className="w-5 h-5" />
                    Enviar Pre-Check-In
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div className="glass p-8 rounded-2xl text-center animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">¡Pre-Check-In Exitoso!</h2>
            <p className="text-muted-foreground">
              Sus documentos han sido validados temporalmente. Presente su físico original en la sucursal al retirar el vehículo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
