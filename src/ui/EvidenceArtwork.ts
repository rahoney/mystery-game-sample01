import type { Evidence } from "../core/case/schemas";
import { escapeHtml } from "./html";

const fallbackByFile: Record<string, string> = {
  "usb-red.png": "/assets/placeholders/object-usb.svg",
  "access-card-blue.png": "/assets/placeholders/object-card.svg",
  "torn-note.png": "/assets/placeholders/object-note.svg",
  "coffee-cup.png": "/assets/placeholders/object-cup.svg",
  "red-book.png": "/assets/placeholders/object-book.svg",
  "black-umbrella.png": "/assets/placeholders/object-umbrella.svg",
  "medicine-pack.png": "/assets/placeholders/object-medicine.svg",
  "brass-key.png": "/assets/placeholders/object-key.svg",
  "receipt.png": "/assets/placeholders/object-receipt.svg",
  "locker-tag.png": "/assets/placeholders/object-tag.svg",
};

export function evidenceArtwork(evidence: Evidence, className: string): string {
  const source = evidence.asset ?? "";
  const filename = source.split("/").at(-1) ?? "";
  const fallback = fallbackByFile[filename] ?? "/assets/placeholders/object-note.svg";
  return `<img class="${escapeHtml(className)}" src="${escapeHtml(source || fallback)}" data-fallback="${escapeHtml(fallback)}" alt="${escapeHtml(evidence.name)}" loading="lazy" />`;
}
