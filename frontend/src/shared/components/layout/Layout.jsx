/** @format */

import { Outlet } from "react-router-dom";
import Sidebar from "./Navbar/Sidebar";
import Bottombar from "./Navbar/Bottombar";

export function Layout() {
  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#f9fbfd] dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <main className="flex-1 w-full flex flex-col min-h-0 pb-20 md:pb-0 overflow-hidden">
          <Outlet />
        </main>

        <Bottombar />
      </div>
    </div>
  );
}

export default Layout;
