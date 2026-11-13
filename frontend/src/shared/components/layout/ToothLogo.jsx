/** @format */

export function ToothLogo({ size = 34, className = "" }) {
  return (
    <img
      src="/logo-muelita.png"
      alt="Logo Consultorio M&V"
      width={size}
      height={size}
      className={`shrink-0 object-contain select-none ${className}`}
      draggable={false}
    />
  );
}

export default ToothLogo;

