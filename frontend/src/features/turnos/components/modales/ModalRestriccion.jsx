/** @format */

import { useState, useEffect, useRef, useMemo, memo } from "react";
import { createPortal } from "react-dom";
import { Lock, X, Calendar, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";

const MOTIVOS_SUGERIDOS = [
  "Día no laborable / Feriado",
  "Vacaciones",
  "Capacitación / Congreso",
  "Médico / Salud",
  "Trámite personal",
  "Consultorio cerrado",
  "Otro motivo...",
];

const FMT_FECHA_LARGA = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const formatearFechaLocal = (d) => {
  if (!d) return "";
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const ModalRestriccion = memo(function ModalRestriccion({
  isOpen,
  onClose,
  rangoFechas, // { inicio: Date, fin: Date }
  onGuardar,
}) {
  const [alcance, setAlcance] = useState("franja"); // "franja" | "dia_completo"
  const [horaInicio, setHoraInicio] = useState("08:00");
  const [horaFin, setHoraFin] = useState("10:00");
  const [bloquearVariosDias, setBloquearVariosDias] = useState(false);
  const [fechaFinPersonalizada, setFechaFinPersonalizada] = useState("");
  const [motivo, setMotivo] = useState("Día no laborable / Feriado");
  const [motivoOtro, setMotivoOtro] = useState("");

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const fechaInicioTime = rangoFechas?.inicio
    ? rangoFechas.inicio.getTime()
    : 0;
  const fechaFinTime = rangoFechas?.fin
    ? rangoFechas.fin.getTime()
    : fechaInicioTime;

  const { fechaInicioStr, fechaFinStrInicial, esRangoVariosDias, fechaTextoCap } =
    useMemo(() => {
      if (!isOpen) {
        return {
          fechaInicioStr: "",
          fechaFinStrInicial: "",
          esRangoVariosDias: false,
          fechaTextoCap: "",
        };
      }
      const dInicio = fechaInicioTime ? new Date(fechaInicioTime) : new Date();
      const dFin = fechaFinTime ? new Date(fechaFinTime) : dInicio;
      const strIni = formatearFechaLocal(dInicio);
      const strFin = formatearFechaLocal(dFin);
      const varios = strIni !== strFin;

      const txt = FMT_FECHA_LARGA.format(dInicio);
      const txtCap = txt.charAt(0).toUpperCase() + txt.slice(1);

      return {
        fechaInicioStr: strIni,
        fechaFinStrInicial: strFin,
        esRangoVariosDias: varios,
        fechaTextoCap: txtCap,
      };
    }, [isOpen, fechaInicioTime, fechaFinTime]);

  useEffect(() => {
    if (!isOpen) return;

    if (esRangoVariosDias) {
      setAlcance("dia_completo");
      setBloquearVariosDias(true);
      setFechaFinPersonalizada(fechaFinStrInicial);
      setMotivo("Vacaciones");
    } else {
      setAlcance("franja");
      setBloquearVariosDias(false);
      setHoraInicio("08:00");
      setHoraFin("10:00");
      const manana = fechaInicioTime ? new Date(fechaInicioTime) : new Date();
      manana.setDate(manana.getDate() + 1);
      setFechaFinPersonalizada(formatearFechaLocal(manana));
      setMotivo("Día no laborable / Feriado");
    }
    setMotivoOtro("");
  }, [isOpen, esRangoVariosDias, fechaFinStrInicial, fechaInicioTime]);

  // Cerrar al presionar Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onCloseRef.current?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const esDiaCompleto = alcance === "dia_completo";

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!esDiaCompleto && horaFin <= horaInicio) {
      toast.error("La hora de fin debe ser posterior a la hora de inicio.");
      return;
    }

    let fechaFinFinal = fechaInicioStr;

    if (esDiaCompleto) {
      if (bloquearVariosDias && fechaFinPersonalizada) {
        if (fechaFinPersonalizada < fechaInicioStr) {
          toast.error(
            "La fecha límite no puede ser anterior a la fecha de inicio.",
          );
          return;
        }
        fechaFinFinal = fechaFinPersonalizada;
      } else if (esRangoVariosDias) {
        fechaFinFinal = fechaFinStrInicial;
      }
    }

    const motivoFinal =
      motivo === "Otro motivo..."
        ? motivoOtro.trim() || "Bloqueado"
        : motivo;

    onGuardar({
      fechaInicio: fechaInicioStr,
      fechaFin: fechaFinFinal,
      todoElDia: esDiaCompleto,
      horaInicio: esDiaCompleto ? null : horaInicio,
      horaFin: esDiaCompleto ? null : horaFin,
      motivo: motivoFinal,
    });

    toast.success("Horario bloqueado con éxito.", { icon: "🔒" });
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/45"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 flex flex-col gap-4 max-h-[92vh] overflow-y-auto scrollbar-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header del Modal */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
              <Lock size={18} />
            </div>
            <div className="flex flex-col">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
                Bloquear Horario
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Impedir que se asignen turnos en este período
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Banner de Fecha Seleccionada */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3 sm:p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 flex items-center justify-center shrink-0 shadow-2xs">
              <Calendar size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                FECHA A BLOQUEAR
              </span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {fechaTextoCap}
              </span>
            </div>
          </div>

          {/* Alcance del Bloqueo: Segmented Control */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Alcance del Bloqueo
            </label>
            <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl flex items-center gap-1 border border-slate-200/60 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setAlcance("franja")}
                className={`py-2 px-4 rounded-lg text-xs transition-colors flex-1 text-center cursor-pointer ${
                  !esDiaCompleto
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-900 dark:border-slate-100 font-bold shadow-2xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 font-medium"
                }`}
              >
                Franja Horaria
              </button>
              <button
                type="button"
                onClick={() => setAlcance("dia_completo")}
                className={`py-2 px-4 rounded-lg text-xs transition-colors flex-1 text-center cursor-pointer ${
                  esDiaCompleto
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-900 dark:border-slate-100 font-bold shadow-2xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 font-medium"
                }`}
              >
                Día Completo
              </button>
            </div>
          </div>

          {/* Si es Franja Horaria: Hora Inicio y Hora Fin */}
          {!esDiaCompleto && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Hora Inicio
                </label>
                <input
                  type="time"
                  required
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Hora Fin
                </label>
                <input
                  type="time"
                  required
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100"
                />
              </div>
            </div>
          )}

          {/* Si es Día Completo: Opción de bloquear varios días continuos */}
          {esDiaCompleto && (
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 p-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <input
                  type="checkbox"
                  checked={bloquearVariosDias}
                  onChange={(e) => setBloquearVariosDias(e.target.checked)}
                  className="w-4 h-4 rounded text-slate-900 dark:text-slate-100 accent-slate-900 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Bloquear varios días continuos{" "}
                  <span className="text-slate-400 font-normal">
                    (Vacaciones/Congreso)
                  </span>
                </span>
              </label>

              {bloquearVariosDias && (
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Bloquear hasta el día:
                  </label>
                  <input
                    type="date"
                    required
                    min={fechaInicioStr}
                    value={fechaFinPersonalizada}
                    onChange={(e) => setFechaFinPersonalizada(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100"
                  />
                </div>
              )}
            </div>
          )}

          {/* Motivo del Bloqueo */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Motivo del Bloqueo
            </label>
            <div className="relative flex items-center">
              <select
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full appearance-none px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086] cursor-pointer"
              >
                {MOTIVOS_SUGERIDOS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={15}
                className="absolute right-3 text-slate-400 pointer-events-none"
              />
            </div>

            {motivo === "Otro motivo..." && (
              <input
                type="text"
                placeholder="Especificar motivo (ej: Mantenimiento de consultorio)"
                required
                value={motivoOtro}
                onChange={(e) => setMotivoOtro(e.target.value)}
                className="mt-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50"
              />
            )}
          </div>

          {/* Footer de Acciones */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/90 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1e293b] hover:bg-[#0f172a] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer active:scale-95"
            >
              <Lock size={14} />
              <span>
                {esDiaCompleto ? "Bloquear Día Completo" : "Bloquear Horario"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
});

export default ModalRestriccion;
