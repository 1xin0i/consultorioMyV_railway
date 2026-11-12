/** @format */

import {
  CalendarDays,
  Calendar,
  CalendarClock,
  Users,
  Wallet,
  Shield,
  FileText,
  SlidersHorizontal,
} from "lucide-react";

/**
 * Rutas principales de la barra de navegación (Sidebar en desktop, Bottombar en mobile).
 */
export const NAV_ITEMS = [
  {
    to: "/",
    label: "Agenda Diaria",
    labelCorto: "Agenda",
    Icon: CalendarDays,
    IconMobile: Calendar,
  },
  {
    to: "/turnos",
    label: "Turnos",
    labelCorto: "Turnos",
    Icon: CalendarClock,
    IconMobile: CalendarClock,
  },
  {
    to: "/pacientes",
    label: "Pacientes",
    labelCorto: "Pacientes",
    Icon: Users,
    IconMobile: Users,
  },
  {
    to: "/caja",
    label: "Cobros y Gastos",
    labelCorto: "Cobros y Gastos",
    Icon: Wallet,
    IconMobile: Wallet,
  },
];

/**
 * Rutas del menú de Configuración / Maestros.
 */
export const CONFIG_ITEMS = [
  {
    to: "/configuracion/obras-sociales",
    label: "Obras Sociales",
    Icon: Shield,
  },
  {
    to: "/configuracion/practicas",
    label: "Prácticas",
    Icon: FileText,
  },
  {
    to: "/configuracion/horarios",
    label: "Ajustes",
    Icon: SlidersHorizontal,
  },
];
