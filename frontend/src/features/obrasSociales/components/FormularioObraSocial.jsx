/** @format */

import Modal from "@/shared/components/ui/Modal";
import { Building2, ShieldCheck } from "lucide-react";

const LABEL_CLASS =
  "block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1";
const INPUT_CLASS =
  "w-full border border-teal-100 bg-slate-50/60 p-2.5 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all shadow-2xs";

export function FormularioCrearEditar({
  modalAbierto,
  cerrarModal,
  editando,
  datosFormulario,
  actualizarDatos,
  guardarObraSocial,
}) {
  return (
    <Modal
      isOpen={modalAbierto}
      onClose={cerrarModal}
      onSubmit={guardarObraSocial}
      width="max-w-lg"
      title={editando ? "Editar Obra Social" : "Registrar Nueva Obra Social"}
    >
      <div className="flex flex-col gap-4">
        <div className="bg-gradient-to-br from-teal-50/70 to-emerald-50/40 border border-teal-200/80 rounded-2xl p-3.5 flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-[#0d8266] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Building2 size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-extrabold text-teal-950">
              Cobertura Médica / Mutual
            </span>
            <span className="text-[11px] text-teal-800/80">
              Ingresá la denominación oficial de la obra social o prepaga.
            </span>
          </div>
        </div>

        <div>
          <label className={LABEL_CLASS}>
            Nombre de la Obra Social / Mutual *
          </label>
          <input
            type="text"
            name="nombre"
            required
            placeholder="Ej. APROSS, OSDE, PAMI, Swiss Medical..."
            value={datosFormulario?.nombre || ""}
            onChange={actualizarDatos}
            className={INPUT_CLASS}
          />
        </div>

        <label className="flex items-center justify-between gap-3 p-3.5 bg-teal-50/50 border border-teal-200/70 rounded-xl cursor-pointer hover:bg-teal-50/80 transition-colors">
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={18} className="text-[#0d8266] shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-900">
                Obra Social Activa
              </span>
              <span className="text-[11px] text-slate-500">
                Habilitada para asignarse a pacientes y prácticas clínicas.
              </span>
            </div>
          </div>
          <input
            type="checkbox"
            name="activo"
            checked={
              datosFormulario?.activo !== undefined
                ? datosFormulario.activo
                : true
            }
            onChange={(e) =>
              actualizarDatos({
                target: { name: "activo", value: e.target.checked },
              })
            }
            className="w-4.5 h-4.5 text-[#0d8266] rounded border-teal-300 focus:ring-teal-500 cursor-pointer accent-[#0d8266]"
          />
        </label>
      </div>

      <div className="border-t border-teal-100 my-4" />

      <div className="flex justify-end items-center gap-2.5">
        <button
          type="button"
          onClick={cerrarModal}
          className="px-4 py-2.5 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200/80 font-bold text-xs transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl text-white bg-[#0d8266] hover:bg-[#09664f] font-bold text-xs transition-all shadow-sm shadow-teal-900/20 cursor-pointer"
        >
          {editando ? "Guardar Cambios" : "Registrar Obra Social"}
        </button>
      </div>
    </Modal>
  );
}
