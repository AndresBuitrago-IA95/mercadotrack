"use client";

import React, { useState, useRef } from "react";
import { Camera, UploadCloud, AlertCircle, Loader2, Image as ImageIcon } from "lucide-react";
import { ExtractedInvoice } from "@/lib/gemini";

interface InvoiceUploaderProps {
  onExtracted: (data: ExtractedInvoice, previewUrl: string) => void;
}

type UploadState = "idle" | "uploading" | "extracting" | "error";

export function InvoiceUploader({ onExtracted }: InvoiceUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<UploadState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const processFile = async (file: File) => {
    try {
      setErrorMessage(null);
      setStatus("uploading");

      // Local preview
      const localUrl = URL.createObjectURL(file);
      setPreview(localUrl);

      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          setStatus("extracting");

          const response = await fetch("/api/extract", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              base64Image: base64Data,
              mimeType: file.type || "image/jpeg",
            }),
          });

          const result = await response.json();

          if (!response.ok || !result.success) {
            throw new Error(result.error || "No se pudo extraer la información del ticket.");
          }

          setStatus("idle");
          onExtracted(result.data, localUrl);
        } catch (err: unknown) {
          setStatus("error");
          setErrorMessage(
            err instanceof Error ? err.message : "Error al procesar con IA."
          );
        }
      };

      reader.onerror = () => {
        setStatus("error");
        setErrorMessage("Error al leer el archivo seleccionado.");
      };

      reader.readAsDataURL(file);
    } catch (err: unknown) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Error inesperado al cargar la imagen."
      );
    }
  };

  const isProcessing = status === "uploading" || status === "extracting";

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* Hidden inputs for camera and gallery */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="border-2 border-dashed border-emerald-300 dark:border-emerald-800/80 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 p-6 sm:p-8 text-center transition-all">
        {preview && (
          <div className="mb-4 relative rounded-xl overflow-hidden max-h-64 border border-zinc-200 dark:border-zinc-700 mx-auto w-fit shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Previsualización de ticket"
              className="max-h-64 object-contain"
            />
            {isProcessing && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4">
                <Loader2 className="w-9 h-9 animate-spin text-emerald-400 mb-2" />
                <p className="font-semibold text-sm">
                  {status === "uploading" ? "Cargando imagen..." : "Analizando ticket con Gemini..."}
                </p>
                <p className="text-xs text-zinc-300 mt-1">Normalizando productos y precios</p>
              </div>
            )}
          </div>
        )}

        {!preview && (
          <div className="py-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              Sube o toma una foto de tu tirilla
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              Gemini OCR detectará el comercio, fecha, productos y precios automáticamente.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-sm mx-auto">
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => cameraInputRef.current?.click()}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-xl shadow-sm transition-colors disabled:opacity-50"
          >
            <Camera className="w-5 h-5" />
            Tomar Foto
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 font-medium py-3 px-4 rounded-xl shadow-sm transition-colors disabled:opacity-50"
          >
            <ImageIcon className="w-5 h-5 text-zinc-500" />
            Galería / Archivo
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl text-red-700 dark:text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Ocurrió un error:</p>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}
