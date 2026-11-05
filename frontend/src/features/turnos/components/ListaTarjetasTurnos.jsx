/** @format */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  Calendar,
  Clock,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  CheckSquare,
  CalendarDays,
  X,
  UserRoundX,
  FileText,
  User,
  DollarSign,
  AlertCircle,
  SearchX,
  Wallet,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { estadosMap } from "../utils/estadosMap";
import useInteractiveSwipe from "../../../hooks/useInteractiveSwipe";
import { formatFechaTabla, formatDateTimeInput, formatSoloHora } from "../../../utils/index";

export function ListaTarjetasTurnos({
  turnos = [],
  cargando = false,
  search = "",
  sinDatosText = "No se encontraron turnos registrados.",
  abrirParaVer,
  abrirParaEditar,
  abrirParaEliminar,
  abrirParaAtender,
  abrirParaReprogramar,
  abrirParaCancelar,
  abrirParaInasistente,
  page,
  setPage,
  totalPages,
}) {
  const navigate = useNavigate();
  const [turnoMenuActivo, setTurnoMenuActivo] = useState(null);

  const {
    containerProps,
    style: swipeStyle,
  } = useInteractiveSwipe({
    onSwipeLeft: () => {
      if (totalPages && page && page < totalPages && setPage) {
        setPage(page + 1);
      }
    },
    onSwipeRight: () => {
      if (page && page > 1 && setPage) {
        setPage(page - 1);
      }
    },
    canSwipeLeft: page < totalPages,
    canSwipeRight: page > 1,
    disabled: !page || !setPage || totalPages <= 1,
  });

  // Bloquear scroll del body cuando el Bottom Sheet está abierto
  useEffect(() => {
    if (turnoMenuActivo) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [turnoMenuActivo]);

  const ejecutarAccionSheet = (callback, turnoTarget) => {
    setTurnoMenuActivo(null);
    setTimeout(() => {
      if (typeof callback === "function") {
        callback(turnoTarget);
      }
    }, 50);
  };

  const handleEditar = (turno) => {
    abrirParaEditar(turno, (item) => ({
      ...item,
      fecha_hora_inicio: formatDateTimeInput(item.fecha_hora_inicio),
      fecha_hora_fin: formatDateTimeInput(item.fecha_hora_fin),
      duracion_minutos: item.duracion_minutos || 30,
    }));
  };

  if (cargando) {
    return (
      <div className="flex flex-col gap-3 p-3 bg-gray-50/60">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs animate-pulse flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-5 bg-gray-200 rounded-md w-40" />
              <div className="h-6 bg-gray-200 rounded-full w-24" />
            </div>
            <div className="h-12 bg-gray-100 rounded-xl w-full" />
            <div className="flex justify-between items-center pt-1">
              <div className="h-4 bg-gray-200 rounded-md w-28" />
              <div className="h-5 bg-gray-200 rounded-md w-20" />
            </div>
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <div className="h-11 bg-gray-100 rounded-xl flex-1" />
              <div className="h-11 bg-gray-100 rounded-xl w-11" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (turnos.length === 0) {
    const estaBuscando = search.trim().length > 0;
    return (
      <div className="py-12 px-4 text-center font-medium bg-white">
        <div className="flex flex-col items-center justify-center gap-2">
          {estaBuscando ? (
            <>
              <SearchX size={32} className="text-gray-300" />
              <p className="text-gray-600 font-semibold text-sm">
                No se encontraron resultados para <span className="text-gray-800">"{search}"</span>
              </p>
              <p className="text-xs text-gray-400">
                Intenta con otros términos de búsqueda o verifica que esté bien escrito.
              </p>
            </>
          ) : (
            <span className="text-gray-400 text-sm">{sinDatosText}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div {...containerProps} className="flex flex-col gap-3 p-3 bg-gray-50/70 touch-pan-y overflow-hidden select-none relative">
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-white/90 border border-gray-200/80 rounded-xl text-xs font-semibold text-gray-700 shadow-2xs select-none">
            <span>Página {page} de {totalPages}</span>
            <span className="text-[11px] text-gray-400 font-normal">Desliza ⇄</span>
          </div>
        )}
        <div style={swipeStyle} className="flex flex-col gap-3 will-change-transform">
        {turnos.map((turno) => {
          const estadoNombre = turno.EstadoTurno?.estado || "Desconocido";
          const estadoInfo = estadosMap[estadoNombre] || {
            color: "bg-gray-100 text-gray-600 border-gray-200",
            icon: AlertCircle,
          };
          const IconoEstado = estadoInfo.icon;
          const esProgramado = estadoNombre === "Programado";

          const nombrePaciente = turno.Paciente
            ? `${turno.Paciente.nombre} ${turno.Paciente.apellido}`
            : `Paciente #${turno.id_paciente}`;

          const precioFormateado = Number(turno.precio_final || 0).toLocaleString("es-AR", {
            minimumFractionDigits: 2,
          });

          return (
            <article
              key={turno.id_turno}
              className="bg-white rounded-2xl border border-teal-100 shadow-xs overflow-hidden flex flex-col transition-all"
            >
              {/* ─── CABECERA DE LA TARJETA: Paciente en negrita a la izq + Badge Estado a la der ─── */}
              <div className="px-4 pt-3.5 pb-2.5 flex items-start justify-between gap-2 border-b border-teal-100/70 bg-gradient-to-r from-teal-50/40 via-emerald-50/20 to-white">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200/90 flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                    {turno.Paciente?.nombre?.charAt(0) || "P"}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 text-[15px] leading-snug truncate tracking-tight">
                      {nombrePaciente}
                    </h3>
                    <span className="text-[11px] font-mono font-medium text-teal-700/70 block">
                      Turno #{turno.id_turno}
                    </span>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border shrink-0 shadow-2xs ${estadoInfo.color}`}
                >
                  <IconoEstado size={13} />
                  <span>{estadoNombre}</span>
                </span>
              </div>

              {/* ─── CUERPO DE LA TARJETA: Fecha/Hora destacados, DNI/Nota y Monto ─── */}
              <div className="px-4 py-3 flex flex-col gap-2.5">
                {/* Fecha y hora destacados con fondo tintado suave clínico */}
                <div className="flex items-center justify-between bg-gradient-to-r from-emerald-50/80 to-teal-50/60 border border-teal-100/90 rounded-xl px-3 py-2 shadow-2xs">
                  <div className="flex items-center gap-2 text-slate-900">
                    <Calendar size={15} className="text-teal-600 shrink-0" />
                    <span className="text-xs font-bold">
                      {formatFechaTabla(turno.fecha_hora_inicio)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-teal-900">
                    <Clock size={14} className="text-teal-600 shrink-0" />
                    <span className="text-xs font-semibold">
                      {formatSoloHora(turno.fecha_hora_inicio)} - {formatSoloHora(turno.fecha_hora_fin)} hs
                    </span>
                  </div>
                </div>

                {/* DNI y motivo/práctica o nota breve */}
                <div className="flex flex-col gap-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-teal-600 shrink-0" />
                    <span className="text-teal-700/80 font-semibold">DNI:</span>
                    <span className="font-medium text-slate-800">
                      {turno.Paciente?.dni || "Sin especificar"}
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    <FileText size={14} className="text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-slate-600 line-clamp-2 leading-relaxed">
                      {turno.notas_consulta ? (
                        turno.notas_consulta
                      ) : (
                        <span className="text-slate-400 italic">Sin motivo / notas registradas</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Monto cobrado / precio destacado */}
                <div className="flex items-center justify-between pt-2 border-t border-dashed border-teal-100">
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                    <DollarSign size={14} className="text-teal-600" />
                    Monto / Precio
                  </span>
                  {Number(turno.precio_final) > 0 ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-xl bg-emerald-100/70 border border-emerald-200/90 text-emerald-900 font-extrabold text-sm tabular-nums shadow-2xs">
                      ${precioFormateado}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 font-medium text-xs border border-slate-200/60 tabular-nums">
                      $0,00
                    </span>
                  )}
                </div>
              </div>

              {/* ─── PIE DE ACCIONES: Área táctil >= 44x44px + Menú contextual (⋮) con Bottom Sheet ─── */}
              <div className="px-3 py-2 bg-gradient-to-r from-teal-50/30 via-white to-teal-50/20 border-t border-teal-100 flex items-center gap-2">
                {/* Botón rápido: Ver detalle */}
                <button
                  type="button"
                  onClick={() => abrirParaVer(turno)}
                  className="flex-1 min-h-[44px] px-3 rounded-xl bg-white border border-teal-200 text-teal-800 hover:bg-teal-50 active:scale-[0.98] font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                >
                  <Eye size={16} className="text-teal-600 shrink-0" />
                  <span>Ver detalle</span>
                </button>

                {/* Segundo botón rápido según estado */}
                {esProgramado && (
                  <button
                    type="button"
                    onClick={() => abrirParaAtender(turno)}
                    className="flex-1 min-h-[44px] px-3 rounded-xl bg-[#2eb086] hover:bg-[#259370] active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-emerald-500/30 cursor-pointer"
                  >
                    <CheckSquare size={16} className="shrink-0" />
                    <span>Atender</span>
                  </button>
                )}
                {turno.EstadoTurno?.estado === "Atendido" && (
                  <button
                    type="button"
                    onClick={() => navigate("/caja", { state: { turnoParaCobrar: turno } })}
                    className="flex-1 min-h-[44px] px-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 hover:bg-emerald-200 active:scale-[0.98] font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Wallet size={16} className="shrink-0" />
                    <span>Cobrar</span>
                  </button>
                )}

                {/* Botón de tres puntos (⋮) con área táctil de 44x44 px que abre el Bottom Sheet */}
                <button
                  type="button"
                  onClick={() => setTurnoMenuActivo(turno)}
                  aria-label="Más opciones del turno"
                  className="min-w-[44px] min-h-[44px] rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:scale-95 flex items-center justify-center transition-all shadow-2xs shrink-0 cursor-pointer"
                >
                  <MoreVertical size={18} />
                </button>
              </div>
            </article>
          );
        })}
        </div>

        {/* Badge flotante al lado del botón FAB (+) */}
        {totalPages > 1 && page && (
          <div className="fixed sm:hidden right-[4.5rem] bottom-20 z-40 flex items-center h-12 pointer-events-none">
            <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md border border-gray-200/90 shadow-md rounded-full px-2.5 py-1 text-xs font-bold text-gray-700 pointer-events-auto transition-transform active:scale-95">
              {page > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.navigator?.vibrate) window.navigator.vibrate(25);
                    setPage(page - 1);
                  }}
                  className="p-1 -ml-1 text-gray-400 hover:text-gray-700 active:scale-90"
                  aria-label="Página anterior"
                >
                  <ChevronLeft size={13} />
                </button>
              )}
              <span className="text-[11px] text-gray-500 font-semibold">Pág.</span>
              <span className="text-emerald-700 font-extrabold">{page}</span>
              <span className="text-gray-300 font-light">/</span>
              <span className="text-gray-600">{totalPages}</span>
              {page < totalPages && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.navigator?.vibrate) window.navigator.vibrate(25);
                    setPage(page + 1);
                  }}
                  className="p-1 -mr-1 text-gray-400 hover:text-gray-700 active:scale-90"
                  aria-label="Página siguiente"
                >
                  <ChevronRight size={13} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── BOTTOM SHEET DE OPCIONES EN MÓVIL ─── */}
      {turnoMenuActivo &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex flex-col justify-end bg-black/50 backdrop-blur-[1px] md:hidden"
            onClick={() => setTurnoMenuActivo(null)}
          >
            <div
              className="bg-white w-full rounded-t-3xl shadow-2xl border-t border-gray-100 p-4 pb-6 animate-in slide-in-from-bottom duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Indicador superior tipo Bottom Sheet */}
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3" />

              {/* Cabecera del Bottom Sheet */}
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-100">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Opciones del Turno #{turnoMenuActivo.id_turno}
                  </p>
                  <h4 className="text-sm font-bold text-gray-900 truncate">
                    {turnoMenuActivo.Paciente
                      ? `${turnoMenuActivo.Paciente.nombre} ${turnoMenuActivo.Paciente.apellido}`
                      : `Paciente #${turnoMenuActivo.id_paciente}`}
                  </h4>
                  <span className="text-xs text-gray-500">
                    {formatFechaTabla(turnoMenuActivo.fecha_hora_inicio)} •{" "}
                    {formatSoloHora(turnoMenuActivo.fecha_hora_inicio)} hs
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setTurnoMenuActivo(null)}
                  className="min-w-[44px] min-h-[44px] rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center"
                  aria-label="Cerrar menú"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Lista de acciones con área táctil >= 48px */}
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => ejecutarAccionSheet(abrirParaVer, turnoMenuActivo)}
                  className="w-full min-h-[48px] px-4 rounded-xl flex items-center gap-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                >
                  <Eye size={18} className="text-emerald-600 shrink-0" />
                  <span>Ver detalle del turno</span>
                </button>

                {turnoMenuActivo.EstadoTurno?.estado === "Programado" && (
                  <button
                    type="button"
                    onClick={() => ejecutarAccionSheet(handleEditar, turnoMenuActivo)}
                    className="w-full min-h-[48px] px-4 rounded-xl flex items-center gap-3 text-sm font-semibold text-blue-600 hover:bg-blue-50/60 active:bg-blue-50 transition-colors text-left"
                  >
                    <Edit size={18} className="shrink-0" />
                    <span>Editar turno</span>
                  </button>
                )}

                {turnoMenuActivo.EstadoTurno?.estado === "Atendido" && (
                  <button
                    type="button"
                    onClick={() => {
                      setTurnoMenuActivo(null);
                      navigate("/caja", { state: { turnoParaCobrar: turnoMenuActivo } });
                    }}
                    className="w-full min-h-[48px] px-4 rounded-xl flex items-center gap-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 active:bg-emerald-100/60 transition-colors text-left"
                  >
                    <Wallet size={18} className="shrink-0" />
                    <span>Cobrar atención en Caja</span>
                  </button>
                )}

                {turnoMenuActivo.EstadoTurno?.estado === "Programado" && (
                  <>
                    <div className="my-1 border-t border-gray-100" />

                    <button
                      type="button"
                      onClick={() => ejecutarAccionSheet(abrirParaAtender, turnoMenuActivo)}
                      className="w-full min-h-[48px] px-4 rounded-xl flex items-center gap-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 active:bg-emerald-100/60 transition-colors text-left"
                    >
                      <CheckSquare size={18} className="shrink-0" />
                      <span>Atender turno</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        ejecutarAccionSheet(
                          abrirParaReprogramar,
                          turnoMenuActivo,
                        )
                      }
                      className="w-full min-h-[48px] px-4 rounded-xl flex items-center gap-3 text-sm font-semibold text-[#3B7A94] hover:bg-[#f0f6f9] active:bg-[#e1eef4] transition-colors text-left"
                    >
                      <CalendarDays size={18} className="shrink-0" />
                      <span>Reprogramar horario</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => ejecutarAccionSheet(abrirParaInasistente, turnoMenuActivo)}
                      className="w-full min-h-[48px] px-4 rounded-xl flex items-center gap-3 text-sm font-semibold text-[#2b5d73] hover:bg-[#f0f6f9] active:bg-[#e1eef4] transition-colors text-left"
                    >
                      <UserRoundX size={18} className="shrink-0" />
                      <span>Marcar como Inasistente</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => ejecutarAccionSheet(abrirParaCancelar, turnoMenuActivo)}
                      className="w-full min-h-[48px] px-4 rounded-xl flex items-center gap-3 text-sm font-semibold text-amber-700 hover:bg-amber-50 active:bg-amber-100/60 transition-colors text-left"
                    >
                      <X size={18} className="shrink-0" />
                      <span>Cancelar turno</span>
                    </button>
                  </>
                )}

                <div className="my-1 border-t border-gray-100" />

                <button
                  type="button"
                  onClick={() => ejecutarAccionSheet(abrirParaEliminar, turnoMenuActivo)}
                  className="w-full min-h-[48px] px-4 rounded-xl flex items-center gap-3 text-sm font-semibold text-red-600 hover:bg-red-50 active:bg-red-100/60 transition-colors text-left"
                >
                  <Trash2 size={18} className="shrink-0" />
                  <span>Eliminar turno</span>
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

