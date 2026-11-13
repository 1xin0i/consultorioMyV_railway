/** @format */

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const VARIANT_STYLES = {
  teal: {
    headerBg:
      "bg-gradient-to-r from-[#0d8266] to-[#149678] text-white border-b border-teal-700/40",
    titleText: "text-white",
    closeBtn:
      "text-teal-100 hover:text-white hover:bg-white/15 focus:ring-white/30",
    accentBar: "bg-emerald-300",
  },
  danger: {
    headerBg:
      "bg-gradient-to-r from-rose-600 to-rose-500 text-white border-b border-rose-700/40",
    titleText: "text-white",
    closeBtn:
      "text-rose-100 hover:text-white hover:bg-white/15 focus:ring-white/30",
    accentBar: "bg-rose-200",
  },
  warning: {
    headerBg:
      "bg-gradient-to-r from-amber-600 to-amber-500 text-white border-b border-amber-700/40",
    titleText: "text-white",
    closeBtn:
      "text-amber-100 hover:text-white hover:bg-white/15 focus:ring-white/30",
    accentBar: "bg-amber-200",
  },
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  onSubmit,
  width = "max-w-lg",
  variant = "teal",
}) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const manejarTecla = (e) => {
      if (e.key === "Escape") {
        onCloseRef.current?.();
      }
    };

    window.addEventListener("keydown", manejarTecla);
    return () => window.removeEventListener("keydown", manejarTecla);
  }, [isOpen]);

  if (!isOpen) return null;

  const vStyle = VARIANT_STYLES[variant] || VARIANT_STYLES.teal;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 bg-slate-900/55 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className={`bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl shadow-teal-950/20 w-full ${width} overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] border border-teal-100 dark:border-slate-800`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`flex justify-between items-center px-5 py-3.5 sm:px-6 sm:py-4 ${vStyle.headerBg} shrink-0`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={`w-1.5 h-5 rounded-full ${vStyle.accentBar} shrink-0`}
            />
            <h2
              className={`text-base sm:text-lg font-extrabold tracking-tight truncate ${vStyle.titleText}`}
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-colors cursor-pointer shrink-0 ${vStyle.closeBtn}`}
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
          {onSubmit ? (
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              {children}
            </form>
          ) : (
            <div className="flex flex-col gap-4">{children}</div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export default Modal;

