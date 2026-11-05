/** @format */

import { useRef } from "react";

/**
 * Hook para diferenciar un toque (tap) o click en un turno de un gesto de scroll en dispositivos móviles.
 * Evita que al deslizar el dedo sobre la agenda para scrollear se abra involuntariamente el modal del turno.
 */
export const useTurnoTouchClick = (turno, onEventClick) => {
  const touchStartRef = useRef(null);
  const isScrollingRef = useRef(false);
  const clickBloqueadoRef = useRef(false);

  const handleTouchStart = (e) => {
    e.stopPropagation();
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    isScrollingRef.current = false;
  };

  const handleTouchMove = (e) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartRef.current.y);

    // Si se desplazó más de 8 píxeles en cualquier dirección, es un gesto de scroll
    if (dx > 8 || dy > 8) {
      isScrollingRef.current = true;
    }
  };

  const handleTouchEnd = (e) => {
    e.stopPropagation();
    if (!touchStartRef.current) return;

    if (isScrollingRef.current) {
      // Fue un scroll: bloquear clicks sintéticos y no abrir modal
      clickBloqueadoRef.current = true;
      setTimeout(() => {
        clickBloqueadoRef.current = false;
      }, 400);
      touchStartRef.current = null;
      isScrollingRef.current = false;
      return;
    }

    // Fue un toque limpio (tap sin desplazamiento significativo)
    clickBloqueadoRef.current = true;
    setTimeout(() => {
      clickBloqueadoRef.current = false;
    }, 400);
    touchStartRef.current = null;
    isScrollingRef.current = false;

    if (onEventClick) {
      onEventClick({
        event: { _def: { extendedProps: turno } },
      });
    }
  };

  const handleTouchCancel = () => {
    touchStartRef.current = null;
    isScrollingRef.current = false;
  };

  const handleClick = (e) => {
    e.stopPropagation();
    // Si proviene de un gesto touch reciente (scroll o tap ya procesado), se descarta el click sintético
    if (clickBloqueadoRef.current) return;

    if (onEventClick) {
      onEventClick({
        event: { _def: { extendedProps: turno } },
      });
    }
  };

  const handleMouseDown = (e) => {
    e.stopPropagation();
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel,
    onClick: handleClick,
    onMouseDown: handleMouseDown,
  };
};

export default useTurnoTouchClick;

