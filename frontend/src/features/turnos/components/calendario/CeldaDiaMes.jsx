/** @format */

import { Lock, Unlock, Calendar, X } from "lucide-react";

const FMT_DIA_MES = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
});

export function CeldaDiaMes({
  diaItem,
  idx,
  seleccionado,
  iniciarSeleccionDia,
  moverSeleccionDia,
  handleDayTouchStart,
  handleDayTouchMove,
  handleDayTouchEnd,
  handleClickCeldaDia,
  onSelectRangeToBlock,
  onEliminarRestriccion,
}) {
  if (!diaItem.esMesActual) {
    return (
      <div
        key={idx}
        className="bg-gray-50/40 dark:bg-slate-900/40 border-r border-b border-gray-100 dark:border-slate-800/80 p-1.5 sm:p-2 min-h-[78px] sm:min-h-[115px] opacity-35 select-none"
      >
        <span className="text-[11px] sm:text-xs font-medium text-gray-400 dark:text-slate-600">
          {diaItem.fecha.getDate()}
        </span>
      </div>
    );
  }

  const {
    cantidadActivos,
    modulosOcupados,
    porcentaje,
    estilosOcupacion,
    diaLaboral,
    bloqueado,
    restriccion,
  } = diaItem;

  const fechaIsoAttr = `${diaItem.fecha.getFullYear()}-${String(
    diaItem.fecha.getMonth() + 1,
  ).padStart(2, "0")}-${String(diaItem.fecha.getDate()).padStart(2, "0")}`;

  return (
    <div
      data-mes-fecha={fechaIsoAttr}
      onMouseDown={(e) => iniciarSeleccionDia(diaItem, e)}
      onMouseEnter={() => moverSeleccionDia(diaItem)}
      onTouchStart={(e) => handleDayTouchStart(diaItem, e)}
      onTouchMove={handleDayTouchMove}
      onTouchEnd={handleDayTouchEnd}
      onTouchCancel={handleDayTouchEnd}
      onClick={() => handleClickCeldaDia(diaItem)}
      className={`group relative border-r border-b border-gray-200 dark:border-slate-800 p-1.5 sm:p-2.5 min-h-[82px] sm:min-h-[120px] transition-all cursor-pointer flex flex-col justify-between select-none ${
        seleccionado
          ? "bg-teal-50/90 dark:bg-teal-950/60 ring-2 ring-inset ring-[#2eb086] z-10"
          : bloqueado
            ? "bg-slate-100/85 dark:bg-slate-800/70 hover:bg-slate-200/60 dark:hover:bg-slate-800"
            : !diaLaboral
              ? "bg-slate-100/60 dark:bg-slate-900/75 hover:bg-slate-100 dark:hover:bg-slate-800/60"
              : diaItem.esHoy
                ? "bg-[#f3fbf8] dark:bg-teal-950/25 ring-1 ring-inset ring-[#2eb086]/40"
                : "bg-white dark:bg-slate-900 hover:bg-gray-50/80 dark:hover:bg-slate-800/50"
      }`}
    >
      {/* Cabecera de la celda */}
      <div className="flex items-center justify-between gap-1">
        <span
          className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-xs sm:text-sm font-bold transition-transform group-hover:scale-105 ${
            seleccionado
              ? "bg-[#2eb086] text-white shadow-xs"
              : diaItem.esHoy
                ? "bg-[#2eb086] text-white shadow-xs"
                : bloqueado || !diaLaboral
                  ? "text-slate-400 dark:text-slate-500"
                  : "text-gray-700 dark:text-slate-200 group-hover:text-[#2eb086]"
          }`}
        >
          {diaItem.fecha.getDate()}
        </span>

        <div className="flex items-center gap-1">
          {!bloqueado && diaLaboral && onSelectRangeToBlock && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectRangeToBlock({
                  inicio: diaItem.fecha,
                  fin: diaItem.fecha,
                });
              }}
              title="Bloquear este día o franja horaria"
              className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-opacity cursor-pointer hidden sm:inline-flex"
            >
              <Lock size={12} />
            </button>
          )}

          {bloqueado && restriccion?.id && onEliminarRestriccion && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEliminarRestriccion(restriccion.id);
              }}
              title="Desbloquear día"
              className="p-1 rounded-md text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
            >
              <Unlock size={12} />
            </button>
          )}

          {!bloqueado && (diaLaboral || cantidadActivos > 0) && (
            <span
              className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${estilosOcupacion.badgeColor}`}
            >
              {estilosOcupacion.etiqueta}
            </span>
          )}
        </div>
      </div>

      {/* Cuerpo de la celda */}
      <div className="mt-1 sm:mt-2 flex flex-col gap-1 sm:gap-1.5">
        {bloqueado ? (
          <div className="flex flex-col gap-0.5 bg-slate-200/75 dark:bg-slate-700/60 border border-slate-300/80 dark:border-slate-600 rounded-lg px-1.5 py-1">
            <div className="flex items-center gap-1 text-slate-700 dark:text-slate-200">
              <Lock size={11} className="shrink-0" />
              <span className="text-[9px] sm:text-[11px] font-bold truncate">
                Bloqueado
              </span>
            </div>
            {restriccion?.motivo && (
              <span className="text-[8px] sm:text-[10px] text-slate-500 dark:text-slate-400 truncate hidden sm:block">
                {restriccion.motivo}
              </span>
            )}
          </div>
        ) : !diaLaboral && cantidadActivos === 0 ? (
          <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
            <span className="text-[9px] sm:text-[11px] font-medium truncate">
              Cerrado
            </span>
          </div>
        ) : cantidadActivos > 0 ? (
          <>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span
                className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0 ${estilosOcupacion.dotColor}`}
              />
              <span className="text-[10px] sm:text-xs font-bold text-gray-800 dark:text-slate-200 truncate">
                {cantidadActivos} {cantidadActivos === 1 ? "turno" : "turnos"}
                <span className="hidden md:inline font-medium text-gray-500 dark:text-slate-400">
                  {" "}
                  ({modulosOcupados} mód.)
                </span>
              </span>
            </div>

            <div className="w-full h-1 sm:h-1.5 bg-gray-200/80 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${estilosOcupacion.barColor}`}
                style={{ width: `${Math.max(12, porcentaje)}%` }}
              />
            </div>
          </>
        ) : (
          <div className="flex items-center gap-1 text-gray-400 dark:text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-slate-600 shrink-0" />
            <span className="text-[9px] sm:text-[11px] font-medium truncate">
              Disponible
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function BarraFlotanteSeleccionMes({
  rangoSeleccionado,
  onClear,
  onSelectDay,
  onSelectRangeToBlock,
}) {
  if (!rangoSeleccionado) return null;

  return (
    <div className="sticky bottom-3 z-30 mx-auto my-2 px-3 sm:px-4 py-2.5 bg-slate-900/95 text-white rounded-2xl shadow-xl border border-slate-700 flex flex-wrap items-center justify-between gap-2 sm:gap-3 max-w-xl w-[calc(100%-1.5rem)] animate-in fade-in slide-in-from-bottom-2 duration-150">
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-2 h-2 rounded-full bg-[#2eb086] shrink-0" />
        <span className="text-xs font-bold truncate">
          {rangoSeleccionado.tMin === rangoSeleccionado.tMax
            ? `Día seleccionado: ${FMT_DIA_MES.format(rangoSeleccionado.inicio)}`
            : `Del ${FMT_DIA_MES.format(rangoSeleccionado.inicio)} al ${FMT_DIA_MES.format(rangoSeleccionado.fin)}`}
        </span>
      </div>

      <div className="flex items-center gap-1.5 ml-auto">
        {rangoSeleccionado.tMin === rangoSeleccionado.tMax && (
          <button
            type="button"
            onClick={() => {
              const f = rangoSeleccionado.inicio;
              onClear();
              onSelectDay(f);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#2eb086] hover:bg-[#259370] text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <Calendar size={13} />
            <span>Ver Día</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            if (onSelectRangeToBlock) {
              onSelectRangeToBlock({
                inicio: rangoSeleccionado.inicio,
                fin: rangoSeleccionado.fin,
              });
            }
            onClear();
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
        >
          <Lock size={13} />
          <span>
            {rangoSeleccionado.tMin === rangoSeleccionado.tMax
              ? "Bloquear Día"
              : "Bloquear Días"}
          </span>
        </button>

        <button
          type="button"
          onClick={onClear}
          className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title="Cancelar selección"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}

export function LeyendaOcupacionMes({
  horasJornada,
  modulosTotales,
  intervaloMinutos,
  corteBajaModulos,
  corteMediaModulos,
  umbralBaja,
  umbralMedia,
}) {
  return (
    <div className="px-3 sm:px-5 py-3 bg-gray-50/90 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5 text-[11px] text-gray-600 dark:text-slate-400">
      <div className="flex items-center gap-2 font-medium text-gray-700 dark:text-slate-300">
        <span className="font-bold text-gray-800 dark:text-slate-100">
          Capacidad diaria ({horasJornada} hs = {modulosTotales} módulos de{" "}
          {intervaloMinutos} min):
        </span>
        <span className="text-gray-500 dark:text-slate-400 hidden sm:inline">
          Mantené presionado o arrastrá sobre varios días para bloquear
          vacaciones o feriados.
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
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

