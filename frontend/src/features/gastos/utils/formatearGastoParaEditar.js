/** @format */

import { formatDateInput } from "@/shared/utils";

export const formatearGastoParaEditar = (gasto) => {
  const catId =
    gasto.id_categoria_gasto ||
    gasto.id_categoria ||
    gasto.CategoriaGasto?.id_categoria_gasto ||
    gasto.CategoriaGasto?.id_categoria ||
    "";

  return {
    id_categoria: catId,
    id_categoria_gasto: catId,
    monto: gasto.monto || "",
    fecha_gasto: formatDateInput(gasto.fecha_gasto || gasto.fecha),
    detalle: gasto.detalle || gasto.concepto || "",
    concepto: gasto.concepto || gasto.detalle || "",
  };
};
