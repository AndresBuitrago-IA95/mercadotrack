import React from "react";
import { Wallet, ShoppingBag, Receipt, Tag } from "lucide-react";

interface MetricCardsProps {
  gastoTotalMes: number;
  totalFacturas: number;
  totalProductos: number;
  ultimaFactura: {
    comercio: string;
    fechaCompra: Date;
    total: number;
  } | null;
}

export function MetricCards({
  gastoTotalMes,
  totalFacturas,
  totalProductos,
  ultimaFactura,
}: MetricCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Gasto del Mes */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Gasto del Mes
          </span>
          <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div>
          <p className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100">
            ${gastoTotalMes.toLocaleString()}
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            Acumulado mes en curso
          </p>
        </div>
      </div>

      {/* Última Compra */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Última Compra
          </span>
          <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <ShoppingBag className="w-4 h-4" />
          </div>
        </div>
        <div>
          <p className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 truncate">
            {ultimaFactura ? `$${ultimaFactura.total.toLocaleString()}` : "$0"}
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
            {ultimaFactura
              ? `${ultimaFactura.comercio} • ${new Date(
                  ultimaFactura.fechaCompra
                ).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}`
              : "Sin compras aún"}
          </p>
        </div>
      </div>

      {/* Facturas Procesadas */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Facturas
          </span>
          <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <Receipt className="w-4 h-4" />
          </div>
        </div>
        <div>
          <p className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100">
            {totalFacturas}
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            Tirillas digitalizadas
          </p>
        </div>
      </div>

      {/* Productos Monitoreados */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Productos
          </span>
          <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Tag className="w-4 h-4" />
          </div>
        </div>
        <div>
          <p className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100">
            {totalProductos}
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            Artículos canónicos
          </p>
        </div>
      </div>
    </div>
  );
}
