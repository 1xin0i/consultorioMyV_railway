/** @format */

import { useState, useMemo } from "react";
import { Wallet, TrendingUp, TrendingDown, Download } from "lucide-react";

import TablaPaginacion from "@/shared/components/ui/Tabla/TablaPaginacion";
import PageLayout from "@/shared/components/layout/PageLayout";
import { useCRUDModal } from "@/shared/hooks/useCRUDModal";
import { manejarErrorApi } from "@/shared/utils/errorHandler";

import { useCajaSearchPagination } from "../hooks/useCajaSearchPagination";
import { useMovimientosCaja } from "../hooks/useMovimientosCaja";
import {
  COLUMNAS_CAJA,
  COLUMNAS_GASTOS,
  ESTADO_INICIAL_GASTO,
  ESTADO_INICIAL_COBRO,
} from "../constants/cajaConstants";
import { SelectorPeriodoCaja } from "../components/SelectorPeriodoCaja";
import { Kpis } from "../components/Kpis";
import {
  VistaTodos,
  VistaIngresos,
  VistaGastos,
  VistaPendientes,
} from "../components/Vistas";
import { CajaToolbar, MenuFlotanteCajaMobile } from "../components/CajaToolbar";
import { exportarCajaCsv } from "../utils/exportarCajaCsv";

import {
  FormularioCrearEditarGasto,
  FormularioEliminarGasto,
  useCategoriasGastosCatalogo,
  useGastoActions,
  formatearGastoParaEditar,
} from "@/features/gastos";

import {
  FormularioCrearEditarCobro,
  FormularioEliminarCobro,
  ModalRegistrarPago,
  useCobroActions,
} from "@/features/cobros";

import { VistaTurno, turnosApi } from "@/features/turnos";

