/** @format */

import {
  Calendar,
  ListTodo,
  Users,
  Wallet,
  Building2,
  ClipboardCheck,
  Clock,
} from "lucide-react";

export const NAV_LINKS = [
  { to: "/", label: "Agenda", icon: Calendar },
  { to: "/turnos", label: "Turnos", icon: ListTodo },
  { to: "/pacientes", label: "Pacientes", icon: Users },
  { to: "/caja", label: "Caja", icon: Wallet },
  { to: "/practicas", label: "Prácticas", icon: ClipboardCheck },
  { to: "/obras-sociales", label: "Obras Sociales", icon: Building2 },
  { to: "/configuracion/horarios", label: "Horarios", icon: Clock },
];

