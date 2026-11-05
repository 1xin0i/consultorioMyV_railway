/** @format */
import { useState, useEffect, useRef, useCallback } from "react";
import api from "../../../services/api";

export function useCajaSearchPagination(limitPorDefecto = 9) {
  // * DEFINICIÓN DE ESTADOS GENERALES
  const [cargando, setCargando] = useState(false);
  const [search, setSearchState] = useState("");

  //* PERÍODO (MES Y AÑO / MODO ANUAL)
  const fechaHoy = new Date();
  const [mes, setMesState] = useState(fechaHoy.getMonth() + 1);
  const [anio, setAnioState] = useState(fechaHoy.getFullYear());
  const [modoAnual, setModoAnualState] = useState(false);

  //* DATOS COBRO
  const [cobros, setCobros] = useState([]);
  const [pageCobro, setPageCobro] = useState(1);
  const [totalCobro, setTotalCobro] = useState(0);
  const [totalPagesCobro, setTotalPagesCobro] = useState(1);

  //* DATOS GASTO
  const [gastos, setGastos] = useState([]);
  const [pageGasto, setPageGasto] = useState(1);
  const [totalGasto, setTotalGasto] = useState(0);
  const [totalPagesGasto, setTotalPagesGasto] = useState(1);

  //* DATOS PENDIENTES Y TOTALES
  const [turnosPendientes, setTurnosPendientes] = useState([]);
  const [cuotasPendientes, setCuotasPendientes] = useState([]);
  const [totalesBackend, setTotalesBackend] = useState(null);

  // Identifica la última petición lanzada: las respuestas anteriores se descartan
  const ultimaPeticion = useRef(0);

  // * BUSCAR DATOS UTILIZANDO LA RUTA UNIFICADA DE CAJA
  const fetchData = useCallback(async () => {
    const idPeticion = ++ultimaPeticion.current;
    setCargando(true);
    try {
      const params = {
        pageCobro,
        limitCobro: limitPorDefecto,
        pageGasto,
        limitGasto: limitPorDefecto,
        searchCobro: search,
        searchGasto: search,
      };

      if (modoAnual) {
        params.periodo = "anio";
        params.anio = anio;
      } else {
        params.mes = mes;
        params.anio = anio;
      }

      const respuesta = await api.get("/caja", { params });
      if (idPeticion !== ultimaPeticion.current) return;

      const { data, meta } = respuesta.data;

      // 1. Asignación de cobros y sus metadatos
      setCobros(data.cobros || []);
      setPageCobro(meta.cobros.page || pageCobro);
      setTotalPagesCobro(meta.cobros.totalPages || 1);
      setTotalCobro(meta.cobros.total || 0);

      // 2. Asignación de gastos y sus metadatos
      setGastos(data.gastos || []);
      setPageGasto(meta.gastos.page || pageGasto);
      setTotalPagesGasto(meta.gastos.totalPages || 1);
      setTotalGasto(meta.gastos.total || 0);

      // 3. Pendientes (turnos sin cobro y cuotas adeudadas hasta hoy)
      setTurnosPendientes(data.turnosPendientes || []);
      setCuotasPendientes(data.cuotasPendientes || []);

      // 4. Totales globales del período calculados en el backend
      if (data.totales) {
        setTotalesBackend(data.totales);
      }
    } catch (error) {
      console.error("Error al cargar los datos consolidados de caja:", error);
    } finally {
      if (idPeticion === ultimaPeticion.current) setCargando(false);
    }
  }, [pageCobro, limitPorDefecto, pageGasto, search, mes, anio, modoAnual]);

  // * RECARGAR DATOS CUANDO CAMBIA DE PÁGINA, BÚSQUEDA O PERÍODO
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // * NAVEGACIÓN DE PERÍODOS
  const mesAnterior = () => {
    setModoAnualState(false);
    setPageCobro(1);
    setPageGasto(1);
    if (mes === 1) {
      setMesState(12);
      setAnioState((a) => a - 1);
    } else {
      setMesState((m) => m - 1);
    }
  };

  const mesSiguiente = () => {
    setModoAnualState(false);
    setPageCobro(1);
    setPageGasto(1);
    if (mes === 12) {
      setMesState(1);
      setAnioState((a) => a + 1);
    } else {
      setMesState((m) => m + 1);
    }
  };

  const irAMesActual = () => {
    setModoAnualState(false);
    setPageCobro(1);
    setPageGasto(1);
    const now = new Date();
    setMesState(now.getMonth() + 1);
    setAnioState(now.getFullYear());
  };

  const cambiarMes = (nuevoMes) => {
    setModoAnualState(false);
    setPageCobro(1);
    setPageGasto(1);
    setMesState(Number(nuevoMes));
  };

  const cambiarAnio = (nuevoAnio) => {
    setPageCobro(1);
    setPageGasto(1);
    setAnioState(Number(nuevoAnio));
  };

  const setModoAnual = (valor) => {
    setPageCobro(1);
    setPageGasto(1);
    setModoAnualState(Boolean(valor));
  };

  const toggleModoAnual = () => {
    setPageCobro(1);
    setPageGasto(1);
    setModoAnualState((prev) => !prev);
  };

  // * SETEA LA BÚSQUEDA
  const setSearch = (nuevoTermino) => {
    setSearchState(nuevoTermino);
    setPageCobro(1);
    setPageGasto(1);
  };

  // * CÁLCULOS PARA LOS REGISTROS MOSTRADOS EN HEADER
  const inicioRegistroCobro = totalCobro === 0 ? 0 : (pageCobro - 1) * limitPorDefecto + 1;
  const finRegistroCobro =
    totalCobro === 0 ? 0 : pageCobro === totalPagesCobro ? totalCobro : pageCobro * limitPorDefecto;

  const inicioRegistroGasto = totalGasto === 0 ? 0 : (pageGasto - 1) * limitPorDefecto + 1;
  const finRegistroGasto =
    totalGasto === 0 ? 0 : pageGasto === totalPagesGasto ? totalGasto : pageGasto * limitPorDefecto;

  return {
    cobros,
    gastos,
    turnosPendientes,
    cuotasPendientes,
    totalesBackend,
    cargando,

    mes,
    anio,
    modoAnual,
    periodoTodos: modoAnual,
    mesAnterior,
    mesSiguiente,
    irAMesActual,
    cambiarMes,
    cambiarAnio,
    setModoAnual,
    toggleModoAnual,
    setPeriodoTodos: setModoAnual,

    pageCobro,
    setPageCobro,
    totalCobro,
    totalPagesCobro,
    pageGasto,
    setPageGasto,
    totalGasto,
    totalPagesGasto,

    search,
    setSearch,

    inicioRegistroCobro,
    finRegistroCobro,
    inicioRegistroGasto,
    finRegistroGasto,
    recargar: fetchData,
  };
}
