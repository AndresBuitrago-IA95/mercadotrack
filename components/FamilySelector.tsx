"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Plus, Check, ChevronDown, Loader2 } from "lucide-react";
import { createFamilia, setActiveFamilia } from "@/actions/familias";

interface FamiliaOption {
  id: string;
  nombre: string;
  _count?: {
    facturas: number;
  };
}

interface FamilySelectorProps {
  familias: FamiliaOption[];
  activeFamilia: { id: string; nombre: string } | null;
}

export function FamilySelector({ familias, activeFamilia }: FamilySelectorProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (familiaId: string) => {
    try {
      setLoading(true);
      await setActiveFamilia(familiaId);
      setIsOpen(false);
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamilyName.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const res = await createFamilia(newFamilyName.trim());
      if (!res.success) {
        throw new Error(res.error || "No se pudo crear la familia");
      }
      setNewFamilyName("");
      setIsCreating(false);
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear familia");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700/80 text-xs font-semibold transition-all"
      >
        <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        <span className="max-w-[120px] sm:max-w-[160px] truncate">
          {activeFamilia ? activeFamilia.nombre : "Elegir Familia"}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsOpen(false);
              setIsCreating(false);
            }}
          />
          <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 z-50 p-2.5 space-y-2 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Familias / Cuentas
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1">
              {familias.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleSelect(f.id)}
                  disabled={loading}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left ${
                    activeFamilia?.id === f.id
                      ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 opacity-70" />
                    <span className="truncate">{f.nombre}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {f._count && (
                      <span className="text-[10px] text-zinc-400">
                        {f._count.facturas} fact.
                      </span>
                    )}
                    {activeFamilia?.id === f.id && (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Create new family form */}
            {!isCreating ? (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 py-2 rounded-xl border border-dashed border-emerald-300 dark:border-emerald-800 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Crear Nueva Familia
              </button>
            ) : (
              <form onSubmit={handleCreate} className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                <input
                  type="text"
                  autoFocus
                  placeholder="Ej: Familia Gómez, Hogar 2..."
                  value={newFamilyName}
                  onChange={(e) => setNewFamilyName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent outline-hidden focus:ring-1 focus:ring-emerald-500 font-medium"
                />
                {error && <p className="text-[10px] text-red-600">{error}</p>}
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-2.5 py-1 text-[11px] font-medium text-zinc-500 hover:text-zinc-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !newFamilyName.trim()}
                    className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                  >
                    {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                    Guardar
                  </button>
                </div>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  );
}
