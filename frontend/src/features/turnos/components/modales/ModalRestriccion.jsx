/** @format */

import { useState, useEffect } from "react";
import { Lock, Trash2, Calendar, Clock, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "../../../../components/common/Modal";

const MOTIVOS_SUGERIDOS = [
  "Vacaciones",
  "Médico / Salud",
  "Trámite personal",
  "Feriado / Asueto",
  "Capacitación / Curso",
  "Consultorio cerrado",
];

export default function ModalRestriccion({
  isOpen,
  onClose,
  rangoFechas, // { inicio: Date, fin: Date }
  onGuardar,
  onEliminar,
  restriccionesExistentes = [],
}) {
  const [todoElDia, setTodoElDia] = useState(true);
  const [horaInicio, setHoraInicio] = useState("08:00");
  const [horaFin, setHoraFin] = useState("10:00");
  const [motivo, setMotivo] = useState("Vacaciones");
  const [motivoPersonalizado, setMotivoPersonalizado] = useState("");

  const fechaInicioObj = rangoFechas?.inicio || new Date();
  const fechaFinObj = rangoFechas?.fin || fechaInicioObj;

  const formatearFechaLocal = (d) => {
    if (!d) return "";
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const esRangoVariosDias =
    fechaInicioObj.toDateString() !== fechaFinObj.toDateString();

  useEffect(() => {
    if (isOpen) {
      if (esRangoVariosDias) {
        setTodoElDia(true);
        setMotivo("Vacaciones");
      } else {
        setTodoElDia(false);
        setHoraInicio("08:00");
        setHoraFin("10:00");
        setMotivo("Trámite personal");
      }
      setMotivoPersonalizado("");
    }
  }, [isOpen, esRangoVariosDias]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!todoElDia && horaFin <= horaInicio) {
      toast.error("La hora de fin debe ser posterior a la hora de inicio.");
      return;
    }

    const motivoFinal =
      motivo === "Otro"
        ? motivoPersonalizado.trim() || "Bloqueado"
        : motivo;

    onGuardar({
      fechaInicio: formatearFechaLocal(fechaInicioObj),
      fechaFin: formatearFechaLocal(fechaFinObj),
      todoElDia,
      horaInicio: todoElDia ? null : horaInicio,
      horaFin: todoElDia ? null : horaFin,
      motivo: motivoFinal,
    });

    toast.success("Restricción de agenda guardada con éxito.", { icon: "🔒" });
    onClose();
  };

  const fechaTexto = esRangoVariosDias
    ? `${fechaInicioObj.toLocaleDateString("es-AR", { day: "numeric", month: "short" })} al ${fechaFinObj.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}`
    : fechaInicioObj.toLocaleDateString("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bloqueo de Horario / Restricción"
      width="max-w-md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Banner de fecha seleccionada */}
        <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 bg-slate-700 text-white rounded-lg">
            <Calendar size={18} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {esRangoVariosDias ? "Período seleccionado" : "Día seleccionado"}
            </span>
            <span className="text-sm font-black text-slate-800 capitalize">
              {fechaTexto}
            </span>
          </div>
        </div>

        {/* Tipo de Bloqueo: Día completo o Franja Horaria */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-gray-700">
            Tipo de restricción:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTodoElDia(true)}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                todoElDia
                  ? "bg-slate-800 text-white border-slate-800 shadow-xs"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              Día(s) Completo(s)
            </button>
            <button
              type="button"
              onClick={() => setTodoElDia(false)}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                !todoElDia
                  ? "bg-slate-800 text-white border-slate-800 shadow-xs"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              Franja Horaria
            </button>
          </div>
        </div>

        {/* Horarios si es franja horaria */}
        {!todoElDia && (
          <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-gray-600 flex items-center gap-1">
                <Clock size={12} />
                <span>Desde:</span>
              </label>
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="p-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-slate-700"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-gray-600 flex items-center gap-1">
                <Clock size={12} />
                <span>Hasta:</span>
              </label>
              <input
                type="time"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                className="p-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-slate-700"
                required
              />
            </div>
          </div>
        )}

        {/* Motivo de la Restricción */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-gray-700">
            Motivo / Razón del bloqueo:
          </label>
          <select
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="p-2.5 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-slate-700"
          >
            {MOTIVOS_SUGERIDOS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
            <option value="Otro">Otro motivo...</option>
          </select>

          {motivo === "Otro" && (
            <input
              type="text"
              placeholder="Especificar motivo (ej: Conferencia)"
              value={motivoPersonalizado}
              onChange={(e) => setMotivoPersonalizado(e.target.value)}
              className="p-2.5 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-800 mt-1 focus:outline-none focus:ring-1 focus:ring-slate-700"
              required
            />
          )}
        </div>

        {/* Bloqueos existentes en esta fecha (si hay) */}
        {restriccionesExistentes.length > 0 && (
          <div className="border-t border-gray-200 pt-3 flex flex-col gap-2">
            <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
              <AlertCircle size={14} className="text-amber-500" />
              <span>Bloqueos existentes en este día:</span>
            </span>
            <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
              {restriccionesExistentes.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-100 border border-gray-200 text-xs"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-800">{r.motivo}</span>
                    <span className="text-[11px] text-gray-500">
                      {r.todoElDia
                        ? "Día completo"
                        : `${r.horaInicio} - ${r.horaFin} hs`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onEliminar(r.id);
                      toast.success("Restricción eliminada.");
                    }}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Eliminar bloqueo"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Lock size={14} />
            <span>Guardar Bloqueo</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
