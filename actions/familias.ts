"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "mercadotrack_family_id";

export async function getFamilias() {
  return prisma.familia.findMany({
    orderBy: { nombre: "asc" },
    include: {
      _count: {
        select: { facturas: true },
      },
    },
  });
}

export async function getActiveFamilia() {
  const cookieStore = await cookies();
  const activeId = cookieStore.get(COOKIE_NAME)?.value;

  if (activeId) {
    const familia = await prisma.familia.findUnique({
      where: { id: activeId },
    });
    if (familia) return familia;
  }

  // Fallback: Si no hay cookie seleccionada, tomar la primera creada
  const first = await prisma.familia.findFirst({
    orderBy: { createdAt: "asc" },
  });

  return first ?? null;
}

export async function setActiveFamilia(familiaId: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, familiaId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
  });
  return { success: true };
}

export async function createFamilia(nombre: string) {
  try {
    const trimmed = nombre.trim();
    if (!trimmed) {
      return { success: false, error: "El nombre de la familia es obligatorio." };
    }

    const existing = await prisma.familia.findUnique({
      where: { nombre: trimmed },
    });

    if (existing) {
      await setActiveFamilia(existing.id);
      return { success: true, data: existing };
    }

    const familia = await prisma.familia.create({
      data: { nombre: trimmed },
    });

    await setActiveFamilia(familia.id);
    return { success: true, data: familia };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error al crear la familia",
    };
  }
}
