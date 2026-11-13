/** @format */

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

export function MenuFlotantePortal({
  trigger,
  children,
  ancho = 208,
  alineacion = "derecha",
}) {
  const [abierto, setAbierto] = useState(false);
  const [coords, setCoords] = useState({
    top: 0,
    left: 0,
    transformOrigin: "top right",
  });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const calcularPosicion = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const alturaEstimada = menuRef.current?.offsetHeight || 220;
    const espacioAbajo = viewportHeight - rect.bottom;
    const abrirHaciaArriba =
      espacioAbajo < alturaEstimada + 16 && rect.top > alturaEstimada;

    const top = abrirHaciaArriba
      ? Math.max(8, rect.top - alturaEstimada - 6)
      : rect.bottom + 6;

    let left =
      alineacion === "derecha" ? rect.right - ancho : rect.left;

    if (left < 8) left = 8;
    if (left + ancho > viewportWidth - 8) {
      left = viewportWidth - ancho - 8;
    }

    setCoords({
      top,
      left,
      transformOrigin: abrirHaciaArriba ? "bottom right" : "top right",
    });
  }, [ancho, alineacion]);

  const toggleMenu = useCallback(
    (e) => {
      if (e) e.stopPropagation();
      setAbierto((prev) => !prev);
    },
    [],
  );

  const cerrarMenu = useCallback(() => {
    setAbierto(false);
  }, []);

  useEffect(() => {
    if (!abierto) return;

    calcularPosicion();
    const raf = requestAnimationFrame(calcularPosicion);

    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setAbierto(false);
      }
    };

    const handleScrollOrResize = () => {
      setAbierto(false);
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") setAbierto(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [abierto, calcularPosicion]);

  return (
    <div ref={triggerRef} className="inline-flex">
      {typeof trigger === "function"
        ? trigger({ abierto, toggleMenu, cerrarMenu })
        : trigger}

      {abierto &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${ancho}px`,
              transformOrigin: coords.transformOrigin,
            }}
            onClick={(e) => e.stopPropagation()}
            className="z-[9999] bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 animate-in fade-in zoom-in-95 duration-150"
          >
            {typeof children === "function"
              ? children({ cerrarMenu })
              : children}
          </div>,
          document.body,
        )}
    </div>
  );
}

export default MenuFlotantePortal;

