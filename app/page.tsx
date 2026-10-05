import React from "react";
import Link from "next/link";
import { Plus, Camera, ShoppingCart, Tag, ChevronRight, Store, ArrowUpRight } from "lucide-react";
import { getDashboardSummary } from "@/services/analytics.service";
import { getFamilias, getActiveFamilia } from "@/actions/familias";
import { FamilySelector } from "@/components/FamilySelector";
import { MetricCards } from "@/components/analytics/MetricCards";
import { PriceAlerts } from "@/components/analytics/PriceAlerts";
import { SavingsOpportunities } from "@/components/analytics/SavingsOpportunities";
import { CategoryBreakdown } from "@/components/analytics/CategoryBreakdown";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [familias, activeFamilia] = await Promise.all([
    getFamilias(),
    getActiveFamilia(),
  ]);

  const summary = await getDashboardSummary(activeFamilia?.id);

  const hasData = summary.totalFacturas > 0;

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 pb-24">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black shadow-xs">
              M
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-zinc-900 dark:text-zinc-100">
                Mercado<span className="text-emerald-600">Track</span>
              </span>
              <p className="text-[10px] text-zinc-500 font-medium">
                OCR & Monitor de Precios
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <FamilySelector
              familias={familias}
              activeFamilia={activeFamilia}
            />

            <Link
              href="/nueva-compra"
              className="hidden sm:inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors"
            >
              <Camera className="w-4 h-4" /> Escanear Tirilla
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {!hasData ? (
          /* Empty State */
          <div className="text-center py-16 px-4 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xs max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <ShoppingCart className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold">¡Bienvenido a MercadoTrack!</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Aún no tienes tirillas registradas. Toma una foto a tu primera factura de supermercado para empezar a detectar ahorros e inflación.
            </p>
            <Link
              href="/nueva-compra"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-md transition-colors"
            >
              <Camera className="w-4 h-4" /> Escanear mi Primera Factura
            </Link>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <MetricCards
              gastoTotalMes={summary.gastoTotalMes}
              totalFacturas={summary.totalFacturas}
              totalProductos={summary.totalProductos}
              ultimaFactura={summary.ultimaFactura}
            />

            {/* Smart Savings Opportunities */}
            <SavingsOpportunities oportunidades={summary.oportunidadesAhorro} />

            {/* Price Alerts & Category Breakdown Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PriceAlerts
                subieron={summary.variaciones.subieron}
                bajaron={summary.variaciones.bajaron}
              />
              <CategoryBreakdown categorias={summary.gastosPorCategoria} />
            </div>

            {/* Tracked Products Quick List */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-500" />
                  Productos en Seguimiento
                </h3>
                <span className="text-xs text-zinc-500">
                  {summary.totalProductos} productos
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {summary.productosRecientes.map((p) => (
                  <Link
                    key={p.id}
                    href={`/productos/${p.id}`}
                    className="group p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-800/20 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                        {p.categoria}
                      </span>
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-1.5 line-clamp-1 group-hover:text-emerald-600 transition-colors">
                        {p.nombreCanonico}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                      <span className="font-extrabold text-zinc-900 dark:text-zinc-100">
                        ${p.ultimoPrecio.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-zinc-400 flex items-center gap-0.5">
                        <Store className="w-2.5 h-2.5" />
                        {p.ultimoComercio}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Floating Mobile Capture Bar */}
      <div className="sm:hidden fixed bottom-4 inset-x-4 z-40">
        <Link
          href="/nueva-compra"
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 active:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-xl shadow-emerald-600/30 transition-all"
        >
          <Camera className="w-5 h-5" />
          <span>Escanear Tirilla</span>
        </Link>
      </div>
    </main>
  );
}
