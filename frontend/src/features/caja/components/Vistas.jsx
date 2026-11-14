/** @format */

import Tabla from "@/shared/components/ui/Tabla/Tabla";
import TarjetaRegistro from "@/shared/components/ui/Tabla/TarjetaRegistro";
import { formatDate } from "@/shared/utils";
import {
  ArrowUpRight,
  ArrowDownRight,
  Edit,
  Trash2,
  Eye,
  Clock,
  Banknote,
  Calendar,
} from "lucide-react";

export function VistaTodos({
  columnas,
  datos,
  cargando,
  propsPaginacion,
  abrirEditarCobro,
  abrirEliminarCobro,
  formatearCobroParaEditar,
  abrirEditarGasto,
  abrirEliminarGasto,
  formatearGastoParaEditar,
  verDetalleTurno,
}) {
  return (
    <Tabla
      columnas={columnas}
      datos={datos}
      cargando={cargando}
      ordenarPor={propsPaginacion.ordenarPor}
      direccion={propsPaginacion.direccion}
      manejarOrden={propsPaginacion.manejarOrden}
      mensajeVacio="No se registraron movimientos en este período."
      renderTarjeta={(mov) => {
        const esIngreso = mov.tipo === "ingreso";
        return (
          <TarjetaRegistro
            key={mov.uid}
            titulo={mov.concepto}
            subtitulo={formatDate(mov.fecha)}
            badge={
              esIngreso ? (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  <ArrowUpRight size={11} /> Ingreso
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  <ArrowDownRight size={11} /> Egreso
                </span>
              )
            }
            campos={[
              {
                etiqueta: esIngreso ? "Medio de Pago" : "Categoría",
                valor: mov.categoria_o_medio,
              },
              {
                etiqueta: "Monto",
                valor: `${esIngreso ? "+" : "-"} $ ${Number(mov.monto || 0).toLocaleString("es-AR")}`,
              },
            ]}
            acciones={
              esIngreso && mov.id_turno ? (
                verDetalleTurno && (
                  <button
                    onClick={() => verDetalleTurno(mov.id_turno)}
                    className="p-1.5 rounded-xl text-[#0d8266] dark:text-emerald-400 hover:text-[#09664f] hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors cursor-pointer"
                    title="Ver Turno"
                  >
                    <Eye size={17} />
                  </button>
                )
              ) : (
                <>
                  <button
                    onClick={() =>
                      esIngreso
                        ? abrirEditarCobro(mov, formatearCobroParaEditar)
                        : abrirEditarGasto(mov, formatearGastoParaEditar)
                    }
                    className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                    title="Editar"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() =>
                      esIngreso ? abrirEliminarCobro(mov) : abrirEliminarGasto(mov)
                    }
                    className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )
            }
          />
        );
      }}
      renderFila={(mov) => {
        const esIngreso = mov.tipo === "ingreso";
        return (
          <tr
            key={mov.uid}
            className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <td className="pl-7 sm:pl-8 pr-4 py-3.5 text-slate-600 font-medium whitespace-nowrap">
              {formatDate(mov.fecha)}
            </td>

            <td className="px-5 py-3.5">
              {esIngreso ? (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                  <ArrowUpRight size={13} />
                  Ingreso
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                  <ArrowDownRight size={13} />
                  Egreso
                </span>
              )}
            </td>

            <td className="px-5 py-3.5">
              <div className="font-semibold text-slate-800">{mov.concepto}</div>
              {mov.detalle_extra && (
                <div className="text-xs text-slate-500">{mov.detalle_extra}</div>
              )}
            </td>

            <td className="px-5 py-3.5">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
                {mov.categoria_o_medio}
              </span>
            </td>

            <td
              className={`px-5 py-3.5 font-bold whitespace-nowrap ${
                esIngreso ? "text-emerald-700" : "text-rose-600"
              }`}
            >
              {esIngreso ? "+" : "-"} ${" "}
              {Number(mov.monto || 0).toLocaleString("es-AR")}
            </td>

            <td className="pl-4 pr-7 sm:pr-8 py-3.5 text-center">
              <div className="flex justify-center items-center gap-1">
                {esIngreso && mov.id_turno ? (
                  verDetalleTurno && (
                    <button
                      onClick={() => verDetalleTurno(mov.id_turno)}
                      className="p-2 rounded-xl text-[#0d8266] dark:text-emerald-400 hover:text-[#09664f] hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors cursor-pointer"
                      title="Ver Turno"
                    >
                      <Eye size={17} />
                    </button>
                  )
                ) : (
                  <>
                    <button
                      onClick={() =>
                        esIngreso
                          ? abrirEditarCobro(mov, formatearCobroParaEditar)
                          : abrirEditarGasto(mov, formatearGastoParaEditar)
                      }
                      className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40 rounded-xl transition-colors cursor-pointer"
                      title="Editar"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() =>
                        esIngreso
                          ? abrirEliminarCobro(mov)
                          : abrirEliminarGasto(mov)
                      }
                      className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </td>
          </tr>
        );
      }}
    />
  );
}

