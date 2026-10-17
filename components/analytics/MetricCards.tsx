import React from "react";
import { ReceiptText, CalendarDays, TrendingUp, TrendingDown, Layers, ArrowUpRight, ArrowDownRight, Tag } from "lucide-react";
import { WeeklyComparison, MonthlyExpense } from "@/services/analytics.service";

interface MetricCardsProps {
  gastoTotalGeneral: number;
  gastoTotalMes: number;
  totalFacturas: number;
  totalProductos: number;
  comparacionSemanal: WeeklyComparison;
  mesActual?: MonthlyExpense;
  productosSubieronCount: number;
  ultimaFactura: {
    comercio: string;
    fechaCompra: Date;
    total: number;
  } | null;
}

export function MetricCards({
  gastoTotalGeneral,
  gastoTotalMes,
  totalFacturas,
  totalProductos,
  comparacionSemanal,
  mesActual,
  productosSubieronCount,
  ultimaFactura,
}: MetricCardsProps) {
  const { semanaActual, semanaAnterior, variacionPorcentaje, diferenciaMonto } =
    comparacionSemanal;

  const haAhorradoSemana = diferenciaMonto < 0;
  const haSubidoSemana = diferenciaMonto > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. Gasto Total Acumulado (Suma de Facturas) */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between relative overflow-hidden group">
        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Gasto Total Sumado
          </span>
          <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <ReceiptText className="w-4 h-4" />
          </div>
        </div>
        <div>
          <p className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
            ${gastoTotalGeneral.toLocaleString()}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {totalFacturas} facturas
            </span>
            <span>sumadas en el historial</span>
          </div>
        </div>
      </div>

      {/* 2. Comparación Semana a Semana */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">
            Semana vs Semana
          </span>
          <div
            className={`p-2 rounded-xl ${
              haAhorradoSemana
                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                : haSubidoSemana
                ? "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                : "bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400"
            }`}
          >
            {haAhorradoSemana ? (
              <TrendingDown className="w-4 h-4" />
            ) : haSubidoSemana ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <CalendarDays className="w-4 h-4" />
            )}
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between gap-1">
            <p className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100">
              ${(semanaActual?.total || 0).toLocaleString()}
            </p>
            {semanaAnterior && (
              <span
                className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  haAhorradoSemana
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                    : haSubidoSemana
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                    : "bg-zinc-100 text-zinc-600"
                }`}
              >
                {haAhorradoSemana ? (
                  <ArrowDownRight className="w-3 h-3" />
                ) : (
                  <ArrowUpRight className="w-3 h-3" />
                )}
                {Math.abs(variacionPorcentaje)}%
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
            {semanaAnterior
              ? haAhorradoSemana
                ? `Ahorro de $${Math.abs(diferenciaMonto).toLocaleString()} vs sem. anterior`
                : `+$${Math.abs(diferenciaMonto).toLocaleString()} vs sem. anterior`
              : "Semana en curso"}
          </p>
        </div>
      </div>

      {/* 3. Gasto del Mes Actual */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">
            {mesActual?.mesLabel || "Mes Actual"}
          </span>
          <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div>
          <p className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100">
            ${gastoTotalMes.toLocaleString()}
          </p>
          <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
            <span>
              {mesActual?.facturasCount || 1}{" "}
              {(mesActual?.facturasCount || 1) === 1 ? "compra" : "compras"} en el mes
            </span>
            {mesActual?.variacionPorcentaje !== undefined && (
              <span
                className={`font-semibold ${
                  mesActual.variacionPorcentaje <= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {mesActual.variacionPorcentaje > 0 ? "+" : ""}
                {mesActual.variacionPorcentaje}% vs mes prev.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 4. Monitoreo & Alertas de Inflación */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">
            Monitor de Precios
          </span>
          <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Tag className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100">
              {totalProductos}
            </p>
            {productosSubieronCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300">
                <ArrowUpRight className="w-3 h-3" />
                {productosSubieronCount} subieron
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 truncate">
            {ultimaFactura
              ? `Último tiquete: ${ultimaFactura.comercio}`
              : "Productos canónicos monitoreados"}
          </p>
        </div>
      </div>
    </div>
  );
}
