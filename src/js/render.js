import { guarantees, howSteps } from "../data/mock.js";
import {
  avgRating,
  badgesFor,
  CATEGORIES,
  completeness,
  DAYS,
  directionAverage,
  employerName,
  escrowEstimate,
  feePercentLabel,
  feeRate,
  filterJobs,
  formatDate,
  formatMoney,
  formatStars,
  HOURS,
  isFreeToday,
  isOpenStatus,
  JOB_CATEGORIES,
  levelFor,
  LOCATIONS,
  selectedCities,
  payLabel,
  portfolioFor,
  rangeLabel,
  SKILLS,
  sortJobs,
  summarizeAvailability,
  todayWindow,
  VIP_PIN_FEE,
} from "../lib/utils.js";
import { avatar, escrow, esc, feeBadge, levelPill, logo, modalShell, stars, verified } from "./bits.js";
import { completedCount, filterDiscovery, jobDeadline, jobOnline, jobSkills, matchStudents, responseRate, skillChoices, workCategories } from "../lib/work.js";
import { EmptyState, SkeletonLoader, TransactionList } from "./components/ui.js";
import { progressFor } from "./progress.js";
import { currentUser } from "./store.js";

const STATUS = { open: "Кушода", published: "Нашршуда", filled: "Пур шуд", done: "Анҷом ёфт" };
const APP_STATUS = {
  pending: "Интизор",
  accepted: "Пул дар ҳисоби махсус",
  completed: "Пардохт озод шуд",
  declined: "Рад шуд",
};

const SORTS = [
  { value: "vip", label: "Аввал VIP" },
  { value: "new", label: "Навтарин" },
  { value: "pay", label: "Маблағи баланд" },
];

const PIN = `<svg viewBox="0 0 20 20" class="h-4 w-4" aria-hidden="true"><path d="M10 17s5-4.2 5-8.1A5 5 0 0 0 5 8.9C5 12.8 10 17 10 17z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="10" cy="8.5" r="1.6" fill="currentColor"/></svg>`;
const CHEVRON = `<svg viewBox="0 0 20 20" class="picker-chevron" aria-hidden="true"><path d="M5 7.5 10 12.5 15 7.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;

function picker(state, { id, label, value, options, compact = false, field = false, plain = false }) {
  const open = state.picker === id;
  const current = options.find((item) => item.value === value) || options[0];
  return `<div class="picker ${compact ? "picker-compact" : ""} ${field ? "picker-field" : ""} ${open ? "is-open" : ""}">
    <button type="button" class="picker-btn" data-action="picker" data-picker="${esc(id)}" aria-expanded="${open}" aria-haspopup="listbox">
      ${field || plain ? "" : `<span class="picker-icon">${PIN}</span>`}
      <span class="min-w-0">${!plain && label ? `<span class="picker-label">${esc(label)}</span>` : ""}<span class="picker-value">${esc(current?.label || "")}</span></span>
      ${CHEVRON}
    </button>
    ${open ? `<ul class="picker-menu" role="listbox">${options.map((item) => `<li><button type="button" role="option" aria-selected="${item.value === value}" class="picker-option ${item.value === value ? "is-on" : ""}" data-action="pick" data-picker="${esc(id)}" data-value="${esc(item.value)}"><span>${esc(item.label)}</span>${item.value === value ? "<span aria-hidden='true'>✓</span>" : ""}</button></li>`).join("")}</ul>` : ""}
  </div>`;
}

function choices(id, options, value) {
  return `<div class="flex flex-wrap gap-2">${options.map((item) => `<button type="button" class="chip" data-on="${item.value === value}" data-action="pick" data-picker="${esc(id)}" data-value="${esc(item.value)}">${esc(item.label)}</button>`).join("")}</div>`;
}

function cardPalette(category) {
  if (category === "Промоутер" || category === "СММ" || category === "Дизайн" || category === "СММ & Дизайн") return ["#a78bfa", "#f472b6", "rgba(167,139,250,.45)"];
  if (category === "Тарҷума" || category === "Пешхизмат") return ["#2dd4bf", "#38bdf8", "rgba(45,212,191,.45)"];
  if (category === "Доставка" || category === "Кумакчӣ дар офис") return ["#fb923c", "#f43f5e", "rgba(251,146,60,.45)"];
  return ["#a78bfa", "#f472b6", "rgba(167,139,250,.45)"];
}

function shortJobDate(iso) {
  const months = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  const [, month, day] = String(iso || "").split("-");
  const d = Number(day);
  const m = Number(month);
  if (!d || m < 1 || m > 12) return "";
  return `${d} ${months[m - 1]}`;
}

function jobCard(job, state, opts = {}) {
  const client = state.data.users.find((user) => user.id === job.employerId);
  const name = employerName(client);
  const letter = [...name][0] || "К";
  const rating = avgRating(state.data.ratings, job.employerId);
  const [c1, c2, glow] = cardPalette(job.category);
  const hours = shiftHours(job);
  const fresh = Boolean(opts.fresh || state.freshJobId === job.id);
  const badge = job.rush ? "Таъҷилӣ" : fresh ? "Нав" : "";
  const unit = job.payType === "hourly" ? " / соат" : " / кор";
  const icon = (typeof CHIP_ICON !== "undefined" && (CHIP_ICON[job.category] || CHIP_ICON["Ҳама"])) || "";
  return `<article class="card" style="--c1:${c1};--c2:${c2};--glow:${glow}">
    <div class="bar"></div>
    <div class="top"><div class="tile">${icon}</div>${badge ? `<span class="badge">${badge}</span>` : ""}</div>
    <h3 class="title">${esc(job.title)}</h3>
    <div class="price">${esc(formatMoney(job.payAmount))} сомонӣ<small>${unit}</small></div>
    <div class="employer"><div class="avatar">${esc(letter)}</div><span>${esc(name)}</span>${client?.verified ? `<span class="ok">✓ Тасдиқшуда</span>` : ""}</div>
    <div class="metas">${hours ? `<span class="meta">${esc(hours)}</span>` : ""}<span class="meta">${esc(job.location)}</span><span class="meta">${esc(shortJobDate(job.date))}</span></div>
    <div class="rating">${rating.count ? `★ ${rating.avg.toFixed(1)} <span>· ${rating.count} баҳо</span>` : `★ <span>Ҳоло баҳо нест</span>`}</div>
    <button type="button" class="btn" data-action="open-job" data-id="${esc(job.id)}">Ҷавоб додан →</button>
  </article>`;
}

const BARS_ICON = `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3.5 5.5h13M3.5 10h13M3.5 14.5h13" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`;
const PIN_ICON = `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 17.2s5-4.1 5-8.1a5 5 0 0 0-10 0c0 4 5 8.1 5 8.1Z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="10" cy="9" r="1.6" fill="currentColor"/></svg>`;
const HEART_ICON = `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 16.2 4.2 10.6a3.4 3.4 0 0 1 4.8-4.8L10 6.8l1-1a3.4 3.4 0 0 1 4.8 4.8L10 16.2Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
const BELL_ICON = `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 14.2V10a5 5 0 0 1 10 0v4.2l1 1.3H4l1-1.3Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M8.4 16.2a1.6 1.6 0 0 0 3.2 0" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`;

function cityButtonLabel(location) {
  const cities = selectedCities(location);
  if (!cities.length) return "Ҳама шаҳрҳо";
  if (cities.length === 1) return cities[0];
  return `${cities.length} шаҳр`;
}

function searchBar(state) {
  const f = state.filters;
  const open = state.picker === "filters";
  const categories = CATEGORIES.map((item) => ({ value: item, label: item === "Ҳама" ? "Ҳама категорияҳо" : item }));
  const group = (title, key, options, current) => `<div class="filter-group"><p>${title}</p><div class="filter-options">${options.map((item) => `<button type="button" class="chip" data-on="${item.value === current}" data-action="filter-set" data-key="${key}" data-value="${esc(item.value)}">${esc(item.label)}</button>`).join("")}</div></div>`;
  return `<div class="picker top-search-wrap ${open ? "is-open" : ""}">
    <button type="button" class="band-btn" data-action="picker" data-picker="filters" aria-expanded="${open}">${BARS_ICON}<span>Бандҳо</span></button>
    <form id="search-form" class="top-search">
      <input type="hidden" name="location" value="${esc(f.location)}">
      <input type="hidden" name="category" value="${esc(f.category)}">
      <label class="search-keyword"><span class="sr-only">Калима</span>
        <input id="search-q" name="q" value="${esc(f.q)}" placeholder="Пешхизмат, тарҷума, SMM..." aria-label="Калимаи ҷустуҷӯ"></label>
      <button class="search-word" type="submit">Ҷустуҷӯ</button>
    </form>
    <button type="button" class="city-btn" data-action="cities">${PIN_ICON}<span>${esc(cityButtonLabel(f.location))}</span></button>
    ${open ? `<div class="filter-panel" role="dialog" aria-label="Бандҳо">${group("Категория", "category", categories, f.category)}</div>` : ""}
  </div>`;
}

function pills(active, action) {
  return `<div class="cat-scroll">${CATEGORIES.map((category) => `<button type="button" class="chip" data-on="${category === active}" data-action="${action}" data-category="${esc(category)}">${esc(category)}</button>`).join("")}</div>`;
}

function schedule(value = {}, readOnly = false) {
  const head = HOURS.map((hour) => `<div class="schedule-hour">${hour}</div>`).join("");
  const rows = DAYS.map((day) => {
    const cells = HOURS.map((hour) => {
      const on = (value[day.id] || []).includes(hour);
      return `<button type="button" class="hour-cell ${on ? "hour-on" : "hour-off"}" ${readOnly ? "disabled" : ""} data-action="hour" data-day="${day.id}" data-hour="${hour}" aria-pressed="${on}" aria-label="${esc(day.label)} ${hour}:00"></button>`;
    }).join("");
    return `<div class="schedule-day"><span class="md:hidden">${day.short}</span><span class="hidden md:inline">${esc(day.label)}</span></div>${cells}`;
  }).join("");
  const lines = summarizeAvailability(value);
  return `<div class="schedule-scroll"><div class="schedule-grid"><div></div>${head}${rows}</div></div>
    <ul class="mt-3 grid gap-1 text-sm font-semibold">${lines.length ? lines.map((line) => `<li>${esc(line)}</li>`).join("") : "<li>Соатҳои озод ҳанӯз интихоб нашудаанд.</li>"}</ul>`;
}

function studentMap(state) {
  const students = state.data.users.filter((user) => user.role === "student");
  const needle = state.mapQuery.trim().toLowerCase();
  const pins = [
    { name: "Хуҷанд", x: 50, y: 22 },
    { name: "Душанбе", x: 30, y: 48 },
    { name: "Ваҳдат", x: 70, y: 48 },
    { name: "Бохтар", x: 50, y: 76 },
  ];
  const matched = students.filter((student) => {
    if (student.city !== state.mapCity) return false;
    if (!needle) return true;
    return `${student.name} ${student.skills.join(" ")} ${student.university}`.toLowerCase().includes(needle);
  });
  const pinHtml = pins.map(({ name, x, y }) => {
    const count = students.filter((student) => student.city === name && (!needle || `${student.name} ${student.skills.join(" ")}`.toLowerCase().includes(needle))).length;
    const active = state.mapCity === name ? "is-on" : "";
    return `<button type="button" data-action="map-city" data-city="${esc(name)}" class="map-pin ${active}" style="left:${x}%;top:${y}%"><span class="map-dot" aria-hidden="true"></span>${esc(name)} · ${count}</button>`;
  }).join("");
  const list = matched.length
    ? matched.map((student) => {
        const rating = avgRating(state.data.ratings, student.id);
        const free = isFreeToday(student) ? ` · имрӯз ${todayWindow(student)}` : "";
        return `<li class="flex items-center gap-3 rounded-2xl bg-cream px-3 py-2">${avatar(student.name, student.hue, "sm")}<div class="min-w-0"><p class="truncate text-sm font-extrabold">${esc(student.name)}</p><p class="truncate text-xs text-ink/60">${esc(student.skills.join(" · ") || "Маҳорат нест")}${esc(free)}</p></div><div class="ml-auto flex items-center gap-2">${student.verified ? verified("Тасдиқ") : ""}${stars(rating.avg, rating.count)}</div></li>`;
      }).join("")
    : `<li>${EmptyState({ title: "Дар ин шаҳр донишҷӯ нест.", text: "Ном ё маҳоратро тоза кунед, ё шаҳри дигарро интихоб кунед.", action: "Тоза кардани ҷустуҷӯ", act: "clear-map" })}</li>`;
  return `<section class="rounded-[1.8rem] border border-line bg-paper p-4 sm:p-5">
    <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div><p class="text-xs font-extrabold tracking-wider text-pine">ҶУСТУҶӮИ МАКОН</p><h3 class="text-xl font-extrabold">Донишҷӯёни озод дар харита</h3></div>
      <input id="map-query" class="field max-w-xs" value="${esc(state.mapQuery)}" placeholder="Ном ё маҳорат..." aria-label="Ҷустуҷӯи донишҷӯ">
    </div>
    <div class="city-map">
      <div class="city-map-stage">
      <svg viewBox="0 0 100 100" class="city-map-svg" preserveAspectRatio="none" aria-hidden="true">
        <path d="M50 22 L30 48 L50 76 L70 48 Z" fill="rgba(28,122,98,0.08)" stroke="#0f766e" stroke-width="0.85" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M30 48 L70 48 M50 22 L50 76" fill="none" stroke="#0f766e" stroke-width="0.55" stroke-linecap="round" stroke-dasharray="1.6 1.2"/>
      </svg>
      ${pinHtml}
      </div>
    </div>
    <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm font-bold">${matched.length} донишҷӯ дар ${esc(state.mapCity)}</p>
      <button type="button" class="btn btn-line" data-action="publish" data-location="${esc(state.mapCity)}">Кор дар ${esc(state.mapCity)}</button>
    </div>
    <ul class="mt-3 grid gap-2">${list}</ul>
  </section>`;
}

function cvCard(user, state) {
  const rating = avgRating(state.data.ratings, user.id);
  const level = levelFor(user.experience);
  const lines = summarizeAvailability(user.availability);
  const portfolio = portfolioFor(user, state.data.applications, state.data.jobs);
  const work = portfolio.length
    ? portfolio.map((item) => `<li class="rounded-2xl bg-cream px-3 py-2"><span class="font-bold">${esc(item.title)}</span><span class="mt-0.5 block text-ink/60">${esc(item.category)} · ${esc(item.pay)} · ${esc(formatDate(item.date))} · ${esc(item.location)}</span></li>`).join("")
    : `<li class="text-ink/60">Пас аз анҷоми кор ин ҷо худкор пур мешавад.</li>`;
  return `<article class="cv-sheet overflow-hidden rounded-[1.7rem] border border-line bg-paper">
    <header class="bg-pine px-5 py-5 text-cream"><p class="font-display text-xs tracking-[0.16em] text-gold">STUDENTWORK.TJ · РЕЗЮМЕ</p><h3 class="mt-2 text-2xl font-extrabold">${esc(user.name)}</h3>
      <div class="mt-2 flex flex-wrap items-center gap-2 text-sm">${levelPill(level.name)}${user.verified ? verified("Донишҷӯи тасдиқшуда") : ""}<span>${esc(user.city)}</span></div></header>
    <div class="grid gap-4 px-5 py-5 text-sm">
      <div class="flex flex-wrap items-center justify-between gap-2">${stars(rating.avg, rating.count, false)}<span class="font-extrabold">${user.experience || 0} кор анҷом ёфт</span></div>
      <p><span class="font-extrabold">Донишгоҳ: </span>${esc(user.university || "Нишон дода нашудааст")}</p>
      <p><span class="font-extrabold">Маҳоратҳо: </span>${esc(user.skills?.length ? user.skills.join(" · ") : "Ҳанӯз нест")}</p>
      ${user.bio ? `<p class="leading-relaxed text-ink/75">${esc(user.bio)}</p>` : ""}
      <div><p class="font-extrabold">Ҷадвали озод</p><ul class="mt-1 text-ink/75">${lines.length ? lines.map((line) => `<li>${esc(line)}</li>`).join("") : "<li>Ҷадвал холӣ аст.</li>"}</ul></div>
      <div><p class="font-extrabold">Корҳои анҷомёфта</p><ul class="mt-2 grid gap-2">${work}</ul></div>
      <div class="no-print flex flex-wrap gap-2"><button type="button" class="btn btn-primary" data-action="download-cv">Зеркашии CV</button><button type="button" class="btn btn-line" data-action="print-cv">Чоп</button></div>
    </div>
  </article>`;
}

function profilePreview(student, state, report = true) {
  if (!student) return "";
  const rating = avgRating(state.data.ratings, student.id);
  const level = levelFor(student.experience);
  const portfolio = portfolioFor(student, state.data.applications, state.data.jobs);
  const hours = DAYS.map((day) => {
    const count = (student.availability?.[day.id] || []).length;
    const label = rangeLabel(student.availability?.[day.id]);
    return `<div class="week-col" title="${esc(day.label)} ${esc(label)}"><span class="week-bar" style="--h:${count ? Math.min(100, 18 + count * 14) : 8}%"></span><span>${esc(day.short)}</span></div>`;
  }).join("");
  const cv = portfolio[0]
    ? `${portfolio[0].title} · ${portfolio[0].pay}`
    : "Пас аз анҷоми кор резюме худкор пур мешавад.";
  return `<article class="profile-card">
    <div class="flex items-center gap-3">
      ${avatar(student.name, student.hue, "lg")}
      <div class="min-w-0">
        <p class="text-[11px] font-extrabold tracking-[0.16em] text-gold">ПРОФИЛИ ДОНИШҶӮ</p>
        <h2 class="truncate text-xl font-extrabold">${esc(student.name)}</h2>
        <p class="truncate text-sm text-cream/75">${esc(student.university || "Донишгоҳ")}</p>
      </div>
    </div>
    <div class="mt-4 flex flex-wrap items-center gap-2">${student.verified ? verified("Донишҷӯи тасдиқшуда") : ""}${levelPill(level.name)}<span class="rounded-full bg-gold px-2.5 py-1 text-[11px] font-extrabold text-ink">${esc(formatStars(rating.avg, rating.count))}</span></div>
    <p class="mt-3 text-sm text-cream/80">${esc(student.city || "")} · ${isFreeToday(student) ? "Имрӯз озод" : "Аз рӯи ҷадвал"} · ${esc(student.payPreference || "Соатбайъ ва маблағи собит")} · ${completedCount(student, state.data)} кори анҷомёфта · ${rating.count} баҳо${responseRate(student, state.data) == null ? "" : ` · ҷавоб ${responseRate(student, state.data)}%`}</p>
    <p class="mt-4 text-xs font-bold tracking-wide text-cream/60">ҶАДВАЛИ ОЗОД</p>
    <div class="week-strip" aria-label="Соатҳои озоди ҳафта">${hours}</div>
    <p class="mt-4 rounded-2xl bg-white/10 px-3 py-3 text-sm leading-snug"><span class="mr-2 rounded-full bg-gold px-2 py-0.5 text-[10px] font-extrabold text-ink">CV</span>${esc(cv)}</p>
    <div class="mt-3 flex flex-wrap gap-1.5">${(student.skills || []).map((skill) => `<span class="skill-pill">${esc(skill)}</span>`).join("")}</div>
    ${report && currentUser()?.id !== student.id ? `<button type="button" class="btn btn-primary mt-4" data-action="report" data-kind="user" data-id="${esc(student.id)}">Гузориши корбар</button>` : ""}
  </article>`;
}

