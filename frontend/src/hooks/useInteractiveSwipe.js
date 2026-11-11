/** @format */

import { useState, useRef, useCallback } from "react";

/**
 * Hook para navegación gestual interactiva en tiempo real (drag & swipe 1:1 con el dedo).
 * Mueve el contenedor a medida que el usuario arrastra la pantalla, tal como en Google Calendar,
 * completando la transición si se supera el umbral o rebotando si se suelta antes.
 */
export function useInteractiveSwipe({
  onSwipeLeft,
  onSwipeRight,
  canSwipeLeft = true,
  canSwipeRight = true,
  threshold = 55,
  disabled = false,
  scrollToTopOnSwipe = true,
}) {
  const [dragOffset, setDragOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionStyle, setTransitionStyle] = useState("none");

  const stateRef = useRef({
    startX: 0,
    startY: 0,
    currentOffset: 0,
    isSwiping: false,
    isDecided: false,
    isAnimating: false,
  });

  const onTouchStart = useCallback(
    (e) => {
      if (disabled || stateRef.current.isAnimating) return;
      const touch = e.touches[0];
      stateRef.current.startX = touch.clientX;
      stateRef.current.startY = touch.clientY;
      stateRef.current.currentOffset = 0;
      stateRef.current.isSwiping = false;
      stateRef.current.isDecided = false;
      setTransitionStyle("none");
      setIsTransitioning(false);
      setDragOffset(0);
    },
    [disabled],
  );

  const onTouchMove = useCallback(
    (e) => {
      if (disabled || stateRef.current.isAnimating) return;
      const touch = e.touches[0];
      const dx = touch.clientX - stateRef.current.startX;
      const dy = touch.clientY - stateRef.current.startY;

      if (!stateRef.current.isDecided) {
        if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.15) {
          stateRef.current.isDecided = true;
          stateRef.current.isSwiping = true;
        } else if (Math.abs(dy) > 8) {
          stateRef.current.isDecided = true;
          stateRef.current.isSwiping = false;
        }
      }

      if (stateRef.current.isSwiping) {
        if (e.cancelable) e.preventDefault();

        let effectiveDx = dx;
        // Resistencia tipo resorte (rubber-band) en los extremos
        if (dx < 0 && !canSwipeLeft) {
          effectiveDx = dx * 0.22;
        } else if (dx > 0 && !canSwipeRight) {
          effectiveDx = dx * 0.22;
        }

        stateRef.current.currentOffset = effectiveDx;
        setDragOffset(effectiveDx);
      }
    },
    [disabled, canSwipeLeft, canSwipeRight],
  );

  const onTouchEnd = useCallback(() => {
    if (disabled || stateRef.current.isAnimating) return;

    if (!stateRef.current.isSwiping) {
      setDragOffset(0);
      setTransitionStyle("none");
      return;
    }

    const offset = stateRef.current.currentOffset;
    stateRef.current.isSwiping = false;

    const realizarScrollArriba = () => {
      if (!scrollToTopOnSwipe) return;
      try {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch {
        window.scrollTo(0, 0);
      }
      if (document.documentElement && document.documentElement.scrollTop > 0) {
        try {
          document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
        } catch {
          document.documentElement.scrollTop = 0;
        }
      }
      if (document.body && document.body.scrollTop > 0) {
        try {
          document.body.scrollTo({ top: 0, behavior: "smooth" });
        } catch {
          document.body.scrollTop = 0;
        }
      }
    };

    // Verificar si superó el umbral para cambiar de página / fecha
    if (offset < -threshold && canSwipeLeft && onSwipeLeft) {
      stateRef.current.isAnimating = true;
      setIsTransitioning(true);
      realizarScrollArriba();
      setTransitionStyle("transform 180ms cubic-bezier(0.16, 1, 0.3, 1), opacity 180ms ease-out");
      setDragOffset(-Math.min(window.innerWidth * 0.65, 300));

      setTimeout(() => {
        if (window.navigator?.vibrate) window.navigator.vibrate(25);
        onSwipeLeft();
        realizarScrollArriba();
        // Colocar nuevo contenido entrando desde la derecha
        setTransitionStyle("none");
        setDragOffset(Math.min(window.innerWidth * 0.45, 200));

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTransitionStyle("transform 220ms cubic-bezier(0.16, 1, 0.3, 1), opacity 220ms ease-out");
            setDragOffset(0);
            setTimeout(() => {
              stateRef.current.isAnimating = false;
              setIsTransitioning(false);
              setTransitionStyle("none");
            }, 230);
          });
        });
      }, 180);
    } else if (offset > threshold && canSwipeRight && onSwipeRight) {
      stateRef.current.isAnimating = true;
      setIsTransitioning(true);
      realizarScrollArriba();
      setTransitionStyle("transform 180ms cubic-bezier(0.16, 1, 0.3, 1), opacity 180ms ease-out");
      setDragOffset(Math.min(window.innerWidth * 0.65, 300));

      setTimeout(() => {
        if (window.navigator?.vibrate) window.navigator.vibrate(25);
        onSwipeRight();
        realizarScrollArriba();
        // Colocar nuevo contenido entrando desde la izquierda
        setTransitionStyle("none");
        setDragOffset(-Math.min(window.innerWidth * 0.45, 200));

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTransitionStyle("transform 220ms cubic-bezier(0.16, 1, 0.3, 1), opacity 220ms ease-out");
            setDragOffset(0);
            setTimeout(() => {
              stateRef.current.isAnimating = false;
              setIsTransitioning(false);
              setTransitionStyle("none");
            }, 230);
          });
        });
      }, 180);
    } else {
      // Rebotar a la posición inicial (resorte)
      setIsTransitioning(true);
      setTransitionStyle("transform 220ms cubic-bezier(0.16, 1, 0.3, 1)");
      setDragOffset(0);
      setTimeout(() => {
        setIsTransitioning(false);
        setTransitionStyle("none");
      }, 230);
    }
  }, [disabled, threshold, canSwipeLeft, canSwipeRight, onSwipeLeft, onSwipeRight]);

  const style = {
    transform: dragOffset !== 0 ? `translate3d(${dragOffset}px, 0, 0)` : undefined,
    transition: transitionStyle !== "none" ? transitionStyle : undefined,
    willChange: dragOffset !== 0 || isTransitioning ? "transform, opacity" : undefined,
  };

  return {
    containerProps: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
    style,
    dragOffset,
    isDragging: stateRef.current.isSwiping,
    isTransitioning,
  };
}

export default useInteractiveSwipe;

