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

export interface MonthlyExpense {
  mesKey: string; // "2026-10"
  mesLabel: string; // "Octubre 2026"
  total: number;
  facturasCount: number;
  ticketPromedio: number;
  variacionPorcentaje?: number;
  diferenciaMonto?: number;
}

export interface WeeklyExpense {
  semanaKey: string; // "2026-W40"
  semanaNumero: number;
  rangoLabel: string; // "28 Sep - 04 Oct"
  total: number;
  facturasCount: number;
  ticketPromedio: number;
}

export interface WeeklyComparison {
  semanaActual: WeeklyExpense | null;
  semanaAnterior: WeeklyExpense | null;
  variacionPorcentaje: number;
  diferenciaMonto: number;
  desgloseSemanas: WeeklyExpense[];
}

export interface StoreRankItem {
  comercioId: string;
  comercioNombre: string;
  totalGastado: number;
  totalFacturas: number;
  productosUnicos: number;
  precioPromedioUnitario: number;
  esMasBarato: boolean;
  ahorroEstimadoVsPromedio?: number;
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
  gastosMesAMes: MonthlyExpense[];
  comparacionSemanal: WeeklyComparison;
  variaciones: {
    subieron: PriceVariationItem[];
    bajaron: PriceVariationItem[];
    alzasHistoricas: PriceVariationItem[];
  };
  rankingSupermercados: StoreRankItem[];
  oportunidadesAhorro: SavingsOpportunity[];
  productosRecientes: Array<{
    id: string;
    nombreCanonico: string;
    categoria: string;
    unidadMedida: string;
    ultimoPrecio: number;
    ultimoComercio: string;
    mejorComercio: string;
    mejorPrecio: number;
  }>;
}

// Helpers para semanas del año y formateo
function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getWeekRangeLabel(dateInWeek: Date): string {
  const curr = new Date(dateInWeek);
  const day = curr.getDay();
  const diffToMonday = curr.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(curr.setDate(diffToMonday));
  const sunday = new Date(curr.setDate(monday.getDate() + 6));

  const formatShort = (d: Date) =>
    d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });

  return `${formatShort(monday)} - ${formatShort(sunday)}`;
}

