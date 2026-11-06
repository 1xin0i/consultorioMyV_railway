/** @format */
import Modal from "../../../components/common/Modal";
import { CreditCard, ShieldPlus, X } from "lucide-react";
import InputFiltro from "../../../components/common/InputFiltro";

export function FormularioCrearEditar({
  guardarPaciente,
  modalAbierto,
  cerrarModal,
  editando,
  datosFormulario,
  actualizarDatos,
  agregarObraSocialForm,
  obrasSocialesLista,
  actualizarObraSocialForm,
  eliminarObraSocialForm,
}) {
  const esDatoFaltante = (valor) => editando && (!valor || valor === "" || valor === null);

  return (
    <Modal
      isOpen={modalAbierto}
      onClose={cerrarModal}
      onSubmit={guardarPaciente}
      width="max-w-2xl"
      title={editando ? "Editar Paciente" : "Registrar Nuevo Paciente"}
    >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8 sm:pb-6">
          {/* //* NOMBRE */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1">
              Nombre <span className="text-rose-500 font-extrabold">*</span>
            </label>
            <input
              type="text"
              name="nombre"
              value={datosFormulario.nombre}
              onChange={actualizarDatos}
              placeholder="Ej: Juan"
              required
              className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
            />
          </div>

          {/* //* APELLIDO */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1">
              Apellido <span className="text-rose-500 font-extrabold">*</span>
            </label>
            <input
              type="text"
              name="apellido"
              value={datosFormulario.apellido}
              onChange={actualizarDatos}
              placeholder="Ej: Pérez"
              required
              className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
            />
          </div>

          {/* //* DNI */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-bold text-gray-800">DNI</label>
              {esDatoFaltante(datosFormulario.dni) && (
                <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                  Dato faltante
                </span>
              )}
            </div>
            <input
              type="text"
              name="dni"
              value={datosFormulario.dni || ""}
              onChange={actualizarDatos}
              placeholder="Ej: 38123456"
              className={`w-full border p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors ${
                esDatoFaltante(datosFormulario.dni)
                  ? "border-amber-400 bg-amber-50/40 text-amber-950 focus:ring-amber-400/50"
                  : "border-gray-300 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
              }`}
            />
          </div>

          {/* //* TELEFONO */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1">
              Teléfono / Celular <span className="text-rose-500 font-extrabold">*</span>
            </label>
            <input
              type="text"
              name="telefono"
              value={datosFormulario.telefono}
              onChange={actualizarDatos}
              placeholder="Ej: 3515551234"
              required
              className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
            />
          </div>

          {/* //* FECHA NACIMIENTO */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-bold text-gray-800">Fecha de Nacimiento</label>
              {esDatoFaltante(datosFormulario.fecha_nacimiento) && (
                <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                  Dato faltante
                </span>
              )}
            </div>
            <input
              type="date"
              name="fecha_nacimiento"
              value={datosFormulario.fecha_nacimiento || ""}
              onChange={actualizarDatos}
              className={`w-full border p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors ${
                esDatoFaltante(datosFormulario.fecha_nacimiento)
                  ? "border-amber-400 bg-amber-50/40 text-amber-950 focus:ring-amber-400/50"
                  : "border-gray-300 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
              }`}
            />
          </div>

          {/* //* DOMICILIO */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-bold text-gray-800">Domicilio</label>
              {esDatoFaltante(datosFormulario.domicilio) && (
                <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                  Dato faltante
                </span>
              )}
            </div>
            <input
              type="text"
              name="domicilio"
              value={datosFormulario.domicilio || ""}
              onChange={actualizarDatos}
              placeholder="Ej: Av. Colón 1234"
              className={`w-full border p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors ${
                esDatoFaltante(datosFormulario.domicilio)
                  ? "border-amber-400 bg-amber-50/40 text-amber-950 focus:ring-amber-400/50"
                  : "border-gray-300 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
              }`}
            />
          </div>

          {/* //* SECCION: OBRAS SOCIALES */}
          <div className="col-span-1 md:col-span-2 mt-2 pt-4 border-t border-gray-200 pb-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-[#2eb086]" />
                <h3 className="text-sm font-bold text-gray-800">Cobertura de Obra Social</h3>
              </div>
              <button
                type="button"
                onClick={agregarObraSocialForm}
                className="flex items-center gap-1 text-xs font-semibold text-[#2eb086] hover:text-[#259370] bg-[#e8f7f1] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <ShieldPlus size={14} />
                <span>Agregar Obra Social</span>
              </button>
            </div>

            {datosFormulario.obrasSociales.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-2">
                Sin obras sociales asociadas. El paciente se registrará como Particular.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {datosFormulario.obrasSociales.map((osItem, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200 items-center relative"
                  >
                    {/* //* SELECTOR DE OBRA SOCIAL */}
                    <InputFiltro
                      datos={obrasSocialesLista}
                      camposFiltrado={["nombre"]}
                      formatoVisual={(os) => `${os.nombre}`}
                      placeholder="Busca una obra social..."
                      alSeleccionar={(os) => {
                        if (os && os.id_obra_social) {
                          actualizarObraSocialForm(index, "id_obra_social", os.id_obra_social);
                        }
                      }}
                      valorInicial={osItem.id_obra_social || ""}
                      mitad="true"
                    />

                    <div className="flex items-center gap-2 w-full sm:w-auto sm:flex-1">
                      {/* //* NRO AFILIADO */}
                      <input
                        type="text"
                        placeholder="N° de Afiliado *"
                        value={osItem.nro_afiliado}
                        onChange={(e) => actualizarObraSocialForm(index, "nro_afiliado", e.target.value)}
                        required
                        className="w-full border border-gray-300 p-2.5 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50"
                      />

                      {/* //* ELIMINAR OBRA SOCIAL */}
                      <button
                        type="button"
                        onClick={() => eliminarObraSocialForm(index)}
                        className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-200 transition-colors shrink-0"
                        title="Quitar obra social"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* //* ACCIONES MODAL FIJAS AL PIE */}
        <div className="sticky bottom-0 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 mt-6 p-4 bg-white/95 backdrop-blur-xs border-t border-gray-200 flex justify-end gap-3 z-20 shadow-xs">
          <button
            type="button"
            onClick={cerrarModal}
            className="px-4 py-2 rounded-xl text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors font-medium text-xs sm:text-sm cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl text-white bg-[#2eb086] hover:bg-[#259370] transition-all shadow-sm font-semibold text-xs sm:text-sm cursor-pointer"
          >
            {editando ? "Guardar Cambios" : "Registrar Paciente"}
          </button>
        </div>
      </Modal>
  );
}

export function FormularioToggle({ modalToggle, cerrarModal, pacienteSeleccionado, togglePaciente }) {
  const esBaja = pacienteSeleccionado?.activo;
  return (
    <Modal
      isOpen={modalToggle}
      onClose={cerrarModal}
      width="max-w-md"
      title={esBaja ? "Eliminar Paciente" : "Reactivar Paciente"}
      variant={esBaja ? "danger" : "default"}
    >
      <div className="flex flex-col gap-3">
        <p className="text-sm text-gray-700">
          ¿Estás seguro de que deseas {esBaja ? "eliminar" : "reactivar"} a{" "}
          <strong className="text-gray-900 font-bold">
            {pacienteSeleccionado?.nombre} {pacienteSeleccionado?.apellido}
          </strong>
          ?
        </p>

        {esBaja && (
          <div className="bg-amber-50 border border-amber-200/90 p-3 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <span className="font-bold shrink-0">ℹ️ Aclaración:</span>
            <span>
              El paciente dejará de figurar en la lista activa, pero{" "}
              <strong>sus registros clínicos, historia de turnos y comprobantes contables no se borrarán</strong> y quedarán resguardados en el sistema.
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 my-4" />

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={cerrarModal}
          className="px-4 py-2 rounded-xl text-gray-600 bg-gray-100 hover:bg-gray-200 font-medium text-sm cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={togglePaciente}
          className={`px-4 py-2 rounded-xl text-white font-semibold text-sm transition-colors shadow-sm cursor-pointer ${
            esBaja ? "bg-rose-600 hover:bg-rose-700" : "bg-[#2eb086] hover:bg-[#259370]"
          }`}
        >
          {esBaja ? "Sí, Eliminar Paciente" : "Sí, Reactivar Paciente"}
        </button>
      </div>
    </Modal>
  );
}