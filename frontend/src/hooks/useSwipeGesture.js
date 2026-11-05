/** @format */

import { useSwipeable } from "react-swipeable";

/**
 * Hook para navegación gestual táctil (swipe izquierda / derecha).
 * Permite cambiar de página en tablas/tarjetas o de día/semana/mes en la agenda.
 */
export const useSwipeGesture = ({
  onSwipeLeft,
  onSwipeRight,
  delta = 45,
  disabled = false,
}) => {
  const handlers = useSwipeable({
    onSwipedLeft: (eventData) => {
      if (!disabled) onSwipeLeft?.(eventData);
    },
    onSwipedRight: (eventData) => {
      if (!disabled) onSwipeRight?.(eventData);
    },
    delta,
    preventScrollOnSwipe: false,
    trackMouse: false,
    trackTouch: true,
  });

  return handlers;
};

export default useSwipeGesture;
