import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../../shared/api/client';
import {
  createCatalogoAdicion,
  deleteCatalogoAdicion,
  fetchCatalogoAdicion,
  updateCatalogoAdicion,
} from '../../shared/api/catalogoApi';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';

export function ToppingFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const esNuevo = !id || id === 'nuevo';
  const toppingId = esNuevo ? null : Number(id);

  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [cargando, setCargando] = useState(!esNuevo);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (esNuevo || toppingId === null || Number.isNaN(toppingId)) {
      setCargando(false);
      return;
    }
    let cancelled = false;
    fetchCatalogoAdicion(toppingId)
      .then((t) => {
        if (cancelled) return;
        setNombre(t.nombre);
        setPrecio(String(t.precio));
        setCargando(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'No se pudo cargar el topping');
        setCargando(false);
      });
    return () => {
      cancelled = true;
    };
  }, [esNuevo, toppingId]);

  const precioNum = Number(precio);
  const puedeGuardar =
    nombre.trim().length > 0 && Number.isFinite(precioNum) && precioNum >= 0 && !guardando;

  async function guardar() {
    if (!puedeGuardar) return;
    setGuardando(true);
    setError('');
    try {
      if (esNuevo) {
        await createCatalogoAdicion({ nombre: nombre.trim(), precio: precioNum });
      } else if (toppingId !== null) {
        await updateCatalogoAdicion(toppingId, {
          nombre: nombre.trim(),
          precio: precioNum,
        });
      }
      navigate('/ajustes/toppings');
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar');
      setGuardando(false);
    }
  }

  async function eliminar() {
    if (toppingId === null) return;
    if (!window.confirm('¿Eliminar este topping?')) return;
    setGuardando(true);
    setError('');
    try {
      await deleteCatalogoAdicion(toppingId);
      navigate('/ajustes/toppings');
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
        <h1>{esNuevo ? 'Nuevo topping' : 'Editar topping'}</h1>
        <Link to="/ajustes/toppings" className="link-action">
          ← Toppings
        </Link>
      </header>

      <section className="stack">
        <Input
          label="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej. Extra queso"
        />
        <Input
          label="Precio"
          inputMode="numeric"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          placeholder="0"
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
