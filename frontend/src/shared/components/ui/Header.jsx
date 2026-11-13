/** @format */

export function Header({ icono, titulo, subtitulo, children }) {
  return (
    <div className="mb-4 sm:mb-6 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 sm:gap-3.5 min-w-0">
          {icono && (
            <div className="p-2.5 sm:p-3 bg-[#e8f7f1] dark:bg-teal-950/60 border border-[#b5e4d3] dark:border-teal-800/70 rounded-xl text-[#2eb086] dark:text-emerald-400 shadow-2xs shrink-0 flex items-center justify-center mt-0.5">
              {icono}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              {titulo}
            </h1>
            {subtitulo && (
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mt-0.5 leading-snug">
                {subtitulo}
              </p>
            )}
          </div>
        </div>
      </div>

      {children && (
        <div className="flex flex-wrap items-center justify-between gap-2 w-full">
          {children}
        </div>
      )}
    </div>
  );
}
export default Header;

