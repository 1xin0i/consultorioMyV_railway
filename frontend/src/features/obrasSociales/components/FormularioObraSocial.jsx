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
    <Modal
      isOpen={modalAbierto}
      onClose={cerrarModal}
      onSubmit={guardarObraSocial}
      width="max-w-md"
      title={editando ? "Editar Obra Social" : "Nueva Obra Social"}
    >
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre de la Obra Social *</label>
        <input
          type="text"
          name="nombre"
          value={datosFormulario.nombre}
          onChange={actualizarDatos}
          placeholder="Ej: OSDE, Swiss Medical..."
          required
          className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50"
        />
      </div>
      <div className="border-t border-gray-200 my-5" />
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={cerrarModal}
          className="px-4 py-2.5 rounded-xl text-gray-600 bg-gray-100 font-medium text-sm cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl text-white bg-[#2eb086] hover:bg-[#259370] font-semibold text-sm transition-all shadow-sm cursor-pointer"
        >
          {editando ? "Guardar" : "Crear"}
        </button>
      </div>
    </Modal>
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
          className="px-4 py-2 rounded-xl text-gray-600 bg-gray-100 font-medium text-sm cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={toggleObraSocial}
          className={`px-4 py-2 rounded-xl text-white font-semibold text-sm cursor-pointer ${obraSocialSeleccionada?.activo ? "bg-red-500 hover:bg-red-600" : "bg-[#2eb086] hover:bg-[#259370]"}`}
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
          className="px-4 py-2 rounded-xl text-gray-600 bg-gray-100 font-medium text-sm cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={eliminarObraSocial}
          className={`px-4 py-2 rounded-xl text-white font-semibold text-sm bg-red-500 hover:bg-red-600 cursor-pointer`}
        >
          Confirmar
        </button>
      </div>
    </Modal>
  );
}
