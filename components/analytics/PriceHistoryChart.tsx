"use client";

import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface HistoryPoint {
  fecha: string;
  fechaLabel: string;
  precioUnitario: number;
  precioTotal: number;
  cantidad: number;
  comercio: string;
}

interface PriceHistoryChartProps {
  data: HistoryPoint[];
  unidadMedida: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: HistoryPoint;
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-zinc-900 text-white text-xs p-3 rounded-xl shadow-lg border border-zinc-700 space-y-1">
        <p className="font-bold text-emerald-400">{item.comercio}</p>
        <p className="text-zinc-300">Fecha: {item.fecha}</p>
        <p className="font-semibold text-white">
          Precio: ${item.precioUnitario.toLocaleString()}
        </p>
        <p className="text-[11px] text-zinc-400">
          Comprado: {item.cantidad} (Total: ${item.precioTotal.toLocaleString()})
        </p>
      </div>
    );
  }
  return null;
}

export function PriceHistoryChart({ data, unidadMedida }: PriceHistoryChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl">
        Sin historial de precios suficiente.
      </div>
    );
  }

  const minPrice = Math.min(...data.map((d) => d.precioUnitario));
  const maxPrice = Math.max(...data.map((d) => d.precioUnitario));
  const yDomainMin = Math.max(0, Math.floor(minPrice * 0.9));
  const yDomainMax = Math.ceil(maxPrice * 1.1);

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
          <XAxis
            dataKey="fechaLabel"
            tick={{ fontSize: 11, fill: "#888888" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[yDomainMin, yDomainMax]}
            tick={{ fontSize: 11, fill: "#888888" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(val) => `$${val}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="precioUnitario"
            name={`Precio Unitario (${unidadMedida})`}
            stroke="#10b981"
            strokeWidth={3}
            dot={{ r: 5, fill: "#10b981", stroke: "#ffffff", strokeWidth: 2 }}
            activeDot={{ r: 7, fill: "#059669" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
