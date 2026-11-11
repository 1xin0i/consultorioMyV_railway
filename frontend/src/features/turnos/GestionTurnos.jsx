/** @format */
//* ICONOS
import { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Plus,
  Clock,
  AlertCircle,
  Calendar,
  Search,
  X,
  ChevronDown,
  Eye,
} from "lucide-react";

//* COMPONENTES COMUNES
import Header from "../../components/common/Header";
import Tabla from "../../components/common/Tabla/Tabla";
import TablaPaginacion from "../../components/common/Tabla/TablaPaginacion";

//* COMPONENTES ESPECIFICOS DE TURNO
import { VistaTurno } from "./components/modales/VistaTurno";
import { BotonAccionesTurno } from "./components/BotonAcciones";
import { BotonNotaTurno } from "./components/BotonNotaTurno";
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
  obtenerColorAvatar,
  obtenerIniciales,
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
import ModalRegistrarPago from "../cobros/components/ModalRegistrarPago";

export default function GestionTurnos() {
  //* HOOK DE PAGINACIÓN CON SOPORTE DE FILTROS Y LÍMITE
  const {
    datos: turnos,
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
    setExtraParams,
    inicioRegistro,
    finRegistro,
    recargar,
  } = usePaginationSearch("/turnos", 9);

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
  const [menuAccionesAbiertoId, setMenuAccionesAbiertoId] = useState(null);

  //* ESTADOS DE FILTROS SUPERIORES
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroMes, setFiltroMes] = useState("");

  //* ESTADO MODAL COBRO RÁPIDO EN TURNOS
  const [turnoParaCobrar, setTurnoParaCobrar] = useState(null);

  const abrirParaVer = (t) => setTurnoVer(t);
  const abrirParaAtender = (t) => setTurnoAtender(t);
  const abrirParaCancelar = (t) =>
    setCancelarConfig({ turno: t, inasistente: false });
  const abrirParaInasistente = (t) =>
    setCancelarConfig({ turno: t, inasistente: true });
  const abrirParaReprogramar = (t) => setTurnoReprogramar(t);
  const abrirParaCobrar = (t) => setTurnoParaCobrar(t);

  //* HOOK DE PETICIONES API
  const {
    guardarTurno,
    procesarAtencionTurno,
    procesarCancelacionTurno,
    procesarReprogramacionTurno,
    ejecutarEliminacion,
  } = useTurnoActions(recargar, cerrarModal);

  const location = useLocation();

  //* ABRIR AUTOMÁTICAMENTE MODAL SI SE VIENE DESDE PACIENTES CON "AGENDAR TURNO"
  useEffect(() => {
    if (location.state?.nuevoTurno && location.state?.pacienteId) {
      abrirParaCrear((item) => ({
        ...item,
        id_paciente: location.state.pacienteId,
      }));
      window.history.replaceState({}, document.title);
    }
  }, [location.state, abrirParaCrear]);

  //* LISTA DE MESES PARA SELECTOR DE FECHA
  const opcionesMeses = useMemo(() => {
    const lista = [{ valor: "", label: "Todos los meses" }];
    const ahora = new Date();
    // 6 meses pasados y 6 futuros
    for (let i = -6; i <= 6; i++) {
      const d = new Date(ahora.getFullYear(), ahora.getMonth() + i, 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const valor = `${year}-${month}`;
      const nombreMes = d.toLocaleDateString("es-AR", { month: "long" });
      const label = `${
        nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)
      } ${year}`;
      lista.push({ valor, label });
    }
    return lista;
  }, []);

  //* APLICAR FILTRO DE ESTADO
  const cambiarFiltroEstado = (nuevoEstado) => {
    setFiltroEstado(nuevoEstado);
    setExtraParams((prev) => ({
      ...prev,
      estadoFiltrado: nuevoEstado === "todos" ? undefined : nuevoEstado,
    }));
    setMenuAccionesAbiertoId(null);
  };

  //* APLICAR FILTRO DE MES
  const cambiarFiltroMes = (nuevoMes) => {
    setFiltroMes(nuevoMes);
    setExtraParams((prev) => ({
      ...prev,
      mes: nuevoMes || undefined,
    }));
    setMenuAccionesAbiertoId(null);
  };

  return (
    <PageLayout onAdd={abrirParaCrear}>
      <div className="w-full flex flex-col gap-4">
        {/* //* HEADER PRINCIPAL: Solo título, badge y botón de acción */}
        <Header
          titulo="Gestión de Turnos"
          badge={`${total} Registrados`}
          botonAccion={
            <button
              type="button"
              onClick={abrirParaCrear}
              className="sm:flex items-center justify-center gap-2 bg-[#2eb086] hover:bg-[#259370] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm hover:shadow active:scale-95 shrink-0 cursor-pointer"
            >
              <Plus size={18} />
              <span>Agendar Turno</span>
            </button>
          }
        />

        {/* //* TOOLBAR SEPARADA DE LA TABLA: FILTROS + BUSCADOR */}
        <div className="w-full px-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5">
            {/* LADO IZQUIERDO: Filtros por estado tipo Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {/* Todos */}
              <button
                type="button"
                onClick={() => cambiarFiltroEstado("todos")}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  filtroEstado === "todos"
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>Todos</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    filtroEstado === "todos"
                      ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900"
                      : "bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {total}
                </span>
              </button>

              {/* Atendidos */}
              <button
                type="button"
                onClick={() => cambiarFiltroEstado("atendidos")}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  filtroEstado === "atendidos"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span>Atendidos</span>
              </button>

              {/* Programados */}
              <button
                type="button"
                onClick={() => cambiarFiltroEstado("programados")}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  filtroEstado === "programados"
                    ? "bg-amber-50 text-amber-800 border border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span>Programados</span>
              </button>

              {/* Cancelados */}
              <button
                type="button"
                onClick={() => cambiarFiltroEstado("cancelados")}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  filtroEstado === "cancelados"
                    ? "bg-rose-50 text-rose-800 border border-rose-200/80 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <span>Cancelados</span>
              </button>

              {/* Inasistidos */}
              <button
                type="button"
                onClick={() => cambiarFiltroEstado("inasistidos")}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  filtroEstado === "inasistidos"
                    ? "bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                <span>Inasistidos</span>
              </button>
            </div>

            {/* LADO DERECHO: Selector de Mes + Buscador */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 justify-end">
              {/* Selector de Mes */}
              <div className="relative inline-flex items-center">
                <Calendar
                  size={15}
                  className="absolute left-3 text-gray-400 dark:text-slate-400 pointer-events-none"
                />
                <select
                  value={filtroMes}
                  onChange={(e) => cambiarFiltroMes(e.target.value)}
                  className="appearance-none pl-8 pr-7 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086] transition-all cursor-pointer"
                >
                  {opcionesMeses.map((opt) => (
                    <option key={opt.valor} value={opt.valor}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={13}
                  className="absolute right-2.5 text-gray-400 pointer-events-none"
                />
              </div>

              {/* Buscador de turnos */}
              <div className="relative flex-1 sm:w-72">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Buscar paciente, DNI..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setMenuAccionesAbiertoId(null);
                  }}
                  className="w-full pl-9 pr-8 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086] transition-all"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    title="Borrar búsqueda"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* //* TABLA EN CONTENEDOR SEPARADO */}
        <div className="w-full px-4 flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
            <div className="overflow-x-auto w-full">
              <Tabla
                cargando={cargando}
                search={search}
                sinDatosText="No se encontraron turnos registrados."
                order={order}
                setOrder={setOrder}
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
                    abrirParaCobrar={abrirParaCobrar}
                    page={page}
                    setPage={setPage}
                    totalPages={totalPages}
                  />
                }
                columnas={[
                  { label: "PACIENTE", sortField: "paciente" },
                  { label: "TRATAMIENTO / PRÁCTICA" },
                  { label: "FECHA Y HORARIO", sortField: "fecha_hora_inicio" },
                  { label: "ESTADO", sortField: "estado" },
                  { label: "HONORARIOS", sortField: "honorarios" },
                  { label: "NOTAS", align: "center" },
                  { label: "ACCIONES", align: "center" },
                ]}
              >
                {turnos.map((turno) => {
                  const estadoInfo = estadosMap[turno.EstadoTurno?.estado] || {
                    color: "bg-gray-100 text-gray-600 border-gray-200",
                    icon: AlertCircle,
                  };
                  const coloresAvatar = obtenerColorAvatar(
                    `${turno.Paciente?.nombre || ""} ${
                      turno.Paciente?.apellido || ""
                    }`
                  );
                  const iniciales = obtenerIniciales(
                    turno.Paciente?.nombre,
                    turno.Paciente?.apellido
                  );

                  const idEstado = Number(
                    turno.id_estado || turno.EstadoTurno?.id_estado
                  );

                  // Práctica y Obra Social
                  const primerTratamiento =
                    turno.PracticaTurnos && turno.PracticaTurnos.length > 0
                      ? turno.PracticaTurnos[0]
                      : null;
                  const nombreTratamiento = primerTratamiento
                    ? primerTratamiento.Practica?.nombre_referencia ||
                      primerTratamiento.Practica?.nombre_nomenclador ||
                      "Práctica Odontológica"
                    : "Consulta General";
                  const nombreObraSocial = primerTratamiento
                    ? primerTratamiento.ObraSocial?.nombre || "Particular"
                    : "Particular";

                  // Pieza dental si aplica
                  const piezasDentales =
                    primerTratamiento?.dientes &&
                    primerTratamiento.dientes.length > 0
                      ? ` Pieza #${primerTratamiento.dientes
                          .map((d) => d.numero_fdi)
                          .join(", #")}`
                      : "";

                  // Verificación de honorarios / cobro
                  const estaCanceladoOInasistido =
                    idEstado === 3 || idEstado === 4;
                  const cuotas = turno.Cobro?.Cuotas || [];
                  const estaAbonado =
                    cuotas.length > 0 &&
                    cuotas.every(
                      (c) =>
                        c.estado === "Pagada" ||
                        c.estado === "Pagado" ||
                        (Number(c.monto_cobrado) > 0 &&
                          Number(c.monto_cobrado) >= Number(c.monto_cuota))
                    );

                  return (
                    <tr
                      key={turno.id_turno}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* //* COLUMNA 1: PACIENTE */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`hidden md:flex w-9 h-9 rounded-full ${coloresAvatar.bg} ${coloresAvatar.text} border ${coloresAvatar.border} items-center justify-center font-bold text-xs shrink-0 shadow-2xs`}
                          >
                            {iniciales}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-tight truncate">
                              {turno.Paciente
                                ? `${turno.Paciente.nombre} ${turno.Paciente.apellido}`
                                : `Paciente #${turno.id_paciente}`}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                              DNI {turno.Paciente?.dni || "S/D"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* //* COLUMNA 2: TRATAMIENTO / PRÁCTICA */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-1">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold max-w-[220px] truncate ${
                              primerTratamiento
                                ? "bg-sky-50 text-sky-700 border border-sky-200/70 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/40"
                                : "bg-gray-100 text-gray-700 border border-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                            }`}
                          >
                            {nombreTratamiento}
                            {piezasDentales}
                            {turno.PracticaTurnos &&
                              turno.PracticaTurnos.length > 1 &&
                              ` (+${turno.PracticaTurnos.length - 1})`}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {nombreObraSocial}
                          </span>
                        </div>
                      </td>

                      {/* //* COLUMNA 3: FECHA Y HORARIO */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-0.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {formatFechaTabla(turno.fecha_hora_inicio)}
                          </span>
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Clock size={12} className="text-gray-400" />
                            {formatSoloHora(turno.fecha_hora_inicio)} -{" "}
                            {formatSoloHora(turno.fecha_hora_fin)} hs
                          </span>
                        </div>
                      </td>

                      {/* //* COLUMNA 4: ESTADO */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-2xs ${estadoInfo.color}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              idEstado === 2
                                ? "bg-emerald-500"
                                : idEstado === 1
                                ? "bg-amber-500"
                                : idEstado === 3
                                ? "bg-rose-500"
                                : "bg-slate-400"
                            }`}
                          />
                          <span>
                            {estadoInfo.label ||
                              turno.EstadoTurno?.estado ||
                              "Sin estado"}
                          </span>
                        </span>
                      </td>

                      {/* //* COLUMNA 5: HONORARIOS (Arancel / Importe) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {estaCanceladoOInasistido ? (
                          <span className="text-slate-400 dark:text-slate-500 font-medium text-sm">
                            —
                          </span>
                        ) : (
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm tabular-nums">
                              $
                              {Number(turno.precio_final || 0).toLocaleString(
                                "es-AR",
                                {
                                  minimumFractionDigits: 2,
                                }
                              )}
                            </span>
                            {estaAbonado ? (
                              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                Abonado
                              </span>
                            ) : (
                              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                A cobrar
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* //* COLUMNA 6: NOTAS */}
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <BotonNotaTurno
                          turno={turno}
                          onEditar={() =>
                            abrirParaEditar(turno, (item) => ({
                              ...item,
                              fecha_hora_inicio: formatDateTimeInput(
                                item.fecha_hora_inicio
                              ),
                              fecha_hora_fin: formatDateTimeInput(
                                item.fecha_hora_fin
                              ),
                              duracion_minutos: item.duracion_minutos || 30,
                            }))
                          }
                        />
                      </td>

                      {/* //* COLUMNA 7: ACCIONES */}
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => abrirParaVer(turno)}
                            className="p-2 rounded-xl text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                            title="Ver detalle"
                          >
                            <Eye size={18} />
                          </button>

                          {/* Menú de 3 puntos con todas las acciones (incluyendo Eliminar) */}
                          <BotonAccionesTurno
                            turno={turno}
                            menuAbiertoId={menuAccionesAbiertoId}
                            setMenuAbiertoId={setMenuAccionesAbiertoId}
                            abrirParaEditar={() =>
                              abrirParaEditar(turno, (item) => ({
                                ...item,
                                fecha_hora_inicio: formatDateTimeInput(
                                  item.fecha_hora_inicio
                                ),
                                fecha_hora_fin: formatDateTimeInput(
                                  item.fecha_hora_fin
                                ),
                                duracion_minutos: item.duracion_minutos || 30,
                              }))
                            }
                            abrirParaAtender={abrirParaAtender}
                            abrirParaReprogramar={abrirParaReprogramar}
                            abrirParaCancelar={abrirParaCancelar}
                            abrirParaInasistente={abrirParaInasistente}
                            abrirParaCobrar={abrirParaCobrar}
                            abrirParaEliminar={abrirParaEliminar}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </Tabla>
            </div>

            {/* //* FOOTER DE LA TABLA: Paginación moderna */}
            <TablaPaginacion
              page={page}
              setPage={(p) => {
                setMenuAccionesAbiertoId(null);
                setPage(p);
              }}
              totalPages={totalPages}
              total={total}
              inicioRegistro={inicioRegistro}
              finRegistro={finRegistro}
              limit={limit}
              setLimit={setLimit}
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
            practicasLista={practicasLista}
            datosFormulario={datosFormulario}
            actualizarDatos={actualizarDatos}
            guardarTurno={(e) => {
              if (e && e.preventDefault) e.preventDefault();
              guardarTurno(datosFormulario, editando, turnoSeleccionado);
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
                setTurnoAtender(null)
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
                () => setCancelarConfig(null)
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
                setTurnoReprogramar(null)
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

        {/* //* MODAL: COBRAR TURNO */}
        {turnoParaCobrar && (
          <ModalRegistrarPago
            isOpen={Boolean(turnoParaCobrar)}
            onClose={() => setTurnoParaCobrar(null)}
            turno={turnoParaCobrar}
            onSuccess={recargar}
          />
        )}
      </div>
    </PageLayout>
  );
}