function auroraBackground() {
  const stars = "23.72,55.07,1,1|77.89,38.35,2,0|63.68,38.85,3,0|75.41,15.79,1,0|54.44,74.06,2,1|91.30,16.72,3,0|27.98,30.50,1,0|23.02,41.10,2,0|36.46,59.09,3,1|91.35,88.27,1,0|10.59,48.75,2,0|19.60,18.33,3,0|17.93,63.83,1,1|0.44,42.27,2,0|27.41,48.54,3,0|16.18,28.62,1,0|18.78,58.00,2,1|73.88,5.19,3,0|41.70,84.82,1,0|17.58,95.65,2,0|10.36,52.53,3,1|92.17,44.35,1,0|24.03,27.63,1,1|7.50,71.52,2,0|8.51,71.77,3,0|21.37,78.77,1,0|35.93,35.51,2,1|64.18,39.24,3,0|66.84,39.93,1,0|73.28,77.29,2,0|30.38,12.54,3,1|5.01,36.15,1,0|80.67,72.85,2,0|4.72,36.23,3,0|3.19,21.44,1,1|17.66,28.27,2,0|75.08,93.80,3,0|15.46,46.21,1,0|57.08,41.27,2,1|61.75,45.55,3,0|75.90,13.74,1,0|69.21,40.06,2,0|27.96,99.48,3,1|16.44,4.03,1,0|27.81,32.39,2,0|51.18,20.25,3,0|19.50,61.85,1,1|14.92,6.81,2,0|98.14,2.68,3,0|36.81,79.71,1,0|31.90,97.55,2,1|70.31,84.41,3,0|64.64,38.17,1,0|38.63,89.58,2,0|95.90,61.50,3,1|22.82,60.71,1,0|10.88,68.35,2,0|23.58,52.29,3,0|47.86,61.17,1,1|62.78,55.27,2,0|77.53,71.31,3,0|17.89,43.35,1,0|6.89,8.07,2,1|9.19,58.05,3,0|43.12,38.54,1,0|41.81,90.47,2,0|40.01,15.04,3,1|48.57,37.40,1,0|32.52,51.58,2,0|41.21,63.20,3,0".split("|");
  const dots = stars.map((row, index) => {
    const [x, y, size, pale] = row.split(",");
    const extra = index >= 30 ? " star-more" : "";
    const twinkle = index < 10 ? " twinkle" : "";
    return `<span class="star${pale === "1" ? " pale" : ""}${extra}${twinkle}" style="left:${x}%;top:${y}%;width:${size}px;height:${size}px;animation-delay:-${(index % 10) * 0.45}s"></span>`;
  }).join("");
  return `<div class="aurora-bg" aria-hidden="true">
      <div class="aurora-sky">
        <div class="aurora-base"></div>
        <svg class="aurora-svg" viewBox="0 0 1440 600" preserveAspectRatio="none">
          <defs>
            <linearGradient id="aur-g1" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2ee59d"/><stop offset="1" stop-color="#1c8f7a"/></linearGradient>
            <linearGradient id="aur-g2" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7b5cff"/><stop offset="1" stop-color="#c14bd6"/></linearGradient>
            <linearGradient id="aur-g3" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#3b82f6"/><stop offset="1" stop-color="#22d3ee"/></linearGradient>
          </defs>
          <g class="ribbon ribbon-1">
            <path class="ribbon-fill" fill="url(#aur-g1)" d="M-80 250C120 90 280 380 560 210C820 50 980 190 1180 150C1000 250 800 120 540 300C280 470 80 200-80 340Z"/>
            <path class="ribbon-line" fill="none" stroke="url(#aur-g1)" stroke-width="1.5" vector-effect="non-scaling-stroke" d="M-80 290C160 140 320 360 600 230C860 110 1000 200 1220 170"/>
          </g>
          <g class="ribbon ribbon-2">
            <path class="ribbon-fill" fill="url(#aur-g2)" d="M620 40C860 180 1040 20 1520 150C1500 250 1080 90 860 260C700 340 640 160 620 40Z"/>
            <path class="ribbon-line" fill="none" stroke="url(#aur-g2)" stroke-width="1.5" vector-effect="non-scaling-stroke" d="M640 120C900 220 1100 60 1520 190"/>
          </g>
          <g class="ribbon ribbon-3">
            <path class="ribbon-fill" fill="url(#aur-g3)" d="M-60 400C220 300 420 480 700 360C980 240 1180 420 1520 300L1520 340C1160 470 960 280 680 400C400 520 200 340-60 450Z"/>
            <path class="ribbon-line" fill="none" stroke="url(#aur-g3)" stroke-width="1.5" vector-effect="non-scaling-stroke" d="M-60 420C240 320 440 470 720 370C1000 270 1200 410 1520 320"/>
          </g>
        </svg>
        <div class="aurora-stars">${dots}</div>
        <span class="orb orb-1"></span>
        <span class="orb orb-2"></span>
        <span class="orb orb-3"></span>
        <span class="orb orb-4"></span>
      </div>
      <div class="aurora-fade"></div>
    </div>`;
}

