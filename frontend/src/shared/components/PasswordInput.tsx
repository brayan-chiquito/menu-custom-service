import { useState, type InputHTMLAttributes } from 'react';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: string;
};

/** Campo de contraseña con botón Ver / Ocultar. */
export function PasswordInput({ label, id, className = '', ...props }: Props) {
  const [visible, setVisible] = useState(false);
  const inputId = id ?? props.name;

  return (
    <label className="field" htmlFor={inputId}>
      {label ? <span className="field-label">{label}</span> : null}
      <div className="password-field">
        <input
          id={inputId}
          className={`field-input password-field-input ${className}`.trim()}
          type={visible ? 'text' : 'password'}
          {...props}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar contraseña' : 'Ver contraseña'}
        >
          {visible ? 'Ocultar' : 'Ver'}
        </button>
      </div>
    </label>
  );
}
