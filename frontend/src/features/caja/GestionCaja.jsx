/** @format */
//* useState y useMemo
import { useState, useMemo, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";

// * ICONOS
import {
  Plus,
  Search,
  ArrowDownRight,
  ChevronDown,
  Banknote,
  Receipt,
} from "lucide-react";

//* COMPONENTES COMUNES
import Header from "../../components/common/Header";
import PageLayout from "../../components/layout/PageLayout";
import TablaPaginacion from "../../components/common/Tabla/TablaPaginacion";

//* COMPONENTES DE VISTA
import {
  VistaCronologica,
  VistaDetalleIngresos,
  VistaLibroMayor,
  VistaPendientes,
} from "./components/Vistas";
import { SelectorPeriodoCaja } from "./components/SelectorPeriodoCaja";
import { Kpis } from "./components/Kpis";

//* HOOKS
import { useMovimientosCaja } from "./hooks/useMovimientosCaja";

//* HOOKS Y FORMULARIOS GASTOS
import { useCRUDModal } from "../../hooks/useCRUDModal";
import { useCategoriasGastosCatalogo } from "../gastos/hooks/useCategoriasGastosCatalogo";
import { useGastoActions } from "../gastos/hooks/useGastoActions";
import { FormularioCrearEditar as FormularioGasto } from "../gastos/components/FormulariosGasto";

//* HOOKS Y FORMULARIOS COBROS
import { FormularioCrearEditarCobro as FormularioCobro } from "../cobros/components/FormulariosCobro";
import ModalRegistrarPago from "../cobros/components/ModalRegistrarPago";
import { useCobroActions } from "../cobros/hooks/useCobroActions";
import { useCajaSearchPagination } from "./hooks/useCajaSearchPagination";

//* CONSTANTES
import {
  ESTADO_INICIAL_COBRO,
  ESTADO_INICIAL_GASTO,
} from "./constants/cajaConstants";

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export default function GestionCaja() {
  //* VARIABLES GENERALES
  const [vistaActiva, setVistaActiva] = useState("cronologico"); // 'cronologico' | 'ingresos' | 'mayor' | 'pendientes'
  const [filtroMetodo, setFiltroMetodo] = useState("todos");
  const [categoriaAbierta, setCategoriaAbierta] = useState(null);
  const [metodoIngresoAbierto, setMetodoIngresoAbierto] = useState(null);
  const [menuFlotanteAbierto, setMenuFlotanteAbierto] = useState(false);
  const [itemParaCobrar, setItemParaCobrar] = useState(null);

  const location = useLocation();

  //* HOOK DE PAGINACIÓN Y FILTRADO POR PERÍODO
  const {
    cobros,
    gastos,
    turnosPendientes,
    cuotasPendientes,
    totalesBackend,

    mes,
    anio,
    modoAnual,
    mesAnterior,
    mesSiguiente,
    irAMesActual,
    cambiarMes,
    cambiarAnio,
    setModoAnual,
    toggleModoAnual,

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

    recargar,
  } = useCajaSearchPagination();

  //* HOOK DE CRUD MODAL GASTO
  const {
    modalAbierto: modalGastoAbierto,
    datosFormulario: datosGasto,
    abrirParaCrear: abrirParaCrearGasto,
    cerrarModal: cerrarModalGasto,
    actualizarDatos: actualizarDatosGasto,
  } = useCRUDModal(ESTADO_INICIAL_GASTO);

  //* HOOK DE CRUD MODAL COBRO
  const {
    modalAbierto: modalCobroAbierto,
    datosFormulario: datosCobro,
    abrirParaCrear: abrirParaCrearCobro,
    cerrarModal: cerrarModalCobro,
    actualizarDatos: actualizarDatosCobro,
  } = useCRUDModal(ESTADO_INICIAL_COBRO);

  //* HOOK DE CATEGORIAS PARA GASTOS
  const { categorias, recargarCategorias } = useCategoriasGastosCatalogo();

  //* HOOK DE CALCULOS
  const { kpis, movimientosUnificados } = useMovimientosCaja(
    cobros,
    gastos,
    turnosPendientes,
    search,
    cuotasPendientes,
    totalesBackend,
  );

  //* HOOK DE PETICIONES API
  const { guardarGasto } = useGastoActions(recargar, () => cerrarModalGasto());
  const { guardarCobro, cargandoAccion: cargandoCobro } = useCobroActions(
    recargar,
    () => cerrarModalCobro(),
  );

  //* FILTRADOS POR MÉTODO DE PAGO
  const movimientosFiltrados = useMemo(() => {
    if (filtroMetodo === "todos") return movimientosUnificados;
    return (movimientosUnificados || []).filter((m) =>
      (m.metodo_pago || "").toLowerCase().includes(filtroMetodo.toLowerCase())
    );
  }, [movimientosUnificados, filtroMetodo]);

  const cobrosFiltrados = useMemo(() => {
    if (filtroMetodo === "todos") return cobros;
    return (cobros || []).filter((c) => {
      const cuotas = c.Cuotas || c.Cuota || [];
      if (cuotas.length > 0) {
        return cuotas.some((q) =>
          (q.metodo_pago || "Efectivo")
            .toLowerCase()
            .includes(filtroMetodo.toLowerCase())
        );
      }
      return (c.modalidad || "")
        .toLowerCase()
        .includes(filtroMetodo.toLowerCase());
    });
  }, [cobros, filtroMetodo]);

  const gastosFiltrados = useMemo(() => {
    if (filtroMetodo === "todos") return gastos;
    return (gastos || []).filter((g) =>
      (g.metodo_pago || "").toLowerCase().includes(filtroMetodo.toLowerCase())
    );
  }, [gastos, filtroMetodo]);

  //* EXPORTAR A CSV
  const exportarCSV = () => {
    if (!movimientosUnificados || movimientosUnificados.length === 0) {
      toast.error("No hay movimientos para exportar en este período.");
      return;
    }
    const encabezados = [
      "Tipo",
      "Concepto",
      "Fecha",
      "Metodo de Pago",
      "Comprobante",
      "Importe",
    ];
    const filas = movimientosUnificados.map((m) => [
      m.tipo,
      `"${(m.concepto || "").replace(/"/g, '""')}"`,
      `"${m.fecha ? new Date(m.fecha).toLocaleString("es-AR") : ""}"`,
      `"${m.metodo_pago || "Efectivo"}"`,
      `"${m.comprobante || ""}"`,
      m.monto,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [encabezados.join(","), ...filas.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `balance_${modoAnual ? anio : `${mes}_${anio}`}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Balance exportado a CSV correctamente");
  };

  //* ABRIR MODAL PARA COBRAR UN TURNO O ITEM PENDIENTE
  const abrirCobroParaTurno = useCallback((turno) => {
    setItemParaCobrar({
      id_turno: turno.id_turno,
      paciente: turno.Paciente,
      monto_total: Number(turno.precio_final) || 0,
      ya_cobrado: 0,
      saldo_pendiente: Number(turno.precio_final) || 0,
      tipo: "turno",
      raw: turno,
    });
  }, []);

  useEffect(() => {
    if (location.state?.turnoParaCobrar) {
      abrirCobroParaTurno(location.state.turnoParaCobrar);
    }
  }, [location.state, abrirCobroParaTurno]);

  //* MAPEA LOS INGRESOS POR METODO DE PAGO
  const ingresosPorMetodo = useMemo(() => {
    const mapa = {};
    (cobros || []).forEach((c) => {
      const cuotas = c.Cuotas || c.Cuota || [];
      const pacienteNombre = c.Paciente
        ? `${c.Paciente.apellido}, ${c.Paciente.nombre}`
        : "Paciente";

      if (cuotas.length > 0) {
        cuotas.forEach((q) => {
          const cobradoCuota = Number(q.monto_cobrado) || 0;
          if (cobradoCuota > 0) {
            const metodo = q.metodo_pago || "Efectivo";
            if (!mapa[metodo]) {
              mapa[metodo] = { nombre: metodo, total: 0, items: [] };
            }
            mapa[metodo].total += cobradoCuota;
            mapa[metodo].items.push({
              id: `cuota-${q.id_cuota}`,
              id_cobro: c.id_cobro,
              nro_cuota: q.nro_cuota,
              cant_cuotas: c.cant_cuotas,
              concepto: `Cobro a ${pacienteNombre}${
                c.cant_cuotas > 1 ? ` (Cuota #${q.nro_cuota}/${c.cant_cuotas})` : ""
              }`,
              paciente: pacienteNombre,
              dni: c.Paciente?.dni,
              fecha: q.fecha_cobro || c.fecha_emision || c.createdAt,
              metodo_pago: metodo,
              monto: cobradoCuota,
              monto_total_cobro: Number(c.monto_a_cobrar) || 0,
              comprobante: `Cobro #${c.id_cobro}`,
            });
          }
        });
      }
    });
    return Object.values(mapa);
  }, [cobros]);

  //* MAPEA LOS EGRESOS POR CATEGORIAS
  const egresosPorCategoria = useMemo(() => {
    const mapa = {};
    gastos.forEach((g) => {
      const catNombre = g.CategoriaGasto?.nombre || "Sin Categoría";
      if (!mapa[catNombre]) {
        mapa[catNombre] = { nombre: catNombre, total: 0, items: [] };
      }
      mapa[catNombre].total += Number(g.monto) || 0;
      mapa[catNombre].items.push(g);
    });
    return Object.values(mapa);
  }, [gastos]);

  const labelPeriodo = modoAnual ? `Año ${anio}` : `${MESES[mes - 1]} ${anio}`;

  const totalPendientesCount =
    (turnosPendientes?.length || 0) + (cuotasPendientes?.length || 0);

  return (
    <PageLayout>
      <div className="w-full flex-1 flex flex-col gap-5">
        {/* //* HEADER PRINCIPAL: Con selector integrado y acciones */}
        <Header
          titulo="Balance del Período"
          subtitulo="Control de ingresos, egresos de consultorio y deudas"
          alerta={
            <SelectorPeriodoCaja
              mes={mes}
              cambiarMes={cambiarMes}
              anio={anio}
              cambiarAnio={cambiarAnio}
              modoAnual={modoAnual}
              setModoAnual={setModoAnual}
              mesAnterior={mesAnterior}
              mesSiguiente={mesSiguiente}
            />
          }
          botonAccion={
            <div className="hidden sm:flex items-center gap-2">
              <button
                type="button"
                onClick={abrirParaCrearGasto}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/40 hover:bg-rose-100/60 text-rose-700 dark:text-rose-300 font-semibold text-xs transition-all shadow-2xs cursor-pointer"
              >
                <ArrowDownRight size={14} className="text-rose-500" />
                <span>Registrar Gasto</span>
              </button>
              <button
                type="button"
                onClick={abrirParaCrearCobro}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0d8266] hover:bg-[#0b6f57] text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
              >
                <Plus size={15} />
                <span>Registrar Cobro</span>
              </button>
            </div>
          }
        />

        <div className="w-full px-4 sm:px-6 flex flex-col gap-5">
          {/* //* KPIS (4 TARJETAS CON MÉTRICAS DEL PERÍODO) */}
          <Kpis
            kpis={kpis}
            periodoLabel={labelPeriodo}
            totalCobrosCount={cobros?.length || 0}
            totalGastosCount={gastos?.length || 0}
            totalPorCobrarCount={totalPendientesCount}
          />

          {/* //* CONTENEDOR PRINCIPAL: PESTAÑAS, BUSCADOR Y TABLA */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs p-4 sm:p-5 flex flex-col gap-4">
            {/* Barra de pestañas y herramientas como en la imagen */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Pestañas de Vista en Cápsula */}
              <div className="bg-[#f0f4f8] dark:bg-slate-800/90 p-1 rounded-2xl inline-flex items-center gap-1 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setVistaActiva("cronologico")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    vistaActiva === "cronologico"
                      ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Todos los Movimientos
                </button>

                <button
                  type="button"
                  onClick={() => setVistaActiva("ingresos")}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    vistaActiva === "ingresos"
                      ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Ingresos ({cobros?.length || 0})
                </button>

                <button
                  type="button"
                  onClick={() => setVistaActiva("mayor")}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    vistaActiva === "mayor"
                      ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Egresos ({gastos?.length || 0})
                </button>

                <button
                  type="button"
                  onClick={() => setVistaActiva("pendientes")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    vistaActiva === "pendientes"
                      ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <span>Por Cobrar</span>
                  {totalPendientesCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                      {totalPendientesCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Filtros: Métodos de Pago y Búsqueda */}
              <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                <div className="relative">
                  <select
                    value={filtroMetodo}
                    onChange={(e) => setFiltroMetodo(e.target.value)}
                    className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-xl pl-3.5 pr-8 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                  >
                    <option value="todos">Todos los métodos</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="tarjeta">Tarjeta / Posnet</option>
                  </select>
                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>

                <div className="relative min-w-[200px] sm:min-w-[240px]">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Buscar por paciente, concepto..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* VISTA ACTIVA */}
            {vistaActiva === "cronologico" && (
              <VistaCronologica movimientosUnificados={movimientosFiltrados} />
            )}

            {vistaActiva === "ingresos" && (
              <VistaDetalleIngresos
                cobros={cobrosFiltrados}
                ingresosPorMetodo={ingresosPorMetodo}
                metodoAbierto={metodoIngresoAbierto}
                setMetodoAbierto={setMetodoIngresoAbierto}
              />
            )}

            {vistaActiva === "mayor" && (
              <VistaLibroMayor
                gastos={gastosFiltrados}
                egresosPorCategoria={egresosPorCategoria}
                categoriaAbierta={categoriaAbierta}
                setCategoriaAbierta={setCategoriaAbierta}
              />
            )}

            {vistaActiva === "pendientes" && (
              <VistaPendientes
                turnosPendientes={turnosPendientes}
                cuotasPendientes={cuotasPendientes}
                onCobrarItem={(item) => setItemParaCobrar(item)}
                abrirCobroParaTurno={abrirCobroParaTurno}
              />
            )}

            {/* PAGINACIÓN INFERIOR */}
            <div className="pt-2">
              {vistaActiva === "mayor" ? (
                <TablaPaginacion
                  page={pageGasto}
                  setPage={setPageGasto}
                  totalPages={totalPagesGasto}
                  total={totalGasto}
                  inicioRegistro={inicioRegistroGasto}
                  finRegistro={finRegistroGasto}
                />
              ) : (
                <TablaPaginacion
                  page={pageCobro}
                  setPage={setPageCobro}
                  totalPages={totalPagesCobro}
                  total={totalCobro}
                  inicioRegistro={inicioRegistroCobro}
                  finRegistro={finRegistroCobro}
                />
              )}
            </div>
          </div>
        </div>

        {/* //* BOTÓN FLOTANTE (FAB) PARA TELÉFONO CON MENÚ DE COBRO / GASTO */}
        <div className="fixed sm:hidden right-4 bottom-20 z-40 flex flex-col items-end gap-2">
          {menuFlotanteAbierto && (
            <div
              className="fixed inset-0 bg-black/30 backdrop-blur-xs -z-10 animate-fade-in"
              onClick={() => setMenuFlotanteAbierto(false)}
            />
          )}

          {menuFlotanteAbierto && (
            <div className="flex flex-col items-end gap-2.5 mb-1 animate-in fade-in slide-in-from-bottom-3 duration-200">
              <button
                type="button"
                onClick={() => {
                  setMenuFlotanteAbierto(false);
                  abrirParaCrearCobro();
                }}
                className="flex items-center gap-2 bg-[#0d8266] text-white px-3.5 py-2 rounded-full shadow-lg text-xs font-bold transition-transform active:scale-95 cursor-pointer"
              >
                <span>Registrar Cobro</span>
                <span className="bg-white/20 p-1 rounded-full">
                  <Banknote size={15} />
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuFlotanteAbierto(false);
                  abrirParaCrearGasto();
                }}
                className="flex items-center gap-2 bg-rose-500 text-white px-3.5 py-2 rounded-full shadow-lg text-xs font-bold transition-transform active:scale-95 cursor-pointer"
              >
                <span>Registrar Gasto</span>
                <span className="bg-white/20 p-1 rounded-full">
                  <Receipt size={15} />
                </span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMenuFlotanteAbierto((prev) => !prev)}
            aria-label="Agregar cobro o gasto"
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xl text-white transition-all transform active:scale-95 cursor-pointer ${
              menuFlotanteAbierto
                ? "bg-gray-800 rotate-45"
                : "bg-[#0d8266] hover:bg-[#0b6f57]"
            }`}
          >
            <Plus size={24} />
          </button>
        </div>

        {/* //* MODAL RÁPIDO PARA COBRAR TURNO / SALDO PENDIENTE */}
        {itemParaCobrar && (
          <ModalRegistrarPago
            isOpen={Boolean(itemParaCobrar)}
            onClose={() => setItemParaCobrar(null)}
            item={itemParaCobrar}
            onSuccess={recargar}
          />
        )}

        {/* //* MODALES: CREAR GASTO */}
        {modalGastoAbierto && (
          <FormularioGasto
            modalAbierto={modalGastoAbierto}
            cerrarModal={cerrarModalGasto}
            datosFormulario={datosGasto}
            actualizarDatos={actualizarDatosGasto}
            categorias={categorias}
            recargarCategorias={recargarCategorias}
            guardarGasto={(e) => {
              e.preventDefault();
              guardarGasto(datosGasto, false, null);
            }}
          />
        )}

        {/* //* MODALES: CREAR COBRO */}
        {modalCobroAbierto && (
          <FormularioCobro
            modalAbierto={modalCobroAbierto}
            cerrarModal={cerrarModalCobro}
            datosFormulario={datosCobro}
            actualizarDatos={actualizarDatosCobro}
            turnosAtendidos={turnosPendientes}
            guardarCobro={(datos) => {
              guardarCobro(datos || datosCobro, false, null);
            }}
            cargando={cargandoCobro}
          />
        )}
      </div>
    </PageLayout>
  );
}
