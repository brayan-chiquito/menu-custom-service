import { type FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { login } from '../../shared/api/authApi';
import { AlertError } from '../../shared/components/AlertError';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import { PasswordInput } from '../../shared/components/PasswordInput';
import {
  mensajeErrorUsuario,
  type ErrorAlertContent,
} from '../../shared/errors/mensajeErrorUsuario';
import { useAuthStore } from './authStore';

export function LoginPage() {
  const navigate = useNavigate();
  const status = useAuthStore((s) => s.status);
  const sessionUsuario = useAuthStore((s) => s.usuario);
  const guardarSesion = useAuthStore((s) => s.setUsuario);

  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorAlert, setErrorAlert] = useState<ErrorAlertContent | null>(null);

  if (status === 'checking') {
    return (
      <main className="page">
        <p>Cargando…</p>
      </main>
    );
  }

  if (sessionUsuario) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setErrorAlert(null);
    try {
      const res = await login(usuario.trim(), password);
      guardarSesion(res.usuario);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      setErrorAlert(mensajeErrorUsuario(err, 'No se pudo iniciar sesión'));
      setEnviando(false);
    }
  }

  return (
    <main className="page">
      <header className="page-header">
        <h1>Platanópolis</h1>
      </header>

      {errorAlert ? (
        <AlertError
          title={errorAlert.title}
          message={errorAlert.message}
          onClose={() => setErrorAlert(null)}
        />
      ) : null}

      <form className="stack" onSubmit={(e) => void onSubmit(e)}>
        <Input
          label="Usuario"
          name="usuario"
          autoComplete="username"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          required
        />
        <PasswordInput
          label="Contraseña"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" disabled={enviando || !usuario.trim() || !password}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </main>
  );
}
