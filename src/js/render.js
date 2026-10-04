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
  JOB_CATEGORIES,
  levelFor,
  LOCATIONS,
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
import { EmptyState, SkeletonLoader, TransactionList } from "./components/ui.js";
import { currentUser } from "./store.js";

const STATUS = { open: "Кушода", filled: "Пур шуд", done: "Анҷом ёфт" };
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

function picker(state, { id, label, value, options, compact = false, field = false }) {
  const open = state.picker === id;
  const current = options.find((item) => item.value === value) || options[0];
  return `<div class="picker ${compact ? "picker-compact" : ""} ${field ? "picker-field" : ""} ${open ? "is-open" : ""}">
    <button type="button" class="picker-btn" data-action="picker" data-picker="${esc(id)}" aria-expanded="${open}" aria-haspopup="listbox">
      ${field ? "" : `<span class="picker-icon">${PIN}</span>`}
      <span class="min-w-0">${label ? `<span class="picker-label">${esc(label)}</span>` : ""}<span class="picker-value">${esc(current?.label || "")}</span></span>
      ${CHEVRON}
    </button>
    ${open ? `<ul class="picker-menu" role="listbox">${options.map((item) => `<li><button type="button" role="option" aria-selected="${item.value === value}" class="picker-option ${item.value === value ? "is-on" : ""}" data-action="pick" data-picker="${esc(id)}" data-value="${esc(item.value)}"><span>${esc(item.label)}</span>${item.value === value ? "<span aria-hidden='true'>✓</span>" : ""}</button></li>`).join("")}</ul>` : ""}
  </div>`;
}

function choices(id, options, value) {
  return `<div class="flex flex-wrap gap-2">${options.map((item) => `<button type="button" class="chip" data-on="${item.value === value}" data-action="pick" data-picker="${esc(id)}" data-value="${esc(item.value)}">${esc(item.label)}</button>`).join("")}</div>`;
}

function jobCard(job, state) {
  const employer = state.data.users.find((user) => user.id === job.employerId);
  const rating = avgRating(state.data.ratings, job.employerId);
  const me = currentUser();
  const saved = (state.data.savedJobs || []).some((item) => item.userId === me?.id && item.jobId === job.id);
  const flags = [job.vip ? "is-vip" : "", state.freshJobId === job.id ? "is-fresh" : ""].filter(Boolean).join(" ");
  return `<article class="job-card ${flags}">
    <div class="job-tags">
      <span class="job-tag">${esc(job.category)}</span>
      ${job.vip ? `<span class="job-tag job-tag-vip">VIP</span>` : ""}
      ${job.rush ? `<span class="job-tag job-tag-rush">Фаврӣ</span>` : ""}
      <span class="job-status">${STATUS[job.status] || ""}</span>
    </div>
    <button type="button" class="job-title-btn" data-action="open-job" data-id="${esc(job.id)}"><h3 class="job-title">${esc(job.title)}</h3></button>
    <div class="job-employer"><p>${esc(employerName(employer))}</p>${employer?.verified ? verified("Verified") : ""}</div>
    <div class="job-stars">${stars(rating.avg, rating.count)}</div>
    <p class="wage-pill">${esc(payLabel(job))}</p>
    <p class="job-when">${esc(formatDate(job.date))} · ${esc(job.timeStart)}–${esc(job.timeEnd)}</p>
    <p class="job-place">${esc(job.location)}</p>
    <p class="job-copy">${esc(job.description)}</p>
    <p class="job-escrow">Пул дар ҳисоби махсус нигоҳ дошта мешавад</p>
    <div class="job-actions">
      <button type="button" class="btn btn-line job-save" data-action="save" data-id="${esc(job.id)}" aria-pressed="${saved}">${saved ? "Захира шуд" : "Захира"}</button>
      <button type="button" class="btn btn-primary job-apply" data-action="apply" data-id="${esc(job.id)}" ${job.status !== "open" ? "disabled" : ""}>${job.status === "open" ? "Ариза додан" : "Ҷой дастрас нест"}</button>
    </div>
  </article>`;
}

function statsBanner() {
  const items = [
    ["1200+", "Донишҷӯён"],
    ["350+", "Корҳои иҷрошуда"],
    ["50+", "Корфармоён"],
    ["98%", "Қаноатмандӣ"],
  ];
  return `<div class="stats-row">${items.map(([value, label]) => `<article class="stat-card"><strong>${value}</strong><span>${label}</span></article>`).join("")}</div>`;
}

