/** @format */

import {
  CalendarDays,
  CalendarClock,
  Users,
  Wallet,
  Building2,
  ClipboardCheck,
  Clock,
  Settings,
  Tag,
} from "lucide-react";

export const NAV_LINKS = [
  { to: "/", label: "Agenda Diaria", icon: CalendarDays },
  { to: "/turnos", label: "Turnos", icon: CalendarClock },
  { to: "/pacientes", label: "Pacientes", icon: Users },
  { to: "/caja", label: "Ingresos y Egresos", icon: Wallet },
  {
    label: "Configuración",
    icon: Settings,
    children: [
      { to: "/practicas", label: "Prácticas", icon: ClipboardCheck },
      { to: "/obras-sociales", label: "Obras Sociales", icon: Building2 },
      { to: "/categorias-gastos", label: "Categorías de Gastos", icon: Tag },
      { to: "/configuracion/horarios", label: "Horarios y disponibilidad", icon: Settings },
    ],
  },
];
