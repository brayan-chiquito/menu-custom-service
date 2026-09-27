import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  actualizarUsuario,
  crearUsuario,
  fetchUsuarios,
  revocarSesiones,
} from '../../shared/api/usuariosApi';
import type { RolUsuario } from '../../shared/api/authTypes';
import { AlertError } from '../../shared/components/AlertError';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import { PasswordInput } from '../../shared/components/PasswordInput';
import {
  mensajeErrorUsuario,
  type ErrorAlertContent,
} from '../../shared/errors/mensajeErrorUsuario';
import {
  PASSWORD_POLICY_HINT,
  validarPasswordPolitica,
} from '../../shared/passwordPolicy';
import { ToggleRow } from '../ajustes/ToggleRow';

export function UsuarioFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const esNuevo = !id || id === 'nuevo';
  const usuarioId = esNuevo ? null : Number(id);

  const [usuario, setUsuario] = useState('');
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState<RolUsuario>('operador');
  const [password, setPassword] = useState('');
  const [activo, setActivo] = useState(true);
  const [cargando, setCargando] = useState(!esNuevo);
  const [guardando, setGuardando] = useState(false);
  const [cerrandoSesiones, setCerrandoSesiones] = useState(false);
  const [errorAlert, setErrorAlert] = useState<ErrorAlertContent | null>(null);

  useEffect(() => {
    if (esNuevo || usuarioId === null || Number.isNaN(usuarioId)) {
      setCargando(false);
      return;
    }
    let cancelled = false;
    setCargando(true);
    fetchUsuarios()
      .then((list) => {
        if (cancelled) return;
        const found = list.find((u) => u.id === usuarioId);
        if (!found) {
          setErrorAlert({
            title: 'Usuario no encontrado',
            message: 'No existe ese usuario.',
          });
          setCargando(false);
          return;
        }
        setUsuario(found.usuario);
        setNombre(found.nombre);
        setRol(found.rol);
        setActivo(found.activo);
        setCargando(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setErrorAlert(mensajeErrorUsuario(err, 'No se pudo cargar el usuario'));
        setCargando(false);
      });
    return () => {
      cancelled = true;
    };
  }, [esNuevo, usuarioId]);

  const passwordError =
    esNuevo || password.trim() !== '' ? validarPasswordPolitica(password) : null;

  const puedeGuardar =
    !guardando &&
    nombre.trim() !== '' &&
    (esNuevo
      ? usuario.trim() !== '' && passwordError === null
      : password.trim() === '' || passwordError === null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!puedeGuardar) return;
    if (passwordError) {
      setErrorAlert({ title: 'Contraseña inválida', message: passwordError });
      return;
    }
    setGuardando(true);
    setErrorAlert(null);
    try {
      if (esNuevo) {
        await crearUsuario({
          usuario: usuario.trim(),
          nombre: nombre.trim(),
          rol,
          password,
        });
      } else if (usuarioId !== null) {
        const body: {
          nombre: string;
          rol: RolUsuario;
          activo: boolean;
          password?: string;
        } = {
          nombre: nombre.trim(),
          rol,
          activo,
        };
        if (password.trim() !== '') {
          body.password = password;
        }
        await actualizarUsuario(usuarioId, body);
      }
      navigate('/usuarios');
    } catch (err: unknown) {
      setErrorAlert(mensajeErrorUsuario(err, 'No se pudo guardar'));
      setGuardando(false);
    }
  }

  async function cerrarSesiones() {
    if (usuarioId === null || cerrandoSesiones) return;
    const ok = window.confirm(
      'Se cerrarán todas las sesiones de este usuario. Tendrá que volver a entrar.',
    );
    if (!ok) return;
    setCerrandoSesiones(true);
    setErrorAlert(null);
    try {
      await revocarSesiones(usuarioId);
      setErrorAlert(null);
    } catch (err: unknown) {
      setErrorAlert(mensajeErrorUsuario(err, 'No se pudieron cerrar las sesiones'));
    } finally {
      setCerrandoSesiones(false);
    }
  }

  if (cargando) {
    return (
      <main className="page">
        <p>Cargando…</p>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="page-header">
        <h1>{esNuevo ? 'Nuevo usuario' : 'Editar usuario'}</h1>
        <Link to="/usuarios" className="link-action">
          ← Usuarios
        </Link>
      </header>

      {errorAlert ? (
        <AlertError
          title={errorAlert.title}
          message={errorAlert.message}
          onClose={() => setErrorAlert(null)}
        />
      ) : null}

      <form className="stack" onSubmit={(e) => void onSubmit(e)}>
        {esNuevo ? (
          <Input
            label="Usuario"
            name="usuario"
            autoComplete="off"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            required
          />
        ) : (
          <p className="muted">@{usuario}</p>
        )}

        <Input
          label="Nombre"
          name="nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />

        <label className="field">
          <span className="field-label">Rol</span>
          <select
            className="field-input"
            value={rol}
            onChange={(e) => setRol(e.target.value as RolUsuario)}
          >
            <option value="operador">Operador</option>
            <option value="admin">Admin</option>
          </select>
        </label>

        <PasswordInput
          label={esNuevo ? 'Contraseña' : 'Nueva contraseña (opcional)'}
          name="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required={esNuevo}
        />
        <p className="muted">{PASSWORD_POLICY_HINT}</p>
        {!esNuevo ? (
          <p className="muted">
            No se puede ver la contraseña actual. Escribe una nueva para reemplazarla; al
            guardarla se cierran las sesiones de este usuario.
          </p>
        ) : null}
        {passwordError && (esNuevo || password.trim() !== '') ? (
          <p className="error">{passwordError}</p>
        ) : null}

        {!esNuevo ? (
          <ToggleRow label="Activo" checked={activo} onChange={setActivo} />
        ) : null}

        {!esNuevo ? (
          <Button
            type="button"
            variant="secondary"
            disabled={cerrandoSesiones}
            onClick={() => void cerrarSesiones()}
          >
            {cerrandoSesiones ? 'Cerrando…' : 'Cerrar sesiones'}
          </Button>
        ) : null}

        <Button type="submit" disabled={!puedeGuardar}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </Button>
      </form>
    </main>
  );
}
