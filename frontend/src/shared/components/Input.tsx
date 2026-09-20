import type { InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function Input({ label, id, className = '', ...props }: Props) {
  const inputId = id ?? props.name;
  return (
    <label className="field" htmlFor={inputId}>
      {label ? <span className="field-label">{label}</span> : null}
      <input id={inputId} className={`field-input ${className}`.trim()} {...props} />
    </label>
  );
}