const LEAD_ICONS = {
  clip: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="4.5" width="10" height="15.5" rx="1.8" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M9.2 4.8h5.6v2.4H9.2z" fill="currentColor"/><path d="M9.5 11.2h5M9.5 14.2h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`,
  person: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="2.8" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M6.6 18.4c.9-2.5 2.8-3.7 5.4-3.7s4.5 1.2 5.4 3.7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  search: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="5.2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="m15.2 15.2 4.2 4.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  chat: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6.5h14v8.5H8.2L5 18.2V6.5Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>`,
  cap: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-4.5L21 10l-9 4.5L3 10Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M7.2 12.2v3c0 .6 2 2.2 4.8 2.2s4.8-1.6 4.8-2.2v-3" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`,
  share: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15.5V5.5M8.2 9 12 5.2 15.8 9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.5 13.2V18h11v-4.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

function leadSearch(state, id) {
  return `<form id="${id}" class="home-search lead-search">
      <input type="hidden" name="location" value="${esc(state.filters.location)}">
      <input type="hidden" name="category" value="${esc(state.filters.category || "Ҳама")}">
      <label class="sr-only" for="${id}-q">Ҷустуҷӯи кор</label>
      <span class="lead-glass" aria-hidden="true">${LEAD_ICONS.search}</span>
      <input id="${id}-q" name="q" value="${esc(state.filters.q)}" placeholder="Ҷустуҷӯи кор (мавқеъ, малака)..." autocomplete="off">
      <span class="ph-short" aria-hidden="true">Ҷустуҷӯи кор...</span>
      <button type="submit">Ҷустуҷӯ</button>
    </form>`;
}

function leadChips(state) {
  const pay = state?.filters?.pay || "";
  const chip = (on, attrs, label) => `<button type="button" class="chip${on ? " is-on" : ""}" aria-pressed="${on}" ${attrs}>${label}</button>`;
  return `<div class="chips" role="group" aria-label="Намуди кор">
      ${chip(pay === "hourly", `data-action="hero-chip" data-pay="hourly"`, "Соатбайъ")}
      ${chip(pay === "fixed", `data-action="hero-chip" data-pay="fixed"`, "Лоиҳаҳо")}
      ${chip(false, `data-action="hero-chip" data-view="students"`, "Салоҳиятҳо")}
    </div>`;
}

const CARD_CHECK = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="m8 12.2 2.6 2.6L16.2 9" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`;
const CARD_ARROW = `<svg class="card-go" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function profileFill(user) {
  if (!user) return null;
  if (user.role === "student") return completeness(user);
  const bits = [user.company, user.city, user.phone, user.bio && user.bio.length > 12, user.verified];
  return Math.round((bits.filter(Boolean).length / bits.length) * 100);
}

function leadDocks(state) {
  const user = currentUser();
  const dash = user?.role === "employer" ? "employerDash" : "studentDash";
  const profile = user ? `data-action="go" data-view="${dash}"` : `data-action="open" data-modal="login"`;
  const score = profileFill(user);
  const fill = score == null ? "Барои кушодани профил ворид шавед" : score >= 100 ? "Профил пур аст · 100%" : `Профилро пур кунед · ${score}%`;
  return `<div class="cards">
      <article class="card card-blue">
        <div>
          <span class="card-ico">${LEAD_ICONS.clip}</span>
          <h2>Кор супоред</h2>
          <p>Эълон диҳед ва донишҷӯ ёбед</p>
          <ul class="card-checks card-mid"><li>${CARD_CHECK}<span>Эълон дар 2 дақиқа</span></li><li>${CARD_CHECK}<span>Донишҷӯи тасдиқшуда</span></li></ul>
        </div>
        <button type="button" class="card-btn" data-action="flow" data-flow="post">Оғоз кунед ${CARD_ARROW}</button>
      </article>
      <article class="card card-green">
        <div>
          <span class="card-ico">${LEAD_ICONS.search}</span>
          <h2>Кор пайдо кунед</h2>
          <p>Корҳои наздик ба шумо</p>
          <div class="card-mini card-mid"><p>Курьер · 150 сомонӣ</p><p>Репетитор · 200 сомонӣ</p></div>
        </div>
        <button type="button" class="card-btn" data-action="flow" data-flow="find">Дидани корҳо ${CARD_ARROW}</button>
      </article>
      <article class="card card-violet">
        <div>
          <span class="card-ico">${LEAD_ICONS.person}</span>
          <h2>Профили шахсӣ</h2>
          <p>Маълумот ва баҳоҳои шумо</p>
          <div class="card-mid"><p class="card-fill">${fill}</p><div class="card-meter" aria-hidden="true"><i style="width:${score || 0}%"></i></div></div>
        </div>
        <button type="button" class="card-btn" ${profile}>Кушодани профил ${CARD_ARROW}</button>
      </article>
    </div>`;
}

function leadBlocks() {
  return `<div class="lead-blocks">
      <button type="button" class="lead-block block-blue" data-action="flow" data-flow="post"><span class="block-ico">${LEAD_ICONS.clip}</span><strong>Кор супоред</strong><span>Эълон диҳед ва донишҷӯ ёбед</span></button>
      <button type="button" class="lead-block block-green" data-action="flow" data-flow="find"><span class="block-ico">${LEAD_ICONS.search}</span><strong>Кор пайдо кунед</strong><span>Мавқеъ ва малакаи мувофиқ</span></button>
    </div>`;
}

function phoneBar(state) {
  const count = unreadCount(state);
  return `<header class="phone-bar">
      <button type="button" class="phone-brand" data-action="go" data-view="home"><span class="phone-cap">${LEAD_ICONS.cap}</span><span>StudentWork<span>.tj</span></span></button>
      <div class="phone-tools">
        <button type="button" class="phone-bell" data-action="go" data-view="notices" aria-label="Огоҳӣ">${BELL_ICON}${count ? `<i class="phone-dot"></i>` : ""}</button>
        <button type="button" class="phone-share" data-action="share" aria-label="Мубодила">${LEAD_ICONS.share}</button>
      </div>
    </header>`;
}

function homeFeed(state) {
  const jobs = (state.data.jobs || []).filter((job) => job.status !== "done").slice(0, 6);
  const newestId = jobs.reduce((best, job) => (!best || (job.createdAt || 0) > (best.createdAt || 0) ? job : best), null)?.id;
  const cards = jobs.map((job) => jobCard(job, state, { fresh: job.id === newestId })).join("");
  const skel = jobs.map(() => `<div class="skel-card" aria-hidden="true"></div>`).join("");
  const board = jobs.length
    ? `<div class="fresh-skel" aria-hidden="true">${skel}</div><div class="fresh-grid grid" hidden>${cards}</div>`
    : `<div class="jobs-empty home-empty" role="status"><p>Ҳоло эълони кушода нест.</p><button type="button" class="jobs-more" data-action="go" data-view="jobs">Ба рӯйхати корҳо</button></div>`;
  const stepTones = [
    ["#a78bfa", "#f472b6", "rgba(167,139,250,.45)"],
    ["#2dd4bf", "#38bdf8", "rgba(45,212,191,.45)"],
    ["#fb923c", "#f43f5e", "rgba(251,146,60,.45)"],
  ];
  const steps = howSteps.map((step, index) => {
    const [c1, c2, glow] = stepTones[index] || stepTones[0];
    return `<li class="step" style="--c1:${c1};--c2:${c2};--glow:${glow}"><span class="num">${index + 1}</span><strong>${esc(step.title)}</strong><p>${esc(step.text)}</p></li>`;
  }).join("");
  const guards = guarantees.map((item) => `<li class="guard-row"><span class="guard-tick" aria-hidden="true">✓</span><span>${esc(item)}</span></li>`).join("");
  return `<section class="home-block reveal home-fresh">
      <div class="home-head"><h2>Корҳои нав</h2><button type="button" data-action="go" data-view="jobs">Ҳамаи корҳо ${CARD_ARROW}</button></div>
      ${board}
    </section>
    <section class="home-block reveal home-tail">
      <h2>Чӣ тавр кор мекунад</h2>
      <ol class="how-steps">${steps}</ol>
    </section>
    <section class="home-block reveal trust-grid home-tail">
      <article class="guard"><h2>Кафолат</h2><ul>${guards}</ul></article>
      <article class="start"><h2>Имрӯз оғоз кунед</h2><p>Кор ёбед ё кори худро ба донишҷӯ супоред.</p><div class="start-actions"><button type="button" class="btn start-go" data-action="flow" data-flow="find"><span>Кор ёбед</span></button><button type="button" class="start-line" data-action="flow" data-flow="post">Кор супоред</button></div></article>
    </section>`;
}

function homeFooter() {
  const tg = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.5 4.4 2.8 11.6c-1.3.5-1.2 1.2-.2 1.5l4.8 1.5 1.8 5.6c.2.7.1.9.8.9.5 0 .7-.2 1-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.2-.4-1.7-1.4-1.3ZM8.3 14.2l9.7-6.1c.5-.3.9-.1.5.2l-8.3 7.5-.3 3.4-1.6-5Z"/></svg>`;
  const ig = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="5" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="3.4" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="17.2" cy="6.8" r="1" fill="currentColor"/></svg>`;
  return `<footer class="home-foot">
      <div class="foot-main">
        <nav aria-label="Поён">${[["safety", "Дастурҳо"], ["safety", "Бехатарӣ"], ["inbox", "Тамос"]].map(([view, label]) => `<button type="button" data-action="go" data-view="${view}">${label}</button>`).join("")}</nav>
        <p class="foot-copy">© 2026 StudentWork.tj</p>
      </div>
      <div class="foot-social">
        <a class="social-link is-tg" href="https://t.me/" target="_blank" rel="noopener noreferrer" aria-label="Telegram">${tg}</a>
        <a class="social-link is-ig" href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">${ig}</a>
      </div>
    </footer>`;
}

function home(state) {
  const students = state.data.users.filter((user) => user.role === "student");
  const leaders = students
    .map((student) => ({ student, rating: avgRating(state.data.ratings, student.id) }))
    .sort((a, b) => b.rating.avg - a.rating.avg || b.student.experience - a.student.experience)
    .slice(0, 3);
  return `<div class="page page-home"><section class="hero home-stage">
      ${auroraBackground()}
      <div class="lead-stack">
        <h1 class="hero-title">Фурсати кори барои донишҷӯён</h1>
        <p class="lead-sub">Дар рӯзҳои холӣ кор ёбед ё корро ба донишҷӯ супоред.</p>
        ${leadSearch(state, "home-search")}
        ${leadChips(state)}
        ${leadDocks(state)}
      </div>
    </section>
    ${homeFeed(state)}
    <section class="home-block home-rank">
      <div class="rank-head"><div><p class="rank-kicker">Рейтинг</p><h2>Беҳтарин донишҷӯёни ҳафта</h2></div><button type="button" data-action="go" data-view="rankings">Ҳама рейтингҳо →</button></div>
      <ol class="rank-list">${leaders.map(({ student, rating }, index) => {
        const level = levelFor(student.experience).name;
        const place = index + 1;
        return `<li class="rank-row is-${place}"><span class="medal">${place}</span>${avatar(student.name, student.hue).replace('class="', 'class="rank-ava ')}<div class="rank-who"><p class="rank-name"><span class="rank-label">${esc(student.name)}</span>${level === "ПРО-Донишҷӯ" ? `<span class="pro-pill">${esc(level)}</span>` : ""}</p><p class="rank-uni">${esc(student.university)}${level === "ПРО-Донишҷӯ" ? "" : ` · ${esc(level)}`}</p></div><div class="rank-score"><span class="star-chip">${esc(formatStars(rating.avg, rating.count))}</span><span>${student.experience || 0} кор</span></div></li>`;
      }).join("")}</ol>
    </section>
    <section class="home-block home-employer"><div class="employer-cta flex flex-col items-start justify-between gap-4 rounded-[2rem] px-6 py-8 md:flex-row md:items-center"><div><p class="text-xs font-extrabold tracking-wider text-gold">БАРОИ КОРФАРМО</p><h2 class="mt-2 text-2xl font-extrabold">Навбати имрӯзаро дар чанд дақиқа пур кунед</h2><p class="mt-2 max-w-xl text-sm text-cream/70">Комиссия 5–10%. Эълони VIP дар болои рӯйхат меистад.</p></div><div class="start-actions"><button type="button" class="btn start-go" data-action="publish"><span>Эълон гузоштан</span></button><button type="button" class="start-line" data-action="open" data-modal="signup">Бақайдгирӣ</button></div></div></section>
    ${homeFooter()}</div>`;
}

const CHIP_ICON = {
  "Ҳама": `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.7"/><rect x="14" y="3" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.7"/><rect x="3" y="14" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.7"/><rect x="14" y="14" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>`,
  "Промоутер": `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h3l5 4V6L7 10H4Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M16 9.5a3.5 3.5 0 0 1 0 5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  "Пешхизмат": `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 10h14v2a7 7 0 0 1-14 0v-2Z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M8 10V7a4 4 0 0 1 8 0" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  "СММ & Дизайн": `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16.5 14.5 6a2.1 2.1 0 0 1 3 3L7 19.5 4 20l.5-3.5Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>`,
  "Тарҷума": `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h8M8 6c0 6-3 9-6 10M8 6c.6 2.2 1.8 4 3.4 5.4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M13 20l4-9 4 9M14.4 17h5.2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  "Кумакчӣ дар офис": `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="18" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M9 7V5h6v2" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>`,
  "Доставка": `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="7" cy="17" r="2" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="17" cy="17" r="2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M3 17h2M9 17h6M5 17V9h9l3 4h2v4h-2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>`,
};
const SEARCH_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m16 16 4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
const CLOCK_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 8v4.5l3 2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`;
const CAL_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M8 3.5v3M16 3.5v3M4 10h16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`;
const CHECK_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="currentColor" opacity=".2"/><path d="m8 12.2 2.6 2.6L16.2 9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
const ARROW_ICON = `<svg class="reply-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const EMPTY_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="m16 16 4 4M8 11h6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`;

function jobTone(category) {
  if (category === "Пешхизмат" || category === "Кумакчӣ дар офис") return "green";
  if (category === "СММ & Дизайн" || category === "Доставка") return "violet";
  return "blue";
}

function shiftHours(job) {
  const [sh, sm] = String(job.timeStart || "").split(":").map(Number);
  const [eh, em] = String(job.timeEnd || "").split(":").map(Number);
  if (!Number.isFinite(sh) || !Number.isFinite(eh)) return "";
  const minutes = eh * 60 + (em || 0) - (sh * 60 + (sm || 0));
  if (minutes <= 0) return "";
  return `${Math.round(minutes / 60)} соат`;
}

function shortDate(iso) {
  const full = formatDate(iso);
  const [day, month] = String(full).split(".");
  return day && month ? `${day}.${month}` : full;
}

function boardCard(job, state) {
  const client = state.data.users.find((user) => user.id === job.employerId);
  const user = currentUser();
  const saved = Boolean(user && (state.data.savedJobs || []).some((item) => item.userId === user.id && item.jobId === job.id));
  const name = employerName(client);
  const letter = [...name][0] || "К";
  const rating = avgRating(state.data.ratings, job.employerId);
  const [c1, c2, glow] = cardPalette(job.category);
  const hours = shiftHours(job);
  const unit = job.payType === "hourly" ? " / соат" : " / кор";
  const icon = CHIP_ICON[job.category] || CHIP_ICON["Ҳама"];
  const flags = `${job.rush ? `<span class="badge">Таъҷилӣ</span>` : ""}${job.vip ? `<span class="vipb">VIP</span>` : ""}`;
  return `<article class="card${job.vip ? " vip" : ""}" style="--c1:${c1};--c2:${c2};--glow:${glow}">
    <div class="bar"></div>
    <div class="top"><div class="top-id"><div class="tile">${icon}</div><span class="cat">${esc(job.category)}</span></div>${flags ? `<div class="flags">${flags}</div>` : ""}</div>
    <h3 class="title">${esc(job.title)}</h3>
    <div class="price">${esc(formatMoney(job.payAmount))} сомонӣ<small>${unit}</small></div>
    <div class="employer"><div class="avatar">${esc(letter)}</div><span>${esc(name)}</span>${client?.verified ? `<span class="ok">✓ Тасдиқшуда</span>` : ""}</div>
    <div class="metas">${job.location ? `<span class="meta">${esc(job.location)}</span>` : ""}${hours ? `<span class="meta">${esc(hours)}</span>` : ""}${job.date ? `<span class="meta">${esc(shortJobDate(job.date))}</span>` : ""}</div>
    <p class="desc">${esc(job.description || "")}</p>
    <div class="rating">${rating.count ? `★ ${rating.avg.toFixed(1)} <span>· ${rating.count} баҳо</span>` : `★ <span>Ҳоло баҳо нест</span>`}</div>
    <div class="bottom">
      <button type="button" class="heart${saved ? " is-on" : ""}" data-action="save" data-id="${esc(job.id)}" aria-label="Нигоҳ доштан" aria-pressed="${saved}">${HEART_ICON}</button>
      <button type="button" class="btn" data-action="open-job" data-id="${esc(job.id)}"><span>Ҷавоб додан →</span></button>
    </div>
  </article>`;
}

function jobs(state) {
  const list = sortJobs(filterJobs(state.data.jobs, state.data.users, state.filters), state.sort);
  const limit = state.jobsShown || 9;
  const shown = list.slice(0, limit);
  const f = state.filters;
  const chips = CATEGORIES.map((category) => `<button type="button" class="jobs-chip ${category === f.category ? "is-on" : ""}" data-action="category" data-category="${esc(category)}">${CHIP_ICON[category] || ""}${esc(category)}</button>`).join("");
  const cards = shown.length
    ? `<div class="jobs-grid">${shown.map((job, index) => boardCard(job, state, index)).join("")}</div>`
    : `<div class="jobs-empty" role="status">${EMPTY_ICON}<p>Кор ёфт нашуд</p><p>${f.q ? `Барои «${esc(f.q)}» эълон нест.` : "Бо ин филтр эълон нест."}</p><button type="button" class="jobs-more" data-action="clear-filters">Тоза кардани филтр</button></div>`;
  const more = shown.length && shown.length < list.length ? `<button type="button" class="jobs-more" data-action="jobs-more">Бештар нишон диҳед</button>` : "";
  return `<div class="page page-jobs">
    <div class="jobs-sky" aria-hidden="true">${auroraBackground()}</div>
    <div class="jobs-wrap">
      <p class="jobs-kicker">ҶОИ КОР</p>
      <h1 class="jobs-title">Корҳои соатбайъ ва микрокорҳо</h1>
      <p class="jobs-lead">Эълонҳои VIP дар боло меистанд. Маблағ то анҷоми кор дар ҳисоби махсус мемонад.</p>
      <form id="search-form" class="jobs-search">
        <input type="hidden" name="location" value="${esc(f.location)}">
        <input type="hidden" name="category" value="${esc(f.category)}">
        <label class="jobs-q">${SEARCH_ICON}<span class="sr-only">Калима</span><input id="search-q" name="q" value="${esc(f.q)}" placeholder="Пешхизмат, тарҷума, SMM..." aria-label="Калимаи ҷустуҷӯ"></label>
        <button type="button" class="jobs-city" data-action="cities">${PIN_ICON}<span>${esc(cityButtonLabel(f.location))}</span></button>
        <button class="jobs-go" type="submit">Ҷустуҷӯ</button>
      </form>
      <div class="jobs-chips">${chips}</div>
      <div class="jobs-count">
        <p>${list.length} кор ёфт шуд</p>
        <div class="jobs-sort">${picker(state, { id: "sort", plain: true, value: state.sort, options: SORTS, compact: true })}</div>
      </div>
      ${cards}
      ${more}
    </div>
  </div>`;
}

function discoveryCard(job, state) {
  const client = state.data.users.find((user) => user.id === job.employerId);
  const rating = avgRating(state.data.ratings, job.employerId);
  const skills = jobSkills(job);
  const open = isOpenStatus(job.status);
  return `<article class="job-card">
    <div class="job-tags"><span class="job-tag">${esc(job.category)}</span><span class="job-status">${esc(STATUS[job.status] || job.status)}</span></div>
    <h3 class="job-title">${esc(job.title)}</h3>
    <p class="job-copy">${esc(job.description)}</p>
    <p class="job-meta"><span>${esc(payLabel(job))}</span><span>${jobOnline(job) ? "Онлайн" : esc(job.location)}</span><span>То ${esc(formatDate(jobDeadline(job)))}</span></p>
    ${skills.length ? `<p class="job-meta">${skills.map((skill) => esc(skill)).join(" · ")}</p>` : ""}
    <div class="job-employer"><p>${esc(employerName(client))}</p>${stars(rating.avg, rating.count)}</div>
    <div class="job-actions">
      <button type="button" class="btn btn-line" data-action="open-job" data-id="${esc(job.id)}">Дидани кор</button>
      <button type="button" class="btn btn-primary" data-action="propose" data-id="${esc(job.id)}" ${open ? "" : "disabled"}>${open ? "Пешниҳод фиристодан" : "Ҷой дастрас нест"}</button>
    </div>
  </article>`;
}

function findPage(state) {
  const filters = state.discover || {};
  const list = filterDiscovery(state.data.jobs, state.data.users, filters);
  const chip = (action, key, value, label, current) => `<button type="button" class="chip" data-on="${current === value}" data-action="${action}" data-key="${key}" data-value="${esc(value)}">${esc(label)}</button>`;
  return `<div class="page">
    <p class="kicker">Кор пайдо кун</p>
    <h1 class="mt-2 text-3xl font-extrabold">Корҳои кушода</h1>
    <p class="mt-2 max-w-2xl text-sm text-ink/65">Категория, шаҳр, онлайн, буҷет, мӯҳлат ва маҳоратро интихоб кунед. Пешниҳод бо нарх, мӯҳлат ва паём сабт мешавад.</p>
    <div class="mt-4 grid gap-3">
      <div class="cat-scroll">${["Ҳама", ...workCategories()].map((item) => chip("discover", "category", item, item === "Ҳама" ? "Ҳама категорияҳо" : item, filters.category || "Ҳама")).join("")}</div>
      <div class="cat-scroll">${[{ value: "Ҳамаи шаҳрҳо", label: "Ҳамаи шаҳрҳо" }, ...LOCATIONS.map((city) => ({ value: city, label: city }))].map((item) => chip("discover", "city", item.value, item.label, filters.city || "Ҳамаи шаҳрҳо")).join("")}</div>
      <div class="cat-scroll">${[["all", "Ҳама ҷойҳо"], ["online", "Онлайн"], ["place", "Дар ҷой"]].map(([value, label]) => chip("discover", "online", value, label, filters.online || "all")).join("")}</div>
      <div class="cat-scroll">${["Ҳама", ...skillChoices()].map((item) => chip("discover", "skill", item, item === "Ҳама" ? "Ҳама маҳоратҳо" : item, filters.skill || "Ҳама")).join("")}</div>
    </div>
    <form id="discover-form" class="mt-4 grid gap-3 sm:grid-cols-3">
      <label class="grid gap-1 text-sm font-bold">Буҷети камтарин<input class="field" type="number" min="0" name="min" value="${esc(filters.min || "")}" placeholder="0"></label>
      <label class="grid gap-1 text-sm font-bold">Буҷети баландтарин<input class="field" type="number" min="0" name="max" value="${esc(filters.max || "")}" placeholder="500"></label>
      <label class="grid gap-1 text-sm font-bold">Мӯҳлат то<input class="field" type="date" name="deadline" value="${esc(filters.deadline || "")}"></label>
      <button class="btn btn-primary" type="submit">Филтрро татбиқ кун</button>
    </form>
    <p class="mt-4 text-sm font-bold text-slate-500">${list.length} кор</p>
    ${list.length ? `<div class="job-board">${list.map((job) => discoveryCard(job, state)).join("")}</div>` : `<div class="empty-state" role="status"><p class="empty-title">Бо ин филтр кор нест.</p><p>Филтрро васеътар кунед.</p></div>`}
  </div>`;
}

function postPage(state) {
  const user = currentUser();
  if (!user) return `<div class="page"><h1 class="text-2xl font-extrabold">Кор супор</h1><p class="mt-2 text-sm">Аввал ворид шавед.</p><button type="button" class="btn btn-primary mt-4" data-action="flow" data-flow="post">Воридшавӣ</button></div>`;
  const draft = state.postDraft || { title: "", description: "", category: "СММ & Дизайн", skills: [], budget: "", payType: "fixed", deadline: "", online: true, city: user.city || "Душанбе" };
  const step = state.postStep || 1;
  const skills = draft.skills || [];
  const error = state.postError ? `<p class="text-sm font-semibold text-clay" role="alert">${esc(state.postError)}</p>` : "";
  const step1 = `<form id="post-form" class="grid gap-3"><input type="hidden" name="step" value="1">
    <label class="grid gap-1 text-sm font-bold">Номи кор<input class="field" name="title" value="${esc(draft.title)}" placeholder="Логотип барои мағозаи либос"></label>
    <label class="grid gap-1 text-sm font-bold">Тавсиф<textarea class="field min-h-28" name="description" placeholder="Чӣ бояд омода шавад?">${esc(draft.description)}</textarea></label>
    <div class="grid gap-2 text-sm font-bold">Категория<div class="flex flex-wrap gap-2">${workCategories().map((item) => `<button type="button" class="chip" data-on="${draft.category === item}" data-action="post-category" data-value="${esc(item)}">${esc(item)}</button>`).join("")}</div></div>
    <div class="grid gap-2 text-sm font-bold">Маҳоратҳои лозимӣ<div class="flex flex-wrap gap-2">${skillChoices().map((item) => `<button type="button" class="chip" data-on="${skills.includes(item)}" data-action="post-skill" data-skill="${esc(item)}">${esc(item)}</button>`).join("")}</div></div>
    ${error}<button class="btn btn-primary" type="submit">Идома</button></form>`;
  const step2 = `<form id="post-form" class="grid gap-3"><input type="hidden" name="step" value="2">
    <label class="grid gap-1 text-sm font-bold">Буҷет (сомонӣ)<input class="field" type="number" min="1" name="budget" value="${esc(draft.budget)}"></label>
    <div class="flex flex-wrap gap-2">${[["fixed", "Маблағи собит"], ["hourly", "Соатбайъ"]].map(([value, label]) => `<button type="button" class="chip" data-on="${draft.payType === value}" data-action="post-pay" data-value="${value}">${label}</button>`).join("")}</div>
    <label class="grid gap-1 text-sm font-bold">Мӯҳлат<input class="field" type="date" name="deadline" value="${esc(draft.deadline)}"></label>
    <div class="flex flex-wrap gap-2"><button type="button" class="chip" data-on="${draft.online}" data-action="post-place" data-value="online">Онлайн</button><button type="button" class="chip" data-on="${!draft.online}" data-action="post-place" data-value="place">Дар ҷой</button></div>
    ${draft.online ? "" : `<div class="flex flex-wrap gap-2">${LOCATIONS.map((city) => `<button type="button" class="chip" data-on="${draft.city === city}" data-action="post-city" data-value="${esc(city)}">${esc(city)}</button>`).join("")}</div>`}
    ${error}<div class="flex flex-wrap gap-2"><button type="button" class="btn btn-line" data-action="post-back">Бозгашт</button><button class="btn btn-primary" type="submit">Пешнамоиш</button></div></form>`;
  const step3 = `<div class="grid gap-3 rounded-[1.4rem] border border-line bg-paper p-4">
    <h2 class="text-xl font-extrabold">${esc(draft.title)}</h2>
    <p class="text-sm leading-relaxed">${esc(draft.description)}</p>
    <p class="text-sm font-bold">${esc(draft.category)} · ${(skills || []).map((item) => esc(item)).join(" · ")}</p>
    <p class="text-sm">${esc(draft.budget)} сомонӣ · ${draft.payType === "hourly" ? "соатбайъ" : "маблағи собит"} · то ${esc(formatDate(draft.deadline))}</p>
    <p class="text-sm">${draft.online ? "Онлайн" : esc(draft.city)}</p>
    ${error}
    <div class="flex flex-wrap gap-2"><button type="button" class="btn btn-line" data-action="post-back">Бозгашт</button><button type="button" class="btn btn-gold" data-action="post-publish">Корро нашр кун</button></div>
  </div>`;
  return `<div class="page"><p class="kicker">Кор супор · қадами ${step} аз 3</p><h1 class="mt-2 text-3xl font-extrabold">${step === 1 ? "Чӣ кор лозим аст?" : step === 2 ? "Буҷет ва мӯҳлат" : "Пешнамоиш"}</h1><div class="mt-5 max-w-2xl">${step === 1 ? step1 : step === 2 ? step2 : step3}</div></div>`;
}

function solvePage(state) {
  const user = currentUser();
  if (!user) return `<div class="page"><h1 class="text-2xl font-extrabold">Коратро ҳал кун</h1><button type="button" class="btn btn-primary mt-4" data-action="flow" data-flow="solve">Воридшавӣ</button></div>`;
  const draft = state.solveDraft;
  const ask = `<form id="solve-form" class="solve-ask"><label class="grid gap-1 text-sm font-bold">Коратонро бо суханҳои оддӣ нависед<textarea class="field min-h-28" name="text" placeholder="Масалан: Ба ман барои Instagram 5 пост лозим аст...">${esc(draft?.text || "")}</textarea></label><label class="file-add">Файл ё сурат илова кардан<input type="file" name="file" accept="image/*,.pdf,.doc,.docx"></label>${state.solveError ? `<p class="text-sm font-semibold text-clay" role="alert">${esc(state.solveError)}</p>` : ""}<button class="btn btn-primary" type="submit">Фаҳмидан</button></form>`;
  if (!draft) return `<div class="page solve-page"><p class="kicker">Коратро ҳал кун</p><h1 class="mt-2 text-3xl font-extrabold">Чӣ кор дорӣ?</h1><p class="mt-2 max-w-2xl text-sm text-ink/65">Категорияро худатон ҷустуҷӯ накунед. Аз рӯи калимаҳо хизмат, маҳорат, мӯҳлат ва буҷет муайян мешавад.</p><div class="mt-5">${ask}</div></div>`;
  const people = matchStudents(state.data.users, state.data.ratings, draft);
  const cards = people.length
    ? `<div class="match-list">${people.map(({ student, rating, overlap, fit }) => {
      const chosen = draft.chosenId === student.id;
      const skills = (overlap.length ? overlap : (student.skills || []).slice(0, 2)).join(" · ");
      return `<article class="match-card${chosen ? " is-chosen" : ""}"><div class="match-main">${avatar(student.name, student.hue, "sm")}<div class="min-w-0"><h3>${esc(student.name)}</h3><p>${esc(skills)} · ${esc(formatStars(rating.avg, rating.count))}</p></div><strong>${fit}% мувофиқ</strong></div><button type="button" class="btn ${chosen ? "btn-line" : "btn-primary"}" data-action="choose-student" data-id="${esc(student.id)}">${chosen ? "Интихоб шуд" : "Интихоб кардан"}</button></article>`;
    }).join("")}</div>`
    : `<p class="text-sm">Мутахассиси мувофиқ ёфт нашуд. Маҳоратро ислоҳ кунед.</p>`;
  return `<div class="page solve-page">
    <p class="kicker">Коратро ҳал кун</p>
    <h1 class="mt-2 text-3xl font-extrabold">Фаҳмидам 👌</h1>
    <div class="detect-grid">
      <p>${draft.matched ? "Аз рӯи калимаҳои дархост муайян шуд. Пеш аз интихоб ислоҳ карда метавонед." : "Калимаи дақиқ ёфт нашуд. Варианти умумиро нишон додем — онро ислоҳ кунед."}</p>
      ${draft.fileName ? `<p class="text-sm font-bold">Файл: ${esc(draft.fileName)}</p>` : ""}
      <div class="detect-facts">
        <p><span>Категория</span><strong>${esc(draft.category)}</strong></p>
        <p><span>Маҳоратҳо</span><strong>${esc((draft.skills || []).join(" · "))}</strong></p>
        <p><span>Мӯҳлати эҳтимолӣ</span><strong>${esc(formatDate(draft.deadline))}</strong></p>
        <p><span>Буҷети эҳтимолӣ</span><strong>${esc(draft.budget)} сомонӣ</strong></p>
      </div>
      <label class="grid gap-1 text-sm font-bold">Ном<input class="field" id="solve-title" value="${esc(draft.title)}"></label>
      <div class="flex flex-wrap gap-2">${workCategories().map((item) => `<button type="button" class="chip" data-on="${draft.category === item}" data-action="solve-category" data-value="${esc(item)}">${esc(item)}</button>`).join("")}</div>
      <div class="flex flex-wrap gap-2">${skillChoices().map((item) => `<button type="button" class="chip" data-on="${(draft.skills || []).includes(item)}" data-action="solve-skill" data-skill="${esc(item)}">${esc(item)}</button>`).join("")}</div>
      <div class="grid gap-3 sm:grid-cols-2">
        <label class="grid gap-1 text-sm font-bold">Буҷет<input class="field" id="solve-budget" type="number" min="1" value="${esc(draft.budget)}"></label>
        <label class="grid gap-1 text-sm font-bold">Мӯҳлат<input class="field" id="solve-deadline" type="date" value="${esc(draft.deadline)}"></label>
      </div>
      <div class="flex flex-wrap gap-2"><button type="button" class="chip" data-on="${draft.online}" data-action="solve-place" data-value="online">Онлайн</button><button type="button" class="chip" data-on="${!draft.online}" data-action="solve-place" data-value="place">Дар ҷой</button></div>
      ${draft.online ? "" : `<div class="flex flex-wrap gap-2">${LOCATIONS.map((city) => `<button type="button" class="chip" data-on="${draft.city === city}" data-action="solve-city" data-value="${esc(city)}">${esc(city)}</button>`).join("")}</div>`}
      <button type="button" class="btn btn-gold" data-action="solve-publish">Корро нашр кун</button>
    </div>
    <section class="mt-8"><h2 class="text-2xl font-extrabold">Иҷрокунандагони мувофиқ</h2><div class="mt-4">${cards}</div></section>
    <div class="mt-6">${ask}</div>
  </div>`;
}

function employers(state) {
  const user = currentUser();
  return `<div class="page page-employers">
    <header class="employer-lead">
      <div>
        <p class="kicker">Барои корфармо</p>
        <h1>Донишҷӯи озодро барои як смена ё як вазифа ёбед</h1>
        <p class="employer-lead-copy">Эълонро нашр кунед, аз рӯи шаҳр донишҷӯ бинед ва маблағро то анҷоми кор дар ҳисоби махсус нигоҳ доред.</p>
      </div>
      <button type="button" class="btn btn-gold" data-action="publish">Эълон гузоштан</button>
    </header>
    <div class="feature-grid">
      <article class="feature-card">${feeBadge()}<h2>Комиссияи равшан</h2><p>5% барои VIP, 8% барои кори муқаррарӣ ва 10% барои пардохти фаврӣ. Маблағи эълон ба донишҷӯ мерасад.</p></article>
      <article class="feature-card feature-card-soft"><p class="feature-kicker">VIP · Пешбар</p><h2>Дар болои рӯйхат</h2><p>Бо ${VIP_PIN_FEE} сомонӣ эълон пин мешавад ва бо нишони VIP мебарояд. Комиссия то 5% мефарояд.</p></article>
      <article class="feature-card feature-card-dark"><p class="feature-kicker">Эскроу</p><h2>Пардохти бехатар</h2><p>Пул дар ҳисоби махсус нигоҳ дошта мешавад то иҷрои кор.</p></article>
    </div>
    <div class="escrow-bar">${escrow()}</div>
    <div class="mt-8 flex flex-wrap gap-2">${user?.role === "employer" ? `<button type="button" class="btn btn-primary" data-action="go" data-view="employerDash">Кабинети корфармо</button>` : `<button type="button" class="btn btn-primary" data-action="open" data-modal="signup">Бақайдгирӣ ҳамчун корфармо</button>`}<button type="button" class="btn btn-line" data-action="go" data-view="jobs">Дидани рӯйхат</button></div>
  </div>`;
}

function studentsPage(state) {
  const sample = state.data.users.find((user) => user.id === "s1");
  const user = currentUser();
  return `<div class="page">
    <p class="kicker">Донишҷӯён</p>
    <h1 class="mt-2 max-w-3xl text-3xl font-extrabold">Профили донишҷӯ, ки корфармо дар як нигоҳ мехонад</h1>
    <p class="mt-3 max-w-2xl text-sm leading-relaxed text-ink/70">Ҷадвали озод, нишони тасдиқ, маҳоратҳо ва резюме аз рӯи корҳои анҷомёфта. Сатҳ аз «Новичок» то «ПРО-Донишҷӯ» меравад.</p>
    <article class="mt-5 rounded-[1.6rem] border border-line bg-paper p-5"><h2 class="text-lg font-extrabold">Маҳоратҳо ва портфел</h2><div class="mt-3 flex flex-wrap gap-2">${SKILLS.map((skill) => `<span class="chip" data-on="true">${esc(skill)}</span>`).join("")}</div><p class="mt-3 text-sm text-ink/65">Корҳои иҷрошуда мустақиман ба резюме илова мешаванд: ном, маблағ, шаҳр ва сана.</p></article>
    <section class="mt-5 rounded-[1.8rem] border border-line bg-paper p-5"><h2 class="text-lg font-extrabold">Намунаи ҷадвал</h2><p class="mt-1 text-sm text-ink/60">Соатҳои озод, аз ҷумла Душанбе баъд аз дарс.</p>${sample ? schedule(sample.availability, true) : ""}</section>
    <div class="mt-8 flex flex-wrap gap-2">${user?.role === "student" ? `<button type="button" class="btn btn-primary" data-action="go" data-view="studentDash">Кабинети ман</button>` : `<button type="button" class="btn btn-primary" data-action="open" data-modal="signup">Бақайдгирӣ ҳамчун донишҷӯ</button>`}<button type="button" class="btn btn-line" data-action="go" data-view="jobs">Ҷустуҷӯи кор</button></div>
  </div>`;
}

function rankings(state) {
  const toEmployer = directionAverage(state.data.ratings, "student-to-employer");
  const toStudent = directionAverage(state.data.ratings, "employer-to-student");
  const rows = state.data.users
    .filter((user) => user.role === "student" && (state.rankCity === "Ҳама" || user.city === state.rankCity) && !(state.settings?.privacyHideRank && user.id === state.data.sessionUserId))
    .map((student) => ({ student, rating: avgRating(state.data.ratings, student.id) }))
    .sort((a, b) => b.rating.avg - a.rating.avg || b.rating.count - a.rating.count || b.student.experience - a.student.experience);
  return `<div class="page page-rankings">
    <p class="text-xs font-extrabold tracking-wider text-pine">РЕЙТИНГҲО</p>
    <h1 class="mt-2 text-3xl font-extrabold">Донишҷӯёни беҳтарин</h1>
    <p class="mt-2 max-w-2xl text-sm text-ink/65">Ситораҳо аз баҳоҳои корфармоён меоянд. Донишҷӯ низ ба корфармо баҳо медиҳад.</p>
    <div class="rank-stats">
      <article class="rank-stat"><p>Донишҷӯ ба корфармо</p><strong>${toEmployer.count ? `${toEmployer.avg.toFixed(1)} ★` : "—"}</strong><span>${toEmployer.count} баҳо</span></article>
      <article class="rank-stat"><p>Корфармо ба донишҷӯ</p><strong>${toStudent.count ? `${toStudent.avg.toFixed(1)} ★` : "—"}</strong><span>${toStudent.count} баҳо</span></article>
    </div>
    <div class="cat-scroll mt-5">${["Ҳама", ...LOCATIONS].map((city) => `<button type="button" class="chip" data-on="${state.rankCity === city}" data-action="rank-city" data-city="${esc(city)}">${esc(city)}</button>`).join("")}</div>
${rows.length ? `    <ol class="rank-list">${rows.map(({ student, rating }, index) => `<li class="rank-card"><span class="rank-num">${index + 1}</span><div class="rank-meta"><p>${esc(student.university)} · ${esc(student.city)}</p><p>${esc(student.skills.join(" · "))}</p></div><div class="rank-badges">${levelPill(levelFor(student.experience).name)}${student.verified ? verified("Донишҷӯи тасдиқшуда") : ""}${isFreeToday(student) ? `<span class="rounded-full bg-mist px-2 py-1 text-[11px] font-bold text-pine">Имрӯз ${esc(todayWindow(student))}</span>` : ""}${stars(rating.avg, rating.count)}</div></li>`).join("")}</ol>` : `<div class="empty-state" role="status"><p class="empty-title">Дар ин шаҳр донишҷӯ нест.</p><p>Шаҳри дигарро интихоб кунед.</p><button type="button" class="btn btn-primary" data-action="rank-city" data-city="Ҳама">Ҳамаи шаҳрҳо</button></div>`}
  </div>`;
}

function walletBlock(state, user) {
  const rows = (state.data.transactions || [])
    .filter((item) => item.studentId === user.id || item.employerId === user.id)
    .sort((a, b) => b.createdAt - a.createdAt);
  if (!rows.length) {
    return EmptyState({
      title: "Ҳоло амалиёт нест.",
      text: "Вақте корфармо донишҷӯро қабул мекунад, маблағ дар ҳисоби махсус сабт мешавад.",
      action: user.role === "employer" ? "Эълон гузоштан" : "Дидани корҳо",
      view: user.role === "student" ? "jobs" : "",
      act: user.role === "employer" ? "publish" : "",
    });
  }
  return TransactionList(rows.map((item) => {
    const job = state.data.jobs.find((entry) => entry.id === item.jobId);
    const label = item.type === "release" ? "Озод шуд" : item.status === "held" ? "Дар ҳисоби махсус" : "Озод шуд";
    return `<li><span><strong>${esc(job?.title || "Кор")}</strong><small>${label}</small></span><b>${formatMoney(item.amount)} с.</b></li>`;
  }).join(""));
}

function reviewBlock(state, userId) {
  const items = state.data.ratings.filter((item) => item.toId === userId);
  if (!items.length) {
    return EmptyState({ title: "Ҳоло баҳо нест.", text: "Баъд аз анҷоми кор ҳар ду тараф метавонанд аз 1 то 5 ситора ва шарҳи ихтиёрӣ гузоранд.", action: "Дидани корҳо", view: "jobs" });
  }
  return `<ul class="review-list">${items.map((item) => {
    const from = state.data.users.find((user) => user.id === item.fromId);
    return `<li><div class="flex items-center justify-between gap-2"><strong>${esc(from?.company || from?.name || "")}</strong><span>${"★".repeat(item.stars)}${"☆".repeat(5 - item.stars)}</span></div>${item.comment ? `<p>${esc(item.comment)}</p>` : `<p class="text-ink/50">Шарҳ навишта нашудааст.</p>`}</li>`;
  }).join("")}</ul>`;
}

function studentDash(state) {
  const user = currentUser();
  if (!user || user.role !== "student") {
    return `<div class="page page-gate"><h1 class="text-2xl font-extrabold">Кабинет барои донишҷӯён</h1><p class="mt-2 text-sm text-ink/65">Бо ҳисоби донишҷӯ ворид шавед.</p><button type="button" class="btn btn-primary mt-4" data-action="open" data-modal="login">Воридшавӣ</button></div>`;
  }
  const rating = avgRating(state.data.ratings, user.id);
  const level = levelFor(user.experience);
  const badges = badgesFor(user, state.data.ratings);
  const score = completeness(user);
  const applications = state.data.applications.filter((item) => item.studentId === user.id);
  const savedJobs = (state.data.savedJobs || []).filter((item) => item.userId === user.id);
  const savedBlock = savedJobs.length
    ? `<div class="job-board mt-3">${savedJobs.map((item) => state.data.jobs.find((job) => job.id === item.jobId)).filter(Boolean).map((job) => jobCard(job, state)).join("")}</div>`
    : EmptyState({ title: "Ҳоло ягон кори захирашуда нест.", text: "Корро захира кунед, то баъдтар ба он баргардед.", action: "Дидани корҳо", view: "jobs" });
  const skillOptions = [...new Set([...SKILLS, ...(user.skills || [])])];
  const apps = applications.map((application) => {
    const job = state.data.jobs.find((item) => item.id === application.jobId);
    if (!job) return "";
    const rated = state.data.ratings.some((item) => item.fromId === user.id && item.jobId === job.id && item.direction === "student-to-employer");
    return `<li class="rounded-2xl bg-cream px-3 py-3"><p class="font-extrabold">${esc(job.title)}</p><p class="text-xs text-ink/60">${esc(job.location)} · ${APP_STATUS[application.status]}</p><div class="mt-2 flex flex-wrap gap-2"><button type="button" class="btn btn-line" data-action="chat" data-job="${esc(job.id)}" data-student="${esc(user.id)}">Паём</button>${application.status === "completed" && !rated ? `<button type="button" class="btn btn-line" data-action="rate" data-to="${esc(job.employerId)}" data-job="${esc(job.id)}" data-direction="student-to-employer">Баҳо ба корфармо</button>` : ""}</div></li>`;
  }).join("");
  return `<div class="page">
    <section class="rounded-[1.8rem] border border-line bg-paper p-5">
      <div class="flex flex-wrap items-center gap-4">${avatar(user.name, user.hue, "lg")}<div class="min-w-0 flex-1"><p class="text-xs font-extrabold tracking-wider text-pine">КАБИНЕТ</p><h1 class="text-2xl font-extrabold">${esc(user.name)}</h1><p class="text-sm text-ink/60">${esc(user.university || "Донишгоҳро илова кунед")} · ${esc(user.city)}</p><div class="mt-2 flex flex-wrap items-center gap-2">${levelPill(level.name)}<span class="text-sm font-bold text-ink/50">${esc(level.hint)}</span>${user.verified ? verified("Донишҷӯи тасдиқшуда") : ""}${stars(rating.avg, rating.count)}</div></div>
        <div class="min-w-36"><p class="text-xs font-bold text-ink/50">Пуррагии профил</p><p class="text-2xl font-extrabold text-pine">${score}%</p><div class="mt-1 h-2 overflow-hidden rounded-full bg-cream"><div class="h-full rounded-full bg-leaf" style="width:${score}%"></div></div></div>
      </div>
      <div class="mt-4 flex flex-wrap gap-2">${badges.map((badge) => `<span class="rounded-full bg-mist px-2.5 py-1 text-xs font-bold text-pine">${esc(badge.label)}</span>`).join("")}</div>
    </section>
    <div class="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
      <div class="grid gap-5">
        <section class="rounded-[1.6rem] border border-line bg-paper p-5"><h2 class="text-lg font-extrabold">Ҷадвали озод</h2><p class="mt-1 text-sm text-ink/60">Катакҳоро пахш кунед. Масалан, душанбе соатҳои 14, 15, 16 ва 17 — ин 14:00–18:00 аст.</p>
          <div class="mt-3 flex flex-wrap gap-2"><button type="button" class="chip" data-action="preset" data-preset="after">Баъд аз дарс · 14:00–18:00</button><button type="button" class="chip" data-action="preset" data-preset="evening">Бегоҳ · 18:00–21:00</button><button type="button" class="chip" data-action="preset" data-preset="weekend">Рӯзҳои истироҳат</button></div>
          <div class="mt-4">${schedule(user.availability, false)}</div>
        </section>
        <section class="rounded-[1.6rem] border border-line bg-paper p-5"><h2 class="text-lg font-extrabold">Маҳоратҳо ва портфел</h2>
          <div class="mt-3 flex flex-wrap gap-2">${skillOptions.map((skill) => `<button type="button" class="chip" data-on="${user.skills.includes(skill)}" data-action="skill" data-skill="${esc(skill)}">${esc(skill)}</button>`).join("")}</div>
          <label class="mt-4 grid gap-1 text-sm font-bold">Дар бораи ман<textarea class="field min-h-24" data-save="bio">${esc(user.bio || "")}</textarea></label>
          <div class="mt-3 grid gap-3 sm:grid-cols-2">
            <label class="grid gap-1 text-sm font-bold">Донишгоҳ<input class="field" data-save="university" value="${esc(user.university || "")}"></label>
            <div class="grid gap-1 text-sm font-bold">Шаҳр${choices("profile-city", LOCATIONS.map((city) => ({ value: city, label: city })), user.city)}</div>
          </div>
        </section>
        <section class="rounded-[1.6rem] border border-line bg-paper p-5"><h2 class="text-lg font-extrabold">Аризаҳои ман</h2><ul class="mt-3 grid gap-2">${apps || EmptyState({ title: "Ҳоло ариза надоред.", text: "Кори наздикро интихоб кунед ва ариза фиристед.", action: "Дидани корҳо", view: "jobs" })}</ul></section>
        <section class="rounded-[1.6rem] border border-line bg-paper p-5"><h2 class="text-lg font-extrabold">Корҳои захирашуда</h2>${savedBlock}</section>
        <section class="rounded-[1.6rem] border border-line bg-paper p-5"><h2 class="text-lg font-extrabold">Ҳамён</h2><p class="mt-1 text-sm text-ink/60">Маблағ ҳангоми қабул дар ҳисоби махсус мемонад ва баъд аз анҷом озод мешавад.</p>${walletBlock(state, user)}</section>
        <section class="rounded-[1.6rem] border border-line bg-paper p-5"><h2 class="text-lg font-extrabold">Баҳоҳо</h2>${reviewBlock(state, user.id)}</section>
      </div>
      <div class="grid content-start gap-5">
        <section class="rounded-[1.6rem] border border-line bg-paper p-5"><h2 class="text-lg font-extrabold">Тасдиқи донишҷӯ</h2>
          ${user.verified ? `<div class="mt-3">${verified("Донишҷӯи тасдиқшуда")}<p class="mt-2 text-sm font-semibold">Рақам: ${esc(user.studentId)}</p></div>` : `<form id="verify-form" class="mt-3 grid gap-2"><input class="field" name="studentId" value="${esc(state.verifyId)}" placeholder="ДМТ-2024-1842">${state.verifyError ? `<p class="text-sm font-semibold text-clay">${esc(state.verifyError)}</p>` : ""}<button class="btn btn-primary" type="submit">Тасдиқ кардан</button></form>`}
        </section>
        ${cvCard(user, state)}
      </div>
    </div>
  </div>`;
}

function employerDash(state) {
  const user = currentUser();
  const postedAny = state.data.jobs.some((job) => job.employerId === user?.id);
  if (!user || (user.role !== "employer" && user.role !== "admin" && !postedAny)) {
    return `<div class="page page-gate"><h1 class="text-2xl font-extrabold">Кабинет барои корфармо</h1><p class="mt-2 text-sm text-ink/65">Бо ҳисоби корфармо ворид шавед, то кор нашр кунед.</p><button type="button" class="btn btn-primary mt-4" data-action="open" data-modal="login">Воридшавӣ</button></div>`;
  }
  const myJobs = state.data.jobs.filter((job) => job.employerId === user.id);
  const selected = myJobs.find((job) => job.id === state.selectedJobId) || myJobs[0];
  const applicants = state.data.applications.filter((item) => item.jobId === selected?.id);
  const rating = avgRating(state.data.ratings, user.id);
  const held = state.data.applications
    .filter((item) => item.status === "accepted")
    .map((item) => state.data.jobs.find((job) => job.id === item.jobId))
    .filter((job) => job && job.employerId === user.id)
    .reduce((sum, job) => sum + escrowEstimate(job), 0);
  const people = applicants.map((application) => {
    const student = state.data.users.find((item) => item.id === application.studentId);
    if (!student || !selected) return "";
    const studentRating = avgRating(state.data.ratings, student.id);
    const rated = state.data.ratings.some((item) => item.fromId === user.id && item.jobId === selected.id && item.direction === "employer-to-student" && item.toId === student.id);
    return `<li class="rounded-2xl bg-cream p-3"><div class="flex items-center gap-3">${avatar(student.name, student.hue, "sm")}<div><p class="font-extrabold">${esc(student.name)}</p><p class="text-xs text-ink/55">${esc(student.university)} · ${esc(student.skills.slice(0, 3).join(", "))}</p></div><div class="ml-auto">${stars(studentRating.avg, studentRating.count)}</div></div>
      ${application.message ? `<p class="mt-2 text-sm text-ink/70">«${esc(application.message)}»</p>` : ""}
      ${application.price ? `<p class="mt-1 text-sm font-bold">Пешниҳод: ${formatMoney(application.price)} сомонӣ · ${esc(application.eta || "")}</p>` : ""}
      <p class="mt-2 text-xs font-extrabold text-pine">${APP_STATUS[application.status] || ""}</p>
      <div class="mt-2 flex flex-wrap gap-2">
        ${application.status === "pending" ? `<button type="button" class="btn btn-primary" data-action="app-status" data-id="${application.id}" data-status="accepted">Қабул</button><button type="button" class="btn btn-line" data-action="app-status" data-id="${application.id}" data-status="declined">Рад</button>` : ""}
        ${application.status === "accepted" ? `<button type="button" class="btn btn-gold" data-action="app-status" data-id="${application.id}" data-status="completed">Кор анҷом ёфт</button>` : ""}
        ${application.status === "completed" && !rated ? `<button type="button" class="btn btn-line" data-action="rate" data-to="${esc(student.id)}" data-job="${esc(selected.id)}" data-direction="employer-to-student">Баҳо ба донишҷӯ</button>` : ""}
        <button type="button" class="btn btn-line" data-action="chat" data-job="${esc(selected.id)}" data-student="${esc(student.id)}">Паём</button>
        <button type="button" class="btn btn-line" data-action="report" data-kind="user" data-id="${esc(student.id)}">Гузориш</button>
      </div></li>`;
  }).join("");
  return `<div class="page">
    <section class="flex flex-wrap items-center justify-between gap-4 rounded-[1.8rem] bg-pine px-5 py-5 text-cream">
      <div><p class="text-xs font-extrabold tracking-wider text-gold">КАБИНЕТИ КОРФАРМО</p><h1 class="mt-1 text-2xl font-extrabold">${esc(employerName(user))}</h1><div class="mt-2 flex flex-wrap items-center gap-2">${user.verified ? verified() : `<button type="button" class="btn btn-gold" data-action="verify-employer">Тасдиқи корфармо</button>`}${stars(rating.avg, rating.count, true)}${feeBadge()}</div></div>
      <button type="button" class="btn btn-gold" data-action="publish" data-location="${esc(user.city)}">Эълон гузоштан</button>
    </section>
    <div class="mt-4 grid gap-3 sm:grid-cols-3">
      <article class="rounded-3xl border border-line bg-paper p-4"><p class="text-xs font-bold text-ink/50">Эълонҳо</p><p class="text-2xl font-extrabold">${myJobs.length}</p></article>
      <article class="rounded-3xl border border-line bg-paper p-4"><p class="text-xs font-bold text-ink/50">Дар ҳисоби махсус</p><p class="text-2xl font-extrabold">${formatMoney(held)} с.</p><p class="text-[11px] text-ink/45">Барои соатбайъ ҳисоб аз рӯи 4 соат аст.</p></article>
      <article class="rounded-3xl border border-line bg-paper p-4"><p class="text-xs font-bold text-ink/50">Меъёри комиссия</p><p class="text-2xl font-extrabold">5–10%</p><p class="text-[11px] text-ink/45">VIP 5% · оддӣ 8% · фаврӣ 10%</p></article>
    </div>
    <section class="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <div class="rounded-[1.6rem] border border-line bg-paper p-4"><h2 class="text-lg font-extrabold">Корҳои ман</h2><ul class="mt-3 grid gap-2">${myJobs.length ? myJobs.map((job) => `<li><button type="button" data-action="select-job" data-id="${esc(job.id)}" class="w-full rounded-2xl px-3 py-3 text-left ${selected?.id === job.id ? "bg-mist" : "bg-cream"}"><span class="font-extrabold">${esc(job.title)}</span>${job.vip ? ` <span class="rounded-full bg-gold px-2 py-0.5 text-[10px] font-extrabold">VIP</span>` : ""}<span class="mt-1 block text-xs text-ink/60">${esc(payLabel(job))} · ${esc(job.location)} · комиссия ${Math.round(feeRate(job.vip, job.rush) * 100)}%</span></button></li>`).join("") : EmptyState({ title: "Ҳоло эълон нест.", text: "Кори нав нашр кунед, то донишҷӯён ариза диҳанд.", action: "Эълон гузоштан", act: "publish" })}</ul></div>
      <div class="rounded-[1.6rem] border border-line bg-paper p-4"><h2 class="text-lg font-extrabold">Аризаҳо ${selected ? `· ${esc(selected.title)}` : ""}</h2>${selected ? `<div class="mt-2">${escrow()}</div>` : ""}${people ? `<ul class="mt-3 grid gap-3">${people}</ul>` : EmptyState({ title: "Ҳоло ариза нест.", text: "Вақте донишҷӯ ариза диҳад, он дар ҳамин ҷо меояд.", action: "Дидани донишҷӯён", view: "students" })}</div>
    </section>
    <section class="mt-5 grid gap-4 lg:grid-cols-2">
      <div class="rounded-[1.6rem] border border-line bg-paper p-5"><h2 class="text-lg font-extrabold">Ҳамён</h2>${walletBlock(state, user)}</div>
      <div class="rounded-[1.6rem] border border-line bg-paper p-5"><h2 class="text-lg font-extrabold">Баҳоҳо</h2>${reviewBlock(state, user.id)}</div>
    </section>
  </div>`;
}

function progressPanel(user, state) {
  const progress = progressFor(user, state.data);
  if (!progress) return "";
  const cards = progress.badges.map((badge) => `<article class="achieve-card${badge.ok ? " is-on" : ""}"><p class="achieve-mark" aria-hidden="true">${badge.ok ? "★" : "○"}</p><h3>${esc(badge.title)}</h3><p>${esc(badge.text)}</p></article>`).join("");
  return `<section class="progress-panel" aria-label="Пешрафт">
    <div class="progress-head">
      <div><p class="kicker">Пешрафт</p><h2>Сатҳи ${esc(progress.level)}</h2><p class="progress-meta">${progress.xp} XP · ${progress.apps} ариза · ${progress.done} кори анҷомёфта</p></div>
      <div class="streak-pill"><strong>${progress.streak}</strong><span>силсилаи рӯз</span><small>Беҳтарин: ${progress.bestStreak}</small></div>
    </div>
    <div class="xp-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress.pct}" aria-label="XP то сатҳи навбатӣ"><span style="width:${progress.pct}%"></span></div>
    <div class="achieve-grid">${cards}</div>
  </section>`;
}

function courses(state) {
  const cards = JOB_CATEGORIES.map((category) => {
    const count = state.data.jobs.filter((job) => job.category === category && job.status !== "done").length;
    return `<button type="button" class="course-card" data-action="category-go" data-category="${esc(category)}"><span class="kicker">Курс</span><strong>${esc(category)}</strong><span>${count} эълони кушода</span></button>`;
  }).join("");
  return `<div class="page"><p class="kicker">Курсҳо</p><h1 class="mt-2 text-3xl font-extrabold">Самтҳои кор</h1><p class="mt-2 max-w-2xl text-sm text-slate-400">Ҳар самт аз эълонҳои воқеии платформа гирифта шудааст. Самтро кушоед, то корҳои ҳамон категорияро бинед.</p><div class="course-grid">${cards}</div></div>`;
}

function tasks(state) {
  const user = currentUser();
  if (!user) return gate("Вазифаҳо", "Вазифаҳо баъд аз воридшавӣ, аз аризаҳо ва эълонҳои шумо сохта мешаванд.");
  if (user.role === "employer") {
    const jobs = state.data.jobs.filter((job) => job.employerId === user.id);
    const body = jobs.length
      ? `<ul class="task-list">${jobs.map((job) => `<li><div><strong>${esc(job.title)}</strong><span>${esc(job.location)} · ${esc(STATUS[job.status] || job.status)}</span></div><button type="button" class="btn btn-line" data-action="open-job" data-id="${esc(job.id)}">Кушодан</button></li>`).join("")}</ul>`
      : EmptyState({ title: "Ҳоло вазифа нест.", text: "Эълони нав гузоред, то он дар рӯйхати вазифаҳо пайдо шавад.", action: "Эълон гузоштан", act: "publish" });
    return `<div class="page"><p class="kicker">Вазифаҳо</p><h1 class="mt-2 text-3xl font-extrabold">Эълонҳои шумо</h1>${body}</div>`;
  }
  const invited = state.data.jobs.filter((job) => job.invitedStudentId === user.id);
  const inviteBlock = invited.length
    ? `<section class="mb-6"><h2 class="text-xl font-extrabold">Шумо интихоб шудед</h2><ul class="task-list">${invited.map((job) => `<li><div><strong>${esc(job.title)}</strong><span>${esc(job.category)} · ${esc(payLabel(job))}</span></div><button type="button" class="btn btn-line" data-action="open-job" data-id="${esc(job.id)}">Кушодан</button></li>`).join("")}</ul></section>`
    : "";
  const applications = state.data.applications.filter((item) => item.studentId === user.id);
  const body = applications.length
    ? `<ul class="task-list">${applications.map((application) => {
      const job = state.data.jobs.find((item) => item.id === application.jobId);
      if (!job) return "";
      return `<li><div><strong>${esc(job.title)}</strong><span>${esc(APP_STATUS[application.status] || application.status)} · ${esc(job.location)}</span></div><button type="button" class="btn btn-line" data-action="open-job" data-id="${esc(job.id)}">Кушодан</button></li>`;
    }).join("")}</ul>`
    : EmptyState({ title: "Ҳоло вазифа нест.", text: "Ба як кор ариза диҳед, то он дар ин рӯйхат пайдо шавад.", action: "Дидани корҳо", view: "jobs" });
  const owned = state.data.jobs.filter((job) => job.employerId === user.id);
  const posted = owned.length
    ? `<section class="mt-6"><h2 class="text-xl font-extrabold">Корҳои нашршуда</h2><ul class="task-list">${owned.map((job) => {
      const count = state.data.applications.filter((item) => item.jobId === job.id).length;
      return `<li><div><strong>${esc(job.title)}</strong><span>${esc(STATUS[job.status] || job.status)} · ${count} пешниҳод</span></div><button type="button" class="btn btn-line" data-action="review-job" data-id="${esc(job.id)}">Пешниҳодҳо</button></li>`;
    }).join("")}</ul></section>`
    : "";
  return `<div class="page"><p class="kicker">Вазифаҳо</p><h1 class="mt-2 text-3xl font-extrabold">Аризаҳои фаъол</h1>${progressPanel(user, state)}${inviteBlock}${body}${posted}</div>`;
}

function settings(state) {
  const user = currentUser();
  const prefs = state.settings || {};
  const account = user
    ? `<form id="account-form" class="settings-form"><label>Ном<input class="field" name="name" value="${esc(user.name || "")}" autocomplete="name"></label><label>Телефон<input class="field" name="phone" value="${esc(user.phone || "")}" autocomplete="tel"></label><label>Донишгоҳ<input class="field" name="university" value="${esc(user.university || "")}"></label>${state.accountError ? `<p class="text-sm font-semibold text-clay" role="alert">${esc(state.accountError)}</p>` : ""}<button class="btn btn-primary" type="submit">Сабт кардан</button></form>`
    : `<p class="text-sm text-slate-400">Барои тағйири ҳисоб аввал ворид шавед.</p><button type="button" class="btn btn-primary mt-3" data-action="open" data-modal="login">Воридшавӣ</button>`;
  const password = user
    ? `<form id="password-form" class="settings-form"><label>Рамзи ҳозира<input class="field" type="password" name="current" autocomplete="current-password"></label><label>Рамзи нав<input class="field" type="password" name="next" autocomplete="new-password"></label>${state.passwordError ? `<p class="text-sm font-semibold text-clay" role="alert">${esc(state.passwordError)}</p>` : ""}<button class="btn btn-primary" type="submit">Иваз кардани рамз</button></form>`
    : "";
  const toggle = (key, on) => `<button type="button" class="switch${on ? " is-on" : ""}" role="switch" aria-checked="${on}" data-action="setting" data-key="${key}" data-value="toggle"><span></span></button>`;
  return `<div class="page settings-page"><p class="kicker">Танзимот</p><h1 class="mt-2 text-3xl font-extrabold">Ҳисоб ва барнома</h1>
    <section class="settings-card"><h2>Забон</h2><p>Матни платформа ба тоҷикӣ мемонад. Интихоб дар ҳамин дастгоҳ сабт мешавад.</p><div class="choice-row"><button type="button" class="chip" data-on="${prefs.lang !== "ru"}" data-action="setting" data-key="lang" data-value="tg">Тоҷикӣ</button><button type="button" class="chip" data-on="${prefs.lang === "ru"}" data-action="setting" data-key="lang" data-value="ru">Русский</button></div></section>
    <section class="settings-card"><h2>Мавзӯъ</h2><div class="choice-row"><button type="button" class="chip" data-on="${prefs.theme !== "violet"}" data-action="setting" data-key="theme" data-value="indigo">Нилӣ</button><button type="button" class="chip" data-on="${prefs.theme === "violet"}" data-action="setting" data-key="theme" data-value="violet">Бунафш</button></div></section>
    <section class="settings-card"><h2>Огоҳиҳо</h2><div class="setting-row"><div><strong>Паёмҳои кӯтоҳ</strong><p>Тостҳо баъд аз ариза, баҳо ва пардохт.</p></div>${toggle("notifications", prefs.notifications !== false)}</div></section>
    <section class="settings-card"><h2>Ёдрас</h2><div class="setting-row"><div><strong>Соатҳои озоди имрӯз</strong><p>Дар саҳифаи асосӣ нишон дода мешавад, агар ҷадвал кушода бошад.</p></div>${toggle("reminders", prefs.reminders !== false)}</div></section>
    <section class="settings-card"><h2>Махфият</h2><div class="setting-row"><div><strong>Пинҳон аз рейтинг</strong><p>Номи шумо дар рӯйхати оммавии рейтингҳо намеравад.</p></div>${toggle("privacyHideRank", Boolean(prefs.privacyHideRank))}</div></section>
    <section class="settings-card"><h2>Ҳисоб</h2>${account}</section>
    ${password ? `<section class="settings-card"><h2>Иваз кардани рамз</h2>${password}</section>` : ""}
    <section class="settings-card"><h2>Кумак</h2><p>Пардохт, гузориш ва қоидаҳои эътимод дар саҳифаи бехатарӣ шарҳ дода шудаанд.</p><button type="button" class="btn btn-line mt-3" data-action="go" data-view="safety">Кушодани бехатарӣ</button></section>
    <section class="settings-card"><h2>Дар бораи StudentWork.tj</h2><p>Платформаи кори соатбайъ барои донишҷӯёни Тоҷикистон. Маблағ то анҷоми кор дар ҳисоби махсус мемонад. Комиссия 5–10% аст.</p></section>
    <section class="settings-card"><h2>Баромад</h2>${user ? `<button type="button" class="btn btn-primary" data-action="logout">Аз ҳисоб баромадан</button>` : `<p class="text-sm text-slate-400">Шумо ворид нашудаед.</p>`}</section>
  </div>`;
}

function achievementModal(state) {
  const badge = state.achievement;
  if (!badge) return "";
  return modalShell("Табрик!", badge.title, `<div class="achieve-pop"><p class="achieve-mark">★</p><p>${esc(badge.text)}</p><p class="text-sm text-slate-400">Дастовард ба профили шумо илова шуд.</p><button type="button" class="btn btn-primary mt-4" data-action="close">Давом додан</button></div>`);
}

const NAV_ICONS = {
  home: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>`,
  courses: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7.5 12 4l9 3.5L12 11 3 7.5Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M7 9.2v4.2c0 .4 2.2 2.1 5 2.1s5-1.7 5-2.1V9.2" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>`,
  tasks: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h11M8 12h11M8 18h11" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M4.5 6.2 5.4 7.2 7.2 5.2M4.5 12.2 5.4 13.2 7.2 11.2M4.5 18.2 5.4 19.2 7.2 17.2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  notices: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.2 1.5H4.8L6 16.5Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M10 19a2 2 0 0 0 4 0" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>`,
  profile: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M5.5 19.2c1.4-2.6 3.6-3.7 6.5-3.7s5.1 1.1 6.5 3.7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
};

function unreadCount(state) {
  const id = state.data.sessionUserId;
  if (!id) return 0;
  return (state.data.notifications || []).filter((item) => item.userId === id && !item.read).length;
}

function accountMenu(state, user, dash) {
  const open = state.picker === "account";
  const role = user.role === "employer" ? "Корфармо" : "Донишҷӯ";
  const place = user.role === "employer" ? (user.org || "") : (user.university || "");
  const meta = [role, place, user.city].filter(Boolean).join(" · ");
  return `<div class="picker account-menu ${open ? "is-open" : ""}">
    <button type="button" class="account-avatar" data-action="picker" data-picker="account" aria-expanded="${open}" aria-label="Профили ${esc(user.name)}">${avatar(user.name, user.hue, "sm")}</button>
    ${open ? `<div class="picker-menu account-card" role="menu">
      <div class="account-head">${avatar(user.name, user.hue)}<div><strong>${esc(user.name)}</strong><span>${esc(user.email || "")}</span></div></div>
      <p class="account-meta">${esc(meta)}</p>
      <button type="button" role="menuitem" data-action="go" data-view="${dash}">Профил</button>
      <button type="button" role="menuitem" data-action="flow" data-flow="post">Дохил кардани эълон</button>
      <button type="button" role="menuitem" data-action="go" data-view="${dash}">Кабинет</button>
      <button type="button" role="menuitem" data-action="logout">Баромад</button>
    </div>` : ""}
  </div>`;
}

function textNav(state) {
  const open = state.picker === "filters";
  const categories = CATEGORIES.map((item) => ({ value: item, label: item === "Ҳама" ? "Ҳама категорияҳо" : item }));
  const links = [
    ["home", "Саҳифаи асосӣ"],
    ["jobs", "Корҳо"],
    ["safety", "Дастурҳо"],
    ["inbox", "Тамос"],
  ];
  const panel = open
    ? `<div class="filter-panel" role="dialog" aria-label="Категорияҳо"><div class="filter-group"><p>Категория</p><div class="filter-options">${categories.map((item) => `<button type="button" class="chip" data-on="${item.value === state.filters.category}" data-action="filter-set" data-key="category" data-value="${esc(item.value)}">${esc(item.label)}</button>`).join("")}</div></div></div>`
    : "";
  return `<nav class="text-nav" aria-label="Саҳифаҳо">
      ${links.map(([view, label]) => `<button type="button" class="${state.view === view ? "is-on" : ""}" data-action="go" data-view="${view}">${label}</button>`).join("")}
      <button type="button" data-action="picker" data-picker="filters" aria-expanded="${open}">Категорияҳо</button>
      ${panel}
    </nav>`;
}

function header(state) {
  const user = currentUser();
  const dash = user?.role === "employer" ? "employerDash" : "studentDash";
  const guest = user ? "" : `<button type="button" class="login-link" data-action="open" data-modal="login">Воридшавӣ</button>`;
  const account = user ? accountMenu(state, user, dash) : "";
  const tools = guest ? `<div class="header-tools">${guest}</div>` : "";
  return `<header class="site-header"><div class="site-bar">
      <button type="button" class="menu-toggle" data-action="menu" aria-label="Меню" aria-expanded="${state.menuOpen}"><span class="menu-lines"></span></button>
      <button type="button" class="brand-btn" data-action="go" data-view="home" aria-label="Экрани асосӣ">${logo()}</button>
      ${tools}
      ${account}
    </div></header>`;
}

function footer() {
  const pages = [["jobs", "Ҷои кор"], ["employers", "Барои корфармо"], ["students", "Донишҷӯён"], ["rankings", "Рейтингҳо"], ["safety", "Бехатарӣ"], ["inbox", "Паёмҳо"]];
  return `<footer class="site-footer">
    <div class="site-footer-grid">
      <div class="footer-brand">
        ${logo()}
        <p>Кори соатбайъ ва чандир барои донишҷӯёни Тоҷикистон. Маблағ то иҷрои кор дар ҳисоби махсус мемонад.</p>
      </div>
      <nav class="footer-col" aria-label="Саҳифаҳо">
        <p class="footer-kicker">Саҳифаҳо</p>
        <div class="footer-links">${pages.map(([view, label]) => `<button type="button" data-action="go" data-view="${view}">${label}</button>`).join("")}</div>
      </nav>
      <div class="footer-col">
        <p class="footer-kicker footer-cities-kicker">Шаҳрҳо</p>
        <ul class="footer-cities">${LOCATIONS.map((city) => `<li>${esc(city)}</li>`).join("")}</ul>
        <p class="footer-note">Комиссияи платформа 5–10% аз рӯи намуди эълон.</p>
        <button type="button" class="footer-reset" data-action="reset">Бозсозии маълумоти намунавӣ</button>
      </div>
    </div>
    <div class="site-footer-bar">© 2026 StudentWork.tj · Маълумот дар ҳамин браузер нигоҳ дошта мешавад</div>
  </footer>`;
}

function showDemoAccounts() {
  return import.meta.env?.DEV === true;
}

const GATE_MAIL = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>`;
const GATE_LOCK = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M8 10V8a4 4 0 0 1 8 0v2" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>`;
const GATE_EYE = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="2.4" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>`;
const GATE_CHECK = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5 10 17.5 19 7" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const GATE_PLANE = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.2 11.2 20.8 4.2l-6.6 15.6-2.4-6.4-8.6-2.2Z" fill="currentColor"/></svg>`;
const GATE_BITS = [["#a78bfa", "-54px", "-36px"], ["#38bdf8", "48px", "-48px"], ["#fbbf24", "-18px", "52px"], ["#f472b6", "58px", "22px"], ["#2dd4bf", "10px", "-62px"], ["#fb923c", "-62px", "18px"], ["#a78bfa", "28px", "58px"], ["#38bdf8", "-36px", "-58px"]];

function gateBox(icon, control, extra = "") {
  return `<span class="gate-box${icon ? "" : " no-ico"}${extra ? ` ${extra}` : ""}">${icon}${control}</span>`;
}

function authModal(state) {
  const signupMode = state.modal === "signup";
  const draft = state.authDraft;
  const phase = state.authPhase || "";
  const bad = phase === "error" ? "is-bad" : "";
  const cities = LOCATIONS.map((city) => ({ value: city, label: city }));
  const peek = Boolean(state.authPeek);
  const busy = phase === "loading" || phase === "success";
  const bits = GATE_BITS.map(([color, x, y]) => `<i style="--x:${x};--y:${y};background:${color}"></i>`).join("");
  const loginFields = `<label class="gate-field" for="auth-identity">Почта ё телефон${gateBox(GATE_MAIL, `<input id="auth-identity" name="identity" value="${esc(draft.identity || draft.email)}" placeholder="name@mail.com ё +992…" autocomplete="username" aria-describedby="gate-error" ${bad ? "aria-invalid=\"true\"" : ""} ${busy ? "disabled" : ""}>`, bad)}</label>
    <label class="gate-field" for="auth-password">Рамз${gateBox(GATE_LOCK, `<input id="auth-password" name="password" type="${peek ? "text" : "password"}" value="${esc(draft.password)}" placeholder="••••••••" autocomplete="current-password" aria-describedby="gate-error" ${bad ? "aria-invalid=\"true\"" : ""} ${busy ? "disabled" : ""}><button type="button" id="auth-peek" class="gate-eye" data-action="peek" aria-label="${peek ? "Рамзро пинҳон кун" : "Рамзро нишон деҳ"}">${GATE_EYE}</button>`, bad)}</label>
    <div class="gate-forgot-row"><button type="button" class="gate-forgot" data-action="forgot">Рамзро фаромӯш кардед?</button></div>`;
  const signupFields = `<div class="gate-tabs gate-role" role="group" aria-label="Нақш">
      <button type="button" class="${draft.role === "student" ? "is-on" : ""}" data-action="role" data-role="student">Донишҷӯ</button>
      <button type="button" class="${draft.role === "employer" ? "is-on" : ""}" data-action="role" data-role="employer">Корфармо</button>
    </div>
    <input type="hidden" name="role" value="${esc(draft.role)}">
    ${draft.role === "student" ? `<label class="gate-field" for="auth-name">Ном${gateBox("", `<input id="auth-name" name="name" value="${esc(draft.name)}" placeholder="Номи пурра" autocomplete="name" ${busy ? "disabled" : ""}>`)}</label>` : `<label class="gate-field" for="auth-org">Ширкат${gateBox("", `<input id="auth-org" name="org" value="${esc(draft.org)}" placeholder="Номи ширкат" autocomplete="organization" ${busy ? "disabled" : ""}>`)}</label>`}
    <label class="gate-field" for="auth-phone">Телефон${gateBox("", `<input id="auth-phone" name="phone" type="tel" inputmode="tel" value="${esc(draft.phone)}" placeholder="+992 900 000 000" autocomplete="tel" ${busy ? "disabled" : ""}>`)}</label>
    <label class="gate-field" for="auth-email">Почта${gateBox(GATE_MAIL, `<input id="auth-email" name="email" type="email" value="${esc(draft.email)}" placeholder="name@mail.com" autocomplete="email" ${busy ? "disabled" : ""}>`)}</label>
    <label class="gate-field" for="auth-password">Рамз${gateBox(GATE_LOCK, `<input id="auth-password" name="password" type="${peek ? "text" : "password"}" value="${esc(draft.password)}" placeholder="••••••••" autocomplete="new-password" ${busy ? "disabled" : ""}><button type="button" id="auth-peek" class="gate-eye" data-action="peek" aria-label="${peek ? "Рамзро пинҳон кун" : "Рамзро нишон деҳ"}">${GATE_EYE}</button>`)}</label>
    <div class="gate-field"><span id="auth-city-label">Шаҳр</span><input type="hidden" name="city" value="${esc(draft.city)}">${picker(state, { id: "auth-city", label: "", value: draft.city, options: cities, field: true })}</div>
    ${draft.role === "student" ? `<div class="gate-field"><span id="skill-label">Маҳоратҳо</span><div class="flex flex-wrap gap-2" role="group" aria-labelledby="skill-label">${SKILLS.map((skill) => `<button type="button" class="chip" data-on="${(draft.skills || []).includes(skill)}" data-action="auth-skill" data-skill="${esc(skill)}">${esc(skill)}</button>`).join("")}</div></div>` : `<label class="gate-field" for="auth-about">Тавсифи ширкат<textarea id="auth-about" name="about" placeholder="Чӣ кор мекунед ва кадом донишҷӯ лозим аст" ${busy ? "disabled" : ""}>${esc(draft.about || "")}</textarea></label>`}`;
  const demos = !signupMode && showDemoAccounts()
    ? `<div class="gate-demos"><button type="button" class="gate-chip" data-action="demo" data-email="mehrona@studentwork.tj">Донишҷӯ</button><button type="button" class="gate-chip" data-action="demo" data-email="safed@studentwork.tj">Корфармо</button><span class="gate-chip">demo123</span></div>`
    : "";
  return `<div class="modal-root gate-root" role="dialog" aria-modal="true" aria-labelledby="gate-title">
    <button type="button" class="gate-overlay" data-action="close" aria-label="Пӯшидан"></button>
    <div class="gate-card">
      <div class="gate-bar" aria-hidden="true"></div>
      <button type="button" class="gate-x" data-action="close" aria-label="Пӯшидан">✕</button>
      <div class="gate-head">
        <span class="gate-logo" aria-hidden="true">S</span>
        <div><h2 id="gate-title">Хуш омадед</h2><p>${signupMode ? "Ҳисоби донишҷӯ ё корфармо кушоед." : "Ба кабинети худ дароед."}</p></div>
      </div>
      <div class="gate-tabs" role="tablist" aria-label="Воридшавӣ ё бақайдгирӣ">
        <button type="button" role="tab" aria-selected="${!signupMode}" class="${signupMode ? "" : "is-on"}" data-action="open" data-modal="login">Воридшавӣ</button>
        <button type="button" role="tab" aria-selected="${signupMode}" class="${signupMode ? "is-on" : ""}" data-action="open" data-modal="signup">Бақайдгирӣ</button>
      </div>
      <form id="auth-form" class="gate-form">
        <div class="gate-fields ${phase === "success" ? "is-dim" : ""}">${signupMode ? signupFields : loginFields}</div>
        <p class="gate-hello ${phase === "success" ? "is-on" : ""}">${phase === "success" ? `Хуш омадед, ${esc(state.authWelcome)}!` : ""}</p>
        <p id="gate-error" class="gate-error" role="alert">${phase === "error" && state.authError ? esc(state.authError) : ""}</p>
        <button class="go ${esc(phase)}" type="submit" ${busy ? "disabled" : ""}>
          <span class="go-label">${signupMode ? "Бақайдгирӣ" : "Ворид шудан"} <span class="go-arrow" aria-hidden="true">→</span></span>
          <span class="go-spin" aria-hidden="true"></span>
          <span class="go-ok" aria-hidden="true">${GATE_CHECK}</span>
          <span class="go-ring" aria-hidden="true"></span>
          <span class="go-plane" aria-hidden="true">${GATE_PLANE}</span>
          <span class="go-burst" aria-hidden="true">${bits}</span>
        </button>
      </form>
      ${signupMode ? `<p class="gate-switch">Ҳисоб доред? <button type="button" data-action="open" data-modal="login">Воридшавӣ</button></p>` : `<p class="gate-switch">Ҳисоб надоред? <button type="button" data-action="open" data-modal="signup">Бақайдгирӣ</button></p>`}
      ${demos}
    </div>
  </div>`;
}

function publishModal(state) {
  const user = currentUser();
  const now = new Date();
  const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const draft = state.publishDraft || {
    title: "",
    category: "Пешхизмат",
    payAmount: 30,
    payType: "hourly",
    date: today,
    timeStart: "14:00",
    timeEnd: "18:00",
    description: "",
    location: state.publishLocation || user?.city || "Душанбе",
    vip: false,
    rush: false,
  };
  const amount = Number(draft.payAmount) || 0;
  const rate = feeRate(draft.vip, draft.rush);
  const fee = amount * rate;
  const body = `<form id="publish-form" class="grid gap-3">
    <input type="hidden" name="category" value="${esc(draft.category)}">
    <input type="hidden" name="location" value="${esc(draft.location)}">
    <input type="hidden" name="payType" value="${esc(draft.payType)}">
    <label class="grid gap-1 text-sm font-bold">Номи кор<input class="field" name="title" value="${esc(draft.title)}" placeholder="Масалан: Пешхизмат барои шом"></label>
    <div class="grid gap-2 text-sm font-bold">Категория${choices("publish-category", JOB_CATEGORIES.map((category) => ({ value: category, label: category })), draft.category)}</div>
    <div class="grid gap-2 text-sm font-bold">Шаҳр${choices("publish-location", LOCATIONS.map((city) => ({ value: city, label: city })), draft.location)}</div>
    <div class="grid gap-3 sm:grid-cols-2">
      <label class="grid gap-1 text-sm font-bold">Маблағ (сомонӣ)<input class="field" type="number" min="1" name="payAmount" value="${esc(draft.payAmount)}"></label>
      <div class="grid content-start gap-2 text-sm font-bold">Намуди пардохт${choices("publish-payType", [{ value: "hourly", label: "Соатбайъ" }, { value: "fixed", label: "Маблағи собит" }], draft.payType)}</div>
    </div>
    <div class="grid gap-3 sm:grid-cols-3">
      <label class="grid gap-1 text-sm font-bold">Сана<input class="field" type="date" name="date" value="${esc(draft.date)}"></label>
      <label class="grid gap-1 text-sm font-bold">Аз<input class="field" type="time" name="timeStart" value="${esc(draft.timeStart)}"></label>
      <label class="grid gap-1 text-sm font-bold">То<input class="field" type="time" name="timeEnd" value="${esc(draft.timeEnd)}"></label>
    </div>
    <label class="grid gap-1 text-sm font-bold">Тавсиф<textarea class="field min-h-24" name="description" placeholder="Чӣ кор бояд шавад, либос, ҷои вохӯрӣ...">${esc(draft.description)}</textarea></label>
    <div class="grid gap-2 sm:grid-cols-2">
      <label class="flex items-start gap-3 rounded-2xl bg-gold-soft p-3 text-sm"><input type="checkbox" name="vip" ${draft.vip ? "checked" : ""}><span><span class="block font-extrabold">VIP · Пешбар</span>Эълон дар боло меистад. Ҷойгиркунӣ ${VIP_PIN_FEE} сомонӣ, комиссия 5%.</span></label>
      <label class="flex items-start gap-3 rounded-2xl bg-white p-3 text-sm"><input type="checkbox" name="rush" ${draft.rush ? "checked" : ""}><span><span class="block font-extrabold">Пардохти фаврӣ</span>Барои кори ҳамон рӯз комиссия 10% аст, агар VIP набошад.</span></label>
    </div>
    <div class="rounded-2xl border border-line bg-white p-4 text-sm"><div class="mb-2 flex items-center justify-between gap-2"><span class="font-extrabold">Ҳисоби пардохт</span>${feeBadge()}</div>
      <p>Ба донишҷӯ: ${formatMoney(amount)} сомонӣ${draft.payType === "hourly" ? " / соат" : " барои як кор"}</p>
      <p>Комиссия (${feePercentLabel(rate)}): ${formatMoney(fee)} сомонӣ${draft.payType === "hourly" ? " / соат" : ""}</p>
      ${draft.vip ? `<p>Пардохти яквақтаи VIP: ${VIP_PIN_FEE} сомонӣ</p>` : ""}
      <p class="mt-1 font-extrabold">Ҷамъ барои ${draft.payType === "hourly" ? "як соат" : "ин кор"}: ${formatMoney(amount + fee)} сомонӣ</p>
      <div class="mt-3">${escrow()}</div>
    </div>
    ${state.publishError ? `<p class="rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-clay">${esc(state.publishError)}</p>` : ""}
    <button class="btn btn-gold w-full" type="submit">Эълон гузоштан</button>
  </form>`;
  return modalShell("Илова кардани кори нав", "Дархости кӯтоҳ ба рӯйхати фаъол меравад.", body);
}

function applyModal(state) {
  const job = state.data.jobs.find((item) => item.id === state.activeJobId);
  const employer = state.data.users.find((user) => user.id === job?.employerId);
  const user = currentUser();
  const already = state.data.applications.some((item) => item.jobId === job?.id && item.studentId === user?.id);
  if (!job) return "";
  const body = already
    ? `<p class="rounded-2xl bg-mist px-4 py-3 text-sm font-semibold text-pine">Шумо ба ин кор аллакай ариза додаед. Ҷавоб дар кабинети шумо меояд.</p>`
    : `<form id="apply-form" class="grid gap-3"><p class="text-sm text-ink/70">${esc(payLabel(job))} · ${esc(job.location)} · ${esc(job.timeStart)}–${esc(job.timeEnd)}</p>
      <label class="grid gap-1 text-sm font-bold">Паёми кӯтоҳ<textarea class="field min-h-28" name="message" placeholder="Кай озодам, чӣ таҷриба дорам...">${esc(state.applyMessage)}</textarea></label>
      ${state.applyError ? `<p class="text-sm font-semibold text-clay">${esc(state.applyError)}</p>` : ""}
      <button class="btn btn-primary w-full" type="submit">Ариза додан</button></form>`;
  return modalShell("Дархост фиристодан", `${job.title} · ${employerName(employer)}`, body);
}

function proposalModal(state) {
  const job = state.data.jobs.find((item) => item.id === state.activeJobId);
  const user = currentUser();
  if (!job) return "";
  const already = state.data.applications.some((item) => item.jobId === job.id && item.studentId === user?.id);
  const body = already
    ? `<p class="rounded-2xl bg-mist px-4 py-3 text-sm font-semibold text-pine">Пешниҳоди шумо аллакай сабт шудааст.</p>`
    : `<form id="proposal-form" class="grid gap-3">
      <label class="grid gap-1 text-sm font-bold">Нархи пешниҳод (сомонӣ)<input class="field" type="number" min="1" name="price" value="${esc(job.payAmount || "")}"></label>
      <label class="grid gap-1 text-sm font-bold">Мӯҳлати иҷро<input class="field" name="eta" placeholder="Масалан: 3 рӯз"></label>
      <label class="grid gap-1 text-sm font-bold">Паём<textarea class="field min-h-24" name="message" placeholder="Чӣ тавр иҷро мекунам"></textarea></label>
      ${state.proposalError ? `<p class="text-sm font-semibold text-clay" role="alert">${esc(state.proposalError)}</p>` : ""}
      <button class="btn btn-primary" type="submit">Пешниҳод фиристодан</button>
    </form>`;
  return modalShell("Пешниҳод фиристодан", job.title, body);
}

function rateModal(state) {
  const person = state.data.users.find((user) => user.id === state.rateCtx?.toId);
  const job = state.data.jobs.find((item) => item.id === state.rateCtx?.jobId);
  const starsHtml = [1, 2, 3, 4, 5].map((star) => `<button type="button" data-action="star" data-star="${star}" aria-label="${star} аз 5" class="grid h-11 w-11 place-items-center rounded-2xl border ${state.rateStars >= star ? "border-gold bg-gold-soft text-gold" : "border-line bg-white text-ink/30"}">★</button>`).join("");
  const body = `<form id="rate-form" class="grid gap-4"><p class="text-sm text-ink/70">${esc(person?.company || person?.name || "")}. Аз 1 то 5 ситора. Шарҳи хаттӣ ихтиёрӣ аст ва ба ҳисоби миёна дохил мешавад.</p>
    <div class="flex gap-1" role="group" aria-label="Ситораҳо">${starsHtml}</div>
    <label class="grid gap-1 text-sm font-bold">Шарҳ (ихтиёрӣ)<textarea class="field min-h-24" name="comment" placeholder="Чӣ хуб буд?"></textarea></label>
    <button class="btn btn-primary w-full" type="submit">Фиристодани баҳо</button></form>`;
  const title = state.rateCtx?.direction === "student-to-employer" ? "Баҳо ба корфармо" : "Баҳо ба донишҷӯ";
  return modalShell(title, job?.title || "", body);
}

function jobModal(state) {
  const job = state.data.jobs.find((item) => item.id === state.activeJobId);
  if (!job) return "";
  const employer = state.data.users.find((user) => user.id === job.employerId);
  const rating = avgRating(state.data.ratings, job.employerId);
  const user = currentUser();
  const mine = state.data.applications.find((item) => item.jobId === job.id && item.studentId === user?.id);
  const open = isOpenStatus(job.status);
  const locked = !open || mine;
  return `<div class="modal-root job-pop" role="dialog" aria-modal="true" aria-labelledby="job-pop-title">
    <button type="button" class="gate-overlay" data-action="close" aria-label="Пӯшидан"></button>
    <div class="job-pop-card">
      <div class="gate-bar" aria-hidden="true"></div>
      <button type="button" class="gate-x" data-action="close" aria-label="Пӯшидан">✕</button>
      <h2 id="job-pop-title">${esc(job.title)}</h2>
      <p class="job-pop-sub">${esc(job.category)} · ${esc(job.location)}</p>
      <div class="job-pop-pills">${job.vip ? `<span class="job-pill is-vip">VIP · Пешбар</span>` : ""}${employer?.verified ? `<span class="job-pill is-ok">Тасдиқшуда</span>` : `<span class="job-pill">Тасдиқ нашудааст</span>`}<span class="job-pill is-fee">Комиссия 5–10%</span></div>
      <p class="job-pop-name">${esc(employerName(employer))}</p>
      <p class="job-pop-stars">${rating.count ? `★ ${rating.avg.toFixed(1)} <span>· ${rating.count} баҳо</span>` : `★ <span>Ҳоло баҳо нест</span>`}</p>
      <p class="job-pop-pay">${esc(payLabel(job))}</p>
      <p class="job-pop-when">${esc(formatDate(job.date))} · ${esc(job.timeStart)}–${esc(job.timeEnd)}</p>
      <p class="job-pop-desc">${esc(job.description)}</p>
      <div class="job-pop-note"><strong>Пул дар ҳисоби махсус</strong> то иҷрои кор мемонад. Комиссия аз корфармо гирифта мешавад.</div>
      ${mine ? `<p class="job-pop-mine">Аризаи шумо: ${esc(APP_STATUS[mine.status] || "")}</p>` : ""}
      <div class="job-pop-reviews">${reviewBlock(state, job.employerId)}</div>
      <div class="job-pop-actions">
        <button type="button" class="job-act is-main" data-action="apply" data-id="${esc(job.id)}" ${locked ? "disabled" : ""}>${mine ? "Дархост фиристода шуд" : "Ариза додан"}</button>
        <button type="button" class="job-act is-gold" data-action="propose" data-id="${esc(job.id)}" ${locked ? "disabled" : ""}>Пешниҳод фиристодан</button>
        <button type="button" class="job-act" data-action="save" data-id="${esc(job.id)}">Захира</button>
        <button type="button" class="job-act" data-action="report" data-kind="job" data-id="${esc(job.id)}">Гузориши кор</button>
        <button type="button" class="job-act" data-action="report" data-kind="user" data-id="${esc(job.employerId)}">Гузориши корфармо</button>
        <button type="button" class="job-act" data-action="close">Пӯшидан</button>
      </div>
    </div>
  </div>`;
}

function reportModal(state) {
  const ctx = state.reportCtx;
  const job = ctx?.kind === "job" ? state.data.jobs.find((item) => item.id === ctx.id) : null;
  const person = ctx?.kind === "user" ? state.data.users.find((item) => item.id === ctx.id) : null;
  const who = job?.title || person?.company || person?.name || "";
  const body = `<form id="report-form" class="grid gap-3">
    <p class="text-sm text-ink/70">${esc(who)}</p>
    <label class="grid gap-1 text-sm font-bold">Сабаб<textarea id="report-note" class="field min-h-28" name="reason" placeholder="Чӣ мушкил дидед?"></textarea></label>
    ${state.reportError ? `<p class="auth-error" role="alert">${esc(state.reportError)}</p>` : ""}
    <button class="btn btn-primary" type="submit">Фиристодани гузориш</button>
  </form>`;
  return modalShell(ctx?.kind === "job" ? "Гузориши кор" : "Гузориши корбар", "Гузориш дар саҳифаи бехатарӣ мемонад.", body);
}

function gate(title, text) {
  return `<div class="page page-gate"><h1 class="text-2xl font-extrabold">${title}</h1><p class="mt-2 text-sm text-ink/65">${text}</p><button type="button" class="btn btn-primary mt-4" data-action="open" data-modal="login">Воридшавӣ</button></div>`;
}

function safety(state) {
  const user = currentUser();
  const reports = user ? state.data.reports.filter((item) => item.fromId === user.id) : [];
  const cards = [
    ["✓", "Корфармои тасдиқшуда", "Нишон дар эълон ва кабинет мемонад. Корфармо онро аз кабинети худ фаъол мекунад.", "Тасдиқ кардан", "employerDash"],
    ["✓", "Донишҷӯи тасдиқшуда", "Рақами донишҷӯӣ санҷида мешавад. Намуна: ДМТ-2024-1842.", "Тасдиқ кардан", "studentDash"],
    ["🛡", "Ҳифзи пардохт", "Ҳангоми қабул маблағ дар ҳисоби махсус сабт мешавад ва баъд аз пахши тугмаи «Кор анҷом ёфт» озод мегардад.", "Дидани корҳо", "jobs"],
    ["🚨", "Гузориши кор", "Эълонро кушоед ва тугмаи «Гузориши кор»-ро пахш кунед.", "Кушодани корҳо", "jobs"],
    ["🚨", "Гузориши корбар", "Дар эълони кор тугмаи «Гузориши корфармо»-ро пахш кунед.", "Кушодани корҳо", "jobs"],
  ];
  const mine = reports.length
    ? `<ul class="review-list">${reports.map((item) => `<li><strong>${item.kind === "job" ? "Кор" : "Корбар"}</strong><p>${esc(item.reason)}</p></li>`).join("")}</ul>`
    : EmptyState({ title: "Ҳоло гузориш нест.", text: "Агар эълон ё корбар шубҳанок бошад, аз корт ё профил гузориш диҳед.", action: "Ба рӯйхати корҳо", view: "jobs" });
  return `<div class="page page-safety">
    <p class="text-xs font-extrabold tracking-wider text-pine">ЭЪТИМОД</p>
    <h1 class="mt-2 text-3xl font-extrabold">Бехатарӣ ва ҳифзи пардохт</h1>
    <p class="mt-2 max-w-2xl text-sm leading-relaxed text-ink/65">Пул то анҷоми кор дар ҳисоби махсус мемонад. Корфармо ва донишҷӯи тасдиқшуда бо нишон дида мешаванд.</p>
    <div class="safety-grid">${cards.map(([mark, title, text, label, view]) => `<article class="trust-card"><span class="trust-ico" aria-hidden="true">${mark}</span><h2>${title}</h2><p>${text}</p><button type="button" class="trust-go" data-action="go" data-view="${view}">${label}</button></article>`).join("")}</div>
    <section class="mt-5 rounded-[1.6rem] border border-line bg-paper p-5"><h2 class="text-lg font-extrabold">Гузоришҳои ман</h2>${mine}</section>
    ${user?.role === "admin" ? `<section class="mt-5 rounded-[1.6rem] border border-line bg-paper p-5"><h2 class="text-lg font-extrabold">Ҳамаи гузоришҳо</h2>${state.data.reports.length ? `<ul class="review-list">${state.data.reports.map((item) => `<li><strong>${item.kind === "job" ? "Кор" : "Корбар"}</strong><p>${esc(item.reason)}</p></li>`).join("")}</ul>` : `<p class="text-sm">Гузориш нест.</p>`}</section>` : ""}
  </div>`;
}

function inbox(state) {
  const user = currentUser();
  if (!user) return gate("Паёмҳо", "Барои сӯҳбат бо ҳисоби худ ворид шавед.");
  const threads = [];
  state.data.applications.forEach((application) => {
    const job = state.data.jobs.find((item) => item.id === application.jobId);
    if (!job) return;
    if (application.studentId !== user.id && job.employerId !== user.id) return;
    const peer = user.role === "student"
      ? state.data.users.find((item) => item.id === job.employerId)
      : state.data.users.find((item) => item.id === application.studentId);
    threads.push({ jobId: job.id, studentId: application.studentId, title: job.title, peer: employerName(peer) });
  });
  if (!threads.length) {
    return `<div class="page"><h1 class="text-3xl font-extrabold">Паёмҳо</h1>${EmptyState({ title: "Ҳоло паёми нав нест.", text: "Паём баъд аз ариза, байни донишҷӯ ва корфармо, кушода мешавад.", action: user.role === "employer" ? "Дидани донишҷӯён" : "Дидани корҳо", view: user.role === "employer" ? "students" : "jobs" })}</div>`;
  }
  const active = state.chatThread && threads.some((item) => item.jobId === state.chatThread.jobId && item.studentId === state.chatThread.studentId) ? state.chatThread : null;
  const messages = active ? state.data.messages.filter((item) => item.jobId === active.jobId && item.studentId === active.studentId) : [];
  const list = threads.map((item) => `<button type="button" class="thread ${active && active.jobId === item.jobId && active.studentId === item.studentId ? "is-on" : ""}" data-action="chat" data-job="${esc(item.jobId)}" data-student="${esc(item.studentId)}"><strong>${esc(item.title)}</strong><span>${esc(item.peer)}</span></button>`).join("");
  const talk = active
    ? `<div class="chat-log" aria-live="polite">${messages.length ? messages.map((item) => `<p class="${item.fromId === user.id ? "mine" : ""}"><span>${esc(item.body)}</span></p>`).join("") : `<p class="chat-empty">Ҳоло паёми нав нест. Аввалин паёмро нависед.</p>`}</div>
      <form id="message-form" class="chat-form"><label class="sr-only" for="message-body">Паём</label><textarea id="message-body" name="body" class="field" placeholder="Паём..."></textarea><button class="btn btn-primary" type="submit">Фиристодан</button></form>${state.chatError ? `<p class="auth-error" role="alert">${esc(state.chatError)}</p>` : ""}`
    : EmptyState({ title: "Суҳбатро интихоб кунед.", text: "Аз рӯйхат кореро кушоед, то паём нависед.", action: "Ба корҳо", view: "jobs" });
  return `<div class="page"><h1 class="text-3xl font-extrabold">Паёмҳо</h1><div class="chat-layout"><div class="thread-list">${list}</div><section class="chat-pane">${talk}</section></div></div>`;
}

function notices(state) {
  const user = currentUser();
  if (!user) return gate("Огоҳиҳо", "Огоҳӣ баъд аз ариза, қабул, пардохт, баҳо ва паём меояд.");
  const items = state.data.notifications.filter((item) => item.userId === user.id);
  const body = items.length
    ? `<ul class="notice-list">${items.map((item) => `<li><p>${esc(item.message)}</p><time>${esc(formatDate(new Date(item.createdAt).toISOString().slice(0, 10)))}</time></li>`).join("")}</ul>`
    : EmptyState({ title: "Ҳоло огоҳии нав нест.", text: "Вақте касе ариза диҳад, шуморо қабул кунад ё баҳо гузорад, он дар ҳамин ҷо меояд.", action: "Дидани корҳо", view: "jobs" });
  return `<div class="page"><p class="text-xs font-extrabold tracking-wider text-pine">ОГОҲӢ</p><h1 class="mt-2 text-3xl font-extrabold">Огоҳиҳо</h1>${body}</div>`;
}

function profileView(user) {
  if (!user) return "settings";
  return user.role === "employer" ? "employerDash" : "studentDash";
}

function sideNav(state) {
  const user = currentUser();
  const count = unreadCount(state);
  const profile = profileView(user);
  const items = [
    ["home", "Асосӣ", "home"],
    ["courses", "Курсҳо", "courses"],
    ["tasks", "Вазифаҳо", "tasks"],
    ["jobs", "Ҷои кор", "tasks"],
    ["notices", count ? `Огоҳиҳо · ${count}` : "Огоҳиҳо", "notices"],
    ["inbox", "Паёмҳо", "tasks"],
    [profile, "Профил", "profile"],
    ["settings", "Танзимот", "profile"],
    ["employers", "Барои корфармо", "tasks"],
    ["students", "Донишҷӯён", "profile"],
    ["rankings", "Рейтингҳо", "courses"],
    ["safety", "Бехатарӣ", "notices"],
  ];
  const links = items.map(([view, label, icon]) => `<button type="button" data-action="go" data-view="${view}" class="${state.view === view ? "is-on" : ""}">${NAV_ICONS[icon] || ""}<span>${label}</span></button>`).join("");
  return `<aside class="side-nav" aria-label="Менюи асосӣ"><button type="button" class="brand-btn side-brand" data-action="go" data-view="home">${logo()}</button><nav>${links}</nav></aside>`;
}

function isPhone() {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches;
}

function splashScreen() {
  const cap = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 10 12 5.5 21.5 10 12 14.5 2.5 10Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M7 12v3.6c0 .7 2.2 2.4 5 2.4s5-1.7 5-2.4V12" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`;
  return `<section class="phone-splash mountain-bg" aria-label="Оғоз">
      <div class="splash-orb" aria-hidden="true"></div>
      <div class="splash-top">
        <div class="splash-glow"><button type="button" class="splash-mark" data-action="splash-next" aria-label="Оғоз намудан">${cap}</button></div>
        <h1>StudentWork<span>.tj</span></h1>
        <p class="splash-en">You study. Our priority.</p>
      </div>
      <div class="splash-foot">
        <p class="splash-quote">Орзуҳои калон<br><span>Ба кӯҳҳои баланд қадам занед...</span></p>
        <button type="button" class="splash-go" data-action="splash-next">Оғоз намудан</button>
      </div>
    </section>`;
}

function onboardScreen(state) {
  const slides = [
    ["Кореро, ки ба ту мувофиқ аст, ёб", "Корҳои соатбайъ дар шаҳри худ, наздик ба дарс."],
    ["Дар вақти холӣ даромад ба даст ор", "Ҷадвали озодро нигоҳ дор ва сменаи мувофиқро интихоб кун."],
    ["Бо корфармоёни боэътимод кор кун", "Маблағ то анҷоми кор дар ҳисоби махсус мемонад."],
  ];
  const index = Math.min(state.phoneSlide || 0, slides.length - 1);
  const [title, text] = slides[index];
  return `<section class="phone-onboard"><p class="kicker">StudentWork.tj</p><h1>${title}</h1><p>${text}</p><div class="phone-dots">${slides.map((_, dot) => `<span class="${dot === index ? "is-on" : ""}"></span>`).join("")}</div><div class="phone-onboard-actions"><button type="button" class="btn btn-line" data-action="onboard-skip">Гузаштан</button><button type="button" class="btn btn-primary" data-action="onboard-next">${index === slides.length - 1 ? "Оғоз" : "Идома"}</button></div></section>`;
}

function loginScreen(state) {
  const draft = state.authDraft;
  const cap = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 10 12 5.5 21.5 10 12 14.5 2.5 10Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M7 12v3.6c0 .7 2.2 2.4 5 2.4s5-1.7 5-2.4V12" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`;
  return `<section class="phone-auth phone-login"><div class="splash-orb" aria-hidden="true"></div><header class="login-bar"><button type="button" data-action="splash-back" aria-label="Бозгашт"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12 5 7 10l5 5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></button><span>Воридшавӣ</span><span></span></header><div class="login-brand"><span class="splash-mark login-mark">${cap}</span><h1>StudentWork<span>.tj</span></h1><p>Хуш омадед! Ба ҳисоби худ ворид шавед</p></div><form id="auth-form" class="auth-form"><label class="auth-field">Рақами телефон ё Email<input id="auth-identity" class="field" name="identity" value="${esc(draft.identity || draft.email)}" placeholder="+992 ё name@studentwork.tj" autocomplete="username"></label><label class="auth-field">Парол<input id="auth-password" class="field" type="password" name="password" value="${esc(draft.password)}" placeholder="Рамз" autocomplete="current-password"></label>${state.authError ? `<p class="auth-error" role="alert">${esc(state.authError)}</p>` : ""}<button class="btn btn-primary auth-submit" type="submit">Ворид шудан</button></form><p class="phone-or">ё</p><div class="phone-social"><button type="button" class="btn btn-line" data-action="social" data-provider="Google">Google</button><button type="button" class="btn btn-line" data-action="social" data-provider="Telegram">Telegram</button></div><button type="button" class="phone-link" data-action="forgot">Паролро фаромӯш кардед?</button><p class="phone-switch">Ҳисоб надоред? <button type="button" data-action="phone-auth" data-stage="register">Сабти ном кунед</button></p>${showDemoAccounts() ? `<div class="auth-demos"><p>Ҳисобҳои намунавӣ</p><button type="button" data-action="demo" data-email="mehrona@studentwork.tj"><strong>Меҳронаи Раҳимова</strong><span>Донишҷӯ</span></button><span class="gate-chip">demo123</span></div>` : ""}</section>`;
}

function registerScreen(state) {
  const draft = state.authDraft;
  const cities = LOCATIONS.map((city) => ({ value: city, label: city }));
  return `<section class="phone-auth"><button type="button" class="phone-back" data-action="phone-auth" data-stage="login">Бозгашт</button><h1>Сабти ном</h1><form id="auth-form" class="auth-form"><input type="hidden" name="role" value="${esc(draft.role)}"><div class="auth-switch auth-role" role="group" aria-label="Намуди ҳисоб"><button type="button" class="${draft.role === "student" ? "is-on" : ""}" data-action="role" data-role="student">🎓 Донишҷӯ</button><button type="button" class="${draft.role === "employer" ? "is-on" : ""}" data-action="role" data-role="employer">🏢 Корфармо</button></div>${draft.role === "student" ? `<label class="auth-field">Ном ва насаб<input id="auth-name" class="field" name="name" value="${esc(draft.name)}" autocomplete="name"></label>` : `<label class="auth-field">Номи ширкат<input id="auth-org" class="field" name="org" value="${esc(draft.org)}" autocomplete="organization"></label>`}<label class="auth-field">Email<input id="auth-email" class="field" name="email" type="email" value="${esc(draft.email)}" autocomplete="email"></label><label class="auth-field">Рақами телефон<input id="auth-phone" class="field" name="phone" type="tel" value="${esc(draft.phone)}" placeholder="+992" autocomplete="tel"></label><label class="auth-field">Парол<input id="auth-password" class="field" type="password" name="password" value="${esc(draft.password)}" autocomplete="new-password"></label><div class="auth-field"><span>Шаҳр</span><input type="hidden" name="city" value="${esc(draft.city)}">${picker(state, { id: "auth-city", label: "", value: draft.city, options: cities, field: true })}</div>${draft.role === "student" ? `<label class="auth-field">Донишгоҳ<input class="field" name="university" value="${esc(draft.university || "")}"></label><div class="auth-field"><span>Маҳоратҳо</span><div class="flex flex-wrap gap-2">${SKILLS.map((skill) => `<button type="button" class="chip" data-on="${(draft.skills || []).includes(skill)}" data-action="auth-skill" data-skill="${esc(skill)}">${esc(skill)}</button>`).join("")}</div></div>` : `<label class="auth-field">Дар бораи ширкат<textarea id="auth-about" class="field min-h-20" name="about">${esc(draft.about || "")}</textarea></label>`}${state.authError ? `<p class="auth-error" role="alert">${esc(state.authError)}</p>` : ""}<button class="btn btn-primary auth-submit" type="submit">Сабти ном</button></form></section>`;
}

function mobileHome(state) {
  const jobs = sortJobs(filterJobs(state.data.jobs, state.data.users, { q: "", location: "Ҳама шаҳрҳо", category: "Ҳама" }), "vip").slice(0, 6);
  return `<div class="page phone-home">${phoneBar(state)}<section class="phone-lead"><h1>Фурсати кори барои донишҷӯён</h1><p>Дар рӯзҳои холӣ кор ёбед ё корро ба донишҷӯ супоред.</p>${leadSearch(state, "search-form")}${leadChips(state)}${leadBlocks()}</section>${homeFeed(state)}<section><div class="phone-section-head"><h2>Корҳои мувофиқ барои ту</h2><button type="button" data-action="go" data-view="jobs">Ҳама</button></div><div class="job-board">${jobs.map((job) => jobCard(job, state)).join("")}</div></section>${homeFooter()}</div>`;
}

function bottomNav(state) {
  if (isPhone()) {
    const user = currentUser();
    const profile = user?.role === "employer" ? "employerDash" : "studentDash";
    const count = unreadCount(state);
    const items = [
      ["home", "Асосӣ", "🏠", state.view === "home" && !state.phoneStage],
      ["jobs", "Ҷустуҷӯ", "🔎", state.view === "jobs"],
      ["tasks", "Корҳо", "💼", state.view === "tasks"],
      ["notices", count ? `Огоҳӣ ${count}` : "Огоҳӣ", "🔔", state.view === "notices"],
      [profile, "Профил", "👤", state.view === profile],
    ];
    return `<nav class="bottom-nav phone-tabbar" aria-label="Мобилӣ">${items.map(([view, label, icon, on]) => {
      const guestProfile = !user && view === profile;
      const attrs = guestProfile ? `data-action="phone-auth" data-stage="login"` : `data-action="go" data-view="${view}"`;
      return `<button type="button" ${attrs} ${on ? 'aria-current="page"' : ""}><span aria-hidden="true">${icon}</span>${label}</button>`;
    }).join("")}</nav>`;
  }
  const user = currentUser();
  const dash = user?.role === "employer" ? "employerDash" : "studentDash";
  const count = unreadCount(state);
  const items = [
    ["jobs", "Корҳо"],
    ["inbox", "Паём"],
    ["notices", count ? `Огоҳӣ ${count}` : "Огоҳӣ"],
    ["rankings", "Рейтинг"],
  ];
  const links = items.map(([view, label]) => `<button type="button" data-action="go" data-view="${view}" ${state.view === view ? 'aria-current="page"' : ""}>${label}</button>`).join("");
  const last = user
    ? `<button type="button" data-action="go" data-view="${dash}" ${state.view === dash ? 'aria-current="page"' : ""}>Кабинет</button>`
    : `<button type="button" data-action="open" data-modal="login">Ворид</button>`;
  return `<nav class="bottom-nav" aria-label="Мобилӣ">${links}${last}</nav>`;
}

function bootShell(state) {
  if (state.view === "jobs") return `<div class="page page-jobs" aria-hidden="true"><div class="jobs-wrap"><div class="jobs-grid">${[1, 2, 3, 4, 5, 6].map(() => `<article class="board-skel"></article>`).join("")}</div></div></div>`;
  if (state.view === "rankings") return SkeletonLoader("leaderboard");
  if (state.view === "notices") return SkeletonLoader("notices");
  if (state.view === "students" || state.view === "studentDash") return SkeletonLoader("profile");
  if (state.view === "employerDash" || state.view === "inbox" || state.view === "safety") return SkeletonLoader("dashboard");
  return SkeletonLoader("cards");
}

function cityModal(state) {
  const picked = state.cityPick || [];
  const query = (state.cityQuery || "").trim().toLowerCase();
  const cities = LOCATIONS.filter((city) => !query || city.toLowerCase().includes(query));
  const count = state.data.jobs.filter((job) => job.status !== "done" && (!picked.length || picked.includes(job.location))).length;
  const list = cities.length
    ? cities.map((city) => `<label class="city-check" data-action="city-toggle" data-city="${esc(city)}"><input type="checkbox" ${picked.includes(city) ? "checked" : ""}><span>${esc(city)}</span></label>`).join("")
    : `<p class="city-empty">Шаҳр ёфт нашуд.</p>`;
  const body = `<label class="city-find"><span class="sr-only">Ҷустуҷӯи шаҳр</span><input id="city-query" class="field" value="${esc(state.cityQuery || "")}" placeholder="Номро нависед" autocomplete="off"></label>
    <button type="button" class="city-all ${picked.length ? "" : "is-on"}" data-action="city-all">Ҳамаи шаҳрҳо</button>
    <div class="city-grid">${list}</div>
    <button type="button" class="city-apply" data-action="city-apply">Татбиқи макон — ${count}</button>`;
  return modalShell("Шаҳрро интихоб кунед", "", body, "city-sheet");
}

function savedModal(state) {
  const user = currentUser();
  if (!user) return "";
  const saved = (state.data.savedJobs || []).filter((item) => item.userId === user.id);
  const jobs = saved.map((item) => state.data.jobs.find((job) => job.id === item.jobId)).filter(Boolean);
  const body = jobs.length
    ? `<div class="job-board">${jobs.map((job) => jobCard(job, state)).join("")}</div>`
    : `<p class="city-empty">Ҳоло ягон кори захирашуда нест. Корро аз равзанаи кор захира кунед.</p>`;
  return modalShell("Корҳои захирашуда", "Корҳое, ки бо дилчашм нигоҳ доштед.", body);
}

function modal(state) {
  if (state.modal === "cities") return cityModal(state);
  if (state.modal === "saved") return savedModal(state);
  if (state.modal === "login" || state.modal === "signup") return authModal(state);
  if (state.modal === "publish") return publishModal(state);
  if (state.modal === "apply") return applyModal(state);
  if (state.modal === "proposal") return proposalModal(state);
  if (state.modal === "rate") return rateModal(state);
  if (state.modal === "job") return jobModal(state);
  if (state.modal === "report") return reportModal(state);
  if (state.modal === "achievement") return achievementModal(state);
  return "";
}

const PAGES = { home, jobs, find: findPage, post: postPage, solve: solvePage, courses, tasks, employers, students: studentsPage, rankings, studentDash, employerDash, safety, inbox, notices, settings };

export function appHtml(state) {
  const toast = state.toast ? `<div class="toast" role="status"><span class="toast-mark" aria-hidden="true">✓</span><span>${esc(state.toast.message)}</span></div>` : "";
  if (isPhone() && state.phoneStage === "splash") return splashScreen();
  if (isPhone() && state.phoneStage === "onboard") return `${onboardScreen(state)}${toast}`;
  if (isPhone() && !currentUser() && (state.phoneStage === "login" || state.phoneStage === "register")) {
    const screen = state.phoneStage === "register" ? registerScreen(state) : loginScreen(state);
    return `<main id="main">${screen}</main>${bottomNav(state)}${toast}`;
  }
  const pageName = PAGES[state.view] || home;
  const page = state.booting ? bootShell(state) : pageName(state);
  return `<div class="app-frame">${header(state)}${sideDrawer(state)}<div class="app-column"><main id="main">${page}</main>${footer()}</div></div>${bottomNav(state)}${modal(state)}${toast}`;
}

const SIDE_ICONS = {
  home: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>`,
  jobs: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 7V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" fill="none" stroke="currentColor" stroke-width="1.7"/><rect x="4" y="7" width="16" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>`,
  employers: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V8l8-4 8 4v12" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M9 20v-5h6v5" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>`,
  students: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="9" r="2.4" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="16" cy="10" r="2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M4.5 18.5c.8-2.2 2.6-3.3 4.5-3.3s3.7 1.1 4.5 3.3M14 15.4c1.3-.2 2.6.3 3.6 1.6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  rankings: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 20V10M12 20V4M17 20v-6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  safety: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v6c0 4.2 2.8 7.2 7 8.5 4.2-1.3 7-4.3 7-8.5V6l-7-3Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>`,
  tasks: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h11M8 12h11M8 18h11" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="m4.5 6.2 1 1 1.8-2M4.5 12.2l1 1 1.8-2M4.5 18.2l1 1 1.8-2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  courses: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7.5 12 4l9 3.5L12 11 3 7.5Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M7 9.2v4.2c0 .4 2.2 2.1 5 2.1s5-1.7 5-2.1V9.2" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>`,
  inbox: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16v10H4V7Z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="m4 8 8 6 8-6" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>`,
  notices: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.2 1.5H4.8L6 16.5Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M10 19a2 2 0 0 0 4 0" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>`,
  categories: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.7"/><rect x="13" y="4" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.7"/><rect x="4" y="13" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.7"/><rect x="13" y="13" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>`,
  saved: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19.2 5.4 12.8a4 4 0 0 1 5.6-5.7L12 8.1l1-1a4 4 0 0 1 5.6 5.7L12 19.2Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>`,
};

function sideDrawer(state) {
  const user = currentUser();
  const dash = user?.role === "employer" ? "employerDash" : "studentDash";
  const links = [
    ["home", "Асосӣ"],
    ["jobs", "Корҳо"],
    ["tasks", "Вазифаҳо"],
    ["courses", "Курсҳо"],
    ["safety", "Дастурҳо"],
    ["inbox", "Тамос"],
    ["notices", "Огоҳӣ"],
    ["employers", "Барои корфармо"],
    ["students", "Донишҷӯён"],
    ["rankings", "Рейтингҳо"],
  ];
  const openJobs = state.data.jobs.filter((job) => job.status !== "done").length;
  const notes = unreadCount(state);
  const roll = (n) => `<span class="side-count">${n}</span>`;
  const catsOpen = state.picker === "filters";
  const cats = CATEGORIES.map((item) => `<button type="button" class="chip" data-on="${item === state.filters.category}" data-action="filter-set" data-key="category" data-value="${esc(item)}">${esc(item === "Ҳама" ? "Ҳама категорияҳо" : item)}</button>`).join("");
  const extra = user
    ? `<button type="button" class="side-link" style="--i:13" data-action="go" data-view="${dash}"><span class="side-ico">${SIDE_ICONS.home}</span><span>Кабинет</span></button><div class="side-profile">${avatar(user.name, user.hue, "sm")}<div class="side-who"><strong>${esc(user.name)}</strong><button type="button" class="side-out" data-action="logout">Баромадан</button></div></div>`
    : `<button type="button" class="side-go" data-action="open" data-modal="login"><span>Ворид шудан</span></button><button type="button" class="side-line" data-action="open" data-modal="signup">Бақайдгирӣ</button>`;
  return `<button type="button" class="side-scrim" data-action="menu" tabindex="-1" aria-label="Пӯшидан"></button>
    <aside class="side-panel" aria-hidden="${state.menuOpen ? "false" : "true"}">
      <p class="side-kicker">Бахшҳо</p>
      <nav aria-label="Бахшҳо">${links.map(([id, label], index) => `<button type="button" class="side-link ${state.view === id ? "is-on" : ""}" style="--i:${index}" data-action="go" data-view="${id}"><span class="side-ico">${SIDE_ICONS[id]}</span><span>${label}</span>${id === "jobs" ? roll(openJobs) : ""}${id === "notices" && notes ? roll(notes) : ""}</button>`).join("")}<button type="button" class="side-link" style="--i:10" data-action="saved"><span class="side-ico">${SIDE_ICONS.saved}</span><span>Захира</span></button><button type="button" class="side-link ${catsOpen ? "is-on" : ""}" style="--i:11" data-action="picker" data-picker="filters" aria-expanded="${catsOpen}"><span class="side-ico">${SIDE_ICONS.categories}</span><span>Категорияҳо</span></button>${catsOpen ? `<div class="side-cats">${cats}</div>` : ""}</nav>
      <div class="side-extra">${extra}</div>
    </aside>`;
}

export function cvDownloadName(user, state) {
  const rating = avgRating(state.data.ratings, user.id);
  const lines = summarizeAvailability(user.availability);
  const portfolio = portfolioFor(user, state.data.applications, state.data.jobs);
  const work = portfolio.length ? portfolio.map((item) => `<li>${esc(item.title)} — ${esc(item.pay)} — ${esc(formatDate(item.date))}</li>`).join("") : "<li>—</li>";
  return `<!doctype html><html lang="tg"><meta charset="utf-8"><title>CV ${esc(user.name)}</title><body style="font-family:Segoe UI,sans-serif;background:#f8fafc;padding:32px;color:#0f172a"><article style="max-width:720px;margin:auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden"><header style="background:#064e3b;color:#f8fafc;padding:28px"><p>STUDENTWORK.TJ</p><h1>${esc(user.name)}</h1><p>${esc(levelFor(user.experience).name)} · ${esc(user.city)}</p></header><div style="padding:28px"><p><b>Донишгоҳ:</b> ${esc(user.university || "—")}</p><p><b>Маҳоратҳо:</b> ${esc(user.skills.join(", ") || "—")}</p><p><b>Баҳо:</b> ${rating.count ? rating.avg.toFixed(1) : "Нав"} · <b>Таҷриба:</b> ${user.experience || 0}</p><h2>Ҷадвал</h2><ul>${lines.map((line) => `<li>${esc(line)}</li>`).join("") || "<li>—</li>"}</ul><h2>Корҳо</h2><ul>${work}</ul><p>${esc(user.bio || "")}</p></div></article></body></html>`;
}
