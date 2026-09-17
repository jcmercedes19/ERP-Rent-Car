import React, { useState, useEffect } from 'react';
import { X, Copy, CreditCard, CheckCircle, Loader2 } from 'lucide-react';
import type { Reservation } from '../../../app/store/useReservationStore';
import { usePaymentStore } from '../../../app/store/usePaymentStore';
import type { PaymentIntent } from '../../../app/store/usePaymentStore';
import { Button } from '../../../shared/components/ui/Button';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, reservation }) => {
  const { createPaymentIntent, listenToPaymentIntent, loading, error } = usePaymentStore();
  const [amount, setAmount] = useState<string>(reservation.totalEstimated.toString());
  const [currency, setCurrency] = useState<string>('DOP');
  const [activeIntent, setActiveIntent] = useState<PaymentIntent | null>(null);
  const [copied, setCopied] = useState(false);

  // Stop listening when intent is approved or component unmounts
  useEffect(() => {
    let unsub: (() => void) | undefined;
    
    if (activeIntent?.id && activeIntent.status !== 'approved') {
      unsub = listenToPaymentIntent(activeIntent.id, (updatedIntent: PaymentIntent) => {
        setActiveIntent(updatedIntent);
      });
    }

    return () => {
      if (unsub) unsub();
    };
  }, [activeIntent?.id, activeIntent?.status, listenToPaymentIntent]);

  if (!isOpen) return null;

  const handleCreateIntent = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert("Por favor ingrese un monto válido.");
      return;
    }

    try {
      const intent = await createPaymentIntent(reservation.id, numAmount, currency);
      setActiveIntent(intent);
    } catch (err: any) {
      alert(err.message || "Error al crear link de pago");
    }
  };

  const copyToClipboard = () => {
    if (activeIntent?.paymentUrl) {
      navigator.clipboard.writeText(activeIntent.paymentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareViaWhatsApp = () => {
    if (activeIntent?.paymentUrl) {
      const text = `Hola, este es tu enlace para realizar el pago de ${activeIntent.currency} ${activeIntent.amount} por tu alquiler: \n${activeIntent.paymentUrl}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-card w-full max-w-md rounded-2xl shadow-apple border border-border overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <CreditCard size={20} className="text-primary" />
            Cobro en Línea (Tarjeta)
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-muted-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {error}
            </div>
          )}

          {!activeIntent ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Genera un enlace de pago seguro para que el cliente pague desde su dispositivo sin que tú toques su tarjeta.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Monto a Cobrar</label>
                <div className="flex gap-2">
                  <select 
                    value={currency} 
                    onChange={e => setCurrency(e.target.value)}
                    className="w-24 px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="DOP">DOP</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <Button onClick={handleCreateIntent} disabled={loading} className="w-full">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
                Generar Enlace de Pago
              </Button>
            </div>
          ) : activeIntent.status === 'approved' ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500">
                <CheckCircle size={32} />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-foreground">¡Pago Aprobado!</h3>
                <p className="text-muted-foreground mt-1">
                  El cliente ha completado el pago de {activeIntent.currency} {activeIntent.amount}.
                  <br />El ingreso ya se ha registrado en tu Cierre de Caja.
                </p>
              </div>
              <Button onClick={onClose} variant="outline" className="w-full mt-4">
                Cerrar
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/20 text-blue-500 mb-2">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Esperando Pago...</h3>
                <p className="text-sm text-muted-foreground">
                  Comparte el enlace con el cliente. Esta pantalla se actualizará automáticamente cuando el pago sea aprobado.
                </p>
              </div>

              <div className="p-3 bg-background border border-border rounded-lg flex items-center justify-between gap-2 overflow-hidden">
                <span className="text-xs text-muted-foreground truncate flex-1 select-all">
                  {activeIntent.paymentUrl}
                </span>
                <button 
                  onClick={copyToClipboard}
                  className="p-2 text-primary hover:bg-primary/10 rounded-md transition-colors flex-shrink-0"
                  title="Copiar enlace"
                >
                  {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                </button>
              </div>

              <div className="flex gap-3">
                <Button onClick={shareViaWhatsApp} className="w-full bg-[#25D366] text-white hover:bg-[#20bd5a]">
                  Enviar por WhatsApp
                </Button>
              </div>
              
              <div className="pt-2 flex justify-center">
                 {/* This button is strictly for mock testing purposes since we can't easily hit webhook via curl without ngrok */}
                 {(activeIntent.gateway === 'mock' || activeIntent.paymentUrl.includes('mock')) && (
                   <a href={activeIntent.paymentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline hover:text-primary/80">
                      Abrir Simulador de Pago
                   </a>
                 )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
