import type { ToastPayload } from "../core/case/CaseEngine";
import { escapeHtml } from "./html";

export class Toast {
  constructor(private readonly host: HTMLElement) {}

  show(payload: ToastPayload): void {
    const item = document.createElement("div");
    item.className = `toast toast--${payload.tone ?? "normal"}`;
    item.innerHTML = `<span class="toast__eyebrow">${escapeHtml(payload.title)}</span><strong>${escapeHtml(payload.message)}</strong>`;
    this.host.append(item);
    requestAnimationFrame(() => item.classList.add("is-visible"));
    window.setTimeout(() => {
      item.classList.remove("is-visible");
      window.setTimeout(() => item.remove(), 280);
    }, 2800);
  }
}
