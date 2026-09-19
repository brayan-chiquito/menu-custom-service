import { useEffect, useMemo, useState } from 'react';
import type { Adicion, CatalogoSimple, Producto } from '../../shared/api/types';
import { Button } from '../../shared/components/Button';
import { Modal } from '../../shared/components/Modal';
import { puedeAgregarProducto } from './agregarProducto.rules';

type Props = {
  producto: Producto;
  bases: CatalogoSimple[];
  salsas: CatalogoSimple[];
  proteinas: CatalogoSimple[];
  open: boolean;
  onClose: () => void;
  onAdd: (payload: {
    base_id: number | null;
    base_nombre: string | null;
    salsa_ids: number[];
    salsa_nombres: string[];
    proteina_id: number | null;
    proteina_nombre: string | null;
    adiciones: Adicion[];
  }) => void;
};

export function AgregarProductoModal({
  producto,
  bases,
  salsas,
  proteinas,
  open,
  onClose,
  onAdd,
}: Props) {
  const esBebida = producto.categoria === 'bebidas';
  const [baseId, setBaseId] = useState<number | null>(null);
  const [salsaIds, setSalsaIds] = useState<number[]>([]);
  const [proteinaId, setProteinaId] = useState<number | null>(null);
  const [adicionIds, setAdicionIds] = useState<number[]>([]);

  useEffect(() => {
    if (open) {
      setBaseId(null);
      setSalsaIds([]);
      setProteinaId(null);
      setAdicionIds([]);
    }
  }, [open, producto.id]);

  const puedeAgregar = useMemo(
    () =>
      puedeAgregarProducto({
        categoria: producto.categoria,
        baseId,
        salsaIds,
        proteinaId,
        requiere_proteina: producto.requiere_proteina,
      }),
    [producto.categoria, producto.requiere_proteina, baseId, salsaIds, proteinaId],
  );

  function toggleSalsa(id: number) {
    setSalsaIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleAdicion(id: number) {
    setAdicionIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function handleAdd() {
    if (!puedeAgregar) {
      return;
    }

    if (esBebida) {
      onAdd({
        base_id: null,
        base_nombre: null,
        salsa_ids: [],
        salsa_nombres: [],
        proteina_id: null,
        proteina_nombre: null,
        adiciones: [],
      });
      onClose();
      return;
    }

    if (baseId === null || salsaIds.length === 0) {
      return;
    }
    const base = bases.find((b) => b.id === baseId);
    const salsasSeleccionadas = salsas.filter((s) => salsaIds.includes(s.id));
    const proteina = proteinas.find((p) => p.id === proteinaId);
    if (!base || salsasSeleccionadas.length === 0) {
      return;
    }

    onAdd({
      base_id: base.id,
      base_nombre: base.nombre,
      salsa_ids: salsasSeleccionadas.map((s) => s.id),
      salsa_nombres: salsasSeleccionadas.map((s) => s.nombre),
      proteina_id: producto.requiere_proteina ? (proteina?.id ?? null) : null,
      proteina_nombre: producto.requiere_proteina ? (proteina?.nombre ?? null) : null,
      adiciones: producto.adiciones.filter((a) => adicionIds.includes(a.id)),
    });

    setBaseId(null);
    setSalsaIds([]);
    setProteinaId(null);
    setAdicionIds([]);
    onClose();
  }

  return (
    <Modal open={open} title={producto.nombre} onClose={onClose}>
      <p className="muted">
        ${producto.precio.toLocaleString('es-CO')}
        {esBebida
          ? ' · listo para agregar'
          : ` · elige base y al menos una salsa${producto.requiere_proteina ? ' y proteína' : ''}`}
      </p>

      {!esBebida ? (
        <>
          <section className="selector-block">
            <h3>Base</h3>
            <div className="chip-row">
              {bases.map((base) => (
                <button
                  key={base.id}
                  type="button"
                  className={`chip ${baseId === base.id ? 'chip-active' : ''}`}
                  onClick={() => setBaseId(base.id)}
                >
                  {base.nombre}
                </button>
              ))}
            </div>
          </section>

          <section className="selector-block">
            <h3>Salsas (una o más)</h3>
            <div className="chip-row">
              {salsas.map((salsa) => (
                <button
                  key={salsa.id}
                  type="button"
                  className={`chip ${salsaIds.includes(salsa.id) ? 'chip-active' : ''}`}
                  onClick={() => toggleSalsa(salsa.id)}
                >
                  {salsa.nombre}
                </button>
              ))}
            </div>
          </section>

          {producto.requiere_proteina ? (
            <section className="selector-block">
              <h3>Proteína</h3>
              <div className="chip-row">
                {proteinas.map((proteina) => (
                  <button
                    key={proteina.id}
                    type="button"
                    className={`chip ${proteinaId === proteina.id ? 'chip-active' : ''}`}
                    onClick={() => setProteinaId(proteina.id)}
                  >
                    {proteina.nombre}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <section className="selector-block">
            <h3>Toppings (opcional)</h3>
            <div className="topping-list">
              {producto.adiciones.map((adicion) => (
                <button
                  key={adicion.id}
                  type="button"
                  className={`topping ${adicionIds.includes(adicion.id) ? 'topping-active' : ''}`}
                  onClick={() => toggleAdicion(adicion.id)}
                >
                  <span className="topping-name">{adicion.nombre}</span>
                  <span className="topping-price">+${adicion.precio.toLocaleString('es-CO')}</span>
                </button>
              ))}
            </div>
          </section>
        </>
      ) : null}

      <Button disabled={!puedeAgregar} onClick={handleAdd}>
        Agregar al pedido
      </Button>
    </Modal>
  );
}
