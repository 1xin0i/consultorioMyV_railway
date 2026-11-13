/** @format */

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { OBTENER_ESTILOS_OCUPACION_MES, esMismoDia } from "../utils/agendaStyles";

export function useVistaMesSeleccion({
  fechaActual,
  turnos = [],
  onSelectDay,
  esDiaLaboral,
  esDiaBloqueado,
  obtenerRestriccionDia,
  minutosJornada,
  intervaloMinutos,
  umbralBaja,
  umbralMedia,
  corteBajaModulos,
  corteMediaModulos,
}) {
  const { inicioMesTime, finMesTime } = useMemo(() => {
    const y = fechaActual.getFullYear();
    const m = fechaActual.getMonth();
    const ini = new Date(y, m, 1, 0, 0, 0).getTime() - 7 * 86400000;
    const fin = new Date(y, m + 1, 0, 23, 59, 59).getTime() + 7 * 86400000;
    return { inicioMesTime: ini, finMesTime: fin };
  }, [fechaActual]);

  const turnosPorDiaMap = useMemo(() => {
    const mapa = new Map();
    if (!Array.isArray(turnos)) return mapa;

    for (let i = 0; i < turnos.length; i++) {
      const t = turnos[i];
      if (!t?.fecha_hora_inicio) continue;
      const d = new Date(t.fecha_hora_inicio);
      const time = d.getTime();
      if (isNaN(time) || time < inicioMesTime || time > finMesTime) continue;

      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      let bucket = mapa.get(key);
      if (!bucket) {
        bucket = [];
        mapa.set(key, bucket);
      }
      bucket.push(t);
    }
    return mapa;
  }, [turnos, inicioMesTime, finMesTime]);

  const diasCalendario = useMemo(() => {
    const anio = fechaActual.getFullYear();
    const mes = fechaActual.getMonth();

    const primerDiaMes = new Date(anio, mes, 1);
    const ultimoDiaMes = new Date(anio, mes + 1, 0);

    let offsetInicio = primerDiaMes.getDay() - 1;
    if (offsetInicio < 0) offsetInicio = 6;

    const dias = [];
    const hoy = new Date();

    for (let i = offsetInicio - 1; i >= 0; i--) {
      const fecha = new Date(anio, mes, -i);
      dias.push({ fecha, esMesActual: false, turnos: [] });
    }

    for (let d = 1; d <= ultimoDiaMes.getDate(); d++) {
      const fecha = new Date(anio, mes, d);
      const key = `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`;
      const turnosDelDia = turnosPorDiaMap.get(key) || [];

      const turnosActivos = turnosDelDia.filter((t) => {
        const estado = (t.EstadoTurno?.estado || "").toLowerCase();
        return !estado.includes("cancelado");
      });

      const minutosOcupados = turnosActivos.reduce((acc, t) => {
        const ini = new Date(t.fecha_hora_inicio);
        const fin = new Date(t.fecha_hora_fin);
        const diff = (fin - ini) / (1000 * 60);
        return acc + (diff > 0 ? diff : Number(t.duracion_minutos) || 30);
      }, 0);

      const modulosOcupados = Math.round(minutosOcupados / intervaloMinutos);

      const porcentaje = Math.min(
        100,
        Math.round((minutosOcupados / minutosJornada) * 100),
      );

      const diaLaboral = esDiaLaboral ? esDiaLaboral(fecha) : true;
      const bloqueado = esDiaBloqueado ? esDiaBloqueado(fecha) : false;
      const restriccion = obtenerRestriccionDia
        ? obtenerRestriccionDia(fecha)
        : null;

      dias.push({
        fecha,
        esMesActual: true,
        esHoy: esMismoDia(fecha, hoy),
        turnos: turnosDelDia,
        cantidadActivos: turnosActivos.length,
        modulosOcupados,
        porcentaje,
        diaLaboral,
        bloqueado,
        restriccion,
        estilosOcupacion: OBTENER_ESTILOS_OCUPACION_MES(
          porcentaje,
          umbralBaja,
          umbralMedia,
          modulosOcupados,
          corteBajaModulos,
          corteMediaModulos,
        ),
      });
    }

    const totalCeldas = dias.length <= 35 ? 35 : 42;
    const restantes = totalCeldas - dias.length;
    for (let i = 1; i <= restantes; i++) {
      const fecha = new Date(anio, mes + 1, i);
      dias.push({ fecha, esMesActual: false, turnos: [] });
    }

    return dias;
  }, [
    fechaActual,
    turnosPorDiaMap,
    esDiaLaboral,
    esDiaBloqueado,
    obtenerRestriccionDia,
    minutosJornada,
    intervaloMinutos,
    umbralBaja,
    umbralMedia,
    corteBajaModulos,
    corteMediaModulos,
  ]);

  const [seleccionDias, setSeleccionDias] = useState(null);
  const arrastrandoRef = useRef(false);
  const longPressTimerRef = useRef(null);
  const touchStartPosRef = useRef(null);
  const modoDragTouchRef = useRef(false);
  const ultimoDiaTouchRef = useRef(null);
  const ignorarProximoClickRef = useRef(false);

  const limpiarTimerLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  useEffect(() => {
    setSeleccionDias(null);
    arrastrandoRef.current = false;
  }, [fechaActual]);

  const obtenerRangoOrdenado = useCallback((sel = seleccionDias) => {
    if (!sel) return null;
    const t1 = new Date(
      sel.inicio.getFullYear(),
      sel.inicio.getMonth(),
      sel.inicio.getDate(),
    ).getTime();
    const t2 = new Date(
      sel.fin.getFullYear(),
      sel.fin.getMonth(),
      sel.fin.getDate(),
    ).getTime();
    return t1 <= t2
      ? { inicio: sel.inicio, fin: sel.fin, tMin: t1, tMax: t2 }
      : { inicio: sel.fin, fin: sel.inicio, tMin: t2, tMax: t1 };
  }, [seleccionDias]);

  const estaDiaSeleccionado = useCallback(
    (fecha) => {
      if (!seleccionDias || !fecha) return false;
      const rango = obtenerRangoOrdenado(seleccionDias);
      if (!rango) return false;
      const t = new Date(
        fecha.getFullYear(),
        fecha.getMonth(),
        fecha.getDate(),
      ).getTime();
      return t >= rango.tMin && t <= rango.tMax;
    },
    [seleccionDias, obtenerRangoOrdenado],
  );

  const iniciarSeleccionDia = (diaItem, e) => {
    if (!diaItem.esMesActual) return;
    if (e && e.button !== undefined && e.button !== 0) return;
    arrastrandoRef.current = true;
    setSeleccionDias({
      inicio: diaItem.fecha,
      fin: diaItem.fecha,
      esDrag: false,
    });
  };

  const moverSeleccionDia = (diaItem) => {
    if (!arrastrandoRef.current || !diaItem.esMesActual) return;
    setSeleccionDias((prev) => {
      if (!prev) return null;
      const cambioDia = !esMismoDia(prev.inicio, diaItem.fecha);
      return {
        ...prev,
        fin: diaItem.fecha,
        esDrag: prev.esDrag || cambioDia,
      };
    });
  };

  const finalizarSeleccionMouse = useCallback(() => {
    if (!arrastrandoRef.current) return;
    arrastrandoRef.current = false;
    setSeleccionDias((prev) => {
      if (!prev) return null;
      if (!prev.esDrag) {
        return null;
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (arrastrandoRef.current) {
        finalizarSeleccionMouse();
      }
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [finalizarSeleccionMouse]);

  const handleDayTouchStart = (diaItem, e) => {
    if (!diaItem.esMesActual) return;
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    modoDragTouchRef.current = false;
    ultimoDiaTouchRef.current = diaItem.fecha;

    limpiarTimerLongPress();
    longPressTimerRef.current = setTimeout(() => {
      modoDragTouchRef.current = true;
      arrastrandoRef.current = true;
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(35);
      }
      setSeleccionDias({
        inicio: diaItem.fecha,
        fin: diaItem.fecha,
        esDrag: true,
      });
    }, 280);
  };

  const handleDayTouchMove = (e) => {
    const touch = e.touches[0];
    if (!touch) return;

    if (!modoDragTouchRef.current && touchStartPosRef.current) {
      const dx = Math.abs(touch.clientX - touchStartPosRef.current.x);
      const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);
      if (dx > 10 || dy > 10) {
        limpiarTimerLongPress();
      }
      return;
    }

    if (modoDragTouchRef.current) {
      if (e.cancelable) e.preventDefault();
      const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
      const dayEl = targetEl?.closest?.("[data-mes-fecha]");
      if (dayEl) {
        const fechaAttr = dayEl.getAttribute("data-mes-fecha");
        if (fechaAttr) {
          const [y, m, d] = fechaAttr.split("-").map(Number);
          const nuevaFecha = new Date(y, m - 1, d);
          if (
            !ultimoDiaTouchRef.current ||
            !esMismoDia(ultimoDiaTouchRef.current, nuevaFecha)
          ) {
            ultimoDiaTouchRef.current = nuevaFecha;
            setSeleccionDias((prev) =>
              prev ? { ...prev, fin: nuevaFecha, esDrag: true } : null,
            );
          }
        }
      }
    }
  };

  const handleDayTouchEnd = () => {
    limpiarTimerLongPress();
    if (modoDragTouchRef.current) {
      modoDragTouchRef.current = false;
      arrastrandoRef.current = false;
      ignorarProximoClickRef.current = true;
      setTimeout(() => {
        ignorarProximoClickRef.current = false;
      }, 350);
    }
    touchStartPosRef.current = null;
  };

  const handleClickCeldaDia = (diaItem) => {
    if (!diaItem.esMesActual) return;
    if (ignorarProximoClickRef.current) return;

    if (seleccionDias) {
      setSeleccionDias(null);
      return;
    }

    onSelectDay(diaItem.fecha);
  };

  const rangoSeleccionado = obtenerRangoOrdenado();

  return {
    diasCalendario,
    seleccionDias,
    setSeleccionDias,
    rangoSeleccionado,
    estaDiaSeleccionado,
    iniciarSeleccionDia,
    moverSeleccionDia,
    handleDayTouchStart,
    handleDayTouchMove,
    handleDayTouchEnd,
    handleClickCeldaDia,
  };
}

