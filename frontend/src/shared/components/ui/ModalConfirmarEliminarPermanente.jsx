/** @format */

import Modal from "./Modal";
import { AlertTriangle, Trash2 } from "lucide-react";

export function ModalConfirmarEliminarPermanente({
  isOpen,
  onClose,
  onConfirm,
  titulo = "¿Eliminar permanentemente?",
  subtitulo,
  nombreRegistro,
  tipoRegistro = "este registro",
  cargando = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      width="max-w-md"
      title="Eliminar Definitivamente"
      variant="danger"
    >
      <div className="bg-gradient-to-br from-rose-50/80 to-rose-100/30 border border-rose-200/90 rounded-2xl p-4 flex items-start gap-3.5 shadow-2xs">
        <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0 shadow-2xs">
          <AlertTriangle size={20} />
        </div>
        <div className="flex flex-col gap-1.5 min-w-0">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {titulo}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {subtitulo || (
              <>
                Esta acción es{" "}
                <strong className="text-rose-700 dark:text-rose-400 font-extrabold">
                  irreversible
                </strong>
                . Se borrará definitivamente{" "}
                {nombreRegistro ? (
                  <strong className="text-slate-900 dark:text-slate-100">
                    "{nombreRegistro}"
                  </strong>
                ) : (
                  tipoRegistro
                )}{" "}
                de la base de datos.
              </>
            )}
          </p>
        </div>
      </div>

      <div className="border-t border-rose-100 dark:border-rose-950/40 my-4" />

      <div className="flex justify-end items-center gap-2.5">
        <button
          type="button"
          onClick={onClose}
          disabled={cargando}
          className="px-4 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={cargando}
          className="inline-flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl text-white bg-rose-600 hover:bg-rose-700 font-bold text-xs transition-all shadow-sm shadow-rose-500/30 cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <Trash2 size={15} />
          <span>{cargando ? "Eliminando..." : "Sí, Eliminar Definitivamente"}</span>
        </button>
      </div>
    </Modal>
  );
}

export default ModalConfirmarEliminarPermanente;

