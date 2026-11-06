//* COMPONENTE USADO PARA BADGE DE ESTADO EN TABLA TURNOS

import { CheckCircle2, Clock, XCircle, UserRoundX } from "lucide-react";

export const estadosMap = {
  Programado: {
    id_estado: 1,
    color: "bg-amber-50 text-amber-700 border-amber-200/80",
    icon: Clock,
  },
  Atendido: {
    id_estado: 2,
    color: "bg-emerald-50 text-[#1b7f5b] border-emerald-200/80",
    icon: CheckCircle2,
  },
  Cancelado: {
    id_estado: 3,
    color: "bg-rose-50 text-rose-700 border-rose-200/80",
    icon: XCircle,
  },
  Inasistente: {
    id_estado: 4,
    label: "Inasistido",
    color: "bg-slate-100 text-slate-700 border-slate-200",
    icon: UserRoundX,
  },
  Inasistido: {
    id_estado: 4,
    label: "Inasistido",
    color: "bg-slate-100 text-slate-700 border-slate-200",
    icon: UserRoundX,
  },
};
