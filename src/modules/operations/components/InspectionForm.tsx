import { useState, useRef } from "react";
import { GlassModal } from "../../../shared/components/ui/GlassModal";
import { Button } from "../../../shared/components/ui/Button";
import { Input } from "../../../shared/components/ui/Input";
import { Car, Fuel, Activity, ClipboardCheck, AlertTriangle } from "lucide-react";
import SignatureCanvas from 'react-signature-canvas';

interface InspectionFormProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: any;
  vehicle: any;
  type: 'CHECK_IN' | 'CHECK_OUT';
  onComplete: (data: any) => void;
}

const CHECKLIST_ITEMS = [
  { id: 'spare_tire', label: 'Goma de Repuesto' },
  { id: 'jack', label: 'Gato Hidráulico y Llave' },
  { id: 'mats', label: 'Alfombras Completas' },
  { id: 'documents', label: 'Matrícula y Seguro' },
  { id: 'ac', label: 'Aire Acondicionado' },
  { id: 'lights', label: 'Luces (Frenos, Direccionales, Altas)' },
  { id: 'cleanliness', label: 'Lavado / Limpieza' },
];

export const InspectionForm = ({ isOpen, onClose, reservation, vehicle, type, onComplete }: InspectionFormProps) => {
  const sigPad = useRef<SignatureCanvas>(null);

  const [formData, setFormData] = useState({
    fuelLevel: "8/8", // Full
    mileage: vehicle?.mileage || 0,
    checklist: {} as Record<string, boolean>,
    damages: [] as string[],
    damageNotes: "",
    signature: null as string | null
  });

  const handleToggleChecklist = (id: string) => {
    setFormData(prev => ({
      ...prev,
      checklist: { ...prev.checklist, [id]: !prev.checklist[id] }
    }));
  };

  const handleToggleDamage = (zone: string) => {
    setFormData(prev => ({
      ...prev,
      damages: prev.damages.includes(zone)
        ? prev.damages.filter(z => z !== zone)
        : [...prev.damages, zone]
    }));
  };

  const clearSignature = () => {
    sigPad.current?.clear();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sigPad.current?.isEmpty()) {
      alert("La firma es requerida para este proceso.");
      return;
    }
    
    const signatureData = sigPad.current?.getTrimmedCanvas().toDataURL('image/png');
    
    onComplete({ 
      ...formData, 
      type, 
      signature: signatureData,
      timestamp: new Date().toISOString() 
    });
    onClose();
  };

  if (!reservation || !vehicle) return null;

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title={`Inspección de ${type === 'CHECK_OUT' ? 'Entrega' : 'Recepción'}`} width="xl">
      <div className="mb-6 p-4 rounded-xl bg-secondary/50 flex items-start gap-4">
        <div className="p-3 bg-primary/10 text-primary rounded-lg">
          <Car size={24} />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{vehicle.brand} {vehicle.model} - {vehicle.plate}</h3>
          <p className="text-sm text-muted-foreground">Reserva: {reservation.id.slice(0,8)}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Combustible y Kilometraje */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground ml-1">Nivel de Combustible</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground"><Fuel size={18} /></div>
              <select value={formData.fuelLevel} onChange={e => setFormData({...formData, fuelLevel: e.target.value})} className="flex h-11 w-full rounded-xl border border-border bg-background/50 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all pl-11">
                <option value="8/8">Lleno (8/8)</option>
                <option value="7/8">7/8</option>
                <option value="6/8">3/4 (6/8)</option>
                <option value="4/8">Medio (4/8)</option>
                <option value="2/8">1/4 (2/8)</option>
                <option value="1/8">Reserva</option>
              </select>
            </div>
          </div>
          <Input 
            label="Kilometraje Actual" 
            type="number" 
            value={formData.mileage} 
            onChange={e => setFormData({...formData, mileage: Number(e.target.value)})} 
            icon={<Activity size={18} />} 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Checklist */}
          <div className="space-y-3">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <ClipboardCheck size={18} /> Checklist Obligatorio
            </h4>
            <div className="glass p-4 rounded-xl space-y-3">
              {CHECKLIST_ITEMS.map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id={item.id} 
                    checked={!!formData.checklist[item.id]} 
                    onChange={() => handleToggleChecklist(item.id)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                  <label htmlFor={item.id} className="text-sm text-muted-foreground cursor-pointer select-none">
                    {item.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Mapa de Daños */}
          <div className="space-y-3">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <AlertTriangle size={18} /> Diagrama de Daños
            </h4>
            <div className="glass p-4 rounded-xl space-y-4">
              <p className="text-xs text-muted-foreground">Haz clic en las zonas donde el vehículo presenta rayones o golpes (nuevo o pre-existente).</p>
              
              <div className="grid grid-cols-3 gap-2">
                {/* Visual representation of a car top-down */}
                <div></div>
                <div 
                  onClick={() => handleToggleDamage('FRONT')}
                  className={`p-2 border rounded-t-xl text-center text-xs font-medium cursor-pointer transition-colors ${formData.damages.includes('FRONT') ? 'bg-rose-500/20 text-rose-500 border-rose-500' : 'bg-background/50 border-border text-muted-foreground'}`}>
                  Frente
                </div>
                <div></div>
                
                <div 
                  onClick={() => handleToggleDamage('LEFT')}
                  className={`p-4 border rounded-l-xl flex items-center justify-center text-xs font-medium cursor-pointer transition-colors ${formData.damages.includes('LEFT') ? 'bg-rose-500/20 text-rose-500 border-rose-500' : 'bg-background/50 border-border text-muted-foreground'}`}>
                  Izq
                </div>
                <div 
                  onClick={() => handleToggleDamage('ROOF')}
                  className={`p-4 border rounded-sm flex items-center justify-center text-xs font-medium cursor-pointer transition-colors ${formData.damages.includes('ROOF') ? 'bg-rose-500/20 text-rose-500 border-rose-500' : 'bg-background/50 border-border text-muted-foreground'}`}>
                  Techo
                </div>
                <div 
                  onClick={() => handleToggleDamage('RIGHT')}
                  className={`p-4 border rounded-r-xl flex items-center justify-center text-xs font-medium cursor-pointer transition-colors ${formData.damages.includes('RIGHT') ? 'bg-rose-500/20 text-rose-500 border-rose-500' : 'bg-background/50 border-border text-muted-foreground'}`}>
                  Der
                </div>

                <div></div>
                <div 
                  onClick={() => handleToggleDamage('REAR')}
                  className={`p-2 border rounded-b-xl text-center text-xs font-medium cursor-pointer transition-colors ${formData.damages.includes('REAR') ? 'bg-rose-500/20 text-rose-500 border-rose-500' : 'bg-background/50 border-border text-muted-foreground'}`}>
                  Trasero
                </div>
                <div></div>
              </div>

              {formData.damages.length > 0 && (
                <textarea 
                  placeholder="Describe los daños seleccionados detalladamente..."
                  required
                  value={formData.damageNotes}
                  onChange={e => setFormData({...formData, damageNotes: e.target.value})}
                  className="flex min-h-[60px] w-full rounded-xl border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 transition-all text-rose-600 placeholder:text-rose-400/70 mt-2"
                />
              )}
            </div>
          </div>
        </div>

        {/* Firma Digital */}
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <h4 className="font-medium text-foreground">Firma Digital ({type === 'CHECK_OUT' ? 'Cliente aceptando condiciones' : 'Cliente entregando vehículo'})</h4>
            <button type="button" onClick={clearSignature} className="text-xs text-primary hover:underline">Limpiar firma</button>
          </div>
          <div className="glass rounded-xl border border-border p-1 bg-background overflow-hidden">
            <SignatureCanvas 
              ref={sigPad} 
              penColor="currentColor"
              canvasProps={{className: 'w-full h-32 text-foreground cursor-crosshair'}} 
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-border mt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit">
            {type === 'CHECK_OUT' ? 'Autorizar Salida (Despachar)' : 'Confirmar Recepción'}
          </Button>
        </div>
      </form>
    </GlassModal>
  );
};
