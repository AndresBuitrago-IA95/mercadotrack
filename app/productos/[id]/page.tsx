import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Store, Tag, TrendingDown, Clock, Calendar } from "lucide-react";
import { getProductDetail } from "@/services/analytics.service";
import { PriceHistoryChart } from "@/components/analytics/PriceHistoryChart";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductoPage({ params }: ProductPageProps) {
  const { id } = await params;
  const detail = await getProductDetail(id);

  if (!detail) {
    notFound();
  }

  const { producto, historial, comparacion } = detail;

  const lowestStore = comparacion[0];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al Dashboard
          </Link>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
            {producto.categoria}
          </span>
        </div>

        {/* Product Header */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-6 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
              <Tag className="w-3.5 h-3.5" />
              <span>Unidad: {producto.unidadMedida}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100">
              {producto.nombreCanonico}
            </h1>
          </div>

          {lowestStore && (
            <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3 rounded-xl">
              <div className="p-2 rounded-lg bg-emerald-600 text-white">
                <TrendingDown className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">
                  Mejor Precio Histórico
                </p>
                <p className="text-lg font-black text-emerald-900 dark:text-emerald-200">
                  ${lowestStore.precioMinimo.toLocaleString()}
                  <span className="text-xs font-normal text-zinc-500 ml-1">
                    en {lowestStore.comercioNombre}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Price History Chart */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-6 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Evolución de Precio Unitario
            </h2>
            <span className="text-xs text-zinc-400">
              {historial.length} registros
            </span>
          </div>

          <PriceHistoryChart
            data={historial}
            unidadMedida={producto.unidadMedida}
          />
        </div>

        {/* Store Comparison Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-6 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Store className="w-4 h-4 text-emerald-500" />
            Comparador por Supermercado
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Comercio</th>
                  <th className="py-2.5 px-3">Precio Mínimo</th>
                  <th className="py-2.5 px-3">Precio Promedio</th>
                  <th className="py-2.5 px-3">Último Precio</th>
                  <th className="py-2.5 px-3">Última Compra</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {comparacion.map((c, idx) => (
                  <tr
                    key={c.comercioId}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="py-3 px-3 font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      {idx === 0 && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      )}
                      {c.comercioNombre}
                    </td>
                    <td className="py-3 px-3 font-semibold text-emerald-600 dark:text-emerald-400">
                      ${c.precioMinimo.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-zinc-600 dark:text-zinc-300">
                      ${c.precioPromedio.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-bold text-zinc-900 dark:text-zinc-100">
                      ${c.ultimoPrecio.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-zinc-400">
                      {new Date(c.ultimaFecha).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
