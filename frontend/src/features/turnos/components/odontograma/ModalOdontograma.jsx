/** @format */
import React, { useState, useEffect } from "react";
import Modal from "../../../../components/common/Modal";
import { ToothSelector } from "./ToothSelector";
import {
  CUADRANTES,
  TODOS_LOS_DIENTES,
  ARCADA_SUPERIOR,
  ARCADA_INFERIOR,
  DIENTES_INFO,
  formatearResumenDientes,
} from "../../constants/odontogramaConstants";
import { Search, Sparkles, Trash2, Check, RotateCcw } from "lucide-react";

export function ModalOdontograma({
  isOpen,
  onClose,
  tituloPractica = "Tratamiento Odontológico",
  initialTeeth = [],
  onConfirm,
}) {
  const [selectedTeeth, setSelectedTeeth] = useState([]);
  const [textoBusqueda, setTextoBusqueda] = useState("");

  // Sincronizar estado inicial al abrir
  useEffect(() => {
    if (isOpen) {
      const normalizados = [
        ...new Set(
          (initialTeeth || []).map((t) =>
            typeof t === "object" ? Number(t.numero_fdi) : Number(t)
          )
        ),
      ].filter((n) => !isNaN(n) && n in DIENTES_INFO);
      setSelectedTeeth(normalizados);
      setTextoBusqueda(normalizados.sort((a, b) => a - b).join(", "));
    }
  }, [isOpen, initialTeeth]);

  const toggleTooth = (fdi) => {
    setSelectedTeeth((prev) => {
      const existe = prev.includes(fdi);
      const nuevo = existe ? prev.filter((t) => t !== fdi) : [...prev, fdi];
      setTextoBusqueda(nuevo.sort((a, b) => a - b).join(", "));
      return nuevo;
    });
  };

  // Manejo de input de texto rápido
  const handleTextoChange = (e) => {
    const val = e.target.value;
    setTextoBusqueda(val);

    // Parsear números del texto (separados por comas, espacios, etc)
    const tokens = val.split(/[^\d]+/).filter(Boolean).map(Number);
    const validos = tokens.filter((num) => num in DIENTES_INFO);
    const unicos = [...new Set(validos)];

    setSelectedTeeth(unicos);
  };

  // Acciones masivas
  const seleccionarTodaLaBoca = () => {
    setSelectedTeeth([...TODOS_LOS_DIENTES]);
    setTextoBusqueda(TODOS_LOS_DIENTES.sort((a, b) => a - b).join(", "));
  };

  const seleccionarArcadaSuperior = () => {
    setSelectedTeeth([...ARCADA_SUPERIOR]);
    setTextoBusqueda(ARCADA_SUPERIOR.sort((a, b) => a - b).join(", "));
  };

  const seleccionarArcadaInferior = () => {
    setSelectedTeeth([...ARCADA_INFERIOR]);
    setTextoBusqueda(ARCADA_INFERIOR.sort((a, b) => a - b).join(", "));
  };

  const seleccionarCuadrante = (cuadranteKey) => {
    const dientes = CUADRANTES[cuadranteKey] || [];
    setSelectedTeeth([...dientes]);
    setTextoBusqueda(dientes.sort((a, b) => a - b).join(", "));
  };

  const limpiarSeleccion = () => {
    setSelectedTeeth([]);
    setTextoBusqueda("");
  };

  const handleGuardar = () => {
    if (typeof onConfirm === "function") {
      onConfirm(selectedTeeth.sort((a, b) => a - b));
    }
    if (typeof onClose === "function") {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      width="max-w-4xl"
      title={`Seleccionar Piezas Dentales: ${tituloPractica}`}
    >
      <div className="flex flex-col gap-4">
        {/* Buscador / Input de texto rápido */}
        <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center gap-2.5">
          <div className="flex items-center gap-2 text-slate-500 font-semibold text-xs shrink-0">
            <Search size={16} className="text-[#2eb086]" />
            <span>Selección rápida por número FDI:</span>
          </div>
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={textoBusqueda}
              onChange={handleTextoChange}
              placeholder="Ej: 16, 26, 46 (tipeá los números separados por coma o espacio)..."
              className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086] transition-colors"
            />
            {textoBusqueda && (
              <button
                type="button"
                onClick={limpiarSeleccion}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 transition-colors p-1"
                title="Limpiar"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Botones de selección masiva */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Atajos:
          </span>
          <button
            type="button"
            onClick={seleccionarTodaLaBoca}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            Toda la boca (32)
          </button>
          <button
            type="button"
            onClick={seleccionarArcadaSuperior}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Arcada Superior (18-28)
          </button>
          <button
            type="button"
            onClick={seleccionarArcadaInferior}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Arcada Inferior (48-38)
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

          <button
            type="button"
            onClick={() => seleccionarCuadrante("q1")}
            className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cuadrante 1
          </button>
          <button
            type="button"
            onClick={() => seleccionarCuadrante("q2")}
            className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cuadrante 2
          </button>
          <button
            type="button"
            onClick={() => seleccionarCuadrante("q3")}
            className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cuadrante 3
          </button>
          <button
            type="button"
            onClick={() => seleccionarCuadrante("q4")}
            className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cuadrante 4
          </button>

          <button
            type="button"
            onClick={limpiarSeleccion}
            className="ml-auto px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer flex items-center gap-1"
          >
            <Trash2 size={12} />
            <span>Limpiar</span>
          </button>
        </div>

        {/* Odontograma 2D Interactivo */}
        <ToothSelector
          selectedTeeth={selectedTeeth}
          onToggleTooth={toggleTooth}
        />

        {/* Resumen de piezas seleccionadas */}
        <div className="bg-emerald-50/70 border border-emerald-200/80 p-3 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-emerald-900">Seleccionadas:</span>
            <span className="font-semibold text-emerald-700 bg-white px-2.5 py-0.5 rounded-lg border border-emerald-200 shadow-2xs">
              {formatearResumenDientes(selectedTeeth)}
            </span>
          </div>
          <span className="text-emerald-800 font-bold">
            {selectedTeeth.length} {selectedTeeth.length === 1 ? "pieza" : "piezas"}
          </span>
        </div>

        {/* Acciones del Modal */}
        <div className="border-t border-gray-100 pt-3 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGuardar}
            className="px-5 py-2 rounded-xl text-white bg-[#2eb086] hover:bg-[#259370] font-semibold text-xs sm:text-sm transition-all shadow-sm hover:shadow flex items-center gap-1.5 cursor-pointer"
          >
            <Check size={16} />
            <span>Confirmar Piezas</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ModalOdontograma;

