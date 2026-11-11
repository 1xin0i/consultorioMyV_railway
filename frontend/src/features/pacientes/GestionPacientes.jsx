/** @format */

//* useSearchParams E ICONOS
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom"; // * PARA PERMITIR COMPLETAR PACIENTE DESDE AGENDA
import {
  Users,
  Plus,
  Edit,
  Phone,
  RotateCcw,
  Eye,
  Shield,
  Trash2,
  Search,
  X,
  CalendarPlus,
} from "lucide-react";

//* COMPONENTES COMUNES
import Header from "../../components/common/Header";
import Tabla from "../../components/common/Tabla/Tabla";
import TablaPaginacion from "../../components/common/Tabla/TablaPaginacion";
import { ListaTarjetas, TarjetaRegistro } from "../../components/common/Tabla/TarjetaRegistro";

// * PAGELAYOUT (PARA EL BOTON)
import PageLayout from "../../components/layout/PageLayout";

//* HOOKS
import { useCRUDModal } from "../../hooks/useCRUDModal";
import { usePaginationSearch } from "../../hooks/usePaginationSearch";
import { usePacienteActions } from "./hooks/usePacienteActions";
import { useObrasSocialesCatalogo } from "./hooks/useObrasSocialesCatalogo";

//* FUNCIONES PARA FORMATEAR FECHAS Y UTILIDADES
import { formatearPacienteParaEditar } from "./utils/formatearPacienteParaEditar.js";
import { obtenerColorAvatar } from "../../utils/index.js";

//* CONSTANTES
import { ESTADO_INICIAL } from "./constants/pacienteConstants.js";

// * FORMULARIOS
import { FormularioCrearEditar, FormularioToggle } from "./components/FormulariosPaciente";
import { verificarCompletarPaciente } from "./utils/verificarCompletarPaciente.js";
import { VistaPaciente } from "./components/VistaPaciente.jsx";
import { BotonAccionesPaciente } from "./components/BotonAccionesPaciente.jsx";

