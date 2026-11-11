/** @format */
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { FileText } from "lucide-react";

/**
 * Formatea la fecha y hora para mostrar en el encabezado de la nota (ej. "15 Oct, 09:12 hs")
 */
function formatearFechaNota(fechaHora) {
  if (!fechaHora) return "";
  const d = new Date(fechaHora);
  if (isNaN(d.getTime())) return "";
  const dia = d.getDate();
  const mes = d.toLocaleDateString("es-AR", { month: "short" });
  const mesCap = mes.charAt(0).toUpperCase() + mes.slice(1).replace(".", "");
  const horas = String(d.getHours()).padStart(2, "0");
  const minutos = String(d.getMinutes()).padStart(2, "0");
  return `${dia} ${mesCap}, ${horas}:${minutos} hs`;
}

export function BotonNotaTurno({ turno, onEditar }) {
  const [abierto, setAbierto] = useState(false);
  const [coords, setCoords] = useState(null);
  const botonRef = useRef(null);
  const popoverRef = useRef(null);

  const notaTexto =
    typeof turno?.notas_consulta === "string"
      ? turno.notas_consulta.trim()
      : "";
  const tieneNota =
    notaTexto.length > 0 &&
    notaTexto.toLowerCase() !== "null" &&
    notaTexto.toLowerCase() !== "undefined";

  const calcularCoords = useCallback(() => {
    if (!botonRef.current) return null;
    const rect = botonRef.current.getBoundingClientRect();
    const popoverWidth = 320; // w-80

    // Posición directamente debajo del botón
    const top = rect.bottom + window.scrollY + 8;
    let left = rect.left + window.scrollX - 220;

    // Evitar desborde horizontal
    if (left + popoverWidth > window.innerWidth - 16) {
      left = window.innerWidth - 16 - popoverWidth;
    }
    if (left < 16) {
      left = 16;
    }

    return { top, left };
  }, []);

  const handleToggle = () => {
    if (!abierto) {
      const pos = calcularCoords();
      if (pos) setCoords(pos);
      setAbierto(true);
    } else {
      setAbierto(false);
    }
  };

  useEffect(() => {
    if (!abierto) return;

    const handleClickOutside = (e) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        botonRef.current &&
        !botonRef.current.contains(e.target)
      ) {
        setAbierto(false);
      }
    };

    const handleScroll = (e) => {
      if (popoverRef.current && popoverRef.current.contains(e.target)) return;
      setAbierto(false);
    };

    const handleResize = () => {
      const pos = calcularCoords();
      if (pos) setCoords(pos);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [abierto, calcularCoords]);

  if (!tieneNota) {
    return (
      <span className="text-slate-300 dark:text-slate-600 font-medium text-sm select-none">
        —
      </span>
    );
  }

  const fechaFormateada = formatearFechaNota(turno.fecha_hora_inicio);

  return (
    <div className="relative inline-flex items-center">
      <button
        ref={botonRef}
        type="button"
        onClick={handleToggle}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-[#e8f7f1] dark:bg-emerald-950/60 text-[#1b7f5b] dark:text-emerald-300 border border-[#2eb086]/35 dark:border-emerald-800/60 hover:bg-[#d8f2e7] dark:hover:bg-emerald-900/60 transition-all cursor-pointer shadow-2xs"
        title="Ver nota de turno"
      >
        <FileText size={13} className="text-[#2eb086]" />
        <span>Ver</span>
      </button>

      {abierto &&
        coords &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: "absolute",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
            }}
            className="z-[9999] w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 p-4 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-100"
          >
            {/* Header del Popover */}
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-100 font-bold text-xs sm:text-sm">
                <FileText size={16} className="text-[#2eb086]" />
                <span>Nota de turno</span>
              </div>
              {fechaFormateada && (
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  {fechaFormateada}
                </span>
              )}
            </div>

            {/* Cuerpo de la nota con estilo de bloque */}
            <div className="bg-slate-50/80 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-100 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-200 leading-relaxed italic whitespace-pre-wrap">
              "{turno.notas_consulta}"
            </div>

            {/* Footer con botones Cerrar y Editar nota */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setAbierto(false);
                  if (typeof onEditar === "function") {
                    onEditar(turno);
                  }
                }}
                className="text-xs font-semibold bg-[#0d8266] hover:bg-[#0b6f57] text-white px-3.5 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Editar nota
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default BotonNotaTurno;
