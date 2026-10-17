"use server";

import { prisma } from "@/lib/prisma";
import { getActiveFamilia } from "@/actions/familias";

export interface InvoiceItemInput {
  descripcionOriginal: string;
  nombreCanonico: string;
  categoria: string;
  unidadMedida: string;
  cantidad: number;
  precioUnitario: number;
  precioTotal: number;
  descuento?: number;
}

export interface InvoiceInputData {
  familiaId?: string;
  comercio: string;
  fechaCompra: string | Date;
  total: number;
  items: InvoiceItemInput[];
}

// Mapeo de razones sociales tributarias a marcas comerciales estándar
function normalizeStoreName(rawName: string): string {
  const cleaned = rawName.trim();
  const upper = cleaned.toUpperCase();

  if (upper.includes("PLAN B INVESTMENTS") || upper.includes("KOBA COLOMBIA") || upper.includes("TIENDAS D1") || upper === "D1") {
    return "Tiendas D1";
  }
  if (upper.includes("ALMACENES EXITO") || upper.includes("EXITO")) {
    return "Éxito";
  }
  if (upper.includes("CARULLA")) {
    return "Carulla";
  }
  if (upper.includes("CENCOSUD") || upper.includes("JUMBO")) {
    return "Jumbo";
  }
  if (upper.includes("JERONIMO MARTINS") || upper.includes("TIENDAS ARA") || upper === "ARA") {
    return "Tiendas Ara";
  }
  if (upper.includes("OLIMPICA") || upper.includes("SUPERTIENDAS")) {
    return "Olímpica";
  }
  if (upper.includes("EURO")) {
    return "Euro Supermercados";
  }
  if (upper.includes("MAKRO")) {
    return "Makro";
  }
  if (upper.includes("MERCAMIO")) {
    return "Mercamio";
  }

  return cleaned;
}

// Normalizador de texto para comparación flexible
function cleanText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // eliminar tildes
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Extraer código PLU inicial de 4 a 8 dígitos (ej: "0002595 NUTRION GATOS" -> "0002595")
function extractPlu(desc: string): string | null {
  const match = desc.trim().match(/^(\d{4,8})\b/);
  return match ? match[1] : null;
}

// Coeficiente de similitud de palabras clave
function wordSimilarity(strA: string, strB: string): number {
  const wordsA = new Set(cleanText(strA).split(" ").filter((w) => w.length > 2 && !["de", "en", "con", "por", "para", "los", "las", "und", "unds"].includes(w)));
  const wordsB = new Set(cleanText(strB).split(" ").filter((w) => w.length > 2 && !["de", "en", "con", "por", "para", "los", "las", "und", "unds"].includes(w)));

  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }

  return (2 * intersection) / (wordsA.size + wordsB.size);
}

export async function saveInvoice(data: InvoiceInputData) {
  try {
    const comercioNormalized = normalizeStoreName(data.comercio);
    const purchaseDate =
      typeof data.fechaCompra === "string"
        ? new Date(data.fechaCompra)
        : data.fechaCompra;

    let targetFamiliaId = data.familiaId;
    if (!targetFamiliaId) {
      const activeFamilia = await getActiveFamilia();
      targetFamiliaId = activeFamilia?.id;
    }

    // Calcular suma de ítems para validar el total
    const calculatedItemsTotal = data.items.reduce(
      (acc, it) => acc + (Number(it.precioTotal) || 0),
      0
    );
    const finalTotal =
      Number(data.total) > 0 ? Number(data.total) : calculatedItemsTotal;

    const savedInvoice = await prisma.$transaction(async (tx) => {
      // 1. Comercio: Buscar por nombre normalizado o crear
      const allComercios = await tx.comercio.findMany();
      let comercio = allComercios.find(
        (c) =>
          cleanText(c.nombre) === cleanText(comercioNormalized) ||
          cleanText(normalizeStoreName(c.nombre)) === cleanText(comercioNormalized)
      );

      if (!comercio) {
        comercio = await tx.comercio.create({
          data: {
            nombre: comercioNormalized,
          },
        });
      }

      // 2. Factura: Crear registro inicial
      const factura = await tx.factura.create({
        data: {
          familiaId: targetFamiliaId || null,
          comercioId: comercio.id,
          fechaCompra: isNaN(purchaseDate.getTime()) ? new Date() : purchaseDate,
          total: Number(finalTotal.toFixed(2)),
        },
      });

      // 3. Catálogo previo para deduplicación inteligente
      const existingProducts = await tx.producto.findMany({
        include: {
          items: {
            select: { descripcionOriginal: true },
            take: 10,
          },
        },
      });

      // 4. Procesar productos
      for (const item of data.items) {
        const itemNombreCanonico = item.nombreCanonico.trim();
        const itemDescOriginal = item.descripcionOriginal?.trim() || itemNombreCanonico;
        const itemPlu = extractPlu(itemDescOriginal);

        let matchedProduct = null;

        // Estrategia A: Si hay código PLU en el ticket, buscar si algún producto existente ya tiene un item con el mismo PLU
        if (itemPlu) {
          for (const p of existingProducts) {
            const hasSamePlu = p.items.some((i) => extractPlu(i.descripcionOriginal) === itemPlu);
            if (hasSamePlu) {
              matchedProduct = p;
              break;
            }
          }
        }

        // Estrategia B: Coincidencia exacta por nombre canónico
        if (!matchedProduct) {
          matchedProduct = existingProducts.find(
            (p) => cleanText(p.nombreCanonico) === cleanText(itemNombreCanonico)
          );
        }

        // Estrategia C: Coincidencia difusa por palabras clave (> 75% similitud de términos)
        if (!matchedProduct) {
          let highestScore = 0;
          let bestCandidate = null;

          for (const p of existingProducts) {
            const score = wordSimilarity(p.nombreCanonico, itemNombreCanonico);
            if (score > highestScore && score >= 0.75) {
              highestScore = score;
              bestCandidate = p;
            }
          }

          if (bestCandidate) {
            matchedProduct = bestCandidate;
          }
        }

        let productoId: string;

        if (matchedProduct) {
          productoId = matchedProduct.id;
        } else {
          // Crear nuevo producto y agregarlo al catálogo local para los siguientes ítems
          const newProd = await tx.producto.create({
            data: {
              nombreCanonico: itemNombreCanonico,
              categoria: item.categoria?.trim() || "General",
              unidadMedida: item.unidadMedida?.trim() || "un",
            },
          });
          productoId = newProd.id;
          existingProducts.push({
            ...newProd,
            items: [{ descripcionOriginal: itemDescOriginal }],
          });
        }

        const cantidad = Number(item.cantidad) || 1.0;
        const precioUnitario = Number(item.precioUnitario) || 0;
        const precioTotal =
          Number(item.precioTotal) || cantidad * precioUnitario;
        const descuento = Number(item.descuento) || 0.0;

        await tx.itemFactura.create({
          data: {
            facturaId: factura.id,
            productoId,
            descripcionOriginal: itemDescOriginal,
            cantidad,
            precioUnitario,
            precioTotal,
            descuento,
          },
        });
      }

      return tx.factura.findUnique({
        where: { id: factura.id },
        include: {
          comercio: true,
          items: {
            include: {
              producto: true,
            },
          },
        },
      });
    });

    return { success: true, data: savedInvoice };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al guardar la factura";
    return { success: false, error: message };
  }
}