export default function GestionPacientes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [menuAccionesAbiertoId, setMenuAccionesAbiertoId] = useState(null);

  const abrirParaAgendarTurno = (p) => {
    navigate("/turnos", {
      state: { pacienteId: p.id_paciente, nuevoTurno: true },
    });
  };

  //* HOOK DE PAGINACIÓN CON SOPORTE DE FILTROS, ORDEN Y LÍMITE
  const {
    datos: pacientes,
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
  } = usePaginationSearch("/pacientes", 9);

  // * ESTADO DE FILTRO POR ESTADO (ACTIVO/INACTIVO/TODOS)
  const [filtroEstado, setFiltroEstado] = useState("activos");

  const cambiarFiltroEstado = (nuevoEstado) => {
    setFiltroEstado(nuevoEstado);
    setExtraParams((prev) => ({
      ...prev,
      estadoFiltrado: nuevoEstado,
    }));
  };

  // * HOOK DE CRUD MODAL
  const {
    modalAbierto,
    modalToggle,
    editando,
    itemSeleccionado: pacienteSeleccionado,
    datosFormulario,
    abrirParaCrear,
    abrirParaEditar,
    abrirParaToggle,
    cerrarModal,
    actualizarDatos,
  } = useCRUDModal(ESTADO_INICIAL);

  // * ESTADO DE MODAL VER
  const [pacienteVer, setPacienteVer] = useState(null);
  const abrirParaVer = (p) => setPacienteVer(p);

  // * HOOK PARA OBRAS SOCIALES
  const { obrasSocialesLista, agregarObraSocialForm, actualizarObraSocialForm, eliminarObraSocialForm } =
    useObrasSocialesCatalogo(actualizarDatos);

  //* HOOK PETICIONES API
  const { guardarPaciente, togglePaciente } = usePacienteActions(recargar, cerrarModal);

  // TODO: VER SI PUEDO SACAR ESTE USEEFECT
  useEffect(() => {
    verificarCompletarPaciente(cargando, searchParams, pacientes, abrirParaEditar, setSearchParams);
  }, [searchParams, pacientes, cargando, abrirParaEditar, setSearchParams]);

  return (
    <PageLayout onAdd={abrirParaCrear}>
      <div className="w-full flex-1 flex flex-col gap-4">
        {/* //* HEADER PRINCIPAL: Limpio, blanco, solo título, badge y botón de acción */}
        <Header
          titulo="Gestión de Pacientes"
          badge={`${total} Registrados`}
          botonAccion={
            <button
              type="button"
              onClick={abrirParaCrear}
              className="hidden sm:flex items-center justify-center gap-2 bg-[#2eb086] hover:bg-[#259370] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm shrink-0 cursor-pointer"
            >
              <Plus size={18} />
              <span>Nuevo Paciente</span>
            </button>
          }
        />

        {/* //* TOOLBAR SEPARADA: FILTROS + BUSCADOR */}
        <div className="w-full px-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5">
            {/* LADO IZQUIERDO: Filtros por estado */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => cambiarFiltroEstado("activos")}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  filtroEstado === "activos"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span>Activos</span>
              </button>

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

              <button
                type="button"
                onClick={() => cambiarFiltroEstado("inactivos")}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  filtroEstado === "inactivos"
                    ? "bg-rose-50 text-rose-800 border border-rose-200/80 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <span>Inactivos</span>
              </button>
            </div>

            {/* LADO DERECHO: Buscador */}
            <div className="relative flex-1 sm:w-72">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400"
              />
              <input
                type="text"
                placeholder="Buscar paciente, DNI, teléfono..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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

        {/* //* BODY: TABLA SEPARADA */}
        <div className="flex-1 w-full min-h-0 px-4 flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
            <div className="overflow-x-auto flex-1">
              <Tabla
                cargando={cargando}
                search={search}
                sinDatosText="No se encontraron pacientes registrados."
                order={order}
                setOrder={setOrder}
                vistaMovil={
                  <ListaTarjetas
                    cargando={cargando}
                    search={search}
                    sinDatosText="No se encontraron pacientes registrados."
                    page={page}
                    setPage={setPage}
                    totalPages={totalPages}
                  >
                    {pacientes.map((paciente) => {
                      const coloresAvatar = obtenerColorAvatar(`${paciente.nombre || ""} ${paciente.apellido || ""}`);
                      return (
                        <TarjetaRegistro
                          key={paciente.id_paciente}
                          avatar={`${paciente.nombre?.charAt(0) || ""}${paciente.apellido?.charAt(0) || ""}`}
                          avatarClassName={`${coloresAvatar.bg} ${coloresAvatar.text} border ${coloresAvatar.border}`}
                          titulo={`${paciente.nombre} ${paciente.apellido}`}
                          subtitulo={`DNI: ${paciente.dni || "S/D"}`}
                          tituloSheet="Opciones del Paciente"
                          badge={
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0 ${
                                paciente.activo
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                                  : "bg-gray-100 text-gray-500 border-gray-200"
                              }`}
                            >
                              {paciente.activo ? "Activo" : "Inactivo"}
                            </span>
                          }
                          acciones={[
                            {
                              key: "ver",
                              label: "Ver ficha",
                              icon: Eye,
                              rapida: true,
                              onClick: () => abrirParaVer(paciente),
                            },
                            {
                              key: "editar",
                              label: "Editar datos personales",
                              icon: Edit,
                              tono: "azul",
                              rapida: true,
                              onClick: () => abrirParaEditar(paciente, formatearPacienteParaEditar),
                            },
                            {
                              key: "agendar",
                              label: "Agendar nuevo turno",
                              icon: CalendarPlus,
                              tono: "verde",
                              onClick: () => abrirParaAgendarTurno(paciente),
                            },
                            {
                              key: "toggle",
                              label: paciente.activo ? "Marcar como inactivo" : "Reactivar paciente",
                              icon: paciente.activo ? Trash2 : RotateCcw,
                              tono: paciente.activo ? "rojo" : "verde",
                              separador: true,
                              onClick: () => abrirParaToggle(paciente),
                            },
                          ]}
                        >
                          <div className="flex items-center gap-2">
                            <Phone size={14} className="text-gray-400 shrink-0" />
                            <span className="font-medium text-gray-700">{paciente.telefono || "S/D"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Shield size={14} className="text-gray-400 shrink-0" />
                            {paciente.PacienteObraSocials && paciente.PacienteObraSocials.length > 0 ? (
                              paciente.PacienteObraSocials.map((pos) => (
                                <span
                                  key={pos.id_paciente_obra_social || pos.id_obra_social}
                                  className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-[#e8f7f1] text-[#2eb086] border border-[#2eb086]/20"
                                >
                                  {pos.ObraSocial?.nombre || "Obra Social"}
                                  {pos.nro_afiliado ? ` #${pos.nro_afiliado}` : ""}
                                </span>
                              ))
                            ) : (
                              <span className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-gray-100 text-gray-500 border border-gray-200">
                                Particular
                              </span>
                            )}
                          </div>
                        </TarjetaRegistro>
                      );
                    })}
                  </ListaTarjetas>
                }
                columnas={[
                  { label: "PACIENTE", sortField: "paciente" },
                  { label: "DNI", sortField: "dni" },
                  { label: "TELÉFONO", sortField: "telefono" },
                  { label: "ESTADO", sortField: "activo" },
                  { label: "OBRAS SOCIALES" },
                  { label: "ACCIONES", align: "center" },
                ]}
              >
                {pacientes.map((paciente) => {
                  const coloresAvatar = obtenerColorAvatar(`${paciente.nombre || ""} ${paciente.apellido || ""}`);
                  return (
                  <tr key={paciente.id_paciente} className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-colors">
                    {/* //* COLUMNAS: NOMBRE Y APELLIDO (Foco primario con avatar clínico) */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`hidden md:flex w-9 h-9 rounded-full ${coloresAvatar.bg} ${coloresAvatar.text} border ${coloresAvatar.border} items-center justify-center font-bold text-xs shrink-0 shadow-2xs`}>
                          {paciente.nombre?.charAt(0)}
                          {paciente.apellido?.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-tight">
                          {paciente.nombre} {paciente.apellido}
                        </span>
                      </div>
                    </td>

                    {/* //* COLUMNAS: DNI (Nivel 2: Soporte) */}
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium text-xs">
                      {paciente.dni ? (
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{paciente.dni}</span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 italic">S/D</span>
                      )}
                    </td>

                    {/* //* COLUMNAS: TELEFONO (Nivel 2: Soporte) */}
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300 text-xs font-medium">
                      <div className="flex items-center gap-1.5">
                        <Phone size={14} className="text-teal-600 dark:text-teal-400" />
                        <span>{paciente.telefono || <span className="text-slate-400 dark:text-slate-500 italic">—</span>}</span>
                      </div>
                    </td>

                    {/* //* COLUMNAS: ESTADO */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          paciente.activo
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40"
                            : "bg-rose-50 text-rose-700 border-rose-200/70 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            paciente.activo ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                        />
                        {paciente.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>

                    {/* //* COLUMNA: BADGES DE OBRAS SOCIALES */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {paciente.PacienteObraSocials && paciente.PacienteObraSocials.length > 0 ? (
                          paciente.PacienteObraSocials.map((pos) => (
                            <span
                              key={pos.id_paciente_obra_social || pos.id_obra_social}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/90 dark:border-emerald-800/60 shadow-2xs"
                              title={
                                pos.nro_afiliado ? `N° Afiliado: ${pos.nro_afiliado}` : "Particular / S/N"
                              }
                            >
                              <Shield size={12} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                              <span>{pos.ObraSocial?.nombre || "Obra Social"}</span>
                              {pos.nro_afiliado && (
                                <span className="text-[10px] opacity-75 font-normal border-l border-emerald-300 dark:border-emerald-700 pl-1 ml-0.5">
                                  #{pos.nro_afiliado}
                                </span>
                              )}
                            </span>
                          ))
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shadow-2xs">
                            Particular
                          </span>
                        )}
                      </div>
                    </td>

                    {/* //* COLUMNAS: ACCIONES CON ESTÁNDAR SAAS (VER + MENÚ ···) */}
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setPacienteVer(paciente)}
                          className="p-2 rounded-xl text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                          title="Ver Ficha y Cuenta Corriente"
                        >
                          <Eye size={18} />
                        </button>

                        <BotonAccionesPaciente
                          paciente={paciente}
                          menuAbiertoId={menuAccionesAbiertoId}
                          setMenuAbiertoId={setMenuAccionesAbiertoId}
                          abrirParaEditar={() =>
                            abrirParaEditar(paciente, formatearPacienteParaEditar)
                          }
                          abrirParaAgendarTurno={() =>
                            abrirParaAgendarTurno(paciente)
                          }
                          abrirParaToggle={() => abrirParaToggle(paciente)}
                          abrirParaEliminar={() => abrirParaToggle(paciente)}
                        />
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </Tabla>
            </div>

            {/* //* PAGINACION */}
            <TablaPaginacion
              page={page}
              setPage={setPage}
              totalPages={totalPages}
              total={total}
              inicioRegistro={inicioRegistro}
              finRegistro={finRegistro}
              limit={limit}
              setLimit={setLimit}
            />
          </div>
        </div>

        {/* //* MODALES: CREAR Y EDITAR */}
        {modalAbierto && (
          <FormularioCrearEditar
            guardarPaciente={(e) => {
              if (e && e.preventDefault) e.preventDefault();
              guardarPaciente(datosFormulario, editando, pacienteSeleccionado);
            }}
            modalAbierto={modalAbierto}
            cerrarModal={cerrarModal}
            editando={editando}
            datosFormulario={datosFormulario}
            actualizarDatos={actualizarDatos}
            agregarObraSocialForm={agregarObraSocialForm}
            obrasSocialesLista={obrasSocialesLista}
            actualizarObraSocialForm={actualizarObraSocialForm}
            eliminarObraSocialForm={eliminarObraSocialForm}
          />
        )}

        {/* //* MODALES: TOGGLE */}
        {modalToggle && (
          <FormularioToggle
            modalToggle={modalToggle}
            cerrarModal={cerrarModal}
            pacienteSeleccionado={pacienteSeleccionado}
            togglePaciente={() => togglePaciente(pacienteSeleccionado)}
          />
        )}

        {/* //* MODALES: VER */}
        {pacienteVer && (
          <VistaPaciente isOpen={Boolean(pacienteVer)} onClose={() => setPacienteVer(null)} paciente={pacienteVer} />
        )}
      </div>
    </PageLayout>
  );
}
