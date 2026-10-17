import { NextRequest, NextResponse } from "next/server";
import { extractInvoiceFromImage } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let base64Image = "";
    let mimeType = "image/jpeg";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json(
          { error: "No se proporcionó ningún archivo en el formulario." },
          { status: 400 }
        );
      }

      mimeType = file.type || "image/jpeg";
      const arrayBuffer = await file.arrayBuffer();
      base64Image = Buffer.from(arrayBuffer).toString("base64");
    } else {
      const body = await req.json();
      if (!body.base64Image) {
        return NextResponse.json(
          { error: "El campo base64Image es obligatorio." },
          { status: 400 }
        );
      }
      base64Image = body.base64Image;
      if (body.mimeType) {
        mimeType = body.mimeType;
      }
    }

    // Obtener catálogo existente para sugerir nombres canónicos consistentes
    const existingProducts = await prisma.producto.findMany({
      select: { nombreCanonico: true },
      take: 120,
      orderBy: { nombreCanonico: "asc" },
    });
    const catalogNames = existingProducts.map((p) => p.nombreCanonico);

    const data = await extractInvoiceFromImage(base64Image, mimeType, catalogNames);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al procesar la imagen";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
