/** @format */

import { AlertTriangle } from "lucide-react";
import Modal from "../../../../components/common/Modal";

export function ModalEliminarTurno({
  modalEliminar,
  cerrarModal,
  turnoSeleccionado,
  ejecutarEliminacion,
}) {
  const nombrePaciente = turnoSeleccionado?.Paciente
    ? `${turnoSeleccionado.Paciente.nombre} ${turnoSeleccionado.Paciente.apellido}`
    : `#${turnoSeleccionado?.id_paciente || ""}`;

  return (
    <Modal
      isOpen={modalEliminar}
      onClose={cerrarModal}
      width="max-w-md"
      title="Eliminar Turno"
      variant="danger"
    >
      <div className="bg-gradient-to-br from-rose-50/80 to-rose-100/30 border border-rose-200/90 rounded-2xl p-4 flex items-start gap-3.5 shadow-2xs">
        <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0 shadow-2xs">
          <AlertTriangle size={20} />
        </div>
        <div className="flex flex-col gap-1.5">
          <h3 className="text-sm font-bold text-slate-900">
            ¿Confirmas la eliminación permanente?
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Se eliminará el turno{" "}
            <span className="inline-flex px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-900 font-bold font-mono">
              #{turnoSeleccionado?.id_turno}
            </span>{" "}
            asignado al paciente{" "}
            <strong className="text-slate-900 font-bold">{nombrePaciente}</strong>. Esta acción es irreversible.
          </p>
        </div>
      </div>

      <div className="border-t border-rose-100 my-4" />

      <div className="flex justify-end items-center gap-2.5">
        <button
          type="button"
          onClick={cerrarModal}
          className="px-4 py-2.5 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200/80 font-bold text-xs transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={ejecutarEliminacion}
          className="px-4 py-2.5 rounded-xl text-white bg-rose-600 hover:bg-rose-700 font-bold text-xs transition-colors shadow-sm shadow-rose-500/30 cursor-pointer"
        >
          Sí, Eliminar Turno
        </button>
      </div>
    </Modal>
  );
}

export default ModalEliminarTurno;

