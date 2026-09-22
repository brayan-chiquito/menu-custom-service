import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fetchMenu } from '../../shared/api/menuApi';
import { actualizarPedido, fetchPedidoById } from '../../shared/api/pedidosApi';
import type {
  CartAdicion,
  CrearPedidoItemPayload,
  MenuResponse,
  PedidoDetalleLinea,
  Producto,
} from '../../shared/api/types';
import { AlertError } from '../../shared/components/AlertError';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import {
  mensajeErrorUsuario,
  type ErrorAlertContent,
} from '../../shared/errors/mensajeErrorUsuario';
import { AgregarProductoModal } from '../menu/AgregarProductoModal';

type DraftItem = {
  key: string;
  producto_id: number;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
  base_id: number | null;
  base_nombre: string | null;
  salsa_ids: number[];
  salsa_nombres: string[];
  proteina_id: number | null;
  proteina_nombre: string | null;
  adiciones: CartAdicion[];
};

function lineaToDraft(linea: PedidoDetalleLinea, index: number): DraftItem {
  return {
    key: `L-${index}-${linea.producto_id}`,
    producto_id: linea.producto_id,
    nombre: linea.producto_nombre,
    precio_unitario: linea.precio_unit_momento,
    cantidad: linea.cantidad,
    base_id: linea.base_id,
    base_nombre: linea.base_nombre,
    salsa_ids: linea.salsa_ids ?? [],
    salsa_nombres: linea.salsa_nombres,
    proteina_id: linea.proteina_id,
    proteina_nombre: linea.proteina_nombre,
    adiciones: (linea.adiciones ?? []).map((a) => ({
      id: a.adicion_id,
      nombre: a.nombre,
      precio: a.precio_momento,
    })),
  };
}

function draftToPayload(items: DraftItem[]): CrearPedidoItemPayload[] {
  return items.map((item) => ({
    producto_id: item.producto_id,
    cantidad: item.cantidad,
    base_id: item.base_id,
    salsa_ids: item.salsa_ids,
    proteina_id: item.proteina_id,
    adiciones: item.adiciones.map((a) => a.id),
  }));
}

function money(value: number): string {
  return `$${value.toLocaleString('es-CO')}`;
}

