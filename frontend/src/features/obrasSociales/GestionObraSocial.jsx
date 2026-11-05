/** @format */

//* IMPORTACION DE ICONOS Y useEffect
import { Shield, Plus, Edit, Trash2, CheckCircle2, XCircle, RotateCcw, Ban } from "lucide-react";

//* IMPORTACION DE COMPONENTES COMUNES REUTILIZABLES
import Header from "../../components/common/Header";
import Tabla from "../../components/common/Tabla/Tabla";
import TablaHeader from "../../components/common/Tabla/TablaHeader";
import TablaPaginacion from "../../components/common/Tabla/TablaPaginacion";
import { ListaTarjetas, TarjetaRegistro } from "../../components/common/Tabla/TarjetaRegistro";

// * PAGELAYOUT (PARA EL BOTON)
import PageLayout from "../../components/layout/PageLayout";

//* HOOKS
import { useCRUDModal } from "../../hooks/useCRUDModal";
import { usePaginationSearch } from "../../hooks/usePaginationSearch";

// * FUNCIONES PARA FORMATEAR FECHAS
import { formatearObraSocialParaEditar } from "./utils/formatearObraSocialParaEditar";

//* IMPORTACION DE FORMULARIOS
import {
  FormularioCrearEditar,
  FormularioToggle,
  FormularioEliminar,
} from "./components/FormularioObraSocial";
import { useObraSocialActions } from "./hooks/useObraSocialActions";

const ESTADO_INICIAL = { nombre: "" };

