"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, ChevronRight, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { PriceVariationItem } from "@/services/analytics.service";

interface PriceAlertsProps {
  subieron: PriceVariationItem[];
  bajaron: PriceVariationItem[];
}

export function PriceAlerts({ subieron, bajaron }: PriceAlertsProps) {
  const [tab, setTab] = useState<"subieron" | "bajaron">("subieron");

  const activeList = tab === "subieron" ? subieron : bajaron;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          Alertas de Variación
        </h3>

        {/* Tab switchers */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTab("subieron")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
              tab === "subieron"
                ? "bg-red-500 text-white shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Subieron ({subieron.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("bajaron")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
              tab === "bajaron"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            Bajaron ({bajaron.length})
          </button>
        </div>
      </div>

      {activeList.length === 0 ? (
        <div className="text-center py-6 text-zinc-500 dark:text-zinc-400 text-xs">
          No hay variaciones registradas en esta categoría para la última compra.
        </div>
      ) : (
        <div className="space-y-2.5">
          {activeList.map((item) => (
            <Link
              key={item.productoId}
              href={`/productos/${item.productoId}`}
              className="group flex items-center justify-between p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-800/30 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
            >
              <div className="min-w-0 pr-3">
                <p className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {item.nombre}
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {item.comercioActual} (${item.precioActual.toLocaleString()}) vs{" "}
                  {item.comercioAnterior} (${item.precioAnterior.toLocaleString()})
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full text-xs font-extrabold ${
                    tab === "subieron"
                      ? "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400"
                      : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                  }`}
                >
                  {tab === "subieron" ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {Math.abs(item.deltaPorcentaje)}%
                </span>
                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
