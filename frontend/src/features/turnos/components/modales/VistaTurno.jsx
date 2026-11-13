/** @format */

import { memo } from "react";
import { createPortal } from "react-dom";
import {
  Calendar,
  X,
  CalendarDays,
  UserRoundX,
  XCircle,
  CheckCircle2,
  Banknote,
} from "lucide-react";
import { useDetalleTurno } from "../../hooks/useDetalleTurno";
import {
  SubtituloFechaTurno,
  TarjetaPacienteTurno,
  GridEstadoHonorariosTurno,
  ListaTratamientosTurno,
} from "./SeccionesDetalleTurno";

export const VistaTurno = memo(function VistaTurno({
  isOpen,
  onClose,
  turno,
  abrirParaReprogramar,
  abrirParaAtender,
  abrirParaCancelar,
  abrirParaInasistente,
  abrirParaCobrar,
}) {
  const datosCalculados = useDetalleTurno({ isOpen, onClose, turno });

  if (!isOpen || !turno || !datosCalculados) return null;

  const {
    paciente,
    estadoNombre,
    esProgramado,
    esAtendido,
    esCancelado,
    estaCanceladoOInasistido,
    listaPracticas,
    nombreTratamiento,
    codigoNomenclador,
    nombreObraSocial,
    duracionMinutos,
    estaAbonado,
    coloresAvatar,
    iniciales,
    telLimpio,
    infoFecha,
    tituloModal,
    estilosCardEstado,
    precioFormateado,
  } = datosCalculados;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/45 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-6 flex flex-col gap-4 max-h-[92vh] overflow-y-auto scrollbar-none animate-in fade-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle visual de Bottom Sheet en mobile */}
        <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto sm:hidden -mt-1 mb-1 shrink-0" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-[#0d8266] border border-[#0d8266]/30 flex items-center justify-center shrink-0 shadow-2xs">
              <Calendar size={20} />
            </div>
            <div className="flex flex-col min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug truncate">
                {tituloModal}
              </h2>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                <SubtituloFechaTurno infoFecha={infoFecha} />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Datos del paciente */}
        <TarjetaPacienteTurno
          paciente={paciente}
          coloresAvatar={coloresAvatar}
          iniciales={iniciales}
          telLimpio={telLimpio}
        />

        {/* Estado y Honorarios */}
        <GridEstadoHonorariosTurno
          estilosCardEstado={estilosCardEstado}
          estadoNombre={estadoNombre}
          esProgramado={esProgramado}
          esAtendido={esAtendido}
          esCancelado={esCancelado}
          estaCanceladoOInasistido={estaCanceladoOInasistido}
          estaAbonado={estaAbonado}
          precioFormateado={precioFormateado}
          nombreObraSocial={nombreObraSocial}
        />

        {/* Tratamientos planificados */}
        <ListaTratamientosTurno
          listaPracticas={listaPracticas}
          duracionMinutos={duracionMinutos}
          nombreTratamiento={nombreTratamiento}
          codigoNomenclador={codigoNomenclador}
        />

        {/* Notas del turno */}
        <div>
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
            Notas del Turno
          </h3>
          <div className="rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-3 sm:p-3.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic whitespace-pre-wrap">
            {turno.notas_consulta && turno.notas_consulta.trim().length > 0 ? (
              turno.notas_consulta
            ) : (
              <span className="text-slate-400 dark:text-slate-500 not-italic">
                Sin notas registradas para este turno.
              </span>
            )}
          </div>
        </div>

        {/* Footer de Acciones */}
        <div className="pt-3 border-t border-slate-200/90 dark:border-slate-800 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
          {esProgramado && (
            <div className="grid grid-cols-3 sm:flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => abrirParaReprogramar?.(turno)}
                className="px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg sm:rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-center flex items-center justify-center gap-1 sm:gap-1.5 transition-colors shadow-2xs active:scale-95 cursor-pointer"
                title="Reprogramar Turno"
              >
                <CalendarDays size={14} className="text-slate-500 shrink-0" />
                <span>Reprogramar</span>
              </button>

              <button
                type="button"
                onClick={() => abrirParaInasistente?.(turno)}
                className="px-2.5 py-2 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg sm:rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/40 text-center flex items-center justify-center gap-1 sm:gap-1.5 transition-colors shadow-2xs active:scale-95 cursor-pointer"
                title="Marcar Inasistido"
              >
                <UserRoundX
                  size={14}
                  className="text-amber-600 dark:text-amber-400 shrink-0"
                />
                <span>Inasistido</span>
              </button>

              <button
                type="button"
                onClick={() => abrirParaCancelar?.(turno)}
                className="px-2.5 py-2 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-lg sm:rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/40 text-center flex items-center justify-center gap-1 sm:gap-1.5 transition-colors shadow-2xs active:scale-95 cursor-pointer"
                title="Cancelar Turno"
              >
                <XCircle
                  size={14}
                  className="text-rose-600 dark:text-rose-400 shrink-0"
                />
                <span>Cancelar</span>
              </button>
            </div>
          )}

          {estaCanceladoOInasistido && (
            <div className="w-full sm:w-auto">
              <button
                type="button"
                onClick={() => abrirParaReprogramar?.(turno)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-semibold text-xs whitespace-nowrap transition-colors shadow-2xs active:scale-95 cursor-pointer"
              >
                <CalendarDays size={14} className="text-slate-500" />
                <span>Reagendar</span>
              </button>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 w-full sm:w-auto sm:ml-auto">
            <button
              type="button"
              onClick={onClose}
              className={`${
                esProgramado || esAtendido
                  ? "hidden sm:inline-flex"
                  : "w-full sm:w-auto inline-flex justify-center"
              } px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer whitespace-nowrap`}
            >
              Cerrar
            </button>

            {esProgramado && (
              <button
                type="button"
                onClick={() => abrirParaAtender?.(turno)}
                className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-[#0d8266] hover:bg-[#0b6f57] rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <CheckCircle2 size={16} />
                <span>Atender</span>
              </button>
            )}

            {esAtendido && (
              <button
                type="button"
                onClick={() => abrirParaCobrar?.(turno)}
                className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-[#0d8266] hover:bg-[#0b6f57] rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Banknote size={16} />
                <span>Cobrar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
});

export default VistaTurno;
