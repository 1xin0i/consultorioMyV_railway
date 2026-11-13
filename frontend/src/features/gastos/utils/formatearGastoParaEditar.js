/** @format */

import { formatDateInput } from "@/shared/utils";

export const formatearGastoParaEditar = (gasto) => ({
  id_categoria: gasto.id_categoria || gasto.CategoriaGasto?.id_categoria || "",
  monto: gasto.monto || "",
  fecha_gasto: formatDateInput(gasto.fecha_gasto),
  detalle: gasto.detalle || "",
});
