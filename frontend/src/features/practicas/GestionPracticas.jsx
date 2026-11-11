/** @format */

//* ICONOS
import { useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Tag,
  Ban,
  Search,
  X,
} from "lucide-react";

//* COMPONENTES COMUNES
import Header from "../../components/common/Header";
import Tabla from "../../components/common/Tabla/Tabla";
import TablaPaginacion from "../../components/common/Tabla/TablaPaginacion";
import { ListaTarjetas, TarjetaRegistro } from "../../components/common/Tabla/TarjetaRegistro";

//* PAGELAYOUT (PARA EL BOTON)
import PageLayout from "../../components/layout/PageLayout";

//* HOOKS
import { useCRUDModal } from "../../hooks/useCRUDModal";
import { usePaginationSearch } from "../../hooks/usePaginationSearch";
import { usePracticaActions } from "./hooks/usePracticasActions";

//* FUNCIONES PARA FORMATEAR FECHAS Y UTILIDADES
import { formatearPracticaParaEditar } from "./utils/formatearPracticaParaEditar";

//* CONSTANTES
import { ESTADO_INICIAL } from "./constants/practicaConstants";

//* FORMULARIOS
import {
  FormularioCrearEditar,
  FormularioEliminar,
  FormularioToggle,
} from "./components/FormulariosPractica";

