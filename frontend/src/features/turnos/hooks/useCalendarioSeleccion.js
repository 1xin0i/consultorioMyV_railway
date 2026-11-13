/** @format */

import { useState, useRef, useEffect, useCallback } from "react";
import { esMismoDia } from "../utils/agendaStyles";

export function useCalendarioSeleccion({ onSelectSlot, slotsHoras = [] }) {
  const [seleccion, setSeleccion] = useState(null);
  const [estaArrastrando, setEstaArrastrando] = useState(false);

  const seleccionRef = useRef(null);
  const arrastrandoRef = useRef(false);
  const touchStartPos = useRef(null);
  const touchSlotData = useRef(null);
  const isTouchScrolling = useRef(false);
  const ignorarMouseHastaRef = useRef(0);
  const longPressTimerRef = useRef(null);
  const modoDragTouchRef = useRef(false);
  const ultimoSlotTouchRef = useRef(null);
  const autoScrollRafRef = useRef(null);
  const ultimoTouchYRef = useRef(null);

  useEffect(() => {
    seleccionRef.current = seleccion;
  }, [seleccion]);

  useEffect(() => {
    arrastrandoRef.current = estaArrastrando;
  }, [estaArrastrando]);

  const limpiarLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const detenerAutoScroll = useCallback(() => {
    if (autoScrollRafRef.current) {
      cancelAnimationFrame(autoScrollRafRef.current);
      autoScrollRafRef.current = null;
    }
  }, []);

  const actualizarSlotBajoDedo = (clientX, clientY) => {
    const targetEl = document.elementFromPoint(clientX, clientY);
    const slotEl = targetEl?.closest?.("[data-slot-idx]");
    if (slotEl) {
      const idx = Number(slotEl.getAttribute("data-slot-idx"));
      if (!isNaN(idx) && idx !== ultimoSlotTouchRef.current) {
        ultimoSlotTouchRef.current = idx;
        setSeleccion((prev) => (prev ? { ...prev, finIdx: idx } : null));
      }
    }
  };

  const ejecutarAccionConRango = useCallback(
    (fecha, idx1, idx2) => {
      if (!onSelectSlot || !fecha) return;
      const minIdx = Math.min(idx1, idx2);
      const maxIdx = Math.max(idx1, idx2);

      const horaInicioStr = slotsHoras[minIdx];
      if (!horaInicioStr) return;

      const [hIni, mIni] = horaInicioStr.split(":").map(Number);
      const fechaInicio = new Date(
        fecha.getFullYear(),
        fecha.getMonth(),
        fecha.getDate(),
        hIni,
        mIni,
        0,
      );

      const cantidadSlots = maxIdx - minIdx + 1;
      const fechaFin = new Date(
        fechaInicio.getTime() + cantidadSlots * 30 * 60000,
      );

      onSelectSlot({
        startStr: fechaInicio.toISOString(),
        endStr: fechaFin.toISOString(),
      });
    },
    [onSelectSlot, slotsHoras],
  );

  const finalizarSeleccion = useCallback(() => {
    const selActual = seleccionRef.current;
    const arrastrando = arrastrandoRef.current;

    if (!arrastrando || !selActual) {
      setEstaArrastrando(false);
      setSeleccion(null);
      return;
    }

    const { fecha, inicioIdx, finIdx } = selActual;
    setEstaArrastrando(false);
    setSeleccion(null);

    ejecutarAccionConRango(fecha, inicioIdx, finIdx);
  }, [ejecutarAccionConRango]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (arrastrandoRef.current) {
        finalizarSeleccion();
      }
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      detenerAutoScroll();
    };
  }, [finalizarSeleccion, detenerAutoScroll]);

  const iniciarSeleccion = (fecha, slotIdx, e) => {
    if (Date.now() < ignorarMouseHastaRef.current) return;
    if (e && e.button !== undefined && e.button !== 0) return;

    setEstaArrastrando(true);
    setSeleccion({ fecha, inicioIdx: slotIdx, finIdx: slotIdx });
  };

  const moverSeleccion = (fecha, slotIdx) => {
    if (Date.now() < ignorarMouseHastaRef.current) return;
    if (!estaArrastrando || !seleccion) return;
    if (!esMismoDia(fecha, seleccion.fecha)) return;

    setSeleccion((prev) => (prev ? { ...prev, finIdx: slotIdx } : null));
  };

  const iniciarLoopAutoScroll = () => {
    if (autoScrollRafRef.current) return;

    const step = () => {
      if (!modoDragTouchRef.current || ultimoTouchYRef.current === null) {
        autoScrollRafRef.current = null;
        return;
      }

      const y = ultimoTouchYRef.current.y;
      const x = ultimoTouchYRef.current.x;
      const vh = window.innerHeight;
      const margenInferior = vh - 110;
      const margenSuperior = 110;

      if (y > margenInferior) {
        window.scrollBy(0, 8);
        actualizarSlotBajoDedo(x, y);
      } else if (y < margenSuperior) {
        window.scrollBy(0, -8);
        actualizarSlotBajoDedo(x, y);
      }

      autoScrollRafRef.current = requestAnimationFrame(step);
    };

    autoScrollRafRef.current = requestAnimationFrame(step);
  };

  const handleSlotTouchStart = (fecha, slotIdx, e) => {
    ignorarMouseHastaRef.current = Date.now() + 900;
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    ultimoTouchYRef.current = { x: touch.clientX, y: touch.clientY };
    touchSlotData.current = { fecha, slotIdx };
    isTouchScrolling.current = false;
    modoDragTouchRef.current = false;
    ultimoSlotTouchRef.current = slotIdx;

    limpiarLongPress();
    longPressTimerRef.current = setTimeout(() => {
      if (!isTouchScrolling.current && touchSlotData.current) {
        modoDragTouchRef.current = true;
        setEstaArrastrando(true);
        setSeleccion({
          fecha,
          inicioIdx: slotIdx,
          finIdx: slotIdx,
        });
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(35);
        }
        iniciarLoopAutoScroll();
      }
    }, 260);
  };

  const handleSlotTouchMove = (e) => {
    if (!touchStartPos.current) return;
    const touch = e.touches[0];
    if (!touch) return;

    ultimoTouchYRef.current = { x: touch.clientX, y: touch.clientY };

    if (modoDragTouchRef.current) {
      if (e.cancelable) e.preventDefault();
      actualizarSlotBajoDedo(touch.clientX, touch.clientY);
      return;
    }

    const dx = Math.abs(touch.clientX - touchStartPos.current.x);
    const dy = Math.abs(touch.clientY - touchStartPos.current.y);

    if (dx > 10 || dy > 10) {
      isTouchScrolling.current = true;
      limpiarLongPress();
    }
  };

  const handleSlotTouchEnd = () => {
    ignorarMouseHastaRef.current = Date.now() + 900;
    limpiarLongPress();
    detenerAutoScroll();

    if (modoDragTouchRef.current) {
      modoDragTouchRef.current = false;
      const selFinal = seleccionRef.current;
      setEstaArrastrando(false);
      setSeleccion(null);
      touchStartPos.current = null;
      touchSlotData.current = null;
      ultimoSlotTouchRef.current = null;
      ultimoTouchYRef.current = null;

      if (selFinal) {
        ejecutarAccionConRango(
          selFinal.fecha,
          selFinal.inicioIdx,
          selFinal.finIdx,
        );
      }
      return;
    }

    if (!isTouchScrolling.current && touchSlotData.current) {
      const { fecha, slotIdx } = touchSlotData.current;
      ejecutarAccionConRango(fecha, slotIdx, slotIdx);
    }

    touchStartPos.current = null;
    touchSlotData.current = null;
    isTouchScrolling.current = false;
    ultimoSlotTouchRef.current = null;
    ultimoTouchYRef.current = null;
  };

  const handleSlotTouchCancel = () => {
    limpiarLongPress();
    detenerAutoScroll();
    modoDragTouchRef.current = false;
    setEstaArrastrando(false);
    setSeleccion(null);
    touchStartPos.current = null;
    touchSlotData.current = null;
    isTouchScrolling.current = false;
    ultimoSlotTouchRef.current = null;
    ultimoTouchYRef.current = null;
  };

  const estaSeleccionado = useCallback(
    (fecha, slotIdx) => {
      if (!seleccion || !esMismoDia(fecha, seleccion.fecha)) return false;
      const min = Math.min(seleccion.inicioIdx, seleccion.finIdx);
      const max = Math.max(seleccion.inicioIdx, seleccion.finIdx);
      return slotIdx >= min && slotIdx <= max;
    },
    [seleccion],
  );

  const resetSeleccion = useCallback(() => {
    setEstaArrastrando(false);
    setSeleccion(null);
  }, []);

  return {
    estaArrastrando,
    estaSeleccionado,
    iniciarSeleccion,
    moverSeleccion,
    finalizarSeleccion,
    handleSlotTouchStart,
    handleSlotTouchMove,
    handleSlotTouchEnd,
    handleSlotTouchCancel,
    resetSeleccion,
  };
}

