/** @format */

import Modal from "@/shared/components/ui/Modal";
import { Stethoscope, ShieldCheck } from "lucide-react";

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
  guardarPractica,
}) {
  return (
    <Modal
      isOpen={modalAbierto}
      onClose={cerrarModal}
      onSubmit={guardarPractica}
      width="max-w-xl"
      title={editando ? "Editar Práctica" : "Registrar Nueva Práctica"}
    >
      <div className="flex flex-col gap-4">
        <div className="bg-gradient-to-br from-teal-50/70 to-emerald-50/40 border border-teal-200/80 rounded-2xl p-3.5 flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-[#0d8266] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Stethoscope size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-extrabold text-teal-950">
              Catálogo de Prestaciones Odontológicas
            </span>
            <span className="text-[11px] text-teal-800/80">
              Definí el código oficial, denominación clínica y arancel de
              referencia.
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div>
            <label className={LABEL_CLASS}>Código de Nomenclador *</label>
            <input
              type="text"
              name="codigo_nomenclador"
              required
              placeholder="Ej. 01.01"
              value={datosFormulario?.codigo_nomenclador || ""}
              onChange={actualizarDatos}
              className={`${INPUT_CLASS} font-mono font-bold`}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Especialidad *</label>
            <input
              type="text"
              name="especialidad"
              required
              placeholder="Ej. Operatoria, Endodoncia, Cirugía..."
              value={datosFormulario?.especialidad || ""}
              onChange={actualizarDatos}
              className={INPUT_CLASS}
            />
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className={LABEL_CLASS}>Nombre en Nomenclador *</label>
            <input
              type="text"
              name="nombre_nomenclador"
              required
              placeholder="Ej. Consulta de diagnóstico y fichado"
              value={datosFormulario?.nombre_nomenclador || ""}
              onChange={actualizarDatos}
              className={INPUT_CLASS}
            />
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className={LABEL_CLASS}>
              Nombre de Referencia (Uso Interno) *
            </label>
            <input
              type="text"
              name="nombre_referencia"
              required
              placeholder="Ej. Consulta inicial"
              value={datosFormulario?.nombre_referencia || ""}
              onChange={actualizarDatos}
              className={INPUT_CLASS}
            />
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className={LABEL_CLASS}>Precio de Referencia ($) *</label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-[#0d8266] font-extrabold text-sm">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                name="precio_referencia"
                required
                placeholder="0.00"
                value={datosFormulario?.precio_referencia || ""}
                onChange={actualizarDatos}
                className="w-full pl-8 pr-4 py-2.5 border border-teal-200 bg-teal-50/40 rounded-xl text-base font-extrabold text-teal-950 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all shadow-2xs"
              />
            </div>
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="flex items-center justify-between gap-3 p-3.5 bg-teal-50/50 border border-teal-200/70 rounded-xl cursor-pointer hover:bg-teal-50/80 transition-colors">
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={18} className="text-[#0d8266] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900">
                    Práctica Activa
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Visible al registrar atenciones odontológicas.
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
        </div>
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
          {editando ? "Guardar Cambios" : "Registrar Práctica"}
        </button>
      </div>
    </Modal>
  );
}
