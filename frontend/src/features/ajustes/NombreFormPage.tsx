import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../../shared/api/client';
import {
  createCatalogoNombre,
  deleteCatalogoNombre,
  fetchCatalogoNombre,
  updateCatalogoNombre,
} from '../../shared/api/catalogoApi';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';

type Recurso = 'bases' | 'salsas' | 'proteinas';

const META: Record<
  Recurso,
  { tituloNuevo: string; tituloEditar: string; listaLabel: string; confirm: string }
> = {
  bases: {
    tituloNuevo: 'Nueva base',
    tituloEditar: 'Editar base',
    listaLabel: 'Bases',
    confirm: '¿Eliminar esta base?',
  },
  salsas: {
    tituloNuevo: 'Nueva salsa',
    tituloEditar: 'Editar salsa',
    listaLabel: 'Salsas',
    confirm: '¿Eliminar esta salsa?',
  },
  proteinas: {
    tituloNuevo: 'Nueva proteína',
    tituloEditar: 'Editar proteína',
    listaLabel: 'Proteínas',
    confirm: '¿Eliminar esta proteína?',
  },
};

type Props = {
  recurso: Recurso;
};

export function NombreFormPage({ recurso }: Props) {
  const { id } = useParams();
  const navigate = useNavigate();
  const meta = META[recurso];
  const esNuevo = !id || id === 'nuevo';
  const itemId = esNuevo ? null : Number(id);

  const [nombre, setNombre] = useState('');
  const [cargando, setCargando] = useState(!esNuevo);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (esNuevo || itemId === null || Number.isNaN(itemId)) {
      setCargando(false);
      return;
    }
    let cancelled = false;
    fetchCatalogoNombre(recurso, itemId)
      .then((item) => {
        if (cancelled) return;
        setNombre(item.nombre);
        setCargando(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'No se pudo cargar');
        setCargando(false);
      });
    return () => {
      cancelled = true;
    };
  }, [esNuevo, itemId, recurso]);

  const puedeGuardar = nombre.trim().length > 0 && !guardando;

  async function guardar() {
    if (!puedeGuardar) return;
    setGuardando(true);
    setError('');
    try {
      if (esNuevo) {
        await createCatalogoNombre(recurso, { nombre: nombre.trim() });
      } else if (itemId !== null) {
        await updateCatalogoNombre(recurso, itemId, { nombre: nombre.trim() });
      }
      navigate(`/ajustes/${recurso}`);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar');
      setGuardando(false);
    }
  }

  async function eliminar() {
    if (itemId === null) return;
    if (!window.confirm(meta.confirm)) return;
    setGuardando(true);
    setError('');
    try {
      await deleteCatalogoNombre(recurso, itemId);
      navigate(`/ajustes/${recurso}`);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'No se pudo eliminar');
      setGuardando(false);
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
        <h1>{esNuevo ? meta.tituloNuevo : meta.tituloEditar}</h1>
        <Link to={`/ajustes/${recurso}`} className="link-action">
          ← {meta.listaLabel}
        </Link>
      </header>

      <section className="stack">
        <Input
          label="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre"
        />
        {error ? <p className="error">{error}</p> : null}
        <Button disabled={!puedeGuardar} onClick={() => void guardar()}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </Button>
        {!esNuevo ? (
          <Button variant="secondary" disabled={guardando} onClick={() => void eliminar()}>
            Eliminar
          </Button>
        ) : null}
      </section>
    </main>
  );
}
