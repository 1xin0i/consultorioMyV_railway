/** @format */

import { useState, useEffect, useRef, useMemo, memo } from "react";
import { createPortal } from "react-dom";
import api from "../../../../services/api";
import {
  Calendar,
  X,
  Phone,
  MessageCircle,
  Stethoscope,
  CalendarDays,
  UserRoundX,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import {
  obtenerColorAvatar,
  obtenerIniciales,
} from "../../../../utils/avatarColors";

const FMT_DIA_SEMANA = new Intl.DateTimeFormat("es-AR", { weekday: "long" });
const FMT_MES = new Intl.DateTimeFormat("es-AR", { month: "long" });
const FMT_HORA = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const FMT_MONEDA = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 2,
});

function formatearFechaSubtitulo(inicio, fin) {
  if (!inicio) return "";
  const dInicio = new Date(inicio);
  if (isNaN(dInicio.getTime())) return "";

  const diaSemana = FMT_DIA_SEMANA.format(dInicio);
  const diaSemanaCap = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
  const dia = dInicio.getDate();
  const mes = FMT_MES.format(dInicio);
  const mesCap = mes.charAt(0).toUpperCase() + mes.slice(1);
  const anio = dInicio.getFullYear();

  const horaInicio = FMT_HORA.format(dInicio);

  let horaFin = "";
  if (fin) {
    const dFin = new Date(fin);
    if (!isNaN(dFin.getTime())) {
      horaFin = FMT_HORA.format(dFin);
    }
  }

  const horas = horaFin ? `${horaInicio} a ${horaFin} hs` : `${horaInicio} hs`;
  return `${diaSemanaCap}, ${dia} de ${mesCap} de ${anio} · ${horas}`;
}

