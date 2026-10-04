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
  patch,
  publishJob,
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
import { emptyWeek } from "../lib/utils.js";

const TITLES = {
  home: "StudentWork.tj — Кори соатбайъ барои донишҷӯён",
  jobs: "Ҷои кор — StudentWork.tj",
  employers: "Барои корфармо — StudentWork.tj",
  students: "Донишҷӯён — StudentWork.tj",
  rankings: "Рейтингҳо — StudentWork.tj",
  studentDash: "Кабинети донишҷӯ — StudentWork.tj",
  employerDash: "Кабинети корфармо — StudentWork.tj",
  safety: "Бехатарӣ — StudentWork.tj",
  inbox: "Паёмҳо — StudentWork.tj",
  notices: "Огоҳиҳо — StudentWork.tj",
};

function draw() {
  const active = document.activeElement;
  const snap = active?.id ? { id: active.id, start: active.selectionStart, end: active.selectionEnd } : null;
  document.getElementById("app").innerHTML = appHtml(getState());
  document.title = TITLES[getState().view] || TITLES.home;
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
  if (action === "picker") {
    patch({ picker: state.picker === el.dataset.picker ? null : el.dataset.picker });
    return;
  }
  if (action === "pick") {
    applyPick(el);
    return;
  }

  if (action === "go") go(el.dataset.view);
  if (action === "open") {
    const auth = document.getElementById("auth-form");
    if (auth && (el.dataset.modal === "login" || el.dataset.modal === "signup")) {
      patch({ authDraft: { ...state.authDraft, ...readForm(auth) }, modal: el.dataset.modal, authError: "" });
    } else openModal(el.dataset.modal);
  }
  if (action === "close") closeModal();
  if (action === "logout") logout();
  if (action === "reset") resetDemo();
  if (action === "menu") patch({ menuOpen: !state.menuOpen });
  if (action === "publish") openPublish(el.dataset.location || "");
  if (action === "apply") openApply(el.dataset.id);
  if (action === "open-job") patch({ activeJobId: el.dataset.id, modal: "job" });
  if (action === "category" || action === "category-go") {
    patch({ filters: { ...state.filters, category: el.dataset.category } });
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
  if (action === "clear-filters") patch({ filters: { q: "", location: "Ҳамаи шаҳрҳо", category: "Ҳама" }, sort: "vip" });
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
  if (form.id === "search-form") {
    patch({ filters: { q: data.q || "", location: data.location, category: data.category } });
    go("jobs");
  }
  if (form.id === "auth-form") {
    if (state.modal === "signup") signup({ ...state.authDraft, ...data });
    else login(data.identity || data.email || "", data.password || "");
  }
  if (form.id === "message-form") sendMessage(data.body || "");
  if (form.id === "report-form") fileReport(data.reason || "");
  if (form.id === "publish-form") publishJob(data);
  if (form.id === "apply-form") applyToJob(state.activeJobId, data.message || "");
  if (form.id === "rate-form") addRating(data.comment || "");
  if (form.id === "verify-form") verifyStudent(data.studentId || "");
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
}

document.addEventListener("click", onClick);
document.addEventListener("submit", onSubmit);
document.addEventListener("change", onChange);
document.addEventListener("focusout", onBlur);
document.addEventListener("input", onInput);
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (getState().modal) closeModal();
  else if (getState().picker) patch({ picker: null });
});

subscribe(draw);
draw();
setTimeout(() => {
  if (getState().booting) patch({ booting: false });
}, 420);
