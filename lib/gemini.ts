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
  mimeType: string = "image/jpeg",
  knownCatalogProducts: string[] = []
): Promise<ExtractedInvoice> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY no está configurada en las variables de entorno.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const cleanBase64 = base64Image.includes(",")
    ? base64Image.split(",")[1]
    : base64Image;

  // Modelos ordenados por disponibilidad y capacidad comprobada
  const modelsToTry = [
    "gemini-3.8-flash",
    "gemini-flash-latest",
  ];
  let lastError: unknown = null;

  const catalogContext =
    knownCatalogProducts.length > 0
      ? `\n\nCatálogo de productos ya registrados en el sistema (si algún ítem del ticket corresponde a uno de estos, utiliza EXACTAMENTE este nombre canónico):\n- ${knownCatalogProducts.slice(0, 80).join("\n- ")}`
      : "";

  const systemInstruction = `Eres un sistema OCR experto de máxima precisión especializado en tirillas, tiquetes de caja y facturas de supermercados (especialmente de Colombia y Latinoamérica: Tiendas D1, Éxito, Carulla, Olímpica, Jumbo, Tiendas Ara, Euro, Makro, etc.).

INSTRUCCIONES CLAVE DE EXTRACCIÓN:
1. COMERCIO: Detecta el nombre comercial conocido de la cadena (ejemplo: 'Tiendas D1' o 'D1' en lugar de razones sociales legales como 'PLAN B INVESTMENTS S.A.S' o 'KOBA COLOMBIA', 'Éxito' en lugar de 'ALMACENES ÉXITO S.A.', 'Carulla', 'Jumbo' en lugar de 'CENCOSUD', 'Olímpica', 'Tiendas Ara', etc.).
2. FECHA DE COMPRA: Extrae la fecha real del tiquete en formato YYYY-MM-DD. Si no hay año visible, asume el año actual.
3. PRECIOS Y MONEDA:
   - En tiquetes de Colombia/Latinoamérica, el punto '.' o espacio suele ser separador de miles (ej: 13.450 es 13450, 3.190 es 3190, NO 13.45 o 3.19).
   - Devuelve todos los precios como números enteros o decimales reales (ej: 13450, 3190).
   - PRECIO TOTAL: Es el valor neto efectivamente cobrado por ese renglón en la tirilla.
   - DESCUENTO: Si la tirilla muestra rebajas, descuentos automáticos o ahorro por ítem ('DTO', 'DESC', 'AHORRO', 'PROMO'), indica el monto positivo del descuento (0 si no aplica).
4. PRODUCTOS Y NOMBRES CANÓNICOS:
   - Limpia los códigos PLU o números de referencia internos del inicio o final (ej: '0002595 NUTRION GATOS 1500 G' -> nombre canónico: 'Nutrion Gatos 1500g').
   - Normaliza el nombre del producto de forma clara, legible y estándar en español con mayúsculas iniciales.
   - Especifica la categoría lógica (Lácteos, Carnes y Pescados, Frutas y Verduras, Abarrotes, Limpieza y Hogar, Bebidas, Snacks y Dulces, Mascotas, Cuidado Personal, etc.).
   - Unidad de medida estándar: 'un', 'kg', 'g', 'l', 'ml', 'paquete', 'docena'.
5. TOTAL DE LA FACTURA: Debe ser el valor final total a pagar registrado en el ticket (sumatoria total pagada).${catalogContext}`;

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
                text: "Extrae de manera rigurosa, completa y estructurada todos los datos y cada uno de los productos de esta tirilla de supermercado, garantizando que los precios numéricos y nombres canónicos sean exactos.",
              },
            ],
          },
        ],
        config: {
          systemInstruction,
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: invoiceResponseSchema,
        },
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text) as ExtractedInvoice;
        // Sanitizar posibles números con formato de coma o string
        if (parsed.items && Array.isArray(parsed.items)) {
          parsed.items = parsed.items.map((item) => ({
            ...item,
            cantidad: Number(item.cantidad) || 1,
            precioUnitario: Number(item.precioUnitario) || 0,
            precioTotal: Number(item.precioTotal) || 0,
            descuento: Number(item.descuento) || 0,
          }));
        }
        parsed.total = Number(parsed.total) || 0;
        return parsed;
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
