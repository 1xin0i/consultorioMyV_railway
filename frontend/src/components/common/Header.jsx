/** @format */

export default function Header({
  icono: Icono,
  titulo,
  subtitulo,
  badge,
  alerta,
  botonAccion,
  children,
}) {
  return (
    <div className="flex items-center justify-between gap-3 bg-[#e8f7f1] text-slate-800 border-b border-[#c2e8d9] px-4 py-2.5 sm:px-6 sm:py-3 shadow-2xs shrink-0 transition-colors">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {/* Ícono dinámico clínico con fondo funcional */}
        {Icono && (
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#2eb086] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Icono size={18} />
          </div>
        )}

        <div className="flex flex-col min-w-0">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <h1 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 tracking-tight leading-snug truncate">
              {titulo}
            </h1>
            {/* Badge opcional */}
            {badge && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-[#2eb086]/15 text-[#1a6e54] border border-[#2eb086]/30 shrink-0">
                {badge}
              </span>
            )}
          </div>
          {subtitulo && (
            <p className="text-[11px] sm:text-xs text-[#2b725c] font-medium leading-tight truncate">
              {subtitulo}
            </p>
          )}
        </div>
      </div>

      {/* Zona derecha: Alertas, botones de acción y elementos adicionales */}
      <div className="flex items-center gap-2 shrink-0">
        {alerta}
        {botonAccion && <div className="hidden sm:flex">{botonAccion}</div>}
        {children}
      </div>
    </div>
  );
}
