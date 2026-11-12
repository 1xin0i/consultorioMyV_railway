/** @format */

import { useState, useEffect } from "react";
import api from "../../../../services/api";
import Modal from "../../../../components/common/Modal";
import { UserPlus, AlertCircle, Plus, X } from "lucide-react";
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
  practicasLista = [],
  datosFormulario,
  actualizarDatos,
  guardarTurno,
}) {
  const [modalPacienteRapidoAbierto, setModalPacienteRapidoAbierto] =
    useState(false);
  const [datosPacienteRapido, setDatosPacienteRapido] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    dni: "",
    fecha_nacimiento: "",
    domicilio: "",
  });

  const { validarTurnoHorario } = useConfiguracion();
  const validacionHorario =
    !editando && datosFormulario?.fecha_hora_inicio && validarTurnoHorario
      ? validarTurnoHorario(
          datosFormulario.fecha_hora_inicio,
          datosFormulario.duracion_minutos,
        )
      : null;

  // Precargar prácticas si se está editando un turno programado existente
  useEffect(() => {
    if (
      modalAbierto &&
      editando &&
      datosFormulario?.id_turno &&
      (!datosFormulario.practicas || datosFormulario.practicas.length === 0)
    ) {
      api
        .get(`/practicas-turnos/${datosFormulario.id_turno}`)
        .then((res) => {
          const lista = res.data.data || [];
          if (lista.length > 0) {
            actualizarDatos((prev) => ({
              ...prev,
              practicas: lista.map((pt) => pt.id_practica),
            }));
          }
        })
        .catch(() => {});
    }
  }, [modalAbierto, editando, datosFormulario?.id_turno, actualizarDatos]);

  const practicasSeleccionadas = datosFormulario?.practicas || [];

  const agregarPracticaPlanificada = () => {
    actualizarDatos((prev) => ({
      ...prev,
      practicas: [...(prev.practicas || []), ""],
    }));
  };

  const actualizarPracticaPlanificada = (index, idPractica) => {
    actualizarDatos((prev) => {
      const lista = [...(prev.practicas || [])];
      lista[index] = idPractica ? Number(idPractica) : "";
      return { ...prev, practicas: lista };
    });
  };

  const eliminarPracticaPlanificada = (index) => {
    actualizarDatos((prev) => {
      const lista = (prev.practicas || []).filter((_, i) => i !== index);
      return { ...prev, practicas: lista };
    });
  };

  // Cálculo automático de la fecha/hora de fin al crear
  useEffect(() => {
    if (
      modalAbierto &&
      !editando &&
      datosFormulario?.fecha_hora_inicio &&
      datosFormulario?.duracion_minutos
    ) {
      calcularHoraFin(datosFormulario, actualizarDatos);
    }
  }, [
    modalAbierto,
    editando,
    datosFormulario?.fecha_hora_inicio,
    datosFormulario?.duracion_minutos,
    actualizarDatos,
  ]);

  const actualizarDatosPacienteRapido = (e) => {
    const { name, value } = e.target;
    setDatosPacienteRapido((prev) => ({ ...prev, [name]: value }));
  };

  const guardarPacienteRapido = async (e) => {
    e.preventDefault();
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

  const pacienteActual =
    pacientes.find((p) => p.id_paciente === datosFormulario?.id_paciente) ||
    datosFormulario?.Paciente;

  return (
    <>
      <Modal
        isOpen={modalAbierto}
        onClose={cerrarModal}
        onSubmit={guardarTurno}
        width="max-w-2xl"
        title={
          editando
            ? `Editar Turno #${datosFormulario?.id_turno || ""}${
                pacienteActual
                  ? ` - ${pacienteActual.nombre} ${pacienteActual.apellido}`
                  : ""
              }`
            : "Agendar Turno Nuevo"
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8 sm:pb-6">
          {/* Aviso si el turno no es programado */}
          {editando && !esProgramado && (
            <div className="col-span-1 md:col-span-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-medium">
              Este turno se encuentra en estado Atendido/Cerrado. El paciente y
              horario están fijados para preservar el historial clínico. Solo
              podés modificar las notas u observaciones.
            </div>
          )}

          {/* Banner Ámbar de Excepción / Urgencia cuando cae en día no laboral o horario bloqueado */}
          {!editando && validacionHorario && !validacionHorario.valido && (
            <div className="col-span-1 md:col-span-2 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/70 rounded-xl text-amber-900 dark:text-amber-200 flex flex-col gap-2.5 shadow-2xs">
              <div className="flex items-start gap-2.5">
                <AlertCircle
                  size={18}
                  className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
                />
                <div className="text-xs sm:text-sm leading-relaxed">
                  <span className="font-bold">
                    ⚠️ Este horario está bloqueado (&quot;
                    {validacionHorario.motivo || validacionHorario.mensaje}
                    &quot;).
                  </span>{" "}
                  ¿Deseás agendarlo como turno excepcional / urgencia?
                </div>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer select-none bg-white/85 dark:bg-slate-900/70 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100/50 dark:hover:bg-amber-900/30 transition-colors">
                <input
                  type="checkbox"
                  name="ignorarRestricciones"
                  checked={Boolean(datosFormulario.ignorarRestricciones)}
                  onChange={(e) =>
                    actualizarDatos({
                      target: {
                        name: "ignorarRestricciones",
                        value: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 rounded accent-amber-600 cursor-pointer"
                />
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  Autorizar turno excepcional / urgencia (ignorar restricción)
                </span>
              </label>
            </div>
          )}

          {/* Paciente (Solo visible al agendar un turno nuevo) */}
          {!editando && (
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-semibold text-gray-700">
                  Paciente{" "}
                  <span className="text-rose-500 font-extrabold">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setModalPacienteRapidoAbierto(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-[#2eb086] hover:text-[#259370] bg-[#e8f7f1] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  title="Crear paciente rápido"
                >
                  <UserPlus size={14} />
                  <span>+ Nuevo Paciente</span>
                </button>
              </div>
              <InputFiltro
                datos={pacientes}
                camposFiltrado={[
                  "nombre",
                  "apellido",
                  "dni",
                  "telefono",
                  "domicilio",
                ]}
                formatoVisual={(p) =>
                  `${p.nombre} ${p.apellido} - DNI: ${p.dni || "S/D"} - Telefono: ${p.telefono || "S/D"}`
                }
                placeholder="Busca un paciente..."
                alSeleccionar={(p) =>
                  actualizarDatos({
                    target: {
                      name: "id_paciente",
                      value: p?.id_paciente || "",
                    },
                  })
                }
                valorInicial={datosFormulario.id_paciente || ""}
              />
            </div>
          )}

          {/* Fecha y Hora de Inicio */}
          {!editando && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Fecha y Hora de Inicio{" "}
                <span className="text-rose-500 font-extrabold">*</span>
              </label>
              <input
                type="datetime-local"
                name="fecha_hora_inicio"
                value={
                  formatDateTimeInput(datosFormulario.fecha_hora_inicio) || ""
                }
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
                Duración (Minutos){" "}
                <span className="text-rose-500 font-extrabold">*</span>
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

          {/* Prácticas a Realizar (Opcional - Colocadas ARRIBA de las notas de la consulta) */}
          {(!editando || esProgramado) && (
            <div className="col-span-1 md:col-span-2 border-t border-gray-100 pt-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Prácticas a Realizar{" "}
                    <span className="text-xs font-normal text-gray-400">
                      (Opcional)
                    </span>
                  </label>
                  <p className="text-[11px] text-gray-500">
                    Podés programar qué tratamientos se realizarán. El arancel y
                    piezas dentales se registran al atender.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={agregarPracticaPlanificada}
                  className="flex items-center gap-1 text-xs font-semibold text-[#2eb086] hover:text-[#259370] bg-[#e8f7f1] px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  <Plus size={14} />
                  <span>+ Práctica</span>
                </button>
              </div>

              {practicasSeleccionadas.length === 0 ? (
                <div className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded-xl border border-dashed border-gray-200">
                  Sin prácticas programadas. Podés agregar una o más prácticas
                  si ya se conoce el motivo del turno.
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-1">
                  {practicasSeleccionadas.map((item, idx) => {
                    const idActual =
                      typeof item === "object" ? item.id_practica : item;
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-200 shadow-2xs"
                      >
                        <div className="flex-1">
                          <InputFiltro
                            datos={practicasLista}
                            camposFiltrado={[
                              "codigo_nomenclador",
                              "nombre_nomenclador",
                              "nombre_referencia",
                              "especialidad",
                            ]}
                            formatoVisual={(p) =>
                              `${p.codigo_nomenclador} - ${p.nombre_referencia} (${p.especialidad || p.codigo_nomenclador || "Práctica"})`
                            }
                            placeholder="Buscar práctica a realizar..."
                            alSeleccionar={(p) =>
                              actualizarPracticaPlanificada(
                                idx,
                                p?.id_practica || "",
                              )
                            }
                            valorInicial={idActual || ""}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => eliminarPracticaPlanificada(idx)}
                          className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                          title="Quitar práctica"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Notas / Observaciones (Debajo de las prácticas) */}
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Notas de la Consulta
            </label>
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

        {/* Acciones del Modal Fijas al Pie (Sin menú de estado) */}
        <div className="sticky bottom-0 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 mt-4 p-4 bg-white/95 backdrop-blur-xs border-t border-gray-100 flex items-center justify-end gap-3 z-20">
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
            {editando
              ? "Guardar Cambios"
              : validacionHorario &&
                  !validacionHorario.valido &&
                  datosFormulario.ignorarRestricciones
                ? "Confirmar Turno (Urgencia)"
                : "Confirmar Turno"}
          </button>
        </div>
      </Modal>

      {/* Modal Secundario: Crear Paciente Rápido */}
      {modalPacienteRapidoAbierto && (
        <Modal
          isOpen={modalPacienteRapidoAbierto}
          onClose={() => setModalPacienteRapidoAbierto(false)}
          onSubmit={guardarPacienteRapido}
          width="max-w-md"
          title="Crear Paciente Rápido"
        >
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Nombre <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="nombre"
                value={datosPacienteRapido.nombre}
                onChange={actualizarDatosPacienteRapido}
                required
                placeholder="Ej. Martín"
                className="w-full border border-gray-300 p-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Apellido <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="apellido"
                value={datosPacienteRapido.apellido}
                onChange={actualizarDatosPacienteRapido}
                required
                placeholder="Ej. Gómez"
                className="w-full border border-gray-300 p-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Teléfono <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                name="telefono"
                value={datosPacienteRapido.telefono}
                onChange={actualizarDatosPacienteRapido}
                required
                placeholder="Ej. 3514567890"
                className="w-full border border-gray-300 p-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                DNI (Opcional)
              </label>
              <input
                type="text"
                name="dni"
                value={datosPacienteRapido.dni}
                onChange={actualizarDatosPacienteRapido}
                placeholder="Ej. 38450123"
                className="w-full border border-gray-300 p-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Fecha de Nacimiento (Opcional)
              </label>
              <input
                type="date"
                name="fecha_nacimiento"
                value={datosPacienteRapido.fecha_nacimiento}
                onChange={actualizarDatosPacienteRapido}
                className="w-full border border-gray-300 p-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Domicilio (Opcional)
              </label>
              <input
                type="text"
                name="domicilio"
                value={datosPacienteRapido.domicilio}
                onChange={actualizarDatosPacienteRapido}
                placeholder="Ej. Av. Colón 1234"
                className="w-full border border-gray-300 p-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
              />
            </div>

            <div className="border-t border-gray-100 pt-3 mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalPacienteRapidoAbierto(false)}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold rounded-xl text-white bg-[#2eb086] hover:bg-[#259370] transition-all shadow-sm cursor-pointer"
              >
                Guardar Paciente
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

export default ModalTurnoForm;