export default function GestionObrasSociales() {
  //* CARGAMOS CON DATOS LOS HOOKS
  const {
    datos: obrasSociales,
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
  } = usePaginationSearch("/obras-sociales");

  const {
    modalAbierto,
    modalToggle,
    modalEliminar,
    editando,
    itemSeleccionado: obraSocialSeleccionada,
    datosFormulario,
    abrirParaCrear,
    abrirParaEditar,
    abrirParaToggle,
    abrirParaEliminar,
    cerrarModal,
    actualizarDatos,
  } = useCRUDModal(ESTADO_INICIAL);

  const { guardarObraSocial, toggleObraSocial, eliminarObraSocial } = useObraSocialActions(
    recargar,
    cerrarModal,
  );

  return (
    <PageLayout onAdd={abrirParaCrear}>
      <div className="w-full flex-1 flex flex-col gap-4">
        {/* //* HEADER CON TITULO Y BOTON */}
        <Header
          icono={Shield}
          titulo="Catálogo de Obras Sociales"
          subtitulo="Gestión de coberturas médicas y mutuales del consultorio"
          badge={`${total} Registradas`}
          botonAccion={
            <button
              type="button"
              onClick={abrirParaCrear}
              className="hidden sm:flex items-center justify-center gap-2 bg-[#2eb086] hover:bg-[#259370] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm"
            >
              <Plus size={18} />
              <span>Nueva Obra Social</span>
            </button>
          }
        />

        {/* //* BODY: TABLA */}
        <div className="flex-1 w-full min-h-0 p-4 pt-0 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
            {/* //* TABLA: BARRA SUPERIOR REUTILIZABLE */}
            <TablaHeader
              inicioRegistro={inicioRegistro}
              finRegistro={finRegistro}
              total={total}
              search={search}
              setSearch={(val) => {
                setSearch(val);
                setPage(1);
              }}
              placeholder="Buscar por nombre de obra social..."
            />

            {/* //* TABLA: TABLA */}
            <div className="overflow-x-auto flex-1">
              <Tabla
                cargando={cargando}
                search={search}
                sinDatosText="No se encontraron obras sociales registradas."
                vistaMovil={
                  <ListaTarjetas
                    cargando={cargando}
                    search={search}
                    sinDatosText="No se encontraron obras sociales registradas."
                    page={page}
                    setPage={setPage}
                    totalPages={totalPages}
                  >
                    {obrasSociales.map((os) => (
                      <TarjetaRegistro
                        key={os.id_obra_social}
                        avatar={os.nombre?.charAt(0)}
                        titulo={os.nombre}
                        subtitulo={`#${os.id_obra_social}`}
                        tituloSheet="Opciones de la Obra Social"
                        badge={
                          os.activo ? (
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
                            onClick: () => abrirParaEditar(os, formatearObraSocialParaEditar),
                          },
                          {
                            key: "toggle",
                            label: os.activo ? "Desactivar" : "Reactivar",
                            icon: os.activo ? Ban : RotateCcw,
                            tono: os.activo ? "rojo" : "verde",
                            rapida: true,
                            onClick: () => abrirParaToggle(os),
                          },
                          {
                            key: "eliminar",
                            label: "Eliminar obra social",
                            icon: Trash2,
                            tono: "rojo",
                            separador: true,
                            oculto: os.activo,
                            onClick: () => abrirParaEliminar(os),
                          },
                        ]}
                      >
                        <span className="text-gray-500">Cobertura médica / mutual</span>
                      </TarjetaRegistro>
                    ))}
                  </ListaTarjetas>
                }
                columnas={[
                  { label: "ID", className: "hidden md:table-cell" },
                  { label: "Obra Social" },
                  { label: "Estado" },
                  { label: "Acciones", align: "center" },
                ]}
              >
                {obrasSociales.map((os) => (
                  <tr key={os.id_obra_social} className="hover:bg-emerald-50/40 transition-colors">
                    {/* //* COLUMNAS: ID OBRA SOCIAL */}
                    <td className="hidden md:table-cell px-6 py-4 font-mono font-medium text-teal-700/70 w-24 text-xs">
                      #{os.id_obra_social}
                    </td>

                    {/* //* COLUMNAS: NOMBRE */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="hidden md:flex w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200/90 items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          {os.nombre?.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-900 text-sm tracking-tight">{os.nombre}</span>
                      </div>
                    </td>

                    {/* //* COLUMNAS: ESTADO */}
                    <td className="px-6 py-4">
                      {os.activo ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100/70 text-emerald-800 border border-emerald-200/90 shadow-2xs">
                          <CheckCircle2 size={13} /> Activa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs">
                          <XCircle size={13} /> Inactiva
                        </span>
                      )}
                    </td>

                    {/* //* COLUMNAS: ACCIONES CON COLOR */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => abrirParaEditar(os, formatearObraSocialParaEditar)}
                          className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                          title="Editar Obra Social"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => abrirParaToggle(os)}
                          className={`p-2 rounded-xl hover:scale-105 active:scale-95 transition-all cursor-pointer ${
                            os.activo
                              ? "text-rose-600 hover:bg-rose-50"
                              : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title={os.activo ? "Desactivar Obra Social" : "Reactivar Obra Social"}
                        >
                          {os.activo ? <Ban size={18} /> : <RotateCcw size={18} />}
                        </button>
                        {!os.activo && (
                          <button
                            type="button"
                            onClick={() => abrirParaEliminar(os)}
                            className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                            title="Eliminar Obra Social"
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

            {/* //* PAGINACION */}
            <TablaPaginacion page={page} setPage={setPage} totalPages={totalPages} />
          </div>
        </div>

        {/* //* MODALES: CREAR Y EDITAR */}
        {modalAbierto && (
          <FormularioCrearEditar
            guardarObraSocial={(e) => {
              e.preventDefault();
              guardarObraSocial(datosFormulario, editando, obraSocialSeleccionada);
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
            obraSocialSeleccionada={obraSocialSeleccionada}
            toggleObraSocial={() => toggleObraSocial(obraSocialSeleccionada)}
          />
        )}

        {/* //* MODALES: ELIMINAR */}
        {modalEliminar && (
          <FormularioEliminar
            modalEliminar={modalEliminar}
            cerrarModal={cerrarModal}
            obraSocialSeleccionada={obraSocialSeleccionada}
            eliminarObraSocial={() => eliminarObraSocial(obraSocialSeleccionada)}
          />
        )}
      </div>
    </PageLayout>
  );
}
