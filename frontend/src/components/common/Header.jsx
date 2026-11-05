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
    <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-white border-b border-teal-100 px-4 py-2.5 sm:px-6 sm:py-3 shadow-xs shrink-0 transition-colors">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {/* Ícono dinámico clínico con color vivo */}
        {Icono && (
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200/80 flex items-center justify-center shrink-0 shadow-xs">
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
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300/60 shrink-0 shadow-2xs">
                {badge}
              </span>
            )}
          </div>
          {subtitulo && (
            <p className="text-[11px] sm:text-xs text-teal-800/80 font-medium leading-tight truncate">
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
