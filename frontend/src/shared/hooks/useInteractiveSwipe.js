/** @format */

import { useRef, useState } from "react";

export const useInteractiveSwipe = ({
  onSwipeLeft,
  onSwipeRight,
  disabled = false,
  threshold = 55,
  velocityThreshold = 0.25,
}) => {
  const containerRef = useRef(null);
  const startX = useRef(null);
  const startY = useRef(null);
  const startTime = useRef(null);
  const currentDx = useRef(0);
  const isHorizontalDrag = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const resetPosition = (withTransition = true) => {
    const el = containerRef.current;
    if (!el) return;
    if (withTransition) {
      el.style.transition =
        "transform 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease";
    } else {
      el.style.transition = "none";
    }
    el.style.transform = "translate3d(0px, 0px, 0px)";
    el.style.opacity = "1";
  };

  const handleTouchStart = (e) => {
    if (disabled || isAnimating) return;

    const target = e.target;
    if (
      target &&
      target.closest &&
      target.closest("input, textarea, select, [data-no-swipe='true']")
    ) {
      startX.current = null;
      return;
    }

    const touch = e.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    startTime.current = performance.now();
    currentDx.current = 0;
    isHorizontalDrag.current = null;

    const el = containerRef.current;
    if (el) {
      el.style.transition = "none";
    }
  };

  const handleTouchMove = (e) => {
    if (disabled || isAnimating || startX.current === null) return;

    const touch = e.touches[0];
    const dx = touch.clientX - startX.current;
    const dy = touch.clientY - startY.current;

    if (isHorizontalDrag.current === null) {
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      if (absX < 8 && absY < 8) return;

      if (absX > absY * 1.2) {
        isHorizontalDrag.current = true;
      } else {
        isHorizontalDrag.current = false;
        return;
      }
    }

    if (!isHorizontalDrag.current) return;

    currentDx.current = dx;
    const el = containerRef.current;
    if (el) {
      const dampedDx = dx * 0.85;
      const opacity = Math.max(0.7, 1 - Math.abs(dx) / 600);
      el.style.transform = `translate3d(${dampedDx}px, 0px, 0px)`;
      el.style.opacity = `${opacity}`;
    }
  };

  const triggerSlideComplete = (direction) => {
    const el = containerRef.current;
    if (!el) {
      if (direction === "left" && onSwipeLeft) onSwipeLeft();
      if (direction === "right" && onSwipeRight) onSwipeRight();
      return;
    }

    setIsAnimating(true);
    const exitOffset = direction === "left" ? -90 : 90;
    const enterOffset = direction === "left" ? 65 : -65;

    el.style.transition =
      "transform 130ms cubic-bezier(0.4, 0, 1, 1), opacity 130ms ease-out";
    el.style.transform = `translate3d(${exitOffset}px, 0px, 0px)`;
    el.style.opacity = "0";

    setTimeout(() => {
      if (direction === "left" && onSwipeLeft) onSwipeLeft();
      if (direction === "right" && onSwipeRight) onSwipeRight();

      el.style.transition = "none";
      el.style.transform = `translate3d(${enterOffset}px, 0px, 0px)`;
      el.style.opacity = "0";

      void el.offsetWidth;

      el.style.transition =
        "transform 210ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease-out";
      el.style.transform = "translate3d(0px, 0px, 0px)";
      el.style.opacity = "1";

      setTimeout(() => {
        if (el) {
          el.style.transition = "";
          el.style.transform = "";
          el.style.opacity = "";
        }
        setIsAnimating(false);
      }, 215);
    }, 130);
  };

  const handleTouchEnd = () => {
    if (disabled || isAnimating || startX.current === null) return;

    const dx = currentDx.current;
    const elapsed = Math.max(1, performance.now() - (startTime.current || 0));
    const velocity = Math.abs(dx) / elapsed;

    const wasHorizontal = isHorizontalDrag.current === true;

    startX.current = null;
    startY.current = null;
    startTime.current = null;
    currentDx.current = 0;
    isHorizontalDrag.current = null;

    if (!wasHorizontal) {
      resetPosition(false);
      return;
    }

    const shouldTrigger =
      Math.abs(dx) >= threshold ||
      (Math.abs(dx) >= 24 && velocity >= velocityThreshold);

    if (shouldTrigger) {
      if (dx < 0) {
        triggerSlideComplete("left");
      } else {
        triggerSlideComplete("right");
      }
    } else {
      resetPosition(true);
    }
  };

  const handleTouchCancel = () => {
    startX.current = null;
    startY.current = null;
    startTime.current = null;
    currentDx.current = 0;
    isHorizontalDrag.current = null;
    resetPosition(true);
  };

  return {
    containerRef,
    swipeHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchCancel,
    },
  };
};

export default useInteractiveSwipe;

