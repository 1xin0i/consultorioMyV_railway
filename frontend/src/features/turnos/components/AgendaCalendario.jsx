/** @format */
import { useRef, useState, useEffect, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import interactionPlugin from "@fullcalendar/react/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import themePlugin from "@fullcalendar/react/themes/forma";
import { useSwipeable } from "react-swipeable";

import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/forma/theme.css";
import "@fullcalendar/react/themes/forma/palettes/green.css";

import {
  HORARIO_ATENCION_DEFAULT,
  COLORES_OCUPACION,
} from "../constants/turnosConstants";
import toast from "react-hot-toast";
import ModalRestriccion from "./ModalRestriccion";
import { validarBloqueoConTurnos } from "../utils/validacionesTurno";
import {
  useRestricciones,
  verificarSolapamientoConRestricciones,
} from "../hooks/useRestricciones";

const VISTAS = ["timeGridDay", "timeGridWeek", "dayGridMonth"];

// Umbrales fijos predeterminados
const UMBRAL_VERDE_MAX = 60;
const UMBRAL_AMARILLO_MAX = 85;

// Convierte "09:00", "09:00:00" o número 9 a minutos desde las 00:00
const convertirHoraAMinutos = (horaValor) => {
  if (typeof horaValor === "number") return Math.round(horaValor * 60);
  const partes = String(horaValor || "00:00").split(":").map(Number);
  const horas = Number.isFinite(partes[0]) ? partes[0] : 0;
  const minutos = Number.isFinite(partes[1]) ? partes[1] : 0;
  return horas * 60 + minutos;
};

// Normaliza un valor horario a formato "HH:MM"
const formatearHoraHHMM = (horaValor) => {
  const totalMin = convertirHoraAMinutos(horaValor);
  const hh = String(Math.floor(totalMin / 60)).padStart(2, "0");
  const mm = String(totalMin % 60).padStart(2, "0");
  return `${hh}:${mm}`;
};

// Normaliza un valor horario a formato "HH:MM:00" para FullCalendar
const formatearHoraSlot = (horaValor) => `${formatearHoraHHMM(horaValor)}:00`;

// Formatea minutos en texto legible (ej. "2h 30m")
const formatearMinutosTexto = (minutos) => {
  const minRedondeados = Math.round(minutos);
  const h = Math.floor(minRedondeados / 60);
  const m = minRedondeados % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

export const AgendaCalendar = ({
  turnos = [],
  onDateSelect,
  onEventClick,
  horaInicio = HORARIO_ATENCION_DEFAULT.inicioStr,
  horaFin = HORARIO_ATENCION_DEFAULT.finStr,
  onVistaChange,
}) => {
  const calendarRef = useRef(null);
  const contenedorRef = useRef(null);
  const [vistaActual, setVistaActual] = useState(0);
  const [vistaTipo, setVistaTipo] = useState("timeGridDay");
  const [esMobile, setEsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  const [ahora, setAhora] = useState(new Date());

  // Estado local para Modal de Restricción / Bloqueo
  const [modalRestriccionAbierto, setModalRestriccionAbierto] = useState(false);
  const [rangoFechasSeleccionadas, setRangoFechasSeleccionadas] = useState(null);

  // Estados reactivos para selección interactiva por arrastre (Click & Drag) en grilla mensual
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef(null);
  const dragEndRef = useRef(null);
  const ultimoClickSlotRef = useRef(0);
  const onVistaChangeRef = useRef(onVistaChange);
  useEffect(() => {
    onVistaChangeRef.current = onVistaChange;
  }, [onVistaChange]);

  const {
    restricciones,
    agregarRestriccion,
    eliminarRestriccion,
    esDiaBloqueado,
    obtenerRestriccionesDeRango,
  } = useRestricciones();

  // Configuración dinámica del rango horario de atención
  const minutosInicioJornada = useMemo(() => convertirHoraAMinutos(horaInicio), [horaInicio]);
  const minutosFinJornada = useMemo(() => convertirHoraAMinutos(horaFin), [horaFin]);
  const minutosTotalesJornada = useMemo(
    () => Math.max(1, minutosFinJornada - minutosInicioJornada),
    [minutosInicioJornada, minutosFinJornada],
  );
  const slotMinTimeStr = useMemo(() => formatearHoraSlot(horaInicio), [horaInicio]);
  const slotMaxTimeStr = useMemo(() => formatearHoraSlot(horaFin), [horaFin]);
  const horaInicioHHMM = useMemo(() => formatearHoraHHMM(horaInicio), [horaInicio]);
  const horaFinHHMM = useMemo(() => formatearHoraHHMM(horaFin), [horaFin]);

  useEffect(() => {
    const handleResize = () => setEsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);

    const interval = setInterval(() => setAhora(new Date()), 60000);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearInterval(interval);
    };
  }, []);

  /* ─── CÁLCULO DINÁMICO DE OCUPACIÓN POR DÍA ─────────────── */
  const ocupacionPorDia = useMemo(() => {
    const mapaIntervalos = {};

    turnos.forEach((turno) => {
      if (!turno?.fecha_hora_inicio) return;

      const estadoTexto = (turno.EstadoTurno?.estado || "Programado").toLowerCase();
      if (estadoTexto.includes("cancelado") || estadoTexto.includes("inasistente")) return;

      const dInicio = new Date(turno.fecha_hora_inicio);
      if (isNaN(dInicio.getTime())) return;

      const y = dInicio.getFullYear();
      const m = String(dInicio.getMonth() + 1).padStart(2, "0");
      const d = String(dInicio.getDate()).padStart(2, "0");
      const fechaKey = `${y}-${m}-${d}`;

      const duracionFallback = Number(turno.duracion_minutos) || 30;
      const dFin = turno.fecha_hora_fin
        ? new Date(turno.fecha_hora_fin)
        : new Date(dInicio.getTime() + duracionFallback * 60000);

      const iniMin = dInicio.getHours() * 60 + dInicio.getMinutes();
      let finMin = !isNaN(dFin.getTime())
        ? dFin.getHours() * 60 + dFin.getMinutes()
        : iniMin + duracionFallback;

      if (finMin <= iniMin) {
        finMin = iniMin + duracionFallback;
      }

      const iniEfectivo = Math.max(iniMin, minutosInicioJornada);
      const finEfectivo = Math.min(finMin, minutosFinJornada);

      if (finEfectivo > iniEfectivo) {
        if (!mapaIntervalos[fechaKey]) {
          mapaIntervalos[fechaKey] = { intervalos: [], cantidadTurnos: 0 };
        }
        mapaIntervalos[fechaKey].intervalos.push([iniEfectivo, finEfectivo]);
        mapaIntervalos[fechaKey].cantidadTurnos += 1;
      }
    });

    const resultado = {};

    Object.entries(mapaIntervalos).forEach(([fechaKey, datos]) => {
      const { intervalos, cantidadTurnos } = datos;
      if (!intervalos.length || cantidadTurnos === 0) return;

      intervalos.sort((a, b) => a[0] - b[0]);
      const fusionados = [];
      for (const actual of intervalos) {
        if (fusionados.length === 0 || actual[0] >= fusionados[fusionados.length - 1][1]) {
          fusionados.push([...actual]);
        } else {
          fusionados[fusionados.length - 1][1] = Math.max(
            fusionados[fusionados.length - 1][1],
            actual[1],
          );
        }
      }

      const minutosOcupados = fusionados.reduce((acc, [ini, fin]) => acc + (fin - ini), 0);
      if (minutosOcupados <= 0) return;

      const porcentaje = Math.min(100, (minutosOcupados / minutosTotalesJornada) * 100);

      let nivel = "verde";
      if (porcentaje > UMBRAL_AMARILLO_MAX) {
        nivel = "rojo";
      } else if (porcentaje >= UMBRAL_VERDE_MAX) {
        nivel = "amarillo";
      }

      resultado[fechaKey] = {
        minutosOcupados,
        porcentaje,
        cantidadTurnos,
        nivel,
        colores: COLORES_OCUPACION[nivel],
      };
    });

    return resultado;
  }, [turnos, minutosInicioJornada, minutosFinJornada, minutosTotalesJornada]);

  // Reglas CSS dinámicas por fecha para colorear vista mensual, cabeceras y celdas bloqueadas
  const estilosOcupacionPorFecha = useMemo(() => {
    const reglas = [];

    // 1. Días bloqueados completos (fondo gris claro de deshabilitado, texto atenuado y cursor not-allowed)
    const diasBloqueadosCompletos = new Set();
    restricciones.forEach((r) => {
      if (r.todoElDia) {
        let actual = new Date(r.fechaInicio + "T00:00:00");
        const limite = new Date(r.fechaFin + "T00:00:00");
        while (actual <= limite) {
          const y = actual.getFullYear();
          const m = String(actual.getMonth() + 1).padStart(2, "0");
          const d = String(actual.getDate()).padStart(2, "0");
          const fKey = `${y}-${m}-${d}`;
          diasBloqueadosCompletos.add(fKey);

          reglas.push(`
            /* Vista Mensual: fondo gris sólido y visible (bg-slate-300) que cubre 100% la celda sin líneas verdes */
            .agenda-vista-dayGridMonth [role="cell"][data-date="${fKey}"],
            .agenda-vista-dayGridMonth td[data-date="${fKey}"],
            .agenda-vista-dayGridMonth td.celda-bloqueada-completo[data-date="${fKey}"] {
              background-color: #cbd5e1 !important; /* bg-slate-300 */
              color: #1e293b !important; /* text-slate-800 */
              cursor: pointer !important;
              border-left-color: #cbd5e1 !important;
            }
            .agenda-vista-dayGridMonth [role="cell"][data-date="${fKey}"] .fc-daygrid-day-frame,
            .agenda-vista-dayGridMonth td[data-date="${fKey}"] .fc-daygrid-day-frame,
            .agenda-vista-dayGridMonth td.celda-bloqueada-completo .fc-daygrid-day-frame,
            .agenda-vista-dayGridMonth [role="cell"][data-date="${fKey}"] .fc-daygrid-day-bg,
            .agenda-vista-dayGridMonth td[data-date="${fKey}"] .fc-daygrid-day-bg,
            .agenda-vista-dayGridMonth td.celda-bloqueada-completo .fc-daygrid-day-bg,
            .agenda-vista-dayGridMonth [role="cell"][data-date="${fKey}"] .fc-daygrid-day-events,
            .agenda-vista-dayGridMonth td[data-date="${fKey}"] .fc-daygrid-day-events,
            .agenda-vista-dayGridMonth td.celda-bloqueada-completo .fc-daygrid-day-events {
              background-color: #cbd5e1 !important;
              border-left-color: #cbd5e1 !important;
            }
            .agenda-vista-dayGridMonth [role="cell"][data-date="${fKey}"] .fc-daygrid-day-number,
            .agenda-vista-dayGridMonth td[data-date="${fKey}"] .fc-daygrid-day-number,
            .agenda-vista-dayGridMonth td.celda-bloqueada-completo .fc-daygrid-day-number {
              color: #1e293b !important;
              font-weight: 700 !important;
            }

            /* Vista Semanal: cabecera y columna completa en gris claro */
            .agenda-vista-timeGridWeek [role="columnheader"][data-date="${fKey}"],
            .agenda-vista-timeGridWeek th[data-date="${fKey}"] {
              background-color: #e2e8f0 !important;
              color: #334155 !important;
              cursor: not-allowed !important;
            }
            .agenda-vista-timeGridWeek .fc-timegrid-col[data-date="${fKey}"],
            .agenda-vista-timeGridWeek .fc-timegrid-col[data-date="${fKey}"] .fc-timegrid-col-frame {
              background-color: #e2e8f0 !important;
              cursor: not-allowed !important;
            }

            /* Vista Diaria: cabecera y grilla completa en gris claro si coincide */
            .agenda-vista-timeGridDay [role="columnheader"][data-date="${fKey}"],
            .agenda-vista-timeGridDay th[data-date="${fKey}"] {
              background-color: #e2e8f0 !important;
              color: #334155 !important;
              cursor: not-allowed !important;
            }
            .agenda-vista-timeGridDay .fc-timegrid-col[data-date="${fKey}"],
            .agenda-vista-timeGridDay .fc-timegrid-col[data-date="${fKey}"] .fc-timegrid-col-frame {
              background-color: #e2e8f0 !important;
              cursor: not-allowed !important;
            }
          `);

          actual.setDate(actual.getDate() + 1);
        }
      }
    });

    // 2. Colores de ocupación para días NO bloqueados por completo
    Object.entries(ocupacionPorDia).forEach(([fechaKey, info]) => {
      if (!diasBloqueadosCompletos.has(fechaKey) && info.minutosOcupados > 0 && info.colores) {
        reglas.push(`
          .agenda-vista-dayGridMonth [role="cell"][data-date="${fechaKey}"],
          .agenda-vista-dayGridMonth td[data-date="${fechaKey}"] {
            background-color: ${info.colores.bg} !important;
            color: ${info.colores.text};
          }
          .agenda-vista-timeGridWeek [role="columnheader"][data-date="${fechaKey}"],
          .agenda-vista-timeGridWeek th[data-date="${fechaKey}"] {
            background-color: ${info.colores.bg} !important;
            color: ${info.colores.text};
          }
        `);
      }
    });

    return reglas.join("\n");
  }, [ocupacionPorDia, restricciones]);

  // Actualizar tooltips informativos
  useEffect(() => {
    if (!contenedorRef.current) return;
    if (vistaTipo !== "dayGridMonth" && vistaTipo !== "timeGridWeek") return;

    const selector =
      vistaTipo === "dayGridMonth"
        ? '[role="cell"][data-date]'
        : '[role="columnheader"][data-date]';

    const elementos = contenedorRef.current.querySelectorAll(selector);
    const totalJornadaTexto = formatearMinutosTexto(minutosTotalesJornada);

    elementos.forEach((el) => {
      const fechaKey = el.getAttribute("data-date");
      if (!fechaKey) return;

      const restDia = restricciones.find(
        (r) => r.todoElDia && fechaKey >= r.fechaInicio && fechaKey <= r.fechaFin
      );

      if (restDia) {
        el.setAttribute(
          "title",
          `🔒 Día Bloqueado (${restDia.motivo}) - No disponible para turnos`
        );
        return;
      }

      const info = ocupacionPorDia[fechaKey];
      if (info && info.minutosOcupados > 0) {
        const pctRedondeado = Math.round(info.porcentaje * 10) / 10;
        const ocupadoTexto = formatearMinutosTexto(info.minutosOcupados);
        el.setAttribute(
          "title",
          `Ocupación: ${pctRedondeado}% (${ocupadoTexto} de ${totalJornadaTexto}) • ${info.cantidadTurnos} turno(s)`,
        );
      } else {
        el.setAttribute("title", "Sin turnos programados (0% ocupación)");
      }
    });
  }, [ocupacionPorDia, vistaTipo, minutosTotalesJornada, restricciones]);

  /* ─── FORMATEAR TURNOS ─────────────────────────────────── */
  const turnosFormateados = useMemo(
    () =>
      turnos.map((turno) => {
        const nombrePaciente = turno.Paciente
          ? `${turno.Paciente.nombre || ""} ${turno.Paciente.apellido || ""}`.trim()
          : (turno.paciente_nombre || turno.nombre_paciente || `Paciente #${turno.id_paciente || ""}`);

        return {
          id: `turno-${turno.id_turno}`,
          title: nombrePaciente,
          start: turno.fecha_hora_inicio,
          end: turno.fecha_hora_fin,
          classNames: ["turno-card-event"],
          extendedProps: {
            ...turno,
            esTurno: true,
          },
        };
      }),
    [turnos],
  );

  /* ─── FORMATEAR RESTRICCIONES / BLOQUEOS VISUALES ──────── */
  const eventosRestricciones = useMemo(() => {
    const eventos = [];
    const diasConBloqueoCompletoMes = new Set();
    const franjasMesRegistradas = new Set();

    restricciones.forEach((r) => {
      let actual = new Date(r.fechaInicio + "T00:00:00");
      const limite = new Date(r.fechaFin + "T00:00:00");

      while (actual <= limite) {
        const y = actual.getFullYear();
        const m = String(actual.getMonth() + 1).padStart(2, "0");
        const d = String(actual.getDate()).padStart(2, "0");
        const fechaStr = `${y}-${m}-${d}`;

        if (r.todoElDia) {
          // 1. Etiqueta para Vista Mensual (ÚNICA por día, sin duplicados)
          if (!diasConBloqueoCompletoMes.has(fechaStr)) {
            diasConBloqueoCompletoMes.add(fechaStr);
            eventos.push({
              id: `rest-mes-${r.id}-${fechaStr}`,
              title: `🔒 ${r.motivo}`,
              start: `${fechaStr}T00:00:00`,
              end: `${fechaStr}T23:59:59`,
              allDay: true,
              display: "block",
              classNames: ["restriccion-dia-completo"],
              backgroundColor: "transparent",
              borderColor: "transparent",
              textColor: "transparent",
              extendedProps: {
                esRestriccion: true,
                restriccionId: r.id,
                motivo: r.motivo,
                todoElDia: true,
                soloVistaMes: true,
              },
            });
          }

          // 2. Bloque para Vista Semanal y Diaria
          eventos.push({
            id: `rest-grid-${r.id}-${fechaStr}`,
            title: `🔒 Día bloqueado: ${r.motivo}`,
            start: `${fechaStr}T${slotMinTimeStr}`,
            end: `${fechaStr}T${slotMaxTimeStr}`,
            allDay: false,
            display: "block",
            classNames: ["restriccion-dia-grid"],
            backgroundColor: "#f1f5f9",
            borderColor: "#cbd5e1",
            textColor: "#334155",
            extendedProps: {
              esRestriccion: true,
              restriccionId: r.id,
              motivo: r.motivo,
              todoElDia: true,
              soloVistaGrid: true,
              colorBg: "#e2e8f0",
              colorBorder: "#cbd5e1",
              colorText: "#334155",
            },
          });
        } else {
          // Bloqueo de Franja Horaria
          const horaIni = r.horaInicio || "08:00";
          const horaFin = r.horaFin || "10:00";
          const franjaKey = `${fechaStr}_${horaIni}_${horaFin}_${r.motivo}`;

          // 1. Etiqueta compacta para Vista Mensual (ÚNICA por franja, sin duplicados)
          if (!franjasMesRegistradas.has(franjaKey)) {
            franjasMesRegistradas.add(franjaKey);
            eventos.push({
              id: `rest-mes-franja-${r.id}-${fechaStr}`,
              title: `🔒 ${horaIni} - ${horaFin} · ${r.motivo}`,
              start: `${fechaStr}T${horaIni}:00`,
              end: `${fechaStr}T${horaFin}:00`,
              allDay: true,
              display: "block",
              classNames: ["restriccion-franja-mes"],
              backgroundColor: "transparent",
              borderColor: "transparent",
              textColor: "#334155",
              extendedProps: {
                esRestriccion: true,
                restriccionId: r.id,
                motivo: r.motivo,
                todoElDia: false,
                horaInicio: horaIni,
                horaFin: horaFin,
                soloVistaMes: true,
              },
            });
          }

          // 2. Bloque para Vista Semanal y Diaria
          eventos.push({
            id: `rest-grid-franja-${r.id}-${fechaStr}`,
            title: `🔒 Bloqueado: ${r.motivo}`,
            start: `${fechaStr}T${horaIni}:00`,
            end: `${fechaStr}T${horaFin}:00`,
            allDay: false,
            display: "block",
            classNames: ["restriccion-franja-grid"],
            backgroundColor: "#f1f5f9",
            borderColor: "#cbd5e1",
            textColor: "#334155",
            extendedProps: {
              esRestriccion: true,
              restriccionId: r.id,
              motivo: r.motivo,
              todoElDia: false,
              soloVistaGrid: true,
              colorBg: "#f3f4f6",
              colorBorder: "#cbd5e1",
              colorText: "#334155",
            },
          });
        }

        actual.setDate(actual.getDate() + 1);
      }
    });

    return eventos;
  }, [restricciones, slotMinTimeStr, slotMaxTimeStr]);

  // Convierte Date local a string ISO sin zona horaria (evita el offset UTC de toISOString)
  const toLocalISOString = (d) => {
    const p = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth()+1) + '-' + p(d.getDate()) +
           'T' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  };

  const eventoPasadoSombra = useMemo(
    () => ({
      id: "pasado-sombra-bg",
      start: "1970-01-01T00:00:00",
      end: toLocalISOString(ahora),
      display: "background",
      backgroundColor: "rgba(241,245,249,0.7)",
    }),
    [ahora],
  );

  const listaEventos = useMemo(
    () => (vistaTipo === "dayGridMonth"
      ? [...eventosRestricciones]
      : [...turnosFormateados, ...eventosRestricciones, eventoPasadoSombra]),
    [vistaTipo, turnosFormateados, eventosRestricciones, eventoPasadoSombra],
  );

  const cambiarVista = (direccion) => {
    let siguienteVista = vistaActual;

    if (direccion === "LEFT" && vistaActual < VISTAS.length - 1) {
      siguienteVista += 1;
    } else if (direccion === "RIGHT" && vistaActual > 0) {
      siguienteVista -= 1;
    }

    if (siguienteVista !== vistaActual) {
      setVistaActual(siguienteVista);
      setVistaTipo(VISTAS[siguienteVista]);
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(VISTAS[siguienteVista]);
      if (onVistaChangeRef.current) onVistaChangeRef.current(VISTAS[siguienteVista]);
    }
  };

  const handlers = useSwipeable({
    onSwipedLeft: () => cambiarVista("LEFT"),
    onSwipedRight: () => cambiarVista("RIGHT"),
    preventScrollOnSwipe: true,
    trackTouch: true,
    trackMouse: false,
  });

  // Feedback visual interactivo: aplicar clase de resaltado a las celdas abarcadas por el arrastre
  useEffect(() => {
    if (!contenedorRef.current) return;
    const celdas = contenedorRef.current.querySelectorAll(
      '[role="cell"][data-date], td[data-date]'
    );

    if (!isDragging || !dragStart || !dragEnd) {
      celdas.forEach((el) => {
        el.classList.remove("celda-drag-resaltada");
      });
      return;
    }

    const minStr = dragStart <= dragEnd ? dragStart : dragEnd;
    const maxStr = dragStart <= dragEnd ? dragEnd : dragStart;

    celdas.forEach((el) => {
      const fecha = el.getAttribute("data-date");
      if (fecha && fecha >= minStr && fecha <= maxStr) {
        el.classList.add("celda-drag-resaltada");
      } else {
        el.classList.remove("celda-drag-resaltada");
      }
    });
  }, [isDragging, dragStart, dragEnd]);

  // Manejadores de eventos de arrastre (Click & Drag) sobre la grilla mensual
  useEffect(() => {
    const container = contenedorRef.current;
    if (!container) return;
    if (vistaTipo !== "dayGridMonth") return;

    const getCellDate = (elem) => {
      if (!elem) return null;
      const cell = elem.closest('[role="cell"][data-date], td[data-date]');
      return cell ? cell.getAttribute("data-date") : null;
    };

    const handleMouseDown = (e) => {
      if (vistaTipo !== "dayGridMonth" || e.button !== 0) return;

      const dateStr = getCellDate(e.target);
      if (!dateStr) return;

      isDraggingRef.current = true;
      dragStartRef.current = dateStr;
      dragEndRef.current = dateStr;

      setIsDragging(true);
      setDragStart(dateStr);
      setDragEnd(dateStr);
    };

    const handleMouseOver = (e) => {
      if (!isDraggingRef.current || vistaTipo !== "dayGridMonth") return;

      const dateStr = getCellDate(e.target);
      if (dateStr && dateStr !== dragEndRef.current) {
        dragEndRef.current = dateStr;
        setDragEnd(dateStr);
      }
    };

    const handleGlobalMouseUp = (e) => {
      if (!isDraggingRef.current) return;

      isDraggingRef.current = false;
      setIsDragging(false);

      const start = dragStartRef.current;
      const elem =
        e.clientX !== undefined
          ? document.elementFromPoint(e.clientX, e.clientY)
          : null;
      const cellUnderCursor = elem ? getCellDate(elem) : null;
      const end = cellUnderCursor || dragEndRef.current || start;

      if (start && end) {
        const minStr = start <= end ? start : end;
        const maxStr = start <= end ? end : start;

        const esMismoDia = minStr === maxStr;

        // Comprobar si el día clickeado tiene bloqueo de DÍA COMPLETO
        if (esMismoDia) {
          const bloqueoCompleto = restricciones.find(
            (r) => (r.todoElDia || r.tipo === "dia_completo") && minStr >= r.fechaInicio && minStr <= r.fechaFin
          );

          if (bloqueoCompleto) {
            // Es la celda gris bloqueada: abrir modal directamente para ver motivo y eliminar
            setRangoFechasSeleccionadas({
              inicio: new Date(bloqueoCompleto.fechaInicio + "T00:00:00"),
              fin: new Date(bloqueoCompleto.fechaFin + "T00:00:00"),
            });
            setModalRestriccionAbierto(true);
            return;
          }

          // Si el día está libre o solo tiene franja horaria:
          // Navegar a la vista diaria de ese día para que el usuario pueda ingresar y dar turnos en los horarios habilitados
          const api = calendarRef.current?.getApi();
          if (api) {
            api.changeView("timeGridDay", minStr);
            setVistaTipo("timeGridDay");
            setVistaActual(0);
            if (onVistaChangeRef.current) onVistaChangeRef.current("timeGridDay");
          }
          return;
        }

        // Si fue arrastre entre varios días (drag selection de rango):
        const inicio = new Date(minStr + "T00:00:00");
        const fin = new Date(maxStr + "T00:00:00");
        setRangoFechasSeleccionadas({ inicio, fin });
        setModalRestriccionAbierto(true);
      }
    };

    const handleTouchStart = (e) => {
      if (vistaTipo !== "dayGridMonth" || !e.touches || e.touches.length !== 1)
        return;
      const touch = e.touches[0];
      const elem = document.elementFromPoint(touch.clientX, touch.clientY);
      const dateStr = elem ? getCellDate(elem) : null;
      if (!dateStr) return;

      isDraggingRef.current = true;
      dragStartRef.current = dateStr;
      dragEndRef.current = dateStr;

      setIsDragging(true);
      setDragStart(dateStr);
      setDragEnd(dateStr);
    };

    const handleTouchMove = (e) => {
      if (!isDraggingRef.current || vistaTipo !== "dayGridMonth" || !e.touches)
        return;
      const touch = e.touches[0];
      const elem = document.elementFromPoint(touch.clientX, touch.clientY);
      const dateStr = elem ? getCellDate(elem) : null;
      if (dateStr && dateStr !== dragEndRef.current) {
        dragEndRef.current = dateStr;
        setDragEnd(dateStr);
      }
    };

    const handleTouchEnd = (e) => {
      if (!isDraggingRef.current) return;
      handleGlobalMouseUp(e);
    };

    container.addEventListener("mousedown", handleMouseDown);
    container.addEventListener("mouseover", handleMouseOver);
    container.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      container.removeEventListener("mousedown", handleMouseDown);
      container.removeEventListener("mouseover", handleMouseOver);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [vistaTipo, restricciones]);

  const selectAllow = (selectInfo) => {
    // En vista mensual permitir la selección libre (handleDateSelect diferencia clic simple de arrastre)
    if (selectInfo.view.type === "dayGridMonth") return true;

    
    // Bloquear slots pasados en vistas de grilla
    if (selectInfo.start < new Date()) return false;

// 1. Validar si el día completo está bloqueado
    if (esDiaBloqueado(selectInfo.start)) {
      return false;
    }

    // 2. Si es franja horaria en vista diaria o semanal:
    if (!selectInfo.allDay && selectInfo.start) {
      const minInicio = selectInfo.start.getHours() * 60 + selectInfo.start.getMinutes();
      const minFin = selectInfo.end
        ? selectInfo.end.getHours() * 60 + selectInfo.end.getMinutes()
        : minInicio + 30;

      if (minInicio < minutosInicioJornada || minFin > minutosFinJornada) {
        return false;
      }

      // Validar si la franja seleccionada coincide con un slot bloqueado
      const durMin = Math.max(15, minFin - minInicio);
      const conflicto = verificarSolapamientoConRestricciones(selectInfo.start, durMin);
      if (conflicto) {
        return false;
      }
    }

    return true;
  };

  const handleCerrarModal = () => {
    setModalRestriccionAbierto(false);
    setRangoFechasSeleccionadas(null);
    setDragStart(null);
    setDragEnd(null);
    setIsDragging(false);
    isDraggingRef.current = false;
    dragStartRef.current = null;
    dragEndRef.current = null;
    const api = calendarRef.current?.getApi();
    if (api) {
      api.unselect();
    }
  };

  const procesarSeleccionSlotLibre = (slotInfo) => {
    const ahoraMs = Date.now();
    if (ahoraMs - ultimoClickSlotRef.current < 250) return;
    ultimoClickSlotRef.current = ahoraMs;

    if (onDateSelect) {
      onDateSelect(slotInfo);
    }
  };

  // Clic directo en un slot en la Vista Diaria o Semanal
  const handleDateClick = (dateClickInfo) => {
    if (dateClickInfo.view.type === "dayGridMonth") return;

    const fechaDate = dateClickInfo.date;
        // Bloquear clics en slots pasados
    if (fechaDate < new Date()) return;

if (esDiaBloqueado(fechaDate)) return;

    const conflicto = verificarSolapamientoConRestricciones(fechaDate, 30);
    if (conflicto) return;

    procesarSeleccionSlotLibre({
      start: fechaDate,
      end: new Date(fechaDate.getTime() + 30 * 60000),
      startStr: dateClickInfo.dateStr,
      endStr: new Date(fechaDate.getTime() + 30 * 60000).toISOString(),
      allDay: dateClickInfo.allDay,
      view: dateClickInfo.view,
    });
  };

  // Selección de rango de slots en la Vista Diaria o Semanal
  const handleDateSelect = (selectInfo) => {
    if (selectInfo.view.type === "dayGridMonth") return;

        // Bloquear selección de rangos pasados
    if (selectInfo.start < new Date()) return;

if (esDiaBloqueado(selectInfo.start)) return;

    const durMin = Math.max(15, (selectInfo.end.getTime() - selectInfo.start.getTime()) / 60000);
    const conflicto = verificarSolapamientoConRestricciones(selectInfo.start, durMin);
    if (conflicto) return;

    procesarSeleccionSlotLibre(selectInfo);
  };

  const handleEventClick = (clickInfo) => {
    if (clickInfo.event.extendedProps?.esRestriccion) {
      const idRest = clickInfo.event.extendedProps.restriccionId;
      const restObj = restricciones.find((r) => r.id === idRest);
      if (restObj) {
        setRangoFechasSeleccionadas({
          inicio: new Date(restObj.fechaInicio + "T00:00:00"),
          fin: new Date(restObj.fechaFin + "T00:00:00"),
        });
      }
      setModalRestriccionAbierto(true);
      return;
    }

    if (onEventClick) {
      onEventClick(clickInfo);
    }
  };

  const handleEventDidMount = (info) => {
    if (info.event.display === "background") return;

    const props = info.event.extendedProps;

    // En vista mensual: ocultar turnos regulares y eventos de día completo (celda limpia sin badges ni líneas)
    if (info.view.type === "dayGridMonth") {
      if (!props?.esRestriccion || props?.soloVistaGrid || props?.todoElDia) {
        info.el.style.setProperty("display", "none", "important");
        return;
      }
    }

    // En vistas semanales y diarias (timeGrid): ocultar eventos exclusivos de vista mensual
    if (info.view.type !== "dayGridMonth" && props?.soloVistaMes) {
      info.el.style.setProperty("display", "none", "important");
      return;
    }

    if (props?.esRestriccion) {
      const { colorBg, colorBorder, colorText } = props;
      if (colorBg) {
        info.el.style.setProperty("background-color", colorBg, "important");
        info.el.style.setProperty("border-color", colorBorder, "important");
        info.el.style.setProperty("color", colorText, "important");
      }
      info.el.style.setProperty("--fc-event-color", "#cbd5e1", "important");
      info.el.style.setProperty("--fc-forma-event", "#cbd5e1", "important");
      info.el.style.setProperty("border-left", "none", "important");
      info.el.style.setProperty("border-left-width", "0px", "important");
      info.el.style.setProperty("border-left-color", "transparent", "important");
      info.el.style.setProperty("border-inline-start", "none", "important");
      info.el.style.setProperty("border-inline-start-width", "0px", "important");
      info.el.style.setProperty("border-inline-start-color", "transparent", "important");
      info.el.style.setProperty("font-weight", "600", "important");
      info.el.style.setProperty("cursor", "pointer", "important");
    } else {
      // Turno médico: contenedor de FullCalendar transparente para lucir la tarjeta médica
      info.el.style.setProperty("background", "transparent", "important");
      info.el.style.setProperty("background-color", "transparent", "important");
      info.el.style.setProperty("border", "none", "important");
      info.el.style.setProperty("box-shadow", "none", "important");
      info.el.style.setProperty("padding", "0px", "important");
      info.el.style.setProperty("overflow", "visible", "important");
    }
  };

  const getDayCellClassNames = (arg) => {
    const y = arg.date.getFullYear();
    const m = String(arg.date.getMonth() + 1).padStart(2, "0");
    const d = String(arg.date.getDate()).padStart(2, "0");
    const fechaKey = `${y}-${m}-${d}`;

    const restDia = restricciones.find(
      (r) => r.todoElDia && fechaKey >= r.fechaInicio && fechaKey <= r.fechaFin
    );

    if (restDia) {
      return ["celda-bloqueada-completo", "bg-slate-300", "text-slate-700"];
    }
    return [];
  };

  const renderEventContent = (eventInfo) => {
    const props = eventInfo.event.extendedProps || {};

    if (eventInfo.view.type === "dayGridMonth") {
      if (props?.esRestriccion) {
        if (props.todoElDia) {
          // La celda de día completo debe quedar completamente limpia (solo con el número del día)
          return null;
        } else {
          return (
            <div
              className="w-full px-1.5 py-0.5 rounded-md bg-gray-100 border border-gray-200 text-[10px] font-semibold text-gray-600 truncate flex items-center gap-1 select-none"
              title={`🔒 ${props.horaInicio || ""} - ${props.horaFin || ""} · ${props.motivo || ""}`}
            >
              <span>🔒</span>
              <span className="truncate">
                {props.horaInicio} - {props.horaFin} · {props.motivo}
              </span>
            </div>
          );
        }
      }
      return null;
    }

    // Si es restricción / bloqueo en Vista Diaria o Semanal
    if (props?.esRestriccion) {
      return (
        <div className="w-full h-full flex flex-col justify-center p-1 overflow-hidden select-none">
          <span className="font-bold truncate text-xs">🔒 {props.motivo || "Bloqueo"}</span>
          <span className="text-[10px] opacity-80 truncate">
            {props.horaInicio} - {props.horaFin} hs
          </span>
        </div>
      );
    }

    // Tarjeta médica de Turno en Vista Diaria y Semanal
    const turno = props;
    const esSemana = eventInfo.view.type === "timeGridWeek";

    // 1. Extraer nombre del paciente
    const nombrePaciente = turno.Paciente
      ? `${turno.Paciente.nombre || ""} ${turno.Paciente.apellido || ""}`.trim()
      : (turno.paciente_nombre || turno.nombre_paciente || `Paciente #${turno.id_paciente || ""}`);

    // 2. Extraer horarios y calcular duración
    const startDate = eventInfo.event.start || (turno.fecha_hora_inicio ? new Date(turno.fecha_hora_inicio) : null);
    const endDate = eventInfo.event.end || (turno.fecha_hora_fin ? new Date(turno.fecha_hora_fin) : null);

    const formatoHora = (d) => {
      if (!d || isNaN(d.getTime())) return "";
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return `${hh}:${mm}`;
    };

    const horaInicio = formatoHora(startDate);
    const horaFin = formatoHora(endDate);

    let duracion = "";
    if (startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      const diffMin = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
      if (diffMin > 0) {
        const horas = diffMin / 60;
        if (horas >= 1) {
          duracion = horas % 1 === 0 ? `${horas}h` : `${horas.toFixed(1)}h`;
        } else {
          duracion = `${diffMin}m`;
        }
      }
    }

    // 3. Estado del turno y estilos dinámicos (Borde fuerte + fondo pastel/claro)
    const estadoRaw = (
      turno.estado ||
      turno.EstadoTurno?.nombre ||
      turno.EstadoTurno?.estado ||
      turno.estado_turno ||
      ""
    ).toString().toLowerCase().trim();

    const idEstado = Number(turno.id_estado);

    let estilosContenedor;
    let estilosBadge;
    let textoEstado;

    if (estadoRaw.includes("atendido") || idEstado === 3) {
      estilosContenedor = "bg-emerald-50/90 border border-emerald-400 border-l-4 border-l-emerald-500 text-emerald-950 hover:bg-emerald-100/90";
      estilosBadge = "bg-emerald-100/90 text-emerald-800 border border-emerald-300";
      textoEstado = "✓ ATENDIDO";
    } else if (estadoRaw.includes("espera") || estadoRaw.includes("pendiente")) {
      estilosContenedor = "bg-amber-50/90 border border-amber-400 border-l-4 border-l-amber-500 text-amber-950 hover:bg-amber-100/90";
      estilosBadge = "bg-amber-100 text-amber-800 border border-amber-300";
      textoEstado = "EN ESPERA";
    } else if (estadoRaw.includes("cancelado") || idEstado === 2) {
      estilosContenedor = "bg-rose-50/90 border border-rose-400 border-l-4 border-l-rose-500 text-rose-950 hover:bg-rose-100/90";
      estilosBadge = "bg-rose-100 text-rose-800 border border-rose-300";
      textoEstado = "CANCELADO";
    } else if (estadoRaw.includes("inasistente") || estadoRaw.includes("ausente") || idEstado === 4) {
      estilosContenedor = "bg-slate-100/90 border border-slate-400 border-l-4 border-l-slate-500 text-slate-800 hover:bg-slate-200/90";
      estilosBadge = "bg-slate-200 text-slate-800 border border-slate-300";
      textoEstado = "AUSENTE";
    } else {
      // Programado / Confirmado / Default
      estilosContenedor = "bg-blue-50/90 border border-blue-400 border-l-4 border-l-blue-500 text-blue-950 hover:bg-blue-100/90";
      estilosBadge = "bg-blue-100 text-blue-800 border border-blue-300";
      textoEstado = "PROGRAMADO";
    }

    return (
      <div
        className={`w-full h-full rounded-xl p-1.5 sm:p-2.5 flex ${
          esSemana
            ? "flex-col items-start justify-between gap-1"
            : "flex-row items-center justify-between"
        } shadow-xs transition-all cursor-pointer select-none overflow-hidden ${estilosContenedor}`}
        title={`${nombrePaciente} (${horaInicio} - ${horaFin} hs) · ${textoEstado}`}
      >
        {/* Lado izquierdo: Datos del paciente y horario */}
        <div className="flex flex-col justify-center gap-0.5 overflow-hidden min-w-0 w-full flex-1">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold truncate">
            <span className="text-xs sm:text-sm shrink-0">👤</span>
            <span className="truncate">{nombrePaciente}</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs opacity-85 truncate">
            <span className="truncate">🕒 {horaInicio} - {horaFin} hs</span>
            {duracion && (
              <span className="px-1.5 py-0.2 rounded-md bg-white/80 border border-gray-200 font-semibold text-[9px] sm:text-[10px] shrink-0">
                {duracion}
              </span>
            )}
          </div>
        </div>

        {/* Lado derecho: Badge de estado */}
        <div className={`shrink-0 ${esSemana ? "mt-0.5" : "ml-2"}`}>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] sm:text-xs font-semibold ${estilosBadge}`}>
            {textoEstado}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div
      {...handlers}
      ref={contenedorRef}
      className={`w-full h-full bg-white relative flex flex-col agenda-vista-${vistaTipo}`}
    >
      <div className="flex-1 min-h-0 w-full relative">
        <FullCalendar
          ref={calendarRef}
          plugins={[themePlugin, dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridDay"
          headerToolbar={
            esMobile
              ? {
                  left: "prev,next",
                  center: "title",
                  right: "timeGridDay,timeGridWeek,dayGridMonth",
                }
              : {
                  left: "prev,next today",
                  center: "title",
                  right: "timeGridDay,timeGridWeek,dayGridMonth",
                }
          }
          locale={esLocale}
          firstDay={1}
          slotMinTime={slotMinTimeStr}
          slotMaxTime={slotMaxTimeStr}
          scrollTime={slotMinTimeStr}
          businessHours={
            vistaTipo === "dayGridMonth"
              ? false
              : {
                  daysOfWeek: [1, 2, 3, 4, 5, 6],
                  startTime: horaInicioHHMM,
                  endTime: horaFinHHMM,
                }
          }
          allDaySlot={false}
          selectable={true}
          selectAllow={selectAllow}
          editable={true}
          nowIndicator={true}
          height="100%"
          events={listaEventos}
          select={handleDateSelect}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventDidMount={handleEventDidMount}
          dayCellClassNames={getDayCellClassNames}
          eventContent={renderEventContent}
          datesSet={(dateInfo) => {
            const nuevoTipo = dateInfo.view.type;
            setVistaTipo(nuevoTipo);
            const idx = VISTAS.indexOf(nuevoTipo);
            if (idx !== -1) setVistaActual(idx);
            if (onVistaChangeRef.current) onVistaChangeRef.current(nuevoTipo);
          }}
        />
      </div>

      {/* Modal de Restricción / Bloqueo */}
      <ModalRestriccion
        isOpen={modalRestriccionAbierto}
        onClose={handleCerrarModal}
        rangoFechas={rangoFechasSeleccionadas}
        turnos={turnos}
        onGuardar={(datosRestriccion) => {
          const conflictoConTurnos = validarBloqueoConTurnos(datosRestriccion, turnos);
          if (conflictoConTurnos) {
            toast.error(
              "No se puede bloquear el período: Hay turnos asignados en esa fecha. Debes reprogramarlos o cancelarlos antes de aplicar el bloqueo.",
              { icon: "⚠️", duration: 5000 }
            );
            return;
          }
          agregarRestriccion(datosRestriccion);
          handleCerrarModal();
        }}
        onEliminar={(id) => {
          eliminarRestriccion(id);
        }}
        restriccionesExistentes={
          rangoFechasSeleccionadas
            ? obtenerRestriccionesDeRango(
                rangoFechasSeleccionadas.inicio,
                rangoFechasSeleccionadas.fin
              )
            : []
        }
      />

      <style>{`
        .fc-bg-event {
          opacity: 1 !important;
          pointer-events: none !important;
        }

        .fc-non-business {
          pointer-events: none !important;
        }

        .agenda-vista-dayGridMonth [role="cell"][data-date],
        .agenda-vista-dayGridMonth td[data-date] {
          background-color: #ffffff;
          transition: background-color 0.15s ease, box-shadow 0.15s ease;
          user-select: none !important;
        }

        .agenda-vista-dayGridMonth [role="cell"][data-date]:hover,
        .agenda-vista-dayGridMonth td[data-date]:hover {
          filter: brightness(0.97);
        }

        /* Feedback visual interactivo al arrastrar (Click & Drag) */
        .agenda-vista-dayGridMonth .celda-drag-resaltada {
          background-color: #f0fdfa !important; /* bg-teal-50 */
          box-shadow: inset 0 0 0 2px #2dd4bf !important; /* ring-2 ring-teal-400 */
          cursor: grabbing !important;
        }

        /* Celda de día completo bloqueado en Vista Mensual: gris sólido bien visible y sin adornos */
        .agenda-vista-dayGridMonth td.celda-bloqueada-completo,
        .agenda-vista-dayGridMonth [role="cell"].celda-bloqueada-completo,
        .agenda-vista-dayGridMonth td.celda-bloqueada-completo .fc-daygrid-day-frame,
        .agenda-vista-dayGridMonth td.celda-bloqueada-completo .fc-daygrid-day-bg,
        .agenda-vista-dayGridMonth td.celda-bloqueada-completo .fc-daygrid-day-events {
          background-color: #cbd5e1 !important; /* bg-slate-300 */
          color: #1e293b !important; /* text-slate-800 */
          cursor: pointer !important;
          border-left: none !important;
        }

        .agenda-vista-dayGridMonth td.celda-bloqueada-completo .fc-daygrid-day-number,
        .agenda-vista-dayGridMonth [role="cell"].celda-bloqueada-completo .fc-daygrid-day-number {
          color: #1e293b !important;
          font-weight: 700 !important;
        }

        .agenda-vista-dayGridMonth td.celda-bloqueada-completo,
        .agenda-vista-dayGridMonth td.celda-bloqueada-completo * {
          border-left-color: #cbd5e1 !important;
        }

        /* Evento de día completo en Vista Mensual: sin píldora ni bordes, solo texto limpio */
        .agenda-vista-dayGridMonth .fc-event.restriccion-dia-completo {
          background: transparent !important;
          background-color: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          margin: 0 !important;
          width: 100% !important;
          cursor: pointer !important;
        }
        .agenda-vista-dayGridMonth .fc-event.restriccion-dia-completo .fc-event-main {
          background: transparent !important;
          padding: 0 !important;
          width: 100% !important;
        }

        /* Pastilla compacta para franja horaria en Vista Mensual */
        .agenda-vista-dayGridMonth .fc-event.restriccion-franja-mes {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          margin: 1px 0 !important;
          width: 100% !important;
          cursor: pointer !important;
        }

        /* Extirpación total de línea verde en restricciones y franjas */
        .fc-event.restriccion-dia-completo,
        .fc-event.restriccion-franja-mes,
        .fc-event.restriccion-dia-grid,
        .fc-event.restriccion-franja-grid,
        .fc-timegrid-event.restriccion-dia-grid,
        .fc-timegrid-event.restriccion-franja-grid,
        .fc-daygrid-event.restriccion-franja-mes,
        .fc-daygrid-event.restriccion-dia-completo {
          --fc-event-color: #cbd5e1 !important;
          --fc-forma-event: #cbd5e1 !important;
          --fc-event-border-color: #cbd5e1 !important;
          border-left: none !important;
          border-left-width: 0 !important;
          border-left-color: transparent !important;
          border-inline-start: none !important;
          border-inline-start-width: 0 !important;
          border-inline-start-color: transparent !important;
        }

        .fc-event.restriccion-dia-completo *,
        .fc-event.restriccion-franja-mes *,
        .fc-event.restriccion-dia-grid *,
        .fc-event.restriccion-franja-grid * {
          border-left-color: transparent !important;
          border-inline-start-color: transparent !important;
        }

        /* Bloques de restricción en grilla horaria (Semana y Día) */
        .fc-event.restriccion-dia-grid,
        .fc-event.restriccion-franja-grid {
          background-color: #f1f5f9 !important; /* bg-slate-100 */
          border: 1px dashed #94a3b8 !important; /* border-slate-400 */
          border-left: 1px dashed #94a3b8 !important;
          border-inline-start: 1px dashed #94a3b8 !important;
          color: #334155 !important;
          border-radius: 8px !important;
          font-size: 0.75rem !important;
          font-weight: 700 !important;
          padding: 4px 6px !important;
          cursor: pointer !important;
          box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.2) !important;
        }

        .fc-event.restriccion-dia-grid .fc-event-main,
        .fc-event.restriccion-franja-grid .fc-event-main,
        .fc-event.restriccion-dia-grid .fc-event-title,
        .fc-event.restriccion-dia-grid .fc-event-time,
        .fc-event.restriccion-franja-grid .fc-event-title,
        .fc-event.restriccion-franja-grid .fc-event-time {
          background: transparent !important;
          border: none !important;
          border-left: none !important;
          border-inline-start: none !important;
          color: #334155 !important;
        }

        .fc-event.restriccion-dia-grid:hover,
        .fc-event.restriccion-franja-grid:hover {
          filter: brightness(0.96) !important;
        }

        /* Tarjetas de Turnos en Vista Diaria y Semanal */
        .fc-timegrid-event.turno-card-event,
        .fc-v-event.turno-card-event,
        .fc-timegrid-event.turno-card-event:hover,
        .fc-v-event.turno-card-event:hover {
          background: transparent !important;
          background-color: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 1px !important;
          overflow: visible !important;
        }

        .fc-timegrid-event.turno-card-event .fc-event-main,
        .fc-v-event.turno-card-event .fc-event-main {
          background: transparent !important;
          background-color: transparent !important;
          border: none !important;
          padding: 0 !important;
          height: 100% !important;
          width: 100% !important;
          display: flex !important;
          flex-direction: column !important;
        }

        .agenda-vista-timeGridWeek [role="columnheader"][data-date] {
          background-color: #ffffff !important;
          transition: background-color 0.2s ease;
        }

        ${estilosOcupacionPorFecha}
      `}</style>
    </div>
  );
};

export default AgendaCalendar;
