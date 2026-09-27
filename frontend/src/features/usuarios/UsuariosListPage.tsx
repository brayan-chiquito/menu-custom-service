import { Link } from 'react-router-dom';
import { AlertError } from '../../shared/components/AlertError';
import { Button } from '../../shared/components/Button';
import { useUsuarios } from './useUsuarios';

export function UsuariosListPage() {
  const { state, reintentar } = useUsuarios();

  return (
    <main className="page">
      <header className="page-header">
        <h1>Usuarios</h1>
        <Link to="/ajustes" className="link-action">
          ← Ajustes
        </Link>
      </header>

      <Link to="/usuarios/nuevo" className="btn btn-primary btn-block">
        + Nuevo usuario
      </Link>
      <p className="muted">
        Antes de producción crea un segundo admin. Si uno olvida la clave, el otro la cambia
        aquí. La contraseña no se puede ver; solo asignar una nueva.
      </p>

      {state.status === 'loading' ? <p>Cargando…</p> : null}

      {state.status === 'error' ? (
        <>
          <AlertError title="Error" message={state.message} onClose={reintentar} />
          <Button onClick={reintentar}>Reintentar</Button>
        </>
      ) : null}

      {state.status === 'ok' && state.usuarios.length === 0 ? (
        <p className="muted">Sin usuarios</p>
      ) : null}

      {state.status === 'ok' ? (
        <ul className="stack">
          {state.usuarios.map((u) => (
            <li key={u.id} className="line-card">
              <div className="line-card-footer">
                <div>
                  <h2>{u.nombre}</h2>
                  <p className="muted">
                    @{u.usuario} · {u.rol} · {u.activo ? 'Activo' : 'Inactivo'}
                  </p>
                </div>
                <Link to={`/usuarios/${u.id}`} className="link-action">
                  Editar
                </Link>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
