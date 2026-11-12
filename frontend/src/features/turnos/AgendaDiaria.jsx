/** @format */

import { useState, useRef, useCallback } from "react";

//* ICONOS Y TOAST
import { Calendar } from "lucide-react";
import toast from "react-hot-toast";

// * COMPONENTES COMUNES
import Header from "../../components/common/Header";
import AgendaCalendario from "./components/calendario/AgendaCalendario";

//* COMPONENTES ESPECIFICOS DE TURNO
import { VistaTurno } from "./components/modales/VistaTurno";
import { AdvertenciaPacienteIncompleto } from "./components/AdvertenciaPacienteIncompleto";
import ModalRegistrarPago from "../cobros/components/ModalRegistrarPago";

//* HOOKS
import { useTurnoSearchAgenda } from "./hooks/useTurnoSearchAgenda";
import { useCRUDModal } from "../../hooks/useCRUDModal";
import { useTurnoActions } from "./hooks/useTurnoActions";

//* FUNCIONES PARA FORMATEAR FECHAS Y UTILIDADES
import { formatFechaCortaTexto } from "../../utils/index";

//* CONSTANTES
import { ESTADO_INICIAL_TURNO } from "./constants/turnosConstants";

//* FORMULARIOS
import {
  FormularioCrearEditar,
  FormularioAtender,
  FormularioCancelar,
  FormularioReprogramar,
} from "./components/FormulariosTurno";

