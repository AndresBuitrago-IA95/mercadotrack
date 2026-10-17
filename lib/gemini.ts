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

  const systemInstruction = `Eres un sistema OCR experto de máxima precisión especializado en tirillas, tiquetes de caja y facturas de supermercados (especialmente de Colombia y Latinoamérica: Tiendas Ísimo, Tiendas D1, Éxito, Carulla, Olímpica, Jumbo, Tiendas Ara, Euro, Makro, etc.).

INSTRUCCIONES CLAVE DE EXTRACCIÓN:
1. COMERCIO:
   - Si la tirilla muestra la razón social 'PLAN B INVESTMENTS S.A.S' o el nombre 'ÍSIMO' / 'TIENDAS ISIMO', el nombre comercial DEBE SER 'Tiendas Ísimo'.
   - Si dice 'KOBA COLOMBIA' o 'D1', el comercio es 'Tiendas D1'.
   - Si dice 'ALMACENES EXITO' o 'EXITO', el comercio es 'Éxito'.
   - Si dice 'JERONIMO MARTINS' o 'ARA', el comercio es 'Tiendas Ara'.
   - Si dice 'CENCOSUD' o 'JUMBO', el comercio es 'Jumbo'.
   - Si dice 'OLIMPICA' o 'SUPERTIENDAS', el comercio es 'Olímpica'.
2. FECHA DE COMPRA: Extrae la fecha real del tiquete en formato YYYY-MM-DD. Si no hay año visible, asume el año actual.
3. PRECIOS REALES Y DESCUENTOS SEPARADOS:
   - En tiquetes de Colombia/Latinoamérica, el punto '.' o espacio suele ser separador de miles (ej: 13.450 es 13450, 3.190 es 3190, NO 13.45 o 3.19).
   - 'precioUnitario': DEBE SER EL PRECIO REAL / PLENO DEL PRODUCTO (el precio de lista antes de descuentos o promociones).
   - 'descuento': Si el producto tuvo una rebaja, promoción o descuento ('DTO', 'DESC', 'AHORRO', 'PROMO'), indica el valor en dinero del descuento aplicado a ese producto. Coloca 0 si no tuvo descuento.
   - 'precioTotal': Debe ser el valor neto final cobrado por ese renglón, es decir: (cantidad * precioUnitario) - descuento.
4. PRODUCTOS Y NOMBRES CANÓNICOS:
   - Limpia los códigos PLU o números de referencia internos del inicio o final (ej: '0002595 NUTRION GATOS 1500 G' -> nombre canónico: 'Nutrion Gatos 1500g').
   - Normaliza el nombre del producto de forma clara, legible y estándar en español con mayúsculas iniciales.
   - Especifica la categoría lógica (Lácteos, Carnes y Pescados, Frutas y Verduras, Abarrotes, Limpieza y Hogar, Bebidas, Snacks y Dulces, Mascotas, Cuidado Personal, etc.).
   - Unidad de medida estándar: 'un', 'kg', 'g', 'l', 'ml', 'paquete', 'docena'.
5. TOTAL DE LA FACTURA: Debe ser el valor final total neto pagado en la tirilla (la suma de todos los precios netos cobrados).${catalogContext}`;

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
                text: "Extrae de manera rigurosa, completa y estructurada todos los datos de esta tirilla. Asegúrate de registrar el precio real de cada producto y separar los descuentos aplicados para evitar diferencias.",
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
        // Sanitizar posibles números con formato de coma o string y asegurar consistencia
        if (parsed.items && Array.isArray(parsed.items)) {
          parsed.items = parsed.items.map((item) => {
            const cantidad = Number(item.cantidad) || 1;
            const precioUnitario = Number(item.precioUnitario) || 0;
            const descuento = Number(item.descuento) || 0;
            const rawPrecioTotal = Number(item.precioTotal) || 0;
            
            // Garantizar que precioTotal sea neto (precio real * cantidad - descuento)
            const expectedNeto = Math.max(0, (cantidad * precioUnitario) - descuento);
            const precioTotal =
              rawPrecioTotal > 0 && Math.abs(rawPrecioTotal - (cantidad * precioUnitario)) < 0.01 && descuento > 0
                ? expectedNeto
                : rawPrecioTotal > 0
                ? rawPrecioTotal
                : expectedNeto;

            return {
              ...item,
              cantidad,
              precioUnitario,
              precioTotal,
              descuento,
            };
          });
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
