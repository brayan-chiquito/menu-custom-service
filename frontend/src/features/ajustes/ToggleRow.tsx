type Props = {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
};

export function ToggleRow({ label, checked, onChange, disabled }: Props) {
  return (
    <label className={`toggle-row ${disabled ? 'toggle-row-disabled' : ''}`.trim()}>
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        className={`toggle-switch ${checked ? 'toggle-switch-on' : ''}`.trim()}
        onClick={() => onChange(!checked)}
      />
    </label>
  );
}
