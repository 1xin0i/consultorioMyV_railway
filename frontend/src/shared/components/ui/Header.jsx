/** @format */

export function Header({
  icono,
  titulo,
  subtitulo,
  badge,
  alerta,
  botonAccion,
  children,
}) {
  return (
    <header className="w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-b border-gray-200/80 dark:border-slate-800 px-4 py-3 sm:px-6 sm:py-3.5 shadow-2xs shrink-0 transition-colors">
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 w-full">
        {/* Zona izquierda: Ícono, Título y Subtítulo */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {icono && (
            <div className="p-2 sm:p-2.5 bg-[#e8f7f1] dark:bg-teal-950/60 border border-[#b5e4d3] dark:border-teal-800/70 rounded-xl text-[#2eb086] dark:text-emerald-400 shadow-2xs shrink-0 flex items-center justify-center">
              {icono}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug truncate">
                {titulo}
              </h1>
              {badge && (
                typeof badge === "string" ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ecfdf5] text-[#017f54] border border-[#c1f7df] dark:bg-emerald-950/40 dark:border-emerald-800/50 dark:text-emerald-300 shrink-0">
                    {badge}
                  </span>
                ) : (
                  badge
                )
              )}
            </div>
            {subtitulo && (
              <p className="text-slate-500 dark:text-slate-400 text-xs font-normal mt-0.5 leading-snug">
                {subtitulo}
              </p>
            )}
          </div>
        </div>

        {/* Zona derecha: Alerta, Botón de Acción o Children */}
        {(alerta || botonAccion || children) && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap ml-auto">
            {alerta && <div className="flex items-center shrink-0">{alerta}</div>}
            {botonAccion && (
              <div className="hidden sm:flex items-center gap-2">{botonAccion}</div>
            )}
            {children}
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
