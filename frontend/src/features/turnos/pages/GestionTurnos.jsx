/** @format */

import { useState, useMemo } from "react";
import { ListTodo, CalendarPlus } from "lucide-react";

import Tabla from "@/shared/components/ui/Tabla/Tabla";
import TablaPaginacion from "@/shared/components/ui/Tabla/TablaPaginacion";
import PageLayout from "@/shared/components/layout/PageLayout";
import { usePaginationSearch } from "@/shared/hooks/usePaginationSearch";
import { useCRUDModal } from "@/shared/hooks/useCRUDModal";

import { ModalTurnoForm } from "../components/modales/ModalTurnoForm";
import { ModalAtenderTurno } from "../components/modales/ModalAtenderTurno";
import { ModalCancelarTurno } from "../components/modales/ModalCancelarTurno";
import { ModalReprogramarTurno } from "../components/modales/ModalReprogramarTurno";
import { ModalEliminarTurno } from "../components/modales/ModalEliminarTurno";
import { VistaTurno } from "../components/modales/VistaTurno";
import { TurnosToolbar } from "../components/TurnosToolbar";
import {
  renderTarjetaTurno,
  renderFilaTurno,
} from "../components/FilaTurnoTabla";

import { ESTADO_INICIAL_TURNO } from "../constants/turnosConstants";
import { formatearTurnoParaReprogramar } from "../utils/formatTurnoParaReprogramar";
import { useTurnoDependencies } from "../hooks/useTurnoDependencies";
import { useTurnoActions } from "../hooks/useTurnoActions";
import { ModalRegistrarPago } from "@/features/cobros";

const COLUMNAS_TURNOS = [
  { etiqueta: "Paciente", campo: "paciente", ordenable: true },
  { etiqueta: "Práctica", campo: null, ordenable: false },
  { etiqueta: "Fecha y Hora", campo: "fecha_hora_inicio", ordenable: true },
  { etiqueta: "Estado", campo: "id_estado", ordenable: true, centrado: true },
  { etiqueta: "Honorarios", campo: "precio_final", ordenable: true },
  { etiqueta: "Notas", campo: null, ordenable: false, centrado: true },
  { etiqueta: "Acciones", campo: null, ordenable: false, centrado: true },
];

