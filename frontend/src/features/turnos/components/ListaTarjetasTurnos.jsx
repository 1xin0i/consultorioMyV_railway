/** @format */

import { Clock, Stethoscope } from "lucide-react";
import { formatDateTime } from "@/shared/utils";
import {
  obtenerColorAvatar,
  obtenerIniciales,
} from "@/shared/utils/avatarColors";
import { estadosMap } from "../utils/estadosMap";
import { BotonAcciones } from "./BotonAcciones";
import { AdvertenciaPacienteIncompleto } from "./AdvertenciaPacienteIncompleto";

export function ListaTarjetasTurnos({
  turnos = [],
  cargando = false,
  recargar,
  abrirParaVer,
  abrirParaAtender,
  abrirParaReprogramar,
  abrirParaCancelar,
  abrirParaInasistente,
  abrirParaEditar,
  abrirParaEliminar,
  abrirParaCobrar,
  formatearTurnoParaReprogramar,
}) {
  if (cargando) {
    return (
      <div className="divide-y divide-teal-100/70 dark:divide-slate-800">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 space-y-2.5 bg-white dark:bg-slate-900">
            <div className="flex justify-between">
              <div className="h-4 bg-teal-50 dark:bg-slate-800 rounded w-1/2 animate-pulse" />
              <div className="h-5 bg-teal-50 dark:bg-slate-800 rounded-full w-20 animate-pulse" />
            </div>
            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-2/3 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (turnos.length === 0) {
    return (
      <div className="px-4 py-10 text-center text-slate-500 dark:text-slate-400 text-sm">
        No se encontraron turnos registrados.
      </div>
    );
  }

  return (
    <div className="divide-y divide-teal-100/70 dark:divide-slate-800">
      {turnos.map((turno) => {
        const estadoNombre = turno.EstadoTurno?.estado || "Programado";
        const configEstado = estadosMap[estadoNombre] || estadosMap.Programado;
        const IconoEstado = configEstado.icon;
        const paciente = turno.Paciente;
        const nombreCompleto = paciente
          ? `${paciente.nombre} ${paciente.apellido}`
          : `Paciente #${turno.id_paciente}`;
        const avatarColor = obtenerColorAvatar(nombreCompleto);
        const iniciales = obtenerIniciales(
          paciente?.nombre,
          paciente?.apellido,
        );

        const practicas = turno.PracticaTurnos || [];

        return (
          <div
            key={turno.id_turno}
            onClick={() => abrirParaVer && abrirParaVer(turno)}
            className="p-3.5 bg-white dark:bg-slate-900 hover:bg-teal-50/30 dark:hover:bg-slate-800/60 transition-colors cursor-pointer flex flex-col gap-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`w-9 h-9 rounded-full border text-xs font-bold flex items-center justify-center shrink-0 ${avatarColor.bg} ${avatarColor.text} ${avatarColor.border}`}
                >
                  {iniciales}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">
                      {nombreCompleto}
                    </span>
                    <AdvertenciaPacienteIncompleto
                      paciente={paciente}
                      alActualizarPaciente={recargar}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    <Clock size={12} className="text-[#0d8266] shrink-0" />
                    <span>{formatDateTime(turno.fecha_hora_inicio)}</span>
                  </div>
                </div>
              </div>

              <div
                className="flex items-center gap-1 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${configEstado.color}`}
                >
                  <IconoEstado size={11} />
                  {configEstado.label || estadoNombre}
                </span>
                <BotonAcciones
                  turno={turno}
                  abrirParaVer={abrirParaVer}
                  abrirParaAtender={abrirParaAtender}
                  abrirParaReprogramar={abrirParaReprogramar}
                  abrirParaCancelar={abrirParaCancelar}
                  abrirParaInasistente={abrirParaInasistente}
                  abrirParaEditar={abrirParaEditar}
                  abrirParaEliminar={abrirParaEliminar}
                  abrirParaCobrar={abrirParaCobrar}
                  formatearTurnoParaReprogramar={formatearTurnoParaReprogramar}
                />
              </div>
            </div>

            {practicas.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {practicas.map((pt, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-[10px] font-bold bg-teal-50 dark:bg-teal-950/60 text-[#0d8266] dark:text-emerald-300 border border-teal-200/80 dark:border-teal-800 px-2 py-0.5 rounded-md"
                  >
                    <Stethoscope size={10} />
                    <span>
                      {pt.Practica?.nombre_referencia ||
                        pt.Practica?.nombre_nomenclador ||
                        "Práctica"}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
