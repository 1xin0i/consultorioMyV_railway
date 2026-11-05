/** @format */
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const InputFiltro = ({
  datos = [],
  camposFiltrado = [],
  formatoVisual,
  alSeleccionar,
  placeholder,
  valorInicial = "",
  className = "",
  disabled = false,
}) => {
  const resolverTexto = (val, lista) => {
    if (val === undefined || val === null || val === "") return "";
    if (typeof val === "object") {
      return formatoVisual ? formatoVisual(val) : val[camposFiltrado[0]] || "";
    }
    if (!lista || lista.length === 0) return "";
    const itemEncontrado = lista.find((d) => {
      const idItem = d.id_paciente || d.id_obra_social || d.id_practica || d.id;
      return String(idItem) === String(val);
    });
    if (itemEncontrado) {
      return formatoVisual
        ? formatoVisual(itemEncontrado)
        : itemEncontrado[camposFiltrado[0]] || "";
    }
    return "";
  };

  const [busqueda, setBusqueda] = useState(() => resolverTexto(valorInicial, datos));
  const [mostrarLista, setMostrarLista] = useState(false);
  const [posicion, setPosicion] = useState({ top: 0, left: 0, width: 0 });

  const inputRef = useRef(null);
  const portalRef = useRef(null);

  // Sincronización continua de valorInicial y datos
  useEffect(() => {
    const textoResuelto = resolverTexto(valorInicial, datos);
    if (textoResuelto) {
      setBusqueda(textoResuelto);
    } else if (!valorInicial) {
      setBusqueda("");
    }
  }, [valorInicial, datos]);

  // Actualizar coordenadas para el Portal flotante
  const actualizarPosicion = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setPosicion({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  // Manejar redimensionamiento y scroll cuando el dropdown está abierto
  useEffect(() => {
    if (mostrarLista) {
      actualizarPosicion();
      const handleScrollResize = () => actualizarPosicion();
      window.addEventListener("resize", handleScrollResize);
      window.addEventListener("scroll", handleScrollResize, true);
      return () => {
        window.removeEventListener("resize", handleScrollResize);
        window.removeEventListener("scroll", handleScrollResize, true);
      };
    }
  }, [mostrarLista]);

  // Cerrar al hacer clic o touch fuera del input o de la lista
  useEffect(() => {
    if (!mostrarLista) return;
    const handleClickAfuera = (e) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target) &&
        portalRef.current &&
        !portalRef.current.contains(e.target)
      ) {
        setMostrarLista(false);
      }
    };
    document.addEventListener("mousedown", handleClickAfuera);
    document.addEventListener("touchstart", handleClickAfuera, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClickAfuera);
      document.removeEventListener("touchstart", handleClickAfuera);
    };
  }, [mostrarLista]);

  const obtenerValor = (objeto, ruta) => {
    return ruta
      .split(".")
      .reduce((obj, key) => (obj && obj[key] !== undefined ? obj[key] : undefined), objeto);
  };

  const resultados = (datos || []).filter((item) => {
    if (!busqueda) return true;

    const textoItem = formatoVisual ? formatoVisual(item) : item[camposFiltrado[0]];
    if (busqueda === textoItem) return true;

    if (!camposFiltrado || camposFiltrado.length === 0) return true;

    return camposFiltrado.some((campo) => {
      const valor = obtenerValor(item, campo);
      return valor ? valor?.toString().toLowerCase().includes(busqueda.toLowerCase()) : false;
    });
  });

  const manejarClickOpcion = (item) => {
    const textoSeleccionado = formatoVisual ? formatoVisual(item) : item[camposFiltrado[0]];
    setBusqueda(textoSeleccionado);
    setMostrarLista(false);
    if (alSeleccionar) {
      alSeleccionar(item);
    }
  };

  const limpiarSeleccion = (e) => {
    e.stopPropagation();
    setBusqueda("");
    setMostrarLista(false);
    if (alSeleccionar) {
      alSeleccionar(null);
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative w-full flex items-center">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={busqueda}
          disabled={disabled}
          onChange={(e) => {
            setBusqueda(e.target.value);
            setMostrarLista(true);
          }}
          onFocus={() => {
            if (!disabled) {
              actualizarPosicion();
              setMostrarLista(true);
            }
          }}
          className={`border-gray-200 rounded-xl bg-gray-50 w-full border p-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086] transition-all ${
            disabled ? "opacity-60 cursor-not-allowed bg-gray-100" : ""
          }`}
        />

        {busqueda && !disabled && (
          <button
            type="button"
            onClick={limpiarSeleccion}
            className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors cursor-pointer"
            title="Limpiar"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {mostrarLista &&
        !disabled &&
        createPortal(
          <ul
            ref={portalRef}
            style={{
              position: "absolute",
              top: `${posicion.top + 4}px`,
              left: `${posicion.left}px`,
              width: `${posicion.width}px`,
              zIndex: 99999,
            }}
            className="bg-white border border-gray-200 rounded-xl shadow-2xl max-h-56 overflow-y-auto animate-in fade-in-50 duration-150"
          >
            {resultados.length > 0 ? (
              resultados.map((item, index) => (
                <li
                  key={`${item.id || item.id_paciente || item.id_practica || index}-${index}`}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    manejarClickOpcion(item);
                  }}
                  className="p-2.5 hover:bg-emerald-50/70 hover:text-emerald-950 cursor-pointer text-xs font-medium border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  {formatoVisual ? formatoVisual(item) : item[camposFiltrado[0]]}
                </li>
              ))
            ) : (
              <li className="p-3 text-gray-400 italic text-xs text-center">
                No se encontraron coincidencias
              </li>
            )}
          </ul>,
          document.body,
        )}
    </div>
  );
};

export default InputFiltro;
