import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useVehicleStore, Vehicle } from "../../app/store/useVehicleStore";
import { useReservationStore } from "../../app/store/useReservationStore";
import { Button } from "../../shared/components/ui/Button";
import { Input } from "../../shared/components/ui/Input";
import { GlassModal } from "../../shared/components/ui/GlassModal";
import { Search, Calendar, Car, Tag, ChevronRight, Info, CheckCircle } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../core/firebase/config";

export const BookingPortal = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const { vehicles, fetchVehicles, loading: vehiclesLoading } = useVehicleStore();
  const { createPublicReservation } = useReservationStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  
  // Booking Form State
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (companyId) {
      fetchVehicles(companyId);
    }
  }, [companyId, fetchVehicles]);

  const availableVehicles = useMemo(() => {
    return vehicles.filter(v => {
      // Solo mostrar vehículos disponibles
      if (v.status !== 'AVAILABLE') return false;
      
      const matchesSearch = `${v.brand} ${v.model}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "ALL" || v.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [vehicles, searchTerm, selectedCategory]);

  const categories = ["ALL", ...Array.from(new Set(vehicles.map(v => v.category)))];

  const handleExtraToggle = (extraId: string) => {
    setSelectedExtras(prev => 
      prev.includes(extraId) 
        ? prev.filter(id => id !== extraId)
        : [...prev, extraId]
    );
  };

  const calculateTotals = () => {
    if (!selectedVehicle || !startDate || !endDate) return { days: 0, subtotal: 0, tax: 0, total: 0 };
    
    const days = Math.max(1, differenceInDays(parseISO(endDate), parseISO(startDate)));
    
    // Extras
    let extrasCostPerDay = 0;
    if (selectedExtras.includes('BABY_SEAT')) extrasCostPerDay += 10;
    if (selectedExtras.includes('GPS')) extrasCostPerDay += 5;
    if (selectedExtras.includes('PREMIUM_INSURANCE')) extrasCostPerDay += 25;
    
    const baseRent = selectedVehicle.dailyRate * days;
    const extrasTotal = extrasCostPerDay * days;
    const subtotal = baseRent + extrasTotal;
    
    const tax = subtotal * 0.18; // 18% ITBIS
    const total = subtotal + tax;

    return { days, subtotal, tax, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !selectedVehicle) return;
    
    setSubmitting(true);
    try {
      // 1. Create a guest customer record to associate the reservation
      const customerRef = await addDoc(collection(db, 'customers'), {
        companyId,
        firstName: guestName.split(' ')[0] || '',
        lastName: guestName.split(' ').slice(1).join(' ') || '',
        email: guestEmail,
        phone: guestPhone,
        type: 'INDIVIDUAL',
        status: 'ACTIVE',
        createdAt: serverTimestamp()
      });

      // 2. Create the reservation
      const { subtotal, tax, total } = calculateTotals();
      
      // Basic deposit rule based on category (simplified for portal)
      let deposit = 200;
      if (selectedVehicle.category === 'LUXURY' || selectedVehicle.category === 'SUV') {
        deposit = 500;
      }

      await createPublicReservation({
        companyId,
        customerId: customerRef.id,
        vehicleId: selectedVehicle.id,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        status: 'PENDING_APPROVAL',
        extras: selectedExtras,
        subtotal,
        tax,
        deposit,
        totalEstimated: total,
        notes: "Reserva generada desde Portal Público"
      });

      setSuccess(true);
      setSelectedVehicle(null);
    } catch (error) {
      console.error(error);
      alert("Hubo un error al procesar tu solicitud. Por favor intenta más tarde.");
    } finally {
      setSubmitting(false);
    }
  };

  if (vehiclesLoading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  if (success) {
    return (
      <div className="glass p-10 rounded-3xl max-w-2xl mx-auto text-center shadow-apple mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} />
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-4">¡Solicitud Recibida!</h2>
        <p className="text-muted-foreground text-lg mb-8">
          Hemos recibido tu solicitud de reserva. Un agente revisará los detalles y te contactará pronto al correo <b>{guestEmail}</b> para confirmar la disponibilidad y proceder con el pago.
        </p>
        <Button onClick={() => setSuccess(false)} size="lg" className="w-full sm:w-auto">
          Volver al Catálogo
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Section */}
      <div className="text-center max-w-2xl mx-auto py-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight mb-4">
          Encuentra tu auto ideal
        </h1>
        <p className="text-lg text-muted-foreground">
          Flota moderna, limpia y lista para tu próximo viaje. Reserva en minutos.
        </p>
      </div>

      {/* Filters */}
      <div className="glass p-4 rounded-2xl shadow-apple flex flex-col md:flex-row gap-4 sticky top-20 z-40 backdrop-blur-xl bg-card/80">
        <div className="flex-1 flex items-center bg-background/50 rounded-xl px-4 py-2 border border-border">
          <Search className="text-muted-foreground mr-2" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por marca o modelo..." 
            className="bg-transparent border-none outline-none w-full text-foreground"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat 
                  ? 'bg-primary text-primary-foreground shadow-md' 
                  : 'bg-background/50 text-muted-foreground border border-border hover:bg-secondary'
              }`}
            >
              {cat === 'ALL' ? 'Todos' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Vehicle Grid */}
      {availableVehicles.length === 0 ? (
        <div className="text-center py-20">
          <Car size={48} className="mx-auto text-muted-foreground opacity-20 mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No hay vehículos disponibles</h3>
          <p className="text-muted-foreground">Intenta cambiar los filtros de búsqueda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {availableVehicles.map(vehicle => (
            <div key={vehicle.id} className="glass rounded-2xl overflow-hidden shadow-apple hover:shadow-lg transition-all group flex flex-col">
              <div className="aspect-[4/3] bg-secondary/50 relative overflow-hidden flex items-center justify-center p-6">
                {/* Placeholder car image since we don't have real images uploaded yet */}
                <Car size={80} className="text-primary/20 group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-foreground border border-border">
                  {vehicle.category}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-xl text-foreground mb-1">{vehicle.brand} {vehicle.model}</h3>
                <p className="text-sm text-muted-foreground mb-4">{vehicle.year} • Automático • 5 Pasajeros</p>
                
                <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Por Día</p>
                    <p className="text-2xl font-bold text-primary">${vehicle.dailyRate}</p>
                  </div>
                  <Button onClick={() => setSelectedVehicle(vehicle)} className="rounded-xl px-5">
                    Reservar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {selectedVehicle && (
        <GlassModal 
          isOpen={!!selectedVehicle} 
          onClose={() => setSelectedVehicle(null)} 
          title="Solicitud de Reserva" 
          width="xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Form Column */}
            <div>
              <form id="booking-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Fechas de Viaje</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Input 
                      label="Recogida" 
                      type="date" 
                      required 
                      value={startDate} 
                      onChange={e => setStartDate(e.target.value)} 
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <Input 
                      label="Devolución" 
                      type="date" 
                      required 
                      value={endDate} 
                      onChange={e => setEndDate(e.target.value)} 
                      min={startDate || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Tus Datos</h4>
                  <div className="space-y-3">
                    <Input 
                      label="Nombre Completo" 
                      required 
                      value={guestName} 
                      onChange={e => setGuestName(e.target.value)} 
                      placeholder="Ej. Juan Pérez"
                    />
                    <Input 
                      label="Correo Electrónico" 
                      type="email" 
                      required 
                      value={guestEmail} 
                      onChange={e => setGuestEmail(e.target.value)} 
                      placeholder="correo@ejemplo.com"
                    />
                    <Input 
                      label="Teléfono" 
                      type="tel" 
                      required 
                      value={guestPhone} 
                      onChange={e => setGuestPhone(e.target.value)} 
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Servicios Adicionales (Opcional)</h4>
                  <div className="space-y-2">
                    {[
                      { id: 'BABY_SEAT', name: 'Silla de Bebé', price: 10 },
                      { id: 'GPS', name: 'Navegador GPS', price: 5 },
                      { id: 'PREMIUM_INSURANCE', name: 'Seguro Premium (Cobertura Total)', price: 25 },
                    ].map(extra => (
                      <label key={extra.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-background/50 hover:bg-secondary/50 cursor-pointer transition-colors">
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary/50"
                            checked={selectedExtras.includes(extra.id)}
                            onChange={() => handleExtraToggle(extra.id)}
                          />
                          <span className="text-sm font-medium text-foreground">{extra.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">+${extra.price}/día</span>
                      </label>
                    ))}
                  </div>
                </div>
              </form>
            </div>

            {/* Summary Column */}
            <div className="bg-secondary/30 p-6 rounded-2xl border border-border h-fit sticky top-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-background rounded-xl flex items-center justify-center shadow-sm">
                  <Car size={32} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">{selectedVehicle.brand} {selectedVehicle.model}</h3>
                  <p className="text-sm text-muted-foreground">{selectedVehicle.year} • {selectedVehicle.category}</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tarifa diaria</span>
                  <span className="font-medium text-foreground">${selectedVehicle.dailyRate}</span>
                </div>
                
                {startDate && endDate && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Días de renta</span>
                      <span className="font-medium text-foreground">{calculateTotals().days} días</span>
                    </div>
                    {selectedExtras.length > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Extras</span>
                        <span className="font-medium text-foreground">Inluidos</span>
                      </div>
                    )}
                    <div className="border-t border-border/50 pt-3 flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium text-foreground">${calculateTotals().subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Impuestos (18%)</span>
                      <span className="font-medium text-foreground">${calculateTotals().tax.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-border pt-3 flex justify-between items-center">
                      <span className="font-semibold text-foreground">Total Estimado</span>
                      <span className="text-2xl font-bold text-primary">${calculateTotals().total.toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="bg-blue-500/10 p-3 rounded-xl flex gap-3 mb-6">
                <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Esto es una solicitud. No se realizará ningún cobro a tu tarjeta en este momento. Un agente te contactará para confirmar.
                </p>
              </div>

              <Button 
                type="submit" 
                form="booking-form"
                className="w-full flex justify-center items-center gap-2"
                size="lg"
                disabled={!startDate || !endDate || !guestName || !guestEmail || !guestPhone || submitting}
              >
                {submitting ? "Procesando..." : "Solicitar Reserva"}
                {!submitting && <ChevronRight size={18} />}
              </Button>
            </div>
          </div>
        </GlassModal>
      )}
    </div>
  );
};
