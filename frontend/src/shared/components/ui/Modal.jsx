/** @format */

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const VARIANT_STYLES = {
  teal: {
    headerBg:
      "bg-[#e8f7f0] dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-100",
    titleText: "text-emerald-950 dark:text-emerald-100",
    closeBtn:
      "text-emerald-700 dark:text-emerald-300 hover:text-emerald-950 hover:bg-emerald-200/50 dark:hover:bg-emerald-900/50 focus:ring-emerald-500/30",
    accentBar: "bg-[#2eb086]",
  },
  atendiendo: {
    headerBg:
      "bg-[#e8f7f0] dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-100",
    titleText: "text-emerald-950 dark:text-emerald-100",
    closeBtn:
      "text-emerald-700 dark:text-emerald-300 hover:text-emerald-950 hover:bg-emerald-200/50 dark:hover:bg-emerald-900/50 focus:ring-emerald-500/30",
    accentBar: "bg-[#2eb086]",
  },
  danger: {
    headerBg:
      "bg-[#fff1f2] dark:bg-rose-950/60 text-rose-950 dark:text-rose-100",
    titleText: "text-rose-950 dark:text-rose-100",
    closeBtn:
      "text-rose-600 dark:text-rose-300 hover:text-rose-900 hover:bg-rose-200/50 dark:hover:bg-rose-900/50 focus:ring-rose-500/30",
    accentBar: "bg-rose-500",
  },
  cancelando: {
    headerBg:
      "bg-[#fff1f2] dark:bg-rose-950/60 text-rose-950 dark:text-rose-100",
    titleText: "text-rose-950 dark:text-rose-100",
    closeBtn:
      "text-rose-600 dark:text-rose-300 hover:text-rose-900 hover:bg-rose-200/50 dark:hover:bg-rose-900/50 focus:ring-rose-500/30",
    accentBar: "bg-rose-500",
  },
  warning: {
    headerBg:
      "bg-[#fffbeb] dark:bg-amber-950/60 text-amber-950 dark:text-amber-100",
    titleText: "text-amber-950 dark:text-amber-100",
    closeBtn:
      "text-amber-700 dark:text-amber-300 hover:text-amber-950 hover:bg-amber-200/50 dark:hover:bg-amber-900/50 focus:ring-amber-500/30",
    accentBar: "bg-amber-500",
  },
  inasistente: {
    headerBg:
      "bg-[#fffbeb] dark:bg-amber-950/60 text-amber-950 dark:text-amber-100",
    titleText: "text-amber-950 dark:text-amber-100",
    closeBtn:
      "text-amber-700 dark:text-amber-300 hover:text-amber-950 hover:bg-amber-200/50 dark:hover:bg-amber-900/50 focus:ring-amber-500/30",
    accentBar: "bg-amber-500",
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
  headerClassName,
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
        className={`bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full ${width} overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`flex justify-between items-center px-5 py-3.5 sm:px-6 sm:py-4 ${headerClassName || vStyle.headerBg} shrink-0`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={`w-1.5 h-5 rounded-full ${vStyle.accentBar} shrink-0`}
            />
            <h2
              className={`text-base sm:text-lg font-bold tracking-tight truncate ${vStyle.titleText}`}
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
