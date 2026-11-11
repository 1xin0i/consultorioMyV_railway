/** @format */
import { useState, useEffect, useRef } from "react";
import {
  MoreVertical,
  Edit,
  CheckSquare,
  CalendarDays,
  X,
  UserRoundX,
  Banknote,
  Trash2,
} from "lucide-react";
import MenuFlotantePortal from "../../../components/common/MenuFlotantePortal";

export function BotonAccionesTurno({
  turno,
  menuAbiertoId: menuAbiertoIdProp,
  setMenuAbiertoId: setMenuAbiertoIdProp,
  abrirParaEditar,
  abrirParaAtender,
  abrirParaReprogramar,
  abrirParaCancelar,
  abrirParaInasistente,
  abrirParaCobrar,
  abrirParaEliminar,
}) {
  const [menuAbiertoIdLocal, setMenuAbiertoIdLocal] = useState(null);
  const menuAbiertoId =
    menuAbiertoIdProp !== undefined ? menuAbiertoIdProp : menuAbiertoIdLocal;
  const setMenuAbiertoId = setMenuAbiertoIdProp || setMenuAbiertoIdLocal;

  const botonRef = useRef(null);
  const menuRef = useRef(null);

  // Saber si este menú específico está abierto
  const estaAbierto = menuAbiertoId === turno?.id_turno;

  useEffect(() => {
    if (!estaAbierto) return;

    const handleClickOutside = (event) => {
      // Si el clic fue en este botón, el onClick del botón se encarga de alternar
      if (botonRef.current && botonRef.current.contains(event.target)) {
        return;
      }
      // Si el clic fue dentro de este menú flotante, no cerramos
      if (menuRef.current && menuRef.current.contains(event.target)) {
        return;
      }
      // Si fue en cualquier otro botón o elemento exterior, cerramos este menú
      setMenuAbiertoId(null);
    };

    const handleScroll = (event) => {
      // Si se scrollea fuera del menú flotante, cerramos
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

  if (!turno) return null;

  const ejecutarAccion = (e, callback) => {
    e.stopPropagation();
    setMenuAbiertoId(null);
    setTimeout(() => {
      if (typeof callback === "function") {
        callback(turno);
      }
    }, 0);
  };

  const idEstado = Number(turno.id_estado || turno.EstadoTurno?.id_estado);
  const estadoNombre = turno.EstadoTurno?.estado || "";

  const esProgramado = idEstado === 1 || estadoNombre === "Programado";
  const esAtendido = idEstado === 2 || estadoNombre === "Atendido";
  const esCancelado = idEstado === 3 || estadoNombre === "Cancelado";
  const esInasistente =
    idEstado === 4 ||
    estadoNombre === "Inasistente" ||
    estadoNombre === "Inasistido";

  return (
    <div className="relative">
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

      <MenuFlotantePortal ref={menuRef} targetRef={botonRef} isOpen={estaAbierto}>
        {/* Si está PROGRAMADO: editar, atender, cancelar, inasistido y reprogramar */}
        {esProgramado && (
          <>
            <button
              type="button"
              onClick={(e) => ejecutarAccion(e, abrirParaEditar)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 text-left transition-colors cursor-pointer w-full"
            >
              <Edit size={16} className="text-blue-600" />
              <span>Editar</span>
            </button>

            <button
              type="button"
              onClick={(e) => ejecutarAccion(e, abrirParaAtender)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100/70 text-left transition-colors cursor-pointer w-full"
            >
              <CheckSquare size={16} className="text-emerald-600" />
              <span>Atender</span>
            </button>

            <button
              type="button"
              onClick={(e) => ejecutarAccion(e, abrirParaCancelar)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 text-left transition-colors cursor-pointer w-full"
            >
              <X size={16} className="text-rose-500" />
              <span>Cancelar</span>
            </button>

            <button
              type="button"
              onClick={(e) => ejecutarAccion(e, abrirParaInasistente)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-amber-800 hover:bg-amber-50 text-left transition-colors cursor-pointer w-full"
            >
              <UserRoundX size={16} className="text-amber-600" />
              <span>Inasistido</span>
            </button>

            <button
              type="button"
              onClick={(e) => ejecutarAccion(e, abrirParaReprogramar)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-sky-800 hover:bg-sky-50 text-left transition-colors cursor-pointer w-full"
            >
              <CalendarDays size={16} className="text-sky-600" />
              <span>Reprogramar</span>
            </button>
          </>
        )}

        {/* Si está ATENDIDO: cobrar */}
        {esAtendido && (
          <button
            type="button"
            onClick={(e) => ejecutarAccion(e, abrirParaCobrar)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-emerald-800 hover:bg-emerald-50 text-left transition-colors cursor-pointer w-full"
          >
            <Banknote size={16} className="text-emerald-600" />
            <span>Cobrar</span>
          </button>
        )}

        {/* Si está CANCELADO o INASISTIDO: reprogramar */}
        {(esCancelado || esInasistente) && (
          <button
            type="button"
            onClick={(e) => ejecutarAccion(e, abrirParaReprogramar)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-sky-800 hover:bg-sky-50 text-left transition-colors cursor-pointer w-full"
          >
            <CalendarDays size={16} className="text-sky-600" />
            <span>Reprogramar</span>
          </button>
        )}

        {/* Opción común: Eliminar / Cancelar definitivamente el registro */}
        {abrirParaEliminar && (
          <>
            <div className="my-1 border-t border-gray-100 dark:border-slate-700/60" />
            <button
              type="button"
              onClick={(e) => ejecutarAccion(e, abrirParaEliminar)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left transition-colors cursor-pointer w-full"
            >
              <Trash2 size={16} className="text-rose-500" />
              <span>Eliminar turno</span>
            </button>
          </>
        )}
      </MenuFlotantePortal>
    </div>
  );
}

export default BotonAccionesTurno;
