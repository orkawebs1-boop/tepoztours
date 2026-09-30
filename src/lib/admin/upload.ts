"use client";

import { supabaseBrowser } from "../supabase/client";

const MAX_SIDE = 2000;

/**
 * Redimensiona la imagen en el navegador (máx. 2000 px, WebP) y la sube al
 * bucket público «media». Devuelve la URL pública.
 */
export async function uploadImage(file: File, folder: string): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("El archivo no es una imagen.");
  const blob = file.type === "image/svg+xml" ? file : await toWebp(file);
  const ext = blob.type === "image/svg+xml" ? "svg" : "webp";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const sb = supabaseBrowser();
  const { error } = await sb.storage.from("media").upload(path, blob, {
    contentType: blob.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return sb.storage.from("media").getPublicUrl(path).data.publicUrl;
}

async function toWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const out = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.84));
  return out ?? file;
}

/** Abre el selector de archivos y devuelve las imágenes elegidas. */
export function pickImages(multiple = false): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = multiple;
    input.onchange = () => resolve(Array.from(input.files ?? []));
    input.click();
  });
}
