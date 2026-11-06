/** @format */
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { MoreVertical, X, SearchX, ChevronLeft, ChevronRight } from "lucide-react";
import useInteractiveSwipe from "../../../hooks/useInteractiveSwipe";

//* TONOS DE COLOR PARA LAS ACCIONES
const TONOS_RAPIDA = {
  neutro: "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100",
  verde: "bg-[#2eb086] hover:bg-[#259370] text-white",
  azul: "bg-white border border-gray-200 text-blue-600 hover:bg-blue-50",
  rojo: "bg-white border border-gray-200 text-red-600 hover:bg-red-50",
  ambar: "bg-white border border-gray-200 text-amber-700 hover:bg-amber-50",
};
const TONOS_SHEET = {
  neutro: "text-gray-700 hover:bg-gray-50",
  verde: "text-emerald-700 hover:bg-emerald-50",
  azul: "text-blue-600 hover:bg-blue-50/60",
  rojo: "text-red-600 hover:bg-red-50",
  ambar: "text-amber-700 hover:bg-amber-50",
};

/**
 * Tarjeta móvil genérica (reemplaza una fila de tabla en pantallas < md).
 * acciones: [{ key, label, icon, onClick, tono, rapida, oculto, separador }]
 *  - rapida: se muestra como botón de 44px en el pie (máx. 2)
 *  - todas las acciones están disponibles en el menú ⋮ (bottom sheet)
 */
