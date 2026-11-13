/** @format */

import { useState, useEffect } from "react";
import Modal from "@/shared/components/ui/Modal";

export function ModalCancelarTurno({
  isOpen,
  modalCancelarAbierto,
  onClose,
  cerrarModal,
  turno,
  turnoSeleccionado,
  inasistente = false,
  onConfirm,
  notasCanceladoInasistente,
  actualizarDatosCancelacion,
  procesarCancelacionTurno,
}) {
  const abierto = isOpen ?? modalCancelarAbierto;
  const cerrar = onClose || cerrarModal;
  const turnoTarget = turno || turnoSeleccionado;

  const [notas, setNotas] = useState("");

  useEffect(() => {
    if (abierto) {
      setNotas(notasCanceladoInasistente?.notas_consulta || "");
    }
  }, [abierto, notasCanceladoInasistente]);

  const nombrePaciente = turnoTarget?.Paciente
    ? `${turnoTarget.Paciente.nombre} ${turnoTarget.Paciente.apellido}`.trim()
    : "";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (typeof onConfirm === "function") {
      onConfirm({ notas_consulta: notas, inasistente, turno: turnoTarget });
    } else if (typeof procesarCancelacionTurno === "function") {
      procesarCancelacionTurno(e);
    }
  };

  const handleTextChange = (e) => {
    const val = e.target.value;
    setNotas(val);
    if (typeof actualizarDatosCancelacion === "function") {
      actualizarDatosCancelacion("notas_consulta", val);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Modal
        isOpen={abierto}
        onClose={cerrar}
        width="max-w-xl"
        variant={inasistente ? "warning" : "danger"}
        title={`${inasistente ? "Marcar Inasistido" : "Cancelar Turno"} #${turnoTarget?.id_turno || ""}${
          nombrePaciente ? ` — ${nombrePaciente}` : ""
        }`}
      >
        <div className="flex flex-col gap-4">
          <div
            className={`p-4 rounded-2xl border ${
              inasistente
                ? "bg-gradient-to-br from-amber-50/80 to-amber-100/30 border-amber-200/80"
                : "bg-gradient-to-br from-rose-50/80 to-rose-100/30 border-rose-200/80"
            } shadow-2xs`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800">
                Paciente:{" "}
                <span className="text-teal-900 font-extrabold">
                  {nombrePaciente || "Sin especificar"}
                </span>
              </span>
              <span className="inline-flex px-2 py-0.5 rounded-md font-mono font-bold text-xs bg-white/80 border border-slate-200/80">
                Turno #{turnoTarget?.id_turno}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {inasistente
                ? "El turno quedará registrado como inasistido para el historial del paciente y liberará el horario de atención."
                : "Se cancelará el turno asignado. Podrás reprogramarlo o registrar el motivo a continuación."}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Motivo u observaciones{" "}
              {inasistente ? "de inasistencia" : "de cancelación"}
            </label>
            <textarea
              rows={3}
              value={notas}
              onChange={handleTextChange}
              placeholder={`Escribe el motivo detallado de la ${inasistente ? "inasistencia" : "cancelación"}...`}
              className="w-full border border-teal-100 bg-slate-50/60 p-3 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all shadow-2xs"
            />
          </div>
        </div>

        <div className="border-t border-slate-100 my-4" />

        <div className="flex justify-end items-center gap-2.5">
          <button
            type="button"
            onClick={cerrar}
            className="px-4 py-2.5 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200/80 font-bold text-xs transition-colors cursor-pointer"
          >
            Volver
          </button>
          <button
            type="submit"
            className={`px-4 py-2.5 rounded-xl text-white ${
              inasistente
                ? "bg-amber-600 hover:bg-amber-700 shadow-amber-500/30"
                : "bg-rose-600 hover:bg-rose-700 shadow-rose-500/30"
            } transition-all shadow-sm font-bold text-xs cursor-pointer`}
          >
            Confirmar {inasistente ? "Inasistido" : "Cancelación"}
          </button>
        </div>
      </Modal>
    </form>
  );
}

export default ModalCancelarTurno;
