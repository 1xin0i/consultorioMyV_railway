/** @format */

import { useState, useMemo, useEffect, useCallback, memo } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X, ChevronDown, Check, Loader2 } from "lucide-react";
import api from "../../../services/api";
import toast from "react-hot-toast";
import {
  obtenerColorAvatar,
  obtenerIniciales,
} from "../../../utils/avatarColors";

const obtenerCamposFaltantes = (p) => {
  const faltantes = [];
  if (!p.dni) faltantes.push("DNI");
  if (!p.fecha_nacimiento) faltantes.push("Fecha Nac.");
  if (!p.domicilio) faltantes.push("Domicilio");
  return faltantes;
};

const FilaPacienteIncompleto = memo(function FilaPacienteIncompleto({
  paciente,
  estaExpandido,
  onToggle,
  onGuardadoExitoso,
}) {
  const [guardando, setGuardando] = useState(false);
  const [datosForm, setDatosForm] = useState({
    dni: "",
    domicilio: "",
    fecha_nacimiento: "",
  });

  useEffect(() => {
    if (estaExpandido) {
      setDatosForm({
        dni: paciente.dni || "",
        domicilio: paciente.domicilio || "",
        fecha_nacimiento: paciente.fecha_nacimiento
          ? paciente.fecha_nacimiento.slice(0, 10)
          : "",
      });
    }
  }, [estaExpandido, paciente.dni, paciente.domicilio, paciente.fecha_nacimiento]);

  const { faltantes, col, ini } = useMemo(() => {
    return {
      faltantes: obtenerCamposFaltantes(paciente),
      col: obtenerColorAvatar(
        `${paciente.nombre || ""} ${paciente.apellido || ""}`,
      ),
      ini: obtenerIniciales(paciente.nombre, paciente.apellido),
    };
  }, [
    paciente.nombre,
    paciente.apellido,
    paciente.dni,
    paciente.fecha_nacimiento,
    paciente.domicilio,
  ]);

  const guardarDatosPaciente = async (e) => {
    e.preventDefault();
    setGuardando(true);
    const nuevoDni = datosForm.dni?.trim() || null;
    const nuevoDomicilio = datosForm.domicilio?.trim() || null;
    const nuevaFechaNac = datosForm.fecha_nacimiento || null;

    try {
      await api.put(`/pacientes/${paciente.id_paciente}`, {
        nombre: paciente.nombre,
        apellido: paciente.apellido,
        telefono: paciente.telefono,
        dni: nuevoDni,
        domicilio: nuevoDomicilio,
        fecha_nacimiento: nuevaFechaNac,
      });

      toast.success("Ficha del paciente actualizada con éxito");
      onGuardadoExitoso(paciente.id_paciente, {
        dni: nuevoDni,
        domicilio: nuevoDomicilio,
        fecha_nacimiento: nuevaFechaNac,
      });
    } catch (err) {
      console.error(err);
      toast.error("No se pudieron guardar los datos.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3 sm:p-4 bg-white dark:bg-slate-900/60 shadow-2xs flex flex-col">
      {/* Fila principal del paciente: clickeable en toda la línea para expandir */}
      <div
        onClick={() => onToggle(paciente.id_paciente)}
        className="flex items-center justify-between gap-3 cursor-pointer select-none group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-9 h-9 rounded-full ${col.bg} ${col.text} border ${col.border} flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs`}
          >
            {ini}
          </div>

          <div className="flex flex-col min-w-0">
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-tight truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
              {paciente.nombre} {paciente.apellido}
            </span>

            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
              {faltantes.map((campo, idx) => (
                <span
                  key={campo}
                  className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60"
                >
                  {idx === 0 ? `Falta: ${campo}` : campo}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Botón trigger para expandir el formulario inline */}
        {estaExpandido ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(paciente.id_paciente);
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            <span>Editar</span>
            <ChevronDown size={14} className="rotate-180 transition-transform" />
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(paciente.id_paciente);
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            <span>Completar</span>
            <ChevronDown size={14} />
          </button>
        )}
      </div>

      {/* Formulario Inline Expandido */}
      {estaExpandido && (
        <form
          onSubmit={guardarDatosPaciente}
          className="mt-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                DNI <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ej: 38123456"
                value={datosForm.dni}
                onChange={(e) =>
                  setDatosForm((prev) => ({
                    ...prev,
                    dni: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Fecha de Nacimiento
              </label>
              <input
                type="date"
                value={datosForm.fecha_nacimiento}
                onChange={(e) =>
                  setDatosForm((prev) => ({
                    ...prev,
                    fecha_nacimiento: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Domicilio
            </label>
            <input
              type="text"
              placeholder="Ej: Av. Colón 1234"
              value={datosForm.domicilio}
              onChange={(e) =>
                setDatosForm((prev) => ({
                  ...prev,
                  domicilio: e.target.value,
                }))
              }
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
            />
          </div>

          {/* Acciones de guardar / cancelar ficha inline */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => onToggle(paciente.id_paciente)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0d8266] hover:bg-[#0b6f57] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {guardando ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Check size={14} />
              )}
              <span>Guardar Ficha</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
});

export const AdvertenciaPacienteIncompleto = memo(
  function AdvertenciaPacienteIncompleto({ pacientes = [], setPacientes }) {
    const [modalAbierto, setModalAbierto] = useState(false);
    const [pacienteEditandoId, setPacienteEditandoId] = useState(null);
    const [versionLocal, setVersionLocal] = useState(0);

    const pacientesIncompletos = useMemo(
      () =>
        (pacientes || []).filter(
          (p) => !p.dni || !p.domicilio || !p.fecha_nacimiento,
        ),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [pacientes, versionLocal],
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

    const handleToggleEditar = useCallback((idPaciente) => {
      setPacienteEditandoId((prev) => (prev === idPaciente ? null : idPaciente));
    }, []);

    const handleGuardadoExitoso = useCallback(
      (idPaciente, nuevosCampos) => {
        if (typeof setPacientes === "function") {
          setPacientes((prev) =>
            prev.map((p) =>
              p.id_paciente === idPaciente ? { ...p, ...nuevosCampos } : p,
            ),
          );
        } else {
          const target = (pacientes || []).find(
            (p) => p.id_paciente === idPaciente,
          );
          if (target) {
            Object.assign(target, nuevosCampos);
            setVersionLocal((v) => v + 1);
          }
        }
        setPacienteEditandoId(null);
      },
      [pacientes, setPacientes],
    );

    if (pacientesIncompletos.length === 0) {
      return null;
    }

    return (
      <>
        {/* Botón trigger compacto para el Header */}
        <button
          type="button"
          onClick={() => setModalAbierto(true)}
          className="group relative flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300/80 dark:border-amber-700/70 rounded-xl text-xs font-semibold shadow-2xs transition-colors active:scale-95 cursor-pointer"
          title="Ver fichas de pacientes incompletas"
        >
          <span className="inline-flex rounded-full h-2 w-2 bg-amber-500 shrink-0" />
          <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="font-bold">{pacientesIncompletos.length}</span>
          <span className="hidden sm:inline font-medium">
            {pacientesIncompletos.length === 1
              ? "ficha incompleta"
              : "fichas incompletas"}
          </span>
        </button>

        {/* Modal principal */}
        {modalAbierto &&
          typeof document !== "undefined" &&
          createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/45"
              onClick={() => setModalAbierto(false)}
            >
              <div
                className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 flex flex-col gap-4 max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header del Modal */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-100/80 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-2xs">
                      <AlertTriangle size={20} />
                    </div>
                    <div className="flex flex-col">
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
                        Fichas Incompletas
                      </h2>
                      <p className="text-xs text-amber-800/90 dark:text-amber-400 font-medium">
                        Hay {pacientesIncompletos.length}{" "}
                        {pacientesIncompletos.length === 1
                          ? "paciente que requiere"
                          : "pacientes que requieren"}{" "}
                        actualizar sus datos personales
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setModalAbierto(false)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Cerrar"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Lista scrollable de pacientes con edición inline tipo acordeón */}
                <div className="overflow-y-auto flex flex-col gap-3 pr-1 py-1 scrollbar-none flex-1">
                  {pacientesIncompletos.map((paciente) => (
                    <FilaPacienteIncompleto
                      key={paciente.id_paciente}
                      paciente={paciente}
                      estaExpandido={pacienteEditandoId === paciente.id_paciente}
                      onToggle={handleToggleEditar}
                      onGuardadoExitoso={handleGuardadoExitoso}
                    />
                  ))}
                </div>

                {/* Footer del Modal */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200/90 dark:border-slate-800 text-xs">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs">
                    Al guardar los datos requeridos, el paciente desaparecerá de
                    esta lista.
                  </span>
                  <button
                    type="button"
                    onClick={() => setModalAbierto(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )}
      </>
    );
  },
);

export default AdvertenciaPacienteIncompleto;