export function GestionTurnos() {
  const [soloSinPagar, setSoloSinPagar] = useState(false);
  const [modalPagoAbierto, setModalPagoAbierto] = useState(false);
  const [turnoParaCobrar, setTurnoParaCobrar] = useState(null);

  const {
    datos: turnosCrudos,
    cargando,
    recargar,
    propsPaginacion,
    filtros,
    actualizarFiltro,
    limpiarFiltros,
  } = usePaginationSearch("/turnos", {
    limitInicial: 10,
    ordenPorDefecto: "fecha_hora_inicio",
    direccionPorDefecto: "DESC",
    filtrosIniciales: {
      estadoFiltrado: "",
      id_estado: "",
      mes: "",
    },
  });

  const turnosFiltrados = useMemo(() => {
    if (!soloSinPagar) return turnosCrudos;
    return turnosCrudos.filter((t) => {
      const esAtendido =
        Number(t.id_estado) === 2 || t.EstadoTurno?.estado === "Atendido";
      if (!esAtendido) return false;
      const sc = t.SolicitudCobro || t.Cobro;
      if (sc) return Number(sc.saldo_pendiente) > 0;
      return Number(t.precio_final || 0) > 0;
    });
  }, [turnosCrudos, soloSinPagar]);

  const { pacientes, setPacientes, practicasLista } = useTurnoDependencies();

  const {
    modalCrearEditar,
    modalEliminar,
    modalVer,
    modalAtender,
    modalCancelar,
    modalInasistente,
    modalReprogramar,
    editando,
    itemSeleccionado: turnoSeleccionado,
    datosFormulario,
    abrirParaCrear,
    abrirParaEditar,
    abrirParaEliminar,
    abrirParaVer,
    abrirParaAtender,
    abrirParaCancelar,
    abrirParaInasistente,
    abrirParaReprogramar,
    cerrarModal,
    actualizarDatos,
  } = useCRUDModal(ESTADO_INICIAL_TURNO);

  const {
    guardarTurno,
    procesarAtencionTurno,
    procesarCancelacionTurno,
    procesarReprogramacionTurno,
    ejecutarEliminacion,
  } = useTurnoActions(recargar, cerrarModal);

  const abrirModalPagoTurno = (turno) => {
    cerrarModal();
    setTurnoParaCobrar(turno);
    setModalPagoAbierto(true);
  };

  const sharedRowProps = {
    recargar,
    abrirParaVer,
    abrirParaAtender,
    abrirParaReprogramar,
    abrirParaCancelar,
    abrirParaInasistente,
    abrirParaEditar,
    abrirParaEliminar,
    abrirModalPagoTurno,
    formatearTurnoParaReprogramar,
  };

  return (
    <PageLayout
      icono={<ListTodo size={24} />}
      titulo="Gestión de Turnos"
      badge={`${propsPaginacion.totalRegistros} Registrados`}
      subtitulo="Consultá, filtrá y gestioná todos los turnos, estados de atención y saldos pendientes."
      onNuevo={() => abrirParaCrear()}
      accionesHeader={
        <button
          onClick={() => abrirParaCrear()}
          className="w-full sm:w-auto bg-[#0d8266] hover:bg-[#09664f] text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm font-bold text-xs sm:text-sm cursor-pointer active:scale-95"
        >
          <CalendarPlus size={18} />
          <span>Agendar Turno</span>
        </button>
      }
    >
      <div className="flex flex-col gap-2.5 sm:gap-3">
        {/* Barra de filtros y búsqueda */}
        <TurnosToolbar
          busqueda={propsPaginacion.busqueda}
          setBusqueda={propsPaginacion.setBusqueda}
          filtros={filtros}
          actualizarFiltro={actualizarFiltro}
          limpiarFiltros={limpiarFiltros}
          soloSinPagar={soloSinPagar}
          setSoloSinPagar={setSoloSinPagar}
          irAPagina={propsPaginacion.irAPagina}
          totalRegistros={propsPaginacion.totalRegistros}
        />

        {/* Card exclusivo de la tabla */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200/90 dark:border-slate-800 overflow-hidden flex flex-col">
          <Tabla
            columnas={COLUMNAS_TURNOS}
            datos={turnosFiltrados}
            cargando={cargando}
            compacto
            ordenarPor={propsPaginacion.ordenarPor}
            direccion={propsPaginacion.direccion}
            manejarOrden={propsPaginacion.manejarOrden}
            mensajeVacio="No se encontraron turnos con los filtros seleccionados."
            renderTarjeta={(turno) =>
              renderTarjetaTurno({ turno, ...sharedRowProps })
            }
            renderFila={(turno) =>
              renderFilaTurno({ turno, ...sharedRowProps })
            }
          />

          <TablaPaginacion {...propsPaginacion} />
        </div>
      </div>

      {/* Modales de Gestión de Turnos */}
      <ModalTurnoForm
        modalAbierto={modalCrearEditar}
        cerrarModal={cerrarModal}
        editando={editando}
        pacientes={pacientes}
        setPacientes={setPacientes}
        practicasLista={practicasLista}
        datosFormulario={datosFormulario}
        actualizarDatos={actualizarDatos}
        guardarTurno={(e) => {
          e.preventDefault();
          guardarTurno(datosFormulario, editando, turnoSeleccionado);
        }}
      />

      <ModalAtenderTurno
        isOpen={modalAtender}
        onClose={cerrarModal}
        turno={turnoSeleccionado}
        practicasLista={practicasLista}
        onConfirm={(datosAtencion, turnoTarget) =>
          procesarAtencionTurno(datosAtencion, turnoTarget, cerrarModal)
        }
      />

      <ModalCancelarTurno
        isOpen={modalCancelar || modalInasistente}
        onClose={cerrarModal}
        turno={turnoSeleccionado}
        inasistente={modalInasistente}
        onConfirm={({ notas_consulta, inasistente, turno }) =>
          procesarCancelacionTurno(
            inasistente,
            turno,
            { notas_consulta },
            cerrarModal,
          )
        }
      />

      <ModalReprogramarTurno
        isOpen={modalReprogramar}
        onClose={cerrarModal}
        turno={turnoSeleccionado}
        datosReprogramacion={datosFormulario}
        onConfirm={(datosReprog, turnoTarget) =>
          procesarReprogramacionTurno(datosReprog, turnoTarget, cerrarModal)
        }
      />

      <ModalEliminarTurno
        modalEliminar={modalEliminar}
        cerrarModal={cerrarModal}
        turnoSeleccionado={turnoSeleccionado}
        ejecutarEliminacion={() => ejecutarEliminacion(turnoSeleccionado)}
      />

      <VistaTurno
        isOpen={modalVer}
        onClose={cerrarModal}
        turno={turnoSeleccionado}
        abrirParaReprogramar={(t) =>
          abrirParaReprogramar(t, formatearTurnoParaReprogramar)
        }
        abrirParaAtender={abrirParaAtender}
        abrirParaCancelar={abrirParaCancelar}
        abrirParaInasistente={abrirParaInasistente}
        abrirParaCobrar={abrirModalPagoTurno}
      />

      <ModalRegistrarPago
        isOpen={modalPagoAbierto}
        onClose={() => {
          setModalPagoAbierto(false);
          setTurnoParaCobrar(null);
        }}
        turnoPreseleccionado={turnoParaCobrar}
        onPagoExitoso={recargar}
      />
    </PageLayout>
  );
}

export default GestionTurnos;
