"use client";

import { jsPDF } from "jspdf";

export function generateVisitPdf(input: {
  clientName: string;
  employeeName: string;
  startedAt?: string;
  finishedAt?: string;
  observations?: string;
  checklist: { label: string; checked: boolean }[];
  usages: { name: string; quantity: number }[];
  photos: { type: string; url: string; caption?: string }[];
}) {
  const doc = new jsPDF();
  let y = 16;

  doc.setFontSize(18);
  doc.text("Aquatec — Relatório de Visita", 14, y);
  y += 10;
  doc.setFontSize(11);
  doc.text(`Cliente: ${input.clientName}`, 14, y);
  y += 6;
  doc.text(`Técnico: ${input.employeeName}`, 14, y);
  y += 6;
  if (input.startedAt) {
    doc.text(`Início: ${new Date(input.startedAt).toLocaleString("pt-BR")}`, 14, y);
    y += 6;
  }
  if (input.finishedAt) {
    doc.text(`Fim: ${new Date(input.finishedAt).toLocaleString("pt-BR")}`, 14, y);
    y += 6;
  }
  if (input.observations) {
    y += 2;
    doc.text("Observações:", 14, y);
    y += 6;
    const lines = doc.splitTextToSize(input.observations, 180);
    doc.text(lines, 14, y);
    y += lines.length * 6 + 4;
  }

  y += 2;
  doc.setFontSize(13);
  doc.text("Checklist", 14, y);
  y += 7;
  doc.setFontSize(10);
  input.checklist.forEach((item) => {
    if (y > 270) {
      doc.addPage();
      y = 16;
    }
    doc.text(`${item.checked ? "[x]" : "[ ]"} ${item.label}`, 14, y);
    y += 5;
  });

  y += 4;
  doc.setFontSize(13);
  doc.text("Produtos", 14, y);
  y += 7;
  doc.setFontSize(10);
  input.usages.forEach((u) => {
    doc.text(`- ${u.name}: ${u.quantity}`, 14, y);
    y += 5;
  });

  const before = input.photos.find((p) => p.type === "ARRIVAL");
  const after = input.photos.find((p) => p.type === "FINAL");
  [before, after].forEach((photo, idx) => {
    if (!photo?.url?.startsWith("data:image")) return;
    try {
      if (y > 200) {
        doc.addPage();
        y = 16;
      }
      y += 6;
      doc.text(idx === 0 ? "Antes" : "Depois", 14, y);
      y += 4;
      doc.addImage(photo.url, "JPEG", 14, y, 80, 60);
      y += 66;
    } catch {
      // ignore invalid image
    }
  });

  doc.save(`aquatec-visita-${input.clientName.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}
