/** @format */

import { useState, useRef, useEffect, useCallback } from "react";
import { esMismoDia } from "../utils/agendaStyles";

const normalizarFecha = (fecha) => {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  return d;
};

export function useCalendarioSeleccion({
  onSelectSlot,
  onSelectDaysToBlock,
  slotsHoras = [],
}) {
  // --- 1. SELECCIÓN DE SLOTS HORARIOS (VistaDía y cuerpo de VistaSemana) ---
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

  // --- 2. SELECCIÓN DE DÍAS PARA BLOQUEAR (VistaMes y cabecera de VistaSemana) ---
  const [seleccionDias, setSeleccionDias] = useState(null); // { inicio: Date, fin: Date }
  const seleccionDiasRef = useRef(null);
  const holdDiaTimerRef = useRef(null);
  const diaInicialHoldRef = useRef(null);
  const touchDiaPosRef = useRef(null);
  const bloqueoClickDiaRef = useRef(false);

  useEffect(() => {
    seleccionRef.current = seleccion;
  }, [seleccion]);

  useEffect(() => {
    arrastrandoRef.current = estaArrastrando;
  }, [estaArrastrando]);

  useEffect(() => {
    seleccionDiasRef.current = seleccionDias;
  }, [seleccionDias]);

  const limpiarLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const limpiarHoldDia = useCallback(() => {
    if (holdDiaTimerRef.current) {
      clearTimeout(holdDiaTimerRef.current);
      holdDiaTimerRef.current = null;
    }
  }, []);

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

  const finalizarSeleccionDias = useCallback(() => {
    limpiarHoldDia();
    const rangoActual = seleccionDiasRef.current;
    diaInicialHoldRef.current = null;
    touchDiaPosRef.current = null;

    if (rangoActual) {
      setSeleccionDias(null);
      seleccionDiasRef.current = null;

      bloqueoClickDiaRef.current = true;
      setTimeout(() => {
        bloqueoClickDiaRef.current = false;
      }, 350);

      onSelectDaysToBlock?.(rangoActual);
    }
  }, [limpiarHoldDia, onSelectDaysToBlock]);

  useEffect(() => {
    const handleGlobalUp = () => {
      if (arrastrandoRef.current) {
        finalizarSeleccion();
      }
      if (holdDiaTimerRef.current || seleccionDiasRef.current) {
        finalizarSeleccionDias();
      }
    };
    window.addEventListener("mouseup", handleGlobalUp);
    window.addEventListener("touchend", handleGlobalUp);
    window.addEventListener("touchcancel", handleGlobalUp);
    return () => {
      window.removeEventListener("mouseup", handleGlobalUp);
      window.removeEventListener("touchend", handleGlobalUp);
      window.removeEventListener("touchcancel", handleGlobalUp);
      detenerAutoScroll();
    };
  }, [finalizarSeleccion, finalizarSeleccionDias, detenerAutoScroll]);

  // --- Manejadores de Slots Horarios (Mouse) ---
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

  // --- Manejadores de Slots Horarios (Touch) ---
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

  // --- Manejadores de Días Completos (VistaMes y Cabecera de VistaSemana) ---
  const iniciarPresionDia = useCallback(
    (fecha, e) => {
      if (e?.button !== undefined && e.button !== 0) return;
      if (!fecha) return;

      const dNorm = normalizarFecha(fecha);
      diaInicialHoldRef.current = dNorm;
      bloqueoClickDiaRef.current = false;

      if (e?.touches?.[0]) {
        ignorarMouseHastaRef.current = Date.now() + 900;
        touchDiaPosRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }

      limpiarHoldDia();
      holdDiaTimerRef.current = setTimeout(() => {
        if (diaInicialHoldRef.current) {
          const rango = { inicio: dNorm, fin: dNorm };
          setSeleccionDias(rango);
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(35);
          }
        }
      }, 260);
    },
    [limpiarHoldDia],
  );

  const actualizarRangoDia = useCallback(
    (fecha) => {
      if (!diaInicialHoldRef.current || !fecha) return;
      const actual = normalizarFecha(fecha);
      const tIni = diaInicialHoldRef.current.getTime();
      const tAct = actual.getTime();

      // Si se movió a otro día antes de que el timer termine, cancelar timer e iniciar selección de rango inmediatamente
      if (tAct !== tIni) {
        limpiarHoldDia();
        bloqueoClickDiaRef.current = true;
      } else if (!seleccionDiasRef.current) {
        return;
      }

      setSeleccionDias(
        tAct >= tIni
          ? { inicio: diaInicialHoldRef.current, fin: actual }
          : { inicio: actual, fin: diaInicialHoldRef.current },
      );
    },
    [limpiarHoldDia],
  );

  const moverPresionDiaMouse = useCallback(
    (fecha) => {
      if (Date.now() < ignorarMouseHastaRef.current) return;
      actualizarRangoDia(fecha);
    },
    [actualizarRangoDia],
  );

  const moverPresionDiaTouch = useCallback(
    (e) => {
      const touch = e.touches?.[0];
      if (!touch) return;

      if (!seleccionDiasRef.current && touchDiaPosRef.current) {
        const dx = Math.abs(touch.clientX - touchDiaPosRef.current.x);
        const dy = Math.abs(touch.clientY - touchDiaPosRef.current.y);
        if (dx > 10 || dy > 10) {
          limpiarHoldDia();
          diaInicialHoldRef.current = null;
        }
        return;
      }

      if (seleccionDiasRef.current) {
        if (e.cancelable) e.preventDefault();
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        const celda = el?.closest?.("[data-dia-iso]");
        const iso = celda?.getAttribute("data-dia-iso");
        if (iso) {
          const [y, m, d] = iso.split("-").map(Number);
          actualizarRangoDia(new Date(y, m - 1, d));
        }
      }
    },
    [limpiarHoldDia, actualizarRangoDia],
  );

  const estaDiaMarcado = useCallback(
    (fecha) => {
      if (!seleccionDias || !fecha) return false;
      const t = normalizarFecha(fecha).getTime();
      return (
        t >= seleccionDias.inicio.getTime() && t <= seleccionDias.fin.getTime()
      );
    },
    [seleccionDias],
  );

  const debeIgnorarClickDia = useCallback(() => bloqueoClickDiaRef.current, []);

  // --- Helpers de estado y reset ---
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
    limpiarLongPress();
    limpiarHoldDia();
    setEstaArrastrando(false);
    setSeleccion(null);
    setSeleccionDias(null);
    diaInicialHoldRef.current = null;
  }, [limpiarLongPress, limpiarHoldDia]);

  return {
    estaArrastrando: estaArrastrando || Boolean(seleccionDias),
    estaSeleccionado,
    iniciarSeleccion,
    moverSeleccion,
    finalizarSeleccion,
    handleSlotTouchStart,
    handleSlotTouchMove,
    handleSlotTouchEnd,
    handleSlotTouchCancel,
    resetSeleccion,
    estaDiaMarcado,
    iniciarPresionDia,
    moverPresionDiaMouse,
    moverPresionDiaTouch,
    debeIgnorarClickDia,
  };
}

export default useCalendarioSeleccion;
