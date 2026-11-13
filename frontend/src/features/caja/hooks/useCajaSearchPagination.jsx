/** @format */

import { useState, useEffect, useCallback, useMemo } from "react";
import { manejarErrorApi } from "@/shared/utils/errorHandler";
import cajaApi from "../services/caja.api";

export function useCajaSearchPagination(endpoint, opciones = {}) {
  const {
    limitInicial = 8,
    ordenPorDefecto = "fecha",
    direccionPorDefecto = "DESC",
    filtrosIniciales = {},
  } = opciones;

  const [datosCrudos, setDatosCrudos] = useState({
    cobros: [],
    gastos: [],
    turnos: [],
    resumen: null,
  });
  const [cargando, setCargando] = useState(false);

  const [paginaActual, setPaginaActual] = useState(1);
  const [busqueda, setBusqueda] = useState("");
  const [busquedaDebounced, setBusquedaDebounced] = useState("");
  const [filtros, setFiltros] = useState(filtrosIniciales);

  const [ordenarPor, setOrdenarPor] = useState(ordenPorDefecto);
  const [direccion, setDireccion] = useState(direccionPorDefecto);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBusquedaDebounced(busqueda);
      setPaginaActual(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [busqueda]);

  const fetchCaja = useCallback(async () => {
    setCargando(true);
    try {
      const params = {};
      if (filtros.fechaInicio) params.fechaInicio = filtros.fechaInicio;
      if (filtros.fechaFin) params.fechaFin = filtros.fechaFin;
      if (filtros.medio_pago) params.medio_pago = filtros.medio_pago;

      const respuesta = await cajaApi.listar(params);
      const data = respuesta.data.data || respuesta.data || {};

      setDatosCrudos({
        cobros: data.cobros || [],
        gastos: data.gastos || [],
        turnos: data.turnos || [],
        resumen: data.resumen || null,
      });
    } catch (error) {
      console.error("Error cargando datos de Caja:", error);
      manejarErrorApi(error, "No se pudieron cargar los movimientos de caja.");
    } finally {
      setCargando(false);
    }
  }, [filtros]);

  useEffect(() => {
    fetchCaja();
  }, [fetchCaja]);

  const manejarOrden = useCallback((columna) => {
    setOrdenarPor((prevColumna) => {
      if (prevColumna === columna) {
        setDireccion((prevDir) => (prevDir === "ASC" ? "DESC" : "ASC"));
        return prevColumna;
      }
      setDireccion("ASC");
      return columna;
    });
    setPaginaActual(1);
  }, []);

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
      setPaginaActual,
      limitInicial,
      busqueda,
      setBusqueda,
       busquedaDebounced,
      ordenarPor,
      direccion,
      manejarOrden,
    }),
    [
      paginaActual,
      limitInicial,
      busqueda,
      busquedaDebounced,
      ordenarPor,
      direccion,
      manejarOrden,
    ],
  );

  return {
    datosCrudos,
    cargando,
    recargar: fetchCaja,
    propsPaginacion,
    filtros,
    actualizarFiltro,
    limpiarFiltros,
  };
}
