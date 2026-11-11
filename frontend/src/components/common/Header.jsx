/** @format */

export default function Header({
  titulo,
  subtitulo,
  badge,
  alerta,
  botonAccion,
  children,
}) {
  return (
    <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 bg-white text-slate-800 border-b border-gray-200/80 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800 px-4 py-3.5 sm:px-6 sm:py-4 shadow-2xs shrink-0 transition-colors">
      {/* Zona izquierda: Título, Subtítulo, Badge y alerta/selector */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 min-w-0">
        <div>
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <h1 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug truncate">
              {titulo}
            </h1>
            {badge && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40 shrink-0">
                {badge}
              </span>
            )}
          </div>
          {subtitulo && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">
              {subtitulo}
            </p>
          )}
        </div>
      </div>

      {/* Zona derecha: Botón de acción y elementos adicionales */}
      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        {alerta && <div className="flex items-center shrink-0">{alerta}</div>}
        {botonAccion && (
          <div className="hidden sm:flex items-center gap-2">{botonAccion}</div>
        )}
        {children}
      </div>
    </div>
  );
}
