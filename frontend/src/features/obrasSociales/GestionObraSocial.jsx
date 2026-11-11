/** @format */

import { useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";

//* IMPORTACION DE COMPONENTES COMUNES REUTILIZABLES
import Header from "../../components/common/Header";
import Tabla from "../../components/common/Tabla/Tabla";
import TablaPaginacion from "../../components/common/Tabla/TablaPaginacion";
import {
  ListaTarjetas,
  TarjetaRegistro,
} from "../../components/common/Tabla/TarjetaRegistro";
import PageLayout from "../../components/layout/PageLayout";
import api from "../../services/api";

//* HOOKS
import { useCRUDModal } from "../../hooks/useCRUDModal";
import { usePaginationSearch } from "../../hooks/usePaginationSearch";

//* FORMULARIOS Y ACCIONES
import {
  FormularioCrearEditar,
  FormularioEliminar,
} from "./components/FormularioObraSocial";
import { useObraSocialActions } from "./hooks/useObraSocialActions";

const ESTADO_INICIAL = { nombre: "", codigo_prestador: "" };

export default function GestionObrasSociales() {
  const {
    datos: obrasSociales,
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
  } = usePaginationSearch("/obras-sociales", 9);

  //* ESTADO DE FILTRO POR ESTADO (TODAS/ACTIVAS/INACTIVAS)
  const [filtroEstado, setFiltroEstado] = useState("todas");

  const cambiarFiltroEstado = (nuevoEstado) => {
    setFiltroEstado(nuevoEstado);
    setExtraParams((prev) => ({
      ...prev,
      estadoFiltrado: nuevoEstado === "todas" ? undefined : nuevoEstado,
    }));
  };

  //* TOGGLE SWITCH EN TIEMPO REAL
  const toggleEstadoEnTiempoReal = async (os) => {
    try {
      await api.put(`/obras-sociales/${os.id_obra_social}`, {
        activo: !os.activo,
      });
      toast.success(
        os.activo
          ? `Obra social "${os.nombre}" desactivada`
          : `Obra social "${os.nombre}" activada`
      );
      recargar();
    } catch (err) {
      console.error(err);
      toast.error("No se pudo cambiar el estado.");
    }
  };

  //* GESTIÓN DE MODALES CRUD (CREAR, EDITAR, ELIMINAR)
  const {
    modalAbierto,
    modalEliminar,
    editando,
    itemSeleccionado,
    datosFormulario,
    abrirParaCrear,
    abrirParaEditar,
    abrirParaEliminar,
    cerrarModal,
    actualizarDatos,
  } = useCRUDModal(ESTADO_INICIAL);

  const { guardarObraSocial, eliminarObraSocial } = useObraSocialActions(
    recargar,
    cerrarModal
  );

  const formatearObraSocialParaEditar = (os) => ({
    nombre: os.nombre || "",
    codigo_prestador: os.codigo_prestador || "",
  });

  // Generador de paleta sutil para avatares con iniciales
  const obtenerColorAvatar = (nombre = "") => {
    const hash = (nombre || "")
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colores = [
      {
        bg: "bg-teal-50 dark:bg-teal-950/60",
        text: "text-[#0d8266] dark:text-emerald-300",
        border: "border-teal-200/80 dark:border-teal-800/60",
      },
      {
        bg: "bg-sky-50 dark:bg-sky-950/60",
        text: "text-sky-600 dark:text-sky-300",
        border: "border-sky-200/80 dark:border-sky-800/60",
      },
      {
        bg: "bg-emerald-50 dark:bg-emerald-950/60",
        text: "text-emerald-700 dark:text-emerald-300",
        border: "border-emerald-200/80 dark:border-emerald-800/60",
      },
      {
        bg: "bg-indigo-50 dark:bg-indigo-950/60",
        text: "text-indigo-600 dark:text-indigo-300",
        border: "border-indigo-200/80 dark:border-indigo-800/60",
      },
    ];
    return colores[hash % colores.length];
  };

  return (
    <PageLayout onAdd={abrirParaCrear}>
      <div className="w-full flex-1 flex flex-col gap-4">
        {/* //* HEADER CON TITULO, BADGE Y BOTÓN NUEVA OBRA SOCIAL */}
        <Header
          titulo="Obras Sociales y Prepagas"
          badge={`${total} Registradas`}
          botonAccion={
            <button
              type="button"
              onClick={abrirParaCrear}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0d8266] hover:bg-[#0b6f57] text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
            >
              <Plus size={15} />
              <span>Nueva Obra Social</span>
            </button>
          }
        />

        {/* //* TOOLBAR CON FILTROS EN CÁPSULA Y BUSCADOR */}
        <div className="w-full px-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* LADO IZQUIERDO: Filtros por estado en cápsula */}
            <div className="bg-gray-100/80 dark:bg-slate-800/80 p-1 rounded-xl inline-flex items-center gap-1 overflow-x-auto">
              <button
                type="button"
                onClick={() => cambiarFiltroEstado("todas")}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  filtroEstado === "todas"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span>Todas</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    filtroEstado === "todas"
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {total}
                </span>
              </button>

              <button
                type="button"
                onClick={() => cambiarFiltroEstado("activas")}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  filtroEstado === "activas"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span>Activas</span>
              </button>

              <button
                type="button"
                onClick={() => cambiarFiltroEstado("inactivas")}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  filtroEstado === "inactivas"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <span>Inactivas</span>
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
                placeholder="Buscar por nombre o código..."
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

        {/* //* CONTENEDOR TABLA */}
        <div className="flex-1 w-full min-h-0 px-4 flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
            <div className="overflow-x-auto flex-1">
              <Tabla
                cargando={cargando}
                search={search}
                sinDatosText="No se encontraron obras sociales registradas."
                order={order}
                setOrder={setOrder}
                vistaMovil={
                  <ListaTarjetas
                    cargando={cargando}
                    search={search}
                    sinDatosText="No se encontraron obras sociales registradas."
                    page={page}
                    setPage={setPage}
                    totalPages={totalPages}
                  >
                    {obrasSociales.map((os) => {
                      const coloresAvatar = obtenerColorAvatar(os.nombre || "OS");
                      return (
                        <TarjetaRegistro
                          key={os.id_obra_social}
                          avatar={os.nombre?.charAt(0).toUpperCase()}
                          avatarClassName={`${coloresAvatar.bg} ${coloresAvatar.text} border ${coloresAvatar.border}`}
                          titulo={os.nombre}
                          subtitulo={
                            os.codigo_prestador
                              ? `Cód. Prestador: ${os.codigo_prestador}`
                              : "Sin código asignado"
                          }
                          tituloSheet="Opciones de la Obra Social"
                          badge={
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0 ${
                                os.activo
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                                  : "bg-gray-100 text-gray-500 border-gray-200"
                              }`}
                            >
                              {os.activo ? "Activa" : "Inactiva"}
                            </span>
                          }
                          acciones={[
                            {
                              key: "editar",
                              label: "Editar obra social",
                              icon: Edit,
                              tono: "azul",
                              rapida: true,
                              onClick: () =>
                                abrirParaEditar(
                                  os,
                                  formatearObraSocialParaEditar
                                ),
                            },
                            {
                              key: "eliminar",
                              label: "Eliminar obra social",
                              icon: Trash2,
                              tono: "rojo",
                              rapida: true,
                              onClick: () => abrirParaEliminar(os),
                            },
                          ]}
                        >
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Users size={14} className="text-slate-400" />
                            <span>
                              {os.pacientes_count === 1
                                ? "1 paciente registrado"
                                : `${os.pacientes_count || 0} pacientes registrados`}
                            </span>
                          </div>
                        </TarjetaRegistro>
                      );
                    })}
                  </ListaTarjetas>
                }
                columnas={[
                  { label: "OBRA SOCIAL / PREPAGA", sortField: "nombre" },
                  {
                    label: "CÓDIGO DE PRESTADOR",
                    sortField: "codigo_prestador",
                  },
                  { label: "PACIENTES ASOCIADOS" },
                  { label: "ESTADO", sortField: "activo" },
                  { label: "ACCIONES", align: "center" },
                ]}
              >
                {obrasSociales.map((os) => {
                  const coloresAvatar = obtenerColorAvatar(os.nombre || "OS");
                  return (
                    <tr
                      key={os.id_obra_social}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* //* COLUMNA 1: OBRA SOCIAL / PREPAGA (Avatar clínico + Nombre) */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`hidden md:flex w-9 h-9 rounded-full ${coloresAvatar.bg} ${coloresAvatar.text} border ${coloresAvatar.border} items-center justify-center font-bold text-xs shrink-0 shadow-2xs`}
                          >
                            {os.nombre ? os.nombre.charAt(0).toUpperCase() : "O"}
                          </div>
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-tight">
                            {os.nombre}
                          </span>
                        </div>
                      </td>

                      {/* //* COLUMNA 2: CÓDIGO DE PRESTADOR */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        {os.codigo_prestador ? (
                          <span className="font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                            {os.codigo_prestador}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic">
                            —
                          </span>
                        )}
                      </td>

                      {/* //* COLUMNA 3: PACIENTES ASOCIADOS */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Users
                            size={14}
                            className="text-slate-400 dark:text-slate-500 shrink-0"
                          />
                          <span>
                            {os.pacientes_count === 1
                              ? "1 paciente registrado"
                              : `${os.pacientes_count || 0} pacientes registrados`}
                          </span>
                        </div>
                      </td>

                      {/* //* COLUMNA 4: ESTADO (Switch interactivo en tiempo real) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleEstadoEnTiempoReal(os)}
                            title={
                              os.activo
                                ? "Haga clic para desactivar"
                                : "Haga clic para activar"
                            }
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-2xs ${
                              os.activo
                                ? "bg-[#0d8266]"
                                : "bg-slate-300 dark:bg-slate-700"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                os.activo ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </button>
                          <span
                            className={`text-xs font-semibold ${
                              os.activo
                                ? "text-emerald-700 dark:text-emerald-400"
                                : "text-slate-400 dark:text-slate-500"
                            }`}
                          >
                            {os.activo ? "Activa" : "Inactiva"}
                          </span>
                        </div>
                      </td>

                      {/* //* COLUMNA 5: ACCIONES (Botón Edit azul + Botón Trash2 rojo) */}
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              abrirParaEditar(
                                os,
                                formatearObraSocialParaEditar
                              )
                            }
                            className="p-2 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                            title="Editar obra social"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={() => abrirParaEliminar(os)}
                            className="p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                            title="Eliminar obra social"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </Tabla>
            </div>

            {/* //* PAGINACIÓN INFERIOR */}
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

        {/* //* MODAL: CREAR Y EDITAR */}
        {modalAbierto && (
          <FormularioCrearEditar
            guardarObraSocial={(e) => {
              e.preventDefault();
              guardarObraSocial(datosFormulario, editando, itemSeleccionado);
            }}
            modalAbierto={modalAbierto}
            cerrarModal={cerrarModal}
            editando={editando}
            datosFormulario={datosFormulario}
            actualizarDatos={actualizarDatos}
          />
        )}

        {/* //* MODAL: ELIMINAR */}
        {modalEliminar && (
          <FormularioEliminar
            modalEliminar={modalEliminar}
            cerrarModal={cerrarModal}
            obraSocialSeleccionada={itemSeleccionado}
            eliminarObraSocial={() => eliminarObraSocial(itemSeleccionado)}
          />
        )}
      </div>
    </PageLayout>
  );
}
