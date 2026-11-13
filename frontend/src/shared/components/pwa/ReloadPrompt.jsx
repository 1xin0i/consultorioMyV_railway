/** @format */

import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw, X } from "lucide-react";

export function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        setInterval(
          () => {
            r.update();
          },
          60 * 60 * 1000,
        );
      }
    },
    onRegisterError(error) {
      console.error("Error al registrar el Service Worker:", error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-20 md:bottom-5 right-4 z-[9998] max-w-sm w-[calc(100%-2rem)] bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700/80 p-4 flex items-center justify-between gap-3 animate-fade-in"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-[#2eb086]/20 border border-[#2eb086]/40 flex items-center justify-center shrink-0 text-[#2eb086]">
          <RefreshCw size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-white leading-tight">
            Nueva versión disponible
          </p>
          <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
            Actualizá para cargar las últimas mejoras del sistema.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => updateServiceWorker(true)}
          className="px-3 py-1.5 rounded-xl bg-[#2eb086] hover:bg-[#259370] text-white text-xs font-bold transition-colors cursor-pointer"
        >
          Actualizar
        </button>
        <button
          type="button"
          onClick={() => setNeedRefresh(false)}
          aria-label="Cerrar aviso"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}

export default ReloadPrompt;