export function TarjetaRegistro({ avatar, avatarClassName, titulo, subtitulo, badge, children, acciones = [], tituloSheet }) {
  const [sheetAbierto, setSheetAbierto] = useState(false);
  const visibles = acciones.filter((a) => !a.oculto);
  const rapidas = visibles.filter((a) => a.rapida).slice(0, 2);

  useEffect(() => {
    document.body.style.overflow = sheetAbierto ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [sheetAbierto]);

  const ejecutar = (accion) => {
    setSheetAbierto(false);
    setTimeout(() => accion.onClick?.(), 50);
  };

  return (
    <article className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden flex flex-col">
      {/* CABECERA */}
      <div className="px-4 pt-3.5 pb-2.5 flex items-start justify-between gap-2 border-b border-gray-100">
        <div className="flex items-center gap-2.5 min-w-0">
          {avatar && (
            typeof avatar === "string" ? (
              <div
                className={`w-9 h-9 rounded-full ${
                  avatarClassName || "bg-[#e8f7f1] text-[#2eb086]"
                } flex items-center justify-center font-bold text-sm shrink-0`}
              >
                {avatar}
              </div>
            ) : (
              avatar
            )
          )}
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 text-[15px] leading-snug truncate">{titulo}</h3>
            {subtitulo && <span className="text-[11px] font-medium text-gray-400 block truncate">{subtitulo}</span>}
          </div>
        </div>
        {badge}
      </div>

      {/* CUERPO */}
      <div className="px-4 py-3 flex flex-col gap-2 text-xs text-gray-600">{children}</div>

      {/* PIE */}
      {visibles.length > 0 && (
        <div className="px-3 py-2 bg-gray-50/80 border-t border-gray-100 flex items-center gap-2">
          {rapidas.map((a) => {
            const Icono = a.icon;
            return (
              <button
                key={a.key || a.label}
                type="button"
                onClick={() => a.onClick?.()}
                className={`flex-1 min-h-[44px] px-3 rounded-xl active:scale-[0.98] font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs ${TONOS_RAPIDA[a.tono || "neutro"]}`}
              >
                {Icono && <Icono size={16} className="shrink-0" />}
                <span>{a.label}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setSheetAbierto(true)}
            aria-label="Más opciones"
            className={`min-w-[44px] min-h-[44px] rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 active:scale-95 flex items-center justify-center transition-all shadow-2xs shrink-0 ${rapidas.length === 0 ? "flex-1 gap-2 text-xs font-semibold" : ""}`}
          >
            <MoreVertical size={18} />
            {rapidas.length === 0 && <span>Opciones</span>}
          </button>
        </div>
      )}

      {/* BOTTOM SHEET */}
      {sheetAbierto &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex flex-col justify-end bg-black/50 md:hidden"
            onClick={() => setSheetAbierto(false)}
          >
            <div
              className="bg-white w-full rounded-t-3xl shadow-2xl p-4 pb-6 animate-in slide-in-from-bottom duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-100">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    {tituloSheet || "Opciones"}
                  </p>
                  <h4 className="text-sm font-bold text-gray-900 truncate">{titulo}</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setSheetAbierto(false)}
                  aria-label="Cerrar menú"
                  className="min-w-[44px] min-h-[44px] rounded-full text-gray-400 hover:bg-gray-100 flex items-center justify-center"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex flex-col gap-1">
                {visibles.map((a) => {
                  const Icono = a.icon;
                  return (
                    <div key={a.key || a.label}>
                      {a.separador && <div className="my-1 border-t border-gray-100" />}
                      <button
                        type="button"
                        onClick={() => ejecutar(a)}
                        className={`w-full min-h-[48px] px-4 rounded-xl flex items-center gap-3 text-sm font-semibold transition-colors text-left ${TONOS_SHEET[a.tono || "neutro"]}`}
                      >
                        {Icono && <Icono size={18} className="shrink-0" />}
                        <span>{a.label}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </article>
  );
}

/** Contenedor de tarjetas con estados de carga, vacío y navegación por gestos (swipe). Solo visible en móvil. */
export function ListaTarjetas({
  cargando,
  search = "",
  sinDatosText = "No hay registros disponibles.",
  page,
  setPage,
  totalPages = 1,
  children,
}) {
  const items = Array.isArray(children) ? children : [children];
  const hayDatos = items.filter(Boolean).length > 0;

  const {
    containerProps,
    style: swipeStyle,
  } = useInteractiveSwipe({
    onSwipeLeft: () => {
      if (page && setPage && totalPages && page < totalPages) {
        setPage(page + 1);
      }
    },
    onSwipeRight: () => {
      if (page && setPage && page > 1) {
        setPage(page - 1);
      }
    },
    canSwipeLeft: page < totalPages,
    canSwipeRight: page > 1,
    disabled: !page || !setPage || totalPages <= 1,
  });

  if (cargando) {
    return (
      <div className="flex flex-col gap-3 p-3 bg-gray-50/60">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="h-5 bg-gray-200 rounded-md w-40" />
              <div className="h-6 bg-gray-200 rounded-full w-20" />
            </div>
            <div className="h-10 bg-gray-100 rounded-xl" />
            <div className="h-11 bg-gray-100 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (!hayDatos) {
    return (
      <div className="py-12 px-4 text-center font-medium flex flex-col items-center gap-2">
        {search.trim().length > 0 ? (
          <>
            <SearchX size={32} className="text-gray-300" />
            <p className="text-gray-600 font-semibold text-sm">
              No se encontraron resultados para <span className="text-gray-800">"{search}"</span>
            </p>
          </>
        ) : (
          <span className="text-gray-400 text-sm">{sinDatosText}</span>
        )}
      </div>
    );
  }

  return (
    <div {...containerProps} className="flex flex-col gap-3 p-3 bg-gray-50/70 select-none relative overflow-hidden touch-pan-y">
      {/* Indicador de gesto swipe si hay más de 1 página */}
      {totalPages > 1 && page && (
        <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold text-gray-500 bg-white/80 rounded-xl border border-gray-200 shadow-2xs">
          <span className="flex items-center gap-1">
            <ChevronLeft size={13} className={page > 1 ? "text-gray-700" : "text-gray-300"} />
            <span>Página {page} de {totalPages}</span>
            <ChevronRight size={13} className={page < totalPages ? "text-gray-700" : "text-gray-300"} />
          </span>
          <span className="text-[10px] text-gray-400 font-normal">Desliza ⇄</span>
        </div>
      )}

      {/* Contenedor interactivo que se desplaza en tiempo real al arrastrar con el dedo */}
      <div style={swipeStyle} className="flex flex-col gap-3 will-change-transform">
        {children}
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
  );
}