export function VistaIngresos(props) {
  return <VistaTodos {...props} />;
}

export function VistaGastos({
  columnas,
  datos,
  cargando,
  propsPaginacion,
  abrirParaEditar,
  abrirParaEliminar,
  formatearGastoParaEditar,
}) {
  return (
    <Tabla
      columnas={columnas}
      datos={datos}
      cargando={cargando}
      ordenarPor={propsPaginacion.ordenarPor}
      direccion={propsPaginacion.direccion}
      manejarOrden={propsPaginacion.manejarOrden}
      mensajeVacio="No se registraron gastos en este período."
      renderTarjeta={(gasto) => (
        <TarjetaRegistro
          key={gasto.uid || gasto.id_gasto}
          titulo={gasto.concepto || gasto.detalle || "Gasto"}
          subtitulo={formatDate(gasto.fecha || gasto.fecha_gasto)}
          badge={
            <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
              {gasto.categoria_o_medio || gasto.CategoriaGasto?.nombre}
            </span>
          }
          campos={[
            {
              etiqueta: "Monto",
              valor: `- $ ${Number(gasto.monto || 0).toLocaleString("es-AR")}`,
            },
          ]}
          acciones={
            <>
              <button
                onClick={() => abrirParaEditar(gasto, formatearGastoParaEditar)}
                className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                title="Editar gasto"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => abrirParaEliminar(gasto)}
                className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Eliminar gasto"
              >
                <Trash2 size={16} />
              </button>
            </>
          }
        />
      )}
      renderFila={(gasto) => (
        <tr
          key={gasto.uid || gasto.id_gasto}
          className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <td className="pl-7 sm:pl-8 pr-4 py-3.5 font-medium text-slate-700">
            <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg text-xs font-semibold">
              {gasto.categoria_o_medio || gasto.CategoriaGasto?.nombre}
            </span>
          </td>
          <td className="px-5 py-3.5 text-slate-800 font-medium">
            {gasto.detalle || gasto.concepto || "-"}
          </td>
          <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
            {formatDate(gasto.fecha_gasto || gasto.fecha)}
          </td>
          <td className="px-5 py-3.5 font-bold text-rose-600 whitespace-nowrap">
            - $ {Number(gasto.monto || 0).toLocaleString("es-AR")}
          </td>
          <td className="pl-4 pr-7 sm:pr-8 py-3.5 text-center">
            <div className="flex justify-center items-center gap-1">
              <button
                onClick={() => abrirParaEditar(gasto, formatearGastoParaEditar)}
                className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40 rounded-xl transition-colors cursor-pointer"
                title="Editar gasto"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => abrirParaEliminar(gasto)}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                title="Eliminar gasto"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </td>
        </tr>
      )}
    />
  );
}

