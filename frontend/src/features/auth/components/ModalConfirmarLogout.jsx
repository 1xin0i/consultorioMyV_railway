/** @format */

import { LogOut } from "lucide-react";
import { Modal } from "@/shared/components/ui/Modal";

export function ModalConfirmarLogout({ isOpen, onClose, onConfirm }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cerrar sesión"
      width="max-w-sm"
    >
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/70 text-xs text-slate-700">
        <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-600 flex items-center justify-center shrink-0">
          <LogOut size={18} />
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-slate-800 text-sm">
            ¿Querés cerrar tu sesión actual?
          </p>
          <p className="leading-relaxed text-slate-600">
            Tendrás que volver a ingresar tu correo y contraseña para acceder al
            sistema del consultorio.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 mt-1">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-600/25 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <LogOut size={14} />
          <span>Sí, cerrar sesión</span>
        </button>
      </div>
    </Modal>
  );
}

export default ModalConfirmarLogout;

