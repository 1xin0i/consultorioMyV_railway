/** @format */

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Users, UserPlus, CheckCircle2, XCircle } from "lucide-react";

import Tabla from "@/shared/components/ui/Tabla/Tabla";
import TablaHeader from "@/shared/components/ui/Tabla/TablaHeader";
import TablaPaginacion from "@/shared/components/ui/Tabla/TablaPaginacion";
import TarjetaRegistro from "@/shared/components/ui/Tabla/TarjetaRegistro";
import PageLayout from "@/shared/components/layout/PageLayout";
import { usePaginationSearch } from "@/shared/hooks/usePaginationSearch";
import { useCRUDModal } from "@/shared/hooks/useCRUDModal";
import {
  obtenerColorAvatar,
  obtenerIniciales,
} from "@/shared/utils/avatarColors";

import {
  FormularioCrearEditar,
  FormularioEliminar,
} from "../components/FormulariosPaciente";
import { VistaPaciente } from "../components/VistaPaciente";
import { BotonAccionesPaciente } from "../components/BotonAccionesPaciente";
import { calcularEdad } from "../utils/calcularEdad";
import { formatearPacienteParaEditar } from "../utils/formatearPacienteParaEditar";
import { verificarCompletarPaciente } from "../utils/verificarCompletarPaciente";
import {
  COLUMNAS_TABLA,
  ESTADO_INICIAL_PACIENTE,
} from "../constants/pacienteConstants";
import { useObrasSocialesCatalogo } from "../hooks/useObrasSocialesCatalogo";
import { usePacienteActions } from "../hooks/usePacienteActions";