export function VistaPendientes({
  datos = [],
  cargando,
  abrirCobrarTurno,
  verDetalleTurno,
}) {
  const COLUMNAS_PENDIENTES = [
    { etiqueta: "Fecha Atención", campo: "fecha_hora_inicio", ordenable: false },
    { etiqueta: "Paciente", campo: "paciente", ordenable: false },
    { etiqueta: "Total Turno", campo: "monto_total", ordenable: false },
    { etiqueta: "Abonado", campo: "monto_abonado", ordenable: false },
    { etiqueta: "Saldo Pendiente", campo: "saldo_pendiente", ordenable: false },
    { etiqueta: "Estado Cuenta", campo: "estado", ordenable: false },
    { etiqueta: "Acción", campo: null, ordenable: false, centrado: true },
  ];

  return (
    <Tabla
      columnas={COLUMNAS_PENDIENTES}
      datos={datos}
      cargando={cargando}
      mensajeVacio="¡Excelente! No hay turnos atendidos con saldo pendiente de cobro."
      renderTarjeta={(t) => {
        const pac = t.Paciente
          ? `${t.Paciente.nombre} ${t.Paciente.apellido}`
          : `Paciente #${t.id_paciente}`;
        const sc = t.SolicitudCobro;
        const total = Number(
          sc?.monto_total ?? sc?.monto_a_cobrar ?? t.precio_final ?? 0,
        );
        const saldo = Number(
          sc?.saldo_pendiente !== undefined ? sc.saldo_pendiente : total,
        );
        const abonado = Math.max(0, Number((total - saldo).toFixed(2)));
        const esParcial = abonado > 0 && saldo > 0;

        return (
          <TarjetaRegistro
            key={t.id_turno}
            titulo={pac}
            subtitulo={`Turno #${t.id_turno} · ${formatDate(t.fecha_hora_inicio)}`}
            badge={
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  esParcial
                    ? "bg-amber-50 text-amber-800 border-amber-300"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                <Clock size={11} />
                {esParcial ? "Pago Parcial" : "Sin Abonar"}
              </span>
            }
            campos={[
              {
                etiqueta: "Total / Abonado",
                valor: `$ ${total.toLocaleString("es-AR")} / $ ${abonado.toLocaleString("es-AR")}`,
              },
              {
                etiqueta: "Saldo Pendiente",
                valor: `$ ${saldo.toLocaleString("es-AR")}`,
              },
            ]}
            acciones={
              <div className="flex items-center gap-1">
                {verDetalleTurno && (
                  <button
                    onClick={() => verDetalleTurno(t.id_turno)}
                    className="p-1.5 rounded-xl text-[#0d8266] dark:text-emerald-400 hover:text-[#09664f] hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors cursor-pointer"
                    title="Ver Turno"
                  >
                    <Eye size={17} />
                  </button>
                )}
                <button
                  onClick={() => abrirCobrarTurno(t)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0d8266] hover:bg-[#09664f] text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                >
                  <Banknote size={14} />
                  <span>Cobrar</span>
                </button>
              </div>
            }
          />
        );
      }}
      renderFila={(t) => {
        const pac = t.Paciente
          ? `${t.Paciente.nombre} ${t.Paciente.apellido}`
          : `Paciente #${t.id_paciente}`;
        const sc = t.SolicitudCobro;
        const total = Number(
          sc?.monto_total ?? sc?.monto_a_cobrar ?? t.precio_final ?? 0,
        );
        const saldo = Number(
          sc?.saldo_pendiente !== undefined ? sc.saldo_pendiente : total,
        );
        const abonado = Math.max(0, Number((total - saldo).toFixed(2)));
        const esParcial = abonado > 0 && saldo > 0;

        return (
          <tr
            key={t.id_turno}
            className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <td className="pl-7 sm:pl-8 pr-4 py-3.5 text-slate-600 font-medium whitespace-nowrap">
              <div className="inline-flex items-center gap-1.5">
                <Calendar size={14} className="text-slate-400" />
                <span>{formatDate(t.fecha_hora_inicio)}</span>
              </div>
            </td>

            <td className="px-5 py-3.5">
              <div className="font-bold text-slate-900">{pac}</div>
              {t.Paciente?.dni && (
                <div className="text-xs text-slate-500">
                  DNI {t.Paciente.dni}
                </div>
              )}
            </td>

            <td className="px-5 py-3.5 font-semibold text-slate-700 whitespace-nowrap">
              $ {total.toLocaleString("es-AR")}
            </td>

            <td className="px-5 py-3.5 font-semibold text-emerald-700 whitespace-nowrap">
              $ {abonado.toLocaleString("es-AR")}
            </td>

            <td className="px-5 py-3.5 font-black text-amber-800 whitespace-nowrap">
              $ {saldo.toLocaleString("es-AR")}
            </td>

            <td className="px-5 py-3.5">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  esParcial
                    ? "bg-amber-50 text-amber-800 border-amber-300"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                <Clock size={12} />
                {esParcial ? "Pago Parcial" : "Pendiente"}
              </span>
            </td>

            <td className="pl-4 pr-7 sm:pr-8 py-3.5 text-center">
              <div className="flex justify-center items-center gap-1.5">
                {verDetalleTurno && (
                  <button
                    onClick={() => verDetalleTurno(t.id_turno)}
                    className="p-2 rounded-xl text-[#0d8266] dark:text-emerald-400 hover:text-[#09664f] hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors cursor-pointer"
                    title="Ver Turno"
                  >
                    <Eye size={17} />
                  </button>
                )}
                <button
                  onClick={() => abrirCobrarTurno(t)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0d8266] hover:bg-[#09664f] text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <Banknote size={14} />
                  <span>Registrar Pago</span>
                </button>
              </div>
            </td>
          </tr>
        );
      }}
    />
  );
}
