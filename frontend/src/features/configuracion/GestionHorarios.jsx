/** @format */

import { useState, useEffect } from "react";
import { Clock, Calendar, Check, BarChart3 } from "lucide-react";
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
  } = useConfiguracion();

  const [form, setForm] = useState({
    horaInicio: config.horaInicio || "08:00",
    horaFin: config.horaFin || "20:00",
    duracionModuloMinutos: config.duracionModuloMinutos || 30,
    diasLaborales: config.diasLaborales || [1, 2, 3, 4, 5, 6],
    ocupacionBajaMax: config.ocupacionBajaMax ?? 50,
    ocupacionMediaMax: config.ocupacionMediaMax ?? 80,
  });

  useEffect(() => {
    setForm({
      horaInicio: config.horaInicio || "08:00",
      horaFin: config.horaFin || "20:00",
      duracionModuloMinutos: config.duracionModuloMinutos || 30,
      diasLaborales: config.diasLaborales || [1, 2, 3, 4, 5, 6],
      ocupacionBajaMax: config.ocupacionBajaMax ?? 50,
      ocupacionMediaMax: config.ocupacionMediaMax ?? 80,
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

    const bajaPct = Number(form.ocupacionBajaMax) || 50;
    const mediaPct = Number(form.ocupacionMediaMax) || 80;

    if (bajaPct < 5 || bajaPct >= 95) {
      toast.error("El porcentaje de ocupación baja debe estar entre 5% y 94%.");
      return;
    }

    if (mediaPct <= bajaPct || mediaPct > 99) {
      toast.error(
        "El porcentaje de ocupación media debe ser mayor al de ocupación baja y menor a 100%."
      );
      return;
    }

    actualizarConfiguracion({
      ...form,
      ocupacionBajaMax: bajaPct,
      ocupacionMediaMax: mediaPct,
    });
    toast.success("Ajustes actualizados correctamente.", {
      icon: "⚙️",
    });
  };

  const hInicioForm = parseInt(form.horaInicio?.split(":")[0], 10) || 8;
  const hFinForm = parseInt(form.horaFin?.split(":")[0], 10) || 20;
  const horasJornada = Math.max(0, hFinForm - hInicioForm);
  const duracionForm = Number(form.duracionModuloMinutos) || 30;
  const totalModulosDia = Math.max(
    1,
    Math.floor(Math.max(60, horasJornada * 60) / duracionForm)
  );

  const bajaPctVal = Math.min(94, Math.max(5, Number(form.ocupacionBajaMax) || 50));
  const mediaPctVal = Math.min(
    99,
    Math.max(bajaPctVal + 1, Number(form.ocupacionMediaMax) || 80)
  );

  const corteBajaModulos = Math.max(
    1,
    Math.round(totalModulosDia * (bajaPctVal / 100))
  );
  const corteMediaModulos = Math.min(
    Math.max(corteBajaModulos + 1, totalModulosDia - 1),
    Math.max(
      corteBajaModulos + 1,
      Math.round(totalModulosDia * (mediaPctVal / 100))
    )
  );

  return (
    <div className="w-full min-h-screen flex flex-col">
      {/* Cabecera común unificada */}
      <Header titulo="Ajustes" />

      <div className="w-full max-w-4xl mx-auto p-4 md:p-6 flex flex-col gap-6">
        <form onSubmit={handleGuardar} className="flex flex-col gap-6">
          {/* Tarjetas de Selección Horaria */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Hora Inicio */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-200 flex items-center gap-1.5">
                <span>Hora de Apertura</span>
              </label>
              <select
                value={form.horaInicio}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, horaInicio: e.target.value }))
                }
                className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2eb086] cursor-pointer"
              >
                {Array.from({ length: 15 }, (_, i) => i + 6).map((h) => {
                  const str = `${h.toString().padStart(2, "0")}:00`;
                  return (
                    <option
                      key={str}
                      value={str}
                      className="bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100"
                    >
                      {str} hs
                    </option>
                  );
                })}
              </select>
              <span className="text-[11px] text-gray-400 dark:text-slate-500">
                Inicio de los turnos en agenda
              </span>
            </div>

            {/* Hora Fin */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-200 flex items-center gap-1.5">
                <span>Hora de Cierre</span>
              </label>
              <select
                value={form.horaFin}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, horaFin: e.target.value }))
                }
                className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2eb086] cursor-pointer"
              >
                {Array.from({ length: 15 }, (_, i) => i + 12).map((h) => {
                  const str = `${h.toString().padStart(2, "0")}:00`;
                  return (
                    <option
                      key={str}
                      value={str}
                      className="bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100"
                    >
                      {str} hs
                    </option>
                  );
                })}
              </select>
              <span className="text-[11px] text-gray-400 dark:text-slate-500">
                Cierre de atención en el consultorio
              </span>
            </div>

            {/* Duración de Módulo */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-200 flex items-center gap-1.5">
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
                className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2eb086] cursor-pointer"
              >
                <option
                  value={15}
                  className="bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100"
                >
                  15 minutos
                </option>
                <option
                  value={20}
                  className="bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100"
                >
                  20 minutos
                </option>
                <option
                  value={30}
                  className="bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100"
                >
                  30 minutos (Estándar)
                </option>
                <option
                  value={45}
                  className="bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100"
                >
                  45 minutos
                </option>
                <option
                  value={60}
                  className="bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100"
                >
                  1 hora
                </option>
              </select>
              <span className="text-[11px] text-gray-400 dark:text-slate-500">
                División de slots en la grilla
              </span>
            </div>
          </div>

          {/* Resumen Dinámico en Tiempo Real */}
          <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-emerald-900 dark:text-emerald-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#2eb086] text-white rounded-xl shadow-xs">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-sm font-bold">
                  Jornada configurada: {horasJornada} horas de atención
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                  Capacidad máxima de{" "}
                  <span className="font-extrabold">
                    {totalModulosDia} módulos
                  </span>{" "}
                  por día ({form.horaInicio} a {form.horaFin}).
                </p>
              </div>
            </div>
          </div>

          {/* Selección de Días de Atención */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-3">
            <label className="text-sm font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
              <Calendar size={18} className="text-[#2eb086]" />
              <span>Días de Atención Semanales</span>
            </label>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Selecciona los días en los que el consultorio se encuentra
              abierto.
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
                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-[#2eb086] shadow-xs"
                        : "bg-gray-50 dark:bg-slate-800/60 text-gray-400 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                        activo
                          ? "bg-[#2eb086] text-white"
                          : "bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-300"
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

          {/* Configuración de Niveles de Ocupación (Vista Mensual) */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
                <BarChart3 size={18} className="text-[#2eb086]" />
                <span>Niveles de Ocupación Diaria (Vista Mensual)</span>
              </label>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Personalizá los porcentajes para clasificar la demanda de cada
                día en el calendario mensual y visualizá su equivalencia en
                módulos según tu jornada actual ({totalModulosDia} módulos por
                día).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              {/* Nivel Baja */}
              <div className="p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/30 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Ocupación Baja
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                    1% al {bajaPctVal}%
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-gray-600 dark:text-slate-300">
                    Hasta el porcentaje (%)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min={5}
                      max={Math.max(5, mediaPctVal - 1)}
                      value={form.ocupacionBajaMax}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          ocupacionBajaMax: e.target.value,
                        }))
                      }
                      className="w-full p-2.5 pr-8 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700/80 rounded-xl text-sm font-bold text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="absolute right-3 text-xs font-bold text-gray-400">
                      %
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/50 flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-slate-400">
                    Equivalencia:
                  </span>
                  <span className="font-extrabold text-emerald-800 dark:text-emerald-300">
                    1 a {corteBajaModulos}{" "}
                    {corteBajaModulos === 1 ? "módulo" : "módulos"}
                  </span>
                </div>
              </div>

              {/* Nivel Media */}
              <div className="p-4 rounded-xl border border-amber-200/80 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/30 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-800 dark:text-amber-300 uppercase tracking-wide">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    Ocupación Media
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                    {bajaPctVal + 1}% al {mediaPctVal}%
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-gray-600 dark:text-slate-300">
                    Hasta el porcentaje (%)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min={bajaPctVal + 1}
                      max={99}
                      value={form.ocupacionMediaMax}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          ocupacionMediaMax: e.target.value,
                        }))
                      }
                      className="w-full p-2.5 pr-8 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700/80 rounded-xl text-sm font-bold text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="absolute right-3 text-xs font-bold text-gray-400">
                      %
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/50 flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-slate-400">
                    Equivalencia:
                  </span>
                  <span className="font-extrabold text-amber-800 dark:text-amber-300">
                    {corteBajaModulos + 1} a {corteMediaModulos} módulos
                  </span>
                </div>
              </div>

              {/* Nivel Alta */}
              <div className="p-4 rounded-xl border border-rose-200/80 dark:border-rose-800/60 bg-rose-50/40 dark:bg-rose-950/30 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-rose-800 dark:text-rose-300 uppercase tracking-wide">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    Ocupación Alta
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200">
                    &gt; {mediaPctVal}%
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-gray-600 dark:text-slate-300">
                    Rango automático
                  </label>
                  <div className="w-full p-2.5 bg-white/70 dark:bg-slate-800/60 border border-rose-200 dark:border-rose-800/60 rounded-xl text-sm font-bold text-rose-700 dark:text-rose-300">
                    Del {mediaPctVal + 1}% al 100%
                  </div>
                </div>

                <div className="pt-2 border-t border-rose-200/60 dark:border-rose-800/50 flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-slate-400">
                    Equivalencia:
                  </span>
                  <span className="font-extrabold text-rose-800 dark:text-rose-300">
                    &gt; {corteMediaModulos} módulos ({corteMediaModulos + 1} a{" "}
                    {totalModulosDia})
                  </span>
                </div>
              </div>
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
