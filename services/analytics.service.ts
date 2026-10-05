import { prisma } from "@/lib/prisma";

export interface PriceVariationItem {
  productoId: string;
  nombre: string;
  categoria: string;
  unidadMedida: string;
  precioActual: number;
  precioAnterior: number;
  deltaPorcentaje: number;
  diferenciaMonto: number;
  comercioActual: string;
  comercioAnterior: string;
  fechaAnterior: Date;
}

export interface StoreComparison {
  comercioId: string;
  comercioNombre: string;
  precioMinimo: number;
  precioPromedio: number;
  ultimoPrecio: number;
  ultimaFecha: Date;
  totalCompras: number;
}

export interface SavingsOpportunity {
  productoId: string;
  nombre: string;
  categoria: string;
  precioActual: number;
  comercioActual: string;
  precioMinimoHistorico: number;
  comercioMinimo: string;
  ahorroMonto: number;
  ahorroPorcentaje: number;
}

export interface CategoryExpense {
  categoria: string;
  monto: number;
  porcentaje: number;
  cantidadItems: number;
}

export interface DashboardSummary {
  gastoTotalMes: number;
  gastoTotalGeneral: number;
  totalFacturas: number;
  totalProductos: number;
  ultimaFactura: {
    id: string;
    comercio: string;
    fechaCompra: Date;
    total: number;
    itemsCount: number;
  } | null;
  gastosPorCategoria: CategoryExpense[];
  variaciones: {
    subieron: PriceVariationItem[];
    bajaron: PriceVariationItem[];
  };
  oportunidadesAhorro: SavingsOpportunity[];
  productosRecientes: Array<{
    id: string;
    nombreCanonico: string;
    categoria: string;
    unidadMedida: string;
    ultimoPrecio: number;
    ultimoComercio: string;
  }>;
}

export async function getPriceVariations(lastInvoiceId: string): Promise<{
  subieron: PriceVariationItem[];
  bajaron: PriceVariationItem[];
}> {
  const currentInvoice = await prisma.factura.findUnique({
    where: { id: lastInvoiceId },
    include: {
      comercio: true,
      items: {
        include: {
          producto: true,
        },
      },
    },
  });

  if (!currentInvoice) {
    return { subieron: [], bajaron: [] };
  }

  const subieron: PriceVariationItem[] = [];
  const bajaron: PriceVariationItem[] = [];

  for (const item of currentInvoice.items) {
    const prevItem = await prisma.itemFactura.findFirst({
      where: {
        productoId: item.productoId,
        factura: {
          fechaCompra: {
            lt: currentInvoice.fechaCompra,
          },
          id: {
            not: currentInvoice.id,
          },
        },
      },
      orderBy: {
        factura: {
          fechaCompra: "desc",
        },
      },
      include: {
        factura: {
          include: {
            comercio: true,
          },
        },
      },
    });

    if (prevItem && prevItem.precioUnitario > 0) {
      const delta =
        ((item.precioUnitario - prevItem.precioUnitario) /
          prevItem.precioUnitario) *
        100;
      const diff = item.precioUnitario - prevItem.precioUnitario;

      const variation: PriceVariationItem = {
        productoId: item.productoId,
        nombre: item.producto.nombreCanonico,
        categoria: item.producto.categoria,
        unidadMedida: item.producto.unidadMedida,
        precioActual: item.precioUnitario,
        precioAnterior: prevItem.precioUnitario,
        deltaPorcentaje: Number(delta.toFixed(1)),
        diferenciaMonto: Number(diff.toFixed(2)),
        comercioActual: currentInvoice.comercio.nombre,
        comercioAnterior: prevItem.factura.comercio.nombre,
        fechaAnterior: prevItem.factura.fechaCompra,
      };

      if (delta > 0.05) {
        subieron.push(variation);
      } else if (delta < -0.05) {
        bajaron.push(variation);
      }
    }
  }

  subieron.sort((a, b) => b.deltaPorcentaje - a.deltaPorcentaje);
  bajaron.sort((a, b) => a.deltaPorcentaje - b.deltaPorcentaje);

  return { subieron, bajaron };
}

