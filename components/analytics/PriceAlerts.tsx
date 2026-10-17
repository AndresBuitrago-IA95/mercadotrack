"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, ChevronRight, ArrowUpRight, ArrowDownRight, AlertOctagon } from "lucide-react";
import { PriceVariationItem } from "@/services/analytics.service";

interface PriceAlertsProps {
  subieron: PriceVariationItem[];
  bajaron: PriceVariationItem[];
  alzasHistoricas?: PriceVariationItem[];
}

export function PriceAlerts({ subieron, bajaron, alzasHistoricas = [] }: PriceAlertsProps) {
  const [tab, setTab] = useState<"subieron" | "bajaron" | "historicas">("subieron");

  let activeList = subieron;
  if (tab === "bajaron") activeList = bajaron;
  if (tab === "historicas") activeList = alzasHistoricas;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-red-500" />
            Productos que han Subido de Precio
          </h3>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            Monitor de inflación y aumentos detectados entre tus facturas
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setTab("subieron")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
              tab === "subieron"
                ? "bg-red-500 text-white shadow-xs font-bold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Alzas Recientes ({subieron.length})
          </button>

          {alzasHistoricas.length > 0 && (
            <button
              type="button"
              onClick={() => setTab("historicas")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                tab === "historicas"
                  ? "bg-amber-600 text-white shadow-xs font-bold"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              Histórico ({alzasHistoricas.length})
            </button>
          )}

          <button
            type="button"
            onClick={() => setTab("bajaron")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
              tab === "bajaron"
                ? "bg-emerald-600 text-white shadow-xs font-bold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5" />
            Bajaron ({bajaron.length})
          </button>
        </div>
      </div>

      {activeList.length === 0 ? (
        <div className="text-center py-8 text-zinc-500 dark:text-zinc-400 text-xs bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
          No hay variaciones registradas en este período. Todos los precios se han mantenido estables.
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
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase bg-zinc-200/60 dark:bg-zinc-700/60 px-1.5 py-0.5 rounded-sm">
                    {item.categoria}
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {item.nombre}
                  </p>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                  {item.comercioActual}: antes <strong>${item.precioAnterior.toLocaleString()}</strong> ➔ ahora <strong className="text-zinc-900 dark:text-zinc-100">${item.precioActual.toLocaleString()}</strong>
                  <span className="ml-1 opacity-75">
                    ({item.diferenciaMonto > 0 ? "+" : ""}${item.diferenciaMonto.toLocaleString()})
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full text-xs font-black ${
                    item.deltaPorcentaje > 0
                      ? "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400"
                      : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                  }`}
                >
                  {item.deltaPorcentaje > 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {item.deltaPorcentaje > 0 ? "+" : ""}
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
