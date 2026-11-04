/** @format */
import { useEffect } from "react";
import Modal from "../../../components/common/Modal";
import { CheckCircle2, Coins } from "lucide-react";

export function FormularioCrearEditarCobro({
  modalAbierto,
  cerrarModal,
  datosFormulario,
  actualizarDatos,
  procesarFormulario,
}) {
  const montoTotal = Number(datosFormulario?.monto_a_cobrar) || 0;
  // Soporta tanto monto_abonado como entrega_inicial para evitar fallos de lectura
  const valorAbonadoRaw = datosFormulario?.monto_abonado ?? datosFormulario?.entrega_inicial ?? "";
  const montoAbonado = Number(valorAbonadoRaw) || 0;
  const saldoRestante = Math.max(0, montoTotal - montoAbonado);
  const modalidadActual = datosFormulario?.modalidad || "inmediato";
  const metodoPagoActual = datosFormulario?.metodo_pago || "Efectivo";

  // Asegura la inicialización inmediata de campos requeridos al abrir el modal
  useEffect(() => {
    if (modalAbierto) {
      if (!datosFormulario?.modalidad) {
        actualizarDatos({ target: { name: "modalidad", value: "inmediato" } });
      }
      if (!datosFormulario?.metodo_pago) {
        actualizarDatos({ target: { name: "metodo_pago", value: "Efectivo" } });
      }
      if (
        (datosFormulario?.modalidad === "inmediato" || !datosFormulario?.modalidad) &&
        montoTotal > 0 &&
        !datosFormulario?.monto_abonado
      ) {
        actualizarDatos({ target: { name: "monto_abonado", value: String(montoTotal) } });
        actualizarDatos({ target: { name: "entrega_inicial", value: String(montoTotal) } });
      }
    }
  }, [modalAbierto, montoTotal]);

  // Sincroniza ambos nombres (monto_abonado y entrega_inicial) para compatibilidad
  const setMontoPago = (valor) => {
    actualizarDatos({ target: { name: "monto_abonado", value: valor } });
    actualizarDatos({ target: { name: "entrega_inicial", value: valor } });
  };

  const seleccionarModalidad = (tipo) => {
    if (tipo === "inmediato") {
      actualizarDatos({ target: { name: "modalidad", value: "inmediato" } });
      setMontoPago(String(montoTotal));
    } else {
      actualizarDatos({ target: { name: "modalidad", value: "informal" } });
      setMontoPago("");
    }
  };

  return (
    <Modal
      isOpen={modalAbierto}
      onClose={cerrarModal}
      width="max-w-lg"
      title={`Cobro de Atención - Turno #${datosFormulario?.id_turno || ""}`}
    >
      <form onSubmit={procesarFormulario} className="flex flex-col gap-4">
        {/* Panel Resumen de la Deuda */}
        <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Acordado
            </span>
            <span className="text-xl font-extrabold text-slate-800">
              ${montoTotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Saldo Restante
            </span>
            <span
              className={`text-xl font-extrabold ${
                saldoRestante > 0 ? "text-amber-600" : "text-emerald-600"
              }`}
            >
              ${saldoRestante.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Selector de Modalidad */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            Tipo de Pago *
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => seleccionarModalidad("inmediato")}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                modalidadActual === "inmediato"
                  ? "border-[#2eb086] bg-[#2eb086]/10 text-[#2eb086] shadow-xs"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <CheckCircle2 size={16} />
              <span>Pago Total</span>
            </button>

            <button
              type="button"
              onClick={() => seleccionarModalidad("informal")}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                modalidadActual === "informal"
                  ? "border-[#2eb086] bg-[#2eb086]/10 text-[#2eb086] shadow-xs"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Coins size={16} />
              <span>Acuerdo Libre</span>
            </button>
          </div>
        </div>

        {/* Input de Monto */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            {modalidadActual === "inmediato" ? "Monto a Cobrar" : "Monto de la Entrega Hoy"} *
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-gray-400 font-bold">$</span>
            <input
              type="text"
              inputMode="decimal"
              name="monto_abonado"
              value={valorAbonadoRaw}
              disabled={modalidadActual === "inmediato"}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || /^[0-9]*[.,]?[0-9]*$/.test(val)) {
                  setMontoPago(val);
                }
              }}
              placeholder="0.00"
              required={modalidadActual === "inmediato"}
              className={`w-full pl-8 pr-4 py-2.5 border rounded-xl font-bold text-base focus:outline-none transition-all ${
                modalidadActual === "inmediato"
                  ? "bg-gray-100 border-gray-200 text-gray-700 cursor-not-allowed"
                  : "bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-[#2eb086]/40 focus:border-[#2eb086]"
              }`}
            />
          </div>
          <span className="text-[11px] text-gray-500 mt-1 block">
            {modalidadActual === "inmediato"
              ? "Se registrará el pago completo del tratamiento."
              : montoAbonado > 0
              ? `Pago a cuenta: quedarán adeudados $${saldoRestante.toLocaleString("es-AR")}.`
              : "Si no entrega dinero ahora, quedará pendiente por cobrar sin sumar ingresos en caja."}
          </span>
        </div>

        {/* Selector de Método de Pago */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Método de Pago *
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { valor: "Efectivo", label: "Efectivo" },
              { valor: "Transferencia", label: "Transferencia" },
              { valor: "Tarjeta", label: "Tarjeta / Débito" },
            ].map(({ valor, label }) => {
              const seleccionado =
                (metodoPagoActual || "").toLowerCase() === valor.toLowerCase() ||
                (valor === "Tarjeta" && /debit|tarjeta/i.test(metodoPagoActual || ""));

              return (
                <button
                  key={valor}
                  type="button"
                  onClick={() =>
                    actualizarDatos({ target: { name: "metodo_pago", value: valor } })
                  }
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    seleccionado
                      ? "border-[#2eb086] bg-[#2eb086]/10 text-[#2eb086]"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-gray-100 my-2" />

        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            onClick={cerrarModal}
            className="px-4 py-2 rounded-xl text-gray-600 bg-gray-100 hover:bg-gray-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl text-white bg-[#2eb086] hover:bg-[#259370] text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            {montoAbonado > 0 ? "Confirmar Ingreso" : "Guardar sin Cobro"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ─── SUBCOMPONENTES DE APOYO ─────────────────── */

function SelectorModalidad({ titulo, descripcion, activa, onClick, Icono, esAmber }) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer p-3 rounded-2xl border transition-all ${
        activa
          ? esAmber
            ? "border-amber-500 bg-amber-50/40 ring-1 ring-amber-500 shadow-sm"
            : "border-[#2eb086] bg-[#e8f7f1]/40 ring-1 ring-[#2eb086] shadow-sm"
          : "border-gray-200 bg-white hover:bg-gray-50"
      }`}
    >
      <div className="flex items-center gap-1.5 font-bold text-xs text-gray-800 mb-1">
        <Icono size={16} className={esAmber ? "text-amber-600" : "text-[#2eb086]"} />
        <span>{titulo}</span>
      </div>
      <p className="text-[11px] text-gray-500 leading-snug">{descripcion}</p>
    </div>
  );
}

function DetalleInmediato({ datosFormulario, actualizarDatos }) {
  const costoTotal = Number(datosFormulario.monto_a_cobrar) || 0;

  return (
    <div className="bg-gray-50/70 p-3.5 rounded-2xl border border-gray-200/80 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
          <CreditCard size={15} className="text-[#2eb086]" />
          3. Detalle del Pago Inmediato
        </h4>
        <span className="text-xs font-bold bg-[#e8f7f1] text-[#2eb086] px-3 py-1 rounded-full border border-[#2eb086]/30 w-fit">
          Monto Fijo: ${costoTotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Monto a Cobrar (Fijo) *</label>
          <input
            type="number"
            step="0.01"
            name="monto_a_cobrar"
            value={datosFormulario.monto_a_cobrar}
            readOnly
            className="w-full border border-gray-200 p-2.5 rounded-xl text-xs sm:text-sm bg-gray-100 text-gray-700 font-bold cursor-not-allowed select-none"
            title="El monto corresponde a lo acordado para el turno y se cancela en un pago único"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Forma de Pago *</label>
          <select
            name="metodo_pago"
            value={datosFormulario.metodo_pago || "Efectivo"}
            onChange={actualizarDatos}
            className="w-full border border-gray-300 p-2.5 rounded-xl text-xs sm:text-sm bg-white focus:ring-2 focus:ring-[#2eb086]/50 font-medium text-gray-800"
          >
            <option value="Efectivo">Efectivo</option>
            <option value="Transferencia">Transferencia</option>
            <option value="Tarjeta">Tarjeta Débito/Crédito</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
      </div>

      <p className="text-xs text-gray-500 italic bg-white p-2.5 rounded-xl border border-gray-100">
        ℹ️ Se cancelará la totalidad de la deuda pactada (<strong>${costoTotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</strong>) en un único pago, dejando el turno al día.
      </p>
    </div>
  );
}



function DetalleInformal({ datosFormulario, actualizarDatos }) {
  const costoTotal = Number(datosFormulario.monto_a_cobrar) || 0;
  const entregaInicial = Number(datosFormulario.entrega_inicial) || 0;
  const saldoPendiente = Math.max(0, costoTotal - entregaInicial);

  return (
    <div className="bg-gray-50/70 p-3.5 rounded-2xl border border-gray-200/80 space-y-3">
      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
        <FileText size={15} className="text-amber-600" />
        3. Costo Acordado y Entrega Inicial
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Costo Acordado Total *</label>
          <input
            type="number"
            step="0.01"
            name="monto_a_cobrar"
            value={datosFormulario.monto_a_cobrar}
            onChange={actualizarDatos}
            placeholder="0.00"
            required
            className="w-full border border-gray-300 p-2.5 rounded-xl text-xs sm:text-sm bg-white focus:ring-2 focus:ring-amber-500/50"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Entrega Inicial / Seña (Opcional)
          </label>
          <input
            type="number"
            step="0.01"
            name="entrega_inicial"
            value={datosFormulario.entrega_inicial}
            onChange={actualizarDatos}
            placeholder="0.00"
            className="w-full border border-gray-300 p-2.5 rounded-xl text-xs sm:text-sm bg-white focus:ring-2 focus:ring-amber-500/50"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Método de Pago *</label>
          <select
            name="metodo_pago"
            value={datosFormulario.metodo_pago || "Efectivo"}
            onChange={actualizarDatos}
            className="w-full border border-gray-300 p-2.5 rounded-xl text-xs sm:text-sm bg-white focus:ring-2 focus:ring-amber-500/50 font-medium text-gray-800"
          >
            <option value="Efectivo">Efectivo</option>
            <option value="Transferencia">Transferencia</option>
            <option value="Tarjeta">Tarjeta Débito/Crédito</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 bg-white p-3 rounded-xl border border-gray-200 text-center">
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase block">Costo Total</span>
          <span className="text-xs sm:text-sm font-bold text-gray-800">${costoTotal.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase block">Entrega Inicial</span>
          <span className="text-xs sm:text-sm font-bold text-emerald-600">${entregaInicial.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase block">Saldo Pendiente</span>
          <span className="text-xs sm:text-sm font-bold text-amber-600">${saldoPendiente.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

export function FormularioEliminarCobro({
  modalEliminar,
  cerrarModal,
  cobroSeleccionado,
  ejecutarEliminacion,
}) {
  return (
    <Modal isOpen={modalEliminar} onClose={cerrarModal} width="max-w-md" title="Desactivar Registro de Cobro">
      <div className="flex flex-col gap-3">
        <p className="text-xs sm:text-sm text-gray-600">
          ¿Estás seguro de que deseas desactivar el cobro con ID{" "}
          <strong className="text-gray-800">#{cobroSeleccionado?.id_cobro}</strong>? El registro dejará de
          figurar en el listado activo.
        </p>
      </div>

      <div className="border-t border-gray-200 my-4" />

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={cerrarModal}
          className="px-4 py-2 rounded-xl text-gray-600 bg-gray-100 hover:bg-gray-200 font-medium text-xs sm:text-sm"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={ejecutarEliminacion}
          className="px-4 py-2 rounded-xl text-white bg-red-500 hover:bg-red-600 font-semibold text-xs sm:text-sm transition-colors shadow-sm"
        >
          Sí, Desactivar
        </button>
      </div>
    </Modal>
  );
}
