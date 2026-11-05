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
        // Verificar actualizaciones periódicamente
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.warn("[PWA] Error al registrar SW:", error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:w-96 z-9999 bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="p-2 rounded-xl bg-emerald-50 text-[#2eb086] shrink-0">
          <RefreshCw size={18} />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-bold text-gray-900 truncate">
            Actualización disponible
          </span>
          <span className="text-[11px] text-gray-500 truncate">
            Hay una nueva versión de Consultorio M&V
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => updateServiceWorker(true)}
          className="px-3 py-1.5 bg-[#2eb086] hover:bg-[#269470] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
        >
          Actualizar
        </button>
        <button
          type="button"
          onClick={() => setNeedRefresh(false)}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Descartar"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

export default ReloadPrompt;
