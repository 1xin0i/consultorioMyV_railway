/** @format */

import { Lock, Unlock } from "lucide-react";

export function CeldaDiaMes({
  diaItem,
  idx,
  capacidadDia = 24,
  seleccionado,
  iniciarPresionDia,
  moverPresionDiaMouse,
  moverPresionDiaTouch,
  onClickDia,
  onSelectRangeToBlock,
  onEliminarRestriccion,
}) {
  if (!diaItem.esMesActual) {
    return (
      <div key={idx} className="bg-transparent min-h-[90px] sm:min-h-[110px]" />
    );
  }

  const {
    fecha,
    esHoy,
    cantidadActivos = 0,
    modulosOcupados = 0,
    porcentaje = 0,
    diaLaboral,
    bloqueado,
    restriccion,
    estilosOcupacion,
  } = diaItem;

  const diaBloqueado = bloqueado || !diaLaboral;
  const modulosLibres = Math.max(0, capacidadDia - modulosOcupados);

  const fechaIsoAttr = `${fecha.getFullYear()}-${String(
    fecha.getMonth() + 1,
  ).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;

  const hoySinHora = new Date();
  hoySinHora.setHours(0, 0, 0, 0);
  const esDiaPasado = fecha.getTime() < hoySinHora.getTime();

  return (
    <div
      data-dia-iso={fechaIsoAttr}
      onMouseDown={(e) => iniciarPresionDia?.(diaItem.fecha, e)}
      onMouseEnter={() => moverPresionDiaMouse?.(diaItem.fecha)}
      onTouchStart={(e) => iniciarPresionDia?.(diaItem.fecha, e)}
      onTouchMove={moverPresionDiaTouch}
      onClick={onClickDia}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSelectRangeToBlock?.({
          inicio: diaItem.fecha,
          fin: diaItem.fecha,
        });
      }}
      className={`rounded-2xl p-2 sm:p-2.5 flex flex-col justify-between min-h-[90px] sm:min-h-[110px] transition-all cursor-pointer relative overflow-hidden select-none ${
        seleccionado
          ? "border-2 !border-black dark:!border-white ring-2 ring-black dark:ring-white z-20 shadow-md bg-slate-50 dark:bg-slate-800"
          : diaBloqueado
            ? "bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400"
            : esHoy
              ? "bg-emerald-50/20 dark:bg-emerald-950/20 border-2 border-[#2eb086] ring-2 ring-[#2eb086]/20 z-10"
              : esDiaPasado
                ? "bg-white/80 dark:bg-slate-900/60 border border-gray-200/80 dark:border-slate-800 opacity-80 hover:bg-gray-50/80 dark:hover:bg-slate-800/60"
                : "bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 hover:shadow-xs"
      }`}
    >
      {/* Cabecera de la celda: Número a la izquierda y Motivo/Bloqueo a la derecha */}
      <div className="flex items-center justify-between gap-1">
        {esHoy ? (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#2eb086] text-white font-extrabold text-xs shadow-xs">
            {fecha.getDate()}
          </span>
        ) : (
          <span
            className={`font-extrabold text-xs sm:text-sm ${
              seleccionado
                ? "text-black dark:text-white"
                : diaBloqueado
                  ? "text-slate-500 dark:text-slate-400"
                  : esDiaPasado
                    ? "text-gray-400 dark:text-slate-500"
                    : "text-gray-800 dark:text-slate-200"
            }`}
          >
            {fecha.getDate()}
          </span>
        )}

        <div className="flex items-center gap-1">
          {diaBloqueado && (
            <span className="text-[10px] text-slate-600 dark:text-slate-300 font-semibold flex items-center gap-1 bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 px-1.5 py-0.5 rounded-md">
              <Lock size={10} className="shrink-0 text-slate-500" />
              <span className="truncate max-w-[85px] sm:max-w-[120px]">
                {restriccion?.motivo ||
                  (!diaLaboral ? "Día no laboral" : "Bloqueado")}
              </span>
            </span>
          )}

          {bloqueado && restriccion?.id && onEliminarRestriccion && (
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onEliminarRestriccion(restriccion.id);
              }}
              title="Desbloquear día"
              className="p-0.5 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
            >
              <Unlock size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Parte inferior de la celda: Badge de módulos libres + Barra de progreso */}
      {!diaBloqueado && (
        <div className="flex flex-col items-end gap-1 w-full mt-2">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 truncate ${
              modulosOcupados === 0
                ? "text-gray-400 bg-gray-50/70 border-gray-200/80 dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-400"
                : estilosOcupacion?.badgeColor ||
                  "text-emerald-800 bg-emerald-50/70 border-emerald-200/80"
            }`}
            title={`${modulosOcupados} módulos ocupados (${cantidadActivos} turnos) de ${capacidadDia}. Quedan ${modulosLibres} módulos libres.`}
          >
            {modulosOcupados > 0 && (
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  estilosOcupacion?.dotColor || "bg-emerald-500"
                }`}
              />
            )}
            <span>
              {modulosOcupados === 0
                ? `${capacidadDia} libres`
                : modulosLibres <= 0
                  ? "Completo"
                  : `${modulosLibres} libres`}
            </span>
          </span>

          {porcentaje > 0 && (
            <div className="w-full h-1 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                style={{ width: `${porcentaje}%` }}
                className={`h-full rounded-full transition-all ${
                  estilosOcupacion?.barColor || "bg-emerald-500"
                }`}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function LeyendaOcupacionMes({
  corteBajaModulos = 12,
  corteMediaModulos = 19,
  umbralBaja = 50,
  umbralMedia = 80,
}) {
  return (
    <div className="px-3 sm:px-5 py-2.5 bg-gray-50/90 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-end gap-2 text-[11px] text-gray-600 dark:text-slate-400 select-none">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-slate-600 shrink-0" />
          <span>
            <strong className="text-gray-700 dark:text-slate-200">
              Disponible:
            </strong>{" "}
            0 módulos
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
          <span>
            <strong className="text-emerald-800 dark:text-emerald-400">
              Baja:
            </strong>{" "}
            1 a {corteBajaModulos} mód. (≤{umbralBaja}%)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
          <span>
            <strong className="text-amber-800 dark:text-amber-400">
              Media:
            </strong>{" "}
            {corteBajaModulos + 1} a {corteMediaModulos} mód. ({umbralBaja + 1}
            %-{umbralMedia}%)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
          <span>
            <strong className="text-rose-800 dark:text-rose-400">Alta:</strong>{" "}
            {corteMediaModulos + 1}+ mód. (&gt;{umbralMedia}%)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Lock size={11} className="text-slate-500 shrink-0" />
          <span>
            <strong className="text-slate-700 dark:text-slate-300">
              Bloqueado
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}

export function BarraFlotanteSeleccionMes() {
  return null;
}
