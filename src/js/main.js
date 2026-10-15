import { appHtml, cvDownloadName } from "./render.js";
import {
  addRating,
  applyToJob,
  closeModal,
  currentUser,
  getState,
  go,
  login,
  logout,
  openApply,
  openModal,
  openPublish,
  changePassword,
  updateSettings,
  patch,
  publishJob,
  publishPosted,
  publishSolved,
  chooseStudent,
  detectProblem,
  openProposal,
  savePost,
  sendProposal,
  setDiscover,
  startFlow,
  togglePostSkill,
  toggleSolveSkill,
  updateSolve,
  resetDemo,
  setApplicationStatus,
  fileReport,
  openReport,
  openThread,
  sendMessage,
  signup,
  subscribe,
  toggleSave,
  updateUser,
  verifyStudent,
} from "./store.js";
import { emptyWeek, selectedCities } from "../lib/utils.js";

const TITLES = {
  home: "StudentWork.tj — Кори соатбайъ барои донишҷӯён",
  jobs: "Ҷои кор — StudentWork.tj",
  find: "Кор пайдо кун — StudentWork.tj",
  post: "Кор супор — StudentWork.tj",
  solve: "Коратро ҳал кун — StudentWork.tj",
  employers: "Барои корфармо — StudentWork.tj",
  students: "Донишҷӯён — StudentWork.tj",
  rankings: "Рейтингҳо — StudentWork.tj",
  studentDash: "Кабинети донишҷӯ — StudentWork.tj",
  employerDash: "Кабинети корфармо — StudentWork.tj",
  safety: "Бехатарӣ — StudentWork.tj",
  inbox: "Паёмҳо — StudentWork.tj",
  notices: "Огоҳиҳо — StudentWork.tj",
  courses: "Курсҳо — StudentWork.tj",
  tasks: "Вазифаҳо — StudentWork.tj",
  settings: "Танзимот — StudentWork.tj",
};

function paintCount(el, value) {
  const decimals = Number(el.dataset.decimals || 0);
  const suffix = el.dataset.suffix || "";
  const num = decimals ? Number(value).toFixed(decimals) : String(Math.round(Number(value)));
  el.textContent = `${num.replace(/\B(?=(\d{3})+(?!\d))/g, " ")}${suffix}`;
}

function runCounters() {
  const nodes = document.querySelectorAll("[data-count]:not([data-ran])");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!nodes.length) return;
  if (reduced) {
    nodes.forEach((el) => {
      el.dataset.ran = "1";
      paintCount(el, el.dataset.count);
    });
    return;
  }
  const watch = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.dataset.ran = "1";
      watch.unobserve(el);
      const target = Number(el.dataset.count);
      const start = performance.now();
      const tick = (now) => {
        const progress = Math.min(1, (now - start) / 900);
        const eased = 1 - (1 - progress) ** 3;
        paintCount(el, target * eased);
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.5 });
  nodes.forEach((node) => watch.observe(node));
}

let revealToken = 0;

function runReveal() {
  const token = ++revealToken;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const showFresh = (section) => {
    if (!section || section.classList.contains("is-ready")) return;
    section.classList.add("is-ready");
    const grid = section.querySelector(".fresh-grid");
    const skel = section.querySelector(".fresh-skel");
    if (grid) grid.hidden = false;
    if (skel) skel.hidden = true;
  };
  const reveal = (node) => node.classList.add("is-in");
  const nodes = [...document.querySelectorAll(".reveal:not(.is-in)")];
  if (reduced || typeof IntersectionObserver !== "function") {
    nodes.forEach(reveal);
    document.querySelectorAll(".home-fresh").forEach(showFresh);
    return;
  }
  if (nodes.length) {
    const watch = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        watch.unobserve(entry.target);
      });
    }, { threshold: 0, rootMargin: "80px 0px" });
    nodes.forEach((node) => watch.observe(node));
  }
  document.querySelectorAll(".home-fresh:not(.is-ready)").forEach((section) => {
    const watch = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      watch.disconnect();
      window.setTimeout(() => showFresh(section), 280);
    }, { threshold: 0, rootMargin: "120px 0px" });
    watch.observe(section);
  });
  window.setTimeout(() => {
    if (token !== revealToken) return;
    document.querySelectorAll(".reveal:not(.is-in)").forEach(reveal);
    document.querySelectorAll(".home-fresh:not(.is-ready)").forEach(showFresh);
  }, 700);
}

