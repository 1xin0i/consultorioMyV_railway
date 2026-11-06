/** @format */
//* useState y useMemo
import { useState, useMemo, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";

//* ICONOS
import {
  Wallet,
  Plus,
  Minus,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  X,
  Banknote,
  Receipt,
  CheckCircle2,
} from "lucide-react";

//* COMPONENTES COMUNES
import Header from "../../components/common/Header";
import PageLayout from "../../components/layout/PageLayout";
import TablaPaginacion from "../../components/common/Tabla/TablaPaginacion";
import Modal from "../../components/common/Modal";
import api from "../../services/api";

//* COMPONENTES DE VISTA
import {
  VistaCronologica,
  VistaLibroMayor,
  VistaPendientes,
} from "./components/Vistas";

//* HOOKS
import { useMovimientosCaja } from "./hooks/useMovimientosCaja";

//* HOOKS Y FORMULARIOS GASTOS
import { useCRUDModal } from "../../hooks/useCRUDModal";
import { useCategoriasGastosCatalogo } from "../gastos/hooks/useCategoriasGastosCatalogo";
import { useGastoActions } from "../gastos/hooks/useGastoActions";
import { FormularioCrearEditar as FormularioGasto } from "../gastos/components/FormulariosGasto";

//* HOOKS Y FORMULARIOS COBROS
import { FormularioCrearEditarCobro as FormularioCobro } from "../cobros/components/FormulariosCobro";
import { useCobroActions } from "../cobros/hooks/useCobroActions";
import { useCajaSearchPagination } from "./hooks/useCajaSearchPagination";

//* CONSTANTES
import {
  ESTADO_INICIAL_COBRO,
  ESTADO_INICIAL_GASTO,
} from "./constants/cajaConstants";
import { Kpis } from "./components/Kpis";

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export default function GestionCaja() {
  //* VARIABLES GENERALES
  const [vistaActiva, setVistaActiva] = useState("cronologico"); // 'cronologico' | 'mayor' | 'pendientes'
  const [categoriaAbierta, setCategoriaAbierta] = useState(null);
  const [menuFlotanteAbierto, setMenuFlotanteAbierto] = useState(false);
  const [cuotaParaCobrar, setCuotaParaCobrar] = useState(null);
  const [metodoPagoCuota, setMetodoPagoCuota] = useState("Efectivo");
  const [procesandoCobroCuota, setProcesandoCobroCuota] = useState(false);

  const location = useLocation();

  //* HOOK DE PAGINACIÓN Y FILTRADO POR PERÍODO
  const {
    cobros,
    gastos,
    turnosPendientes,
    cuotasPendientes,
    totalesBackend,

    mes,
    anio,
    modoAnual,
    mesAnterior,
    mesSiguiente,
    irAMesActual,
    cambiarMes,
    cambiarAnio,
    setModoAnual,
    toggleModoAnual,

    pageCobro,
    setPageCobro,
    totalPagesCobro,
    pageGasto,
    setPageGasto,
    totalPagesGasto,

    search,
    setSearch,

    recargar,
  } = useCajaSearchPagination();

  //* HOOK DE CRUD MODAL GASTO
  const {
    modalAbierto: modalGastoAbierto,
    datosFormulario: datosGasto,
    abrirParaCrear: abrirParaCrearGasto,
    cerrarModal: cerrarModalGasto,
    actualizarDatos: actualizarDatosGasto,
  } = useCRUDModal(ESTADO_INICIAL_GASTO);

  //* HOOK DE CRUD MODAL COBRO
  const {
    modalAbierto: modalCobroAbierto,
    datosFormulario: datosCobro,
    abrirParaCrear: abrirParaCrearCobro,
    cerrarModal: cerrarModalCobro,
    actualizarDatos: actualizarDatosCobro,
  } = useCRUDModal(ESTADO_INICIAL_COBRO);

  //* HOOK DE CATEGORIAS PARA GASTOS
  const { categorias, recargarCategorias } = useCategoriasGastosCatalogo();

  //* HOOK DE CALCULOS
  const { kpis, movimientosUnificados } = useMovimientosCaja(
    cobros,
    gastos,
    turnosPendientes,
    search,
    cuotasPendientes,
    totalesBackend,
  );

  //* HOOK DE PETICIONES API
  const { guardarGasto } = useGastoActions(recargar, () => cerrarModalGasto());
  const { guardarCobro } = useCobroActions(recargar, () => cerrarModalCobro());

  //* ABRIR MODAL PARA COBRAR UN TURNO
  const abrirCobroParaTurno = useCallback(
    (turno) => {
      actualizarDatosCobro({
        ...ESTADO_INICIAL_COBRO,
        id_paciente: turno.id_paciente,
        id_turno: turno.id_turno,
        monto_a_cobrar: turno.precio_final || "",
      });
      abrirParaCrearCobro(turno);
    },
    [actualizarDatosCobro, abrirParaCrearCobro],
  );

  useEffect(() => {
    if (location.state?.turnoParaCobrar) {
      abrirCobroParaTurno(location.state.turnoParaCobrar);
    }
  }, [location.state, abrirCobroParaTurno]);

  //* CONFIRMAR COBRO DE UNA CUOTA PENDIENTE
  const confirmarCobroCuota = async (e) => {
    e.preventDefault();
    if (!cuotaParaCobrar) return;
    setProcesandoCobroCuota(true);
    try {
      const montoACobrar =
        Number(cuotaParaCobrar.monto_cuota) -
        (Number(cuotaParaCobrar.monto_cobrado) || 0);

      await api.patch(`/cuotas/${cuotaParaCobrar.id_cuota}/cobrar`, {
        monto_cobrado: montoACobrar,
        metodo_pago: metodoPagoCuota,
        estado: "Pagada",
        fecha_cobro: new Date().toISOString(),
      });

      setCuotaParaCobrar(null);
      recargar();
    } catch (error) {
      console.error("Error al cobrar cuota:", error);
      alert("No se pudo registrar el cobro de la cuota.");
    } finally {
      setProcesandoCobroCuota(false);
    }
  };

  //* MAPEA LOS EGRESOS POR CATEGORIAS
  const egresosPorCategoria = useMemo(() => {
    const mapa = {};
    gastos.forEach((g) => {
      const catNombre = g.CategoriaGasto?.nombre || "Sin Categoría";
      if (!mapa[catNombre]) {
        mapa[catNombre] = { nombre: catNombre, total: 0, items: [] };
      }
      mapa[catNombre].total += Number(g.monto) || 0;
      mapa[catNombre].items.push(g);
    });
    return Object.values(mapa);
  }, [gastos]);

  // Verificar si estamos viendo el mes corriente
  const fechaHoy = new Date();
  const esMesActual =
    !modoAnual &&
    mes === fechaHoy.getMonth() + 1 &&
    anio === fechaHoy.getFullYear();

  const labelPeriodo = modoAnual ? `Año ${anio}` : `${MESES[mes - 1]} ${anio}`;

  const totalPendientesCount =
    (turnosPendientes?.length || 0) + (cuotasPendientes?.length || 0);

  return (
    <PageLayout>
      <div className="w-full flex-1 flex flex-col gap-4">
        {/* //* HEADER PRINCIPAL */}
        <Header
          icono={Wallet}
          titulo="Balance del Periodo"
          subtitulo="Consolidado de ingresos, egresos operativos y cuentas por cobrar"
          botonAccion={
            <div className="hidden sm:flex items-center gap-2">
              <button
                type="button"
                onClick={abrirParaCrearGasto}
                className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white px-3.5 py-2 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer"
              >
                <Plus size={16} />
                <span>Nuevo Gasto</span>
              </button>

              <button
                type="button"
                onClick={abrirParaCrearCobro}
                className="flex items-center gap-1.5 bg-[#2eb086] hover:bg-[#259370] text-white px-3.5 py-2 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer"
              >
                <Plus size={16} />
                <span>Registrar Cobro</span>
              </button>
            </div>
          }
        />

        <div className="w-full px-4 flex flex-col gap-4">
          {/* //* BARRA DE SELECTOR DE PERÍODO (MES O AÑO) */}
          <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-[#2eb086]" />
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Período:
              </span>

              {modoAnual ? (
                <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1">
                  <span className="text-xs font-bold text-gray-500">Año:</span>
                  <select
                    value={anio}
                    onChange={(e) => cambiarAnio(e.target.value)}
                    className="bg-transparent font-black text-xs text-gray-800 focus:outline-none cursor-pointer"
                  >
                    {[2024, 2025, 2026, 2027, 2028].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] font-bold bg-[#e8f7f1] text-[#2eb086] px-2 py-0.5 rounded-md ml-1">
                    Año Completo
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {/* Selector de Mes con Flechas */}
                  <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-1.5 py-1">
                    <button
                      type="button"
                      onClick={mesAnterior}
                      aria-label="Mes anterior"
                      className="p-1 hover:bg-white rounded-lg transition-colors text-gray-600 hover:text-gray-900 cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    <select
                      value={mes}
                      onChange={(e) => cambiarMes(e.target.value)}
                      className="bg-transparent font-bold text-xs text-gray-800 focus:outline-none cursor-pointer px-1"
                    >
                      {MESES.map((m, idx) => (
                        <option key={m} value={idx + 1}>
                          {m}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={mesSiguiente}
                      aria-label="Mes siguiente"
                      className="p-1 hover:bg-white rounded-lg transition-colors text-gray-600 hover:text-gray-900 cursor-pointer"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  {/* Selector de Año Separado */}
                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1">
                    <select
                      value={anio}
                      onChange={(e) => cambiarAnio(e.target.value)}
                      className="bg-transparent font-bold text-xs text-gray-800 focus:outline-none cursor-pointer"
                    >
                      {[2024, 2025, 2026, 2027, 2028].map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {modoAnual ? (
                anio !== fechaHoy.getFullYear() && (
                  <button
                    type="button"
                    onClick={() => cambiarAnio(fechaHoy.getFullYear())}
                    className="text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300/80 px-3 py-1.5 rounded-xl shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                  >
                    Volver a este año
                  </button>
                )
              ) : (
                !esMesActual && (
                  <button
                    type="button"
                    onClick={irAMesActual}
                    className="text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300/80 px-3 py-1.5 rounded-xl shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                  >
                    Volver a este mes
                  </button>
                )
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleModoAnual}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  modoAnual
                    ? "bg-[#2eb086] text-white shadow-2xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {modoAnual ? "Ver por Mes" : "Ver Todo el Año"}
              </button>
            </div>
          </div>

          {/* //* BODY: KPIS (METRICAS PARA VER EL RENDIMINETO) */}
          <Kpis kpis={kpis} periodoLabel={labelPeriodo} />

          {/* //* VISTAS: BARRA DE VISTAS */}
          <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-2xs flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex bg-gray-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
              <button
                type="button"
                onClick={() => setVistaActiva("cronologico")}
                className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  vistaActiva === "cronologico"
                    ? "bg-white text-gray-800 shadow-2xs"
                    : "text-gray-500"
                }`}
              >
                Detalle de Operaciones
              </button>
              <button
                type="button"
                onClick={() => setVistaActiva("mayor")}
                className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  vistaActiva === "mayor"
                    ? "bg-white text-gray-800 shadow-2xs"
                    : "text-gray-500"
                }`}
              >
                Detalle de Egresos
              </button>
              <button
                type="button"
                onClick={() => setVistaActiva("pendientes")}
                className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  vistaActiva === "pendientes"
                    ? "bg-white text-gray-800 shadow-2xs"
                    : "text-gray-500"
                }`}
              >
                Por Cobrar ({totalPendientesCount})
              </button>
            </div>

            <div className="relative w-full md:w-64">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Buscar movimiento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#2eb086]/40 focus:outline-none"
              />
            </div>
          </div>

          {/* //* VISTAS: CRONOLOGICA */}
          {vistaActiva === "cronologico" && (
            <div className="flex flex-col gap-4">
              <VistaCronologica movimientosUnificados={movimientosUnificados} />

              <TablaPaginacion
                page={pageCobro}
                setPage={setPageCobro}
                totalPages={totalPagesCobro}
              />
            </div>
          )}

          {/* //* VISTA: LIBRO MAYOR (EGRESOS POR CATEGORÍA) */}
          {vistaActiva === "mayor" && (
            <div className="flex flex-col gap-4">
              <VistaLibroMayor
                egresosPorCategoria={egresosPorCategoria}
                categoriaAbierta={categoriaAbierta}
                setCategoriaAbierta={setCategoriaAbierta}
              />

              <TablaPaginacion
                page={pageGasto}
                setPage={setPageGasto}
                totalPages={totalPagesGasto}
              />
            </div>
          )}

          {/* //* VISTAS: PENDIENTES (Turnos sin cobrar + Cuotas adeudadas hasta hoy) */}
          {vistaActiva === "pendientes" && (
            <div className="flex flex-col gap-4">
              <VistaPendientes
                turnosPendientes={turnosPendientes}
                cuotasPendientes={cuotasPendientes}
                abrirCobroParaTurno={abrirCobroParaTurno}
                abrirCobroParaCuota={(cuota) => {
                  setCuotaParaCobrar(cuota);
                  setMetodoPagoCuota("Efectivo");
                }}
              />
            </div>
          )}
        </div>

        {/* //* BOTÓN FLOTANTE (FAB) PARA TELÉFONO CON MENÚ DE COBRO / GASTO */}
        <div className="fixed sm:hidden right-4 bottom-20 z-40 flex flex-col items-end gap-2">
          {/* Overlay oscuro suave al abrir el menú flotante */}
          {menuFlotanteAbierto && (
            <div
              className="fixed inset-0 bg-black/30 backdrop-blur-xs -z-10 animate-fade-in"
              onClick={() => setMenuFlotanteAbierto(false)}
            />
          )}

          {/* Opciones del Speed Dial */}
          {menuFlotanteAbierto && (
            <div className="flex flex-col items-end gap-2.5 mb-1 animate-in fade-in slide-in-from-bottom-3 duration-200">
              <button
                type="button"
                onClick={() => {
                  setMenuFlotanteAbierto(false);
                  abrirParaCrearCobro();
                }}
                className="flex items-center gap-2 bg-[#2eb086] text-white px-3.5 py-2 rounded-full shadow-lg text-xs font-bold transition-transform active:scale-95 cursor-pointer"
              >
                <span>Registrar Cobro</span>
                <span className="bg-white/20 p-1 rounded-full">
                  <Banknote size={15} />
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuFlotanteAbierto(false);
                  abrirParaCrearGasto();
                }}
                className="flex items-center gap-2 bg-rose-500 text-white px-3.5 py-2 rounded-full shadow-lg text-xs font-bold transition-transform active:scale-95 cursor-pointer"
              >
                <span>Nuevo Gasto</span>
                <span className="bg-white/20 p-1 rounded-full">
                  <Receipt size={15} />
                </span>
              </button>
            </div>
          )}

          {/* Botón Principal Flotante (+) */}
          <button
            type="button"
            onClick={() => setMenuFlotanteAbierto((prev) => !prev)}
            aria-label="Agregar cobro o gasto"
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xl text-white transition-all transform active:scale-95 cursor-pointer ${
              menuFlotanteAbierto
                ? "bg-gray-800 rotate-45"
                : "bg-[#2eb086] hover:bg-[#259370]"
            }`}
          >
            {menuFlotanteAbierto ? <Plus size={24} /> : <Plus size={24} />}
          </button>
        </div>

        {/* //* MODAL RÁPIDO PARA COBRAR CUOTA PENDIENTE */}
        {cuotaParaCobrar && (
          <Modal
            isOpen={Boolean(cuotaParaCobrar)}
            onClose={() => setCuotaParaCobrar(null)}
            title="Registrar Cobro de Cuota"
            subtitle={`Cuota #${cuotaParaCobrar.nro_cuota} de ${
              cuotaParaCobrar.Cobro?.Paciente
                ? `${cuotaParaCobrar.Cobro.Paciente.apellido}, ${cuotaParaCobrar.Cobro.Paciente.nombre}`
                : "Paciente"
            }`}
          >
            <form onSubmit={confirmarCobroCuota} className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex justify-between items-center">
                <span className="text-xs font-bold text-emerald-800">
                  Monto a cobrar:
                </span>
                <span className="text-lg font-black text-emerald-700">
                  $
                  {(
                    Number(cuotaParaCobrar.monto_cuota) -
                    (Number(cuotaParaCobrar.monto_cobrado) || 0)
                  ).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Método de Pago
                </label>
                <select
                  value={metodoPagoCuota}
                  onChange={(e) => setMetodoPagoCuota(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#2eb086]/30 cursor-pointer"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCuotaParaCobrar(null)}
                  disabled={procesandoCobroCuota}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={procesandoCobroCuota}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2eb086] hover:bg-[#259370] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <CheckCircle2 size={16} />
                  <span>
                    {procesandoCobroCuota
                      ? "Registrando..."
                      : "Confirmar Cobro"}
                  </span>
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* //* MODALES: CREAR GASTO */}
        {modalGastoAbierto && (
          <FormularioGasto
            modalAbierto={modalGastoAbierto}
            cerrarModal={cerrarModalGasto}
            datosFormulario={datosGasto}
            actualizarDatos={actualizarDatosGasto}
            categorias={categorias}
            recargarCategorias={recargarCategorias}
            guardarGasto={(e) => {
              e.preventDefault();
              guardarGasto(datosGasto, false, null);
            }}
          />
        )}

        {/* //* MODALES: CREAR COBRO */}
        {modalCobroAbierto && (
          <FormularioCobro
            modalAbierto={modalCobroAbierto}
            cerrarModal={cerrarModalCobro}
            datosFormulario={datosCobro}
            actualizarDatos={actualizarDatosCobro}
            turnosAtendidos={turnosPendientes}
            guardarCobro={(e) => {
              e.preventDefault();
              guardarCobro(datosCobro, false, null);
            }}
          />
        )}
      </div>
    </PageLayout>
  );
}
