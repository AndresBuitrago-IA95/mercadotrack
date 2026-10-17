import React from "react";
import Link from "next/link";
import { Camera, ShoppingCart, Tag, Store, ShieldCheck } from "lucide-react";
import { getDashboardSummary } from "@/services/analytics.service";
import { getFamilias, getActiveFamilia } from "@/actions/familias";
import { FamilySelector } from "@/components/FamilySelector";
import { MetricCards } from "@/components/analytics/MetricCards";
import { SpendingTrends } from "@/components/analytics/SpendingTrends";
import { PriceAlerts } from "@/components/analytics/PriceAlerts";
import { StoreComparisonRanking } from "@/components/analytics/StoreComparisonRanking";
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
            {/* KPI Cards con suma total y semana vs semana */}
            <MetricCards
              gastoTotalGeneral={summary.gastoTotalGeneral}
              gastoTotalMes={summary.gastoTotalMes}
              totalFacturas={summary.totalFacturas}
              totalProductos={summary.totalProductos}
              comparacionSemanal={summary.comparacionSemanal}
              mesActual={summary.gastosMesAMes[0]}
              productosSubieronCount={summary.variaciones.subieron.length}
              ultimaFactura={summary.ultimaFactura}
            />

            {/* Evolución de Gasto: Comparativa Semana a Semana & Suma Mes a Mes */}
            <SpendingTrends
              comparacionSemanal={summary.comparacionSemanal}
              gastosMesAMes={summary.gastosMesAMes}
              gastoTotalGeneral={summary.gastoTotalGeneral}
            />

            {/* Ranking de Supermercados: ¿En cuál es más barato? */}
            <StoreComparisonRanking ranking={summary.rankingSupermercados} />

            {/* Oportunidades de Ahorro Detectadas */}
            <SavingsOpportunities oportunidades={summary.oportunidadesAhorro} />

            {/* Alertas de Variación e Inflación (Subieron / Bajaron / Históricas) & Gastos por Categoría */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PriceAlerts
                subieron={summary.variaciones.subieron}
                bajaron={summary.variaciones.bajaron}
                alzasHistoricas={summary.variaciones.alzasHistoricas}
              />
              <CategoryBreakdown categorias={summary.gastosPorCategoria} />
            </div>

            {/* Productos en Seguimiento con Mejor Comercio */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-500" />
                    Productos en Seguimiento & Mejor Supermercado
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Precios actuales y el supermercado donde se registró el mejor valor
                  </p>
                </div>
                <Link
                  href="/productos"
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Ver todos ({summary.totalProductos})
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {summary.productosRecientes.map((p) => (
                  <Link
                    key={p.id}
                    href={`/productos/${p.id}`}
                    className="group p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-800/20 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[9px] font-bold uppercase text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md">
                          {p.categoria}
                        </span>
                        <span className="text-[10px] text-zinc-400">{p.unidadMedida}</span>
                      </div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                        {p.nombreCanonico}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 space-y-1 text-xs">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[10px] text-zinc-400">Último precio:</span>
                        <span className="font-extrabold text-zinc-900 dark:text-zinc-100">
                          ${p.ultimoPrecio.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-emerald-600 dark:text-emerald-400">
                        <span className="flex items-center gap-0.5">
                          <ShieldCheck className="w-3 h-3" />
                          Mejor en:
                        </span>
                        <span className="font-bold truncate max-w-[120px]">
                          {p.mejorComercio} (${p.mejorPrecio.toLocaleString()})
                        </span>
                      </div>
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
