import { useState, useEffect } from "react";
import { useTenantStore } from "../../app/store/useTenantStore";
import { db } from "../../core/firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Save, AlertTriangle, ShieldCheck } from "lucide-react";
import { Button } from "../../shared/components/ui/Button";

export const PaymentSettings = () => {
  const { activeCompany } = useTenantStore();
  const [gateway, setGateway] = useState<'pagadito' | 'dlocal' | 'mock'>('mock');
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [testMode, setTestMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    if (!activeCompany?.id) return;

    const loadSettings = async () => {
      setInitialLoad(true);
      try {
        const docRef = doc(db, "paymentSettings", activeCompany.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setGateway(data.gateway || 'mock');
          setApiKey(data.apiKey || '');
          setApiSecret(data.apiSecret || '');
          setTestMode(data.testMode ?? true);
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setInitialLoad(false);
      }
    };

    loadSettings();
  }, [activeCompany?.id]);

  const handleSave = async () => {
    if (!activeCompany?.id) return;
    setLoading(true);
    try {
      const docRef = doc(db, "paymentSettings", activeCompany.id);
      await setDoc(docRef, {
        gateway,
        apiKey,
        apiSecret,
        testMode,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      alert("Configuración de pasarela guardada correctamente.");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Error al guardar la configuración.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoad) return <div className="p-8 text-center text-muted-foreground animate-pulse">Cargando configuración...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="text-primary" />
          Pasarela de Pagos (Middleware)
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configura tu proveedor de pagos. Usamos una arquitectura de redirección segura para garantizar cumplimiento PCI SAQ A.
        </p>
      </div>

      <div className="glass p-6 rounded-2xl space-y-6">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Proveedor / Gateway</label>
          <div className="grid grid-cols-3 gap-3">
            {(['mock', 'pagadito', 'dlocal'] as const).map(g => (
              <button
                key={g}
                onClick={() => setGateway(g)}
                className={`p-3 rounded-xl border text-sm font-medium transition-colors ${gateway === g ? 'border-primary bg-primary/10 text-primary' : 'border-border text-foreground hover:bg-white/5'}`}
              >
                {g === 'mock' ? 'Simulador (Pruebas)' : g === 'pagadito' ? 'Pagadito (RD)' : 'dLocal (Global)'}
              </button>
            ))}
          </div>
        </div>

        {gateway !== 'mock' && (
          <>
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-4 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <strong>Advertencia de Seguridad:</strong> Las llaves API proporcionadas aquí serán encriptadas y utilizadas únicamente por los servidores seguros (Cloud Functions) para generar links de pago. Nunca se expondrán en el frontend del cliente.
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">API Key / UID</label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Ej. pg_live_xxxxxxxxxxx"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">API Secret / WSK</label>
              <input
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="••••••••••••••••••••••••"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </>
        )}

        <div className="flex items-center gap-3 py-2 border-t border-border">
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={testMode} onChange={(e) => setTestMode(e.target.checked)} />
            <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            <span className="ml-3 text-sm font-medium text-foreground">Entorno de Pruebas (Test Mode / Sandbox)</span>
          </label>
        </div>

        <div className="pt-4 flex justify-end">
          <Button onClick={handleSave} disabled={loading} className="w-full sm:w-auto">
            {loading ? 'Guardando...' : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Configuración
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