export async function getDashboardSummary(familiaId?: string): Promise<DashboardSummary> {
  const whereFamilia = familiaId ? { familiaId } : {};

  // 1. Obtener todas las facturas ordenadas por fecha
  const facturas = await prisma.factura.findMany({
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

  const totalFacturas = facturas.length;
  const gastoTotalGeneral = facturas.reduce((acc, f) => acc + (f.total || 0), 0);

  // 2. Facturas del mes en curso o más reciente
  const now = new Date();
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let mesReferencia = startOfCurrentMonth;
  if (facturas.length > 0 && facturas[0].fechaCompra < startOfCurrentMonth) {
    const fLatest = facturas[0].fechaCompra;
    mesReferencia = new Date(fLatest.getFullYear(), fLatest.getMonth(), 1);
  }

  const facturasMes = facturas.filter((f) => f.fechaCompra >= mesReferencia);
  const gastoTotalMes = facturasMes.reduce((acc, f) => acc + (f.total || 0), 0);

  // 3. Desglose y suma Mes a Mes
  const monthlyMap = new Map<string, { total: number; count: number; date: Date }>();
  for (const f of facturas) {
    const d = new Date(f.fechaCompra);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyMap.has(key)) {
      monthlyMap.set(key, { total: 0, count: 0, date: d });
    }
    const curr = monthlyMap.get(key)!;
    curr.total += f.total;
    curr.count += 1;
  }

  const sortedMonthKeys = Array.from(monthlyMap.keys()).sort().reverse();
  const gastosMesAMes: MonthlyExpense[] = [];

  for (let i = 0; i < sortedMonthKeys.length; i++) {
    const key = sortedMonthKeys[i];
    const data = monthlyMap.get(key)!;
    const prevKey = sortedMonthKeys[i + 1];
    let variacionPct: number | undefined;
    let difMonto: number | undefined;

    if (prevKey && monthlyMap.has(prevKey)) {
      const prevData = monthlyMap.get(prevKey)!;
      if (prevData.total > 0) {
        difMonto = Number((data.total - prevData.total).toFixed(2));
        variacionPct = Number(((difMonto / prevData.total) * 100).toFixed(1));
      }
    }

    const monthName = data.date.toLocaleDateString("es-ES", {
      month: "long",
      year: "numeric",
    });

    gastosMesAMes.push({
      mesKey: key,
      mesLabel: monthName.charAt(0).toUpperCase() + monthName.slice(1),
      total: Number(data.total.toFixed(2)),
      facturasCount: data.count,
      ticketPromedio: Number((data.total / data.count).toFixed(2)),
      variacionPorcentaje: variacionPct,
      diferenciaMonto: difMonto,
    });
  }

  // 4. Comparación y desglose Semana a Semana
  const weeklyMap = new Map<string, { total: number; count: number; date: Date; weekNum: number }>();
  for (const f of facturas) {
    const d = new Date(f.fechaCompra);
    const weekNum = getWeekNumber(d);
    const key = `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
    if (!weeklyMap.has(key)) {
      weeklyMap.set(key, { total: 0, count: 0, date: d, weekNum });
    }
    const curr = weeklyMap.get(key)!;
    curr.total += f.total;
    curr.count += 1;
  }

  const sortedWeekKeys = Array.from(weeklyMap.keys()).sort().reverse();
  const desgloseSemanas: WeeklyExpense[] = sortedWeekKeys.map((k) => {
    const item = weeklyMap.get(k)!;
    return {
      semanaKey: k,
      semanaNumero: item.weekNum,
      rangoLabel: getWeekRangeLabel(item.date),
      total: Number(item.total.toFixed(2)),
      facturasCount: item.count,
      ticketPromedio: Number((item.total / item.count).toFixed(2)),
    };
  });

  const semanaActual = desgloseSemanas[0] || null;
  const semanaAnterior = desgloseSemanas[1] || null;
  let varSemanalPct = 0;
  let difSemanalMonto = 0;

  if (semanaActual && semanaAnterior && semanaAnterior.total > 0) {
    difSemanalMonto = Number((semanaActual.total - semanaAnterior.total).toFixed(2));
    varSemanalPct = Number(((difSemanalMonto / semanaAnterior.total) * 100).toFixed(1));
  }

  const comparacionSemanal: WeeklyComparison = {
    semanaActual,
    semanaAnterior,
    variacionPorcentaje: varSemanalPct,
    diferenciaMonto: difSemanalMonto,
    desgloseSemanas,
  };

  // 5. Variaciones de precio (Última compra vs Anteriores) y Alzas Históricas
  const lastInvoice = facturas[0] || null;
  const subieron: PriceVariationItem[] = [];
  const bajaron: PriceVariationItem[] = [];

  const productHistoryMap = new Map<
    string,
    Array<{
      facturaId: string;
      fechaCompra: Date;
      precioUnitario: number;
      comercioNombre: string;
    }>
  >();

  for (const f of facturas) {
    for (const it of f.items) {
      if (!productHistoryMap.has(it.productoId)) {
        productHistoryMap.set(it.productoId, []);
      }
      productHistoryMap.get(it.productoId)!.push({
        facturaId: f.id,
        fechaCompra: f.fechaCompra,
        precioUnitario: it.precioUnitario,
        comercioNombre: f.comercio.nombre,
      });
    }
  }

  for (const list of productHistoryMap.values()) {
    list.sort((a, b) => b.fechaCompra.getTime() - a.fechaCompra.getTime());
  }

  if (lastInvoice) {
    for (const item of lastInvoice.items) {
      const history = productHistoryMap.get(item.productoId) || [];
      const prev = history.find(
        (h) =>
          h.fechaCompra < lastInvoice.fechaCompra && h.facturaId !== lastInvoice.id
      );

      if (prev && prev.precioUnitario > 0) {
        const delta =
          ((item.precioUnitario - prev.precioUnitario) / prev.precioUnitario) *
          100;
        const diff = item.precioUnitario - prev.precioUnitario;

        const variation: PriceVariationItem = {
          productoId: item.productoId,
          nombre: item.producto.nombreCanonico,
          categoria: item.producto.categoria,
          unidadMedida: item.producto.unidadMedida,
          precioActual: item.precioUnitario,
          precioAnterior: prev.precioUnitario,
          deltaPorcentaje: Number(delta.toFixed(1)),
          diferenciaMonto: Number(diff.toFixed(2)),
          comercioActual: lastInvoice.comercio.nombre,
          comercioAnterior: prev.comercioNombre,
          fechaAnterior: prev.fechaCompra,
        };

        if (delta > 0.05) {
          subieron.push(variation);
        } else if (delta < -0.05) {
          bajaron.push(variation);
        }
      }
    }
  }

  subieron.sort((a, b) => b.deltaPorcentaje - a.deltaPorcentaje);
  bajaron.sort((a, b) => a.deltaPorcentaje - b.deltaPorcentaje);

  // Alzas históricas globales
  const alzasHistoricas: PriceVariationItem[] = [];
  for (const [prodId, history] of productHistoryMap.entries()) {
    if (history.length > 1) {
      const latest = history[0];
      const oldest = history[history.length - 1];

      if (latest.precioUnitario > oldest.precioUnitario && oldest.precioUnitario > 0) {
        const delta =
          ((latest.precioUnitario - oldest.precioUnitario) / oldest.precioUnitario) *
          100;
        const diff = latest.precioUnitario - oldest.precioUnitario;

        let prodInfo = null;
        for (const f of facturas) {
          const it = f.items.find((i) => i.productoId === prodId);
          if (it) {
            prodInfo = it.producto;
            break;
          }
        }

        if (prodInfo && delta > 0.1) {
          alzasHistoricas.push({
            productoId: prodId,
            nombre: prodInfo.nombreCanonico,
            categoria: prodInfo.categoria,
            unidadMedida: prodInfo.unidadMedida,
            precioActual: latest.precioUnitario,
            precioAnterior: oldest.precioUnitario,
            deltaPorcentaje: Number(delta.toFixed(1)),
            diferenciaMonto: Number(diff.toFixed(2)),
            comercioActual: latest.comercioNombre,
            comercioAnterior: oldest.comercioNombre,
            fechaAnterior: oldest.fechaCompra,
          });
        }
      }
    }
  }

  alzasHistoricas.sort((a, b) => b.deltaPorcentaje - a.deltaPorcentaje);

  // 6. Ranking y Comparativa de Supermercados
  const storeMap = new Map<
    string,
    {
      comercioNombre: string;
      totalGastado: number;
      facturasCount: number;
      unitPrices: number[];
      productosSet: Set<string>;
    }
  >();

  for (const f of facturas) {
    if (!storeMap.has(f.comercioId)) {
      storeMap.set(f.comercioId, {
        comercioNombre: f.comercio.nombre,
        totalGastado: 0,
        facturasCount: 0,
        unitPrices: [],
        productosSet: new Set(),
      });
    }
    const store = storeMap.get(f.comercioId)!;
    store.totalGastado += f.total;
    store.facturasCount += 1;

    for (const it of f.items) {
      store.unitPrices.push(it.precioUnitario);
      store.productosSet.add(it.productoId);
    }
  }

  const rankingSupermercados: StoreRankItem[] = [];
  for (const [comercioId, s] of storeMap.entries()) {
    const avgPrice =
      s.unitPrices.length > 0
        ? s.unitPrices.reduce((a, b) => a + b, 0) / s.unitPrices.length
        : 0;

    rankingSupermercados.push({
      comercioId,
      comercioNombre: s.comercioNombre,
      totalGastado: Number(s.totalGastado.toFixed(2)),
      totalFacturas: s.facturasCount,
      productosUnicos: s.productosSet.size,
      precioPromedioUnitario: Number(avgPrice.toFixed(2)),
      esMasBarato: false,
    });
  }

  rankingSupermercados.sort(
    (a, b) => a.precioPromedioUnitario - b.precioPromedioUnitario
  );
  if (rankingSupermercados.length > 0) {
    rankingSupermercados[0].esMasBarato = true;
  }

  // 7. Gastos por Categoría
  const categoryTotals: Record<string, { total: number; count: number }> = {};
  let overallItemSum = 0;

  for (const f of facturas) {
    for (const it of f.items) {
      const cat = it.producto.categoria || "General";
      if (!categoryTotals[cat]) {
        categoryTotals[cat] = { total: 0, count: 0 };
      }
      categoryTotals[cat].total += it.precioTotal;
      categoryTotals[cat].count += 1;
      overallItemSum += it.precioTotal;
    }
  }

  const gastosPorCategoria: CategoryExpense[] = Object.entries(categoryTotals)
    .map(([categoria, data]) => ({
      categoria,
      monto: Number(data.total.toFixed(2)),
      porcentaje:
        overallItemSum > 0
          ? Number(((data.total / overallItemSum) * 100).toFixed(1))
          : 0,
      cantidadItems: data.count,
    }))
    .sort((a, b) => b.monto - a.monto);

  // 8. Oportunidades de Ahorro y Productos con Mejor Supermercado
  const oportunidadesAhorro: SavingsOpportunity[] = [];
  const productCheapestMap = new Map<
    string,
    { comercioNombre: string; precioMinimo: number }
  >();

  for (const [prodId, history] of productHistoryMap.entries()) {
    let minPrice = Infinity;
    let minStore = "";
    for (const h of history) {
      if (h.precioUnitario < minPrice) {
        minPrice = h.precioUnitario;
        minStore = h.comercioNombre;
      }
    }
    if (minPrice < Infinity) {
      productCheapestMap.set(prodId, {
        comercioNombre: minStore,
        precioMinimo: minPrice,
      });
    }
  }

  if (lastInvoice) {
    for (const it of lastInvoice.items) {
      const cheapest = productCheapestMap.get(it.productoId);
      if (cheapest && it.precioUnitario > cheapest.precioMinimo) {
        const savingMonto = it.precioUnitario - cheapest.precioMinimo;
        const savingPct = (savingMonto / it.precioUnitario) * 100;

        oportunidadesAhorro.push({
          productoId: it.productoId,
          nombre: it.producto.nombreCanonico,
          categoria: it.producto.categoria,
          precioActual: it.precioUnitario,
          comercioActual: lastInvoice.comercio.nombre,
          precioMinimoHistorico: cheapest.precioMinimo,
          comercioMinimo: cheapest.comercioNombre,
          ahorroMonto: Number(savingMonto.toFixed(2)),
          ahorroPorcentaje: Number(savingPct.toFixed(1)),
        });
      }
    }
  }

  oportunidadesAhorro.sort((a, b) => b.ahorroPorcentaje - a.ahorroPorcentaje);

  // 9. Productos Recientes con Mejor Comercio
  const allProducts = await prisma.producto.findMany({
    where: familiaId
      ? {
          items: {
            some: {
              factura: { familiaId },
            },
          },
        }
      : undefined,
    take: 12,
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

  const productosRecientes = allProducts.map((p) => {
    const cheapest = productCheapestMap.get(p.id);
    return {
      id: p.id,
      nombreCanonico: p.nombreCanonico,
      categoria: p.categoria,
      unidadMedida: p.unidadMedida,
      ultimoPrecio: p.items[0]?.precioUnitario || 0,
      ultimoComercio: p.items[0]?.factura.comercio.nombre || "N/A",
      mejorComercio: cheapest?.comercioNombre || p.items[0]?.factura.comercio.nombre || "N/A",
      mejorPrecio: cheapest?.precioMinimo || p.items[0]?.precioUnitario || 0,
    };
  });

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
    gastosMesAMes,
    comparacionSemanal,
    variaciones: {
      subieron,
      bajaron,
      alzasHistoricas,
    },
    rankingSupermercados,
    oportunidadesAhorro,
    productosRecientes,
  };
}

export async function getStoreComparison(productoId: string): Promise<StoreComparison[]> {
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