function searchBar(state) {
  const f = state.filters;
  const cities = [{ value: "Ҳамаи шаҳрҳо", label: "Ҳамаи шаҳрҳо" }, ...LOCATIONS.map((city) => ({ value: city, label: city }))];
  return `<form id="search-form" class="search-dock grid items-center gap-2 md:grid-cols-[1.4fr_0.9fr_auto]">
    <input type="hidden" name="location" value="${esc(f.location)}">
    <input type="hidden" name="category" value="${esc(f.category)}">
    <label class="grid gap-1 px-3 py-1"><span class="text-[11px] font-extrabold tracking-wide text-slate-400">КАЛИМА</span>
      <input id="search-q" class="bg-transparent pb-1 text-sm font-semibold outline-none" name="q" value="${esc(f.q)}" placeholder="Пешхизмат, тарҷума, SMM..." aria-label="Калимаи ҷустуҷӯ"></label>
    ${picker(state, { id: "location", label: "ШАҲР", value: f.location, options: cities })}
    <button class="btn btn-primary h-full min-h-12 px-6" type="submit">Ҷустуҷӯ</button>
  </form>`;
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

function profilePreview(student, state) {
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
    <p class="mt-4 text-xs font-bold tracking-wide text-cream/60">ҶАДВАЛИ ОЗОД</p>
    <div class="week-strip" aria-label="Соатҳои озоди ҳафта">${hours}</div>
    <p class="mt-4 rounded-2xl bg-white/10 px-3 py-3 text-sm leading-snug"><span class="mr-2 rounded-full bg-gold px-2 py-0.5 text-[10px] font-extrabold text-ink">CV</span>${esc(cv)}</p>
    <div class="mt-3 flex flex-wrap gap-1.5">${(student.skills || []).map((skill) => `<span class="rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold">${esc(skill)}</span>`).join("")}</div>
    ${currentUser()?.id === student.id ? "" : `<button type="button" class="btn mt-4 bg-white text-ink" data-action="report" data-kind="user" data-id="${esc(student.id)}">Гузориши корбар</button>`}
  </article>`;
}

function home(state) {
  const jobs = sortJobs(filterJobs(state.data.jobs, state.data.users, { q: "", location: "Ҳама шаҳрҳо", category: "Ҳама" }), "vip").slice(0, 6);
  const students = state.data.users.filter((user) => user.role === "student");
  const toEmployer = directionAverage(state.data.ratings, "student-to-employer");
  const toStudent = directionAverage(state.data.ratings, "employer-to-student");
  const leaders = students
    .map((student) => ({ student, rating: avgRating(state.data.ratings, student.id) }))
    .sort((a, b) => b.rating.avg - a.rating.avg || b.student.experience - a.student.experience)
    .slice(0, 3);
  const lead = leaders[0];
  const spotlight = state.data.users.find((user) => user.id === "s1") || lead?.student;
  return `<div class="page page-home"><section class="hero">
      <div class="hero-orb" aria-hidden="true"></div>
      <div class="hero-copy">
        <p class="kicker">Платформаи микрокорҳо · Тоҷикистон</p>
        <h1 class="hero-title">Кори соатбайъ ва чандир барои донишҷӯён дар Тоҷикистон</h1>
        <p class="hero-lead">Дарсҳоятонро нигоҳ доред ва дар соатҳои озод кор кунед: пешхизмат, тарҷума, дизайн, доставка ва ёрдам дар офис.</p>
        <div class="mt-6">${searchBar(state)}</div>
        ${statsBanner()}
        <div class="mt-4">${escrow()}</div>
      </div>
      <aside class="hero-side">
        ${profilePreview(spotlight, state)}
        <div class="grid gap-2">${jobs.slice(0, 2).map((job) => `<button type="button" data-action="jump-job" data-location="${esc(job.location)}" data-category="${esc(job.category)}" class="panel px-4 py-3 text-left"><span class="text-xs font-bold text-pine">${job.vip ? "VIP · " : ""}${esc(job.category)}</span><span class="mt-0.5 block font-extrabold">${esc(job.title)}</span><span class="text-sm text-ink/60">${esc(job.location)} · ${esc(payLabel(job))}</span></button>`).join("")}</div>
      </aside>
    </section>
    <section>${pills("Ҳама", "category-go")}</section>
    <section>
      <div class="mb-4 flex items-end justify-between gap-3"><div><p class="text-xs font-extrabold tracking-wider text-pine">РӮЙХАТИ ФАЪОЛ</p><h2 class="text-2xl font-extrabold">Корҳои нав</h2></div><button type="button" class="btn btn-line" data-action="go" data-view="jobs">Ҳамаи корҳо</button></div>
      <div class="job-board">${jobs.map((job) => jobCard(job, state)).join("")}</div>
    </section>
    <section class="step-grid">
      ${[["01", "Ҷадвалро кушоед", "Соатҳои озодро, масалан душанбе 14:00–18:00, қайд кунед."], ["02", "Ариза диҳед", "Кори наздик ба донишгоҳ ва маҳорататонро интихоб кунед."], ["03", "Баъд аз кор баҳо диҳед", "Ҳам донишҷӯ ва ҳам корфармо ба ҳамдигар ситора медиҳанд."]].map(([step, title, text]) => `<article class="step-card"><p class="step-num">${step}</p><h3>${title}</h3><p>${text}</p></article>`).join("")}
    </section>
    <section class="split-grid">
      <article class="rounded-[1.8rem] bg-pine p-6 text-cream"><p class="text-xs font-extrabold tracking-wider text-gold">КАФОЛАТИ ПАРДОХТ</p><h2 class="mt-2 text-2xl font-extrabold">Эътимод пеш аз смена</h2><div class="mt-4">${escrow(true)}</div><p class="mt-3 text-sm leading-relaxed text-cream/75">Корфармо маблағро ҳангоми қабули донишҷӯ қулф мекунад. Пас аз тугмаи «Кор анҷом ёфт» пардохт озод мешавад.</p></article>
      <article class="rounded-[1.8rem] border border-line bg-paper p-6"><p class="text-xs font-extrabold tracking-wider text-pine">БАҲОИ ДУТАРАФА</p><h2 class="mt-2 text-2xl font-extrabold">Ҳар ду тараф ситора мегузоранд</h2>
        <div class="mt-4 grid gap-3 sm:grid-cols-2"><div class="rounded-2xl bg-cream p-4"><p class="text-xs font-bold text-ink/50">Донишҷӯ → корфармо</p><p class="mt-1 text-2xl font-extrabold">${toEmployer.count ? toEmployer.avg.toFixed(1) : "—"} ★</p></div><div class="rounded-2xl bg-cream p-4"><p class="text-xs font-bold text-ink/50">Корфармо → донишҷӯ</p><p class="mt-1 text-2xl font-extrabold">${toStudent.count ? toStudent.avg.toFixed(1) : "—"} ★</p></div></div>
      </article>
    </section>
    <section>
      <article class="panel p-5 sm:p-6">
        <div class="mb-4 flex items-end justify-between gap-3"><div><p class="kicker">Рейтинг</p><h2 class="mt-1 text-2xl font-extrabold tracking-tight">Беҳтарин донишҷӯёни ҳафта</h2></div><button type="button" class="text-sm font-bold text-pine" data-action="go" data-view="rankings">Ҳама рейтингҳо</button></div>
        <ol class="grid gap-2">${leaders.map(({ student, rating }, index) => `<li class="flex items-center gap-3 rounded-2xl border border-line bg-white px-3 py-3"><span class="grid h-9 w-9 place-items-center rounded-xl text-sm font-extrabold ${index === 0 ? "bg-indigo text-white" : "bg-mist text-pine"}">${index + 1}</span>${avatar(student.name, student.hue)}<div class="min-w-0 flex-1"><p class="truncate font-extrabold">${esc(student.name)}</p><p class="truncate text-xs text-slate-500">${esc(student.university)} · ${esc(levelFor(student.experience).name)}</p></div><div class="text-right"><p class="rounded-full bg-mist px-2.5 py-1 text-sm font-extrabold text-pine">${esc(formatStars(rating.avg, rating.count))}</p><p class="mt-1 text-[11px] font-bold text-slate-400">${student.experience || 0} кор</p></div></li>`).join("")}</ol>
      </article>
    </section>
    <section><div class="employer-cta flex flex-col items-start justify-between gap-4 rounded-[2rem] px-6 py-8 md:flex-row md:items-center"><div><p class="text-xs font-extrabold tracking-wider text-gold">БАРОИ КОРФАРМО</p><h2 class="mt-2 text-2xl font-extrabold">Сменаи имрӯзаро дар чанд дақиқа пур кунед</h2><p class="mt-2 max-w-xl text-sm text-cream/70">Комиссия 5–10%. Эълони VIP дар болои рӯйхат меистад.</p></div><div class="flex flex-wrap gap-2"><button type="button" class="btn btn-gold" data-action="publish">Эълон гузоштан</button><button type="button" class="btn btn-ink" data-action="open" data-modal="signup">Бақайдгирӣ</button></div></div></section></div>`;
}

function jobs(state) {
  const list = sortJobs(filterJobs(state.data.jobs, state.data.users, state.filters), state.sort);
  return `<div class="page">
    <p class="text-xs font-extrabold tracking-wider text-pine">ҶОИ КОР</p>
    <h1 class="mt-2 text-3xl font-extrabold">Корҳои соатбайъ ва микрокорҳо</h1>
    <p class="mt-2 max-w-2xl text-sm leading-relaxed text-ink/65">Эълонҳои VIP дар боло меистанд. Маблағ то анҷоми кор дар ҳисоби махсус мемонад.</p>
    <div class="mt-5">${searchBar(state)}</div>
    ${statsBanner()}
    <div class="mt-4">${pills(state.filters.category, "category")}</div>
    <div class="picker-row relative mt-4 flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm font-bold text-slate-500">${list.length} кор ёфт шуд</p>
      ${picker(state, { id: "sort", label: "МУРАТТАБ", value: state.sort, options: SORTS, compact: true })}
    </div>
    ${list.length ? `<div class="job-board">${list.map((job) => jobCard(job, state)).join("")}</div>` : EmptyState({ title: "Кори мувофиқ ёфт нашуд", text: "Шаҳр, категория ё калимаро васеътар кунед.", action: "Тоза кардани филтр", act: "clear-filters" })}
  </div>`;
}

function employers(state) {
  const user = currentUser();
  return `<div class="page">
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
    <div class="employer-map">${studentMap(state)}</div>
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
    <div class="student-layout">
      ${profilePreview(sample, state)}
      <div class="student-cards">
        <article class="rounded-[1.6rem] border border-line bg-paper p-5"><h2 class="text-lg font-extrabold">Нишони тасдиқ</h2><p class="mt-2 text-sm text-ink/70">Рақами донишҷӯиро ворид кунед ва нишони «Донишҷӯи тасдиқшуда» гиред.</p><div class="mt-3">${verified("Донишҷӯи тасдиқшуда")}</div></article>
        <article class="rounded-[1.6rem] border border-line bg-paper p-5"><h2 class="text-lg font-extrabold">Сатҳ ва ситора</h2><p class="mt-2 text-sm text-ink/70">Ҳар кори анҷомёфта таҷрибаро зиёд мекунад. Баҳои корфармо дар рейтинг мемонад.</p><div class="mt-3 flex flex-wrap gap-2">${levelPill("Новичок")}${levelPill("Фаъол")}${levelPill("ПРО-Донишҷӯ")}<span class="rounded-full bg-gold px-2.5 py-1 text-xs font-extrabold">5.0 ★</span></div></article>
      </div>
    </div>
    <article class="mt-5 rounded-[1.6rem] border border-line bg-paper p-5"><h2 class="text-lg font-extrabold">Маҳоратҳо ва портфел</h2><div class="mt-3 flex flex-wrap gap-2">${SKILLS.map((skill) => `<span class="chip" data-on="true">${esc(skill)}</span>`).join("")}</div><p class="mt-3 text-sm text-ink/65">Корҳои иҷрошуда мустақиман ба резюме илова мешаванд: ном, маблағ, шаҳр ва сана.</p></article>
    <section class="mt-5 rounded-[1.8rem] border border-line bg-paper p-5"><h2 class="text-lg font-extrabold">Намунаи ҷадвал</h2><p class="mt-1 text-sm text-ink/60">${esc(sample?.name || "")}: соатҳои озод, аз ҷумла Душанбе баъд аз дарс.</p>${sample ? schedule(sample.availability, true) : ""}</section>
    <div class="mt-8 flex flex-wrap gap-2">${user?.role === "student" ? `<button type="button" class="btn btn-primary" data-action="go" data-view="studentDash">Кабинети ман</button>` : `<button type="button" class="btn btn-primary" data-action="open" data-modal="signup">Бақайдгирӣ ҳамчун донишҷӯ</button>`}<button type="button" class="btn btn-line" data-action="go" data-view="jobs">Ҷустуҷӯи кор</button></div>
  </div>`;
}

function rankings(state) {
  const toEmployer = directionAverage(state.data.ratings, "student-to-employer");
  const toStudent = directionAverage(state.data.ratings, "employer-to-student");
  const rows = state.data.users
    .filter((user) => user.role === "student" && (state.rankCity === "Ҳама" || user.city === state.rankCity))
    .map((student) => ({ student, rating: avgRating(state.data.ratings, student.id) }))
    .sort((a, b) => b.rating.avg - a.rating.avg || b.rating.count - a.rating.count || b.student.experience - a.student.experience);
  return `<div class="page">
    <p class="text-xs font-extrabold tracking-wider text-pine">РЕЙТИНГҲО</p>
    <h1 class="mt-2 text-3xl font-extrabold">Донишҷӯёни беҳтарин</h1>
    <p class="mt-2 max-w-2xl text-sm text-ink/65">Ситораҳо аз баҳоҳои корфармоён меоянд. Донишҷӯ низ ба корфармо баҳо медиҳад.</p>
    <div class="mt-5 grid gap-3 sm:grid-cols-2">
      <article class="rounded-3xl border border-line bg-paper p-4"><p class="text-xs font-bold text-ink/50">Донишҷӯ ба корфармо</p><p class="mt-1 text-3xl font-extrabold">${toEmployer.count ? `${toEmployer.avg.toFixed(1)} ★` : "—"}</p><p class="text-xs text-ink/50">${toEmployer.count} баҳо</p></article>
      <article class="rounded-3xl border border-line bg-paper p-4"><p class="text-xs font-bold text-ink/50">Корфармо ба донишҷӯ</p><p class="mt-1 text-3xl font-extrabold">${toStudent.count ? `${toStudent.avg.toFixed(1)} ★` : "—"}</p><p class="text-xs text-ink/50">${toStudent.count} баҳо</p></article>
    </div>
    <div class="cat-scroll mt-5">${["Ҳама", ...LOCATIONS].map((city) => `<button type="button" class="chip" data-on="${state.rankCity === city}" data-action="rank-city" data-city="${esc(city)}">${esc(city)}</button>`).join("")}</div>
${rows.length ? `    <ol class="mt-5 grid gap-3">${rows.map(({ student, rating }, index) => `<li class="flex flex-wrap items-center gap-3 rounded-[1.4rem] border border-line bg-paper p-4"><span class="grid h-10 w-10 place-items-center rounded-2xl text-sm font-extrabold ${index < 3 ? "bg-gold" : "bg-cream text-ink/60"}">${index + 1}</span>${avatar(student.name, student.hue)}<div class="min-w-[180px] flex-1"><p class="font-extrabold">${esc(student.name)}</p><p class="text-xs text-ink/55">${esc(student.university)} · ${esc(student.city)}</p><p class="mt-1 text-xs text-ink/60">${esc(student.skills.join(" · "))}</p></div><div class="flex flex-wrap items-center gap-2">${levelPill(levelFor(student.experience).name)}${student.verified ? verified("Донишҷӯи тасдиқшуда") : ""}${isFreeToday(student) ? `<span class="rounded-full bg-mist px-2 py-1 text-[11px] font-bold text-pine">Имрӯз ${esc(todayWindow(student))}</span>` : ""}${stars(rating.avg, rating.count)}</div></li>`).join("")}</ol>` : `<div class="empty-state" role="status"><p class="empty-title">Дар ин шаҳр донишҷӯ нест.</p><p>Шаҳри дигарро интихоб кунед.</p><button type="button" class="btn btn-primary" data-action="rank-city" data-city="Ҳама">Ҳамаи шаҳрҳо</button></div>`}
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
  if (!user || user.role !== "employer") {
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
    <div class="mt-5">${studentMap(state)}</div>
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

function unreadCount(state) {
  const id = state.data.sessionUserId;
  if (!id) return 0;
  return (state.data.notifications || []).filter((item) => item.userId === id && !item.read).length;
}

function header(state) {
  const user = currentUser();
  const links = [["jobs", "Ҷои кор"], ["employers", "Барои корфармо"], ["students", "Донишҷӯён"], ["rankings", "Рейтингҳо"], ["safety", "Бехатарӣ"]];
  const dash = user?.role === "employer" ? "employerDash" : "studentDash";
  const count = unreadCount(state);
  const nav = links.map(([id, label]) => `<button type="button" data-action="go" data-view="${id}" class="${state.view === id ? "is-on" : ""}">${label}</button>`).join("");
  const bell = `<button type="button" class="btn btn-line" data-action="go" data-view="notices" aria-label="Огоҳиҳо">${count ? `Огоҳӣ · ${count}` : "Огоҳӣ"}</button>`;
  const actions = user
    ? `${bell}<button type="button" class="btn btn-line" data-action="go" data-view="${dash}">${esc(user.name.split(" ")[0])}</button><button type="button" class="btn btn-primary" data-action="logout">Баромад</button>`
    : `${bell}<button type="button" class="btn btn-line" data-action="open" data-modal="login">Воридшавӣ</button><button type="button" class="btn btn-primary" data-action="open" data-modal="signup">Бақайдгирӣ</button>`;
  const mobile = state.menuOpen
    ? `<div class="mobile-sheet"><div class="grid gap-1">${links.map(([id, label]) => `<button type="button" class="rounded-2xl px-3 py-3 text-left font-bold ${state.view === id ? "bg-mist text-pine" : ""}" data-action="go" data-view="${id}">${label}</button>`).join("")}</div><div class="mt-3 flex flex-wrap gap-2">${actions}</div></div>`
    : "";
  return `<header class="site-header"><div class="site-bar">
      <button type="button" class="brand-btn" data-action="go" data-view="home">${logo()}</button>
      <nav class="site-nav" aria-label="Асосӣ">${nav}</nav>
      <div class="header-actions">${feeBadge()}${actions}</div>
      <button type="button" class="menu-toggle" data-action="menu" aria-label="Меню" aria-expanded="${state.menuOpen}"><span class="flex flex-col gap-1.5"><span class="block h-0.5 w-5 bg-ink"></span><span class="block h-0.5 w-5 bg-ink"></span><span class="block h-0.5 w-4 bg-ink"></span></span></button>
    </div>${mobile}</header>`;
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
        <p class="footer-kicker">Шаҳрҳо</p>
        <ul class="footer-cities">${LOCATIONS.map((city) => `<li>${esc(city)}</li>`).join("")}</ul>
        <p class="footer-note">Комиссияи платформа 5–10% аз рӯи намуди эълон.</p>
        <button type="button" class="footer-reset" data-action="reset">Бозсозии маълумоти намунавӣ</button>
      </div>
    </div>
    <div class="site-footer-bar">© 2026 StudentWork.tj · Маълумот дар ҳамин браузер нигоҳ дошта мешавад</div>
  </footer>`;
}

function authModal(state) {
  const signupMode = state.modal === "signup";
  const draft = state.authDraft;
  const cities = LOCATIONS.map((city) => ({ value: city, label: city }));
  const body = `<div class="auth-switch" role="tablist" aria-label="Воридшавӣ ё бақайдгирӣ">
      <button type="button" role="tab" aria-selected="${!signupMode}" class="${signupMode ? "" : "is-on"}" data-action="open" data-modal="login">Воридшавӣ</button>
      <button type="button" role="tab" aria-selected="${signupMode}" class="${signupMode ? "is-on" : ""}" data-action="open" data-modal="signup">Бақайдгирӣ</button>
    </div>
    <form id="auth-form" class="auth-form">
      ${signupMode ? `<div class="auth-switch auth-role" role="group" aria-label="Нақш">
          <button type="button" class="${draft.role === "student" ? "is-on" : ""}" data-action="role" data-role="student">Донишҷӯ</button>
          <button type="button" class="${draft.role === "employer" ? "is-on" : ""}" data-action="role" data-role="employer">Корфармо</button>
        </div>
        <input type="hidden" name="role" value="${esc(draft.role)}">
        ${draft.role === "student" ? `<label class="auth-field">Ном<input id="auth-name" class="field" name="name" value="${esc(draft.name)}" placeholder="Номи пурра" autocomplete="name"></label>` : `<label class="auth-field">Ширкат<input id="auth-org" class="field" name="org" value="${esc(draft.org)}" placeholder="Номи ширкат" autocomplete="organization"></label>`}
        <label class="auth-field">Телефон<input id="auth-phone" class="field" name="phone" type="tel" inputmode="tel" value="${esc(draft.phone)}" placeholder="+992 900 000 000" autocomplete="tel"></label>
        <label class="auth-field">Почта<input id="auth-email" class="field" name="email" type="email" value="${esc(draft.email)}" placeholder="name@studentwork.tj" autocomplete="email"></label>
        <div class="auth-field"><span>Шаҳр</span><input type="hidden" name="city" value="${esc(draft.city)}">${picker(state, { id: "auth-city", label: "", value: draft.city, options: cities, field: true })}</div>
        ${draft.role === "student" ? `<div class="auth-field"><span id="skill-label">Маҳоратҳо</span><div class="flex flex-wrap gap-2" role="group" aria-labelledby="skill-label">${SKILLS.map((skill) => `<button type="button" class="chip" data-on="${(draft.skills || []).includes(skill)}" data-action="auth-skill" data-skill="${esc(skill)}">${esc(skill)}</button>`).join("")}</div></div>` : `<label class="auth-field">Тавсифи ширкат<textarea id="auth-about" class="field min-h-20" name="about" placeholder="Чӣ кор мекунед ва кадом донишҷӯ лозим аст">${esc(draft.about || "")}</textarea></label>`}` : `<label class="auth-field">Почта ё телефон<input id="auth-identity" class="field" name="identity" value="${esc(draft.identity || draft.email)}" placeholder="name@studentwork.tj ё +992..." autocomplete="username"></label>`}
      <label class="auth-field">Рамз<input id="auth-password" class="field" type="password" name="password" value="${esc(draft.password)}" placeholder="••••••••" autocomplete="${signupMode ? "new-password" : "current-password"}"></label>
      ${state.authError ? `<p class="auth-error" role="alert">${esc(state.authError)}</p>` : ""}
      <button class="btn btn-primary auth-submit" type="submit">${signupMode ? "Оғоз кардан" : "Воридшавӣ"}</button>
    </form>
    ${signupMode ? "" : `<div class="auth-demos"><p>Ҳисобҳои намунавӣ · рамз demo123</p>
      <button type="button" data-action="demo" data-email="mehrona@studentwork.tj"><strong>Меҳронаи Раҳимова</strong><span>Донишҷӯ</span></button>
      <button type="button" data-action="demo" data-email="safed@studentwork.tj"><strong>Қаҳвахонаи Сафед</strong><span>Корфармо</span></button></div>`}`;
  return modalShell(signupMode ? "Бақайдгирӣ" : "Воридшавӣ", signupMode ? "Ҳисоби донишҷӯ ё корфармо кушоед." : "Ба кабинети худ дароед.", body, "modal-card-fit");
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
  const body = `<div class="grid gap-4">
    <div class="flex flex-wrap items-center gap-2">${job.vip ? `<span class="rounded-full bg-gold px-2.5 py-1 text-xs font-extrabold">VIP · Пешбар</span>` : ""}${employer?.verified ? verified() : `<span class="text-xs font-bold text-ink/45">Корфармо ҳанӯз тасдиқ нашудааст</span>`}${feeBadge()}</div>
    <div><p class="text-sm font-bold">${esc(employerName(employer))}</p>${stars(rating.avg, rating.count)}</div>
    <p class="text-2xl font-extrabold text-pine">${esc(payLabel(job))}</p>
    <p class="text-sm font-semibold text-ink/70">${esc(formatDate(job.date))} · ${esc(job.timeStart)}–${esc(job.timeEnd)}</p>
    <p class="text-sm leading-relaxed text-ink/80">${esc(job.description)}</p>
    <div class="rounded-2xl bg-mist p-4">${escrow()}<p class="mt-2 text-xs text-ink/60">Комиссияи 5–10% аз корфармо гирифта мешавад. Маблағи эълоншуда ба донишҷӯ аст.</p></div>
    ${mine ? `<p class="text-sm font-bold text-pine">Аризаи шумо: ${APP_STATUS[mine.status] || ""}</p>` : ""}
    <div>${reviewBlock(state, job.employerId)}</div>
    <div class="flex flex-wrap gap-2">
      <button type="button" class="btn btn-primary" data-action="apply" data-id="${esc(job.id)}" ${job.status !== "open" || mine ? "disabled" : ""}>${mine ? "Дархост фиристода шуд" : "Ариза додан"}</button>
      <button type="button" class="btn btn-line" data-action="save" data-id="${esc(job.id)}">Захира</button>
      <button type="button" class="btn btn-line" data-action="report" data-kind="job" data-id="${esc(job.id)}">Гузориши кор</button>
      <button type="button" class="btn btn-line" data-action="report" data-kind="user" data-id="${esc(job.employerId)}">Гузориши корфармо</button>
      <button type="button" class="btn btn-line" data-action="close">Пӯшидан</button>
    </div>
  </div>`;
  return modalShell(job.title, `${job.category} · ${job.location}`, body);
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
    ["✓", "Корфармои тасдиқшуда", "Нишон дар эълон ва кабинет мемонад. Корфармо онро аз кабинети худ фаъол мекунад."],
    ["✓", "Донишҷӯи тасдиқшуда", "Рақами донишҷӯӣ санҷида мешавад. Намуна: ДМТ-2024-1842."],
    ["🛡", "Ҳифзи пардохт", "Ҳангоми қабул маблағ дар ҳисоби махсус сабт мешавад ва баъд аз пахши тугмаи «Кор анҷом ёфт» озод мегардад."],
    ["🚨", "Гузориши кор", "Эълонро кушоед ва тугмаи «Гузориши кор»-ро пахш кунед."],
    ["🚨", "Гузориши корбар", "Дар профили донишҷӯ ё дар рӯйхати аризаҳо тугмаи шикоят/гузориш мавҷуд аст."],
  ];
  const mine = reports.length
    ? `<ul class="review-list">${reports.map((item) => `<li><strong>${item.kind === "job" ? "Кор" : "Корбар"}</strong><p>${esc(item.reason)}</p></li>`).join("")}</ul>`
    : EmptyState({ title: "Ҳоло гузориш нест.", text: "Агар эълон ё корбар шубҳанок бошад, аз корт ё профил гузориш диҳед.", action: "Ба рӯйхати корҳо", view: "jobs" });
  return `<div class="page">
    <p class="text-xs font-extrabold tracking-wider text-pine">ЭЪТИМОД</p>
    <h1 class="mt-2 text-3xl font-extrabold">Бехатарӣ ва ҳифзи пардохт</h1>
    <p class="mt-2 max-w-2xl text-sm leading-relaxed text-ink/65">Пул то анҷоми кор дар ҳисоби махсус мемонад. Корфармо ва донишҷӯи тасдиқшуда бо нишон дида мешаванд.</p>
    <div class="safety-grid">${cards.map(([mark, title, text]) => `<article class="rounded-[1.6rem] border border-line bg-paper p-5"><p class="text-xl" aria-hidden="true">${mark}</p><h2 class="mt-2 text-lg font-extrabold">${title}</h2><p class="mt-2 text-sm leading-relaxed text-ink/65">${text}</p></article>`).join("")}</div>
    <section class="mt-5 rounded-[1.6rem] border border-line bg-paper p-5"><h2 class="text-lg font-extrabold">Гузоришҳои ман</h2>${mine}</section>
  </div>`;
}

function inbox(state) {
  const user = currentUser();
  if (!user) return gate("Паёмҳо", "Барои сӯҳбат бо ҳисоби худ ворид шавед.");
  const threads = [];
  state.data.applications.forEach((application) => {
    const job = state.data.jobs.find((item) => item.id === application.jobId);
    if (!job) return;
    if (user.role === "student" && application.studentId !== user.id) return;
    if (user.role === "employer" && job.employerId !== user.id) return;
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

function bottomNav(state) {
  const user = currentUser();
  const dash = user?.role === "employer" ? "employerDash" : "studentDash";
  const count = unreadCount(state);
  const items = [
    ["jobs", "Корҳо", "go"],
    ["inbox", "Паём", "go"],
    ["notices", count ? `Огоҳӣ ${count}` : "Огоҳӣ", "go"],
    ["rankings", "Рейтинг", "go"],
  ];
  const links = items.map(([view, label]) => `<button type="button" data-action="go" data-view="${view}" ${state.view === view ? 'aria-current="page"' : ""}>${label}</button>`).join("");
  const last = user
    ? `<button type="button" data-action="go" data-view="${dash}" ${state.view === dash ? 'aria-current="page"' : ""}>Кабинет</button>`
    : `<button type="button" data-action="open" data-modal="login">Ворид</button>`;
  return `<nav class="bottom-nav" aria-label="Мобилӣ">${links}${last}</nav>`;
}

function bootShell(state) {
  if (state.view === "rankings") return SkeletonLoader("leaderboard");
  if (state.view === "notices") return SkeletonLoader("notices");
  if (state.view === "students" || state.view === "studentDash") return SkeletonLoader("profile");
  if (state.view === "employerDash" || state.view === "inbox" || state.view === "safety") return SkeletonLoader("dashboard");
  return SkeletonLoader("cards");
}

function modal(state) {
  if (state.modal === "login" || state.modal === "signup") return authModal(state);
  if (state.modal === "publish") return publishModal(state);
  if (state.modal === "apply") return applyModal(state);
  if (state.modal === "rate") return rateModal(state);
  if (state.modal === "job") return jobModal(state);
  if (state.modal === "report") return reportModal(state);
  return "";
}

const PAGES = { home, jobs, employers, students: studentsPage, rankings, studentDash, employerDash, safety, inbox, notices };

export function appHtml(state) {
  const page = state.booting ? bootShell(state) : (PAGES[state.view] || home)(state);
  const toast = state.toast ? `<div class="toast" role="status"><span class="toast-mark" aria-hidden="true">✓</span><span>${esc(state.toast.message)}</span></div>` : "";
  return `${header(state)}<main id="main">${page}</main>${footer()}${bottomNav(state)}${modal(state)}${toast}`;
}

export function cvDownloadName(user, state) {
  const rating = avgRating(state.data.ratings, user.id);
  const lines = summarizeAvailability(user.availability);
  const portfolio = portfolioFor(user, state.data.applications, state.data.jobs);
  const work = portfolio.length ? portfolio.map((item) => `<li>${esc(item.title)} — ${esc(item.pay)} — ${esc(formatDate(item.date))}</li>`).join("") : "<li>—</li>";
  return `<!doctype html><html lang="tg"><meta charset="utf-8"><title>CV ${esc(user.name)}</title><body style="font-family:Segoe UI,sans-serif;background:#f3efe6;padding:32px;color:#14221c"><article style="max-width:720px;margin:auto;background:#fffdf8;border:1px solid #e4d9c8;border-radius:24px;overflow:hidden"><header style="background:#0e4f3f;color:#f3efe6;padding:28px"><p>STUDENTWORK.TJ</p><h1>${esc(user.name)}</h1><p>${esc(levelFor(user.experience).name)} · ${esc(user.city)}</p></header><div style="padding:28px"><p><b>Донишгоҳ:</b> ${esc(user.university || "—")}</p><p><b>Маҳоратҳо:</b> ${esc(user.skills.join(", ") || "—")}</p><p><b>Баҳо:</b> ${rating.count ? rating.avg.toFixed(1) : "Нав"} · <b>Таҷриба:</b> ${user.experience || 0}</p><h2>Ҷадвал</h2><ul>${lines.map((line) => `<li>${esc(line)}</li>`).join("") || "<li>—</li>"}</ul><h2>Корҳо</h2><ul>${work}</ul><p>${esc(user.bio || "")}</p></div></article></body></html>`;
}
