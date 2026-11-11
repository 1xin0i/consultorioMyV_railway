/** @format */
import React from "react";
import { CUADRANTES, DIENTES_INFO } from "../../constants/odontogramaConstants";

export function ToothSelector({ selectedTeeth = [], onToggleTooth }) {
  const isSelected = (fdi) => selectedTeeth.includes(Number(fdi));

  const renderTooth = (fdi) => {
    const selected = isSelected(fdi);
    const info = DIENTES_INFO[fdi];

    return (
      <button
        key={fdi}
        type="button"
        onClick={() => onToggleTooth(Number(fdi))}
        title={`${fdi}: ${info?.nombre || "Pieza " + fdi}`}
        className={`group relative w-8 sm:w-10 h-12 sm:h-14 rounded-xl text-xs font-bold flex flex-col items-center justify-between py-1.5 transition-all duration-150 cursor-pointer border select-none ${
          selected
            ? "bg-[#2eb086] text-white border-[#259370] shadow-md shadow-emerald-500/20 scale-[1.03]"
            : "bg-white text-slate-700 border-slate-200 hover:border-[#2eb086]/60 hover:bg-emerald-50/40 hover:shadow-xs"
        }`}
      >
        <span
          className={`text-[11px] sm:text-xs font-extrabold ${
            selected ? "text-white" : "text-slate-800"
          }`}
        >
          {fdi}
        </span>

        {/* Círculo indicador / Cara oclusal representativa */}
        <div
          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border transition-colors flex items-center justify-center ${
            selected
              ? "border-white/90 bg-emerald-600 shadow-inner"
              : "border-slate-300 bg-slate-100 group-hover:border-[#2eb086]/50 group-hover:bg-emerald-100/50"
          }`}
        >
          {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
        </div>

        <span
          className={`text-[8px] sm:text-[9px] font-medium uppercase tracking-tighter truncate max-w-[32px] sm:max-w-[36px] ${
            selected ? "text-white/80" : "text-slate-400 group-hover:text-emerald-700"
          }`}
        >
          {info?.tipo ? info.tipo.slice(0, 3) : ""}
        </span>
      </button>
    );
  };

  const renderQuadrantRow = (teeth, label) => (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        {label}
      </span>
      <div className="flex gap-1 sm:gap-1.5 justify-center flex-wrap">
        {teeth.map((fdi) => renderTooth(fdi))}
      </div>
    </div>
  );

  return (
    <div className="p-3 sm:p-4 bg-slate-50/80 rounded-2xl border border-slate-200/90 shadow-inner space-y-3">
      {/* Indicador superior */}
      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 px-1">
        <span>Derecha del Paciente</span>
        <span className="bg-slate-200/80 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider text-slate-600">
          Arcada Superior
        </span>
        <span>Izquierda del Paciente</span>
      </div>

      {/* Arcada Superior: Q1 (18 al 11) | Q2 (21 al 28) */}
      <div className="flex justify-center items-start gap-2 sm:gap-4 overflow-x-auto pb-1">
        <div className="flex-1 flex justify-end">
          {renderQuadrantRow(CUADRANTES.q1, "Cuadrante 1 (Sup. Der.)")}
        </div>
        {/* Línea media divisoria */}
        <div className="w-0.5 self-stretch bg-slate-300 my-1 rounded-full shrink-0" />
        <div className="flex-1 flex justify-start">
          {renderQuadrantRow(CUADRANTES.q2, "Cuadrante 2 (Sup. Izq.)")}
        </div>
      </div>

      {/* Línea Oclusal divisoria (Cruz central) */}
      <div className="relative flex items-center justify-center my-2">
        <div className="h-0.5 bg-slate-300 w-full rounded-full" />
        <span className="absolute bg-slate-100 px-3 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-slate-400 border border-slate-200 rounded-full shadow-2xs">
          Línea de Oclusión
        </span>
      </div>

      {/* Arcada Inferior: Q4 (48 al 41) | Q3 (31 al 38) */}
      <div className="flex justify-center items-start gap-2 sm:gap-4 overflow-x-auto pt-1">
        <div className="flex-1 flex justify-end">
          {renderQuadrantRow(CUADRANTES.q4, "Cuadrante 4 (Inf. Der.)")}
        </div>
        {/* Línea media divisoria */}
        <div className="w-0.5 self-stretch bg-slate-300 my-1 rounded-full shrink-0" />
        <div className="flex-1 flex justify-start">
          {renderQuadrantRow(CUADRANTES.q3, "Cuadrante 3 (Inf. Izq.)")}
        </div>
      </div>

      {/* Indicador inferior */}
      <div className="flex items-center justify-center text-[11px] font-bold text-slate-500 pt-1">
        <span className="bg-slate-200/80 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider text-slate-600">
          Arcada Inferior
        </span>
      </div>
    </div>
  );
}

export default ToothSelector;

