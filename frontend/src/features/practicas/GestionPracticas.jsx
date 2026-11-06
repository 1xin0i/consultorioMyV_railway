/** @format */

//* ICONOS
import { FileText, Plus, Edit, Trash2, CheckCircle2, XCircle, RotateCcw, Tag, Ban } from "lucide-react";

//* COMPONENTES COMUNES
import Header from "../../components/common/Header";
import Tabla from "../../components/common/Tabla/Tabla";
import TablaHeader from "../../components/common/Tabla/TablaHeader";
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
  //* HOOK DE PAGINACIÓN
  const {
    datos: practicas,
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
  } = usePaginationSearch("/practicas");

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
        {/* //* HEADER PRINCIPAL */}
        <Header
          icono={FileText}
          titulo="Catálogo de Prácticas"
          subtitulo="Nomenclador de tratamientos, prestaciones y aranceles"
          badge={`${total} Registradas`}
          botonAccion={
            <button
              type="button"
              onClick={abrirParaCrear}
              className="hidden sm:flex items-center justify-center gap-2 bg-[#2eb086] hover:bg-[#259370] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm hover:shadow active:scale-95 shrink-0"
            >
              <Plus size={18} />
              <span>Nueva Práctica</span>
            </button>
          }
        />

        {/* //* BODY: TABLA */}
        <div className="flex-1 w-full min-h-0 p-4 pt-0 flex flex-col gap-4">
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
              placeholder="Buscar practica..."
            />

            {/* //* TABLA: TABLA */}
            <div className="overflow-x-auto flex-1">
              <Tabla
                cargando={cargando}
                search={search}
                sinDatosText="No se encontraron prácticas registradas."
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
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
                              <CheckCircle2 size={13} /> Activa
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200 shrink-0">
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
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg border border-gray-200">
                            <Tag size={12} className="text-[#2eb086]" />
                            {practica.codigo_nomenclador}
                          </span>
                          <span className="text-gray-500">{practica.especialidad}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-dashed border-gray-200">
                          <span className="font-medium text-gray-500">Precio ref.</span>
                          <span className="text-sm font-semibold text-slate-700 tabular-nums">
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
                  { label: "Código" },
                  { label: "Tratamiento" },
                  { label: "Especialidad", className: "hidden md:table-cell" },
                  { label: "Precio Ref." },
                  { label: "Estado" },
                  { label: "Acciones", align: "center" },
                ]}
              >
                {practicas.map((practica) => (
                  <tr key={practica.id_practica} className="hover:bg-emerald-50/40 transition-colors">
                    {/* //* COLUMNAS: CODIGO NOMENCLADOR */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-xs bg-teal-50 text-teal-800 px-2.5 py-1 rounded-lg border border-teal-200/90 shadow-2xs">
                        <Tag size={12} className="text-teal-600" />
                        {practica.codigo_nomenclador}
                      </span>
                    </td>

                    {/* //* COLUMNAS: NOMBRE REFERENCIA */}
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900 text-sm tracking-tight">
                        {practica.nombre_nomenclador}
                      </span>
                      {practica.nombre_referencia && (
                        <span className="hidden md:block text-xs text-slate-500 font-medium mt-0.5">
                          {practica.nombre_referencia}
                        </span>
                      )}
                    </td>

                    {/* //* COLUMNAS: ESPECIALIDAD */}
                    <td className="hidden md:table-cell px-6 py-4 text-slate-700 text-xs font-medium">
                      {practica.especialidad}
                    </td>

                    {/* //* COLUMNAS: PRECIO DE REFERENCIA */}
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-700 text-xs sm:text-sm tabular-nums">
                        ${Number(practica.precio_referencia || 0).toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </td>

                    {/* //* COLUMNAS: ESTADO */}
                    <td className="px-6 py-4">
                      {practica.activo ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100/70 text-emerald-800 border border-emerald-200/90 shadow-2xs">
                          <CheckCircle2 size={13} />
                          <span>Activa</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs">
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
                          className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                          title="Editar Práctica"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => abrirParaToggle(practica)}
                          className={`p-2 rounded-xl hover:scale-105 active:scale-95 transition-all cursor-pointer ${
                            practica.activo
                              ? "text-rose-600 hover:bg-rose-50"
                              : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title={practica.activo ? "Desactivar Práctica" : "Reactivar Práctica"}
                        >
                          {practica.activo ? <Ban size={18} /> : <RotateCcw size={18} />}
                        </button>
                        {!practica.activo && (
                          <button
                            type="button"
                            onClick={() => abrirParaEliminar(practica)}
                            className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
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
            <TablaPaginacion page={page} setPage={setPage} totalPages={totalPages} />
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
