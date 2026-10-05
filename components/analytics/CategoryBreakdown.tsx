import React from "react";
import { PieChart } from "lucide-react";
import { CategoryExpense } from "@/services/analytics.service";

interface CategoryBreakdownProps {
  categorias: CategoryExpense[];
}

const CATEGORY_COLORS = [
  "bg-emerald-500",
  "bg-blue-500",
  "bg-purple-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-orange-500",
];

export function CategoryBreakdown({ categorias }: CategoryBreakdownProps) {
  if (categorias.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-xs text-center py-8 text-xs text-zinc-500">
        No hay datos de categorías disponibles.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <PieChart className="w-4 h-4 text-emerald-500" />
          Distribución de Gasto por Categoría
        </h3>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {categorias.length} categorías
        </span>
      </div>

      {/* Multi-segment progress bar */}
      <div className="w-full h-3.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex gap-0.5">
        {categorias.slice(0, 6).map((cat, idx) => (
          <div
            key={cat.categoria}
            style={{ width: `${Math.max(cat.porcentaje, 3)}%` }}
            className={`h-full ${
              CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
            } transition-all`}
            title={`${cat.categoria}: ${cat.porcentaje}%`}
          />
        ))}
      </div>

      {/* Category list items */}
      <div className="space-y-3 pt-1">
        {categorias.slice(0, 6).map((cat, idx) => (
          <div key={cat.categoria} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
                  }`}
                />
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {cat.categoria}
                </span>
                <span className="text-zinc-400 text-[11px]">
                  ({cat.cantidadItems} ítems)
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  ${cat.monto.toLocaleString()}
                </span>
                <span className="text-zinc-500 dark:text-zinc-400 text-[11px] w-10 text-right">
                  {cat.porcentaje}%
                </span>
              </div>
            </div>
            {/* Individual category mini bar */}
            <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                style={{ width: `${cat.porcentaje}%` }}
                className={`h-full rounded-full ${
                  CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
                }`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
