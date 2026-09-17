import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../core/firebase/config';
import { doc, setDoc, collection } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { Building2, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { ThemeToggle } from '../../shared/components/ThemeToggle';

export const RegisterCompany = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const companyName = formData.get('companyName') as string;

    try {
      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Create Company
      const companyRef = doc(collection(db, 'companies'));
      await setDoc(companyRef, {
        name: companyName,
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
      });

      // 3. Create Main Branch
      const branchRef = doc(collection(db, `companies/${companyRef.id}/branches`));
      await setDoc(branchRef, {
        name: 'Sucursal Principal',
        isMain: true,
      });

      // 4. Create User Profile
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        createdAt: new Date().toISOString(),
      });

      // 5. Create Membership
      await setDoc(doc(db, 'memberships', `${user.uid}_${companyRef.id}`), {
        uid: user.uid,
        companyId: companyRef.id,
        roleId: 'company_admin',
        branchIds: [branchRef.id],
      });

      navigate('/');
    } catch (err: any) {
      setError("Ocurrió un error al registrar. Revisa tus datos e intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 sm:p-12 bg-background relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg glass rounded-[2rem] p-8 sm:p-12 shadow-apple z-10"
      >
        <div className="mb-8 text-center">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
            className="w-16 h-16 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-sm mx-auto mb-4"
          >
            <Building2 size={32} />
          </motion.div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">Nueva Empresa</h1>
          <p className="text-muted-foreground text-sm">Crea tu tenant y administra tu flota en minutos.</p>
        </div>

        <motion.form 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          onSubmit={handleRegister} 
          className="space-y-5"
        >
          {error && (
            <motion.div variants={itemVariants} className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm rounded-xl">
              {error}
            </motion.div>
          )}

          <motion.div variants={itemVariants} className="space-y-1">
            <label className="text-sm font-medium text-foreground ml-1">Nombre de la Empresa</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground">
                <Building2 size={18} />
              </div>
              <input
                name="companyName"
                type="text"
                required
                className="w-full pl-11 pr-4 py-3 bg-background/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground placeholder-muted-foreground"
                placeholder="Ej. Rent a Car Express"
              />
            </div>
          </motion.div>
          
          <motion.div variants={itemVariants} className="space-y-1">
            <label className="text-sm font-medium text-foreground ml-1">Correo Electrónico (Administrador)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground">
                <Mail size={18} />
              </div>
              <input
                name="email"
                type="email"
                required
                className="w-full pl-11 pr-4 py-3 bg-background/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground placeholder-muted-foreground"
                placeholder="admin@empresa.com"
              />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-1">
            <label className="text-sm font-medium text-foreground ml-1">Contraseña</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground">
                <Lock size={18} />
              </div>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                className="w-full pl-11 pr-4 py-3 bg-background/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground placeholder-muted-foreground"
                placeholder="••••••••"
              />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-primary text-primary-foreground rounded-xl font-medium shadow-sm hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:hover:scale-100"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Crear Cuenta y Empresa
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </motion.div>
        </motion.form>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center text-sm text-muted-foreground"
        >
          ¿Ya tienes una empresa registrada?{' '}
          <Link to="/login" className="font-semibold text-foreground hover:underline">
            Inicia Sesión
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};
