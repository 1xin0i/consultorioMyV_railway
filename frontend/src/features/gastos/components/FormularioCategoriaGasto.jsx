/** @format */

import Modal from "@/shared/components/ui/Modal";

const LABEL_CLASS =
  "block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1";
const INPUT_CLASS =
  "w-full border border-teal-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800 p-2.5 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all shadow-2xs";

export function FormularioCategoriaGasto({
  modalAbierto,
  cerrarModal,
  editando,
  datosFormulario,
  actualizarDatos,
  guardarCategoria,
}) {
  return (
    <Modal
      isOpen={modalAbierto}
      onClose={cerrarModal}
      onSubmit={guardarCategoria}
      width="max-w-lg"
      title={editando ? "Editar Categoría de Egreso" : "Registrar Nueva Categoría"}
    >
      <div className="flex flex-col gap-4">
        <div>
          <label className={LABEL_CLASS}>
            Nombre de la Categoría *
          </label>
          <input
            type="text"
            name="nombre"
            required
            placeholder="Ej. Insumos descartables, Alquiler, Servicios, Laboratorio..."
            value={datosFormulario?.nombre || ""}
            onChange={actualizarDatos}
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label className={LABEL_CLASS}>
            Descripción
          </label>
          <textarea
            name="descripcion"
            rows={3}
            placeholder="Detalles sobre los tipos de egresos incluidos en esta categoría..."
            value={datosFormulario?.descripcion || ""}
            onChange={actualizarDatos}
            className={INPUT_CLASS}
          />
        </div>
      </div>

      <div className="border-t border-teal-100 dark:border-slate-800 my-4" />

      <div className="flex justify-end items-center gap-2.5">
        <button
          type="button"
          onClick={cerrarModal}
          className="px-4 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 font-bold text-xs transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl text-white bg-[#0d8266] hover:bg-[#09664f] font-bold text-xs transition-all shadow-sm shadow-teal-900/20 cursor-pointer"
        >
          {editando ? "Guardar Cambios" : "Registrar Categoría"}
        </button>
      </div>
    </Modal>
  );
}

export default FormularioCategoriaGasto;

