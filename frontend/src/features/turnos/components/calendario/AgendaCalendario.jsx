/** @format */

import { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

import { SLOTS_HORAS } from "../../utils/agendaStyles";
import { useConfiguracion } from "../../../../context/ConfiguracionContext";
import { useRestricciones } from "../../hooks/useRestricciones";
import useInteractiveSwipe from "../../../../hooks/useInteractiveSwipe";
import ModalRestriccion from "../modales/ModalRestriccion";
import VistaDia from "./VistaDia";
import VistaSemana from "./VistaSemana";
import VistaMes from "./VistaMes";

export const AgendaCalendar = memo(function AgendaCalendar({
  turnos = [],
  onDateSelect,
  onEventClick,
}) {
  const {
    configuracion,
    slotsHoras,
    horaInicioNum,
    totalModulosDia,
    corteBajaModulos,
    corteMediaModulos,
    esDiaLaboral,
  } = useConfiguracion();

  const capacidadTotal = totalModulosDia || 24;
  const corte60 = corteBajaModulos || Math.round(capacidadTotal * 0.5);
  const corte85 = corteMediaModulos || Math.round(capacidadTotal * 0.8);

  const {
    restricciones,
    esSlotBloqueado: esSlotRestringido,
    obtenerRestriccionSlot: obtenerRestriccionSlotOriginal,
    esDiaBloqueado: esDiaRestringido,
    obtenerRestriccionDia: obtenerRestriccionDiaOriginal,
    obtenerRestriccionesDeFecha,
    agregarRestriccion,
    eliminarRestriccion,
  } = useRestricciones();

  // Integrar días laborales con restricciones del sistema
  const esDiaBloqueado = useCallback(
    (fecha) => {
      if (esDiaLaboral && !esDiaLaboral(fecha)) return true;
      return esDiaRestringido ? esDiaRestringido(fecha) : false;
    },
    [esDiaLaboral, esDiaRestringido],
  );

  const obtenerRestriccionDia = useCallback(
    (fecha) => {
      if (esDiaLaboral && !esDiaLaboral(fecha)) {
        return { motivo: "Día no laboral" };
      }
      return obtenerRestriccionDiaOriginal
        ? obtenerRestriccionDiaOriginal(fecha)
        : null;
    },
    [esDiaLaboral, obtenerRestriccionDiaOriginal],
  );

  const esSlotBloqueado = useCallback(
    (fecha, hora) => {
      if (esDiaLaboral && !esDiaLaboral(fecha)) return true;
      return esSlotRestringido ? esSlotRestringido(fecha, hora) : false;
    },
    [esDiaLaboral, esSlotRestringido],
  );

  const obtenerRestriccionSlot = useCallback(
    (fecha, hora) => {
      if (esDiaLaboral && !esDiaLaboral(fecha)) {
        return { motivo: "Día no laboral" };
      }
      return obtenerRestriccionSlotOriginal
        ? obtenerRestriccionSlotOriginal(fecha, hora)
        : null;
    },
    [esDiaLaboral, obtenerRestriccionSlotOriginal],
  );

  const slotsHorasActuales = slotsHoras && slotsHoras.length > 0 ? slotsHoras : SLOTS_HORAS;

  const [fechaActual, setFechaActual] = useState(new Date());
  const [vista, setVista] = useState("dia");
  const [isSelecting, setIsSelecting] = useState(false);
  const [isSelectingMes, setIsSelectingMes] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);
  const [ahora, setAhora] = useState(new Date());
  const [modalRestriccionAbierto, setModalRestriccionAbierto] = useState(false);
  const [rangoModalRestriccion, setRangoModalRestriccion] = useState({
    inicio: new Date(),
    fin: new Date(),
  });

  const abrirModalRestriccion = useCallback((inicio, fin = inicio) => {
    setRangoModalRestriccion({ inicio, fin });
    setModalRestriccionAbierto(true);
  }, []);

  const containerRef = useRef(null);
  const ultimoTouchTimeRef = useRef(0);
  const isSelectingRef = useRef(false);
  const isSelectingMesRef = useRef(false);
  const selectionStartRef = useRef(null);
  const selectionEndRef = useRef(null);
  const onDateSelectRef = useRef(onDateSelect);
  const onEventClickRef = useRef(onEventClick);

  useEffect(() => {
    onDateSelectRef.current = onDateSelect;
  }, [onDateSelect]);

  useEffect(() => {
    onEventClickRef.current = onEventClick;
  }, [onEventClick]);

  const touchStateRef = useRef({
    startX: 0,
    startY: 0,
    startTime: 0,
    fecha: null,
    hora: null,
    isScrolling: false,
    isHolding: false,
    timer: null,
  });

  useEffect(() => {
    const interval = setInterval(() => setAhora(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Prevenir scroll nativo ÚNICAMENTE cuando se está sosteniendo para arrastrar duración
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onNativeTouchMove = (e) => {
      if (touchStateRef.current.isHolding) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    };

    container.addEventListener("touchmove", onNativeTouchMove, {
      passive: false,
    });
    return () => {
      container.removeEventListener("touchmove", onNativeTouchMove);
    };
  }, []);

  const cambiarFecha = useCallback((delta) => {
    setFechaActual((prev) => {
      const nueva = new Date(prev);
      if (vista === "dia") nueva.setDate(nueva.getDate() + delta);
      else if (vista === "semana") nueva.setDate(nueva.getDate() + delta * 7);
      else if (vista === "mes") nueva.setMonth(nueva.getMonth() + delta);
      return nueva;
    });
  }, [vista]);

  const handleMesDragStart = useCallback(() => {
    isSelectingMesRef.current = true;
    setIsSelectingMes(true);
  }, []);

  const handleMesDragEnd = useCallback(() => {
    isSelectingMesRef.current = false;
    setIsSelectingMes(false);
  }, []);

  // Hook de swipe interactivo para pasar de fecha en tiempo real (día, semana y mes)
  const {
    containerProps: interactiveSwipeProps,
    style: interactiveSwipeStyle,
  } = useInteractiveSwipe({
    onSwipeLeft: () => {
      if (!isSelectingRef.current && !isSelectingMesRef.current) {
        cambiarFecha(1);
      }
    },
    onSwipeRight: () => {
      if (!isSelectingRef.current && !isSelectingMesRef.current) {
        cambiarFecha(-1);
      }
    },
    disabled: isSelecting || isSelectingMes,
    scrollToTopOnSwipe: false,
  });

  const irHoy = () => setFechaActual(new Date());

  const formatISO = (date, horaStr) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}T${horaStr}:00`;
  };

  const diasSemana = useMemo(() => {
    const start = new Date(fechaActual);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);

    const dias = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dias.push(d);
    }
    return dias;
  }, [fechaActual]);

  const handleEventClick = useCallback((...args) => {
    onEventClickRef.current?.(...args);
  }, []);

  const cerrarModalRestriccion = useCallback(() => {
    setModalRestriccionAbierto(false);
  }, []);

  // Validación estricta por hora exacta (comparando fecha y hora del slot vs ahora)
  const esSlotPasado = useCallback(
    (fecha, horaStr) => {
      const [h, m] = horaStr.split(":").map(Number);
      const slotTime = new Date(
        fecha.getFullYear(),
        fecha.getMonth(),
        fecha.getDate(),
        h,
        m,
        0,
      );
      return slotTime < ahora;
    },
    [ahora],
  );

  const confirmarSeleccion = useCallback(
    (startItem, endItem) => {
      if (!startItem || !endItem) return;

      const inicioIndex = slotsHorasActuales.indexOf(startItem.horaStr);
      const finIndex = slotsHorasActuales.indexOf(endItem.horaStr);

      if (inicioIndex === -1 || finIndex === -1) return;

      const indexMin = Math.min(inicioIndex, finIndex);
      const indexMax = Math.max(inicioIndex, finIndex);

      const horaInicioStr = slotsHorasActuales[indexMin];

      let horaFinStr;
      if (indexMax + 1 < slotsHorasActuales.length) {
        horaFinStr = slotsHorasActuales[indexMax + 1];
      } else {
        const [h, m] = slotsHorasActuales[indexMax].split(":").map(Number);
        const mod = configuracion?.duracionModuloMinutos || 30;
        const totalM = h * 60 + m + mod;
        const finH = String(Math.floor(totalM / 60)).padStart(2, "0");
        const finM = String(totalM % 60).padStart(2, "0");
        horaFinStr = `${finH}:${finM}`;
      }

      const startStr = formatISO(startItem.fecha, horaInicioStr);
      const endStr = formatISO(startItem.fecha, horaFinStr);

      if (new Date(startStr) < ahora) {
        toast.error("El turno seleccionado incluye horarios pasados.", {
          id: "error-horario-pasado",
        });
        return;
      }

      if (onDateSelectRef.current) {
        onDateSelectRef.current({
          startStr,
          endStr,
          start: new Date(startStr),
          end: new Date(endStr),
        });
      }
    },
    [ahora, slotsHorasActuales, configuracion],
  );

  const confirmarSeleccionRef = useRef(confirmarSeleccion);
  useEffect(() => {
    confirmarSeleccionRef.current = confirmarSeleccion;
  }, [confirmarSeleccion]);

  // Global mouse up para finalizar selección
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isSelectingRef.current) {
        isSelectingRef.current = false;
        const start = selectionStartRef.current;
        const end = selectionEndRef.current;
        setIsSelecting(false);
        setSelectionStart(null);
        setSelectionEnd(null);
        selectionStartRef.current = null;
        selectionEndRef.current = null;

        if (start && end) {
          confirmarSeleccionRef.current(start, end);
        }
      }
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  // Mouse Desktop Handlers
  const handleSlotMouseDown = (e, fecha, horaStr) => {
    if (e) {
      if (e.button !== 0) return;
      e.preventDefault();
    }
    if (Date.now() - ultimoTouchTimeRef.current < 500) return;

    if (esSlotPasado(fecha, horaStr)) {
      toast.error("No se pueden seleccionar horarios pasados.", {
        id: "error-horario-pasado",
      });
      return;
    }

    isSelectingRef.current = true;
    selectionStartRef.current = { fecha, horaStr };
    selectionEndRef.current = { fecha, horaStr };
    setIsSelecting(true);
    setSelectionStart({ fecha, horaStr });
    setSelectionEnd({ fecha, horaStr });
  };

  const handleSlotMouseEnter = (fecha, horaStr) => {
    if (Date.now() - ultimoTouchTimeRef.current < 500) return;

    if (isSelectingRef.current && selectionStartRef.current) {
      if (
        fecha.toDateString() !== selectionStartRef.current.fecha.toDateString()
      )
        return;
      if (esSlotPasado(fecha, horaStr)) return;

      selectionEndRef.current = { fecha, horaStr };
      setSelectionEnd({ fecha, horaStr });
    }
  };

  // Touch Mobile Handlers
  const handleTouchStart = (e, fecha, horaStr) => {
    ultimoTouchTimeRef.current = Date.now();
    const touch = e.touches[0];

    if (touchStateRef.current.timer) {
      clearTimeout(touchStateRef.current.timer);
    }

    touchStateRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      fecha,
      hora: horaStr,
      isScrolling: false,
      isHolding: false,
      timer: null,
    };

    touchStateRef.current.timer = setTimeout(() => {
      if (!touchStateRef.current.isScrolling) {
        touchStateRef.current.isHolding = true;

        if (esSlotPasado(fecha, horaStr)) {
          if (window.navigator?.vibrate) {
            window.navigator.vibrate([20, 50, 20]);
          }
          toast.error("No se pueden seleccionar horarios pasados.", {
            id: "error-horario-pasado",
          });
          return;
        }

        if (window.navigator?.vibrate) {
          window.navigator.vibrate(30);
        }
        setIsSelecting(true);
        setSelectionStart({ fecha, horaStr });
        setSelectionEnd({ fecha, horaStr });
      }
    }, 220);
  };

  const handleTouchMove = (e) => {
    ultimoTouchTimeRef.current = Date.now();
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStateRef.current.startX);
    const deltaY = Math.abs(touch.clientY - touchStateRef.current.startY);

    if (!touchStateRef.current.isHolding) {
      if (deltaY > 8 || deltaX > 8) {
        touchStateRef.current.isScrolling = true;
        if (touchStateRef.current.timer) {
          clearTimeout(touchStateRef.current.timer);
          touchStateRef.current.timer = null;
        }
      }
      return;
    }

    const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!targetEl) return;
    const slotEl = targetEl.closest("[data-slot-hora]");
    if (slotEl) {
      const horaHover = slotEl.getAttribute("data-slot-hora");
      if (horaHover && horaHover !== selectionEnd?.horaStr) {
        if (!esSlotPasado(touchStateRef.current.fecha, horaHover)) {
          setSelectionEnd({
            fecha: touchStateRef.current.fecha,
            horaStr: horaHover,
          });
        }
      }
    }
  };

  const handleTouchEnd = () => {
    ultimoTouchTimeRef.current = Date.now();

    if (touchStateRef.current.timer) {
      clearTimeout(touchStateRef.current.timer);
      touchStateRef.current.timer = null;
    }

    if (touchStateRef.current.isScrolling) {
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
      return;
    }

    const { isHolding } = touchStateRef.current;

    if (isHolding && isSelecting && selectionStart && selectionEnd) {
      setIsSelecting(false);
      confirmarSeleccion(selectionStart, selectionEnd);
      setSelectionStart(null);
      setSelectionEnd(null);
      return;
    }

    if (
      !touchStateRef.current.isScrolling &&
      touchStateRef.current.fecha &&
      touchStateRef.current.hora
    ) {
      if (
        esSlotPasado(touchStateRef.current.fecha, touchStateRef.current.hora)
      ) {
        toast.error("No se pueden seleccionar horarios pasados.", {
          id: "error-horario-pasado",
        });
        setIsSelecting(false);
        setSelectionStart(null);
        setSelectionEnd(null);
        return;
      }
      const start = {
        fecha: touchStateRef.current.fecha,
        horaStr: touchStateRef.current.hora,
      };
      const end = selectionEnd || start;
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
      confirmarSeleccion(start, end);
      return;
    }

    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  const isSlotSelected = (fecha, horaStr) => {
    if (!isSelecting || !selectionStart || !selectionEnd) return false;
    if (fecha.toDateString() !== selectionStart.fecha.toDateString())
      return false;

    const idx = slotsHorasActuales.indexOf(horaStr);
    const startIdx = slotsHorasActuales.indexOf(selectionStart.horaStr);
    const endIdx = slotsHorasActuales.indexOf(selectionEnd.horaStr);

    const min = Math.min(startIdx, endIdx);
    const max = Math.max(startIdx, endIdx);

    return idx >= min && idx <= max;
  };

  return (
    <div
      {...interactiveSwipeProps}
      className="w-full h-full flex flex-col bg-white dark:bg-slate-900 rounded-2xl select-none overflow-hidden border border-gray-200/90 dark:border-slate-800 shadow-sm relative"
    >
      {/* ─── HEADER DE LA AGENDA ─── */}
      <div className="border-b border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
        {/* Fila principal: navegación de fechas a la izquierda, selector de vista a la derecha */}
        <div className="flex items-center justify-between gap-1.5 px-2.5 py-2 sm:px-4 sm:py-2.5 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
            <button
              type="button"
              onClick={irHoy}
              className="px-2.5 py-1 sm:px-3.5 sm:py-1.5 text-xs font-bold text-gray-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-gray-300 dark:hover:border-slate-600 shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              Hoy
            </button>
            <div className="flex items-center bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xs overflow-hidden shrink-0">
              <button
                type="button"
                onClick={() => cambiarFecha(-1)}
                className="p-1 sm:p-1.5 text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                aria-label="Anterior"
              >
                <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
              </button>
              <button
                type="button"
                onClick={() => cambiarFecha(1)}
                className="p-1 sm:p-1.5 text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                aria-label="Siguiente"
              >
                <ChevronRight size={16} className="sm:w-5 sm:h-5" />
              </button>
            </div>
            {/* Versión móvil compacta */}
            <h2 className="sm:hidden text-xs font-bold text-gray-900 dark:text-slate-100 capitalize truncate min-w-0">
              {vista === "dia"
                ? fechaActual.toLocaleDateString("es-AR", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })
                : vista === "semana"
                  ? `Sem. ${fechaActual.toLocaleDateString("es-AR", { month: "short", day: "numeric" })}`
                  : fechaActual.toLocaleDateString("es-AR", {
                      month: "short",
                      year: "numeric",
                    })}
            </h2>
            {/* Versión escritorio completa */}
            <h2 className="hidden sm:inline text-sm md:text-base font-extrabold text-gray-900 dark:text-slate-100 capitalize ml-1 truncate">
              {fechaActual.toLocaleDateString("es-AR", {
                month: "long",
                year: "numeric",
                ...(vista === "dia" && { day: "numeric", weekday: "long" }),
              })}
            </h2>
          </div>

          {/* Selector de vistas: fijo a la derecha */}
          <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-0.5 sm:p-1 rounded-xl text-xs font-semibold shrink-0 ml-auto border border-gray-200/50 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setVista("dia")}
              className={`px-2 py-1 sm:px-3.5 sm:py-1.5 rounded-lg transition-all text-[11px] sm:text-xs cursor-pointer ${
                vista === "dia"
                  ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-xs font-bold"
                  : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Día
            </button>
            <button
              type="button"
              onClick={() => setVista("semana")}
              className={`px-2 py-1 sm:px-3.5 sm:py-1.5 rounded-lg transition-all text-[11px] sm:text-xs cursor-pointer ${
                vista === "semana"
                  ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-xs font-bold"
                  : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Semana
            </button>
            <button
              type="button"
              onClick={() => setVista("mes")}
              className={`px-2 py-1 sm:px-3.5 sm:py-1.5 rounded-lg transition-all text-[11px] sm:text-xs cursor-pointer ${
                vista === "mes"
                  ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-xs font-bold"
                  : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Mes
            </button>
          </div>
        </div>

        {/* Leyenda de ocupación exclusiva para vista mes */}
        {vista === "mes" && (
          <div className="px-2 pb-2.5 sm:px-3.5 sm:pb-3 -mt-1 flex justify-end items-center">
            <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3.5 text-[11px] text-gray-600 dark:text-slate-400">
              <span className="font-bold text-gray-800 dark:text-slate-200 flex items-center gap-1">
                Ocupación:
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded border border-gray-300 dark:border-slate-700 inline-block bg-white dark:bg-slate-800" />
                <span>Libre ({capacidadTotal} disp.)</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded border inline-block bg-emerald-500" />
                <span>Baja (1 a {corte60} módulos)</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded border inline-block bg-amber-500" />
                <span>Media ({corte60 + 1} a {corte85} módulos)</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded border inline-block bg-rose-500" />
                <span>Alta (&gt; {corte85} módulos)</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ─── CONTENEDOR PRINCIPAL DE LA VISTA ─── */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto relative min-h-0 bg-white dark:bg-slate-900"
        style={{ touchAction: isSelecting || isSelectingMes ? "none" : "pan-y" }}
      >
        <div
          style={interactiveSwipeStyle}
          className="w-full h-full"
        >
        {vista === "dia" && (
          <VistaDia
            fecha={fechaActual}
            turnos={turnos}
            slotsHoras={slotsHorasActuales}
            horaInicioAgenda={horaInicioNum}
            esSlotPasado={esSlotPasado}
            esSlotBloqueado={esSlotBloqueado}
            obtenerRestriccionSlot={obtenerRestriccionSlot}
            isSlotSelected={isSlotSelected}
            onSlotMouseDown={handleSlotMouseDown}
            onSlotMouseEnter={handleSlotMouseEnter}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onEventClick={handleEventClick}
          />
        )}

        {vista === "semana" && (
          <VistaSemana
            fechaActual={fechaActual}
            setFechaActual={setFechaActual}
            setVista={setVista}
            dias={diasSemana}
            turnos={turnos}
            ahora={ahora}
            slotsHoras={slotsHorasActuales}
            horaInicioAgenda={horaInicioNum}
            esSlotPasado={esSlotPasado}
            esSlotBloqueado={esSlotBloqueado}
            obtenerRestriccionSlot={obtenerRestriccionSlot}
            esDiaBloqueado={esDiaBloqueado}
            obtenerRestriccionDia={obtenerRestriccionDia}
            onBloquearDia={abrirModalRestriccion}
            isSlotSelected={isSlotSelected}
            onSlotMouseDown={handleSlotMouseDown}
            onSlotMouseEnter={handleSlotMouseEnter}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onEventClick={handleEventClick}
          />
        )}

        {vista === "mes" && (
          <VistaMes
            fecha={fechaActual}
            turnos={turnos}
            ahora={ahora}
            setFechaActual={setFechaActual}
            setVista={setVista}
            restricciones={restricciones}
            esDiaBloqueado={esDiaBloqueado}
            obtenerRestriccionDia={obtenerRestriccionDia}
            obtenerRestriccionesDeFecha={obtenerRestriccionesDeFecha}
            agregarRestriccion={agregarRestriccion}
            eliminarRestriccion={eliminarRestriccion}
            onDragStart={handleMesDragStart}
            onDragEnd={handleMesDragEnd}
          />
        )}
        </div>
      </div>

      {/* ─── BOTONES RÁPIDOS FLOTANTES INFERIORES EN TELÉFONO ─── */}
      <div className="fixed md:hidden right-4 bottom-20 z-40 flex items-center gap-1 bg-white/95 border border-gray-200/90 shadow-lg rounded-full p-1">
        <button
          type="button"
          onClick={() => cambiarFecha(-1)}
          className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-full active:scale-95 transition-colors cursor-pointer"
          aria-label="Anterior"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={irHoy}
          className="px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-full active:scale-95 transition-colors cursor-pointer"
        >
          Hoy
        </button>
        <button
          type="button"
          onClick={() => cambiarFecha(1)}
          className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-full active:scale-95 transition-colors cursor-pointer"
          aria-label="Siguiente"
        >
          <ChevronRight size={18} />
        </button>
      </div>
      {/* ─── MODAL DE RESTRICCIONES (DISPONIBLE PARA SEMANA Y DÍA) ─── */}
      {modalRestriccionAbierto && (
        <ModalRestriccion
          isOpen={modalRestriccionAbierto}
          onClose={cerrarModalRestriccion}
          rangoFechas={rangoModalRestriccion}
          onGuardar={agregarRestriccion}
          onEliminar={eliminarRestriccion}
        />
      )}
    </div>
  );
});

export const AgendaCalendario = AgendaCalendar;
export default AgendaCalendar;
