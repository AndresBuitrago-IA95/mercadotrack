"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { InvoiceUploader } from "@/components/InvoiceUploader";
import { InvoiceReviewForm } from "@/components/InvoiceReviewForm";
import { ExtractedInvoice } from "@/lib/gemini";
import { saveInvoice, InvoiceInputData } from "@/actions/facturas";

export default function NuevaCompraPage() {
  const router = useRouter();
  const [extractedData, setExtractedData] = useState<ExtractedInvoice | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleExtracted = (data: ExtractedInvoice) => {
    setExtractedData(data);
    setErrorMessage(null);
  };

  const handleSave = async (data: InvoiceInputData) => {
    try {
      setIsSaving(true);
      setErrorMessage(null);

      const res = await saveInvoice(data);
      if (!res.success) {
        throw new Error(res.error || "No se pudo guardar la factura.");
      }

      setSuccessMessage("¡Factura y productos guardados con éxito!");
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1200);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Error al guardar en la base de datos."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setExtractedData(null);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al Inicio
          </Link>
          <div className="flex items-center gap-1.5 text-xs font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gemini OCR</span>
          </div>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Registrar Nueva Compra
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Escanea tu tirilla de supermercado para digitalizar y rastrear precios automáticamente.
          </p>
        </div>

        {/* Success toast */}
        {successMessage && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-2xl shadow-sm">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="font-semibold text-sm">{successMessage}</p>
          </div>
        )}

        {/* Error toast */}
        {errorMessage && (
          <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 rounded-2xl text-sm font-medium">
            {errorMessage}
          </div>
        )}

        {/* Flow Switcher */}
        {!extractedData ? (
          <InvoiceUploader onExtracted={handleExtracted} />
        ) : (
          <InvoiceReviewForm
            initialData={extractedData}
            onSave={handleSave}
            onCancel={handleCancel}
            isSaving={isSaving}
          />
        )}
      </div>
    </div>
  );
}