function draw() {
  const active = document.activeElement;
  const snap = active?.id ? { id: active.id, start: active.selectionStart, end: active.selectionEnd } : null;
  document.getElementById("app").innerHTML = appHtml(getState());
  document.body.classList.toggle("menu-open", Boolean(getState().menuOpen));
  document.body.classList.toggle("theme-violet", getState().settings?.theme === "violet");
  document.body.classList.toggle("phone-app", window.matchMedia("(max-width: 1023px)").matches);
  document.documentElement.lang = getState().settings?.lang === "ru" ? "ru" : "tg";
  document.title = TITLES[getState().view] || TITLES.home;
  const gate = document.querySelector(".gate-card");
  if (gate && !gate.contains(document.activeElement)) gate.querySelector("input:not([type=hidden])")?.focus();
  runCounters();
  runReveal();
  if (!snap) return;
  const el = document.getElementById(snap.id);
  if (!el) return;
  el.focus();
  if (typeof snap.start === "number" && el.setSelectionRange) {
    try { el.setSelectionRange(snap.start, snap.end); } catch { /* date/time inputs */ }
  }
}

function readForm(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  data.vip = Boolean(form.elements.vip?.checked);
  data.rush = Boolean(form.elements.rush?.checked);
  return data;
}

function applyPick(el) {
  const id = el.dataset.picker;
  const value = el.dataset.value;
  const state = getState();
  if (id === "search-category") {
    patch({ filters: { ...state.filters, category: value }, picker: null });
    return;
  }
  if (id === "location") {
    patch({ filters: { ...state.filters, location: value }, picker: null });
    if (state.view !== "jobs") go("jobs");
    return;
  }
  if (id === "sort") {
    patch({ sort: value, picker: null });
    return;
  }
  if (id === "auth-city") {
    const auth = document.getElementById("auth-form");
    patch({ authDraft: { ...state.authDraft, ...(auth ? readForm(auth) : {}), city: value }, picker: null });
    return;
  }
  if (id.startsWith("publish-")) {
    const form = document.getElementById("publish-form");
    const field = id.slice("publish-".length);
    patch({ publishDraft: { ...(form ? readForm(form) : state.publishDraft || {}), [field]: value }, picker: null });
    return;
  }
  if (id === "profile-city") {
    updateUser({ city: value });
    patch({ picker: null });
  }
}

