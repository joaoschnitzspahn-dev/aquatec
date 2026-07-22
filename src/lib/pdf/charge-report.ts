"use client";

import { jsPDF } from "jspdf";
import { AQUATEC_PIX } from "@/lib/pix";

function money(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function dateBr(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("pt-BR");
}

function timeBr(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function loadLogoDataUrl() {
  try {
    const res = await fetch("/aquatec-logo.png");
    if (!res.ok) return undefined;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}

export async function generateChargePdf(input: {
  clientName: string;
  employeeName: string;
  issuedAt: string;
  dueDate?: string;
  total: number;
  pixPayload?: string;
  qrDataUrl?: string;
  logoDataUrl?: string;
  items: {
    name: string;
    quantity: number;
    unit?: string;
    unitPrice: number;
    total: number;
    deliveredAt?: string;
  }[];
}) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentW = pageW - margin * 2;
  let y = 12;

  const logoDataUrl = input.logoDataUrl || (await loadLogoDataUrl());
  if (logoDataUrl) {
    // Logo recortada ~939x293 (proporção larga)
    const logoW = 72;
    const logoH = logoW * (293 / 939);
    const logoX = (pageW - logoW) / 2;
    try {
      doc.addImage(logoDataUrl, "PNG", logoX, y, logoW, logoH, undefined, "FAST");
      y += logoH + 6;
    } catch {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(15, 90, 140);
      doc.text("AQUATEC", pageW / 2, y + 8, { align: "center" });
      y += 14;
    }
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(15, 90, 140);
    doc.text("AQUATEC", pageW / 2, y + 8, { align: "center" });
    y += 14;
  }

  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("RELATÓRIO DE PRODUTOS E SERVIÇOS", pageW / 2, y, {
    align: "center",
  });
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);
  doc.text(
    "Demonstrativo Geral e Atual de Produtos e Serviços",
    pageW / 2,
    y,
    { align: "center" },
  );
  y += 8;

  doc.setDrawColor(200, 210, 220);
  doc.line(margin, y, pageW - margin, y);
  y += 7;

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(9);
  doc.text(`Data de Emissão: ${dateBr(input.issuedAt)}`, margin, y);
  doc.text(`Emitido por: ${input.employeeName}`, margin + 70, y);
  doc.text(`Hora: ${timeBr(input.issuedAt)}`, pageW - margin, y, {
    align: "right",
  });
  y += 7;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Cliente: ${input.clientName}`, margin, y);
  y += 8;

  // Table header
  const col = {
    product: margin,
    type: margin + 62,
    qty: margin + 88,
    delivered: margin + 108,
    unit: margin + 145,
    total: pageW - margin,
  };

  doc.setFillColor(15, 90, 140);
  doc.rect(margin, y - 4, contentW, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Produto", col.product + 1, y);
  doc.text("Tipo", col.type, y);
  doc.text("Qtd", col.qty, y);
  doc.text("Entrega", col.delivered, y);
  doc.text("Unit.", col.unit, y);
  doc.text("Total", col.total, y, { align: "right" });
  y += 7;

  doc.setTextColor(35, 35, 35);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);

  input.items.forEach((item, idx) => {
    if (y > 250) {
      doc.addPage();
      y = 16;
    }
    if (idx % 2 === 0) {
      doc.setFillColor(245, 248, 250);
      doc.rect(margin, y - 4, contentW, 9, "F");
    }
    const nameLines = doc.splitTextToSize(item.name, 58);
    doc.setFont("helvetica", "bold");
    doc.text(nameLines[0], col.product + 1, y);
    doc.setFont("helvetica", "normal");
    doc.text(item.unit || "un", col.type, y);
    doc.text(String(item.quantity), col.qty, y);
    doc.text(dateBr(item.deliveredAt || input.issuedAt), col.delivered, y);
    doc.text(money(item.unitPrice), col.unit, y);
    doc.text(money(item.total), col.total, y, { align: "right" });
    y += Math.max(9, nameLines.length * 4 + 4);
  });

  y += 2;
  doc.setFillColor(230, 242, 250);
  doc.rect(margin, y - 4, contentW, 10, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 90, 140);
  doc.text("Total à Pagar:", margin + 2, y + 2);
  doc.text(money(input.total), pageW - margin - 2, y + 2, { align: "right" });
  y += 16;

  // PIX block
  if (y > 200) {
    doc.addPage();
    y = 16;
  }

  doc.setFillColor(15, 90, 140);
  doc.roundedRect(margin, y, contentW, 8, 1, 1, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("PAGAMENTO VIA PIX", pageW / 2, y + 5.5, { align: "center" });
  y += 14;

  doc.setTextColor(40, 40, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Chave PIX: ${AQUATEC_PIX.key}`, margin, y);
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text(`Valor: ${money(input.total)}`, margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.text(
    `Vencimento: ${dateBr(input.dueDate || input.issuedAt)}`,
    margin,
    y,
  );
  y += 10;

  if (input.pixPayload) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("PIX COPIA E COLA", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(60, 60, 60);
    const pixLines = doc.splitTextToSize(input.pixPayload, contentW);
    doc.setDrawColor(210, 210, 210);
    doc.setFillColor(248, 248, 248);
    const boxH = pixLines.length * 3.2 + 4;
    doc.roundedRect(margin, y - 2, contentW, boxH, 1, 1, "FD");
    doc.text(pixLines, margin + 2, y + 2);
    y += boxH + 6;
  }

  if (input.qrDataUrl) {
    const qrSize = 42;
    const qrX = (pageW - qrSize) / 2;
    try {
      doc.addImage(input.qrDataUrl, "PNG", qrX, y, qrSize, qrSize);
      y += qrSize + 6;
    } catch {
      // ignore invalid QR image
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text("Escaneie para pagar", pageW / 2, y, { align: "center" });
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(90, 90, 90);
    const tip = doc.splitTextToSize(
      "Abra o aplicativo do seu banco, escolha a opção PIX Copia e Cola, cole o código acima e confirme o pagamento.",
      contentW - 10,
    );
    doc.text(tip, pageW / 2, y, { align: "center" });
    y += tip.length * 4 + 6;
  }

  doc.setFillColor(255, 243, 205);
  doc.setDrawColor(245, 198, 90);
  doc.roundedRect(margin, y, contentW, 12, 1, 1, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(140, 90, 10);
  doc.text(
    "IMPORTANTE: Após o pagamento, envie o comprovante!",
    pageW / 2,
    y + 7.5,
    { align: "center" },
  );

  const slug = input.clientName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase()
    .slice(0, 40);
  doc.save(`aquatec-cobranca-${slug || "cliente"}.pdf`);
}
