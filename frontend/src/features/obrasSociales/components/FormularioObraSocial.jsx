import Modal from "../../../components/common/Modal";

export function FormularioCrearEditar({
  guardarObraSocial,
  modalAbierto,
  cerrarModal,
  editando,
  datosFormulario,
  actualizarDatos,
}) {
  return (
    <form onSubmit={guardarObraSocial}>
      <Modal
        isOpen={modalAbierto}
        onClose={cerrarModal}
        width="max-w-md"
        title={editando ? "Editar Obra Social" : "Nueva Obra Social"}
      >
        <div className="flex flex-col gap-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nombre de la Obra Social / Prepaga *
            </label>
            <input
              type="text"
              name="nombre"
              value={datosFormulario.nombre}
              onChange={actualizarDatos}
              placeholder="Ej: OSDE, Swiss Medical..."
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0d8266]/40"
            />
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 my-4" />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={cerrarModal}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0d8266] hover:bg-[#0b6f57] transition-all cursor-pointer shadow-xs"
          >
            {editando ? "Guardar" : "Crear"}
          </button>
        </div>
      </Modal>
    </form>
  );
}

export function FormularioToggle({ modalToggle, cerrarModal, obraSocialSeleccionada, toggleObraSocial }) {
  return (
    <Modal
      isOpen={modalToggle}
      onClose={cerrarModal}
      width="max-w-md"
      title={obraSocialSeleccionada?.activo ? "Desactivar" : "Activar"}
    >
      <p className="text-sm text-gray-600">
        ¿Deseas {obraSocialSeleccionada?.activo ? "desactivar" : "activar"} a{" "}
        <strong className="text-gray-800">{obraSocialSeleccionada?.nombre}</strong>?
      </p>
      <div className="border-t border-gray-200 my-4" />
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={cerrarModal}
          className="px-4 py-2 rounded-xl text-gray-600 bg-gray-100 font-medium text-sm"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={toggleObraSocial}
          className={`px-4 py-2 rounded-xl text-white font-semibold text-sm ${obraSocialSeleccionada?.activo ? "bg-red-500" : "bg-[#2eb086]"}`}
        >
          Confirmar
        </button>
      </div>
    </Modal>
  );
}

export function FormularioEliminar({
  modalEliminar,
  cerrarModal,
  obraSocialSeleccionada,
  eliminarObraSocial,
}) {
  return (
    <Modal
      isOpen={modalEliminar}
      onClose={cerrarModal}
      width="max-w-md"
      title="Eliminar definitivamente Obra Social"
    >
      <p className="text-sm text-black">
        ¿Deseas <strong>Eliminar definitivamente</strong> a{" "}
        <strong className="text-gray-800">{obraSocialSeleccionada?.nombre}</strong>?
      </p>
      <p className="text-sm text-red-500 mt-4">Esta acción no puede ser desecha.</p>
      <div className="border-t border-gray-200 my-4" />
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={cerrarModal}
          className="px-4 py-2 rounded-xl text-gray-600 bg-gray-100 font-medium text-sm"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={eliminarObraSocial}
          className={`px-4 py-2 rounded-xl text-white font-semibold text-sm bg-red-500`}
        >
          Confirmar
        </button>
      </div>
    </Modal>
  );
}
