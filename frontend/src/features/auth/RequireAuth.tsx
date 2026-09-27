import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './authStore';

export function RequireAuth() {
  const status = useAuthStore((s) => s.status);
  const usuario = useAuthStore((s) => s.usuario);
  if (status === 'checking') {
    return (
      <main className="page">
        <p>Cargando…</p>
      </main>
    );
  }
  if (status !== 'in' || !usuario) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

export function RequireAdmin() {
  const usuario = useAuthStore((s) => s.usuario);
  if (!usuario || usuario.rol !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