export default function GestionPracticas() {
  //* HOOK DE PAGINACIÓN CON FILTROS, ORDEN Y LÍMITE
  const {
    datos: practicas,
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
  } = usePaginationSearch("/practicas", 9);

  //* ESTADO DE FILTRO POR ESTADO (TODAS/ACTIVAS/INACTIVAS)
  const [filtroEstado, setFiltroEstado] = useState("todas");

  const cambiarFiltroEstado = (nuevoEstado) => {
    setFiltroEstado(nuevoEstado);
    setExtraParams((prev) => ({
      ...prev,
      estadoFiltrado: nuevoEstado === "todas" ? undefined : nuevoEstado,
    }));
  };

  //* HOOK DE CRUD MODAL
  const {
    modalAbierto,
    modalToggle,
    modalEliminar,
    editando,
    itemSeleccionado: practicaSeleccionada,
    datosFormulario,
    abrirParaCrear,
    abrirParaEditar,
    abrirParaToggle,
    abrirParaEliminar,
    cerrarModal,
    actualizarDatos,
  } = useCRUDModal(ESTADO_INICIAL);

  //* HOOK DE PETICIONES API
  const { guardarPractica, togglePractica, eliminarPractica } = usePracticaActions(recargar, cerrarModal);

  return (
    <PageLayout onAdd={abrirParaCrear}>
      <div className="w-full flex-1 flex flex-col gap-4">
        {/* //* HEADER PRINCIPAL: Limpio, blanco, solo título, badge y botón de acción */}
        <Header
          titulo="Catálogo de Prácticas"
          badge={`${total} Registradas`}
          botonAccion={
            <button
              type="button"
              onClick={abrirParaCrear}
              className="hidden sm:flex items-center justify-center gap-2 bg-[#2eb086] hover:bg-[#259370] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm hover:shadow active:scale-95 shrink-0 cursor-pointer"
            >
              <Plus size={18} />
              <span>Nueva Práctica</span>
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
                onClick={() => cambiarFiltroEstado("todas")}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  filtroEstado === "todas"
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>Todas</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    filtroEstado === "todas"
                      ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900"
                      : "bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {total}
                </span>
              </button>

              <button
                type="button"
                onClick={() => cambiarFiltroEstado("activas")}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  filtroEstado === "activas"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span>Activas</span>
              </button>

              <button
                type="button"
                onClick={() => cambiarFiltroEstado("inactivas")}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  filtroEstado === "inactivas"
                    ? "bg-rose-50 text-rose-800 border border-rose-200/80 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
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
                placeholder="Buscar práctica, código..."
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
            {/* //* TABLA: TABLA */}
            <div className="overflow-x-auto flex-1">
              <Tabla
                cargando={cargando}
                search={search}
                sinDatosText="No se encontraron prácticas registradas."
                order={order}
                setOrder={setOrder}
                vistaMovil={
                  <ListaTarjetas
                    cargando={cargando}
                    search={search}
                    sinDatosText="No se encontraron prácticas registradas."
                    page={page}
                    setPage={setPage}
                    totalPages={totalPages}
                  >
                    {practicas.map((practica) => (
                      <TarjetaRegistro
                        key={practica.id_practica}
                        titulo={practica.nombre_nomenclador}
                        subtitulo={practica.nombre_referencia}
                        tituloSheet="Opciones de la Práctica"
                        badge={
                          practica.activo ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 shrink-0">
                              <CheckCircle2 size={13} /> Activa
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700 shrink-0">
                              <XCircle size={13} /> Inactiva
                            </span>
                          )
                        }
                        acciones={[
                          {
                            key: "editar",
                            label: "Editar",
                            icon: Edit,
                            tono: "azul",
                            rapida: true,
                            onClick: () => abrirParaEditar(practica, formatearPracticaParaEditar),
                          },
                          {
                            key: "toggle",
                            label: practica.activo ? "Desactivar" : "Reactivar",
                            icon: practica.activo ? Ban : RotateCcw,
                            tono: practica.activo ? "rojo" : "verde",
                            rapida: true,
                            onClick: () => abrirParaToggle(practica),
                          },
                          {
                            key: "eliminar",
                            label: "Eliminar práctica",
                            icon: Trash2,
                            tono: "rojo",
                            separador: true,
                            oculto: practica.activo,
                            onClick: () => abrirParaEliminar(practica),
                          },
                        ]}
                      >
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-xs bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-700">
                            <Tag size={12} className="text-[#2eb086]" />
                            {practica.codigo_nomenclador}
                          </span>
                          <span className="text-gray-500 dark:text-slate-400">{practica.especialidad}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-dashed border-gray-200 dark:border-slate-800">
                          <span className="font-medium text-gray-500 dark:text-slate-400">Precio ref.</span>
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                            $
                            {Number(practica.precio_referencia).toLocaleString("es-AR", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </TarjetaRegistro>
                    ))}
                  </ListaTarjetas>
                }
                columnas={[
                  { label: "CÓDIGO", sortField: "codigo_nomenclador" },
                  { label: "TRATAMIENTO / PRÁCTICA", sortField: "nombre_nomenclador" },
                  { label: "ESPECIALIDAD", sortField: "especialidad", className: "hidden md:table-cell" },
                  { label: "PRECIO REF.", sortField: "precio_referencia" },
                  { label: "ESTADO", sortField: "activo" },
                  { label: "ACCIONES", align: "center" },
                ]}
              >
                {practicas.map((practica) => (
                  <tr key={practica.id_practica} className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-colors">
                    {/* //* COLUMNAS: CODIGO NOMENCLADOR */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-xs bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 px-2.5 py-1 rounded-lg border border-teal-200/90 dark:border-teal-800/60 shadow-2xs">
                        <Tag size={12} className="text-teal-600 dark:text-teal-400" />
                        {practica.codigo_nomenclador}
                      </span>
                    </td>

                    {/* //* COLUMNAS: NOMBRE REFERENCIA */}
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-tight">
                        {practica.nombre_nomenclador}
                      </span>
                      {practica.nombre_referencia && (
                        <span className="hidden md:block text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                          {practica.nombre_referencia}
                        </span>
                      )}
                    </td>

                    {/* //* COLUMNAS: ESPECIALIDAD */}
                    <td className="hidden md:table-cell px-6 py-4 text-slate-700 dark:text-slate-300 text-xs font-medium">
                      {practica.especialidad}
                    </td>

                    {/* //* COLUMNAS: PRECIO DE REFERENCIA */}
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs sm:text-sm tabular-nums">
                        ${Number(practica.precio_referencia || 0).toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </td>

                    {/* //* COLUMNAS: ESTADO */}
                    <td className="px-6 py-4">
                      {practica.activo ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/90 dark:border-emerald-800/60 shadow-2xs">
                          <CheckCircle2 size={13} />
                          <span>Activa</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shadow-2xs">
                          <XCircle size={13} />
                          <span>Inactiva</span>
                        </span>
                      )}
                    </td>

                    {/* //* COLUMNAS: ACCIONES CON COLOR */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => abrirParaEditar(practica, formatearPracticaParaEditar)}
                          className="p-2 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                          title="Editar Práctica"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => abrirParaToggle(practica)}
                          className={`p-2 rounded-xl hover:scale-105 active:scale-95 transition-all cursor-pointer ${
                            practica.activo
                              ? "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                              : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                          }`}
                          title={practica.activo ? "Desactivar Práctica" : "Reactivar Práctica"}
                        >
                          {practica.activo ? <Ban size={18} /> : <RotateCcw size={18} />}
                        </button>
                        {!practica.activo && (
                          <button
                            type="button"
                            onClick={() => abrirParaEliminar(practica)}
                            className="p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                            title="Eliminar Práctica"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </Tabla>
            </div>

            {/* //* TABLA: PAGINACION */}
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
            guardarPractica={(e) => {
              e.preventDefault();
              guardarPractica(datosFormulario, editando, practicaSeleccionada);
            }}
            modalAbierto={modalAbierto}
            cerrarModal={cerrarModal}
            editando={editando}
            datosFormulario={datosFormulario}
            actualizarDatos={actualizarDatos}
          />
        )}

        {/* //* MODALES: TOGGLE */}
        {modalToggle && (
          <FormularioToggle
            modalToggle={modalToggle}
            cerrarModal={cerrarModal}
            practicaSeleccionada={practicaSeleccionada}
            togglePractica={() => togglePractica(practicaSeleccionada)}
          />
        )}

        {/* //* MODALES: ELIMINAR */}
        {modalEliminar && (
          <FormularioEliminar
            modalEliminar={modalEliminar}
            cerrarModal={cerrarModal}
            practicaSeleccionada={practicaSeleccionada}
            eliminarPractica={() => eliminarPractica(practicaSeleccionada)}
          />
        )}
      </div>
    </PageLayout>
  );
}
