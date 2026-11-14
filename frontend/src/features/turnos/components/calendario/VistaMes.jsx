/** @format */

import { memo } from "react";
import { useConfiguracion } from "@/features/configuracion";
import { useVistaMesSeleccion } from "../../hooks/useVistaMesSeleccion";
import { CeldaDiaMes, LeyendaOcupacionMes } from "./CeldaDiaMes";

const NOMBRES_DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export const VistaMes = memo(function VistaMes({
  fechaActual,
  turnos = [],
  onSelectDay,
  onSelectRangeToBlock,
  onEliminarRestriccion,
  estaDiaMarcado,
  iniciarPresionDia,
  moverPresionDiaMouse,
  moverPresionDiaTouch,
  debeIgnorarClickDia,
}) {
  const {
    configuracion,
    esDiaLaboral,
    esDiaBloqueado,
    obtenerRestriccionDia,
    minutosJornada,
    modulosTotales,
    corteBajaModulos,
    corteMediaModulos,
  } = useConfiguracion();

  const intervaloMinutos = Number(configuracion?.intervaloMinutos) || 30;
  const umbralBaja = Number(configuracion?.umbralBaja ?? 50);
  const umbralMedia = Number(configuracion?.umbralMedia ?? 80);

  const { diasCalendario } = useVistaMesSeleccion({
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
    <div className="flex flex-col flex-1 select-none relative bg-white dark:bg-slate-900">
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

      {/* Grilla de días del mes con tarjetas redondeadas y separación limpia */}
      <div className="grid grid-cols-7 gap-2 p-2.5 sm:p-3 flex-1 bg-[#f9fbfd] dark:bg-slate-950/40">
        {diasCalendario.map((diaItem, idx) => (
          <CeldaDiaMes
            key={idx}
            diaItem={diaItem}
            idx={idx}
            capacidadDia={modulosTotales || 24}
            seleccionado={
              estaDiaMarcado ? estaDiaMarcado(diaItem.fecha) : false
            }
            iniciarPresionDia={iniciarPresionDia}
            moverPresionDiaMouse={moverPresionDiaMouse}
            moverPresionDiaTouch={moverPresionDiaTouch}
            onClickDia={() => {
              if (!debeIgnorarClickDia?.()) onSelectDay?.(diaItem.fecha);
            }}
            onSelectRangeToBlock={onSelectRangeToBlock}
            onEliminarRestriccion={onEliminarRestriccion}
          />
        ))}
      </div>

      {/* Leyenda explicativa de capacidad diaria en el pie de la vista */}
      <LeyendaOcupacionMes
        corteBajaModulos={corteBajaModulos}
        corteMediaModulos={corteMediaModulos}
        umbralBaja={umbralBaja}
        umbralMedia={umbralMedia}
      />
    </div>
  );
});

export default VistaMes;
