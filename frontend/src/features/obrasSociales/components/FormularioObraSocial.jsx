/** @format */

import Modal from "@/shared/components/ui/Modal";

const LABEL_CLASS =
  "block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1";
const INPUT_CLASS =
  "w-full border border-teal-100 bg-slate-50/60 p-2.5 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all shadow-2xs";

export function FormularioCrearEditar({
  modalAbierto,
  cerrarModal,
  editando,
  datosFormulario,
  actualizarDatos,
  guardarObraSocial,
}) {
  return (
    <Modal
      isOpen={modalAbierto}
      onClose={cerrarModal}
      onSubmit={guardarObraSocial}
      width="max-w-lg"
      title={editando ? "Editar Obra Social" : "Registrar Nueva Obra Social"}
    >
      <div className="flex flex-col gap-4">
        <div>
          <label className={LABEL_CLASS}>
            Nombre de la Obra Social / Mutual *
          </label>
          <input
            type="text"
            name="nombre"
            required
            placeholder="Ej. APROSS, OSDE, PAMI, Swiss Medical..."
            value={datosFormulario?.nombre || ""}
            onChange={actualizarDatos}
            className={INPUT_CLASS}
          />
        </div>
      </div>

      <div className="border-t border-teal-100 my-4" />

      <div className="flex justify-end items-center gap-2.5">
        <button
          type="button"
          onClick={cerrarModal}
          className="px-4 py-2.5 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200/80 font-bold text-xs transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl text-white bg-[#0d8266] hover:bg-[#09664f] font-bold text-xs transition-all shadow-sm shadow-teal-900/20 cursor-pointer"
        >
          {editando ? "Guardar Cambios" : "Registrar Obra Social"}
        </button>
      </div>
    </Modal>
  );
}
