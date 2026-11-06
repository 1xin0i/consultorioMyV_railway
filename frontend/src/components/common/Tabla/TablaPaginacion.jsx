/** @format */
import { ChevronDown } from "lucide-react";

export default function TablaPaginacion({ page, setPage, totalPages }) {
  return (
    <div className="flex items-center justify-between p-3 sm:p-4 pr-18 sm:pr-4 border-t border-gray-100 bg-white">
      <div className="text-xs text-gray-500 font-medium">
        Página {page} de {totalPages || 1}
      </div>
      <div className="flex items-center gap-2">
        <button
          disabled={page <= 1}
          className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-100 transition-all cursor-pointer"
          onClick={() => setPage(page - 1)}
        >
          Anterior
        </button>

        <div className="relative inline-flex items-center">
          <select
            value={page}
            onChange={(e) => setPage(Number(e.target.value))}
            className="appearance-none pl-3 pr-7 py-1.5 sm:py-1.5 bg-[#2eb086] hover:bg-[#259370] text-white rounded-xl text-xs font-semibold shadow-xs focus:outline-none cursor-pointer transition-colors"
          >
            {Array.from({ length: totalPages || 1 }, (_, index) => (
              <option key={index + 1} value={index + 1} className="bg-white text-gray-800">
                {index + 1}
              </option>
            ))}
          </select>
          <ChevronDown size={13} className="absolute right-2 text-white pointer-events-none" />
        </div>

        <button
          disabled={page >= totalPages}
          className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-100 transition-all cursor-pointer"
          onClick={() => setPage(page + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
