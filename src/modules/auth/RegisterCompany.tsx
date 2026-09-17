import React from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../core/firebase/config';
import { doc, setDoc, collection } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';

export const RegisterCompany: React.FC = () => {
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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

      // 5. Create Membership (Role: Company Administrator)
      await setDoc(doc(db, 'memberships', `${user.uid}_${companyRef.id}`), {
        uid: user.uid,
        companyId: companyRef.id,
        roleId: 'company_admin',
        branchIds: [branchRef.id],
      });

      navigate('/');
    } catch (error: any) {
      alert("Error al registrar: " + error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Registrar Empresa
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div className="rounded-md shadow-sm -space-y-px">
             <div>
              <label className="sr-only">Nombre de Empresa</label>
              <input
                name="companyName"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Nombre de la Empresa"
              />
            </div>
            <div>
              <label className="sr-only">Email Administrador</label>
              <input
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label className="sr-only">Contraseña</label>
              <input
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Registrar
            </button>
          </div>
          <div className="text-center text-sm">
            <Link to="/login" className="font-medium text-gray-600 hover:text-gray-900">Volver al Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
};
