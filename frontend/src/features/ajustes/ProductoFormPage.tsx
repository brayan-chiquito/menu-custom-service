import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../../shared/api/client';
import {
  createCatalogoProducto,
  deleteCatalogoProducto,
  fetchCatalogoProducto,
  updateCatalogoProducto,
} from '../../shared/api/catalogoApi';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import { ToggleRow } from './ToggleRow';
import { canSaveProducto, resolveRequiereProteina } from './productoForm.rules';

type Categoria = 'platos' | 'bebidas';

export function ProductoFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const esNuevo = !id || id === 'nuevo';
  const productoId = esNuevo ? null : Number(id);

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [categoria, setCategoria] = useState<Categoria>('platos');
  const [disponible, setDisponible] = useState(true);
  const [requiereProteina, setRequiereProteina] = useState(true);
  const [cargando, setCargando] = useState(!esNuevo);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (esNuevo || productoId === null || Number.isNaN(productoId)) {
      setCargando(false);
      return;
    }
    let cancelled = false;
    setCargando(true);
    fetchCatalogoProducto(productoId)
      .then((p) => {
        if (cancelled) return;
        setNombre(p.nombre);
        setDescripcion(p.descripcion);
        setPrecio(String(p.precio));
        setCategoria(p.categoria === 'bebidas' ? 'bebidas' : 'platos');
        setDisponible(p.disponible);
        setRequiereProteina(p.requiere_proteina);
        setCargando(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'No se pudo cargar el producto');
        setCargando(false);
      });
    return () => {
      cancelled = true;
    };
  }, [esNuevo, productoId]);

  const precioNum = Number(precio);
  const puedeGuardar = canSaveProducto({
    nombre,
    precio: precioNum,
    guardando,
  });

  async function guardar() {
    if (!puedeGuardar) return;
    setGuardando(true);
    setError('');
    const body = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      precio: precioNum,
      categoria,
      disponible,
      requiere_proteina: resolveRequiereProteina(categoria, requiereProteina),
    };
    try {
      if (esNuevo) {
        await createCatalogoProducto(body);
      } else if (productoId !== null) {
        await updateCatalogoProducto(productoId, body);
      }
      navigate('/ajustes/productos');
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar');
      setGuardando(false);
    }
  }

  async function eliminar() {
    if (productoId === null) return;
    if (!window.confirm('¿Eliminar este producto?')) return;
    setGuardando(true);
    setError('');
    try {
      await deleteCatalogoProducto(productoId);
      navigate('/ajustes/productos');
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
        <h1>{esNuevo ? 'Nuevo producto' : 'Editar producto'}</h1>
        <Link to="/ajustes/productos" className="link-action">
          ← Productos
        </Link>
      </header>

      <section className="stack">
        <Input
          label="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej. Candente"
        />
        <Input
          label="Descripción"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Opcional"
        />
        <Input
          label="Precio"
          inputMode="numeric"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          placeholder="0"
        />

        <fieldset className="chip-fieldset">
          <legend className="field-label">Categoría</legend>
          <div className="chip-row">
            <button
              type="button"
              className={`chip ${categoria === 'platos' ? 'chip-active' : ''}`}
              onClick={() => setCategoria('platos')}
            >
              Platos
            </button>
            <button
              type="button"
              className={`chip ${categoria === 'bebidas' ? 'chip-active' : ''}`}
              onClick={() => {
                setCategoria('bebidas');
                setRequiereProteina(false);
              }}
            >
              Bebidas
            </button>
          </div>
        </fieldset>

        <ToggleRow label="Disponible" checked={disponible} onChange={setDisponible} />
        <ToggleRow
          label="Requiere proteína"
          checked={categoria === 'bebidas' ? false : requiereProteina}
          onChange={setRequiereProteina}
          disabled={categoria === 'bebidas'}
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
