/** @format */
import { useState, useEffect, useRef, useCallback } from "react";
import api from "../services/api";
import { manejarErrorApi } from "../utils/errorHandler";

export function usePaginationSearch(
  endpoint,
  limitPorDefecto = 9,
  extraParamsPorDefecto = {}
) {
  // * DEFINICION DE ESTADOS GENERALES
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimitState] = useState(limitPorDefecto);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearchState] = useState("");
  const [order, setOrder] = useState({ column: "", direction: "ASC" });
  const [extraParams, setExtraParamsState] = useState(extraParamsPorDefecto);

  // Identifica la última petición lanzada: las respuestas anteriores se descartan
  const ultimaPeticion = useRef(0);

  // * BUSCAR DATOS PARA LA TABLA Y PAGINACION
  const fetchData = useCallback(
    async (parametrosExtra = {}) => {
      const idPeticion = ++ultimaPeticion.current;
      setCargando(true);
      try {
        const respuesta = await api.get(endpoint, {
          params: {
            page,
            search,
            limit,
            sortField: order.column || undefined,
            sortOrder: order.direction,
            ...extraParams,
            ...parametrosExtra,
          },
        });
        if (idPeticion !== ultimaPeticion.current) return;

        setDatos(respuesta.data.data || []);
        setPage(respuesta.data.meta?.page || page);
        setTotalPages(respuesta.data.meta?.totalPages || 1);
        setTotal(respuesta.data.meta?.total || 0);
      } catch (error) {
        if (idPeticion !== ultimaPeticion.current) return;
        console.error(`Error al cargar datos de ${endpoint}:`, error);
        manejarErrorApi(error, `Error al cargar los datos de ${endpoint}`);
      } finally {
        if (idPeticion === ultimaPeticion.current) setCargando(false);
      }
    },
    [endpoint, page, search, limit, order, extraParams]
  );

  // * RECARGAR DATOS CUANDO CAMBIA PAGINA, BUSQUEDA U ORDEN
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // * SETEA LA BUSQUEDA
  const setSearch = (nuevoTermino) => {
    setSearchState(nuevoTermino);
    setPage(1);
  };

  // * SETEA FILTROS EXTRAS
  const setExtraParams = (nuevosParams) => {
    setExtraParamsState((prev) => {
      const actualizados =
        typeof nuevosParams === "function" ? nuevosParams(prev) : nuevosParams;
      return { ...actualizados };
    });
    setPage(1);
  };

  // * CAMBIA FILAS POR PAGINA
  const setLimit = (nuevoLimit) => {
    setLimitState(nuevoLimit);
    setPage(1);
  };

  // * CALCULA LOS NUMEROS QUE SE MUESTRAN EN EL FOOTER
  const inicioRegistro = total === 0 ? 0 : (page - 1) * limit + 1;
  const finRegistro = total === 0 ? 0 : Math.min(page * limit, total);

  return {
    datos,
    cargando,
    page,
    setPage,
    limit,
    setLimit,
    total,
    totalPages,
    search,
    setSearch,
    order,
    setOrder,
    extraParams,
    setExtraParams,
    inicioRegistro,
    finRegistro,
    recargar: fetchData,
  };
}