export function PedidoEditarPage() {
  const { id } = useParams();
  const pedidoId = Number(id);
  const navigate = useNavigate();

  const [nombre, setNombre] = useState('');
  const [indicacionesActivas, setIndicacionesActivas] = useState(false);
  const [indicaciones, setIndicaciones] = useState('');
  const [estado, setEstado] = useState<'pendiente' | 'pagado'>('pendiente');
  const [items, setItems] = useState<DraftItem[]>([]);
  const [menu, setMenu] = useState<MenuResponse | null>(null);
  const [selected, setSelected] = useState<Producto | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorAlert, setErrorAlert] = useState<ErrorAlertContent | null>(null);

  useEffect(() => {
    if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
      setErrorAlert({
        title: 'Pedido inválido',
        message: 'No se pudo abrir este pedido.',
      });
      setCargando(false);
      return;
    }
    let cancelled = false;
    Promise.all([fetchPedidoById(pedidoId), fetchMenu()])
      .then(([detalle, menuRes]) => {
        if (cancelled) return;
        setNombre(detalle.nombre_cliente);
        const texto = detalle.indicaciones?.trim() ?? '';
        setIndicacionesActivas(texto !== '');
        setIndicaciones(texto);
        setEstado(detalle.estado);
        setItems(detalle.lineas.map(lineaToDraft));
        setMenu(menuRes);
        setCargando(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setErrorAlert(mensajeErrorUsuario(err, 'No se pudo cargar el pedido'));
        setCargando(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pedidoId]);

  const totalPreview = useMemo(
    () =>
      items.reduce((sum, item) => {
        const extras = item.adiciones.reduce((s, a) => s + a.precio, 0);
        return sum + (item.precio_unitario + extras) * item.cantidad;
      }, 0),
    [items],
  );

  const puedeGuardar = items.length > 0 && !guardando;

  async function guardar() {
    if (!puedeGuardar) return;
    setGuardando(true);
    setErrorAlert(null);
    try {
      await actualizarPedido(pedidoId, {
        nombre_cliente: nombre,
        indicaciones:
          indicacionesActivas && indicaciones.trim() !== '' ? indicaciones.trim() : null,
        items: draftToPayload(items),
      });
      navigate('/historial');
    } catch (err: unknown) {
      setErrorAlert(mensajeErrorUsuario(err, 'No se pudo guardar el pedido'));
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
        <h1>Editar pedido</h1>
        <Link to="/historial" className="link-action">
          ← Historial
        </Link>
      </header>

      {errorAlert ? (
        <AlertError
          title={errorAlert.title}
          message={errorAlert.message}
          onClose={() => setErrorAlert(null)}
        />
      ) : null}

      <p className="muted">
        #{pedidoId} · {estado === 'pagado' ? 'Pagado' : 'Pendiente'}
      </p>

      <section className="stack">
        <Input
          label="Nombre del cliente"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Sin nombre"
        />

        <label className="check-row check-row-start">
          <input
            type="checkbox"
            checked={indicacionesActivas}
            onChange={(e) => {
              const on = e.target.checked;
              setIndicacionesActivas(on);
              if (!on) setIndicaciones('');
            }}
          />
          <span className="check-box" aria-hidden />
          <span>Indicaciones especiales</span>
        </label>
        <p className="muted">
          Actívalo si el cliente pide algo especial (ej. sin un ingrediente). Se envía en el
          WhatsApp del pedido.
        </p>
        {indicacionesActivas ? (
          <label className="field">
            <span className="field-label">Indicaciones</span>
            <textarea
              className="field-input field-textarea"
              rows={3}
              value={indicaciones}
              onChange={(e) => setIndicaciones(e.target.value)}
              placeholder="Ej. Sin chicharrón, agregar maíz…"
            />
          </label>
        ) : null}

        <div className="stack">
          <h2 className="section-title">Ítems</h2>
          {items.map((item) => (
            <article key={item.key} className="line-card">
              <div className="line-card-footer">
                <div>
                  <h2>
                    {item.cantidad}× {item.nombre}
                  </h2>
                  <p className="muted">
                    {[item.base_nombre, ...item.salsa_nombres, item.proteina_nombre]
                      .filter(Boolean)
                      .join(' · ') || 'Sin extras'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  className="link-danger"
                  onClick={() => setItems((prev) => prev.filter((x) => x.key !== item.key))}
                >
                  Quitar
                </Button>
              </div>
            </article>
          ))}

          {menu ? (
            <div className="chip-row">
              {menu.productos.map((p) => (
                <button key={p.id} type="button" className="chip" onClick={() => setSelected(p)}>
                  + {p.nombre}
                </button>
              ))}
            </div>
          ) : null}

          <p>
            Total: <strong>{money(totalPreview)}</strong>
          </p>
          {estado === 'pagado' ? (
            <p className="muted">
              Pedido pagado: al guardar se ajusta el monto/vuelto según el nuevo total.
            </p>
          ) : null}
        </div>

        <Button disabled={!puedeGuardar} onClick={() => void guardar()}>
          {guardando ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </section>

      {selected && menu ? (
        <AgregarProductoModal
          open
          producto={selected}
          bases={menu.bases}
          salsas={menu.salsas}
          proteinas={menu.proteinas}
          onClose={() => setSelected(null)}
          onAdd={(payload) => {
            setItems((prev) => [
              ...prev,
              {
                key: `N-${Date.now()}-${selected.id}`,
                producto_id: selected.id,
                nombre: selected.nombre,
                precio_unitario: selected.precio,
                cantidad: 1,
                ...payload,
                adiciones: payload.adiciones.map((a) => ({
                  id: a.id,
                  nombre: a.nombre,
                  precio: a.precio,
                })),
              },
            ]);
            setSelected(null);
          }}
        />
      ) : null}
    </main>
  );
}
