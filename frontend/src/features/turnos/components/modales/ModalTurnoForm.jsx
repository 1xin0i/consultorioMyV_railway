/** @format */

import { useState, useEffect } from "react";
import api from "../../../../services/api";
import Modal from "../../../../components/common/Modal";
import {
  UserPlus,
  ChevronDown,
  CheckSquare,
  CalendarDays,
  UserRoundX,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { formatDateTimeInput } from "../../../../utils";
import toast from "react-hot-toast";
import { manejarErrorApi } from "../../../../utils/errorHandler";
import InputFiltro from "../../../../components/common/InputFiltro";
import { calcularHoraFin } from "../../utils/calcularHoraFin";
import { useConfiguracion } from "../../../../context/ConfiguracionContext";

export function ModalTurnoForm({
  modalAbierto,
  cerrarModal,
  editando,
  pacientes,
  setPacientes,
  datosFormulario,
  actualizarDatos,
  guardarTurno,
  abrirParaAtender,
  abrirParaCancelar,
  abrirParaInasistente,
  abrirParaReprogramar,
}) {
  const [modalPacienteRapidoAbierto, setModalPacienteRapidoAbierto] = useState(false);
  const [datosPacienteRapido, setDatosPacienteRapido] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    dni: "",
    fecha_nacimiento: "",
    domicilio: "",
  });

  // Estado local para el menú desplegable de acciones rápidas dentro del modal
  const [menuAccionesAbierto, setMenuAccionesAbierto] = useState(false);

  const { validarTurnoHorario } = useConfiguracion();
  const validacionHorario =
    !editando && datosFormulario?.fecha_hora_inicio && validarTurnoHorario
      ? validarTurnoHorario(datosFormulario.fecha_hora_inicio)
      : null;

  // Cálculo automático de la fecha/hora de fin al crear
  useEffect(() => {
    if (modalAbierto && !editando && datosFormulario?.fecha_hora_inicio && datosFormulario?.duracion_minutos) {
      calcularHoraFin(datosFormulario, actualizarDatos);
    }
  }, [modalAbierto, editando, datosFormulario?.fecha_hora_inicio, datosFormulario?.duracion_minutos, actualizarDatos]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuAccionesAbierto !== null && !event.target.closest(".menu-acciones-container")) {
        setMenuAccionesAbierto(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuAccionesAbierto]);

  const actualizarDatosPacienteRapido = (e) => {
    const { name, value } = e.target;
    setDatosPacienteRapido((prev) => ({ ...prev, [name]: value }));
  };

  const guardarPacienteRapido = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      const respuesta = await api.post("/pacientes", {
        nombre: datosPacienteRapido.nombre.trim(),
        apellido: datosPacienteRapido.apellido.trim(),
        telefono: datosPacienteRapido.telefono.trim(),
        dni: datosPacienteRapido.dni?.trim() || null,
        fecha_nacimiento: datosPacienteRapido.fecha_nacimiento || null,
        domicilio: datosPacienteRapido.domicilio?.trim() || null,
      });

      const nuevoPaciente = respuesta.data.data || respuesta.data;
      const nuevoId = nuevoPaciente.id_paciente;

      if (setPacientes) {
        setPacientes((prev) => {
          const existe = prev.some((p) => p.id_paciente === nuevoId);
          return existe ? prev : [...prev, nuevoPaciente];
        });
      }

      actualizarDatos({
        target: { name: "id_paciente", value: nuevoId },
      });

      toast.success("Paciente creado correctamente");
      setDatosPacienteRapido({
        nombre: "",
        apellido: "",
        telefono: "",
        dni: "",
        fecha_nacimiento: "",
        domicilio: "",
      });
      setModalPacienteRapidoAbierto(false);
    } catch (error) {
      console.error("Error al crear paciente rápido:", error);
      manejarErrorApi(error, "No se pudo crear el paciente.");
    }
  };

  // Identificar el estado del turno
  const idEstadoActual = Number(datosFormulario.id_estado);
  const esProgramado = idEstadoActual === 1 || !editando;

  return (
    <>
      <Modal
        isOpen={modalAbierto}
        onClose={cerrarModal}
        onSubmit={guardarTurno}
        width="max-w-2xl"
        title={editando ? `Editar Turno #${datosFormulario.id_turno || ""}` : "Agendar Turno Nuevo"}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8 sm:pb-6">
          {/* Aviso si el turno no es programado */}
          {editando && !esProgramado && (
            <div className="col-span-1 md:col-span-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-medium">
              Este turno se encuentra en estado Atendido/Cerrado. El paciente y horario están fijados para preservar el historial clínico. Solo podés modificar las notas u observaciones.
            </div>
          )}

          {/* Paciente */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-semibold text-gray-700">
                Paciente <span className="text-rose-500 font-extrabold">*</span>
              </label>
              {(!editando || esProgramado) && (
                <button
                  type="button"
                  onClick={() => setModalPacienteRapidoAbierto(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-[#2eb086] hover:text-[#259370] bg-[#e8f7f1] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  title="Crear paciente rápido"
                >
                  <UserPlus size={14} />
                  <span>+ Nuevo Paciente</span>
                </button>
              )}
            </div>
            <InputFiltro
              datos={pacientes}
              disabled={editando && !esProgramado}
              camposFiltrado={["nombre", "apellido", "dni", "telefono", "domicilio"]}
              formatoVisual={(p) =>
                `${p.nombre} ${p.apellido} - DNI: ${p.dni || "S/D"} - Telefono: ${p.telefono || "S/D"}`
              }
              placeholder="Busca un paciente..."
              alSeleccionar={(p) =>
                actualizarDatos({ target: { name: "id_paciente", value: p?.id_paciente || "" } })
              }
              valorInicial={datosFormulario.id_paciente || ""}
            />
          </div>

          {/* Fecha y Hora de Inicio */}
          {!editando && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Fecha y Hora de Inicio <span className="text-rose-500 font-extrabold">*</span>
              </label>
              <input
                type="datetime-local"
                name="fecha_hora_inicio"
                value={formatDateTimeInput(datosFormulario.fecha_hora_inicio) || ""}
                onChange={actualizarDatos}
                required
                className={`w-full border p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors ${
                  validacionHorario && !validacionHorario.valido
                    ? "border-amber-400 bg-amber-50/30 text-amber-900 focus:ring-amber-400/50"
                    : "border-gray-300 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
                }`}
              />
              {validacionHorario && !validacionHorario.valido && (
                <p className="text-xs text-amber-600 font-semibold mt-1 flex items-center gap-1">
                  <AlertCircle size={13} className="shrink-0" />
                  <span>{validacionHorario.mensaje}</span>
                </p>
              )}
            </div>
          )}

          {/* Duración (Minutos) */}
          {!editando && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Duración (Minutos) <span className="text-rose-500 font-extrabold">*</span>
              </label>
              <select
                name="duracion_minutos"
                value={datosFormulario.duracion_minutos || 30}
                onChange={actualizarDatos}
                className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
              >
                <option value={15}>15 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>1 hora</option>
                <option value={90}>90 minutos (1h 30m)</option>
                <option value={120}>120 minutos (2 horas)</option>
              </select>
            </div>
          )}

          {/* Fecha y Hora de Fin (Calculado) */}
          {!editando && (
            <div className="col-span-1 md:col-span-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Fecha y Hora de Fin (Calculado automáticamente)
              </label>
              <input
                type="datetime-local"
                name="fecha_hora_fin"
                value={datosFormulario.fecha_hora_fin || ""}
                disabled
                className="w-full bg-gray-100 border border-gray-300 p-2 rounded-lg text-sm text-gray-600 cursor-not-allowed font-medium"
              />
            </div>
          )}

          {/* Notas / Observaciones */}
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Notas de la Consulta</label>
            <textarea
              name="notas_consulta"
              rows={3}
              placeholder="Observaciones previas, alergias, o detalles del procedimiento..."
              value={datosFormulario.notas_consulta || ""}
              onChange={actualizarDatos}
              className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
            />
          </div>
        </div>

        {/* Acciones del Modal Fijas al Pie */}
        <div className={`sticky bottom-0 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 mt-4 p-4 bg-white/95 backdrop-blur-xs border-t border-gray-100 flex items-center z-20 ${editando ? "justify-between" : "justify-end"}`}>
          {/* LÓGICA CONDICIONAL DE ACCIONES SEGÚN EL ESTADO */}
          {editando && esProgramado && (
            <div className="relative">
              <div className="relative menu-acciones-container">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuAccionesAbierto((prev) => !prev);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition-all"
                >
                  <span>Estado</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${
                      menuAccionesAbierto ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Menú Desplegable Flotante hacia arriba */}
                {menuAccionesAbierto && (
                  <div className="absolute left-0 bottom-full mb-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50 flex flex-col">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuAccionesAbierto(false);
                        if (abrirParaAtender) abrirParaAtender();
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors text-left"
                    >
                      <CheckSquare size={16} />
                      <span>Atender Turno</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuAccionesAbierto(false);
                        if (abrirParaReprogramar) abrirParaReprogramar();
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#3B7A94] hover:bg-[#f0f6f9] transition-colors text-left"
                    >
                      <CalendarDays size={16} />
                      <span>Reprogramar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuAccionesAbierto(false);
                        if (abrirParaInasistente) abrirParaInasistente();
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#2b5d73] hover:bg-[#f0f6f9] transition-colors text-left"
                    >
                      <UserRoundX size={16} />
                      <span>Marcar Inasistido</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuAccionesAbierto(false);
                        if (abrirParaCancelar) abrirParaCancelar();
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <XCircle size={16} />
                      <span>Cancelar Turno</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Botones Estándar de Guardado / Cancelar */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={cerrarModal}
              className="px-4 py-2.5 rounded-xl text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors font-medium text-sm cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-white bg-[#2eb086] hover:bg-[#259370] transition-all shadow-sm font-semibold text-sm cursor-pointer"
            >
              {editando ? "Guardar Cambios" : "Confirmar Turno"}
            </button>
          </div>
        </div>
      </Modal>

      {/* MINI-MODAL: CREAR PACIENTE RÁPIDO */}
      {modalPacienteRapidoAbierto && (
        <Modal
          isOpen={modalPacienteRapidoAbierto}
          onClose={() => setModalPacienteRapidoAbierto(false)}
          onSubmit={guardarPacienteRapido}
          width="max-w-2xl"
          title="Registro Rápido de Paciente"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">
                Nombre <span className="text-rose-500 font-extrabold">*</span>
              </label>
              <input
                type="text"
                name="nombre"
                value={datosPacienteRapido.nombre}
                onChange={actualizarDatosPacienteRapido}
                placeholder="Ej: Juan"
                required
                className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">
                Apellido <span className="text-rose-500 font-extrabold">*</span>
              </label>
              <input
                type="text"
                name="apellido"
                value={datosPacienteRapido.apellido}
                onChange={actualizarDatosPacienteRapido}
                placeholder="Ej: Pérez"
                required
                className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">DNI</label>
              <input
                type="text"
                name="dni"
                value={datosPacienteRapido.dni}
                onChange={actualizarDatosPacienteRapido}
                placeholder="Ej: 38123456"
                className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">
                Teléfono / Celular <span className="text-rose-500 font-extrabold">*</span>
              </label>
              <input
                type="text"
                name="telefono"
                value={datosPacienteRapido.telefono}
                onChange={actualizarDatosPacienteRapido}
                placeholder="Ej: 3515551234"
                required
                className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">Fecha de Nacimiento</label>
              <input
                type="date"
                name="fecha_nacimiento"
                value={datosPacienteRapido.fecha_nacimiento}
                onChange={actualizarDatosPacienteRapido}
                className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">Domicilio</label>
              <input
                type="text"
                name="domicilio"
                value={datosPacienteRapido.domicilio}
                onChange={actualizarDatosPacienteRapido}
                placeholder="Ej: Av. Colón 1234"
                className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 my-4" />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalPacienteRapidoAbierto(false)}
              className="px-4 py-2 rounded-xl text-gray-600 bg-gray-100 hover:bg-gray-200 font-medium text-sm transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-white bg-[#2eb086] hover:bg-[#259370] font-semibold text-sm transition-colors shadow-sm cursor-pointer"
            >
              Guardar y Seleccionar
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

export default ModalTurnoForm;
