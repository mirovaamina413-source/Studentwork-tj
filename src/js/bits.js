export function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function logo() {
  return `<span class="inline-flex items-center gap-2.5">
    <svg viewBox="0 0 48 48" class="h-10 w-10" aria-hidden="true"><rect width="48" height="48" rx="14" fill="#0e4f3f"/><path d="M10 31V18.5L24 10l14 8.5V31" fill="none" stroke="#f3efe6" stroke-width="2.4"/><path d="M24 11.2l2.7 3.6 4 .3-3 2.6.9 3.9L24 19.6l-4.6 2 .9-3.9-3-2.6 4-.3 2.7-3.6z" fill="#d4a017"/><rect x="20.2" y="26" width="7.6" height="9" rx="1.4" fill="#f3efe6"/></svg>
    <span class="font-display text-[1.05rem] font-semibold tracking-tight">StudentWork<span class="text-gold">.tj</span></span>
    <span class="brand-badge">TJ</span>
  </span>`;
}

export function stars(avg, count, light = false) {
  const active = Math.round(avg || 0);
  const glyphs = [1, 2, 3, 4, 5]
    .map((star) => `<svg viewBox="0 0 20 20" class="h-3.5 w-3.5" fill="${star <= active && count ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.4"><path d="M10 1.8l2.2 4.7 5.1.5-3.9 3.4 1.2 5.1L10 13.2 5.4 15.5l1.2-5.1L2.7 7l5.1-.5L10 1.8z"/></svg>`)
    .join("");
  const label = count ? `${avg.toFixed(1)} ★` : "Нав";
  return `<span class="inline-flex items-center gap-1"><span class="inline-flex text-gold">${glyphs}</span><span class="text-sm font-bold ${light ? "text-cream" : "text-ink"}">${label}</span></span>`;
}

export function avatar(name, hue = 160, size = "md") {
  const parts = String(name || "?").trim().split(/\s+/);
  const letters = esc(`${parts[0]?.[0] || ""}${parts[1]?.[0] || ""}`);
  const box = size === "lg" ? "h-16 w-16 text-xl" : size === "sm" ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm";
  return `<span class="grid shrink-0 place-items-center rounded-2xl font-extrabold text-white ${box}" style="background:hsl(${Number(hue) || 160} 42% 32%)">${letters}</span>`;
}

export function verified(label = "Тасдиқшуда") {
  return `<span class="inline-flex items-center gap-1 rounded-full bg-mist px-2 py-0.5 text-[11px] font-bold text-pine">${esc(label)}</span>`;
}

export function feeBadge() {
  return `<span class="inline-flex items-center rounded-full bg-gold-soft px-2.5 py-1 text-[11px] font-extrabold text-ink">Комиссия 5–10%</span>`;
}

export function escrow(light = false) {
  const tone = light ? "text-cream" : "text-pine";
  return `<div class="${light ? "" : "trust-banner"}">
    ${light ? "" : `<span class="trust-mark" aria-hidden="true">◈</span>`}
    <p class="text-sm leading-snug ${tone}"><strong class="font-extrabold">Пул дар ҳисоби махсус нигоҳ дошта мешавад</strong> то иҷрои кор</p>
  </div>`;
}

export function levelPill(name) {
  const gold = name === "ПРО-Донишҷӯ";
  const fresh = name === "Новичок";
  const tone = gold ? "bg-gold text-ink" : fresh ? "bg-white text-ink ring-1 ring-line" : "bg-pine text-cream";
  return `<span class="inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold ${tone}">${esc(name)}</span>`;
}

export function modalShell(title, subtitle, body, extraClass = "") {
  const fit = extraClass.includes("modal-card-fit");
  const frame = fit
    ? "modal-card modal-card-fit relative w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white p-4 shadow-[0_30px_80px_rgba(15,23,42,0.28)] sm:p-5"
    : "modal-card relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/70 bg-white p-5 shadow-[0_30px_80px_rgba(15,23,42,0.28)] sm:p-7";
  return `<div class="modal-root fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center" role="dialog" aria-modal="true">
    <button type="button" class="modal-backdrop absolute inset-0" data-action="close" aria-label="Пӯшидан"></button>
    <div class="${frame}">
      <div class="modal-head">
        <div><h2 class="text-xl font-extrabold tracking-tight">${esc(title)}</h2>${subtitle ? `<p class="mt-1 text-sm text-slate-500">${esc(subtitle)}</p>` : ""}</div>
        <button type="button" class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cream text-lg text-ink" data-action="close" aria-label="Пӯшидан">×</button>
      </div>
      ${body}
    </div>
  </div>`;
}
