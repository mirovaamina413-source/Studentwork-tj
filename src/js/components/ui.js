import { esc } from "../bits.js";

export function EmptyState({ title, text, action, view, modal, act }) {
  const attrs = view
    ? `data-action="go" data-view="${esc(view)}"`
    : act
      ? `data-action="${esc(act)}"`
      : `data-action="open" data-modal="${esc(modal || "login")}"`;
  const button = action ? `<button type="button" class="btn btn-primary" ${attrs}>${esc(action)}</button>` : "";
  return `<div class="empty-state" role="status"><p class="empty-title">${esc(title)}</p>${text ? `<p>${esc(text)}</p>` : ""}${button}</div>`;
}

function bone(className) {
  return `<span class="sk-bone ${className}"></span>`;
}

export function SkeletonLoader(kind = "cards") {
  if (kind === "profile") {
    return `<div class="page" aria-hidden="true"><div class="sk-card sk-profile">${bone("sk-avatar")}<div class="grid flex-1 gap-2">${bone("sk-line w-24")}${bone("sk-line w-48")}${bone("sk-line w-36")}</div></div><div class="sk-card mt-4">${bone("sk-line")}${bone("sk-line")}${bone("sk-line w-40")}</div></div>`;
  }
  if (kind === "dashboard") {
    return `<div class="page" aria-hidden="true"><div class="sk-card">${bone("sk-line w-28")}${bone("sk-line w-56")}</div><div class="mt-4 grid gap-3 sm:grid-cols-3">${bone("sk-block")}${bone("sk-block")}${bone("sk-block")}</div><div class="sk-card mt-4">${bone("sk-line")}${bone("sk-line")}${bone("sk-line w-44")}</div></div>`;
  }
  if (kind === "leaderboard") {
    return `<div class="page" aria-hidden="true">${[1, 2, 3, 4, 5].map(() => `<div class="sk-row">${bone("sk-avatar")}<div class="grid flex-1 gap-2">${bone("sk-line w-40")}${bone("sk-line w-28")}</div>${bone("sk-pill")}</div>`).join("")}</div>`;
  }
  if (kind === "notices") {
    return `<div class="page" aria-hidden="true">${[1, 2, 3, 4].map(() => `<div class="sk-row"><div class="grid flex-1 gap-2">${bone("sk-line w-52")}${bone("sk-line w-32")}</div></div>`).join("")}</div>`;
  }
  return `<div class="page" aria-hidden="true"><div class="job-board">${[1, 2, 3, 4, 5, 6].map(() => `<article class="sk-card sk-job">${bone("sk-line w-24")}${bone("sk-line w-40")}${bone("sk-line")}${bone("sk-line w-32")}${bone("sk-btn")}</article>`).join("")}</div></div>`;
}

export function TransactionList(rows) {
  if (!rows) return "";
  return `<ul class="tx-list">${rows}</ul>`;
}
