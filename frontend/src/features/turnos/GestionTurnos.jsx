/** @format */
//* ICONOS
import { useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Clock,
  AlertCircle,
  CalendarClock,
  Eye,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

//* COMPONENTES COMUNES
import Header from "../../components/common/Header";
import Tabla from "../../components/common/Tabla/Tabla";
import TablaHeader from "../../components/common/Tabla/TablaHeader";
import TablaPaginacion from "../../components/common/Tabla/TablaPaginacion";

//* COMPONENTES ESPECIFICOS DE TURNO
import { VistaTurno } from "./components/modales/VistaTurno";
import { BotonAccionesTurno } from "./components/BotonAcciones";
import { ListaTarjetasTurnos } from "./components/ListaTarjetasTurnos";

//* PAGELAYOUT (PARA EL BOTON)
import PageLayout from "../../components/layout/PageLayout";

//* HOOKS
import { useCRUDModal } from "../../hooks/useCRUDModal";
import { usePaginationSearch } from "../../hooks/usePaginationSearch";
import { useTurnoDependencies } from "./hooks/useTurnoDependencies";
import { useTurnoActions } from "./hooks/useTurnoActions";

//* FUNCIONES PARA FORMATEAR FECHAS Y UTILS
import {
  formatFechaTabla,
  formatDateTimeInput,
  formatSoloHora,
} from "../../utils/index";
import { estadosMap } from "./utils/estadosMap";

//* CONSTANTES
import { ESTADO_INICIAL_TURNO } from "./constants/turnosConstants";

//* FORMULARIOS Y VISTAS
import {
  FormularioAtender,
  FormularioCrearEditar,
  FormularioCancelar,
  FormularioEliminar,
  FormularioReprogramar,
} from "./components/FormulariosTurno";

export default function GestionTurnos() {
  const navigate = useNavigate();
  //* HOOK DE PAGINACIÓN
  const {
    datos: turnos,
    cargando,
    page,
    setPage,
    total,
    totalPages,
    search,
    setSearch,
    inicioRegistro,
    finRegistro,
    recargar,
  } = usePaginationSearch("/turnos");

  //* HOOK DE DEPENDENCIAS (PACIENTES Y CATÁLOGO DE PRÁCTICAS)
  const { pacientes, setPacientes, practicasLista } = useTurnoDependencies();

  //* HOOK DE CRUD MODAL
  const {
    modalAbierto,
    modalEliminar,
    editando,
    itemSeleccionado: turnoSeleccionado,
    datosFormulario,
    abrirParaCrear,
    abrirParaEditar,
    abrirParaEliminar,
    cerrarModal,
    actualizarDatos,
  } = useCRUDModal(ESTADO_INICIAL_TURNO);

  //* ESTADOS LOCALES DE MODALES SECUNDARIOS
  const [turnoVer, setTurnoVer] = useState(null);
  const [turnoAtender, setTurnoAtender] = useState(null);
  const [cancelarConfig, setCancelarConfig] = useState(null); // { turno, inasistente: boolean }
  const [turnoReprogramar, setTurnoReprogramar] = useState(null);

  const abrirParaVer = (t) => setTurnoVer(t);
  const abrirParaAtender = (t) => setTurnoAtender(t);
  const abrirParaCancelar = (t) =>
    setCancelarConfig({ turno: t, inasistente: false });
  const abrirParaInasistente = (t) =>
    setCancelarConfig({ turno: t, inasistente: true });
  const abrirParaReprogramar = (t) => setTurnoReprogramar(t);

  //* HOOK DE PETICIONES API
  const {
    guardarTurno,
    procesarAtencionTurno,
    procesarCancelacionTurno,
    procesarReprogramacionTurno,
    ejecutarEliminacion,
  } = useTurnoActions(recargar, cerrarModal);

  return (
    <PageLayout onAdd={abrirParaCrear}>
      <div className="w-full flex flex-col gap-4">
        {/* //* HEADER PRINCIPAL */}
        <Header
          icono={CalendarClock}
          titulo="Gestión de Turnos"
          subtitulo="Listado general y administración de turnos del consultorio"
          badge={`${total} Registrados`}
          botonAccion={
            <button
              type="button"
              onClick={abrirParaCrear}
              className="sm:flex items-center justify-center gap-2 bg-[#2eb086] hover:bg-[#259370] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm hover:shadow active:scale-95 shrink-0"
            >
              <Plus size={18} />
              <span>Agendar Turno</span>
            </button>
          }
        />

        {/* //* BODY: TABLA */}
        <div className="w-full px-4 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
            {/* //* TABLA: HEADER */}
            <TablaHeader
              inicioRegistro={inicioRegistro}
              finRegistro={finRegistro}
              total={total}
              search={search}
              setSearch={(val) => {
                setSearch(val);
                setPage(1);
              }}
              placeholder="Buscar turnos..."
            />

            <div className="overflow-x-auto w-full">
              {/* //* TABLA: TABLA */}
              <Tabla
                cargando={cargando}
                search={search}
                sinDatosText="No se encontraron turnos registrados."
                vistaMovil={
                  <ListaTarjetasTurnos
                    turnos={turnos}
                    cargando={cargando}
                    search={search}
                    abrirParaVer={abrirParaVer}
                    abrirParaEditar={abrirParaEditar}
                    abrirParaEliminar={abrirParaEliminar}
                    abrirParaAtender={abrirParaAtender}
                    abrirParaReprogramar={abrirParaReprogramar}
                    abrirParaCancelar={abrirParaCancelar}
                    abrirParaInasistente={abrirParaInasistente}
                    page={page}
                    setPage={setPage}
                    totalPages={totalPages}
                  />
                }
                columnas={[
                  { label: "ID", className: "hidden md:table-cell" },
                  { label: "Paciente" },
                  { label: "Fecha y Hora" },
                  { label: "Precio ($)", className: "hidden md:table-cell" },
                  { label: "Estado" },
                  { label: "Notas", className: "hidden md:table-cell" },
                  { label: "Acciones", align: "center" },
                ]}
              >
                {turnos.map((turno) => {
                  const estadoInfo = estadosMap[turno.EstadoTurno.estado] || {
                    color: "bg-gray-100 text-gray-600 border-gray-200",
                    icon: AlertCircle,
                  };
                  const IconoEstado = estadoInfo.icon;

                  return (
                    <tr
                      key={turno.id_turno}
                      className="hover:bg-emerald-50/40 transition-colors"
                    >
                      {/* //* COLUMNAS: ID TURNO */}
                      <td className="hidden md:table-cell px-5 py-4 font-mono font-medium text-teal-700/60 w-16 text-xs">
                        #{turno.id_turno}
                      </td>

                      {/* //* COLUMNAS: PACIENTE (Foco con avatar clínico colorido) */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="hidden md:flex w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200/90 items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            {turno.Paciente?.nombre?.charAt(0) || "P"}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 text-sm tracking-tight">
                              {turno.Paciente
                                ? `${turno.Paciente.nombre} ${turno.Paciente.apellido}`
                                : `Paciente #${turno.id_paciente}`}
                            </span>
                            {turno.Paciente?.dni && (
                              <span className="text-xs text-slate-500 font-medium mt-0.5">
                                <span className="text-teal-700/70 font-semibold">
                                  DNI:
                                </span>{" "}
                                {turno.Paciente.dni}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* //* COLUMNAS: FECHA Y HORA */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-0.5">
                          <span className="text-xs font-bold text-slate-800">
                            {formatFechaTabla(turno.fecha_hora_inicio)}
                          </span>
                          <span className="text-xs font-medium text-teal-800/80 flex items-center gap-1">
                            <Clock size={12} className="text-teal-600" />
                            {formatSoloHora(turno.fecha_hora_inicio)} -{" "}
                            {formatSoloHora(turno.fecha_hora_fin)} hs
                          </span>
                        </div>
                      </td>

                      {/* //* COLUMNAS: PRECIO FINAL (Bloque destacado con fondo clínico) */}
                      <td className="hidden md:table-cell px-5 py-4">
                        {Number(turno.precio_final) > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-emerald-100/70 border border-emerald-200/90 text-emerald-900 font-extrabold text-sm tabular-nums shadow-2xs">
                            $
                            {Number(turno.precio_final).toLocaleString(
                              "es-AR",
                              {
                                minimumFractionDigits: 2,
                              },
                            )}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 font-medium text-xs border border-slate-200/60 tabular-nums">
                            $0,00
                          </span>
                        )}
                      </td>

                      {/* //* COLUMNAS: ESTADO */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-2xs ${estadoInfo.color}`}
                        >
                          <IconoEstado size={13} />
                          <span>{turno.EstadoTurno.estado}</span>
                        </span>
                      </td>

                      {/* //* COLUMNAS: NOTAS CONSULTA */}
                      <td className="hidden md:table-cell px-5 py-4 text-slate-600 text-xs max-w-50 truncate">
                        {turno.notas_consulta || (
                          <span className="text-slate-400 italic">
                            Sin notas
                          </span>
                        )}
                      </td>

                      {/* //* COLUMNAS: ACCIONES CON COLOR FUNCIONAL Y HOVER SUAVE */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              abrirParaVer(turno);
                            }}
                            className="p-2 rounded-xl text-teal-600 hover:bg-teal-50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                            title="Ver detalle"
                          >
                            <Eye size={18} />
                          </button>

                          {/* Solo permitir editar turnos Programados */}
                          {turno.EstadoTurno?.estado === "Programado" && (
                            <button
                              type="button"
                              onClick={() =>
                                abrirParaEditar(turno, (item) => ({
                                  ...item,
                                  fecha_hora_inicio: formatDateTimeInput(
                                    item.fecha_hora_inicio,
                                  ),
                                  fecha_hora_fin: formatDateTimeInput(
                                    item.fecha_hora_fin,
                                  ),
                                  duracion_minutos: item.duracion_minutos || 30,
                                }))
                              }
                              className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                              title="Editar Turno"
                            >
                              <Edit size={18} />
                            </button>
                          )}

                          {/* Botón rápido contextual para cobrar turno atendido */}
                          {turno.EstadoTurno?.estado === "Atendido" && (
                            <button
                              type="button"
                              onClick={() =>
                                navigate("/caja", {
                                  state: { turnoParaCobrar: turno },
                                })
                              }
                              className="px-2.5 py-1.5 rounded-xl text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 font-bold text-xs transition-all shadow-xs hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5"
                              title="Cobrar Turno en Caja"
                            >
                              <Wallet size={16} />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => abrirParaEliminar(turno)}
                            className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                            title="Eliminar Turno"
                          >
                            <Trash2 size={18} />
                          </button>

                          {turno.EstadoTurno.estado === "Programado" && (
                            <BotonAccionesTurno
                              turno={turno}
                              abrirParaAtender={abrirParaAtender}
                              abrirParaReprogramar={abrirParaReprogramar}
                              abrirParaCancelar={abrirParaCancelar}
                              abrirParaInasistente={abrirParaInasistente}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </Tabla>
            </div>

            {/* //* TABLA: PAGINACION */}
            <TablaPaginacion
              page={page}
              setPage={setPage}
              totalPages={totalPages}
            />
          </div>
        </div>

        {/* //* MODALES: VISTA TURNO */}
        {turnoVer && (
          <VistaTurno
            isOpen={Boolean(turnoVer)}
            onClose={() => setTurnoVer(null)}
            turno={turnoVer}
            abrirParaReprogramar={(t) => {
              setTurnoVer(null);
              abrirParaReprogramar(t);
            }}
            abrirParaAtender={(t) => {
              setTurnoVer(null);
              abrirParaAtender(t);
            }}
            abrirParaCancelar={(t) => {
              setTurnoVer(null);
              abrirParaCancelar(t);
            }}
            abrirParaInasistente={(t) => {
              setTurnoVer(null);
              abrirParaInasistente(t);
            }}
          />
        )}

        {/* //* MODALES: CREAR Y EDITAR */}
        {modalAbierto && (
          <FormularioCrearEditar
            modalAbierto={modalAbierto}
            cerrarModal={cerrarModal}
            editando={editando}
            pacientes={pacientes}
            setPacientes={setPacientes}
            datosFormulario={datosFormulario}
            actualizarDatos={actualizarDatos}
            guardarTurno={(e) => {
              e.preventDefault();
              guardarTurno(datosFormulario, editando, turnoSeleccionado);
            }}
            abrirParaAtender={() => {
              cerrarModal();
              abrirParaAtender(turnoSeleccionado);
            }}
            abrirParaCancelar={() => {
              cerrarModal();
              abrirParaCancelar(turnoSeleccionado);
            }}
            abrirParaInasistente={() => {
              cerrarModal();
              abrirParaInasistente(turnoSeleccionado);
            }}
            abrirParaReprogramar={() => {
              cerrarModal();
              abrirParaReprogramar(turnoSeleccionado);
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

        {/* //* MODALES: ELIMINAR */}
        {modalEliminar && (
          <FormularioEliminar
            modalEliminar={modalEliminar}
            cerrarModal={cerrarModal}
            turnoSeleccionado={turnoSeleccionado}
            ejecutarEliminacion={() => ejecutarEliminacion(turnoSeleccionado)}
          />
        )}
      </div>
    </PageLayout>
  );
}
