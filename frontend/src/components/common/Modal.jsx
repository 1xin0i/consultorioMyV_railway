/** @format */

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, AlertCircle, FileText, CheckCircle2 } from "lucide-react";

/**
 * Componente reutilizable para mostrar un modal con contenido personalizado.
 * Se monta mediante Portal directamente en document.body para evitar que contenedores
 * con overflow, transform o will-change atrapen el modal y su fondo oscuro.
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {boolean} props.isOpen - Determina si el modal está visible.
 * @param {Function} props.onClose - Función para cerrar el modal.
 * @param {Function} [props.onSubmit] - Función opcional a ejecutar al presionar Enter o enviar el formulario.
 * @param {string} [props.title] - Título del modal.
 * @param {string} [props.titulo] - Alias compatible para título del modal.
 * @param {React.ReactNode} props.children - Contenido del modal.
 * @param {string} props.width - Ancho del modal (ej. 'max-w-lg' para formularios).
 * @param {boolean} props.showBackdrop - Si true, muestra un fondo oscurecido.
 * @param {string} props.backdropColor - Color del fondo (por defecto rgba(0,0,0,0.5)).
 * @param {boolean} props.showCloseButton - Si true, muestra un botón de cierre en la esquina.
 * @param {string} props.customClass - Clases CSS adicionales para personalizar el modal.
 */

const Modal = ({
  isOpen,
  onClose,
  onSubmit,
  children,
  title,
  titulo,
  icon: PropIcon,
  variant, // 'default' | 'danger' | 'warning' | 'brand'
  width = "max-w-lg",
  showBackdrop = true,
  backdropColor = "rgba(15, 23, 42, 0.45)", // slate-900 con opacidad suave moderna
  showCloseButton = true,
  customClass = "",
}) => {
  const modalTitle = title || titulo;

  // Detección automática inteligente si no se especifica variante
  const effectiveVariant = variant || (() => {
    if (!modalTitle) return "default";
    const lower = modalTitle.toLowerCase();
    if (lower.includes("eliminar") || lower.includes("borrar") || lower.includes("baja")) return "danger";
    if (lower.includes("cancelar") || lower.includes("cerrar sesión") || lower.includes("logout") || lower.includes("inasist")) return "warning";
    return "default";
  })();

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
      } else if (e.key === "Enter" && onSubmit) {
        // Permitimos que los inputs, selects, textareas y botones manejen Enter con validación nativa del navegador
        const tag = e.target.tagName?.toLowerCase();
        if (tag === "textarea" || tag === "input" || tag === "select" || tag === "button") return;

        e.preventDefault();
        onSubmit(e);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onSubmit]);

  if (!isOpen) return null;

  const handleFormSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (onSubmit) onSubmit(e);
  };

  const ContentWrapper = onSubmit ? "form" : "div";

  const modalNode = (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      style={{
        backgroundColor: showBackdrop ? backdropColor : "transparent",
      }}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl border border-gray-200/90 w-full ${width} 
              flex flex-col max-h-[90vh] overflow-hidden relative ${customClass}`}
      >
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 rounded-xl p-1.5 z-10 transition-all cursor-pointer text-slate-500 hover:text-rose-700 hover:bg-black/5 active:scale-95"
            aria-label="Cerrar modal"
            title="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {modalTitle && (
          <div
            className={`px-5 py-4 border-b shrink-0 flex items-center justify-between ${
              effectiveVariant === "danger"
                ? "bg-rose-50 border-rose-200 text-rose-950"
                : effectiveVariant === "warning"
                ? "bg-amber-50 border-amber-200 text-amber-950"
                : "bg-[#e8f7f1] border-[#c2e8d9] text-slate-800"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 pr-8">
              {/* Ícono de cabecera con color y borde */}
              {effectiveVariant === "danger" ? (
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0 shadow-2xs">
                  <AlertTriangle size={17} />
                </div>
              ) : effectiveVariant === "warning" ? (
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0 shadow-2xs">
                  <AlertCircle size={17} />
                </div>
              ) : PropIcon ? (
                <div className="w-8 h-8 rounded-xl bg-[#2eb086] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <PropIcon size={17} />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-[#2eb086] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <FileText size={16} />
                </div>
              )}

              <h2
                className={`text-base sm:text-lg font-bold tracking-tight truncate ${
                  effectiveVariant === "danger"
                    ? "text-rose-950"
                    : effectiveVariant === "warning"
                    ? "text-amber-950"
                    : "text-slate-900"
                }`}
              >
                {modalTitle}
              </h2>
            </div>
          </div>
        )}

        {/* El contenedor con scroll interno */}
        <ContentWrapper
          onSubmit={onSubmit ? handleFormSubmit : undefined}
          className="p-5 sm:p-6 bg-white overflow-y-auto grow flex flex-col"
        >
          {children}
        </ContentWrapper>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalNode, document.body)
    : modalNode;
};

export default Modal;
