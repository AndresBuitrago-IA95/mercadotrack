"use client";

import React, { useState, useMemo } from "react";
import { Plus, Trash2, CheckCircle2, AlertTriangle, ArrowLeft, Save, Loader2, Tag, Percent } from "lucide-react";
import { InvoiceInputData, InvoiceItemInput } from "@/actions/facturas";
import { ExtractedInvoice } from "@/lib/gemini";

interface InvoiceReviewFormProps {
  initialData: ExtractedInvoice;
  onSave: (data: InvoiceInputData) => Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
}

const CATEGORIES = [
  "Lácteos",
  "Carnes y Pescados",
  "Frutas y Verduras",
  "Abarrotes",
  "Limpieza y Hogar",
  "Bebidas",
  "Snacks y Dulces",
  "Panadería y Repostería",
  "Cuidado Personal",
  "Mascotas",
  "General",
];

const UNITS = ["un", "kg", "g", "l", "ml", "paquete", "docena"];

export function InvoiceReviewForm({
  initialData,
  onSave,
  onCancel,
  isSaving = false,
}: InvoiceReviewFormProps) {
  const [comercio, setComercio] = useState(
    initialData.comercio ? initialData.comercio.trim() : "Tiendas Ísimo"
  );
  const [fechaCompra, setFechaCompra] = useState(
    initialData.fechaCompra
      ? new Date(initialData.fechaCompra).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );

  const [items, setItems] = useState<InvoiceItemInput[]>(
    (initialData.items || []).map((item) => {
      const cantidad = Number(item.cantidad) || 1;
      const precioUnitario = Number(item.precioUnitario) || 0;
      const descuento = Number(item.descuento) || 0;
      const rawPrecioTotal = Number(item.precioTotal) || 0;

      // Garantizar que precioTotal sea neto (precio real * cantidad - descuento)
      const expectedNeto = Math.max(0, cantidad * precioUnitario - descuento);
      const precioTotal =
        rawPrecioTotal > 0 &&
        Math.abs(rawPrecioTotal - cantidad * precioUnitario) < 0.01 &&
        descuento > 0
          ? expectedNeto
          : rawPrecioTotal > 0
          ? rawPrecioTotal
          : expectedNeto;

      return {
        descripcionOriginal: item.descripcionOriginal || item.nombreCanonico,
        nombreCanonico: item.nombreCanonico || "",
        categoria: item.categoria || "General",
        unidadMedida: item.unidadMedida || "un",
        cantidad,
        precioUnitario,
        precioTotal,
        descuento,
      };
    })
  );

  // 1. Suma a precio real pleno (antes de descuentos)
  const subtotalPrecioReal = useMemo(() => {
    return items.reduce(
      (acc, item) =>
        acc + (Number(item.cantidad) || 1) * (Number(item.precioUnitario) || 0),
      0
    );
  }, [items]);

  // 2. Suma separada de todos los descuentos
  const totalDescuentos = useMemo(() => {
    return items.reduce((acc, item) => acc + (Number(item.descuento) || 0), 0);
  }, [items]);

  // 3. Suma neta de ítems (precio real - descuentos)
  const calculatedNetoItems = useMemo(() => {
    return items.reduce((acc, item) => acc + (Number(item.precioTotal) || 0), 0);
  }, [items]);

  const [total, setTotal] = useState<number>(() => {
    const initTotal = Number(initialData.total) || 0;
    if (initTotal > 0) return initTotal;
    return calculatedNetoItems;
  });

  const difference = useMemo(() => {
    return Math.abs(calculatedNetoItems - Number(total));
  }, [calculatedNetoItems, total]);

  const isBalanced = difference < 0.05;

  const handleItemChange = (
    index: number,
    field: keyof InvoiceItemInput,
    value: string | number
  ) => {
    setItems((prev) => {
      const updated = [...prev];
      const currentItem = { ...updated[index], [field]: value };

      const qty =
        field === "cantidad"
          ? Number(value)
          : Number(currentItem.cantidad) || 1;
      const unitPrice =
        field === "precioUnitario"
          ? Number(value)
          : Number(currentItem.precioUnitario) || 0;
      const desc =
        field === "descuento"
          ? Number(value)
          : Number(currentItem.descuento) || 0;

      // Si cambia cantidad, precio real unitario o descuento, recalcular precioTotal neto
      if (
        field === "cantidad" ||
        field === "precioUnitario" ||
        field === "descuento"
      ) {
        currentItem.precioTotal = Number(
          Math.max(0, qty * unitPrice - desc).toFixed(2)
        );
      } else if (field === "precioTotal") {
        // Si el usuario edita el total neto manualmente
        const newTotal = Number(value) || 0;
        if (qty > 0) {
          currentItem.precioUnitario = Number(
            ((newTotal + desc) / qty).toFixed(2)
          );
        }
      }

      updated[index] = currentItem;
      return updated;
    });
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        descripcionOriginal: "",
        nombreCanonico: "",
        categoria: "General",
        unidadMedida: "un",
        cantidad: 1,
        precioUnitario: 0,
        precioTotal: 0,
        descuento: 0,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comercio.trim()) {
      alert("Por favor ingresa el nombre del comercio.");
      return;
    }
    if (items.length === 0) {
      alert("Debes tener al menos un producto en la factura.");
      return;
    }

    const payload: InvoiceInputData = {
      comercio: comercio.trim(),
      fechaCompra,
      total: Number(total),
      items: items.map((it) => {
        const cantidad = Number(it.cantidad) || 1;
        const precioUnitario = Number(it.precioUnitario) || 0;
        const descuento = Number(it.descuento) || 0;
        const precioTotal = Math.max(0, cantidad * precioUnitario - descuento);

        return {
          ...it,
          descripcionOriginal:
            it.descripcionOriginal.trim() || it.nombreCanonico.trim(),
          nombreCanonico: it.nombreCanonico.trim() || "Producto sin nombre",
          cantidad,
          precioUnitario,
          precioTotal,
          descuento,
        };
      }),
    };

    await onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header card */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            Revisión de Factura & Validación de Precios
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Volver a capturar
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
              Supermercado / Comercio
            </label>
            <input
              type="text"
              required
              value={comercio}
              onChange={(e) => setComercio(e.target.value)}
              placeholder="Ej: Tiendas Ísimo, Éxito, D1..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-hidden font-bold text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
              Fecha de Compra
            </label>
            <input
              type="date"
              required
              value={fechaCompra}
              onChange={(e) => setFechaCompra(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
              Total Pagado en Ticket ($)
            </label>
            <input
              type="number"
              step="any"
              required
              value={total}
              onChange={(e) => setTotal(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-hidden font-black text-emerald-600 dark:text-emerald-400"
            />
          </div>
        </div>

        {/* Desglose: Precio Real vs Descuentos vs Total Neto */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700">
            <span className="text-[10px] font-bold uppercase text-zinc-500">
              Suma a Precio Real
            </span>
            <p className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
              ${subtotalPrecioReal.toLocaleString()}
            </p>
            <span className="text-[10px] text-zinc-400">Total productos sin descuento</span>
          </div>

          <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800">
            <span className="text-[10px] font-bold uppercase text-teal-800 dark:text-teal-300 flex items-center gap-1">
              <Percent className="w-3 h-3" /> Descuentos Separados
            </span>
            <p className="text-base font-extrabold text-teal-700 dark:text-teal-300">
              -${totalDescuentos.toLocaleString()}
            </p>
            <span className="text-[10px] text-teal-600 dark:text-teal-400">
              Rebajas y ahorros aplicados
            </span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
            <span className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300">
              Total Neto Calculado
            </span>
            <p className="text-base font-extrabold text-emerald-700 dark:text-emerald-300">
              ${calculatedNetoItems.toLocaleString()}
            </p>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
              Precio Real - Descuentos
            </span>
          </div>
        </div>

        {/* Balance validator badge */}
        <div
          className={`flex items-center justify-between text-xs px-3.5 py-2.5 rounded-xl border ${
            isBalanced
              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
              : "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            {isBalanced ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  ¡Balance exacto! Precio Real (${subtotalPrecioReal.toLocaleString()}) - Descuentos (${totalDescuentos.toLocaleString()}) = <strong>${total.toLocaleString()}</strong>
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Diferencia detectada: <strong>${difference.toLocaleString()}</strong> (Ticket: ${total.toLocaleString()} vs Ítems netos: ${calculatedNetoItems.toLocaleString()})
                </span>
              </>
            )}
          </div>
          {!isBalanced && (
            <button
              type="button"
              onClick={() => setTotal(Number(calculatedNetoItems.toFixed(2)))}
              className="underline font-bold hover:opacity-80 shrink-0"
            >
              Ajustar total a suma neta
            </button>
          )}
        </div>
      </div>

      {/* Items Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-md font-bold text-zinc-900 dark:text-zinc-100">
              Productos del Tiquete ({items.length})
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Registra el precio real por unidad y el descuento separado para cada producto
            </p>
          </div>
          <button
            type="button"
            onClick={addItemRow}
            className="flex items-center gap-1.5 text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Agregar Ítem Manual
          </button>
        </div>

        {/* Column Header for Desktop */}
        <div className="hidden sm:grid grid-cols-12 gap-2 text-[10px] font-bold uppercase text-zinc-400 px-3 pb-1">
          <span className="col-span-4">Producto (Nombre Canónico)</span>
          <span className="col-span-2">Categoría</span>
          <span className="col-span-2">Cant / Unidad</span>
          <span className="col-span-2">Precio Real Unitario</span>
          <span className="col-span-1">Descuento</span>
          <span className="col-span-1 text-right">Neto</span>
        </div>

        {/* Items List */}
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center transition-all hover:border-zinc-300 dark:hover:border-zinc-700"
            >
              {/* Product name */}
              <div className="sm:col-span-4">
                <label className="sm:hidden block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                  Producto
                </label>
                <input
                  type="text"
                  placeholder="Nombre normalizado del producto"
                  value={item.nombreCanonico}
                  onChange={(e) =>
                    handleItemChange(index, "nombreCanonico", e.target.value)
                  }
                  className="w-full text-xs sm:text-sm font-semibold px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-1 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              {/* Category */}
              <div className="sm:col-span-2">
                <label className="sm:hidden block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                  Categoría
                </label>
                <select
                  value={item.categoria}
                  onChange={(e) =>
                    handleItemChange(index, "categoria", e.target.value)
                  }
                  className="w-full text-xs px-2 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-1 focus:ring-emerald-500 outline-hidden text-zinc-700 dark:text-zinc-300"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity & Unit */}
              <div className="sm:col-span-2">
                <label className="sm:hidden block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                  Cantidad / Unidad
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    value={item.cantidad}
                    onChange={(e) =>
                      handleItemChange(
                        index,
                        "cantidad",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-14 text-xs px-2 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-1 focus:ring-emerald-500 outline-hidden font-medium"
                  />
                  <select
                    value={item.unidadMedida}
                    onChange={(e) =>
                      handleItemChange(index, "unidadMedida", e.target.value)
                    }
                    className="w-16 text-xs px-1.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-1 focus:ring-emerald-500 outline-hidden"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Precio Real Unitario */}
              <div className="sm:col-span-2">
                <label className="sm:hidden block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                  Precio Real Unitario ($)
                </label>
                <div className="relative">
                  <span className="absolute left-1.5 top-1.5 text-[10px] text-zinc-400">
                    $
                  </span>
                  <input
                    type="number"
                    step="any"
                    placeholder="Precio real"
                    value={item.precioUnitario}
                    onChange={(e) =>
                      handleItemChange(
                        index,
                        "precioUnitario",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-full text-xs font-bold pl-4 pr-1.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Descuento */}
              <div className="sm:col-span-1">
                <label className="sm:hidden block text-[10px] font-bold text-teal-600 uppercase mb-1">
                  Descuento ($)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0"
                  value={item.descuento || 0}
                  onChange={(e) =>
                    handleItemChange(
                      index,
                      "descuento",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="w-full text-xs font-semibold px-1.5 py-1.5 rounded-md border border-teal-200 dark:border-teal-800 bg-teal-50/60 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 outline-hidden text-right"
                />
              </div>

              {/* Total Neto & Delete Button */}
              <div className="sm:col-span-1 flex items-center justify-between sm:justify-end gap-2">
                <div className="text-right">
                  <span className="sm:hidden text-[10px] text-zinc-400 mr-2">Total Neto:</span>
                  <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                    ${(item.precioTotal || 0).toLocaleString()}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => removeItemRow(index)}
                  className="p-1.5 text-zinc-400 hover:text-red-600 rounded-md transition-colors"
                  title="Eliminar ítem"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action footer */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="px-5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-md transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Confirmar y Guardar
            </>
          )}
        </button>
      </div>
    </form>
  );
}
