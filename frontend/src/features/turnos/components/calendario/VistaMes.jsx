/** @format */

import { memo } from "react";
import { useConfiguracion } from "@/features/configuracion";
import { useVistaMesSeleccion } from "../../hooks/useVistaMesSeleccion";
import {
  CeldaDiaMes,
  BarraFlotanteSeleccionMes,
  LeyendaOcupacionMes,
} from "./CeldaDiaMes";

const NOMBRES_DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export const VistaMes = memo(function VistaMes({
  fechaActual,
  turnos = [],
  onSelectDay,
  onSelectRangeToBlock,
  onEliminarRestriccion,
}) {
  const {
    configuracion,
    esDiaLaboral,
    esDiaBloqueado,
    obtenerRestriccionDia,
    minutosJornada,
    horasJornada,
    modulosTotales,
    corteBajaModulos,
    corteMediaModulos,
  } = useConfiguracion();

  const intervaloMinutos = Number(configuracion?.intervaloMinutos) || 30;
  const umbralBaja = Number(configuracion?.umbralBaja ?? 50);
  const umbralMedia = Number(configuracion?.umbralMedia ?? 80);

  const {
    diasCalendario,
    setSeleccionDias,
    rangoSeleccionado,
    estaDiaSeleccionado,
    iniciarSeleccionDia,
    moverSeleccionDia,
    handleDayTouchStart,
    handleDayTouchMove,
    handleDayTouchEnd,
    handleClickCeldaDia,
  } = useVistaMesSeleccion({
    fechaActual,
    turnos,
    onSelectDay,
    esDiaLaboral,
    esDiaBloqueado,
    obtenerRestriccionDia,
    minutosJornada,
    intervaloMinutos,
    umbralBaja,
    umbralMedia,
    corteBajaModulos,
    corteMediaModulos,
  });

  return (
    <div className="flex flex-col flex-1 select-none relative">
      {/* Encabezado de días de la semana */}
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-slate-800 bg-gray-50/90 dark:bg-slate-800/80">
        {NOMBRES_DIAS_SEMANA.map((dia) => (
          <div
            key={dia}
            className="py-2 sm:py-2.5 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400"
          >
            {dia}
          </div>
        ))}
      </div>

      {/* Grilla de días del mes */}
      <div className="grid grid-cols-7 flex-1 bg-white dark:bg-slate-900">
        {diasCalendario.map((diaItem, idx) => (
          <CeldaDiaMes
            key={idx}
            diaItem={diaItem}
            idx={idx}
            seleccionado={estaDiaSeleccionado(diaItem.fecha)}
            iniciarSeleccionDia={iniciarSeleccionDia}
            moverSeleccionDia={moverSeleccionDia}
            handleDayTouchStart={handleDayTouchStart}
            handleDayTouchMove={handleDayTouchMove}
            handleDayTouchEnd={handleDayTouchEnd}
            handleClickCeldaDia={handleClickCeldaDia}
            onSelectRangeToBlock={onSelectRangeToBlock}
            onEliminarRestriccion={onEliminarRestriccion}
          />
        ))}
      </div>

      {/* Barra flotante de acción cuando hay 1 o varios días seleccionados */}
      <BarraFlotanteSeleccionMes
        rangoSeleccionado={rangoSeleccionado}
        onClear={() => setSeleccionDias(null)}
        onSelectDay={onSelectDay}
        onSelectRangeToBlock={onSelectRangeToBlock}
      />

      {/* Leyenda explicativa de capacidad diaria */}
      <LeyendaOcupacionMes
        horasJornada={horasJornada}
        modulosTotales={modulosTotales}
        intervaloMinutos={intervaloMinutos}
        corteBajaModulos={corteBajaModulos}
        corteMediaModulos={corteMediaModulos}
        umbralBaja={umbralBaja}
        umbralMedia={umbralMedia}
      />
    </div>
  );
});

export default VistaMes;
