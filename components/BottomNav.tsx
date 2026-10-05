"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Camera, Tag } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const isHome = pathname === "/";
  const isUpload = pathname === "/nueva-compra";
  const isProducts = pathname.startsWith("/productos");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between relative">
        {/* Inicio */}
        <Link
          href="/"
          className={`flex flex-col items-center gap-1 transition-colors py-1 ${
            isHome
              ? "text-emerald-600 dark:text-emerald-400 font-bold"
              : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-medium"
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[11px]">Inicio</span>
        </Link>

        {/* Central Raised Button (+ Subir / Escanear) */}
        <div className="relative -top-5">
          <Link
            href="/nueva-compra"
            className={`w-13 h-13 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
              isUpload
                ? "bg-emerald-700 text-white ring-4 ring-emerald-500/30"
                : "bg-emerald-600 hover:bg-emerald-700 text-white ring-4 ring-white dark:ring-zinc-900 shadow-emerald-600/30"
            }`}
            title="Escanear Tirilla"
          >
            <Camera className="w-6 h-6" />
          </Link>
        </div>

        {/* Productos / Comparador */}
        <Link
          href="/productos"
          className={`flex flex-col items-center gap-1 transition-colors py-1 ${
            isProducts
              ? "text-emerald-600 dark:text-emerald-400 font-bold"
              : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-medium"
          }`}
        >
          <Tag className="w-5 h-5" />
          <span className="text-[11px]">Productos</span>
        </Link>
      </div>
    </nav>
  );
}
