"use client";

import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from "recharts";
import { Calendar, Layers, ArrowUpRight, ArrowDownRight, TrendingDown, Receipt } from "lucide-react";
import { WeeklyComparison, MonthlyExpense } from "@/services/analytics.service";

interface SpendingTrendsProps {
  comparacionSemanal: WeeklyComparison;
  gastosMesAMes: MonthlyExpense[];
  gastoTotalGeneral: number;
}

export function SpendingTrends({
  comparacionSemanal,
  gastosMesAMes,
  gastoTotalGeneral,
}: SpendingTrendsProps) {
  const [mode, setMode] = useState<"semanal" | "mensual">("semanal");

  const weeklyData = [...comparacionSemanal.desgloseSemanas].reverse().map((w) => ({
    name: `Sem ${w.semanaNumero}`,
    subLabel: w.rangoLabel,
    total: w.total,
    facturasCount: w.facturasCount,
    ticketPromedio: w.ticketPromedio,
  }));

  const monthlyData = [...gastosMesAMes].reverse().map((m) => ({
    name: m.mesLabel.split(" ")[0], // "Septiembre", "Octubre"
    subLabel: m.mesLabel,
    total: m.total,
    facturasCount: m.facturasCount,
    ticketPromedio: m.ticketPromedio,
    variacionPorcentaje: m.variacionPorcentaje,
  }));

  const chartData = mode === "semanal" ? weeklyData : monthlyData;

  const { semanaActual, semanaAnterior, variacionPorcentaje, diferenciaMonto } =
    comparacionSemanal;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-6 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-5">
      {/* Header with Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            {mode === "semanal" ? (
              <Calendar className="w-5 h-5 text-emerald-600" />
            ) : (
              <Layers className="w-5 h-5 text-purple-600" />
            )}
            {mode === "semanal"
              ? "Comparativa de Gasto: Semana a Semana"
              : "Suma de Gasto: Mes a Mes"}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {mode === "semanal"
              ? "Compara el consumo entre semanas consecutivas para controlar el presupuesto familiar"
              : `Total acumulado sumado: $${gastoTotalGeneral.toLocaleString()} distribuidos en el tiempo`}
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMode("semanal")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              mode === "semanal"
                ? "bg-white dark:bg-zinc-700 text-emerald-700 dark:text-emerald-300 shadow-xs font-bold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Semana a Semana
          </button>
          <button
            type="button"
            onClick={() => setMode("mensual")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              mode === "mensual"
                ? "bg-white dark:bg-zinc-700 text-purple-700 dark:text-purple-300 shadow-xs font-bold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Mes a Mes
          </button>
        </div>
      </div>

      {/* Highlights Banner */}
      {mode === "semanal" ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase">
              Semana Actual ({semanaActual?.rangoLabel || "N/A"})
            </span>
            <p className="text-xl font-black text-zinc-900 dark:text-zinc-100 mt-1">
              ${(semanaActual?.total || 0).toLocaleString()}
            </p>
            <span className="text-[11px] text-zinc-400">
              {semanaActual?.facturasCount || 0} factura(s)
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase">
              Semana Anterior ({semanaAnterior?.rangoLabel || "N/A"})
            </span>
            <p className="text-xl font-black text-zinc-900 dark:text-zinc-100 mt-1">
              ${(semanaAnterior?.total || 0).toLocaleString()}
            </p>
            <span className="text-[11px] text-zinc-400">
              {semanaAnterior?.facturasCount || 0} factura(s)
            </span>
          </div>

          <div
            className={`p-3.5 rounded-xl border flex flex-col justify-between ${
              diferenciaMonto <= 0
                ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                : "bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300"
            }`}
          >
            <span className="text-[11px] font-bold uppercase">
              Variación de Semana
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black">
                {diferenciaMonto > 0 ? "+" : ""}${diferenciaMonto.toLocaleString()}
              </span>
              <span className="inline-flex items-center text-xs font-extrabold">
                {diferenciaMonto <= 0 ? (
                  <ArrowDownRight className="w-4 h-4" />
                ) : (
                  <ArrowUpRight className="w-4 h-4" />
                )}
                {Math.abs(variacionPorcentaje)}%
              </span>
            </div>
            <span className="text-[11px] opacity-80">
              {diferenciaMonto <= 0
                ? "¡Excelente! Has reducido tu gasto semanal"
                : "Hubo un incremento respecto a la semana pasada"}
            </span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
            <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase">
              Total Histórico Sumado
            </span>
            <p className="text-2xl font-black text-purple-900 dark:text-purple-100 mt-1">
              ${gastoTotalGeneral.toLocaleString()}
            </p>
            <span className="text-[11px] text-purple-600 dark:text-purple-400">
              Suma de todas las facturas procesadas
            </span>
          </div>

          {gastosMesAMes.slice(0, 2).map((m, idx) => (
            <div
              key={m.mesKey}
              className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-zinc-500 uppercase">
                  {m.mesLabel}
                </span>
                {idx === 0 && m.variacionPorcentaje !== undefined && (
                  <span
                    className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                      m.variacionPorcentaje <= 0
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                    }`}
                  >
                    {m.variacionPorcentaje > 0 ? "+" : ""}
                    {m.variacionPorcentaje}%
                  </span>
                )}
              </div>
              <p className="text-xl font-black text-zinc-900 dark:text-zinc-100 mt-1">
                ${m.total.toLocaleString()}
              </p>
              <span className="text-[11px] text-zinc-400">
                {m.facturasCount} factura(s) • Promedio: ${m.ticketPromedio.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Interactive Bar Chart */}
      <div className="pt-2">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#888" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#888" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-zinc-900 text-white p-3 rounded-xl shadow-lg border border-zinc-700 text-xs space-y-1">
                        <p className="font-bold text-emerald-400">{data.subLabel}</p>
                        <p className="text-sm font-extrabold">
                          Total: ${Number(data.total).toLocaleString()}
                        </p>
                        <p className="text-zinc-400">
                          {data.facturasCount} compra(s) registrada(s)
                        </p>
                        <p className="text-zinc-400">
                          Ticket promedio: ${Number(data.ticketPromedio).toLocaleString()}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      mode === "semanal"
                        ? index === chartData.length - 1
                          ? "#059669" // última semana en verde oscuro
                          : "#10b981"
                        : index === chartData.length - 1
                        ? "#7c3aed" // último mes en morado oscuro
                        : "#a855f7"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Table */}
      <div className="overflow-x-auto border-t border-zinc-100 dark:border-zinc-800 pt-3">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-zinc-400 uppercase font-semibold text-[10px]">
              <th className="py-2 px-2.5">
                {mode === "semanal" ? "Semana" : "Mes"}
              </th>
              <th className="py-2 px-2.5">Período</th>
              <th className="py-2 px-2.5 text-right">Facturas</th>
              <th className="py-2 px-2.5 text-right">Ticket Promedio</th>
              <th className="py-2 px-2.5 text-right">Gasto Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {mode === "semanal"
              ? comparacionSemanal.desgloseSemanas.map((w, idx) => (
                  <tr
                    key={w.semanaKey}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="py-2.5 px-2.5 font-bold text-zinc-900 dark:text-zinc-100">
                      Semana {w.semanaNumero} {idx === 0 && <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded-sm ml-1">Actual</span>}
                    </td>
                    <td className="py-2.5 px-2.5 text-zinc-500">{w.rangoLabel}</td>
                    <td className="py-2.5 px-2.5 text-right font-medium text-zinc-700 dark:text-zinc-300">
                      {w.facturasCount}
                    </td>
                    <td className="py-2.5 px-2.5 text-right text-zinc-600 dark:text-zinc-400">
                      ${w.ticketPromedio.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-black text-emerald-700 dark:text-emerald-400">
                      ${w.total.toLocaleString()}
                    </td>
                  </tr>
                ))
              : gastosMesAMes.map((m, idx) => (
                  <tr
                    key={m.mesKey}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="py-2.5 px-2.5 font-bold text-zinc-900 dark:text-zinc-100">
                      {m.mesLabel} {idx === 0 && <span className="text-[10px] text-purple-600 bg-purple-50 dark:bg-purple-950 px-1.5 py-0.5 rounded-sm ml-1">Actual</span>}
                    </td>
                    <td className="py-2.5 px-2.5 text-zinc-500">{m.mesKey}</td>
                    <td className="py-2.5 px-2.5 text-right font-medium text-zinc-700 dark:text-zinc-300">
                      {m.facturasCount}
                    </td>
                    <td className="py-2.5 px-2.5 text-right text-zinc-600 dark:text-zinc-400">
                      ${m.ticketPromedio.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-black text-purple-700 dark:text-purple-400">
                      ${m.total.toLocaleString()}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
