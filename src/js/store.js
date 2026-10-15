import { seedState } from "../data/seed.js";
import { emptyWeek, employerName, escrowEstimate, isOpenStatus, uid } from "../lib/utils.js";
import { understandRequest } from "../lib/work.js";
import { progressFor } from "./progress.js";

const KEY = "studentwork.tj.v1";
const SETTINGS_KEY = "studentwork.tj.settings";
const VIEWS = ["home", "jobs", "find", "post", "solve", "courses", "tasks", "employers", "students", "rankings", "studentDash", "employerDash", "safety", "inbox", "notices", "settings"];

function defaultSettings() {
  return { lang: "tg", theme: "indigo", notifications: true, reminders: true, privacyHideRank: false, seenBadges: {}, seenReady: {} };
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings();
    return { ...defaultSettings(), ...JSON.parse(raw) };
  } catch {
    return defaultSettings();
  }
}

function persistSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  state = { ...state, settings };
}
const DEMO_PHONES = {
  "mehrona@studentwork.tj": "+992 900 110 118",
  "safed@studentwork.tj": "+992 900 220 218",
};

function digitsOf(value) {
  return String(value || "").replace(/\D/g, "");
}

function note(userId, message) {
  return { id: uid(), userId, message, read: false, createdAt: Date.now() };
}

function ensureCollections(data) {
  const users = data.users.map((user) => ({
    ...user,
    phone: user.phone || DEMO_PHONES[user.email] || "",
    about: user.about || "",
  }));
  let transactions = data.transactions;
  if (!Array.isArray(transactions)) {
    transactions = [];
    data.applications.forEach((application) => {
      const job = data.jobs.find((item) => item.id === application.jobId);
      if (!job || (application.status !== "accepted" && application.status !== "completed")) return;
      const amount = escrowEstimate(job);
      transactions.push({
        id: `hold-${application.id}`,
        applicationId: application.id,
        jobId: job.id,
        employerId: job.employerId,
        studentId: application.studentId,
        amount,
        type: "hold",
        status: application.status === "completed" ? "released" : "held",
        createdAt: application.createdAt || Date.now(),
      });
      if (application.status === "completed") {
        transactions.push({
          id: `release-${application.id}`,
          applicationId: application.id,
          jobId: job.id,
          employerId: job.employerId,
          studentId: application.studentId,
          amount,
          type: "release",
          status: "released",
          createdAt: (application.createdAt || Date.now()) + 1,
        });
      }
    });
  }
  const wedding = {
    id: "e5",
    role: "employer",
    name: "Манижа Раҳмонова",
    company: "Тӯйхонаи Ситора",
    email: "sitora@studentwork.tj",
    phone: "+992 927 440 118",
    password: "demo123",
    city: "Хуҷанд",
    verified: true,
    hue: 280,
    bio: "Тӯйхона барои тӯй ва чорабиниҳои шабона.",
  };
  const withWedding = users.some((user) => user.id === "e5") ? users : [...users, wedding];
  const jobs = (data.jobs || []).map((job) => (
    job.category === "Пешхизмат" && /тӯй/i.test(job.title || "") && job.employerId === "e3"
      ? { ...job, employerId: "e5" }
      : job
  ));
  return {
    ...data,
    users: withWedding,
    jobs,
    messages: Array.isArray(data.messages) ? data.messages : [],
    notifications: Array.isArray(data.notifications) ? data.notifications : [],
    transactions,
    savedJobs: Array.isArray(data.savedJobs) ? data.savedJobs : [],
    reports: Array.isArray(data.reports) ? data.reports : [],
  };
}

function loadData() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data?.schema !== 1 || !Array.isArray(data.users) || !Array.isArray(data.jobs)) return null;
    return data;
  } catch {
    return null;
  }
}

function initialView() {
  const hash = location.hash.replace("#", "");
  return VIEWS.includes(hash) ? hash : "home";
}

