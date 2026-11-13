/** @format */

import { useState, useMemo, useEffect } from "react";
import {
  Clock,
  Calendar,
  Sliders,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Lock,
  Unlock,
  Plus,
} from "lucide-react";
import toast from "react-hot-toast";
import PageLayout from "@/shared/components/layout/PageLayout";
import { useConfiguracion } from "../context/ConfiguracionContext";
import { ModalRestriccion } from "@/features/turnos";

const DIAS_SEMANA = [
  { id: 1, corto: "Lun", nombre: "Lunes" },
  { id: 2, corto: "Mar", nombre: "Martes" },
  { id: 3, corto: "Mié", nombre: "Miércoles" },
  { id: 4, corto: "Jue", nombre: "Jueves" },
  { id: 5, corto: "Vie", nombre: "Viernes" },
  { id: 6, corto: "Sáb", nombre: "Sábado" },
  { id: 0, corto: "Dom", nombre: "Domingo" },
];

export function GestionHorarios() {
  const {
    configuracion,
    guardarConfiguracion,
    restablecerPorDefecto,
    restricciones,
    agregarRestriccion,
    eliminarRestriccion,
  } = useConfiguracion();

  const [form, setForm] = useState(configuracion);
  const [guardando, setGuardando] = useState(false);
  const [modalRestriccionAbierto, setModalRestriccionAbierto] = useState(false);

  // Sincronizar el formulario cuando llega la configuración desde el servidor
  useEffect(() => {
    setForm(configuracion);
  }, [configuracion]);

  const toggleDia = (idDia) => {
    setForm((prev) => {
      const existe = prev.diasLaborales.includes(idDia);
      const nuevos = existe
        ? prev.diasLaborales.filter((d) => d !== idDia)
        : [...prev.diasLaborales, idDia];
      return { ...prev, diasLaborales: nuevos };
    });
  };

  const previewMetricas = useMemo(() => {
    const [hIni, mIni] = (form.horaInicio || "08:00").split(":").map(Number);
    const [hFin, mFin] = (form.horaFin || "18:00").split(":").map(Number);
    const minTotales = Math.max(
      0,
      hFin * 60 + (mFin || 0) - (hIni * 60 + (mIni || 0)),
    );
    const horas = Math.round((minTotales / 60) * 10) / 10;
    const intervalo = Number(form.intervaloMinutos) || 30;
    const modulos = Math.max(1, Math.floor(minTotales / intervalo));

    const corteBaja = Math.max(
      1,
      Math.floor((modulos * Number(form.umbralBaja || 50)) / 100),
    );
    const corteMedia = Math.max(
      corteBaja + 1,
      Math.floor((modulos * Number(form.umbralMedia || 80)) / 100),
    );

    return {
      minTotales,
      horas,
      modulos,
      corteBaja,
      corteMedia,
    };
  }, [form]);

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (previewMetricas.minTotales <= 0) {
      toast.error("La hora de cierre debe ser posterior a la hora de inicio.");
      return;
    }
    if (form.diasLaborales.length === 0) {
      toast.error("Debés seleccionar al menos un día laboral de atención.");
      return;
    }
    if (Number(form.umbralBaja) >= Number(form.umbralMedia)) {
      toast.error(
        "El umbral de Demanda Baja debe ser menor que el de Demanda Media.",
      );
      return;
    }

    setGuardando(true);
    try {
      await guardarConfiguracion(form);
      toast.success("Configuración de horarios guardada en la base de datos.");
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "Error al guardar la configuración en el servidor.",
      );
    } finally {
      setGuardando(false);
    }
  };

  const handleReset = async () => {
    setGuardando(true);
    try {
      const def = await restablecerPorDefecto();
      setForm(def);
      toast.success("Valores restablecidos por defecto.");
    } catch {
      toast.error("No se pudieron restablecer los valores en el servidor.");
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarRestriccion = async (id) => {
    try {
      await eliminarRestriccion(id);
      toast.success("Bloqueo eliminado de la base de datos.", { icon: "🔓" });
    } catch {
      toast.error("No se pudo eliminar el bloqueo.");
    }
  };

  return (
    <PageLayout
      icono={<Clock size={22} />}
      titulo="Horarios y Disponibilidad"
      subtitulo="Configurá la jornada de atención, días laborales y los umbrales de ocupación del calendario"
      accionesHeader={
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={guardando}
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm transition-colors cursor-pointer shadow-2xs disabled:opacity-60"
          >
            <RotateCcw size={15} />
            <span>Restablecer</span>
          </button>

          <button
            type="button"
            disabled={guardando}
            onClick={handleGuardar}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2eb086] hover:bg-[#259370] text-white font-bold text-xs sm:text-sm transition-all shadow-sm cursor-pointer active:scale-95 disabled:opacity-60"
          >
            <Save size={16} />
            <span>{guardando ? "Guardando..." : "Guardar Cambios"}</span>
          </button>
        </div>
      }
    >
      <form
        onSubmit={handleGuardar}
        className="grid grid-cols-1 lg:grid-cols-12 gap-5"
      >
        {/* Columna Izquierda: Jornada y Días */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Card 1: Horario de Atención */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-teal-100 dark:border-slate-800 p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-[#0d8266] dark:text-emerald-400 border border-teal-200/70 dark:border-teal-800/60 flex items-center justify-center">
                <Clock size={18} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  Jornada Diaria de Atención
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Define el rango horario visible en la Agenda (Día y Semana) y
                  la capacidad diaria.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Hora de Apertura
                </label>
                <input
                  type="time"
                  step="1800"
                  value={form.horaInicio}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, horaInicio: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2eb086]/40 focus:border-[#2eb086]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Hora de Cierre
                </label>
                <input
                  type="time"
                  step="1800"
                  value={form.horaFin}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, horaFin: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2eb086]/40 focus:border-[#2eb086]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Duración Base del Módulo
                </label>
                <select
                  value={form.intervaloMinutos}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      intervaloMinutos: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2eb086]/40 focus:border-[#2eb086] cursor-pointer"
                >
                  <option value={15}>15 minutos</option>
                  <option value={30}>30 minutos (Estándar)</option>
                  <option value={60}>60 minutos (1 hora)</option>
                </select>
              </div>
            </div>

            <div className="rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/70 dark:border-teal-800/50 p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-teal-900 dark:text-emerald-300 font-semibold">
                <CheckCircle2 size={16} className="text-[#2eb086] shrink-0" />
                <span>
                  Capacidad diaria calculada:{" "}
                  <strong>{previewMetricas.horas} horas</strong> (
                  {previewMetricas.modulos} módulos de {form.intervaloMinutos}{" "}
                  min)
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Días Laborales */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-teal-100 dark:border-slate-800 p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-[#0d8266] dark:text-emerald-400 border border-teal-200/70 dark:border-teal-800/60 flex items-center justify-center">
                <Calendar size={18} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  Días Laborales de Atención
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Los días desmarcados se mostrarán como &quot;Cerrado / No
                  laboral&quot; en el calendario.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-1">
              {DIAS_SEMANA.map((dia) => {
                const activo = form.diasLaborales.includes(dia.id);
                return (
                  <button
                    key={dia.id}
                    type="button"
                    onClick={() => toggleDia(dia.id)}
                    className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none ${
                      activo
                        ? "bg-[#e8f7f1] dark:bg-teal-950/70 border-[#2eb086] text-[#0d8266] dark:text-emerald-300 shadow-2xs"
                        : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-600"
                    }`}
                  >
                    <span className="text-sm font-black">{dia.corto}</span>
                    <span className="text-[10px] font-semibold mt-0.5">
                      {activo ? "Abierto" : "Cerrado"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 3: Bloqueos y Excepciones Activas (Sincronizadas con MySQL) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-teal-100 dark:border-slate-800 p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/70 dark:border-amber-800/60 flex items-center justify-center">
                  <Lock size={18} />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                    Bloqueos y Feriados Registrados
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Días o franjas horarias bloqueadas en la base de datos.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalRestriccionAbierto(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus size={14} />
                <span>Nuevo Bloqueo</span>
              </button>
            </div>

            {restricciones.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-4 text-center text-xs text-slate-400 dark:text-slate-500">
                No hay días ni franjas horarias bloqueadas actualmente.
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                {restricciones.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                        {r.motivo}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {r.todoElDia
                          ? r.fechaInicio !== r.fechaFin
                            ? `Día completo · Del ${r.fechaInicio} al ${r.fechaFin}`
                            : `Día completo · ${r.fechaInicio}`
                          : `${r.fechaInicio} · Franja de ${r.horaInicio} a ${r.horaFin} hs`}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleEliminarRestriccion(r.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors cursor-pointer shrink-0"
                    >
                      <Unlock size={13} />
                      <span>Quitar</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Semáforo de Ocupación Mensual */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-teal-100 dark:border-slate-800 p-5 shadow-xs flex flex-col gap-4 h-full">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-[#0d8266] dark:text-emerald-400 border border-teal-200/70 dark:border-teal-800/60 flex items-center justify-center">
                <Sliders size={18} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  Semáforo de Demanda en Vista Mensual
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ajustá a partir de qué porcentaje de ocupación un día pasa a
                  Demanda Media o Alta.
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-1">
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-emerald-700 dark:text-emerald-400">
                    Límite de Demanda Baja (Verde)
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Hasta {form.umbralBaja}% ({previewMetricas.corteBaja}{" "}
                    módulos)
                  </span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={70}
                  step={5}
                  value={form.umbralBaja}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      umbralBaja: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-amber-700 dark:text-amber-400">
                    Límite de Demanda Media (Ámbar)
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    Hasta {form.umbralMedia}% ({previewMetricas.corteMedia}{" "}
                    módulos)
                  </span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={95}
                  step={5}
                  value={form.umbralMedia}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      umbralMedia: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Vista previa de las 3 escalas */}
            <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Vista Previa de Escalas ({previewMetricas.modulos} módulos
                diarios)
              </span>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="font-bold text-emerald-900 dark:text-emerald-200">
                    Demanda Baja
                  </span>
                </div>
                <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                  1 a {previewMetricas.corteBaja} módulos (≤ {form.umbralBaja}%)
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="font-bold text-amber-900 dark:text-amber-200">
                    Demanda Media
                  </span>
                </div>
                <span className="font-semibold text-amber-800 dark:text-amber-300">
                  {previewMetricas.corteBaja + 1} a {previewMetricas.corteMedia}{" "}
                  módulos ({form.umbralBaja + 1}% - {form.umbralMedia}%)
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="font-bold text-rose-900 dark:text-rose-200">
                    Demanda Alta
                  </span>
                </div>
                <span className="font-semibold text-rose-800 dark:text-rose-300">
                  {previewMetricas.corteMedia + 1} o más módulos (&gt;{" "}
                  {form.umbralMedia}%)
                </span>
              </div>
            </div>

            <div className="mt-auto rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700 p-3 flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-teal-600" />
              <span>
                Estos cambios se guardan en la base de datos y se aplican en
                tiempo real a todos los dispositivos conectados al consultorio.
              </span>
            </div>
          </div>
        </div>
      </form>

      <ModalRestriccion
        isOpen={modalRestriccionAbierto}
        onClose={() => setModalRestriccionAbierto(false)}
        rangoFechas={{ inicio: new Date(), fin: new Date() }}
        onGuardar={agregarRestriccion}
        onEliminar={eliminarRestriccion}
      />
    </PageLayout>
  );
}

export default GestionHorarios;