export async function getStoreComparison(
  productoId: string
): Promise<StoreComparison[]> {
  const items = await prisma.itemFactura.findMany({
    where: { productoId },
    include: {
      factura: {
        include: {
          comercio: true,
        },
      },
    },
    orderBy: {
      factura: {
        fechaCompra: "desc",
      },
    },
  });

  const storeMap = new Map<
    string,
    {
      comercioNombre: string;
      precios: number[];
      ultimoPrecio: number;
      ultimaFecha: Date;
    }
  >();

  for (const it of items) {
    const storeId = it.factura.comercioId;
    const storeName = it.factura.comercio.nombre;

    if (!storeMap.has(storeId)) {
      storeMap.set(storeId, {
        comercioNombre: storeName,
        precios: [it.precioUnitario],
        ultimoPrecio: it.precioUnitario,
        ultimaFecha: it.factura.fechaCompra,
      });
    } else {
      storeMap.get(storeId)!.precios.push(it.precioUnitario);
    }
  }

  const comparison: StoreComparison[] = [];

  for (const [storeId, val] of storeMap.entries()) {
    const min = Math.min(...val.precios);
    const sum = val.precios.reduce((a, b) => a + b, 0);
    const avg = sum / val.precios.length;

    comparison.push({
      comercioId: storeId,
      comercioNombre: val.comercioNombre,
      precioMinimo: Number(min.toFixed(2)),
      precioPromedio: Number(avg.toFixed(2)),
      ultimoPrecio: Number(val.ultimoPrecio.toFixed(2)),
      ultimaFecha: val.ultimaFecha,
      totalCompras: val.precios.length,
    });
  }

  return comparison.sort((a, b) => a.precioMinimo - b.precioMinimo);
}

