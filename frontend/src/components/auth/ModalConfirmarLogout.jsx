/** @format */
import { LogOut, AlertTriangle } from "lucide-react";
import Modal from "../common/Modal";
import { useAuth } from "../../context/AuthContext";

export default function ModalConfirmarLogout() {
  const { modalLogoutAbierto, cancelarLogout, logout } = useAuth();

  if (!modalLogoutAbierto) return null;

  return (
    <Modal
      isOpen={modalLogoutAbierto}
      onClose={cancelarLogout}
      title="Cerrar Sesión"
      width="max-w-sm"
    >
      <div className="flex flex-col gap-4 py-1">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100">
              ¿Estás seguro de que deseás salir?
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Tendrás que volver a ingresar tu usuario y contraseña para acceder al sistema.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-slate-800">
          <button
            type="button"
            onClick={cancelarLogout}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-colors cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sí, Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

