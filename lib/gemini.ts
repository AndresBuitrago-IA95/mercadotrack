import { GoogleGenAI, Type, Schema } from "@google/genai";

export interface ExtractedItem {
  descripcionOriginal: string;
  nombreCanonico: string;
  categoria: string;
  unidadMedida: string;
  cantidad: number;
  precioUnitario: number;
  precioTotal: number;
  descuento?: number;
}

export interface ExtractedInvoice {
  comercio: string;
  fechaCompra: string;
  total: number;
  items: ExtractedItem[];
}

const invoiceResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    comercio: {
      type: Type.STRING,
      description: "Nombre del supermercado o comercio",
    },
    fechaCompra: {
      type: Type.STRING,
      description: "Fecha de compra en formato YYYY-MM-DD o ISO-8601",
    },
    total: {
      type: Type.NUMBER,
      description: "Monto total pagado en la factura",
    },
    items: {
      type: Type.ARRAY,
      description: "Lista de productos comprados",
      items: {
        type: Type.OBJECT,
        properties: {
          descripcionOriginal: {
            type: Type.STRING,
            description: "Descripción original o abreviada en el ticket",
          },
          nombreCanonico: {
            type: Type.STRING,
            description: "Nombre normalizado y limpio del producto",
          },
          categoria: {
            type: Type.STRING,
            description: "Categoría del producto (ej: Lácteos, Carnes, Frutas y Verduras, Abarrotes, Limpieza, Bebidas, etc.)",
          },
          unidadMedida: {
            type: Type.STRING,
            description: "Unidad de medida (ej: un, kg, g, l, ml, paquete)",
          },
          cantidad: {
            type: Type.NUMBER,
            description: "Cantidad comprada (mínimo 1.0 por defecto)",
          },
          precioUnitario: {
            type: Type.NUMBER,
            description: "Precio unitario antes o después de descuento",
          },
          precioTotal: {
            type: Type.NUMBER,
            description: "Precio final cobrado por este ítem en la tirilla",
          },
          descuento: {
            type: Type.NUMBER,
            description: "Monto total del descuento, rebaja o ahorro aplicado a este producto específico en la tirilla (0 si no tuvo descuento)",
          },
        },
        required: [
          "descripcionOriginal",
          "nombreCanonico",
          "categoria",
          "unidadMedida",
          "cantidad",
          "precioUnitario",
          "precioTotal",
        ],
      },
    },
  },
  required: ["comercio", "fechaCompra", "total", "items"],
};

export async function extractInvoiceFromImage(
  base64Image: string,
  mimeType: string = "image/jpeg"
): Promise<ExtractedInvoice> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY no está configurada en las variables de entorno.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const cleanBase64 = base64Image.includes(",")
    ? base64Image.split(",")[1]
    : base64Image;

  const modelsToTry = [
    "gemini-flash-lite-latest",
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash-lite",
    "gemini-flash-latest",
    "gemini-3.8-flash",
  ];
  let lastError: unknown = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: cleanBase64,
                },
              },
              {
                text: "Extrae de manera estricta y estructurada todos los datos de esta tirilla o factura de compra.",
              },
            ],
          },
        ],
        config: {
          systemInstruction:
            "Eres un sistema OCR especializado en tirillas y facturas de supermercado. Extrae con precisión el nombre del comercio, la fecha de compra (ISO/YYYY-MM-DD), el total de la compra y cada ítem desglosado con su descripción original, nombre canónico estandarizado, categoría, unidad de medida, cantidad, precio unitario, precio total cobrado y el valor del descuento o rebaja aplicada al producto si la tirilla indica 'DTO', 'DESC', 'AHORRO', promociones o precios rebajados (coloca 0 si no tiene descuento).",
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: invoiceResponseSchema,
        },
      });

      const text = response.text;
      if (text) {
        return JSON.parse(text) as ExtractedInvoice;
      }
    } catch (err) {
      lastError = err;
      console.warn(`Error con modelo ${model}, intentando siguiente...`, err);
    }
  }

  throw new Error(
    lastError instanceof Error
      ? lastError.message
      : "No se pudo obtener una respuesta estructurada de Gemini."
  );
}
