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

export async function saveInvoice(data: InvoiceInputData) {
  try {
    const comercioTrimmed = data.comercio.trim();
    const purchaseDate =
      typeof data.fechaCompra === "string"
        ? new Date(data.fechaCompra)
        : data.fechaCompra;

    let targetFamiliaId = data.familiaId;
    if (!targetFamiliaId) {
      const activeFamilia = await getActiveFamilia();
      targetFamiliaId = activeFamilia?.id;
    }

    const savedInvoice = await prisma.$transaction(async (tx) => {
      // 1. Comercio: Buscar insensible a mayúsculas o crear
      const allComercios = await tx.comercio.findMany();
      let comercio = allComercios.find(
        (c) => c.nombre.trim().toLowerCase() === comercioTrimmed.toLowerCase()
      );

      if (!comercio) {
        comercio = await tx.comercio.create({
          data: {
            nombre: comercioTrimmed,
          },
        });
      }

      // 2. Factura: Crear registro inicial vinculado al comercio y familia
      const factura = await tx.factura.create({
        data: {
          familiaId: targetFamiliaId || null,
          comercioId: comercio.id,
          fechaCompra: isNaN(purchaseDate.getTime()) ? new Date() : purchaseDate,
          total: Number(data.total) || 0,
        },
      });

      // 3. Productos e Items de Factura
      for (const item of data.items) {
        const itemNombreCanonico = item.nombreCanonico.trim();
        
        let producto = await tx.producto.findUnique({
          where: { nombreCanonico: itemNombreCanonico },
        });

        if (!producto) {
          // Si no existe exactamente por nombreCanonico, buscar insensible a mayúsculas
          const allProducts = await tx.producto.findMany();
          producto = allProducts.find(
            (p) =>
              p.nombreCanonico.trim().toLowerCase() ===
              itemNombreCanonico.toLowerCase()
          ) ?? null;
        }

        if (!producto) {
          producto = await tx.producto.create({
            data: {
              nombreCanonico: itemNombreCanonico,
              categoria: item.categoria?.trim() || "General",
              unidadMedida: item.unidadMedida?.trim() || "un",
            },
          });
        }

        const cantidad = Number(item.cantidad) || 1.0;
        const precioUnitario = Number(item.precioUnitario) || 0;
        const precioTotal = Number(item.precioTotal) || cantidad * precioUnitario;
        const descuento = Number(item.descuento) || 0.0;

        await tx.itemFactura.create({
          data: {
            facturaId: factura.id,
            productoId: producto.id,
            descripcionOriginal: item.descripcionOriginal?.trim() || itemNombreCanonico,
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
