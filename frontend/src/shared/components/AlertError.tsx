type Props = {
  title: string;
  message: string;
  onClose: () => void;
};

/** Alerta de error visible arriba (RF-21). Solo errores; sin textos de diseño. */
export function AlertError({ title, message, onClose }: Props) {
  return (
    <div className="alert-error" role="alert">
      <div className="alert-error-body">
        <strong className="alert-error-title">{title}</strong>
        <p className="alert-error-message">{message}</p>
      </div>
      <button
        type="button"
        className="alert-error-close"
        onClick={onClose}
        aria-label="Cerrar alerta"
      >
        ✕
      </button>
    </div>
  );
}