export function GestionCaja() {
  const [vistaActiva, setVistaActiva] = useState("todos");
  const [turnoVerDetalle, setTurnoVerDetalle] = useState(null);
  const [modalPagoAbierto, setModalPagoAbierto] = useState(false);
  const [turnoParaCobrar, setTurnoParaCobrar] = useState(null);

  const {
    datosCrudos,
    cargando,
    recargar,
    propsPaginacion,
    filtros,
    actualizarFiltro,
    limpiarFiltros,
  } = useCajaSearchPagination("/caja", {
    ordenPorDefecto: "fecha",
    direccionPorDefecto: "DESC",
    filtrosIniciales: {
      fechaInicio: "",
      fechaFin: "",
      medio_pago: "",
    },
  });

  const {
    datosPaginados,
    movimientosCompletos,
    totalRegistros,
    totalPaginas,
    irAPagina,
    totalIngresos,
    totalEgresos,
    balanceNeto,
    formatearCobroParaEditar,
  } = useMovimientosCaja(datosCrudos, vistaActiva, propsPaginacion, filtros);

  const { categorias, setCategorias } = useCategoriasGastosCatalogo();

  const {
    modalCrearEditar: modalGasto,
    modalEliminar: modalEliminarGasto,
    editando: editandoGasto,
    itemSeleccionado: gastoSeleccionado,
    datosFormulario: datosGasto,
    abrirParaCrear: abrirCrearGasto,
    abrirParaEditar: abrirEditarGasto,
    abrirParaEliminar: abrirEliminarGasto,
    cerrarModal: cerrarModalGasto,
    actualizarDatos: actualizarDatosGasto,
  } = useCRUDModal(ESTADO_INICIAL_GASTO);

  const { guardarGasto, ejecutarEliminacion: eliminarGasto } = useGastoActions(
    recargar,
    cerrarModalGasto,
  );

  const {
    modalCrearEditar: modalCobro,
    modalEliminar: modalEliminarCobro,
    editando: editandoCobro,
    itemSeleccionado: cobroSeleccionado,
    datosFormulario: datosCobro,
    abrirParaEditar: abrirEditarCobro,
    abrirParaEliminar: abrirEliminarCobro,
    cerrarModal: cerrarModalCobro,
    actualizarDatos: actualizarDatosCobro,
  } = useCRUDModal(ESTADO_INICIAL_COBRO);

  const { guardarCobro, ejecutarEliminacionCobro } = useCobroActions(
    recargar,
    cerrarModalCobro,
  );

  const verDetalleTurno = async (idTurno) => {
    const idT = typeof idTurno === "object" ? idTurno?.id_turno : idTurno;
    if (!idT) return;

    const turnoEnCaja = (datosCrudos?.turnos || []).find(
      (t) => Number(t.id_turno) === Number(idT),
    );
    if (turnoEnCaja && turnoEnCaja.Paciente) {
      setTurnoVerDetalle(turnoEnCaja);
      return;
    }

    try {
      const res = await turnosApi.obtenerPorId(idT);
      setTurnoVerDetalle(res.data?.data || res.data);
    } catch (error) {
      manejarErrorApi(error, "No se pudo cargar el detalle del turno.");
    }
  };

  const turnosConSaldoPendiente = useMemo(() => {
    const lista = datosCrudos?.turnos || [];
    return lista.filter((t) => {
      const esAtendido =
        Number(t.id_estado) === 2 || t.EstadoTurno?.estado === "Atendido";
      if (!esAtendido) return false;
      const sc = t.SolicitudCobro;
      if (sc) return Number(sc.saldo_pendiente) > 0;
      return Number(t.precio_final || 0) > 0;
    });
  }, [datosCrudos?.turnos]);

  const abrirModalPagoNuevo = (turnoEspecifico = null) => {
    setTurnoParaCobrar(turnoEspecifico);
    setModalPagoAbierto(true);
  };

  const handleExportarCSV = () =>
    exportarCajaCsv({
      movimientosCompletos,
      totalIngresos,
      totalEgresos,
      balanceNeto,
      filtros,
    });

  return (
    <PageLayout
      icono={<Wallet size={24} />}
      titulo="Caja y Finanzas"
      subtitulo="Control de ingresos por turnos, cobros particulares, gastos operativos y balance del consultorio."
      accionesHeader={
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleExportarCSV}
            className="flex-1 sm:flex-initial bg-white hover:bg-teal-50 text-teal-900 border border-teal-200 px-3.5 py-2 rounded-xl flex items-center justify-center gap-2 transition-all shadow-2xs font-bold text-xs sm:text-sm cursor-pointer"
            title="Descargar reporte en Excel / CSV"
          >
            <Download size={16} className="text-[#0d8266]" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => abrirModalPagoNuevo(null)}
            className="hidden sm:flex bg-[#0d8266] hover:bg-[#09664f] text-white px-4 py-2 rounded-xl items-center justify-center gap-2 transition-all shadow-sm font-bold text-xs sm:text-sm cursor-pointer active:scale-95"
          >
            <TrendingUp size={17} />
            <span>Nuevo Ingreso</span>
          </button>

          <button
            onClick={() => abrirCrearGasto()}
            className="hidden sm:flex bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl items-center justify-center gap-2 transition-all shadow-sm font-bold text-xs sm:text-sm cursor-pointer active:scale-95"
          >
            <TrendingDown size={17} />
            <span>Nuevo Gasto</span>
          </button>
        </div>
      }
    >
      <SelectorPeriodoCaja
        filtros={filtros}
        actualizarFiltro={actualizarFiltro}
        limpiarFiltros={limpiarFiltros}
      />

      <Kpis
        totalIngresos={totalIngresos}
        totalEgresos={totalEgresos}
        balanceNeto={balanceNeto}
        resumen={datosCrudos?.resumen}
        onClickPorCobrar={() => {
          setVistaActiva("pendientes");
          irAPagina(1);
        }}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-teal-100 overflow-hidden flex flex-col">
        <CajaToolbar
          busqueda={propsPaginacion.busqueda}
          setBusqueda={propsPaginacion.setBusqueda}
          vistaActiva={vistaActiva}
          setVistaActiva={setVistaActiva}
          turnosConSaldoCount={turnosConSaldoPendiente.length}
          filtros={filtros}
          actualizarFiltro={actualizarFiltro}
          limpiarFiltros={limpiarFiltros}
          irAPagina={irAPagina}
        />

        {vistaActiva === "todos" && (
          <VistaTodos
            columnas={COLUMNAS_CAJA}
            datos={datosPaginados}
            cargando={cargando}
            propsPaginacion={propsPaginacion}
            abrirEditarCobro={abrirEditarCobro}
            abrirEliminarCobro={abrirEliminarCobro}
            formatearCobroParaEditar={formatearCobroParaEditar}
            abrirEditarGasto={abrirEditarGasto}
            abrirEliminarGasto={abrirEliminarGasto}
            formatearGastoParaEditar={formatearGastoParaEditar}
            verDetalleTurno={verDetalleTurno}
          />
        )}

        {vistaActiva === "ingresos" && (
          <VistaIngresos
            columnas={COLUMNAS_CAJA}
            datos={datosPaginados}
            cargando={cargando}
            propsPaginacion={propsPaginacion}
            abrirEditarCobro={abrirEditarCobro}
            abrirEliminarCobro={abrirEliminarCobro}
            formatearCobroParaEditar={formatearCobroParaEditar}
            verDetalleTurno={verDetalleTurno}
          />
        )}

        {vistaActiva === "gastos" && (
          <VistaGastos
            columnas={COLUMNAS_GASTOS}
            datos={datosPaginados}
            cargando={cargando}
            propsPaginacion={propsPaginacion}
            abrirParaEditar={abrirEditarGasto}
            abrirParaEliminar={abrirEliminarGasto}
            formatearGastoParaEditar={formatearGastoParaEditar}
          />
        )}

        {vistaActiva === "pendientes" && (
          <VistaPendientes
            datos={turnosConSaldoPendiente}
            cargando={cargando}
            abrirCobrarTurno={(turno) => abrirModalPagoNuevo(turno)}
            verDetalleTurno={verDetalleTurno}
          />
        )}

        {vistaActiva !== "pendientes" && (
          <TablaPaginacion
            paginaActual={propsPaginacion.paginaActual}
            totalPaginas={totalPaginas}
            totalRegistros={totalRegistros}
            irAPagina={irAPagina}
          />
        )}
      </div>

      <MenuFlotanteCajaMobile
        onNuevoIngreso={() => abrirModalPagoNuevo(null)}
        onNuevoGasto={() => abrirCrearGasto()}
      />

      <ModalRegistrarPago
        isOpen={modalPagoAbierto}
        onClose={() => {
          setModalPagoAbierto(false);
          setTurnoParaCobrar(null);
        }}
        turnoPreseleccionado={turnoParaCobrar}
        turnosAtendidos={datosCrudos?.turnos || []}
        onPagoExitoso={recargar}
      />

      <FormularioCrearEditarGasto
        modalAbierto={modalGasto}
        cerrarModal={cerrarModalGasto}
        editando={editandoGasto}
        categorias={categorias}
        setCategorias={setCategorias}
        datosFormulario={datosGasto}
        actualizarDatos={actualizarDatosGasto}
        guardarGasto={(e) => {
          e.preventDefault();
          guardarGasto(datosGasto, editandoGasto, gastoSeleccionado);
        }}
      />

      <FormularioEliminarGasto
        modalEliminar={modalEliminarGasto}
        cerrarModal={cerrarModalGasto}
        gastoSeleccionado={gastoSeleccionado}
        ejecutarEliminacion={() => eliminarGasto(gastoSeleccionado)}
      />

      <FormularioCrearEditarCobro
        modalAbierto={modalCobro}
        cerrarModal={cerrarModalCobro}
        editando={editandoCobro}
        turnosAtendidos={datosCrudos?.turnos || []}
        datosFormulario={datosCobro}
        actualizarDatos={actualizarDatosCobro}
        guardarCobro={(e) => {
          e.preventDefault();
          guardarCobro(datosCobro, editandoCobro, cobroSeleccionado);
        }}
      />

      <FormularioEliminarCobro
        modalEliminar={modalEliminarCobro}
        cerrarModal={cerrarModalCobro}
        cobroSeleccionado={cobroSeleccionado}
        ejecutarEliminacion={() => ejecutarEliminacionCobro(cobroSeleccionado)}
      />

      <VistaTurno
        isOpen={Boolean(turnoVerDetalle)}
        onClose={() => setTurnoVerDetalle(null)}
        turno={turnoVerDetalle}
        abrirParaCobrar={(turno) => {
          setTurnoVerDetalle(null);
          abrirModalPagoNuevo(turno);
        }}
      />
    </PageLayout>
  );
}

export default GestionCaja;