export function GestionPacientes() {
  const {
    datos: pacientes,
    cargando,
    recargar,
    propsPaginacion,
    filtros,
    actualizarFiltro,
  } = usePaginationSearch("/pacientes", {
    ordenPorDefecto: "id_paciente",
    filtrosIniciales: { activo: "true" },
  });

  const {
    modalCrearEditar,
    modalEliminar,
    modalVer,
    editando,
    itemSeleccionado: pacienteSeleccionado,
    datosFormulario,
    setDatosFormulario,
    abrirParaCrear,
    abrirParaEditar,
    abrirParaEliminar,
    abrirParaVer,
    cerrarModal,
    actualizarDatos,
  } = useCRUDModal(ESTADO_INICIAL_PACIENTE);

  const [idsParaEliminar, setIdsParaEliminar] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    verificarCompletarPaciente(
      searchParams,
      setSearchParams,
      abrirParaEditar,
      formatearPacienteParaEditar,
    );
  }, [searchParams, setSearchParams, abrirParaEditar]);

  const { obrasSocialesCatalogo } = useObrasSocialesCatalogo();

  const { guardarPaciente, cambiarEstadoPaciente } = usePacienteActions(
    recargar,
    cerrarModal,
  );

  const agregarObraSocial = () => {
    setDatosFormulario((prev) => ({
      ...prev,
      obras_sociales: [
        ...(prev.obras_sociales || []),
        { id_obra_social: "", nro_afiliado: "" },
      ],
    }));
  };

  const actualizarObraSocial = (index, campo, valor) => {
    setDatosFormulario((prev) => {
      const nuevasOS = [...(prev.obras_sociales || [])];
      nuevasOS[index][campo] = valor;
      return { ...prev, obras_sociales: nuevasOS };
    });
  };

  const eliminarObraSocial = (index) => {
    const osAEliminar = datosFormulario.obras_sociales[index];

    if (osAEliminar.id_relacion) {
      setIdsParaEliminar((prev) => [...prev, osAEliminar.id_relacion]);
    }

    setDatosFormulario((prev) => ({
      ...prev,
      obras_sociales: prev.obras_sociales.filter((_, i) => i !== index),
    }));
  };

  return (
    <PageLayout
      icono={<Users size={24} />}
      titulo="Directorio de Pacientes"
      subtitulo="Administrá las fichas personales, obras sociales e historial clínico."
      accionesHeader={
        <button
          onClick={() => abrirParaCrear()}
          className="w-full sm:w-auto bg-[#0d8266] hover:bg-[#09664f] text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm font-bold text-xs sm:text-sm cursor-pointer active:scale-95"
        >
          <UserPlus size={18} />
          <span>Nuevo Paciente</span>
        </button>
      }
    >
      <div className="bg-white rounded-2xl shadow-sm border border-teal-100 overflow-hidden flex flex-col">
        <TablaHeader
          busqueda={propsPaginacion.busqueda}
          setBusqueda={propsPaginacion.setBusqueda}
          placeholder="Buscar por nombre, apellido, DNI o teléfono..."
        >
          <div className="flex bg-teal-50/70 p-1 rounded-xl border border-teal-100 w-full sm:w-auto">
            {[
              { id: "true", label: "Activos" },
              { id: "false", label: "Inactivos" },
              { id: "", label: "Todos" },
            ].map((tab) => {
              const activo = (filtros?.activo ?? "true") === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => actualizarFiltro("activo", tab.id)}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activo
                      ? "bg-[#0d8266] text-white shadow-2xs"
                      : "text-teal-800/70 hover:text-teal-950"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </TablaHeader>

        <Tabla
          columnas={COLUMNAS_TABLA}
          datos={pacientes}
          cargando={cargando}
          ordenarPor={propsPaginacion.ordenarPor}
          direccion={propsPaginacion.direccion}
          manejarOrden={propsPaginacion.manejarOrden}
          mensajeVacio="No se encontraron pacientes registrados."
          renderTarjeta={(paciente) => {
            const listaOS =
              paciente.ObraSocials?.map((os) => os.nombre).join(", ") ||
              "Particular";
            return (
              <TarjetaRegistro
                key={paciente.id_paciente}
                inactivo={paciente.activo === false}
                onClick={() => abrirParaVer(paciente)}
                titulo={`${paciente.nombre} ${paciente.apellido}`}
                subtitulo={`DNI: ${paciente.dni || "S/D"} · Tel: ${paciente.telefono || "-"}`}
                badge={
                  paciente.activo !== false ? (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      <CheckCircle2 size={11} /> Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      <XCircle size={11} /> Inactivo
                    </span>
                  )
                }
                campos={[
                  {
                    etiqueta: "Edad",
                    valor: paciente.fecha_nacimiento
                      ? `${calcularEdad(paciente.fecha_nacimiento)} años`
                      : "-",
                  },
                  {
                    etiqueta: "Obra Social",
                    valor: listaOS,
                  },
                ]}
                acciones={
                  <BotonAccionesPaciente
                    paciente={paciente}
                    abrirParaVer={abrirParaVer}
                    abrirParaEditar={abrirParaEditar}
                    abrirParaEliminar={abrirParaEliminar}
                    formatearPacienteParaEditar={formatearPacienteParaEditar}
                  />
                }
              />
            );
          }}
          renderFila={(paciente) => {
            const avatarColor = obtenerColorAvatar(
              `${paciente.nombre} ${paciente.apellido}`,
            );
            const iniciales = obtenerIniciales(
              paciente.nombre,
              paciente.apellido,
            );
            return (
              <tr
                key={paciente.id_paciente}
                onClick={() => abrirParaVer(paciente)}
                className={`hover:bg-teal-50/40 transition-colors cursor-pointer ${
                  paciente.activo === false ? "bg-slate-50/60 opacity-75" : ""
                }`}
              >
                <td className="px-5 py-3.5 text-teal-800/70 font-mono text-xs font-bold">
                  #{paciente.id_paciente}
                </td>

                <td className="px-5 py-3.5 font-bold text-slate-900">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-8 h-8 rounded-full border text-xs font-bold flex items-center justify-center shrink-0 ${avatarColor.bg} ${avatarColor.text} ${avatarColor.border}`}
                    >
                      {iniciales}
                    </span>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span>
                          {paciente.nombre} {paciente.apellido}
                        </span>
                        {paciente.activo === false && (
                          <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded-md font-bold">
                            Inactivo
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-5 py-3.5 text-slate-600 font-medium">
                  {paciente.dni || "-"}
                </td>

                <td className="px-5 py-3.5 text-slate-700 font-semibold">
                  {paciente.telefono || "-"}
                </td>

                <td className="px-5 py-3.5 text-slate-600 font-medium">
                  {paciente.fecha_nacimiento
                    ? `${calcularEdad(paciente.fecha_nacimiento)} años`
                    : "-"}
                </td>

                <td className="px-5 py-3.5 text-slate-600 max-w-[180px] truncate">
                  {paciente.domicilio || "-"}
                </td>

                <td className="px-5 py-3.5 text-slate-600">
                  {paciente.ObraSocials && paciente.ObraSocials.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {paciente.ObraSocials.map((os) => (
                        <span
                          key={os.id_obra_social}
                          className="bg-teal-50 text-teal-900 text-xs font-bold px-2.5 py-0.5 rounded-full border border-teal-200/80"
                          title={`Afiliado N°: ${os.PacientesPorObrasSociales?.nro_afiliado || "S/N"}`}
                        >
                          {os.nombre}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 text-xs italic">
                      Particular
                    </span>
                  )}
                </td>

                <td
                  className="px-5 py-3.5 text-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-center">
                    <BotonAccionesPaciente
                      paciente={paciente}
                      abrirParaVer={abrirParaVer}
                      abrirParaEditar={abrirParaEditar}
                      abrirParaEliminar={abrirParaEliminar}
                      formatearPacienteParaEditar={formatearPacienteParaEditar}
                    />
                  </div>
                </td>
              </tr>
            );
          }}
        />

        <TablaPaginacion {...propsPaginacion} />
      </div>

      <FormularioCrearEditar
        modalAbierto={modalCrearEditar}
        cerrarModal={cerrarModal}
        editando={editando}
        obrasSocialesCatalogo={obrasSocialesCatalogo}
        datosFormulario={datosFormulario}
        actualizarDatos={actualizarDatos}
        agregarObraSocial={agregarObraSocial}
        actualizarObraSocial={actualizarObraSocial}
        eliminarObraSocial={eliminarObraSocial}
        guardarPaciente={(e) => {
          e.preventDefault();
          guardarPaciente(
            datosFormulario,
            editando,
            pacienteSeleccionado,
            idsParaEliminar,
            () => setIdsParaEliminar([]),
          );
        }}
      />

      <FormularioEliminar
        modalEliminar={modalEliminar}
        cerrarModal={cerrarModal}
        pacienteSeleccionado={pacienteSeleccionado}
        ejecutarEliminacion={() => cambiarEstadoPaciente(pacienteSeleccionado)}
      />

      <VistaPaciente
        isOpen={modalVer}
        onClose={cerrarModal}
        paciente={pacienteSeleccionado}
        abrirParaEditar={abrirParaEditar}
        formatearPacienteParaEditar={formatearPacienteParaEditar}
      />
    </PageLayout>
  );
}

export default GestionPacientes;

