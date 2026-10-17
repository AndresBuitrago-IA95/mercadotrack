import React from "react";
import Link from "next/link";
import { ArrowLeft, Tag, Store } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProductCatalogList } from "@/components/ProductCatalogList";

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

  const categories = Array.from(
    new Set(productos.map((p) => p.categoria).filter(Boolean))
  ).sort();

  const formattedProducts = productos.map((prod) => {
    const bestItem = prod.items[0];
    const uniqueStores = Array.from(
      new Set(prod.items.map((i) => i.factura.comercio.nombre))
    );

    return {
      id: prod.id,
      nombreCanonico: prod.nombreCanonico,
      categoria: prod.categoria,
      unidadMedida: prod.unidadMedida,
      mejorPrecio: bestItem?.precioUnitario,
      mejorComercio: bestItem?.factura.comercio.nombre,
      totalComercios: uniqueStores.length,
      totalCompras: prod.items.length,
    };
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 sm:p-8 pb-24">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al Inicio
          </Link>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
            {productos.length} Productos Registrados
          </span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
            Catálogo & Comparador por Supermercado
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Consulta el historial, descubre en qué supermercado es más barato cada producto y monitorea alzas de precios.
          </p>
        </div>

        {/* Product Catalog List with Filter and Search */}
        <ProductCatalogList
          productos={formattedProducts}
          categorias={categories}
        />
      </div>
    </div>
  );
}
