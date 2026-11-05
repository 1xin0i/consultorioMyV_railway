/** @format */

//* useSearchParams E ICONOS
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom"; // * PARA PERMITIR COMPLETAR PACIENTE DESDE AGENDA
import { Users, Plus, Edit, Phone, Ban, RotateCcw, Eye, Shield } from "lucide-react";

//* COMPONENTES COMUNES
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
import { usePacienteActions } from "./hooks/usePacienteActions";
import { useObrasSocialesCatalogo } from "./hooks/useObrasSocialesCatalogo";

//* FUNCIONES PARA FORMATEAR FECHAS Y UTILIDADES
import { formatearPacienteParaEditar } from "./utils/formatearPacienteParaEditar.js";

//* CONSTANTES
import { ESTADO_INICIAL } from "./constants/pacienteConstants.js";

// * FORMULARIOS
import { FormularioCrearEditar, FormularioToggle } from "./components/FormulariosPaciente";
import { verificarCompletarPaciente } from "./utils/verificarCompletarPaciente.js";
import { VistaPaciente } from "./components/VistaPaciente.jsx";

export default function GestionPacientes() {
  const [searchParams, setSearchParams] = useSearchParams();

  //* HOOK DE PAGINACIÓN
  const {
    datos: pacientes,
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
  } = usePaginationSearch("/pacientes");

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
        {/* //* HEADER PRINCIPAL */}
        <Header
          icono={Users}
          titulo="Gestión de Pacientes"
          subtitulo="Administración de historias clínicas, datos personales y coberturas"
          badge={`${total} Registrados`}
          botonAccion={
            <button
              type="button"
              onClick={abrirParaCrear}
              className="hidden sm:flex items-center justify-center gap-2 bg-[#2eb086] hover:bg-[#259370] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm shrink-0"
            >
              <Plus size={18} />
              <span>Nuevo Paciente</span>
            </button>
          }
        />

        {/* //* BODY: TABLA */}
        <div className="flex-1 w-full min-h-0 p-4 pt-0 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
            {/* //* TABLA: HEADER */}
            {/* // TODO: VER SI PLACEHOLDER EN BUSCAR PACIENTE? O LE AGREGAMOS LOS CAMPOS? */}
            <TablaHeader
              inicioRegistro={inicioRegistro}
              finRegistro={finRegistro}
              total={total}
              search={search}
              setSearch={(val) => {
                setSearch(val);
                setPage(1);
              }}
              placeholder="Buscar pacientes..."
            />

            {/* //* TABLA: TABLA */}
            <div className="overflow-x-auto flex-1">
              <Tabla
                cargando={cargando}
                search={search}
                sinDatosText="No se encontraron pacientes registrados."
                vistaMovil={
                  <ListaTarjetas
                    cargando={cargando}
                    search={search}
                    sinDatosText="No se encontraron pacientes registrados."
                    page={page}
                    setPage={setPage}
                    totalPages={totalPages}
                  >
                    {pacientes.map((paciente) => (
                      <TarjetaRegistro
                        key={paciente.id_paciente}
                        avatar={`${paciente.nombre?.charAt(0) || ""}${paciente.apellido?.charAt(0) || ""}`}
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
                            label: "Editar",
                            icon: Edit,
                            tono: "azul",
                            rapida: true,
                            onClick: () => abrirParaEditar(paciente, formatearPacienteParaEditar),
                          },
                          {
                            key: "toggle",
                            label: paciente.activo ? "Desactivar paciente" : "Reactivar paciente",
                            icon: paciente.activo ? Ban : RotateCcw,
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
                    ))}
                  </ListaTarjetas>
                }
                columnas={[
                  { label: "Paciente" },
                  { label: "DNI" },
                  { label: "Teléfono" },
                  { label: "Obras Sociales" },
                  { label: "Acciones", align: "center" },
                ]}
              >
                {pacientes.map((paciente) => (
                  <tr key={paciente.id_paciente} className="hover:bg-emerald-50/40 transition-colors">
                    {/* //* COLUMNAS: NOMBRE Y APELLIDO (Foco primario con avatar clínico) */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="hidden md:flex w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200/90 items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          {paciente.nombre?.charAt(0)}
                          {paciente.apellido?.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-900 text-sm tracking-tight">
                          {paciente.nombre} {paciente.apellido}
                        </span>
                      </div>
                    </td>

                    {/* //* COLUMNAS: DNI (Nivel 2: Soporte) */}
                    <td className="px-6 py-4 text-slate-700 font-medium text-xs">
                      {paciente.dni ? (
                        <span className="font-semibold text-slate-800">{paciente.dni}</span>
                      ) : (
                        <span className="text-slate-400 italic">S/D</span>
                      )}
                    </td>

                    {/* //* COLUMNAS: TELEFONO (Nivel 2: Soporte) */}
                    <td className="px-6 py-4 text-slate-700 text-xs font-medium">
                      <div className="flex items-center gap-1.5">
                        <Phone size={14} className="text-teal-600" />
                        <span>{paciente.telefono || <span className="text-slate-400 italic">—</span>}</span>
                      </div>
                    </td>

                    {/* //* COLUMNA: BADGES DE OBRAS SOCIALES */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {paciente.PacienteObraSocials && paciente.PacienteObraSocials.length > 0 ? (
                          paciente.PacienteObraSocials.map((pos) => (
                            <span
                              key={pos.id_paciente_obra_social || pos.id_obra_social}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-100/70 text-emerald-800 border border-emerald-200/90 shadow-2xs"
                              title={
                                pos.nro_afiliado ? `N° Afiliado: ${pos.nro_afiliado}` : "Particular / S/N"
                              }
                            >
                              <Shield size={12} className="shrink-0 text-emerald-600" />
                              <span>{pos.ObraSocial?.nombre || "Obra Social"}</span>
                              {pos.nro_afiliado && (
                                <span className="text-[10px] opacity-75 font-normal border-l border-emerald-300 pl-1 ml-0.5">
                                  #{pos.nro_afiliado}
                                </span>
                              )}
                            </span>
                          ))
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs">
                            Particular
                          </span>
                        )}
                      </div>
                    </td>

                    {/* //* COLUMNAS: ACCIONES CON COLOR FUNCIONAL */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPacienteVer(paciente)}
                          className="p-2 rounded-xl text-teal-600 hover:bg-teal-50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                          title="Ver Ficha y Cuenta Corriente"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => abrirParaEditar(paciente, formatearPacienteParaEditar)}
                          className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                          title="Editar Paciente"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => abrirParaToggle(paciente)}
                          className={`p-2 rounded-xl hover:scale-105 active:scale-95 transition-all cursor-pointer ${
                            paciente.activo
                              ? "text-rose-600 hover:bg-rose-50"
                              : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title={paciente.activo ? "Desactivar Paciente" : "Reactivar Paciente"}
                        >
                          {paciente.activo ? <Ban size={18} /> : <RotateCcw size={18} />}
                        </button>
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
            guardarPaciente={(e) => {
              e.preventDefault();
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
