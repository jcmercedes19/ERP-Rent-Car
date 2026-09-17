import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../core/firebase/config';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CarFront, ArrowRight, Loader2 } from 'lucide-react';
import { ThemeToggle } from '../../shared/components/ThemeToggle';

export const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      setError("Credenciales incorrectas o error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-background relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Left Column - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex items-center gap-3 text-foreground"
        >
          <div className="w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-apple">
            <CarFront size={24} />
          </div>
          <span className="text-2xl font-bold tracking-tight">RentCar ERP</span>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="max-w-md"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-foreground leading-tight">
            Gestión Inteligente de Flotas
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Controla tus vehículos, reservaciones y sucursales desde una única plataforma diseñada para la eficiencia.
          </p>
        </motion.div>
        
        <div className="text-sm text-muted-foreground font-medium">
          &copy; {new Date().getFullYear()} RentCar Solutions. Todos los derechos reservados.
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md glass rounded-3xl p-8 sm:p-10 shadow-apple"
        >
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-sm">
              <CarFront size={24} />
            </div>
            <span className="text-2xl font-bold text-foreground tracking-tight">RentCar ERP</span>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-2">Bienvenido de nuevo</h2>
          <p className="text-muted-foreground text-sm mb-8">
            Ingresa tus credenciales para acceder al dashboard.
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm rounded-xl"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground ml-1">Correo electrónico</label>
              <input
                name="email"
                type="email"
                required
                className="w-full px-4 py-3 bg-background/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground placeholder-muted-foreground"
                placeholder="ejemplo@empresa.com"
              />
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-medium text-foreground">Contraseña</label>
                <a href="#" className="text-xs font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">¿Olvidaste tu contraseña?</a>
              </div>
              <input
                name="password"
                type="password"
                required
                className="w-full px-4 py-3 bg-background/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground placeholder-muted-foreground"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary text-primary-foreground rounded-xl font-medium shadow-sm hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:hover:scale-100"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Iniciar sesión
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            ¿No tienes una cuenta empresarial?{' '}
            <Link to="/register" className="font-semibold text-foreground hover:underline">
              Registrar Empresa
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
