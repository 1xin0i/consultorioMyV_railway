/** @format */

import { useState } from "react";
import { CalendarDays, X } from "lucide-react";

import PageLayout from "@/shared/components/layout/PageLayout";
import { useCRUDModal } from "@/shared/hooks/useCRUDModal";

import { AgendaCalendario } from "../components/calendario/AgendaCalendario";
import { VistaTurno } from "../components/modales/VistaTurno";
import { ModalTurnoForm } from "../components/modales/ModalTurnoForm";
import { ModalAtenderTurno } from "../components/modales/ModalAtenderTurno";
import { ModalCancelarTurno } from "../components/modales/ModalCancelarTurno";
import { ModalReprogramarTurno } from "../components/modales/ModalReprogramarTurno";
import { ModalEliminarTurno } from "../components/modales/ModalEliminarTurno";

import { useTurnoSearchAgenda } from "../hooks/useTurnoSearchAgenda";
import { useTurnoActions } from "../hooks/useTurnoActions";
import { ESTADO_INICIAL_TURNO } from "../constants/turnosConstants";
import { formatearTurnoParaReprogramar } from "../utils/formatTurnoParaReprogramar";
import { ModalRegistrarPago } from "@/features/cobros";

export function AgendaDiaria() {
  const [turnoReprogramando, setTurnoReprogramando] = useState(null);
  const [modalPagoAbierto, setModalPagoAbierto] = useState(false);
  const [turnoParaCobrar, setTurnoParaCobrar] = useState(null);

  const {
    turnos,
    pacientes,
    setPacientes,
    practicasLista,
    recargar,
  } = useTurnoSearchAgenda("/turnos");

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
    manejarSeleccionFechaCalendario,
    procesarClickEnTurno,
  } = useTurnoActions(recargar, cerrarModal);

  const iniciarModoReprogramacionEnCalendario = (turno) => {
    cerrarModal();
    setTurnoReprogramando(turno);
  };

  const abrirModalPagoTurno = (turno) => {
    cerrarModal();
    setTurnoParaCobrar(turno);
    setModalPagoAbierto(true);
  };

  return (
    <PageLayout
      icono={<CalendarDays size={24} />}
      titulo="Agenda Clínica"
      subtitulo="Seleccioná o arrastrá bloques horarios en la grilla para agendar nuevos turnos rápidamente."
    >
      {/* Banner flotante cuando se está eligiendo un nuevo horario para reprogramar */}
      {turnoReprogramando && (
        <div className="mb-4 p-3.5 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-amber-900 font-semibold">
            <CalendarDays size={18} className="text-amber-600 shrink-0" />
            <span>
              Modo Reprogramación activo para el{" "}
              <strong>Turno #{turnoReprogramando.id_turno}</strong> (
              {turnoReprogramando.Paciente?.nombre}{" "}
              {turnoReprogramando.Paciente?.apellido}): hacé clic en el nuevo
              horario dentro del calendario o{" "}
              <button
                type="button"
                onClick={() => {
                  const t = turnoReprogramando;
                  setTurnoReprogramando(null);
                  abrirParaReprogramar(t, formatearTurnoParaReprogramar);
                }}
                className="underline font-bold text-[#0d8266] hover:text-[#09664f] cursor-pointer"
              >
                ingresá la fecha manualmente aquí
              </button>
              .
            </span>
          </div>
          <button
            type="button"
            onClick={() => setTurnoReprogramando(null)}
            className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-200/60 transition-colors cursor-pointer shrink-0"
            title="Cancelar reprogramación"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <AgendaCalendario
        turnos={turnos}
        onNuevoTurno={() => abrirParaCrear()}
        onSelectSlot={(selectInfo) =>
          manejarSeleccionFechaCalendario(
            selectInfo,
            abrirParaCrear,
            abrirParaReprogramar,
            actualizarDatos,
            turnoReprogramando,
            setTurnoReprogramando,
          )
        }
        onEventClick={(clickInfo) =>
          procesarClickEnTurno(clickInfo, abrirParaEditar, abrirParaVer)
        }
      />

      {/* Modal Crear / Editar Turno */}
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

      {/* Modal Ver Detalle del Turno */}
      <VistaTurno
        isOpen={modalVer}
        onClose={cerrarModal}
        turno={turnoSeleccionado}
        abrirParaReprogramar={iniciarModoReprogramacionEnCalendario}
        abrirParaAtender={abrirParaAtender}
        abrirParaCancelar={abrirParaCancelar}
        abrirParaInasistente={abrirParaInasistente}
        abrirParaCobrar={abrirModalPagoTurno}
      />

      {/* Modal Atender Turno */}
      <ModalAtenderTurno
        isOpen={modalAtender}
        onClose={cerrarModal}
        turno={turnoSeleccionado}
        practicasLista={practicasLista}
        onConfirm={(datosAtencion, turnoTarget) =>
          procesarAtencionTurno(datosAtencion, turnoTarget, cerrarModal)
        }
      />

      {/* Modal Cancelar / Marcar Inasistido */}
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

      {/* Modal Reprogramar Turno */}
      <ModalReprogramarTurno
        isOpen={modalReprogramar}
        onClose={cerrarModal}
        turno={turnoSeleccionado}
        datosReprogramacion={datosFormulario}
        onConfirm={(datosReprog, turnoTarget) =>
          procesarReprogramacionTurno(datosReprog, turnoTarget, cerrarModal)
        }
      />

      {/* Modal Eliminar Turno */}
      <ModalEliminarTurno
        modalEliminar={modalEliminar}
        cerrarModal={cerrarModal}
        turnoSeleccionado={turnoSeleccionado}
        ejecutarEliminacion={() => ejecutarEliminacion(turnoSeleccionado)}
      />

      {/* Modal Registrar Pago Directo */}
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

export default AgendaDiaria;