export async function getDashboardSummary(familiaId?: string): Promise<DashboardSummary> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const whereFamilia = familiaId ? { familiaId } : {};

  // 1. Facturas
  const totalFacturas = await prisma.factura.count({
    where: whereFamilia,
  });

  const facturasMes = await prisma.factura.findMany({
    where: {
      ...whereFamilia,
      fechaCompra: {
        gte: startOfMonth,
      },
    },
    select: { total: true },
  });

  const todasFacturas = await prisma.factura.findMany({
    where: whereFamilia,
    select: { total: true },
  });

  const gastoTotalMes = facturasMes.reduce((acc, f) => acc + f.total, 0);
  const gastoTotalGeneral = todasFacturas.reduce((acc, f) => acc + f.total, 0);

  // 2. Última factura
  const lastInvoice = await prisma.factura.findFirst({
    where: whereFamilia,
    orderBy: { fechaCompra: "desc" },
    include: {
      comercio: true,
      items: {
        include: {
          producto: true,
        },
      },
    },
  });

  // 3. Gastos por categoría
  const allItems = await prisma.itemFactura.findMany({
    where: familiaId ? { factura: { familiaId } } : {},
    include: {
      producto: true,
    },
  });

  const categoryTotals: Record<string, { total: number; count: number }> = {};
  let overallItemSum = 0;

  for (const it of allItems) {
    const cat = it.producto.categoria || "General";
    if (!categoryTotals[cat]) {
      categoryTotals[cat] = { total: 0, count: 0 };
    }
    categoryTotals[cat].total += it.precioTotal;
    categoryTotals[cat].count += 1;
    overallItemSum += it.precioTotal;
  }

  const gastosPorCategoria: CategoryExpense[] = Object.entries(categoryTotals)
    .map(([categoria, data]) => ({
      categoria,
      monto: Number(data.total.toFixed(2)),
      porcentaje: overallItemSum > 0 ? Number(((data.total / overallItemSum) * 100).toFixed(1)) : 0,
      cantidadItems: data.count,
    }))
    .sort((a, b) => b.monto - a.monto);

  // 4. Variaciones de precio en la última factura
  const variaciones = lastInvoice
    ? await getPriceVariations(lastInvoice.id)
    : { subieron: [], bajaron: [] };

  // 5. Oportunidades de ahorro
  const oportunidadesAhorro: SavingsOpportunity[] = [];
  if (lastInvoice) {
    for (const it of lastInvoice.items) {
      // Find historical min price for this product in OTHER stores
      const otherStoreItems = await prisma.itemFactura.findMany({
        where: {
          productoId: it.productoId,
          factura: {
            comercioId: { not: lastInvoice.comercioId },
            ...(familiaId ? { familiaId } : {}),
          },
        },
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
      });

      if (otherStoreItems.length > 0) {
        const cheapest = otherStoreItems[0];
        if (it.precioUnitario > cheapest.precioUnitario) {
          const savingMonto = it.precioUnitario - cheapest.precioUnitario;
          const savingPct = (savingMonto / it.precioUnitario) * 100;

          oportunidadesAhorro.push({
            productoId: it.productoId,
            nombre: it.producto.nombreCanonico,
            categoria: it.producto.categoria,
            precioActual: it.precioUnitario,
            comercioActual: lastInvoice.comercio.nombre,
            precioMinimoHistorico: cheapest.precioUnitario,
            comercioMinimo: cheapest.factura.comercio.nombre,
            ahorroMonto: Number(savingMonto.toFixed(2)),
            ahorroPorcentaje: Number(savingPct.toFixed(1)),
          });
        }
      }
    }
  }

  oportunidadesAhorro.sort((a, b) => b.ahorroPorcentaje - a.ahorroPorcentaje);

  // 6. Productos rastreados
  const totalProductos = await prisma.producto.count(
    familiaId
      ? {
          where: {
            items: {
              some: {
                factura: { familiaId },
              },
            },
          },
        }
      : undefined
  );

  const productosList = await prisma.producto.findMany({
    where: familiaId
      ? {
          items: {
            some: {
              factura: { familiaId },
            },
          },
        }
      : undefined,
    take: 8,
    include: {
      items: {
        where: familiaId ? { factura: { familiaId } } : undefined,
        orderBy: {
          factura: {
            fechaCompra: "desc",
          },
        },
        take: 1,
        include: {
          factura: {
            include: {
              comercio: true,
            },
          },
        },
      },
    },
  });

  const productosRecientes = productosList.map((p) => ({
    id: p.id,
    nombreCanonico: p.nombreCanonico,
    categoria: p.categoria,
    unidadMedida: p.unidadMedida,
    ultimoPrecio: p.items[0]?.precioUnitario || 0,
    ultimoComercio: p.items[0]?.factura.comercio.nombre || "N/A",
  }));

  return {
    gastoTotalMes: Number(gastoTotalMes.toFixed(2)),
    gastoTotalGeneral: Number(gastoTotalGeneral.toFixed(2)),
    totalFacturas,
    totalProductos,
    ultimaFactura: lastInvoice
      ? {
          id: lastInvoice.id,
          comercio: lastInvoice.comercio.nombre,
          fechaCompra: lastInvoice.fechaCompra,
          total: lastInvoice.total,
          itemsCount: lastInvoice.items.length,
        }
      : null,
    gastosPorCategoria,
    variaciones,
    oportunidadesAhorro,
    productosRecientes,
  };
}

export async function getProductDetail(productoId: string) {
  const producto = await prisma.producto.findUnique({
    where: { id: productoId },
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
          factura: {
            fechaCompra: "asc",
          },
        },
      },
    },
  });

  if (!producto) return null;

  const historial = producto.items.map((it) => ({
    fecha: it.factura.fechaCompra.toISOString().split("T")[0],
    fechaLabel: new Date(it.factura.fechaCompra).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
    }),
    precioUnitario: it.precioUnitario,
    precioTotal: it.precioTotal,
    cantidad: it.cantidad,
    comercio: it.factura.comercio.nombre,
  }));

  const comparacion = await getStoreComparison(productoId);

  return {
    producto,
    historial,
    comparacion,
  };
}
