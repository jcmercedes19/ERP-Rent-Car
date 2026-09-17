import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { auth } from './core/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { useAuthStore } from './app/store/useAuthStore';

function App() {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  return <RouterProvider router={router} />;
}

export default App;
