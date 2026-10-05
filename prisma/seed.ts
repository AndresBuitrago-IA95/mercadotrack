import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed de datos...");

  // 1. Comercios
  const comercios = ["D1", "Éxito", "Euro", "Olímpica", "Jumbo"];
  const createdComercios: Record<string, string> = {};

  for (const nombre of comercios) {
    const c = await prisma.comercio.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
    createdComercios[nombre] = c.id;
  }
  console.log("Comercios creados:", Object.keys(createdComercios));

  // 2. Productos base
  const productosBase = [
    { nombreCanonico: "Leche Entera 1L", categoria: "Lácteos y Huevos", unidadMedida: "l" },
    { nombreCanonico: "Huevos AA x30", categoria: "Lácteos y Huevos", unidadMedida: "paquete" },
    { nombreCanonico: "Arroz Blanco 1kg", categoria: "Despensa y Abarrotes", unidadMedida: "kg" },
    { nombreCanonico: "Aceite Vegetal 900ml", categoria: "Despensa y Abarrotes", unidadMedida: "ml" },
    { nombreCanonico: "Detergente Líquido 2L", categoria: "Aseo Hogar", unidadMedida: "l" },
    { nombreCanonico: "Papel Higiénico x12", categoria: "Aseo Hogar", unidadMedida: "paquete" },
    { nombreCanonico: "Pechuga de Pollo 1kg", categoria: "Carnes y Pescados", unidadMedida: "kg" },
    { nombreCanonico: "Manzana Roja 1kg", categoria: "Frutas y Verduras", unidadMedida: "kg" },
    { nombreCanonico: "Café Molido 500g", categoria: "Despensa y Abarrotes", unidadMedida: "g" },
  ];

  const createdProductos: Record<string, string> = {};

  for (const p of productosBase) {
    const prod = await prisma.producto.upsert({
      where: { nombreCanonico: p.nombreCanonico },
      update: {},
      create: p,
    });
    createdProductos[p.nombreCanonico] = prod.id;
  }
  console.log("Productos base creados:", Object.keys(createdProductos).length);

  // 3. Facturas de ejemplo para históricos y variaciones
  const countFacturas = await prisma.factura.count();
  if (countFacturas === 0) {
    console.log("Insertando facturas de prueba...");

    // Factura 1: Hace 14 días en Éxito
    const f1Date = new Date();
    f1Date.setDate(f1Date.getDate() - 14);

    const factura1 = await prisma.factura.create({
      data: {
        comercioId: createdComercios["Éxito"],
        fechaCompra: f1Date,
        total: 42500,
        items: {
          create: [
            {
              productoId: createdProductos["Leche Entera 1L"],
              descripcionOriginal: "LECHE ENT 1000ML",
              cantidad: 3,
              precioUnitario: 4200,
              precioTotal: 12600,
            },
            {
              productoId: createdProductos["Huevos AA x30"],
              descripcionOriginal: "PANAL HUEVOS AA 30U",
              cantidad: 1,
              precioUnitario: 18500,
              precioTotal: 18500,
            },
            {
              productoId: createdProductos["Arroz Blanco 1kg"],
              descripcionOriginal: "ARROZ BLANCO 1KG",
              cantidad: 2,
              precioUnitario: 5700,
              precioTotal: 11400,
            },
          ],
        },
      },
    });

    // Factura 2: Hace 7 días en D1
    const f2Date = new Date();
    f2Date.setDate(f2Date.getDate() - 7);

    const factura2 = await prisma.factura.create({
      data: {
        comercioId: createdComercios["D1"],
        fechaCompra: f2Date,
        total: 35200,
        items: {
          create: [
            {
              productoId: createdProductos["Leche Entera 1L"],
              descripcionOriginal: "LECHE ENTERA D1 1L",
              cantidad: 4,
              precioUnitario: 3600,
              precioTotal: 14400,
            },
            {
              productoId: createdProductos["Huevos AA x30"],
              descripcionOriginal: "HUEVO AA 30UN",
              cantidad: 1,
              precioUnitario: 16200,
              precioTotal: 16200,
            },
            {
              productoId: createdProductos["Arroz Blanco 1kg"],
              descripcionOriginal: "ARROZ PRIMERA 1K",
              cantidad: 1,
              precioUnitario: 4600,
              precioTotal: 4600,
            },
          ],
        },
      },
    });

    // Factura 3: Ayer en Éxito (demuestra alzas y oportunidades de ahorro)
    const f3Date = new Date();
    f3Date.setDate(f3Date.getDate() - 1);

    const factura3 = await prisma.factura.create({
      data: {
        comercioId: createdComercios["Éxito"],
        fechaCompra: f3Date,
        total: 48900,
        items: {
          create: [
            {
              productoId: createdProductos["Leche Entera 1L"],
              descripcionOriginal: "LECHE ENT 1000ML",
              cantidad: 3,
              precioUnitario: 4600, // Subió de 4200 a 4600 (+9.5%), y en D1 estuvo a 3600 (-21.7%)
              precioTotal: 13800,
            },
            {
              productoId: createdProductos["Huevos AA x30"],
              descripcionOriginal: "PANAL HUEVOS AA 30U",
              cantidad: 1,
              precioUnitario: 17900, // Bajó de 18500 a 17900 (-3.2%)
              precioTotal: 17900,
            },
            {
              productoId: createdProductos["Café Molido 500g"],
              descripcionOriginal: "CAFE SUAVE 500G",
              cantidad: 1,
              precioUnitario: 17200,
              precioTotal: 17200,
            },
          ],
        },
      },
    });

    console.log("Facturas de prueba creadas con éxito:", [factura1.id, factura2.id, factura3.id]);
  }

  console.log("Seed completado exitosamente.");
}

main()
  .catch((e) => {
    console.error("Error durante el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
