/** @format */
import { useEffect, useState, forwardRef } from "react";
import { createPortal } from "react-dom";

const MenuFlotantePortal = forwardRef(function MenuFlotantePortal(
  { targetRef, isOpen, children, className = "" },
  ref,
) {
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (isOpen && targetRef.current) {
      const rect = targetRef.current.getBoundingClientRect();

      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.right + window.scrollX - 192, // 192px = w-48
      });

      // Indicamos que las coordenadas ya están calculadas
      setListo(true);
    } else {
      setListo(false);
    }
  }, [isOpen, targetRef]);

  // Si no está abierto o aún no se calcularon las coordenadas reales, no renderizamos nada
  if (!isOpen || !listo) return null;

  return createPortal(
    <div
      ref={ref}
      style={{
        position: "absolute",
        top: `${coords.top}px`,
        left: `${coords.left}px`,
      }}
      className={`menu-flotante-portal w-48 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-700 py-1.5 z-[9999] flex flex-col ${className}`}
    >
      {children}
    </div>,
    document.body,
  );
});

export default MenuFlotantePortal;
