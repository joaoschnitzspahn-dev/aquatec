/** Comprime foto da câmera para caber em Server Action / memória mobile. */

const MAX_EDGE = 1280;
const JPEG_QUALITY = 0.72;
const MAX_BYTES = 450_000; // ~450 KB em data URL

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler a imagem"));
    };
    img.src = url;
  });
}

function canvasToJpeg(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      if (!dataUrl || dataUrl === "data:,") {
        reject(new Error("Falha ao comprimir a imagem"));
        return;
      }
      resolve(dataUrl);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Redimensiona e comprime para JPEG leve.
 * Evita crash no iOS/Android ao enviar foto da câmera.
 */
export async function compressImageFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/") && file.type !== "") {
    throw new Error("Selecione uma imagem válida");
  }

  const img = await loadImage(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível neste navegador");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  let quality = JPEG_QUALITY;
  let dataUrl = await canvasToJpeg(canvas, quality);

  // Se ainda grande, reduz qualidade até caber
  while (dataUrl.length > MAX_BYTES && quality > 0.4) {
    quality -= 0.1;
    dataUrl = await canvasToJpeg(canvas, quality);
  }

  // Último recurso: shrink mais
  if (dataUrl.length > MAX_BYTES) {
    const shrink = 0.7;
    canvas.width = Math.max(1, Math.round(width * shrink));
    canvas.height = Math.max(1, Math.round(height * shrink));
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    dataUrl = await canvasToJpeg(canvas, 0.55);
  }

  return dataUrl;
}

/** Assinatura PNG costuma ser grande — exporta JPEG menor. */
export function compressSignatureDataUrl(
  canvas: HTMLCanvasElement,
): string | null {
  try {
    const w = canvas.width || 300;
    const h = canvas.height || 150;
    const out = document.createElement("canvas");
    out.width = Math.min(w, 600);
    out.height = Math.round((h / w) * out.width) || 150;
    const ctx = out.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(canvas, 0, 0, out.width, out.height);
    return out.toDataURL("image/jpeg", 0.7);
  } catch {
    return null;
  }
}
