/** @format */

import { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import { pacientesApi } from "@/features/pacientes";
import { formatDateInput } from "@/shared/utils";
import {
  obtenerColorAvatar,
  obtenerIniciales,
} from "@/shared/utils/avatarColors";
import { manejarErrorApi } from "@/shared/utils/errorHandler";
import { obtenerCamposFaltantesPaciente } from "../../utils/pacienteIncompletoUtils";

export function ModalFichasIncompletas({
  isOpen,
  onClose,
  pacientes = [],
  onPacienteActualizado,
}) {
  const [pacienteEditandoId, setPacienteEditandoId] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [formDatos, setFormDatos] = useState({
    dni: "",
    fecha_nacimiento: "",
    domicilio: "",
    telefono: "",
  });

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      setPacienteEditandoId(null);
      return;
    }

    const manejarTecla = (e) => {
      if (e.key === "Escape") {
        onCloseRef.current?.();
      }
    };

    window.addEventListener("keydown", manejarTecla);
    return () => window.removeEventListener("keydown", manejarTecla);
  }, [isOpen]);

  const pacientesIncompletos = useMemo(() => {
    return (pacientes || []).filter((p) => {
      if (p.activo === false) return false;
      return obtenerCamposFaltantesPaciente(p).length > 0;
    });
  }, [pacientes]);

  const abrirEdicion = (paciente) => {
    if (pacienteEditandoId === paciente.id_paciente) {
      setPacienteEditandoId(null);
      return;
    }
    setPacienteEditandoId(paciente.id_paciente);
    setFormDatos({
      dni: paciente.dni || "",
      fecha_nacimiento: paciente.fecha_nacimiento
        ? formatDateInput(paciente.fecha_nacimiento)
        : "",
      domicilio: paciente.domicilio || "",
      telefono: paciente.telefono || "",
    });
  };

  const cancelarEdicion = () => {
    setPacienteEditandoId(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormDatos((prev) => ({ ...prev, [name]: value }));
  };

  const guardarFicha = async (e, paciente) => {
    e.preventDefault();
    setGuardando(true);

    try {
      const payload = {
        nombre: paciente.nombre?.trim(),
        apellido: paciente.apellido?.trim(),
        dni: formDatos.dni?.trim() || null,
        fecha_nacimiento: formDatos.fecha_nacimiento || null,
        domicilio: formDatos.domicilio?.trim() || null,
        telefono: formDatos.telefono?.trim() || paciente.telefono || null,
        activo: paciente.activo !== undefined ? paciente.activo : true,
      };

      const res = await pacientesApi.actualizar(paciente.id_paciente, payload);
      const pacienteActualizado = res.data?.data || {
        ...paciente,
        ...payload,
      };

      toast.success(
        `Ficha de ${paciente.nombre} ${paciente.apellido} actualizada.`,
      );
      setPacienteEditandoId(null);

      if (typeof onPacienteActualizado === "function") {
        onPacienteActualizado(pacienteActualizado);
      }
    } catch (error) {
      console.error("Error al actualizar paciente:", error);
      manejarErrorApi(error, "No se pudieron actualizar los datos del paciente.");
    } finally {
      setGuardando(false);
    }
  };

  if (!isOpen) return null;

  const total = pacientesIncompletos.length;

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh] animate-in slide-in-from-bottom sm:zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado pastel ámbar */}
        <div className="flex items-start justify-between px-5 py-4 sm:px-6 sm:py-4.5 bg-[#fffdf0] dark:bg-amber-950/40 border-b border-amber-200/80 dark:border-amber-800/60 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/70 flex items-center justify-center shrink-0 shadow-2xs">
              <AlertTriangle size={22} className="text-amber-700 dark:text-amber-400" />
            </div>
            <div className="flex flex-col min-w-0">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-snug truncate">
                Fichas Incompletas
              </h2>
              <p className="text-xs text-amber-800 dark:text-amber-300 font-semibold mt-0.5 leading-snug">
                {total === 1
                  ? "Hay 1 paciente que requiere actualizar sus datos personales"
                  : `Hay ${total} pacientes que requieren actualizar sus datos personales`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0"
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Lista de pacientes con fichas incompletas */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-4 divide-y divide-slate-100 dark:divide-slate-800">
          {total === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                ¡Todas las fichas están completas!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                No hay pacientes con datos pendientes de actualización en el sistema.
              </p>
            </div>
          ) : (
            pacientesIncompletos.map((paciente, idx) => {
              const iniciales = obtenerIniciales(
                paciente.nombre,
                paciente.apellido,
              );
              const avatarColor = obtenerColorAvatar(
                `${paciente.nombre} ${paciente.apellido}`,
              );
              const camposFaltantes = obtenerCamposFaltantesPaciente(paciente);
              const estaEditando = pacienteEditandoId === paciente.id_paciente;

              return (
                <div
                  key={paciente.id_paciente}
                  className={`flex flex-col ${idx > 0 ? "pt-4" : ""}`}
                >
                  {/* Fila principal del paciente */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-9 h-9 rounded-full border text-xs font-extrabold flex items-center justify-center shrink-0 ${avatarColor.bg} ${avatarColor.text} ${avatarColor.border}`}
                      >
                        {iniciales}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">
                          {paciente.nombre} {paciente.apellido}
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                          {camposFaltantes.map((campo, cIdx) => (
                            <span
                              key={campo.key}
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold border border-amber-300/90 dark:border-amber-800/80 bg-amber-50/80 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                            >
                              {cIdx === 0
                                ? `Falta: ${campo.label}`
                                : campo.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => abrirEdicion(paciente)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 shadow-2xs ${
                        estaEditando
                          ? "bg-teal-50 dark:bg-teal-950/60 text-[#0d8266] dark:text-teal-300 border border-teal-300 dark:border-teal-800"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                      }`}
                    >
                      <span>{estaEditando ? "Editar" : "Completar"}</span>
                      {estaEditando ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} className="opacity-60" />
                      )}
                    </button>
                  </div>

                  {/* Formulario inline desplegable */}
                  {estaEditando && (
                    <form
                      onSubmit={(e) => guardarFicha(e, paciente)}
                      className="mt-3 p-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl shadow-xs flex flex-col gap-3.5 animate-in slide-in-from-top-2 duration-150"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            DNI <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="dni"
                            value={formDatos.dni}
                            onChange={handleInputChange}
                            placeholder="Ej: 38123456"
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2eb086]/30 focus:border-[#2eb086]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Fecha de Nacimiento
                          </label>
                          <input
                            type="date"
                            name="fecha_nacimiento"
                            value={formDatos.fecha_nacimiento}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2eb086]/30 focus:border-[#2eb086]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Domicilio
                        </label>
                        <input
                          type="text"
                          name="domicilio"
                          value={formDatos.domicilio}
                          onChange={handleInputChange}
                          placeholder="Ej: Av. Colón 1234"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2eb086]/30 focus:border-[#2eb086]"
                        />
                      </div>

                      {/* Si le falta el teléfono, también se incluye para completar */}
                      {(!paciente.telefono || String(paciente.telefono).trim() === "") && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Teléfono <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="telefono"
                            value={formDatos.telefono}
                            onChange={handleInputChange}
                            placeholder="Ej: 3511234567"
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2eb086]/30 focus:border-[#2eb086]"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-3 pt-1">
                        <button
                          type="button"
                          onClick={cancelarEdicion}
                          className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer px-2 py-1"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={guardando}
                          className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#0d8266] hover:bg-[#09664f] shadow-xs cursor-pointer disabled:opacity-50 transition-all"
                        >
                          {guardando ? "Guardando..." : "Guardar Ficha"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer del modal */}
        <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-3.5 flex items-center justify-between text-xs bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <span className="text-slate-500 dark:text-slate-400 font-medium truncate pr-2">
            Al guardar los datos requeridos, el paciente desaparecerá de esta lista.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default ModalFichasIncompletas;
