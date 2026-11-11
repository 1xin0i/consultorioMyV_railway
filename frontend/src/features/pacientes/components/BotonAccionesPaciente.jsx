/** @format */
import { useState, useEffect, useRef } from "react";
import {
  MoreVertical,
  Edit,
  CalendarPlus,
  PauseCircle,
  RotateCcw,
  Trash2,
} from "lucide-react";
import MenuFlotantePortal from "../../../components/common/MenuFlotantePortal";

export function BotonAccionesPaciente({
  paciente,
  menuAbiertoId: menuAbiertoIdProp,
  setMenuAbiertoId: setMenuAbiertoIdProp,
  abrirParaEditar,
  abrirParaAgendarTurno,
  abrirParaToggle,
  abrirParaEliminar,
}) {
  const [menuAbiertoIdLocal, setMenuAbiertoIdLocal] = useState(null);
  const menuAbiertoId =
    menuAbiertoIdProp !== undefined ? menuAbiertoIdProp : menuAbiertoIdLocal;
  const setMenuAbiertoId = setMenuAbiertoIdProp || setMenuAbiertoIdLocal;

  const botonRef = useRef(null);
  const menuRef = useRef(null);

  const estaAbierto = menuAbiertoId === paciente?.id_paciente;

  useEffect(() => {
    if (!estaAbierto) return;

    const handleClickOutside = (event) => {
      if (botonRef.current && botonRef.current.contains(event.target)) {
        return;
      }
      if (menuRef.current && menuRef.current.contains(event.target)) {
        return;
      }
      setMenuAbiertoId(null);
    };

    const handleScroll = (event) => {
      if (menuRef.current && menuRef.current.contains(event.target)) {
        return;
      }
      setMenuAbiertoId(null);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [estaAbierto, setMenuAbiertoId]);

  if (!paciente) return null;

  const ejecutarAccion = (e, callback) => {
    e.stopPropagation();
    setMenuAbiertoId(null);
    setTimeout(() => {
      if (typeof callback === "function") {
        callback(paciente);
      }
    }, 0);
  };

  const esActivo = Boolean(paciente.activo);

  return (
    <div className="relative">
      <button
        ref={botonRef}
        type="button"
        aria-label="Más opciones del paciente"
        title="Más opciones del paciente"
        onClick={(e) => {
          e.stopPropagation();
          setMenuAbiertoId(estaAbierto ? null : paciente.id_paciente);
        }}
        className="p-2 rounded-xl text-teal-800/70 hover:bg-teal-50 dark:hover:bg-slate-800 hover:text-teal-900 dark:hover:text-teal-300 transition-colors cursor-pointer"
      >
        <MoreVertical size={18} />
      </button>

      <MenuFlotantePortal ref={menuRef} targetRef={botonRef} isOpen={estaAbierto}>
        {/* ✏️ Editar datos personales */}
        <button
          type="button"
          onClick={(e) => ejecutarAccion(e, abrirParaEditar)}
          className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-left transition-colors cursor-pointer w-full"
        >
          <Edit size={16} className="text-blue-600" />
          <span>Editar datos personales</span>
        </button>

        {/* 📅 Agendar nuevo turno */}
        <button
          type="button"
          onClick={(e) => ejecutarAccion(e, abrirParaAgendarTurno)}
          className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-left transition-colors cursor-pointer w-full"
        >
          <CalendarPlus size={16} className="text-[#2eb086]" />
          <span>Agendar nuevo turno</span>
        </button>

        {/* ⏸️ Marcar como inactivo o Reactivar */}
        <button
          type="button"
          onClick={(e) => ejecutarAccion(e, abrirParaToggle)}
          className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-left transition-colors cursor-pointer w-full"
        >
          {esActivo ? (
            <>
              <PauseCircle size={16} className="text-amber-600" />
              <span>Marcar como inactivo</span>
            </>
          ) : (
            <>
              <RotateCcw size={16} className="text-emerald-600" />
              <span>Reactivar paciente</span>
            </>
          )}
        </button>

        {/* Separador */}
        <div className="my-1 border-t border-gray-100 dark:border-slate-700/60" />

        {/* 🗑️ Eliminar paciente */}
        <button
          type="button"
          onClick={(e) => ejecutarAccion(e, abrirParaEliminar || abrirParaToggle)}
          className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left transition-colors cursor-pointer w-full"
        >
          <Trash2 size={16} className="text-rose-500" />
          <span>Eliminar paciente</span>
        </button>
      </MenuFlotantePortal>
    </div>
  );
}

export default BotonAccionesPaciente;