export default function AgendaDiaria() {
  // Estado y ref para turno en modo reprogramación
  const [turnoReprogramando, setTurnoReprogramandoState] = useState(null);
  const turnoReprogramandoRef = useRef(null);

  const setTurnoReprogramando = (t) => {
    turnoReprogramandoRef.current = t;
    setTurnoReprogramandoState(t);
  };

  //* HOOK DE CRUD MODAL
  const {
    modalAbierto,
    editando,
    abrirParaCrear,
    abrirParaEditar,
    itemSeleccionado: turnoSeleccionado,
    datosFormulario,
    cerrarModal,
    actualizarDatos,
  } = useCRUDModal(ESTADO_INICIAL_TURNO);

  //* HOOK ESPECIFICO PARA AGENDA
  const { turnos, pacientes, setPacientes, practicasLista, recargar } =
    useTurnoSearchAgenda("/turnos/agenda");

  //* ESTADOS LOCALES DE MODALES SECUNDARIOS
  const [turnoVer, setTurnoVer] = useState(null);
  const [turnoAtender, setTurnoAtender] = useState(null);
  const [cancelarConfig, setCancelarConfig] = useState(null); // { turno, inasistente: boolean }
  const [turnoReprogramar, setTurnoReprogramar] = useState(null);
  const [turnoParaCobrar, setTurnoParaCobrar] = useState(null);

  const abrirParaVer = useCallback((t) => setTurnoVer(t), []);
  const abrirParaAtender = useCallback((t) => setTurnoAtender(t), []);
  const abrirParaCobrar = useCallback((t) => setTurnoParaCobrar(t), []);
  const abrirParaCancelar = useCallback(
    (t) => setCancelarConfig({ turno: t, inasistente: false }),
    [],
  );
  const abrirParaInasistente = useCallback(
    (t) => setCancelarConfig({ turno: t, inasistente: true }),
    [],
  );
  const abrirParaReprogramar = useCallback((t) => setTurnoReprogramar(t), []);

  //* HOOK DE PETICIONES API
  const {
    guardarTurno,
    procesarAtencionTurno,
    procesarCancelacionTurno,
    procesarReprogramacionTurno,
    manejarSeleccionFechaCalendario,
    procesarClickEnTurno,
  } = useTurnoActions(recargar, cerrarModal);

  const handleDateSelect = useCallback(
    (selectInfo) =>
      manejarSeleccionFechaCalendario(
        selectInfo,
        abrirParaCrear,
        abrirParaReprogramar,
        actualizarDatos,
        turnoReprogramandoRef.current,
        setTurnoReprogramando,
      ),
    [
      manejarSeleccionFechaCalendario,
      abrirParaCrear,
      abrirParaReprogramar,
      actualizarDatos,
    ],
  );

  const handleEventClick = useCallback(
    (clickInfo) =>
      procesarClickEnTurno(clickInfo, abrirParaEditar, abrirParaVer),
    [procesarClickEnTurno, abrirParaEditar, abrirParaVer],
  );

  /* ─── RETORNO DE LA PAGINA ─────────────────────────────────── */
  return (
    <div className="w-full h-screen flex flex-col pb-20 md:pb-0">
      {/* //* HEADER PRINCIPAL CON ALERTA DE PACIENTES INTEGRADA */}
      <Header
        titulo="Agenda de Turnos"
        badge={formatFechaCortaTexto(new Date())}
        alerta={
          <AdvertenciaPacienteIncompleto
            pacientes={pacientes}
            setPacientes={setPacientes}
          />
        }
      />

      <div className="flex-1 w-full min-h-0 p-2 sm:p-3 md:p-3.5 text-slate-900 dark:text-slate-100 flex flex-col">
        {turnoReprogramando && (
          <div className="bg-[#3B7A94] dark:bg-[#162a35] border border-transparent dark:border-slate-700 text-white px-4 py-2.5 rounded-xl mb-3 flex items-center justify-between text-xs sm:text-sm shadow-md animate-pulse">
            <span className="flex items-center gap-2">
              <Calendar size={18} className="shrink-0" />
              <span>
                <strong>Modo Reprogramación:</strong> Seleccione o arrastre en
                la agenda para definir el horario y duración de{" "}
                <strong>
                  {turnoReprogramando.Paciente
                    ? `${turnoReprogramando.Paciente.nombre} ${turnoReprogramando.Paciente.apellido}`
                    : `#${turnoReprogramando.id_turno}`}
                </strong>
              </span>
            </span>
            <button
              type="button"
              onClick={() => {
                setTurnoReprogramando(null);
                toast.dismiss();
              }}
              className="ml-2 px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              Cancelar
            </button>
          </div>
        )}

        <div className="w-full h-full bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden p-2 md:p-4 flex flex-col">
          {/* //* BODY: AGENDA */}
          <AgendaCalendario
            turnos={turnos}
            onDateSelect={handleDateSelect}
            onEventClick={handleEventClick}
          />
        </div>
      </div>

      {/* //* MODALES: CREAR Y EDITAR */}
      {modalAbierto && (
        <FormularioCrearEditar
          modalAbierto={modalAbierto}
          cerrarModal={cerrarModal}
          editando={editando}
          pacientes={pacientes}
          setPacientes={setPacientes}
          practicasLista={practicasLista}
          datosFormulario={datosFormulario}
          actualizarDatos={actualizarDatos}
          guardarTurno={(e) => {
            if (e && e.preventDefault) e.preventDefault();
            guardarTurno(datosFormulario, editando, turnoSeleccionado);
          }}
        />
      )}

      {/* //* MODALES: VER */}
      {turnoVer && (
        <VistaTurno
          isOpen={Boolean(turnoVer)}
          onClose={() => setTurnoVer(null)}
          turno={turnoVer}
          abrirParaReprogramar={(turnoTarget) => {
            setTurnoVer(null);
            setTurnoReprogramando(turnoTarget);
            toast(
              "Seleccione o arrastre en la agenda para definir el nuevo horario y duración...",
              {
                icon: "📅",
                duration: 5000,
                style: {
                  background: "#3B7A94",
                  color: "#fff",
                  fontWeight: "bold",
                },
              },
            );
          }}
          abrirParaAtender={(turnoTarget) => {
            setTurnoVer(null);
            if (turnoTarget) abrirParaAtender(turnoTarget);
          }}
          abrirParaCancelar={(turnoTarget) => {
            setTurnoVer(null);
            if (turnoTarget) abrirParaCancelar(turnoTarget);
          }}
          abrirParaInasistente={(turnoTarget) => {
            setTurnoVer(null);
            if (turnoTarget) abrirParaInasistente(turnoTarget);
          }}
          abrirParaCobrar={(turnoTarget) => {
            setTurnoVer(null);
            if (turnoTarget) abrirParaCobrar(turnoTarget);
          }}
        />
      )}

      {/* //* MODALES: ATENDER */}
      {turnoAtender && (
        <FormularioAtender
          isOpen={Boolean(turnoAtender)}
          onClose={() => setTurnoAtender(null)}
          turno={turnoAtender}
          practicasLista={practicasLista}
          onConfirm={(datos) =>
            procesarAtencionTurno(datos, turnoAtender, () =>
              setTurnoAtender(null),
            )
          }
        />
      )}

      {/* //* MODALES: REPROGRAMAR */}
      {turnoReprogramar && (
        <FormularioReprogramar
          isOpen={Boolean(turnoReprogramar)}
          onClose={() => setTurnoReprogramar(null)}
          turno={turnoReprogramar}
          onConfirm={(datos) =>
            procesarReprogramacionTurno(datos, turnoReprogramar, () =>
              setTurnoReprogramar(null),
            )
          }
        />
      )}

      {/* //* MODALES: CANCELAR E INASISTENTE */}
      {cancelarConfig && (
        <FormularioCancelar
          isOpen={Boolean(cancelarConfig)}
          onClose={() => setCancelarConfig(null)}
          turno={cancelarConfig.turno}
          inasistente={cancelarConfig.inasistente}
          onConfirm={({ notas_consulta, inasistente, turno }) =>
            procesarCancelacionTurno(
              inasistente,
              turno,
              { notas_consulta },
              () => setCancelarConfig(null),
            )
          }
        />
      )}

      {/* //* MODAL: COBRAR TURNO */}
      {turnoParaCobrar && (
        <ModalRegistrarPago
          isOpen={Boolean(turnoParaCobrar)}
          onClose={() => setTurnoParaCobrar(null)}
          turno={turnoParaCobrar}
          onPagoRegistrado={() => {
            setTurnoParaCobrar(null);
            recargar();
          }}
        />
      )}
    </div>
  );
}
