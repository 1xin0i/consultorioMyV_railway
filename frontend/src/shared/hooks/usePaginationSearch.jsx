/** @format */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import httpClient from "@/shared/services/httpClient";
import toast from "react-hot-toast";
import { manejarErrorApi } from "@/shared/utils/errorHandler";

export function usePaginationSearch(endpoint, opciones = {}) {
  const {
    limitInicial = 8,
    ordenPorDefecto = "id",
    direccionPorDefecto = "DESC",
    filtrosIniciales = {},
  } = opciones;

  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(false);

  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);

  const [busqueda, setBusqueda] = useState("");
  const [busquedaDebounced, setBusquedaDebounced] = useState("");

  const [filtros, setFiltros] = useState(filtrosIniciales);

  const [ordenarPor, setOrdenarPor] = useState(ordenPorDefecto);
  const [direccion, setDireccion] = useState(direccionPorDefecto);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBusquedaDebounced(busqueda);
      setPaginaActual(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [busqueda]);

  const abortControllerRef = useRef(null);

  const fetchDatos = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setCargando(true);
    try {
      const params = {
        page: paginaActual,
        limit: limitInicial,
        search: busquedaDebounced,
        sortBy: ordenarPor,
        sortField: ordenarPor,
        order: direccion,
        sortOrder: direccion,
        ...filtros,
      };

      const respuesta = await httpClient.get(endpoint, {
        params,
        signal: controller.signal,
      });

      const pag = respuesta.data?.pagination || respuesta.data?.meta;
      if (respuesta.data && pag) {
        setDatos(respuesta.data.data);
        setTotalPaginas(pag.totalPages || 1);
        setTotalRegistros(pag.totalItems ?? pag.total ?? 0);
      } else {
        const arrayFallback = respuesta.data.data || respuesta.data || [];
        setDatos(arrayFallback);
        setTotalPaginas(1);
        setTotalRegistros(arrayFallback.length);
      }
    } catch (error) {
      if (error.name === "CanceledError" || error.code === "ERR_CANCELED") {
        return;
      }
      console.error(`Error cargando datos de ${endpoint}:`, error);
      manejarErrorApi(error, `Error cargando datos de ${endpoint}`);
      toast.error(`Error al cargar los datos.`);
    } finally {
      if (abortControllerRef.current === controller) {
        setCargando(false);
      }
    }
  }, [
    endpoint,
    paginaActual,
    limitInicial,
    busquedaDebounced,
    ordenarPor,
    direccion,
    filtros,
  ]);

  useEffect(() => {
    fetchDatos();
  }, [fetchDatos]);

  const irAPagina = useCallback(
    (nuevaPagina) => {
      if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
        setPaginaActual(nuevaPagina);
      }
    },
    [totalPaginas],
  );

  const manejarOrden = useCallback(
    (columna) => {
      setDireccion((prevDir) =>
        columna === ordenarPor ? (prevDir === "DESC" ? "ASC" : "DESC") : "DESC",
      );
      setOrdenarPor(columna);
      setPaginaActual(1);
    },
    [ordenarPor],
  );

  const actualizarFiltro = useCallback((nombreFiltro, valor) => {
    setFiltros((prev) => ({
      ...prev,
      [nombreFiltro]: valor,
    }));
    setPaginaActual(1);
  }, []);

  const limpiarFiltros = useCallback(() => {
    setFiltros(filtrosIniciales);
    setBusqueda("");
    setPaginaActual(1);
  }, [filtrosIniciales]);

  const propsPaginacion = useMemo(
    () => ({
      paginaActual,
      totalPaginas,
      totalRegistros,
      irAPagina,
      limitInicial,
      busqueda,
      setBusqueda,
      ordenarPor,
      direccion,
      manejarOrden,
    }),
    [
      paginaActual,
      totalPaginas,
      totalRegistros,
      irAPagina,
      limitInicial,
      busqueda,
      ordenarPor,
      direccion,
      manejarOrden,
    ],
  );

  return {
    datos,
    cargando,
    recargar: fetchDatos,
    propsPaginacion,
    filtros,
    actualizarFiltro,
    limpiarFiltros,
  };
}

