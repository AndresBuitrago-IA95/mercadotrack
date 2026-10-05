import React from "react";
import Link from "next/link";
import { ArrowLeft, Tag, Store, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ProductosCatalogPage() {
  const productos = await prisma.producto.findMany({
    include: {
      items: {
        include: {
          factura: {
            include: {
              comercio: true,
            },
          },
        },
        orderBy: {
          precioUnitario: "asc",
        },
      },
    },
    orderBy: {
      nombreCanonico: "asc",
    },
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al Inicio
          </Link>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
            {productos.length} Productos
          </span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Catálogo & Comparador
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Consulta el historial y los mejores precios registrados en cada supermercado.
          </p>
        </div>

        {/* Product Cards Grid */}
        {productos.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-zinc-200 dark:border-zinc-800 text-center text-sm text-zinc-500">
            No hay productos registrados aún. Escanea tu primera tirilla para comenzar.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {productos.map((prod) => {
              const bestItem = prod.items[0];
              const uniqueStores = Array.from(
                new Set(prod.items.map((i) => i.factura.comercio.nombre))
              );

              return (
                <Link
                  key={prod.id}
                  href={`/productos/${prod.id}`}
                  className="group p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                        {prod.categoria}
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        {prod.unidadMedida}
                      </span>
                    </div>

                    <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                      {prod.nombreCanonico}
                    </h2>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    {bestItem ? (
                      <div className="space-y-1">
                        <div className="flex items-baseline justify-between">
                          <span className="text-[11px] text-zinc-400 font-medium">
                            Mejor precio:
                          </span>
                          <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                            ${bestItem.precioUnitario.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-zinc-500">
                          <span className="flex items-center gap-1">
                            <Store className="w-3 h-3" />
                            {bestItem.factura.comercio.nombre}
                          </span>
                          <span>{uniqueStores.length} comercios</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-400">Sin compras</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
