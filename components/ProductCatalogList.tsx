"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Store, ShieldCheck, Tag, TrendingDown } from "lucide-react";

interface ProductCatalogItem {
  id: string;
  nombreCanonico: string;
  categoria: string;
  unidadMedida: string;
  mejorPrecio?: number;
  mejorComercio?: string;
  totalComercios: number;
  totalCompras: number;
}

interface ProductCatalogListProps {
  productos: ProductCatalogItem[];
  categorias: string[];
}

export function ProductCatalogList({
  productos,
  categorias,
}: ProductCatalogListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCat, setSelectedCat] = useState("Todas");

  const filtered = useMemo(() => {
    return productos.filter((p) => {
      const matchesSearch =
        p.nombreCanonico.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.categoria.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCat =
        selectedCat === "Todas" || p.categoria === selectedCat;

      return matchesSearch && matchesCat;
    });
  }, [productos, searchTerm, selectedCat]);

  return (
    <div className="space-y-4">
      {/* Search and Category Filter */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por producto (ej: leche, arroz, jugo)..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium text-zinc-900 dark:text-zinc-100"
          />
        </div>

        <select
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
          className="text-xs sm:text-sm px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
        >
          <option value="Todas">Todas las Categorías ({productos.length})</option>
          {categorias.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Grid of Products */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-zinc-200 dark:border-zinc-800 text-center text-sm text-zinc-500">
          No se encontraron productos con ese criterio de búsqueda.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {filtered.map((prod) => (
            <Link
              key={prod.id}
              href={`/productos/${prod.id}`}
              className="group p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded-md">
                    {prod.categoria}
                  </span>
                  <span className="text-[11px] text-zinc-400 font-medium">
                    {prod.unidadMedida}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                  {prod.nombreCanonico}
                </h3>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                {prod.mejorPrecio !== undefined ? (
                  <div className="space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[10px] text-zinc-400 font-semibold uppercase">
                        Más barato en:
                      </span>
                      <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                        ${prod.mejorPrecio.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-500">
                      <span className="flex items-center gap-1 font-medium truncate max-w-[170px]">
                        <Store className="w-3 h-3 text-emerald-500 shrink-0" />
                        {prod.mejorComercio}
                      </span>
                      <span className="text-[10px] text-zinc-400 shrink-0">
                        {prod.totalCompras} {prod.totalCompras === 1 ? "compra" : "compras"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-zinc-400">Sin compras</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
