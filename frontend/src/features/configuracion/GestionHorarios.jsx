/** @format */

import { useState, useEffect } from "react";
import { Clock, Calendar, Check } from "lucide-react";
import toast from "react-hot-toast";
import Header from "../../components/common/Header";
import { useConfiguracion } from "../../context/ConfiguracionContext";

const DIAS_SEMANA = [
  { id: 1, label: "Lunes" },
  { id: 2, label: "Martes" },
  { id: 3, label: "Miércoles" },
  { id: 4, label: "Jueves" },
  { id: 5, label: "Viernes" },
  { id: 6, label: "Sábado" },
  { id: 0, label: "Domingo" },
];

export default function GestionHorarios() {
  const {
    config,
    actualizarConfiguracion,
    horaInicioNum,
    horaFinNum,
    totalModulosDia,
  } = useConfiguracion();

  const [form, setForm] = useState({
    horaInicio: config.horaInicio || "08:00",
    horaFin: config.horaFin || "20:00",
    duracionModuloMinutos: config.duracionModuloMinutos || 30,
    diasLaborales: config.diasLaborales || [1, 2, 3, 4, 5, 6],
  });

  useEffect(() => {
    setForm({
      horaInicio: config.horaInicio || "08:00",
      horaFin: config.horaFin || "20:00",
      duracionModuloMinutos: config.duracionModuloMinutos || 30,
      diasLaborales: config.diasLaborales || [1, 2, 3, 4, 5, 6],
    });
  }, [config]);

  const toggleDia = (diaId) => {
    setForm((prev) => {
      const existe = prev.diasLaborales.includes(diaId);
      if (existe) {
        if (prev.diasLaborales.length <= 1) {
          toast.error("Debe haber al menos 1 día laboral configurado.");
          return prev;
        }
        return {
          ...prev,
          diasLaborales: prev.diasLaborales.filter((d) => d !== diaId),
        };
      }
      return {
        ...prev,
        diasLaborales: [...prev.diasLaborales, diaId].sort(),
      };
    });
  };

  const handleGuardar = (e) => {
    e.preventDefault();
    const hInicio = parseInt(form.horaInicio.split(":")[0], 10);
    const hFin = parseInt(form.horaFin.split(":")[0], 10);

    if (hFin <= hInicio) {
      toast.error("La hora de fin debe ser posterior a la hora de inicio.");
      return;
    }

    actualizarConfiguracion(form);
    toast.success("Horarios de atención actualizados correctamente.", {
      icon: "⏰",
    });
  };

  const horasJornada = Math.max(0, horaFinNum - horaInicioNum);

  return (
    <div className="w-full min-h-screen flex flex-col">
      {/* Cabecera común unificada */}
      <Header
        icono={Clock}
        titulo="Horarios de Atención"
        subtitulo="Horario de atención"
      />

      <div className="w-full max-w-4xl mx-auto p-4 md:p-6 flex flex-col gap-6">
        <form onSubmit={handleGuardar} className="flex flex-col gap-6">
        {/* Tarjetas de Selección Horaria */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Hora Inicio */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <span>Hora de Apertura</span>
            </label>
            <select
              value={form.horaInicio}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, horaInicio: e.target.value }))
              }
              className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2eb086] cursor-pointer"
            >
              {Array.from({ length: 15 }, (_, i) => i + 6).map((h) => {
                const str = `${h.toString().padStart(2, "0")}:00`;
                return (
                  <option key={str} value={str}>
                    {str} hs
                  </option>
                );
              })}
            </select>
            <span className="text-[11px] text-gray-400">
              Inicio de los turnos en agenda
            </span>
          </div>

          {/* Hora Fin */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <span>Hora de Cierre</span>
            </label>
            <select
              value={form.horaFin}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, horaFin: e.target.value }))
              }
              className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2eb086] cursor-pointer"
            >
              {Array.from({ length: 15 }, (_, i) => i + 12).map((h) => {
                const str = `${h.toString().padStart(2, "0")}:00`;
                return (
                  <option key={str} value={str}>
                    {str} hs
                  </option>
                );
              })}
            </select>
            <span className="text-[11px] text-gray-400">
              Cierre de atención en el consultorio
            </span>
          </div>

          {/* Duración de Módulo */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <span>Módulo por Turno</span>
            </label>
            <select
              value={form.duracionModuloMinutos}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  duracionModuloMinutos: Number(e.target.value),
                }))
              }
              className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2eb086] cursor-pointer"
            >
              <option value={15}>15 minutos</option>
              <option value={20}>20 minutos</option>
              <option value={30}>30 minutos (Estándar)</option>
              <option value={45}>45 minutos</option>
              <option value={60}>1 hora</option>
            </select>
            <span className="text-[11px] text-gray-400">
              División de slots en la grilla
            </span>
          </div>
        </div>

        {/* Resumen Dinámico en Tiempo Real */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-emerald-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#2eb086] text-white rounded-xl shadow-xs">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-sm font-bold">
                Jornada configurada: {horasJornada} horas de atención
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Capacidad máxima de{" "}
                <span className="font-extrabold">{totalModulosDia} módulos/turnos</span>{" "}
                por día ({form.horaInicio} a {form.horaFin}).
              </p>
            </div>
          </div>

          <div className="text-xs font-semibold px-3 py-1.5 bg-white text-emerald-800 rounded-xl border border-emerald-200/80 shrink-0">
            Base mensual: 100% = {totalModulosDia} módulos
          </div>
        </div>

        {/* Selección de Días de Atención */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col gap-3">
          <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <Calendar size={18} className="text-[#2eb086]" />
            <span>Días de Atención Semanales</span>
          </label>
          <p className="text-xs text-gray-500">
            Selecciona los días en los que el consultorio se encuentra abierto.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-2">
            {DIAS_SEMANA.map(({ id, label }) => {
              const activo = form.diasLaborales.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleDia(id)}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activo
                      ? "bg-emerald-50 text-emerald-900 border-[#2eb086] shadow-xs"
                      : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                      activo
                        ? "bg-[#2eb086] text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {activo ? <Check size={12} /> : "—"}
                  </div>
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Botón de Guardar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 bg-[#2eb086] hover:bg-[#259370] text-white font-bold text-sm rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check size={18} />
            <span>Guardar Configuración</span>
          </button>
        </div>
      </form>
    </div>
  </div>
  );
}

