/** @format */

export function TarjetaRegistro({
  titulo,
  subtitulo,
  badge,
  campos = [],
  acciones,
  inactivo = false,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={`p-3.5 transition-colors ${
        inactivo
          ? "bg-slate-50/70 dark:bg-slate-800/40 opacity-75"
          : "bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800"
      } ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug truncate">
              {titulo}
            </h3>
            {badge}
          </div>
          {subtitulo && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">
              {subtitulo}
            </p>
          )}
        </div>

        {acciones && (
          <div
            className="flex items-center gap-1 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {acciones}
          </div>
        )}
      </div>

      {campos.length > 0 && (
        <div className="mt-2.5 pt-2 border-t border-teal-100/60 dark:border-slate-800 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
          {campos.map((campo, idx) => (
            <div
              key={idx}
              className={`flex flex-col min-w-0 ${
                campo.completo ? "col-span-2" : ""
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800/70 dark:text-emerald-400/80">
                {campo.etiqueta}
              </span>
              <span className="text-slate-800 dark:text-slate-200 font-semibold truncate">
                {campo.valor || "-"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TarjetaRegistro;