function onClick(event) {
  const el = event.target.closest("[data-action]");
  const inApp = Boolean(event.target.closest("#app"));
  const insidePicker = Boolean(event.target.closest(".picker"));
  if (!inApp) return;
  if (getState().picker && !insidePicker) patch({ picker: null });
  if (!el) return;
  const action = el.dataset.action;
  const state = getState();
  const user = currentUser();
  if (action === "filter-set") {
    const key = el.dataset.key;
    if (key === "category" || key === "location") {
      patch({ filters: { ...state.filters, [key]: el.dataset.value }, jobsShown: 9, menuOpen: false, picker: null });
      if (getState().view !== "jobs") go("jobs");
    }
    return;
  }
  if (action === "cities") {
    patch({ modal: "cities", menuOpen: false, picker: null, cityQuery: "", cityPick: selectedCities(state.filters.location) });
    return;
  }
  if (action === "city-toggle") {
    event.preventDefault();
    const name = el.dataset.city;
    const current = state.cityPick || [];
    const cityPick = current.includes(name) ? current.filter((city) => city !== name) : [...current, name];
    patch({ cityPick });
    return;
  }
  if (action === "city-all") {
    patch({ cityPick: [] });
    return;
  }
  if (action === "city-apply") {
    const picked = state.cityPick || [];
    patch({
      filters: { ...state.filters, location: picked.length ? picked.join("|") : "Ҳамаи шаҳрҳо" },
      jobsShown: 9,
      modal: null,
      cityPick: null,
      cityQuery: "",
    });
    if (state.view !== "jobs") go("jobs");
    return;
  }
  if (action === "saved") {
    if (!user) openModal("login");
    else openModal("saved");
    return;
  }
  if (action === "splash-next") {
    sessionStorage.setItem("sw.splash", "1");
    if (!user && !state.settings?.onboarded) patch({ phoneStage: "onboard", phoneSlide: 0 });
    else patch({ phoneStage: null });
    return;
  }
  if (action === "splash-back") {
    patch({ phoneStage: "splash" });
    return;
  }
  if (action === "picker") {
    patch({ picker: state.picker === el.dataset.picker ? null : el.dataset.picker });
    return;
  }
  if (action === "pick") {
    applyPick(el);
    return;
  }

  if (action === "go") go(el.dataset.view);
  if (action === "popular") {
    patch({ filters: { ...state.filters, q: el.dataset.q || "", category: "Ҳама" } });
    go("jobs");
  }
  if (action === "open") {
    const auth = document.getElementById("auth-form");
    if (auth && (el.dataset.modal === "login" || el.dataset.modal === "signup")) {
      patch({ authDraft: { ...state.authDraft, ...readForm(auth) }, modal: el.dataset.modal, authError: "", authPhase: null });
    } else openModal(el.dataset.modal);
  }
  if (action === "close") closeModal();
  if (action === "logout") logout();
  if (action === "phone-auth") patch({ phoneStage: el.dataset.stage || "login", authError: "" });
  if (action === "onboard-skip" || (action === "onboard-next" && state.phoneSlide >= 2)) {
    updateSettings({ onboarded: true });
    patch({ phoneStage: currentUser() ? null : "login", phoneSlide: 0 });
  } else if (action === "onboard-next") patch({ phoneSlide: (state.phoneSlide || 0) + 1 });
  if (action === "forgot") notifyFallback("Барқароркунии рамз дар ин нусха нест. Бо почта ё рақами телефон ворид шавед.");
  if (action === "peek") patch({ authPeek: !state.authPeek });
  if (action === "social") notifyFallback(`Воридшавӣ бо ${el.dataset.provider} пайваст нест. Почта ё рақами телефонро нависед.`);
  if (action === "setting") {
    const key = el.dataset.key;
    if (el.dataset.value === "toggle") updateSettings({ [key]: !state.settings?.[key] });
    else updateSettings({ [key]: el.dataset.value });
  }
  if (action === "reset") resetDemo();
  if (action === "menu") patch({ menuOpen: !state.menuOpen });
  if (action === "flow") startFlow(el.dataset.flow);
  if (action === "hero-chip") {
    if (el.dataset.view) go(el.dataset.view);
    else {
      patch({ filters: { ...state.filters, pay: el.dataset.pay || "", q: "", category: "Ҳама" } });
      go("jobs");
    }
  }
  if (action === "share") {
    const url = `${location.origin}${location.pathname}`;
    if (navigator.share) navigator.share({ title: "StudentWork.tj", text: "Фурсати кори барои донишҷӯён", url }).catch(() => {});
    else notifyFallback("Пайванди саҳифа омода аст: " + url);
  }
  if (action === "discover") setDiscover({ [el.dataset.key]: el.dataset.value });
  if (action === "post-skill") {
    const form = document.getElementById("post-form");
    if (form) savePost(readForm(form), getState().postStep || 1);
    togglePostSkill(el.dataset.skill);
  }
  if (action === "post-category" || action === "post-pay" || action === "post-city") {
    const form = document.getElementById("post-form");
    const key = action === "post-category" ? "category" : action === "post-pay" ? "payType" : "city";
    savePost({ ...(form ? readForm(form) : {}), [key]: el.dataset.value }, getState().postStep || 1);
  }
  if (action === "post-place") {
    const form = document.getElementById("post-form");
    savePost({ ...(form ? readForm(form) : {}), online: el.dataset.value === "online" }, getState().postStep || 1);
  }
  if (action === "post-back") savePost({}, Math.max(1, (getState().postStep || 1) - 1));
  if (action === "post-publish") publishPosted();
  if (action === "solve-skill" || action === "solve-category" || action === "solve-city" || action === "solve-place") {
    const title = document.getElementById("solve-title");
    if (title) {
      updateSolve({
        title: title.value,
        budget: Number(document.getElementById("solve-budget")?.value || getState().solveDraft?.budget),
        deadline: document.getElementById("solve-deadline")?.value || getState().solveDraft?.deadline,
      });
    }
  }
  if (action === "solve-skill") toggleSolveSkill(el.dataset.skill);
  if (action === "solve-category") updateSolve({ category: el.dataset.value });
  if (action === "solve-city") updateSolve({ city: el.dataset.value });
  if (action === "solve-place") updateSolve({ online: el.dataset.value === "online" });
  if (action === "solve-save") {
    updateSolve({
      title: document.getElementById("solve-title")?.value || getState().solveDraft?.title,
      budget: Number(document.getElementById("solve-budget")?.value || getState().solveDraft?.budget),
      deadline: document.getElementById("solve-deadline")?.value || getState().solveDraft?.deadline,
    });
  }
  if (action === "solve-publish" || action === "choose-student") {
    updateSolve({
      title: document.getElementById("solve-title")?.value || getState().solveDraft?.title,
      budget: Number(document.getElementById("solve-budget")?.value || getState().solveDraft?.budget),
      deadline: document.getElementById("solve-deadline")?.value || getState().solveDraft?.deadline,
    });
  }
  if (action === "solve-publish") publishSolved();
  if (action === "choose-student") chooseStudent(el.dataset.id);
  if (action === "propose") openProposal(el.dataset.id);
  if (action === "review-job") {
    patch({ selectedJobId: el.dataset.id });
    go("employerDash");
  }
  if (action === "publish") openPublish(el.dataset.location || "");
  if (action === "apply") openApply(el.dataset.id);
  if (action === "open-job") {
    const job = state.data.jobs.find((item) => item.id === el.dataset.id);
    if (!job) {
      notifyFallback("Ин эълон дастрас нест.");
      return;
    }
    patch({ activeJobId: job.id, modal: "job", menuOpen: false });
  }
  if (action === "category" || action === "category-go") {
    patch({ filters: { ...state.filters, category: el.dataset.category }, jobsShown: 9 });
    if (action === "category-go") go("jobs");
  }
  if (action === "jump-job") {
    patch({ filters: { q: "", location: el.dataset.location, category: el.dataset.category } });
    go("jobs");
  }
  if (action === "rank-city") patch({ rankCity: el.dataset.city });
  if (action === "map-city") patch({ mapCity: el.dataset.city });
  if (action === "select-job") patch({ selectedJobId: el.dataset.id });
  if (action === "demo") patch({ authDraft: { ...state.authDraft, identity: el.dataset.email, email: el.dataset.email, password: "demo123" }, authError: "" });
  if (action === "auth-skill") {
    const auth = document.getElementById("auth-form");
    const skills = new Set(state.authDraft.skills || []);
    if (skills.has(el.dataset.skill)) skills.delete(el.dataset.skill);
    else skills.add(el.dataset.skill);
    patch({ authDraft: { ...state.authDraft, ...(auth ? readForm(auth) : {}), skills: [...skills] } });
  }
  if (action === "save") toggleSave(el.dataset.id);
  if (action === "chat") openThread(el.dataset.job, el.dataset.student);
  if (action === "report") openReport(el.dataset.kind, el.dataset.id);
  if (action === "clear-filters") patch({ filters: { q: "", location: "Ҳамаи шаҳрҳо", category: "Ҳама", pay: "" }, sort: "vip", jobsShown: 9 });
  if (action === "jobs-more") patch({ jobsShown: (state.jobsShown || 9) + 6 });
  if (action === "clear-map") patch({ mapQuery: "" });
  if (action === "role") {
    const auth = document.getElementById("auth-form");
    patch({ authDraft: { ...state.authDraft, ...(auth ? readForm(auth) : {}), role: el.dataset.role } });
  }
  if (action === "star") patch({ rateStars: Number(el.dataset.star) });
  if (action === "hour" && user?.role === "student") {
    const day = el.dataset.day;
    const hour = Number(el.dataset.hour);
    const next = { ...user.availability, [day]: [...(user.availability?.[day] || [])] };
    next[day] = next[day].includes(hour) ? next[day].filter((item) => item !== hour) : [...next[day], hour].sort((a, b) => a - b);
    updateUser({ availability: next });
  }
  if (action === "preset" && user?.role === "student") {
    const next = emptyWeek();
    if (el.dataset.preset === "after") ["mon", "tue", "wed", "thu", "fri"].forEach((day) => { next[day] = [14, 15, 16, 17]; });
    if (el.dataset.preset === "evening") ["mon", "tue", "wed", "thu", "fri"].forEach((day) => { next[day] = [18, 19, 20]; });
    if (el.dataset.preset === "weekend") {
      next.sat = [10, 11, 12, 13, 14, 15, 16, 17];
      next.sun = [10, 11, 12, 13, 14, 15, 16, 17];
    }
    updateUser({ availability: next });
  }
  if (action === "skill" && user) {
    const skill = el.dataset.skill;
    const skills = user.skills.includes(skill) ? user.skills.filter((item) => item !== skill) : [...user.skills, skill];
    updateUser({ skills });
  }
  if (action === "app-status") setApplicationStatus(el.dataset.id, el.dataset.status);
  if (action === "rate") patch({ rateCtx: { toId: el.dataset.to, jobId: el.dataset.job, direction: el.dataset.direction }, rateStars: 5, modal: "rate" });
  if (action === "verify-employer") updateUser({ verified: true });
  if (action === "download-cv" && user) {
    const blob = new Blob([cvDownloadName(user, state)], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `CV-${user.name.replace(/\s+/g, "-")}.html`;
    link.click();
    URL.revokeObjectURL(url);
  }
  if (action === "print-cv") window.print();
}

function onSubmit(event) {
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || !document.getElementById("app")?.contains(form)) return;
  event.preventDefault();
  const data = readForm(form);
  const state = getState();
  if (form.id === "search-form" || form.id === "home-search") {
    patch({ filters: { q: data.q || "", location: data.location || "Ҳамаи шаҳрҳо", category: data.category || "Ҳама" }, jobsShown: 9 });
    go("jobs");
  }
  if (form.id === "auth-form") {
    if (state.authPhase === "loading" || state.authPhase === "success") return;
    const signupMode = state.modal === "signup" || state.phoneStage === "register";
    const payload = { ...state.authDraft, ...data };
    patch({ authPhase: "loading", authError: "" });
    window.setTimeout(() => {
      const live = getState();
      if (live.authPhase !== "loading") return;
      if (signupMode) signup(payload);
      else login(payload.identity || payload.email || "", payload.password || "");
    }, 520);
  }
  if (form.id === "message-form") sendMessage(data.body || "");
  if (form.id === "report-form") fileReport(data.reason || "");
  if (form.id === "publish-form") publishJob(data);
  if (form.id === "apply-form") applyToJob(state.activeJobId, data.message || "");
  if (form.id === "proposal-form") sendProposal(data);
  if (form.id === "discover-form") setDiscover({ min: data.min || "", max: data.max || "", deadline: data.deadline || "" });
  if (form.id === "post-form") savePost(data, Number(data.step) === 1 ? 2 : 3);
  if (form.id === "solve-form") detectProblem(data.text || "", form.querySelector("input[type=file]")?.files?.[0]?.name || "");
  if (form.id === "rate-form") addRating(data.comment || "");
  if (form.id === "verify-form") verifyStudent(data.studentId || "");
  if (form.id === "account-form") {
    updateUser({ name: data.name || "", phone: data.phone || "", university: data.university || "" });
    patch({ accountError: "" });
  }
  if (form.id === "password-form") changePassword(data.current || "", data.next || "");
}

