import type { ReactNode } from 'react';
import { Button } from './Button';

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function Modal({ open, title, onClose, children }: Props) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <Button variant="ghost" onClick={onClose} aria-label="Cerrar">
            ✕
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
