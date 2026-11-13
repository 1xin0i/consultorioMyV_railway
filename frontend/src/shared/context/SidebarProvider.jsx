/** @format */

import { createContext, useState } from "react";

export const SidebarContext = createContext();

export function SidebarProvider({ children }) {
  // Inicializa expandido (true) en escritorio
  const [expandido, setExpandido] = useState(true);

  const alternarSidebar = () => setExpandido((prev) => !prev);

  return (
    <SidebarContext.Provider value={{ expandido, setExpandido, alternarSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

