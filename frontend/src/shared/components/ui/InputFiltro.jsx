/** @format */

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
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
  const [coords, setCoords] = useState(null);
  const contenedorRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!valorInicial) {
      setSeleccionado(null);
      setBusqueda("");
      return;
    }

    if (datos.length > 0) {
      const vStr = String(valorInicial);
      const encontrado = datos.find(
        (d) =>
          String(d.id_paciente) === vStr ||
          String(d.id_practica) === vStr ||
          String(d.id_obra_social) === vStr ||
          String(d.id_categoria) === vStr ||
          String(d.id_categoria_gasto) === vStr ||
          String(d.id_turno) === vStr ||
          String(d.id) === vStr,
      );
      if (encontrado) {
        setSeleccionado(encontrado);
        setBusqueda(formatoVisual(encontrado));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valorInicial, datos]);

  const calcularCoords = useCallback(() => {
    if (!contenedorRef.current) return null;
    const rect = contenedorRef.current.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) return null;

    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      return null;
    }

    const viewportHeight = window.innerHeight;
    const espacioAbajo = viewportHeight - rect.bottom;
    const espacioArriba = rect.top;
    const maxH = 240;
    const abrirHaciaArriba = espacioAbajo < 180 && espacioArriba > espacioAbajo;

    const maxHeight = Math.max(
      80,
      Math.min(maxH, abrirHaciaArriba ? espacioArriba - 16 : espacioAbajo - 16),
    );

    const top = abrirHaciaArriba
      ? rect.top - maxHeight - 4
      : rect.bottom + 4;

    return {
      top,
      left: rect.left,
      width: rect.width,
      maxHeight,
      abrirHaciaArriba,
    };
  }, []);

  const abrirMenu = () => {
    if (deshabilitado) return;
    const c = calcularCoords();
    if (c) setCoords(c);
    setAbierto(true);
  };

  useEffect(() => {
    if (!abierto) return;

    const actualizarPosicion = () => {
      const c = calcularCoords();
      if (!c) {
        setAbierto(false);
      } else {
        setCoords(c);
      }
    };

    actualizarPosicion();

    window.addEventListener("scroll", actualizarPosicion, true);
    window.addEventListener("resize", actualizarPosicion);

    return () => {
      window.removeEventListener("scroll", actualizarPosicion, true);
      window.removeEventListener("resize", actualizarPosicion);
    };
  }, [abierto, calcularCoords]);

  useEffect(() => {
    if (!abierto) return;

    const manejarClickAfuera = (evento) => {
      if (
        contenedorRef.current &&
        !contenedorRef.current.contains(evento.target) &&
        menuRef.current &&
        !menuRef.current.contains(evento.target)
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
  }, [abierto, seleccionado, formatoVisual]);

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
    abrirMenu();
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
            abrirMenu();
            if (seleccionado) setSeleccionado(null);
          }}
          onFocus={abrirMenu}
          placeholder={placeholder}
          className={`w-full pl-9.5 pr-9 py-2.5 border border-gray-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-slate-300/80 dark:focus:ring-slate-600/60 focus:border-slate-400 dark:focus:border-slate-500 transition-all shadow-2xs ${
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

      {abierto && !deshabilitado && coords && createPortal(
        <ul
          ref={menuRef}
          style={{
            position: "fixed",
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            maxHeight: `${coords.maxHeight}px`,
            zIndex: 99999,
          }}
          className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-2xl shadow-slate-900/25 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800 animate-in fade-in duration-100"
        >
          {resultados.length > 0 ? (
            resultados.map((item, index) => (
              <li
                key={index}
                onMouseDown={(e) => {
                  e.preventDefault();
                  elegirOpcion(item);
                }}
                className="px-3.5 py-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
              >
                {formatoVisual(item)}
              </li>
            ))
          ) : (
            <li className="px-3.5 py-3 text-xs text-slate-400 dark:text-slate-500 italic text-center">
              No se encontraron coincidencias
            </li>
          )}
        </ul>,
        document.body,
      )}
    </div>
  );
}

export default InputFiltro;

