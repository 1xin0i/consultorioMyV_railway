/** @format */

import { Outlet } from "react-router-dom";
import Sidebar from "./Navbar/Sidebar";
import Bottombar from "./Navbar/Bottombar";

export function Layout() {
  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full bg-[#e6f3ef] dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <main className="flex-1 w-full pb-20 md:pb-0">
          <Outlet />
        </main>

        <Bottombar />
      </div>
    </div>
  );
}

export default Layout;