export const VistaTurno = memo(function VistaTurno({
  isOpen,
  onClose,
  turno,
  abrirParaReprogramar,
  abrirParaAtender,
  abrirParaCancelar,
  abrirParaInasistente,
}) {
  const [practicasRemotas, setPracticasRemotas] = useState([]);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const tienePracticasIncrustadas = Array.isArray(turno?.PracticaTurnos);

  // Solo consultar API si el objeto turno no trajo el arreglo PracticaTurnos incrustado
  useEffect(() => {
    if (!isOpen || !turno || tienePracticasIncrustadas) return;

    let cancelado = false;
    if (turno.id_turno) {
      api
        .get(`/practicas-turnos/${turno.id_turno}/turno`)
        .then((res) => {
          if (!cancelado) {
            setPracticasRemotas(res.data.data || []);
          }
        })
        .catch(() => {
          if (!cancelado) {
            setPracticasRemotas([]);
          }
        });
    }
    return () => {
      cancelado = true;
    };
  }, [isOpen, turno, tienePracticasIncrustadas]);

  // Cerrar al presionar Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onCloseRef.current?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const datosCalculados = useMemo(() => {
    if (!turno) return null;

    const paciente = turno.Paciente || {};
    const idEstado = Number(turno.id_estado || turno.EstadoTurno?.id_estado);
    const estadoNombre = turno.EstadoTurno?.estado || "Programado";

    const esProgramado = idEstado === 1 || estadoNombre === "Programado";
    const esAtendido = idEstado === 2 || estadoNombre === "Atendido";
    const esCancelado = idEstado === 3 || estadoNombre === "Cancelado";
    const esInasistente =
      idEstado === 4 ||
      estadoNombre === "Inasistente" ||
      estadoNombre === "Inasistido";
    const estaCanceladoOInasistido = esCancelado || esInasistente;

    const listaPracticas = tienePracticasIncrustadas
      ? turno.PracticaTurnos
      : practicasRemotas;

    const primerTratamiento =
      listaPracticas.length > 0 ? listaPracticas[0] : null;

    const nombreTratamiento =
      primerTratamiento?.Practica?.nombre_referencia ||
      primerTratamiento?.Practica?.nombre_nomenclador ||
      "Consulta General / Diagnóstico";

    const codigoNomenclador =
      primerTratamiento?.Practica?.codigo ||
      primerTratamiento?.Practica?.codigo_nomenclador ||
      "01.01";

    const nombreObraSocial =
      primerTratamiento?.ObraSocial?.nombre ||
      turno.ObraSocial?.nombre ||
      "Particular";

    let duracionMinutos = 30;
    if (turno.fecha_hora_inicio && turno.fecha_hora_fin) {
      const diff =
        (new Date(turno.fecha_hora_fin) - new Date(turno.fecha_hora_inicio)) /
        60000;
      if (diff > 0) duracionMinutos = Math.round(diff);
    } else if (turno.duracion_minutos) {
      duracionMinutos = turno.duracion_minutos;
    }

    const cuotas = turno.Cobro?.Cuotas || [];
    const estaAbonado =
      cuotas.length > 0 &&
      cuotas.every(
        (c) =>
          c.estado === "Pagada" ||
          c.estado === "Pagado" ||
          (Number(c.monto_cobrado) > 0 &&
            Number(c.monto_cobrado) >= Number(c.monto_cuota)),
      );

    const coloresAvatar = obtenerColorAvatar(
      `${paciente.nombre || ""} ${paciente.apellido || ""}`,
    );
    const iniciales = obtenerIniciales(paciente.nombre, paciente.apellido);

    const telLimpio = paciente.telefono
      ? String(paciente.telefono).replace(/\D/g, "")
      : "";

    const subtituloFecha = formatearFechaSubtitulo(
      turno.fecha_hora_inicio,
      turno.fecha_hora_fin,
    );

    const tituloModal = paciente.nombre
      ? `Turno: ${paciente.nombre} ${paciente.apellido} · ${nombreTratamiento}`
      : `Turno: ${nombreTratamiento}`;

    const estilosCardEstado = esProgramado
      ? {
          card: "bg-amber-50/80 dark:bg-amber-950/40 border-amber-200/90 dark:border-amber-800/60",
          label: "text-amber-700/80 dark:text-amber-400",
          dot: "bg-amber-500",
          title: "text-amber-950 dark:text-amber-200",
          desc: "text-amber-800/80 dark:text-amber-300/80",
        }
      : esAtendido
      ? {
          card: "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200/90 dark:border-emerald-800/60",
          label: "text-emerald-700/80 dark:text-emerald-400",
          dot: "bg-emerald-500",
          title: "text-emerald-950 dark:text-emerald-200",
          desc: "text-emerald-800/80 dark:text-emerald-300/80",
        }
      : esCancelado
      ? {
          card: "bg-rose-50/80 dark:bg-rose-950/40 border-rose-200/90 dark:border-rose-800/60",
          label: "text-rose-700/80 dark:text-rose-400",
          dot: "bg-rose-500",
          title: "text-rose-950 dark:text-rose-200",
          desc: "text-rose-800/80 dark:text-rose-300/80",
        }
      : {
          card: "bg-slate-100/90 dark:bg-slate-800/70 border-slate-300/90 dark:border-slate-700",
          label: "text-slate-500 dark:text-slate-400",
          dot: "bg-slate-500",
          title: "text-slate-900 dark:text-slate-100",
          desc: "text-slate-600 dark:text-slate-400",
        };

    return {
      paciente,
      estadoNombre,
      esProgramado,
      esAtendido,
      esCancelado,
      estaCanceladoOInasistido,
      nombreTratamiento,
      codigoNomenclador,
      nombreObraSocial,
      duracionMinutos,
      estaAbonado,
      coloresAvatar,
      iniciales,
      telLimpio,
      subtituloFecha,
      tituloModal,
      estilosCardEstado,
      precioFormateado: FMT_MONEDA.format(Number(turno.precio_final || 0)),
    };
  }, [turno, tienePracticasIncrustadas, practicasRemotas]);

  if (!isOpen || !turno || !datosCalculados) return null;

  const {
    paciente,
    estadoNombre,
    esProgramado,
    esAtendido,
    esCancelado,
    estaCanceladoOInasistido,
    nombreTratamiento,
    codigoNomenclador,
    nombreObraSocial,
    duracionMinutos,
    estaAbonado,
    coloresAvatar,
    iniciales,
    telLimpio,
    subtituloFecha,
    tituloModal,
    estilosCardEstado,
    precioFormateado,
  } = datosCalculados;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/45 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-6 flex flex-col gap-4 max-h-[92vh] overflow-y-auto scrollbar-none animate-in fade-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle visual de Bottom Sheet en mobile */}
        <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto sm:hidden -mt-1 mb-1 shrink-0" />

        {/* ─── HEADER DEL MODAL: Jerarquía limpia con Nombre del Paciente y Práctica ─── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-[#0d8266] border border-[#0d8266]/30 flex items-center justify-center shrink-0 shadow-2xs">
              <Calendar size={20} />
            </div>
            <div className="flex flex-col min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug truncate">
                {tituloModal}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                {subtituloFecha}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* ─── DATOS DEL PACIENTE: Contacto rápido con WhatsApp y Teléfono ─── */}
        <div className="rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 p-3.5 sm:p-4 flex items-center justify-between gap-3 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-11 h-11 rounded-full ${coloresAvatar.bg} ${coloresAvatar.text} border ${coloresAvatar.border} flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs`}
            >
              {iniciales}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base tracking-tight truncate">
                  {paciente.nombre} {paciente.apellido}
                </span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                    paciente.activo !== false
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "bg-rose-50 text-rose-700 border-rose-200/70 dark:bg-rose-950/40 dark:text-rose-300"
                  }`}
                >
                  {paciente.activo !== false ? "Activo" : "Inactivo"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">
                DNI {paciente.dni || "S/D"} · Tel:{" "}
                <span className="text-slate-700 dark:text-slate-300 font-semibold">
                  {paciente.telefono || "S/D"}
                </span>
              </p>
            </div>
          </div>

          {/* Acciones directas de contacto (WhatsApp y Llamada) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {paciente.telefono ? (
              <>
                <a
                  href={`https://wa.me/${telLimpio}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 sm:px-2.5 sm:py-2 rounded-full sm:rounded-xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  title="Contactar por WhatsApp"
                >
                  <MessageCircle size={16} />
                  <span className="text-xs font-bold hidden sm:inline">
                    WhatsApp
                  </span>
                </a>
                <a
                  href={`tel:${paciente.telefono}`}
                  className="p-2 sm:px-2.5 sm:py-2 rounded-full sm:rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  title="Llamar al paciente"
                >
                  <Phone size={16} />
                  <span className="text-xs font-bold hidden sm:inline">
                    Llamar
                  </span>
                </a>
              </>
            ) : null}
          </div>
        </div>

        {/* ─── GRID: ESTADO ACTUAL Y HONORARIOS ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Card Estado Actual (con bg y border según el estado) */}
          <div
            className={`rounded-2xl p-3.5 sm:p-4 border flex flex-col justify-between ${estilosCardEstado.card}`}
          >
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${estilosCardEstado.label}`}
            >
              ESTADO ACTUAL
            </span>
            <div className="flex items-center gap-2 mt-1.5">
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${estilosCardEstado.dot}`}
              />
              <span
                className={`font-bold text-sm sm:text-base ${estilosCardEstado.title}`}
              >
                {estadoNombre}
              </span>
            </div>
            <p
              className={`text-[11px] font-medium mt-1 ${estilosCardEstado.desc}`}
            >
              {esProgramado
                ? "Esperando llegada del paciente"
                : esAtendido
                ? "Turno completado y atendido"
                : esCancelado
                ? "Turno cancelado"
                : "El paciente no asistió"}
            </p>
          </div>

          {/* Card Honorarios */}
          <div className="rounded-2xl p-3.5 sm:p-4 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                HONORARIOS
              </span>
              {estaCanceladoOInasistido ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 bg-white dark:bg-slate-800">
                  Sin cargo
                </span>
              ) : estaAbonado ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/40">
                  Abonado
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-950/40">
                  A Cobrar
                </span>
              )}
            </div>

            <div className="mt-1">
              <span className="font-black text-slate-900 dark:text-slate-100 text-base sm:text-lg tabular-nums">
                ${precioFormateado}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
              Cobertura:{" "}
              <span className="text-slate-700 dark:text-slate-300 font-semibold">
                {nombreObraSocial}
              </span>
            </p>
          </div>
        </div>

        {/* ─── TRATAMIENTO PLANIFICADO ─── */}
        <div>
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
            Tratamiento Planificado
          </h3>
          <div className="rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-3 sm:p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-[#0d8266] border border-[#0d8266]/30 flex items-center justify-center shrink-0">
                <Stethoscope size={18} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate">
                  {nombreTratamiento}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Nomenclador: {codigoNomenclador}
                </span>
              </div>
            </div>

            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-xl">
              {duracionMinutos} min
            </span>
          </div>
        </div>

        {/* ─── NOTAS DEL TURNO ─── */}
        <div>
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
            Notas del Turno
          </h3>
          <div className="rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-3 sm:p-3.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic whitespace-pre-wrap">
            {turno.notas_consulta && turno.notas_consulta.trim().length > 0 ? (
              turno.notas_consulta
            ) : (
              <span className="text-slate-400 dark:text-slate-500 not-italic">
                Sin notas registradas para este turno.
              </span>
            )}
          </div>
        </div>

        {/* ─── FOOTER CON BOTONES DE ACCIÓN: RESPONSIVE BOTTOM SHEET / MODAL ─── */}
        <div className="pt-3 border-t border-slate-200/90 dark:border-slate-800 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Acciones secundarias: en mobile van en una fila de 3 botones proporcionales debajo del botón primario */}
          {esProgramado && (
            <div className="grid grid-cols-3 sm:flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  if (abrirParaReprogramar) abrirParaReprogramar(turno);
                }}
                className="px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg sm:rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-center flex items-center justify-center gap-1 sm:gap-1.5 transition-colors shadow-2xs active:scale-95 cursor-pointer"
                title="Reprogramar Turno"
              >
                <CalendarDays size={14} className="text-slate-500 shrink-0" />
                <span>Reprogramar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (abrirParaInasistente) abrirParaInasistente(turno);
                }}
                className="px-2.5 py-2 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg sm:rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/40 text-center flex items-center justify-center gap-1 sm:gap-1.5 transition-colors shadow-2xs active:scale-95 cursor-pointer"
                title="Marcar Inasistido"
              >
                <UserRoundX size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Inasistido</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (abrirParaCancelar) abrirParaCancelar(turno);
                }}
                className="px-2.5 py-2 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-lg sm:rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/40 text-center flex items-center justify-center gap-1 sm:gap-1.5 transition-colors shadow-2xs active:scale-95 cursor-pointer"
                title="Cancelar Turno"
              >
                <XCircle size={14} className="text-rose-600 dark:text-rose-400 shrink-0" />
                <span>Cancelar</span>
              </button>
            </div>
          )}

          {estaCanceladoOInasistido && (
            <div className="w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  if (abrirParaReprogramar) abrirParaReprogramar(turno);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-semibold text-xs whitespace-nowrap transition-colors shadow-2xs active:scale-95 cursor-pointer"
              >
                <CalendarDays size={14} className="text-slate-500" />
                <span>Reagendar</span>
              </button>
            </div>
          )}

          {/* Lado derecho: Cerrar (oculto en mobile si esProgramado) y Atender (ancho completo en mobile) */}
          <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className={`${
                esProgramado
                  ? "hidden sm:inline-flex"
                  : "w-full sm:w-auto inline-flex justify-center"
              } px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer whitespace-nowrap`}
            >
              Cerrar
            </button>

            {esProgramado && (
              <button
                type="button"
                onClick={() => {
                  if (abrirParaAtender) abrirParaAtender(turno);
                }}
                className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-[#0d8266] hover:bg-[#0b6f57] rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <CheckCircle2 size={16} />
                <span>Atender</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
});

export default VistaTurno;
