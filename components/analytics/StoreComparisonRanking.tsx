"use client";

import React from "react";
import Link from "next/link";
import { Store, Trophy, CheckCircle, ArrowRight, ShieldCheck, ShoppingCart } from "lucide-react";
import { StoreRankItem } from "@/services/analytics.service";

interface StoreComparisonRankingProps {
  ranking: StoreRankItem[];
}

export function StoreComparisonRanking({ ranking }: StoreComparisonRankingProps) {
  if (ranking.length === 0) {
    return null;
  }

  const cheapestStore = ranking.find((r) => r.esMasBarato) || ranking[0];

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-6 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Store className="w-5 h-5 text-emerald-600" />
            ¿En qué supermercado es más barato?
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Comparativa de precios y competitividad por cadena de supermercado
          </p>
        </div>
        <Link
          href="/productos"
          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
        >
          Ver catálogo completo <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Best Store Champion Banner */}
      {cheapestStore && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 border border-emerald-300 dark:border-emerald-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                  Supermercado Más Económico
                </span>
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Mejor precio promedio
                </span>
              </div>
              <h4 className="text-lg font-black text-zinc-900 dark:text-zinc-100 mt-0.5">
                {cheapestStore.comercioNombre}
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Precio unitario promedio:{" "}
                <strong className="text-emerald-700 dark:text-emerald-400">
                  ${cheapestStore.precioPromedioUnitario.toLocaleString()}
                </strong>{" "}
                en {cheapestStore.productosUnicos} productos registrados
              </p>
            </div>
          </div>

          <div className="text-right sm:text-right shrink-0">
            <span className="text-[11px] text-zinc-400">Total gastado en esta cadena</span>
            <p className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
              ${cheapestStore.totalGastado.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Store Ranking Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-zinc-400 uppercase font-semibold text-[10px] border-b border-zinc-100 dark:border-zinc-800">
              <th className="py-2.5 px-3">Posición / Cadena</th>
              <th className="py-2.5 px-3 text-right">Facturas</th>
              <th className="py-2.5 px-3 text-right">Productos</th>
              <th className="py-2.5 px-3 text-right">Precio Promedio</th>
              <th className="py-2.5 px-3 text-right">Total Gastado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {ranking.map((s, idx) => (
              <tr
                key={s.comercioId}
                className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
              >
                <td className="py-3 px-3 font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                      idx === 0
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span>{s.comercioNombre}</span>
                  {s.esMasBarato && (
                    <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 rounded-sm">
                      MÁS BARATO
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 text-right text-zinc-600 dark:text-zinc-300">
                  {s.totalFacturas}
                </td>
                <td className="py-3 px-3 text-right text-zinc-600 dark:text-zinc-300">
                  {s.productosUnicos}
                </td>
                <td className="py-3 px-3 text-right font-black text-emerald-600 dark:text-emerald-400">
                  ${s.precioPromedioUnitario.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-right font-bold text-zinc-900 dark:text-zinc-100">
                  ${s.totalGastado.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {ranking.length === 1 && (
        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>
            <strong>Consejo:</strong> Escanea tirillas de otros comercios (ej. Éxito, Carulla, Ara, Jumbo) para comparar automáticamente la canasta familiar y ver cuánto te ahorrarías comprando en cada uno.
          </span>
        </div>
      )}
    </div>
  );
}
