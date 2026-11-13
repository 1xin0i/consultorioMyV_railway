/** @format */

import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";

export function InputFiltro({
  datos = [],
  camposFiltrado = ["nombre"],
  formatoVisual = (item) => item.nombre,
  alSeleccionar,
  placeholder = "Buscar...",
  valorInicial = null,
  deshabilitado = false,
}) {
  const [busqueda, setBusqueda] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);
  const contenedorRef = useRef(null);

  useEffect(() => {
    if (!valorInicial) {
      setSeleccionado(null);
      setBusqueda("");
      return;
    }

    if (datos.length > 0) {
      const encontrado = datos.find(
        (d) =>
          d.id_paciente === valorInicial ||
          d.id_practica === valorInicial ||
          d.id_obra_social === valorInicial ||
          d.id_categoria === valorInicial ||
          d.id_turno === valorInicial ||
          d.id === valorInicial,
      );
      if (encontrado) {
        setSeleccionado(encontrado);
        setBusqueda(formatoVisual(encontrado));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valorInicial, datos]);

  useEffect(() => {
    const manejarClickAfuera = (evento) => {
      if (
        contenedorRef.current &&
        !contenedorRef.current.contains(evento.target)
      ) {
        setAbierto(false);
        if (seleccionado) {
          setBusqueda(formatoVisual(seleccionado));
        } else {
          setBusqueda("");
        }
      }
    };
    document.addEventListener("mousedown", manejarClickAfuera);
    return () => document.removeEventListener("mousedown", manejarClickAfuera);
  }, [seleccionado, formatoVisual]);

  const resultados = datos.filter((item) => {
    if (!busqueda) return true;
    const termino = busqueda.toLowerCase();

    return camposFiltrado.some((campo) => {
      const valorDirecto = item[campo];
      const valorObraSocial = item.ObraSocial?.[campo];
      const valorPaciente = item.Paciente?.[campo];

      return (
        (valorDirecto &&
          valorDirecto.toString().toLowerCase().includes(termino)) ||
        (valorObraSocial &&
          valorObraSocial.toString().toLowerCase().includes(termino)) ||
        (valorPaciente &&
          valorPaciente.toString().toLowerCase().includes(termino))
      );
    });
  });

  const elegirOpcion = (item) => {
    setSeleccionado(item);
    setBusqueda(formatoVisual(item));
    setAbierto(false);
    alSeleccionar(item);
  };

  const limpiarSeleccion = () => {
    setSeleccionado(null);
    setBusqueda("");
    alSeleccionar(null);
    setAbierto(true);
  };

  return (
    <div className="relative w-full" ref={contenedorRef}>
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 text-slate-400 dark:text-slate-500" size={16} />
        <input
          type="text"
          value={busqueda}
          disabled={deshabilitado}
          onChange={(e) => {
            setBusqueda(e.target.value);
            setAbierto(true);
            if (seleccionado) setSeleccionado(null);
          }}
          onFocus={() => setAbierto(true)}
          placeholder={placeholder}
          className={`w-full pl-9.5 pr-9 py-2.5 border border-teal-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all shadow-2xs ${
            deshabilitado ? "bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed opacity-70" : ""
          }`}
        />
        {(busqueda || seleccionado) && !deshabilitado && (
          <button
            type="button"
            onClick={limpiarSeleccion}
            className="absolute right-2.5 text-slate-400 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {abierto && !deshabilitado && (
        <ul className="absolute z-50 w-full mt-1.5 bg-white dark:bg-slate-900 border border-teal-100 dark:border-slate-700 rounded-xl shadow-xl shadow-teal-950/10 max-h-60 overflow-y-auto divide-y divide-teal-50/80 dark:divide-slate-800">
          {resultados.length > 0 ? (
            resultados.map((item, index) => (
              <li
                key={index}
                onClick={() => elegirOpcion(item)}
                className="px-3.5 py-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium hover:bg-teal-50/80 dark:hover:bg-teal-950/60 hover:text-teal-900 dark:hover:text-teal-300 cursor-pointer transition-colors"
              >
                {formatoVisual(item)}
              </li>
            ))
          ) : (
            <li className="px-3.5 py-3 text-xs text-slate-400 dark:text-slate-500 italic text-center">
              No se encontraron coincidencias
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

export default InputFiltro;

