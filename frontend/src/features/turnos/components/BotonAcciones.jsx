/** @format */
import { useState, useEffect, useRef } from "react";
import { MoreVertical, CheckSquare, CalendarDays, X, UserRoundX } from "lucide-react";
import MenuFlotantePortal from "../../../components/common/MenuFlotantePortal";

export function BotonAccionesTurno({
  turno,
  abrirParaAtender,
  abrirParaReprogramar,
  abrirParaCancelar,
  abrirParaInasistente,
}) {
  const [menuAbiertoId, setMenuAbiertoId] = useState(null);
  const botonRef = useRef(null);

  // Saber si este menú específico está abierto
  const estaAbierto = menuAbiertoId === turno.id_turno;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuAbiertoId !== null && !event.target.closest(".menu-acciones-container")) {
        setMenuAbiertoId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuAbiertoId]);

  const ejecutarAccion = (e, callback) => {
    e.stopPropagation();
    setMenuAbiertoId(null);
    setTimeout(() => {
      if (typeof callback === "function") {
        callback(turno);
      }
    }, 0);
  };

  return (
    <div className="relative menu-acciones-container">
      <button
        ref={botonRef}
        type="button"
        aria-label="Más opciones de turno"
        title="Más opciones de turno"
        onClick={(e) => {
          e.stopPropagation();
          setMenuAbiertoId(estaAbierto ? null : turno.id_turno);
        }}
        className="p-2 rounded-xl text-teal-800/70 hover:bg-teal-50 hover:text-teal-900 transition-colors cursor-pointer"
      >
        <MoreVertical size={18} />
      </button>

      <MenuFlotantePortal targetRef={botonRef} isOpen={estaAbierto}>
        <button
          type="button"
          onClick={(e) => ejecutarAccion(e, abrirParaAtender)}
          className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100/70 text-left transition-colors cursor-pointer"
        >
          <CheckSquare size={16} className="text-emerald-600" />
          <span>Atender Turno</span>
        </button>

        <button
          type="button"
          onClick={(e) => ejecutarAccion(e, abrirParaReprogramar)}
          className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-sky-800 hover:bg-sky-50 text-left transition-colors cursor-pointer"
        >
          <CalendarDays size={16} className="text-sky-600" />
          <span>Reprogramar</span>
        </button>

        <button
          type="button"
          onClick={(e) => ejecutarAccion(e, abrirParaCancelar)}
          className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 text-left transition-colors cursor-pointer"
        >
          <X size={16} className="text-rose-500" />
          <span>Cancelar Turno</span>
        </button>

        <button
          type="button"
          onClick={(e) => ejecutarAccion(e, abrirParaInasistente)}
          className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-amber-800 hover:bg-amber-50 text-left transition-colors cursor-pointer"
        >
          <UserRoundX size={16} className="text-amber-600" />
          <span>Inasistido</span>
        </button>
      </MenuFlotantePortal>
    </div>
  );
}
