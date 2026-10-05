import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Store } from "lucide-react";
import { SavingsOpportunity } from "@/services/analytics.service";

interface SavingsOpportunitiesProps {
  oportunidades: SavingsOpportunity[];
}

export function SavingsOpportunities({ oportunidades }: SavingsOpportunitiesProps) {
  if (oportunidades.length === 0) {
    return null;
  }

  return (
    <div className="bg-linear-to-br from-emerald-500/10 via-teal-500/5 to-transparent rounded-2xl p-5 border border-emerald-500/20 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500 text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Oportunidades de Ahorro Inteligente
          </h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
          {oportunidades.length} sugerencias
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {oportunidades.slice(0, 4).map((op) => (
          <Link
            key={op.productoId}
            href={`/productos/${op.productoId}`}
            className="group block p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all shadow-xs"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 transition-colors">
                  {op.nombre}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                  <Store className="w-3 h-3" />
                  <span>
                    Costó <strong>${op.precioActual.toLocaleString()}</strong> en {op.comercioActual}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="inline-block text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                  -{op.ahorroPorcentaje}%
                </span>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px]">
              <span className="text-zinc-600 dark:text-zinc-400">
                Mejor precio: <strong>${op.precioMinimoHistorico.toLocaleString()}</strong> en{" "}
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {op.comercioMinimo}
                </span>
              </span>
              <span className="text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 flex items-center gap-0.5">
                Ver <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