let state = {
  data: ensureCollections(loadData() || seedState()),
  view: initialView(),
  booting: true,
  modal: null,
  filters: { q: "", location: "Ҳамаи шаҳрҳо", category: "Ҳама" },
  cityQuery: "",
  cityPick: null,
  toast: null,
  activeJobId: null,
  rateCtx: null,
  rateStars: 5,
  publishLocation: "",
  freshJobId: null,
  sort: "vip",
  rankCity: "Ҳама",
  mapCity: "Душанбе",
  mapQuery: "",
  selectedJobId: null,
  authError: "",
  authPhase: null,
  authWelcome: "",
  authPeek: false,
  authDraft: { identity: "", email: "", password: "", name: "", org: "", city: "Душанбе", role: "student", phone: "", about: "", skills: [] },
  chatThread: null,
  chatError: "",
  reportCtx: null,
  reportError: "",
  publishError: "",
  publishDraft: null,
  applyError: "",
  applyMessage: "",
  verifyError: "",
  verifyId: "",
  menuOpen: false,
  picker: null,
  phoneStage: null,
  phoneSlide: 0,
  pendingFlow: null,
  postStep: 1,
  postDraft: null,
  postError: "",
  solveDraft: null,
  solveError: "",
  proposalError: "",
  discover: { category: "Ҳама", city: "Ҳамаи шаҳрҳо", online: "all", min: "", max: "", deadline: "", skill: "Ҳама" },
  settings: loadSettings(),
  passwordError: "",
  accountError: "",
  achievement: null,
};

const listeners = new Set();
let toastTimer = 0;
localStorage.setItem(KEY, JSON.stringify(state.data));

function emit() {
  localStorage.setItem(KEY, JSON.stringify(state.data));
  listeners.forEach((fn) => fn(state));
}

export function getState() {
  return state;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function currentUser() {
  return state.data.users.find((user) => user.id === state.data.sessionUserId) || null;
}

function notify(message) {
  if (state.settings?.notifications === false) return;
  state = { ...state, toast: { id: uid(), message } };
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    state = { ...state, toast: null };
    emit();
  }, 3400);
}

