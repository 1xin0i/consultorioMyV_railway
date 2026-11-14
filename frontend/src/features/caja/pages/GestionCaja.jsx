/** @format */

import { useState, useMemo } from "react";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";

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
import { Kpis } from "../components/Kpis";
import {
  VistaTodos,
  VistaIngresos,
  VistaGastos,
  VistaPendientes,
} from "../components/Vistas";
import { CajaToolbar, MenuFlotanteCajaMobile } from "../components/CajaToolbar";

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

  const hoy = useMemo(() => new Date(), []);
  const mesActual = hoy.getMonth() + 1;
  const anioActual = hoy.getFullYear();
  const ultimoDiaMes = new Date(anioActual, mesActual, 0).getDate();
  const fechaInicioDefault = `${anioActual}-${String(mesActual).padStart(2, "0")}-01`;
  const fechaFinDefault = `${anioActual}-${String(mesActual).padStart(2, "0")}-${String(ultimoDiaMes).padStart(2, "0")}`;

  const {
    datosCrudos,
    cargando,
    recargar,
    propsPaginacion,
    filtros,
    actualizarFiltro,
    actualizarFiltros,
    limpiarFiltros,
  } = useCajaSearchPagination("/caja", {
    ordenPorDefecto: "fecha",
    direccionPorDefecto: "DESC",
    filtrosIniciales: {
      mes: mesActual,
      anio: anioActual,
      modoAnual: false,
      periodo: "mes",
      fechaInicio: fechaInicioDefault,
      fechaFin: fechaFinDefault,
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

  const totalPendienteCobro = useMemo(() => {
    if (datosCrudos?.totales?.totalPendienteCobro !== undefined) {
      return Number(datosCrudos.totales.totalPendienteCobro) || 0;
    }
    if (datosCrudos?.resumen?.totalPendienteCobro !== undefined) {
      return Number(datosCrudos.resumen.totalPendienteCobro) || 0;
    }
    return turnosConSaldoPendiente.reduce((acc, t) => {
      const sc = t.SolicitudCobro;
      if (sc && Number(sc.saldo_pendiente) > 0)
        return acc + Number(sc.saldo_pendiente);
      return acc + (Number(t.precio_final) || 0);
    }, 0);
  }, [datosCrudos?.totales, datosCrudos?.resumen, turnosConSaldoPendiente]);

  const abrirModalPagoNuevo = (turnoEspecifico = null) => {
    setTurnoParaCobrar(turnoEspecifico);
    setModalPagoAbierto(true);
  };

  return (
    <PageLayout
      icono={<Wallet size={24} />}
      titulo="Ingresos y Egresos"
      subtitulo="Registro de los cobros de turnos, otros ingresos y gastos del consultorio, con totales por período."
      accionesHeader={
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => abrirModalPagoNuevo(null)}
            className="flex-1 sm:flex-initial bg-[#0d8266] hover:bg-[#09664f] text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm font-bold text-xs sm:text-sm cursor-pointer active:scale-95"
          >
            <TrendingUp size={17} />
            <span>Nuevo Ingreso</span>
          </button>

          <button
            onClick={() => abrirCrearGasto()}
            className="flex-1 sm:flex-initial bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm font-bold text-xs sm:text-sm cursor-pointer active:scale-95"
          >
            <TrendingDown size={17} />
            <span>Nuevo Egreso</span>
          </button>
        </div>
      }
    >
      <Kpis
        totalIngresos={totalIngresos}
        totalEgresos={totalEgresos}
        totalPendienteCobro={totalPendienteCobro}
        balanceNeto={balanceNeto}
        resumen={datosCrudos?.resumen || datosCrudos?.totales}
        totales={datosCrudos?.totales}
        totalCobrosCount={datosCrudos?.cobros?.length || 0}
        totalGastosCount={datosCrudos?.gastos?.length || 0}
        totalPorCobrarCount={turnosConSaldoPendiente.length}
        onClickPorCobrar={() => {
          setVistaActiva("pendientes");
          irAPagina(1);
        }}
      />

      <CajaToolbar
        busqueda={propsPaginacion.busqueda}
        setBusqueda={propsPaginacion.setBusqueda}
        vistaActiva={vistaActiva}
        setVistaActiva={setVistaActiva}
        turnosConSaldoCount={turnosConSaldoPendiente.length}
        filtros={filtros}
        actualizarFiltro={actualizarFiltro}
        actualizarFiltros={actualizarFiltros}
        limpiarFiltros={limpiarFiltros}
        irAPagina={irAPagina}
      />

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200/90 dark:border-slate-800 overflow-hidden flex flex-col">
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
