/** @format */

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X, UserCheck, ChevronRight, User, Check, Loader2 } from "lucide-react";
import api from "../../../services/api";
import toast from "react-hot-toast";
import Modal from "../../../components/common/Modal";

export const AdvertenciaPacienteIncompleto = ({ pacientes = [] }) => {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [pacienteEditando, setPacienteEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [datosForm, setDatosForm] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    dni: "",
    domicilio: "",
    fecha_nacimiento: "",
  });

  const pacientesIncompletos = useMemo(
    () =>
      (pacientes || []).filter(
        (p) => !p.dni || !p.domicilio || !p.fecha_nacimiento,
      ),
    [pacientes],
  );

  // Cerrar con Escape
  useEffect(() => {
    if (!modalAbierto) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setModalAbierto(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalAbierto]);

  const obtenerCamposFaltantes = (p) => {
    const faltantes = [];
    if (!p.dni) faltantes.push("DNI");
    if (!p.domicilio) faltantes.push("Domicilio");
    if (!p.fecha_nacimiento) faltantes.push("Fecha de Nacimiento");
    return faltantes;
  };

  const abrirCompletar = (p) => {
    setPacienteEditando(p);
    setDatosForm({
      nombre: p.nombre || "",
      apellido: p.apellido || "",
      telefono: p.telefono || "",
      dni: p.dni || "",
      domicilio: p.domicilio || "",
      fecha_nacimiento: p.fecha_nacimiento ? p.fecha_nacimiento.slice(0, 10) : "",
    });
  };

  const guardarDatosPaciente = async (e) => {
    e.preventDefault();
    if (!pacienteEditando) return;
    setGuardando(true);
    try {
      await api.put(`/pacientes/${pacienteEditando.id_paciente}`, {
        ...datosForm,
        dni: datosForm.dni?.trim() || null,
        domicilio: datosForm.domicilio?.trim() || null,
        fecha_nacimiento: datosForm.fecha_nacimiento || null,
      });
      // Actualizamos los datos en memoria
      pacienteEditando.dni = datosForm.dni?.trim() || null;
      pacienteEditando.domicilio = datosForm.domicilio?.trim() || null;
      pacienteEditando.fecha_nacimiento = datosForm.fecha_nacimiento || null;
      pacienteEditando.telefono = datosForm.telefono?.trim() || pacienteEditando.telefono;
      pacienteEditando.nombre = datosForm.nombre?.trim() || pacienteEditando.nombre;
      pacienteEditando.apellido = datosForm.apellido?.trim() || pacienteEditando.apellido;

      toast.success("Datos del paciente completados correctamente");
      setPacienteEditando(null);
    } catch (err) {
      console.error(err);
      toast.error("No se pudieron guardar los datos.");
    } finally {
      setGuardando(false);
    }
  };

  if (pacientesIncompletos.length === 0) {
    return null;
  }

  return (
    <>
      {/* Botón trigger compacto para el Header */}
      <button
        type="button"
        onClick={() => setModalAbierto(true)}
        className="group relative flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 rounded-lg text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
        title="Ver pacientes con datos faltantes"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
        </span>
        <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 shrink-0 group-hover:scale-110 transition-transform" />
        <span className="font-bold">{pacientesIncompletos.length}</span>
        <span className="hidden sm:inline font-medium">
          {pacientesIncompletos.length === 1 ? "incompleto" : "incompletos"}
        </span>
      </button>

      {/* Modal / Portal con la lista de pacientes faltantes */}
      {modalAbierto &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setModalAbierto(false)}
          >
            <div
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-amber-200/60 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header del Modal */}
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-amber-100 bg-amber-50/60">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-xs">
                    <AlertTriangle size={20} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h3 className="text-base font-bold text-gray-900 leading-tight">
                      Pacientes con datos faltantes
                    </h3>
                    <p className="text-xs text-amber-800/80 mt-0.5">
                      Hay {pacientesIncompletos.length}{" "}
                      {pacientesIncompletos.length === 1
                        ? "paciente que requiere"
                        : "pacientes que requieren"}{" "}
                      actualizar su ficha
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-white rounded-lg transition-colors cursor-pointer"
                  title="Cerrar"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Lista scrollable de pacientes */}
              <div className="p-4 sm:p-5 overflow-y-auto flex flex-col gap-2.5 divide-y divide-gray-100">
                {pacientesIncompletos.map((paciente) => {
                  const faltantes = obtenerCamposFaltantes(paciente);
                  return (
                    <div
                      key={paciente.id_paciente}
                      className="pt-2.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/80 p-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                          {paciente.nombre?.[0]?.toUpperCase() || <User size={14} />}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-gray-900 truncate">
                            {paciente.nombre} {paciente.apellido}
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="text-[11px] text-gray-500 font-medium">
                              Falta:
                            </span>
                            {faltantes.map((campo) => (
                              <span
                                key={campo}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200/60"
                              >
                                {campo}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => abrirCompletar(paciente)}
                        className="flex items-center justify-center gap-1.5 bg-[#2eb086] hover:bg-[#259370] text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs active:scale-95 shrink-0 cursor-pointer self-end sm:self-auto"
                      >
                        <UserCheck size={14} />
                        <span>Completar</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Footer del Modal */}
              <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>
                  Al completar los datos, el paciente dejará de figurar aquí.
                </span>
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Modal para completar datos sin navegar fuera de donde se encuentra */}
      {pacienteEditando && (
        <Modal
          isOpen={Boolean(pacienteEditando)}
          onClose={() => setPacienteEditando(null)}
          onSubmit={guardarDatosPaciente}
          width="max-w-2xl"
          title={`Completar Ficha: ${pacienteEditando.nombre} ${pacienteEditando.apellido}`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Nombre <span className="text-rose-500 font-extrabold">*</span>
              </label>
              <input
                type="text"
                required
                value={datosForm.nombre}
                onChange={(e) => setDatosForm({ ...datosForm, nombre: e.target.value })}
                className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Apellido <span className="text-rose-500 font-extrabold">*</span>
              </label>
              <input
                type="text"
                required
                value={datosForm.apellido}
                onChange={(e) => setDatosForm({ ...datosForm, apellido: e.target.value })}
                className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-gray-700">DNI</label>
                {!datosForm.dni && (
                  <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                    Dato faltante
                  </span>
                )}
              </div>
              <input
                type="text"
                placeholder="Ej: 38123456"
                value={datosForm.dni}
                onChange={(e) => setDatosForm({ ...datosForm, dni: e.target.value })}
                className={`w-full border p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors ${
                  !datosForm.dni
                    ? "border-amber-400 bg-amber-50/40 text-amber-950 focus:ring-amber-400/50"
                    : "border-gray-300 focus:ring-[#2eb086]/50"
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Teléfono <span className="text-rose-500 font-extrabold">*</span>
              </label>
              <input
                type="text"
                required
                value={datosForm.telefono}
                onChange={(e) => setDatosForm({ ...datosForm, telefono: e.target.value })}
                className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-gray-700">Fecha de Nacimiento</label>
                {!datosForm.fecha_nacimiento && (
                  <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                    Dato faltante
                  </span>
                )}
              </div>
              <input
                type="date"
                value={datosForm.fecha_nacimiento}
                onChange={(e) => setDatosForm({ ...datosForm, fecha_nacimiento: e.target.value })}
                className={`w-full border p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors ${
                  !datosForm.fecha_nacimiento
                    ? "border-amber-400 bg-amber-50/40 text-amber-950 focus:ring-amber-400/50"
                    : "border-gray-300 focus:ring-[#2eb086]/50"
                }`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-gray-700">Domicilio</label>
                {!datosForm.domicilio && (
                  <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                    Dato faltante
                  </span>
                )}
              </div>
              <input
                type="text"
                placeholder="Ej: Av. Colón 1234"
                value={datosForm.domicilio}
                onChange={(e) => setDatosForm({ ...datosForm, domicilio: e.target.value })}
                className={`w-full border p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors ${
                  !datosForm.domicilio
                    ? "border-amber-400 bg-amber-50/40 text-amber-950 focus:ring-amber-400/50"
                    : "border-gray-300 focus:ring-[#2eb086]/50"
                }`}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              disabled={guardando}
              onClick={() => setPacienteEditando(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#2eb086] hover:bg-[#259370] transition-colors shadow-sm cursor-pointer"
            >
              {guardando ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Check size={14} />
              )}
              <span>Guardar Cambios</span>
            </button>
          </div>
        </Modal>
      )}
    </>
  );
};