function onChange(event) {
  const el = event.target;
  if (el.form?.id === "publish-form" && el.type === "checkbox") {
    patch({ publishDraft: readForm(el.form) });
  }
}

function onBlur(event) {
  const el = event.target;
  if (el.dataset?.save !== "bio" && el.dataset?.save !== "university") return;
  const field = el.dataset.save;
  const value = el.value;
  setTimeout(() => updateUser({ [field]: value }), 0);
}

function onInput(event) {
  if (event.target.id === "map-query") patch({ mapQuery: event.target.value });
  if (event.target.id === "search-q" && getState().view === "jobs") {
    patch({ filters: { ...getState().filters, q: event.target.value } });
  }
  if (event.target.id === "city-query") patch({ cityQuery: event.target.value });
}

document.addEventListener("click", onClick);
document.addEventListener("submit", onSubmit);
document.addEventListener("change", onChange);
document.addEventListener("focusout", onBlur);
document.addEventListener("input", onInput);
document.addEventListener("keydown", (event) => {
  if (event.key === "Tab" && getState().modal) {
    const dialog = document.querySelector(".gate-root");
    if (!dialog) return;
    const items = [...dialog.querySelectorAll("button, input, textarea, select")].filter((el) => !el.disabled && el.tabIndex !== -1);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
    return;
  }
  if (event.key !== "Escape") return;
  if (getState().modal) closeModal();
  else if (getState().menuOpen) patch({ menuOpen: false });
  else if (getState().picker) patch({ picker: null });
});

function notifyFallback(message) {
  patch({ toast: { id: Date.now(), message } });
  setTimeout(() => {
    if (getState().toast) patch({ toast: null });
  }, 3200);
}

function bootPhone() {
  if (!window.matchMedia("(max-width: 1023px)").matches) return;
  const seen = sessionStorage.getItem("sw.splash");
  const openGate = () => {
    if (currentUser()) patch({ phoneStage: null });
    else if (!getState().settings?.onboarded) patch({ phoneStage: "onboard", phoneSlide: 0 });
    else patch({ phoneStage: "login" });
  };
  if (seen) {
    openGate();
    return;
  }
  patch({ phoneStage: "splash" });
}

subscribe(draw);
draw();
bootPhone();
window.addEventListener("resize", () => {
  const phone = window.matchMedia("(max-width: 1023px)").matches;
  if (phone !== document.body.classList.contains("phone-app")) draw();
});
setTimeout(() => {
  if (getState().booting) patch({ booting: false });
}, 420);