export function go(view) {
  const next = VIEWS.includes(view) ? view : "home";
  let data = state.data;
  if (next === "notices" && data.sessionUserId) {
    data = {
      ...data,
      notifications: data.notifications.map((item) => (item.userId === data.sessionUserId ? { ...item, read: true } : item)),
    };
  }
  state = { ...state, data, view: next, menuOpen: false, picker: null };
  history.replaceState(null, "", `${location.pathname}${location.search}#${next}`);
  emit();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function patch(partial) {
  state = { ...state, ...partial };
  emit();
}

let authTimer = 0;

export function openModal(modal) {
  clearTimeout(authTimer);
  state = {
    ...state,
    modal,
    menuOpen: false,
    picker: null,
    authError: "",
    authPhase: null,
    authWelcome: "",
    authPeek: false,
    publishError: "",
    applyError: "",
    verifyError: "",
  };
  emit();
}

export function closeModal() {
  const welcome = state.authPhase === "success";
  const user = currentUser();
  clearTimeout(authTimer);
  state = { ...state, modal: null, picker: null, achievement: null, authPhase: null, authWelcome: "", authPeek: false };
  if (welcome && user) {
    landAfterAuth(user);
    return;
  }
  emit();
}

function primeBadges() {
  const user = currentUser();
  if (!user || user.role !== "student") return;
  if (state.settings.seenReady?.[user.id]) return;
  const progress = progressFor(user, state.data);
  if (!progress) return;
  persistSettings({
    ...state.settings,
    seenReady: { ...state.settings.seenReady, [user.id]: true },
    seenBadges: { ...state.settings.seenBadges, [user.id]: progress.badges.filter((item) => item.ok).map((item) => item.id) },
  });
}

function celebrate() {
  const user = currentUser();
  if (!user || user.role !== "student") return;
  const progress = progressFor(user, state.data);
  if (!progress) return;
  if (!state.settings.seenReady?.[user.id]) {
    primeBadges();
    return;
  }
  const seen = new Set(state.settings.seenBadges?.[user.id] || []);
  const fresh = progress.badges.filter((item) => item.ok && !seen.has(item.id));
  if (!fresh.length) return;
  persistSettings({
    ...state.settings,
    seenBadges: { ...state.settings.seenBadges, [user.id]: [...seen, ...fresh.map((item) => item.id)] },
  });
  state = { ...state, modal: "achievement", achievement: fresh[0] };
}

export function updateSettings(partial) {
  persistSettings({ ...state.settings, ...partial });
  emit();
}

export function changePassword(current, next) {
  const user = currentUser();
  if (!user) return;
  if (String(user.password || "") !== String(current || "")) {
    state = { ...state, passwordError: "Рамзи ҳозира нодуруст аст." };
    emit();
    return;
  }
  if (String(next || "").length < 6) {
    state = { ...state, passwordError: "Рамзи нав ҳадди ақал 6 аломат бошад." };
    emit();
    return;
  }
  updateUser({ password: next });
  state = { ...state, passwordError: "" };
  notify("Рамз иваз шуд.");
  emit();
}

export function login(identity, password) {
  const raw = String(identity || "").trim().toLowerCase();
  const digits = digitsOf(identity);
  const user = state.data.users.find((item) => {
    const emailOk = item.email.toLowerCase() === raw;
    const phoneOk = digits.length >= 9 && digitsOf(item.phone) === digits;
    return (emailOk || phoneOk) && item.password === password;
  });
  state = { ...state, authDraft: { ...state.authDraft, identity, email: raw.includes("@") ? raw : state.authDraft.email, password } };
  if (!user) {
    state = { ...state, authError: "Рамз ё почта нодуруст аст.", authPhase: "error" };
    emit();
    return;
  }
  welcomeUser(user);
}

export function signup(form) {
  const email = String(form.email || "").trim().toLowerCase();
  const phone = String(form.phone || "").trim();
  const phoneDigits = digitsOf(phone);
  const student = form.role !== "employer";
  const skills = Array.isArray(form.skills) ? form.skills : [];
  state = { ...state, authDraft: { ...state.authDraft, ...form, email, phone, skills } };
  if (student && String(form.name || "").trim().length < 3) return failAuth("Ному насабро пурра нависед.");
  if (!student && String(form.org || "").trim().length < 2) return failAuth("Номи ширкатро нависед.");
  if (phoneDigits.length < 9) return failAuth("Рақами телефонро пурра нависед.");
  if (!email.includes("@") || email.startsWith("@") || email.endsWith("@")) return failAuth("Почтаи электрониро дуруст нависед.");
  if (!form.city) return failAuth("Шаҳрро интихоб кунед.");
  if (String(form.password || "").length < 6) return failAuth("Рамз ҳадди ақал 6 аломат бошад.");
  if (student && !skills.length) return failAuth("Ақаллан як маҳорат интихоб кунед.");
  if (!student && String(form.about || "").trim().length < 12) return failAuth("Ширкатро мухтасар тавсиф кунед.");
  if (state.data.users.some((user) => user.email.toLowerCase() === email)) return failAuth("Ин почта аллакай бақайд гирифта шудааст.");
  if (state.data.users.some((user) => digitsOf(user.phone) === phoneDigits)) return failAuth("Ин рақам аллакай бақайд гирифта шудааст.");
  const company = student ? "" : form.org.trim();
  const user = {
    id: uid(),
    role: student ? "student" : "employer",
    name: student ? form.name.trim() : company,
    email,
    password: form.password,
    city: form.city,
    phone,
    about: student ? "" : form.about.trim(),
    bio: student ? "" : form.about.trim(),
    verified: false,
    skills: student ? skills : [],
    availability: emptyWeek(),
    experience: 0,
    university: student ? String(form.university || "").trim() : "",
    studentId: "",
    company,
    hue: 140 + Math.floor(Math.random() * 80),
  };
  state = {
    ...state,
    data: { ...state.data, users: [...state.data.users, user] },
  };
  welcomeUser(user);
}

function welcomeUser(user) {
  const hello = String(user.name || "").trim().split(/\s+/)[0] || "меҳмон";
  const animated = state.modal === "login" || state.modal === "signup";
  if (!animated) {
    state = {
      ...state,
      data: { ...state.data, sessionUserId: user.id },
      modal: null,
      authError: "",
      authPhase: null,
      authWelcome: "",
    };
    primeBadges();
    celebrate();
    notify(`Хуш омадед, ${hello}!`);
    landAfterAuth(user);
    return;
  }
  state = {
    ...state,
    data: { ...state.data, sessionUserId: user.id },
    authError: "",
    authPhase: "success",
    authWelcome: hello,
  };
  primeBadges();
  emit();
  clearTimeout(authTimer);
  authTimer = setTimeout(() => {
    if (state.authPhase !== "success") return;
    const live = currentUser();
    state = { ...state, modal: null, authPhase: null, authWelcome: "" };
    celebrate();
    notify(`Хуш омадед, ${hello}!`);
    if (live) landAfterAuth(live);
  }, 1200);
}

function landAfterAuth(user) {
  const flow = state.pendingFlow;
  state = { ...state, pendingFlow: null };
  if (flow === "find" || flow === "post" || flow === "solve") {
    if (flow === "post") state = { ...state, postStep: 1, postDraft: null, postError: "" };
    go(flow);
    return;
  }
  go(user.role === "employer" ? "employerDash" : user.role === "admin" ? "safety" : "studentDash");
}

function failAuth(message) {
  state = { ...state, authError: message, authPhase: "error" };
  emit();
}

export function logout() {
  state = { ...state, data: { ...state.data, sessionUserId: null } };
  notify("Шумо аз ҳисоб баромадед.");
  go("home");
}

export function updateUser(patchUser) {
  const user = currentUser();
  if (!user) return;
  state = {
    ...state,
    data: {
      ...state.data,
      users: state.data.users.map((item) => (item.id === user.id ? { ...item, ...patchUser } : item)),
    },
  };
  emit();
}

export function openPublish(location = "") {
  const user = currentUser();
  state = { ...state, publishLocation: location, publishError: "", publishDraft: null };
  if (!user) {
    notify("Барои иловаи кор аввал ворид шавед.");
    openModal("login");
    return;
  }
  if (user.role !== "employer") {
    notify("Ин бахш барои корфармоён аст. Бо ҳисоби корфармо ворид шавед.");
    emit();
    return;
  }
  openModal("publish");
}

export function publishJob(input) {
  const user = currentUser();
  if (!user || user.role !== "employer") return;
  if (input.title.trim().length < 4) return failPublish(input, "Номи корро равшантар нависед.");
  if (!input.payAmount || Number(input.payAmount) <= 0) return failPublish(input, "Маблағи пардохтро нависед.");
  if (!input.date) return failPublish(input, "Санаро интихоб кунед.");
  if (input.timeEnd <= input.timeStart) return failPublish(input, "Вақти анҷом бояд баъд аз оғоз бошад.");
  if (input.description.trim().length < 12) return failPublish(input, "Тавсифро каме пурратар нависед.");
  const job = {
    id: uid(),
    employerId: user.id,
    status: "open",
    createdAt: Date.now(),
    ...input,
    title: input.title.trim(),
    description: input.description.trim(),
    payAmount: Number(input.payAmount),
    vip: Boolean(input.vip),
    rush: Boolean(input.rush),
  };
  state = {
    ...state,
    data: { ...state.data, jobs: [job, ...state.data.jobs] },
    freshJobId: job.id,
    modal: null,
    filters: { q: "", location: "Ҳамаи шаҳрҳо", category: "Ҳама" },
  };
  notify("Кор ба рӯйхати фаъол илова шуд.");
  go("jobs");
  setTimeout(() => {
    if (state.freshJobId === job.id) {
      state = { ...state, freshJobId: null };
      emit();
    }
  }, 5000);
}

function failPublish(draft, message) {
  state = { ...state, publishDraft: draft, publishError: message };
  emit();
}

export function openApply(jobId) {
  const user = currentUser();
  const job = state.data.jobs.find((item) => item.id === jobId);
  state = { ...state, activeJobId: jobId, applyError: "", applyMessage: "" };
  if (!user) {
    notify("Барои ариза аввал ворид шавед.");
    openModal("login");
    return;
  }
  if (user.role !== "student") {
    notify("Танҳо донишҷӯён метавонанд ариза диҳанд.");
    emit();
    return;
  }
  if (!job || !isOpenStatus(job.status)) {
    notify(job?.status === "filled" ? "Ин ҷой аллакай пур шудааст." : "Ин кор дастрас нест.");
    emit();
    return;
  }
  openModal("apply");
}

export function applyToJob(jobId, message) {
  const user = currentUser();
  if (!user || user.role !== "student") return;
  if (state.data.applications.some((item) => item.jobId === jobId && item.studentId === user.id)) {
    state = { ...state, applyError: "Шумо ба ин кор аллакай дархост фиристодаед." };
    emit();
    return;
  }
  const application = {
    id: uid(),
    jobId,
    studentId: user.id,
    message: message.trim(),
    status: "pending",
    createdAt: Date.now(),
  };
  const job = state.data.jobs.find((item) => item.id === jobId);
  state = {
    ...state,
    data: {
      ...state.data,
      applications: [application, ...state.data.applications],
      notifications: [note(job?.employerId, `${user.name} ба «${job?.title || "кор"}» ариза дод.`), ...state.data.notifications],
    },
    modal: null,
  };
  notify("Дархост фиристода шуд. Корфармо онро мебинад.");
  celebrate();
  emit();
}

export function setApplicationStatus(appId, status) {
  const user = currentUser();
  const app = state.data.applications.find((item) => item.id === appId);
  const job = state.data.jobs.find((item) => item.id === app?.jobId);
  if (!user || !job || job.employerId !== user.id) return;
  let applications = state.data.applications.map((item) => (item.id === appId ? { ...item, status } : item));
  let jobs = state.data.jobs;
  let users = state.data.users;
  if (status === "accepted") {
    applications = applications.map((item) =>
      item.jobId === app.jobId && item.id !== appId && item.status === "pending" ? { ...item, status: "declined" } : item
    );
    jobs = jobs.map((item) => (item.id === app.jobId ? { ...item, status: "filled" } : item));
  }
  let transactions = state.data.transactions;
  let notifications = state.data.notifications;
  const amount = escrowEstimate(job);
  if (status === "accepted") {
    transactions = [
      {
        id: uid(),
        applicationId: app.id,
        jobId: job.id,
        employerId: job.employerId,
        studentId: app.studentId,
        amount,
        type: "hold",
        status: "held",
        createdAt: Date.now(),
      },
      ...transactions,
    ];
    notifications = [note(app.studentId, `Шумо ба «${job.title}» қабул шудед. ${amount} сомонӣ дар ҳисоби махсус аст.`), ...notifications];
  }
  if (status === "declined") {
    notifications = [note(app.studentId, `Ариза ба «${job.title}» рад шуд.`), ...notifications];
  }
  if (status === "completed" && app.status !== "completed") {
    users = users.map((item) => (item.id === app.studentId ? { ...item, experience: (item.experience || 0) + 1 } : item));
    jobs = jobs.map((item) => (item.id === app.jobId ? { ...item, status: "done" } : item));
    transactions = transactions.map((item) => (item.applicationId === app.id && item.type === "hold" ? { ...item, status: "released" } : item));
    transactions = [
      {
        id: uid(),
        applicationId: app.id,
        jobId: job.id,
        employerId: job.employerId,
        studentId: app.studentId,
        amount,
        type: "release",
        status: "released",
        createdAt: Date.now(),
      },
      ...transactions,
    ];
    notifications = [note(app.studentId, `«${job.title}» анҷом ёфт. ${amount} сомонӣ озод шуд. Акнун баҳо диҳед.`), ...notifications];
  }
  state = { ...state, data: { ...state.data, applications, jobs, users, transactions, notifications } };
  const messages = {
    accepted: "Донишҷӯ қабул шуд. Маблағ дар ҳисоби махсус нигоҳ дошта мешавад.",
    declined: "Ариза рад шуд.",
    completed: "Кор анҷом ёфт. Акнун ҳар ду тараф метавонанд баҳо диҳанд.",
  };
  if (messages[status]) notify(messages[status]);
  celebrate();
  emit();
}

export function addRating(comment) {
  const user = currentUser();
  const ctx = state.rateCtx;
  if (!user || !ctx) return;
  if (!state.rateStars) {
    notify("Баҳоро аз 1 то 5 интихоб кунед.");
    return;
  }
  const duplicate = state.data.ratings.some(
    (item) => item.fromId === user.id && item.jobId === ctx.jobId && item.direction === ctx.direction
  );
  if (duplicate) {
    notify("Шумо ба ин кор аллакай баҳо додаед.");
    return;
  }
  const rating = {
    id: uid(),
    fromId: user.id,
    toId: ctx.toId,
    jobId: ctx.jobId,
    stars: state.rateStars,
    comment: comment.trim(),
    direction: ctx.direction,
    createdAt: Date.now(),
  };
  state = {
    ...state,
    data: {
      ...state.data,
      ratings: [rating, ...state.data.ratings],
      notifications: [note(ctx.toId, `${user.name} ба шумо ${state.rateStars} ситора дод.`), ...state.data.notifications],
    },
    modal: null,
  };
  notify("Баҳо сабт шуд. Ташаккур!");
  celebrate();
  emit();
}

export function toggleSave(jobId) {
  const user = currentUser();
  if (!user) {
    notify("Барои захира кардан аввал ворид шавед.");
    openModal("login");
    return;
  }
  if (user.role !== "student") {
    notify("Захира кардан барои донишҷӯён аст.");
    return;
  }
  const saved = state.data.savedJobs;
  const exists = saved.find((item) => item.userId === user.id && item.jobId === jobId);
  const savedJobs = exists ? saved.filter((item) => item !== exists) : [{ id: uid(), userId: user.id, jobId, createdAt: Date.now() }, ...saved];
  state = { ...state, data: { ...state.data, savedJobs } };
  notify(exists ? "Аз захира гирифта шуд." : "Кор захира шуд.");
  celebrate();
  emit();
}

export function openThread(jobId, studentId) {
  const user = currentUser();
  if (!user) {
    notify("Барои паём аввал ворид шавед.");
    openModal("login");
    return;
  }
  state = { ...state, chatThread: { jobId, studentId }, chatError: "", modal: null };
  go("inbox");
}

export function sendMessage(text) {
  const user = currentUser();
  const thread = state.chatThread;
  const body = String(text || "").trim();
  if (!user || !thread) return;
  const job = state.data.jobs.find((item) => item.id === thread.jobId);
  if (!job) return;
  const allowed = user.id === thread.studentId || user.id === job.employerId;
  if (!allowed) return;
  if (body.length < 1) {
    state = { ...state, chatError: "Паёмро нависед." };
    emit();
    return;
  }
  const peerId = user.id === thread.studentId ? job.employerId : thread.studentId;
  const message = { id: uid(), jobId: thread.jobId, studentId: thread.studentId, fromId: user.id, body, createdAt: Date.now() };
  state = {
    ...state,
    chatError: "",
    data: {
      ...state.data,
      messages: [...state.data.messages, message],
      notifications: [note(peerId, `${user.name}: ${body.slice(0, 80)}`), ...state.data.notifications],
    },
  };
  emit();
}

export function openReport(kind, id) {
  const user = currentUser();
  if (!user) {
    notify("Барои гузориш аввал ворид шавед.");
    openModal("login");
    return;
  }
  state = { ...state, reportCtx: { kind, id }, reportError: "", modal: "report", menuOpen: false, picker: null };
  emit();
}

export function fileReport(reason) {
  const user = currentUser();
  const ctx = state.reportCtx;
  const text = String(reason || "").trim();
  if (!user || !ctx) return;
  if (text.length < 8) {
    state = { ...state, reportError: "Сабабро каме равшантар нависед." };
    emit();
    return;
  }
  const report = { id: uid(), fromId: user.id, kind: ctx.kind, targetId: ctx.id, reason: text, createdAt: Date.now() };
  state = {
    ...state,
    data: { ...state.data, reports: [report, ...state.data.reports] },
    modal: null,
    reportError: "",
  };
  notify("Гузориш қабул шуд. Он дар саҳифаи бехатарӣ нигоҳ дошта мешавад.");
  emit();
}

export function resetDemo() {
  localStorage.removeItem(KEY);
  state = {
    ...state,
    data: ensureCollections(seedState()),
    modal: null,
    filters: { q: "", location: "Ҳамаи шаҳрҳо", category: "Ҳама" },
  };
  notify("Маълумоти намунавӣ аз нав бор шуд.");
  go("home");
}

export function verifyStudent(studentId) {
  const pattern = /^[A-Za-zА-Яа-яЁёӢӣӮӯҲҳҚқҒғҶҷ-]{2,10}-\d{4}-\d{3,6}$/;
  if (!pattern.test(studentId.trim())) {
    state = { ...state, verifyId: studentId, verifyError: "Намуна: ДМТ-2024-1842" };
    emit();
    return;
  }
  updateUser({ verified: true, studentId: studentId.trim() });
  celebrate();
  notify("Донишҷӯи тасдиқшуда");
  emit();
}

function blankPost(user) {
  const now = new Date();
  const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  return {
    title: "",
    description: "",
    category: "СММ & Дизайн",
    skills: [],
    budget: "",
    payType: "fixed",
    deadline: today,
    online: true,
    city: user?.city || "Душанбе",
  };
}

export function startFlow(flow) {
  const user = currentUser();
  if (!user) {
    state = { ...state, pendingFlow: flow };
    notify("Барои ин кор аввал ворид шавед. Ҳамон ҳисоб ҳам донишҷӯ ва ҳам фармоишгар мемонад.");
    openModal("login");
    return;
  }
  if (flow === "post") state = { ...state, postStep: 1, postDraft: blankPost(user), postError: "" };
  if (flow === "solve") state = { ...state, solveDraft: null, solveError: "" };
  go(flow);
}

export function setDiscover(partial) {
  state = { ...state, discover: { ...state.discover, ...partial } };
  emit();
}

export function savePost(input, step) {
  const user = currentUser();
  if (!user) return startFlow("post");
  const draft = { ...(state.postDraft || blankPost(user)), ...input, skills: state.postDraft?.skills || [] };
  if (step === 2) {
    if (String(draft.title || "").trim().length < 4) return failPost(draft, "Номи корро равшантар нависед.");
    if (String(draft.description || "").trim().length < 12) return failPost(draft, "Тавсифро каме пурратар нависед.");
    if (!draft.category) return failPost(draft, "Категорияро интихоб кунед.");
    if (!(draft.skills || []).length) return failPost(draft, "Ақаллан як маҳоратро интихоб кунед.");
  }
  if (step === 3) {
    if (!draft.budget || Number(draft.budget) <= 0) return failPost(draft, "Буҷетро нависед.");
    if (!draft.deadline) return failPost(draft, "Мӯҳлатро интихоб кунед.");
    if (!draft.online && !draft.city) return failPost(draft, "Шаҳрро интихоб кунед.");
  }
  state = { ...state, postDraft: draft, postStep: step, postError: "" };
  emit();
}

function failPost(draft, message) {
  state = { ...state, postDraft: draft, postError: message };
  emit();
}

export function togglePostSkill(skill) {
  const user = currentUser();
  const draft = { ...(state.postDraft || blankPost(user)) };
  const skills = new Set(draft.skills || []);
  if (skills.has(skill)) skills.delete(skill);
  else skills.add(skill);
  state = { ...state, postDraft: { ...draft, skills: [...skills] } };
  emit();
}

export function publishPosted() {
  const user = currentUser();
  const draft = state.postDraft;
  if (!user || !draft) return;
  if (String(draft.title || "").trim().length < 4) return failPost(draft, "Номи корро равшантар нависед.");
  if (!draft.budget || Number(draft.budget) <= 0) return failPost(draft, "Буҷетро нависед.");
  if (!draft.deadline) return failPost(draft, "Мӯҳлатро интихоб кунед.");
  const job = {
    id: uid(),
    employerId: user.id,
    status: "published",
    createdAt: Date.now(),
    title: draft.title.trim(),
    description: draft.description.trim(),
    category: draft.category,
    skills: draft.skills || [],
    payAmount: Number(draft.budget),
    payType: draft.payType === "hourly" ? "hourly" : "fixed",
    deadline: draft.deadline,
    date: draft.deadline,
    timeStart: "09:00",
    timeEnd: "18:00",
    online: Boolean(draft.online),
    location: draft.online ? "Онлайн" : draft.city,
    vip: false,
    rush: false,
  };
  state = {
    ...state,
    data: { ...state.data, jobs: [job, ...state.data.jobs] },
    freshJobId: job.id,
    postError: "",
    filters: { q: "", location: "Ҳамаи шаҳрҳо", category: "Ҳама" },
  };
  notify("Кор нашр шуд ва дар бозор пайдо шуд.");
  go("jobs");
}

export function detectProblem(text, fileName = "") {
  const user = currentUser();
  if (!user) return startFlow("solve");
  const clean = String(text || "").trim();
  if (clean.length < 8) {
    state = { ...state, solveError: "Коратонро каме равшантар нависед." };
    emit();
    return;
  }
  const draft = understandRequest(clean, user.city);
  const attached = String(fileName || "").trim();
  if (attached) draft.fileName = attached;
  state = { ...state, solveError: "", solveDraft: draft };
  emit();
}

function solvedJob(user, draft, studentId) {
  const fileNote = draft.fileName ? `\nФайл: ${draft.fileName}` : "";
  return {
    id: draft.jobId || uid(),
    employerId: user.id,
    status: "published",
    createdAt: Date.now(),
    title: String(draft.title || "").trim(),
    description: `${String(draft.text || "").trim()}${fileNote}`,
    category: draft.category,
    skills: draft.skills || [],
    payAmount: Number(draft.budget),
    payType: draft.payType === "hourly" ? "hourly" : "fixed",
    deadline: draft.deadline,
    date: draft.deadline,
    timeStart: "09:00",
    timeEnd: "18:00",
    online: Boolean(draft.online),
    location: draft.online ? "Онлайн" : draft.city,
    vip: false,
    rush: false,
    invitedStudentId: studentId || null,
  };
}

export function chooseStudent(studentId) {
  const user = currentUser();
  const draft = state.solveDraft;
  const student = state.data.users.find((item) => item.id === studentId && item.role === "student");
  if (!user || !draft || !student) return;
  if (student.id === user.id) {
    notify("Худро интихоб карда наметавонед.");
    return;
  }
  if (!draft.budget || Number(draft.budget) <= 0 || !draft.deadline) {
    notify("Буҷет ва мӯҳлатро санҷед, баъд интихоб кунед.");
    return;
  }
  if (draft.chosenId === student.id && draft.jobId) {
    notify(`${student.name} аллакай интихоб шудааст.`);
    return;
  }
  const job = solvedJob(user, draft, student.id);
  const jobs = draft.jobId
    ? state.data.jobs.map((item) => (item.id === draft.jobId ? { ...item, ...job, id: item.id, createdAt: item.createdAt } : item))
    : [job, ...state.data.jobs];
  const notifications = [note(student.id, `${employerName(user)} шуморо барои «${job.title}» интихоб кард.`), ...state.data.notifications];
  state = {
    ...state,
    data: { ...state.data, jobs, notifications },
    solveDraft: { ...draft, jobId: job.id, chosenId: student.id },
    freshJobId: job.id,
  };
  notify(`${student.name} интихоб шуд. Кор ба ӯ фиристода шуд.`);
  emit();
}

export function updateSolve(partial) {
  if (!state.solveDraft) return;
  state = { ...state, solveDraft: { ...state.solveDraft, ...partial } };
  emit();
}

export function toggleSolveSkill(skill) {
  if (!state.solveDraft) return;
  const skills = new Set(state.solveDraft.skills || []);
  if (skills.has(skill)) skills.delete(skill);
  else skills.add(skill);
  updateSolve({ skills: [...skills] });
}

export function publishSolved() {
  const draft = state.solveDraft;
  if (!draft) return;
  if (draft.jobId) {
    notify("Ин кор аллакай нашр шудааст.");
    go("jobs");
    return;
  }
  state = {
    ...state,
    postDraft: {
      title: draft.title,
      description: `${draft.text || ""}${draft.fileName ? `\nФайл: ${draft.fileName}` : ""}`,
      category: draft.category,
      skills: draft.skills || [],
      budget: draft.budget,
      payType: draft.payType,
      deadline: draft.deadline,
      online: draft.online,
      city: draft.city,
    },
    postStep: 3,
    postError: "",
  };
  publishPosted();
}

export function openProposal(jobId) {
  const user = currentUser();
  const job = state.data.jobs.find((item) => item.id === jobId);
  state = { ...state, activeJobId: jobId, proposalError: "" };
  if (!user) {
    state = { ...state, pendingFlow: "find" };
    notify("Барои пешниҳод аввал ворид шавед.");
    openModal("login");
    return;
  }
  if (!job || !isOpenStatus(job.status)) {
    notify("Ин кор барои пешниҳод кушода нест.");
    emit();
    return;
  }
  if (job.employerId === user.id) {
    notify("Ба кори худатон пешниҳод фиристода намешавад.");
    emit();
    return;
  }
  openModal("proposal");
}

export function sendProposal(input) {
  const user = currentUser();
  const jobId = state.activeJobId;
  const job = state.data.jobs.find((item) => item.id === jobId);
  if (!user || !job || !isOpenStatus(job.status) || job.employerId === user.id) return;
  const price = Number(input.price);
  const eta = String(input.eta || "").trim();
  const message = String(input.message || "").trim();
  if (!price || price <= 0) {
    state = { ...state, proposalError: "Нархи пешниҳодиро нависед." };
    emit();
    return;
  }
  if (eta.length < 2) {
    state = { ...state, proposalError: "Мӯҳлати иҷроро нависед." };
    emit();
    return;
  }
  if (message.length < 8) {
    state = { ...state, proposalError: "Паёми кӯтоҳро нависед." };
    emit();
    return;
  }
  if (state.data.applications.some((item) => item.jobId === jobId && item.studentId === user.id)) {
    state = { ...state, proposalError: "Шумо ба ин кор аллакай пешниҳод фиристодаед." };
    emit();
    return;
  }
  const application = {
    id: uid(),
    jobId,
    studentId: user.id,
    message,
    price,
    eta,
    kind: "proposal",
    status: "pending",
    createdAt: Date.now(),
  };
  state = {
    ...state,
    data: {
      ...state.data,
      applications: [application, ...state.data.applications],
      notifications: [note(job.employerId, `${user.name} ба «${job.title}» пешниҳоди ${price} сомонӣ фиристод.`), ...state.data.notifications],
    },
    modal: null,
    proposalError: "",
  };
  notify("Пешниҳод фиристода шуд. Фармоишгар онро дар кабинет мебинад.");
  celebrate();
  emit();
}

primeBadges();
