/** @format */

import Modal from "@/shared/components/ui/Modal";
import {
  AlertTriangle,
  Plus,
  X,
  Building2,
  UserRound,
  ShieldCheck,
} from "lucide-react";
import InputFiltro from "@/shared/components/ui/InputFiltro";

const LABEL_CLASS =
  "block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1";
const INPUT_CLASS =
  "w-full border border-teal-100 bg-slate-50/60 p-2.5 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all shadow-2xs";

export function FormularioCrearEditar({
  modalAbierto,
  cerrarModal,
  editando,
  obrasSocialesCatalogo = [],
  datosFormulario,
  actualizarDatos,
  agregarObraSocial,
  actualizarObraSocial,
  eliminarObraSocial,
  guardarPaciente,
}) {
  return (
    <Modal
      isOpen={modalAbierto}
      onClose={cerrarModal}
      onSubmit={guardarPaciente}
      width="max-w-2xl"
      title={editando ? "Editar Paciente" : "Registrar Nuevo Paciente"}
    >
      <div className="flex flex-col gap-4">
        <div className="bg-gradient-to-br from-teal-50/70 to-emerald-50/40 border border-teal-200/80 rounded-2xl p-3.5 flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-[#0d8266] text-white flex items-center justify-center shrink-0 shadow-xs">
            <UserRound size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-extrabold text-teal-950">
              Ficha Personal del Paciente
            </span>
            <span className="text-[11px] text-teal-800/80">
              Completá los datos personales y de contacto para la historia
              clínica.
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div>
            <label className={LABEL_CLASS}>Nombre *</label>
            <input
              type="text"
              name="nombre"
              required
              placeholder="Ej. María"
              value={datosFormulario?.nombre || ""}
              onChange={actualizarDatos}
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Apellido *</label>
            <input
              type="text"
              name="apellido"
              required
              placeholder="Ej. González"
              value={datosFormulario?.apellido || ""}
              onChange={actualizarDatos}
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>DNI</label>
            <input
              type="text"
              name="dni"
              placeholder="Ej. 38123456"
              value={datosFormulario?.dni || ""}
              onChange={actualizarDatos}
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Teléfono *</label>
            <input
              type="text"
              name="telefono"
              required
              placeholder="Ej. 3514567890"
              value={datosFormulario?.telefono || ""}
              onChange={actualizarDatos}
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Fecha de Nacimiento</label>
            <input
              type="date"
              name="fecha_nacimiento"
              value={datosFormulario?.fecha_nacimiento || ""}
              onChange={actualizarDatos}
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Domicilio</label>
            <input
              type="text"
              name="domicilio"
              placeholder="Ej. Av. Colón 1234"
              value={datosFormulario?.domicilio || ""}
              onChange={actualizarDatos}
              className={INPUT_CLASS}
            />
          </div>

          {editando && (
            <div className="col-span-1 md:col-span-2">
              <label className="flex items-center justify-between gap-3 p-3.5 bg-teal-50/50 border border-teal-200/70 rounded-xl cursor-pointer hover:bg-teal-50/80 transition-colors">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck size={18} className="text-[#0d8266] shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900">
                      Estado del Paciente (Activo)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Los pacientes activos aparecen en los selectores de turnos
                      y caja.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  name="activo"
                  checked={
                    datosFormulario.activo !== undefined
                      ? datosFormulario.activo
                      : true
                  }
                  onChange={(e) =>
                    actualizarDatos({
                      target: { name: "activo", value: e.target.checked },
                    })
                  }
                  className="w-4.5 h-4.5 text-[#0d8266] rounded border-teal-300 focus:ring-teal-500 cursor-pointer accent-[#0d8266]"
                />
              </label>
            </div>
          )}

          {/* Sección de Obras Sociales */}
          <div className="col-span-1 md:col-span-2 border-t border-teal-100 pt-4 mt-1">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-100/80 text-[#0d8266] flex items-center justify-center">
                  <Building2 size={15} />
                </div>
                <h3 className="text-xs font-extrabold text-teal-950 uppercase tracking-wider">
                  Obras Sociales Asociadas
                </h3>
              </div>
              <button
                type="button"
                onClick={agregarObraSocial}
                className="flex items-center gap-1 text-xs font-bold text-[#0d8266] hover:text-[#09664f] bg-teal-50 hover:bg-teal-100/80 border border-teal-200/70 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                <Plus size={14} />
                <span>Agregar Obra Social</span>
              </button>
            </div>

            {(!datosFormulario.obras_sociales ||
              datosFormulario.obras_sociales.length === 0) && (
              <p className="text-xs text-slate-500 italic bg-teal-50/30 p-3.5 rounded-xl border border-dashed border-teal-200 text-center">
                El paciente no tiene obras sociales asignadas (Atención
                Particular).
              </p>
            )}

            <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-1">
              {datosFormulario.obras_sociales?.map((os, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row items-center gap-2 bg-teal-50/35 p-2.5 rounded-xl border border-teal-100"
                >
                  <div className="flex-1 w-full">
                    <InputFiltro
                      datos={obrasSocialesCatalogo}
                      camposFiltrado={["nombre"]}
                      formatoVisual={(item) => item.nombre}
                      placeholder="Buscar obra social..."
                      alSeleccionar={(item) =>
                        actualizarObraSocial(
                          index,
                          "id_obra_social",
                          item?.id_obra_social || "",
                        )
                      }
                      valorInicial={os.id_obra_social}
                    />
                  </div>

                  <div className="w-full sm:w-48">
                    <input
                      type="text"
                      placeholder="Nro. de Afiliado"
                      value={os.nro_afiliado || ""}
                      onChange={(e) =>
                        actualizarObraSocial(
                          index,
                          "nro_afiliado",
                          e.target.value,
                        )
                      }
                      className="w-full border border-teal-100 bg-white p-2.5 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => eliminarObraSocial(index)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors self-end sm:self-center cursor-pointer"
                    title="Quitar obra social"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
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
          {editando ? "Guardar Cambios" : "Registrar Paciente"}
        </button>
      </div>
    </Modal>
  );
}

export function FormularioEliminar({
  modalEliminar,
  cerrarModal,
  pacienteSeleccionado,
  ejecutarEliminacion,
}) {
  const estaActivo = pacienteSeleccionado?.activo !== false;

  return (
    <Modal
      isOpen={modalEliminar}
      onClose={cerrarModal}
      width="max-w-md"
      variant={estaActivo ? "danger" : "teal"}
      title={estaActivo ? "Dar de Baja Paciente" : "Reactivar Paciente"}
    >
      <div
        className={`rounded-2xl p-4 flex items-start gap-3.5 border shadow-2xs ${
          estaActivo
            ? "bg-gradient-to-br from-rose-50/80 to-rose-100/30 border-rose-200/90"
            : "bg-gradient-to-br from-teal-50/80 to-emerald-50/40 border-teal-200/90"
        }`}
      >
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs ${
            estaActivo
              ? "bg-rose-100 text-rose-600 border-rose-200"
              : "bg-teal-100 text-[#0d8266] border-teal-200"
          }`}
        >
          <AlertTriangle size={20} />
        </div>
        <div className="flex flex-col gap-1.5">
          <h3 className="text-sm font-bold text-slate-900">
            {estaActivo
              ? "¿Estás seguro de dar de baja a este paciente?"
              : "¿Deseas reactivar a este paciente?"}
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {estaActivo ? "Se desactivará" : "Se volverá a habilitar"} al
            paciente{" "}
            <strong className="text-slate-900 font-bold">
              {pacienteSeleccionado?.nombre} {pacienteSeleccionado?.apellido}
            </strong>
            . Su historial clínico y turnos previos se conservarán intactos.
          </p>
        </div>
      </div>

      <div className="border-t border-slate-100 my-4" />

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
          className={`px-4 py-2.5 rounded-xl text-white ${
            estaActivo
              ? "bg-rose-600 hover:bg-rose-700 shadow-rose-500/30"
              : "bg-[#0d8266] hover:bg-[#09664f] shadow-teal-900/20"
          } font-bold text-xs transition-colors shadow-sm cursor-pointer`}
        >
          {estaActivo ? "Sí, Dar de Baja" : "Sí, Reactivar"}
        </button>
      </div>
    </Modal>
  );
}
