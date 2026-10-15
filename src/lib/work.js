import { avgRating, isAllCities, isOpenStatus, JOB_CATEGORIES, SKILLS } from "./utils.js";

const RULES = [
  {
    category: "СММ & Дизайн",
    skills: ["Дизайн", "СММ"],
    workType: "Дизайн",
    online: true,
    budget: 150,
    payType: "fixed",
    days: 5,
    words: ["логотип", "лого", "logo", "баннер", "banner", "photoshop", "фигма", "figma", "дизайн", "сторис", "пост", "меню", "иллюстра", "расм", "instagram", "инстаграм", "инста", "smm", "смм"],
  },
  {
    category: "Тарҷума",
    skills: ["Тарҷума"],
    workType: "Тарҷума",
    online: true,
    budget: 80,
    payType: "fixed",
    days: 3,
    words: ["тарҷума", "перевод", "translate", "англис", "english", "русӣ", "русск", "тоҷикӣ", "шиноснома"],
  },
  {
    category: "Барномасозӣ",
    skills: ["Барномасозӣ"],
    workType: "Барномасозӣ",
    online: true,
    budget: 250,
    payType: "fixed",
    days: 10,
    words: ["website", "сайт", "сомона", "код", "react", "javascript", "html", "барнома", "приложен"],
  },
  {
    category: "Пешхизмат",
    skills: ["Пешхизмат"],
    workType: "Пешхизмат",
    online: false,
    budget: 30,
    payType: "hourly",
    days: 2,
    words: ["пешхизмат", "официант", "тӯй", "туй", "қаҳвахона", "кассир", "ресторан"],
  },
  {
    category: "Доставка",
    skills: ["Доставка"],
    workType: "Доставка",
    online: false,
    budget: 20,
    payType: "hourly",
    days: 1,
    words: ["доставка", "расондан", "велосипед", "заказ", "фармоишро"],
  },
  {
    category: "Промоутер",
    skills: ["Промоутер"],
    workType: "Промоутер",
    online: false,
    budget: 25,
    payType: "hourly",
    days: 2,
    words: ["промоутер", "реклама", "варақа", "муаррифӣ"],
  },
  {
    category: "Кумакчӣ дар офис",
    skills: ["Кумакчӣ дар офис"],
    workType: "Кори офис",
    online: false,
    budget: 28,
    payType: "hourly",
    days: 3,
    words: ["офис", "excel", "ҳуҷҷат", "котиб", "анбор"],
  },
];

function plusDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function workCategories() {
  return [...JOB_CATEGORIES, "Барномасозӣ"];
}

export function understandRequest(text, city = "Душанбе") {
  const raw = String(text || "").replace(/\s+/g, " ").trim();
  const hay = raw.toLowerCase();
  const rule = RULES.find((item) => item.words.some((word) => hay.includes(word))) || {
    category: "Кумакчӣ дар офис",
    skills: ["Кумакчӣ дар офис"],
    workType: "Кори умумӣ",
    online: true,
    budget: 50,
    payType: "fixed",
    days: 7,
    words: [],
  };
  const title = raw.length >= 8 ? raw.replace(/[.!?]+$/, "").slice(0, 90) : rule.workType;
  return {
    text: raw,
    title,
    category: rule.category,
    skills: [...rule.skills],
    workType: rule.workType,
    online: rule.online,
    budget: rule.budget,
    payType: rule.payType,
    deadline: plusDays(rule.days),
    city: city || "Душанбе",
    matched: rule.words.length > 0,
  };
}

export function jobSkills(job) {
  if (Array.isArray(job.skills) && job.skills.length) return job.skills;
  return [];
}

export function jobOnline(job) {
  return job.online === true || job.location === "Онлайн";
}

export function jobDeadline(job) {
  return job.deadline || job.date || "";
}

export function filterDiscovery(jobs, users, filters = {}) {
  const category = filters.category || "Ҳама";
  const city = filters.online === "online" ? "Ҳамаи шаҳрҳо" : filters.city || "Ҳамаи шаҳрҳо";
  return jobs.filter((job) => {
    if (job.status === "done") return false;
    if (!isOpenStatus(job.status) && job.status !== "filled") return false;
    if (category !== "Ҳама" && job.category !== category) return false;
    if (!isAllCities(city) && job.location !== city && !jobOnline(job)) return false;
    if (filters.online === "online" && !jobOnline(job)) return false;
    if (filters.online === "place" && jobOnline(job)) return false;
    const pay = Number(job.payAmount) || 0;
    if (filters.min !== "" && filters.min != null && Number(filters.min) > 0 && pay < Number(filters.min)) return false;
    if (filters.max !== "" && filters.max != null && Number(filters.max) > 0 && pay > Number(filters.max)) return false;
    if (filters.deadline && jobDeadline(job) && jobDeadline(job) > filters.deadline) return false;
    if (filters.skill && filters.skill !== "Ҳама") {
      const skills = jobSkills(job);
      const hit = skills.includes(filters.skill) || job.category === filters.skill;
      if (!hit) return false;
    }
    return true;
  });
}

function fitPercent(hits, avg, experience, wantedCount) {
  const skill = Math.min(hits / (wantedCount || 1), 1);
  const stars = (avg || 0) / 5;
  const exp = Math.min((experience || 0) / 12, 1);
  const raw = Math.round(skill * 72 + stars * 18 + exp * 10);
  if (!hits) return Math.max(32, Math.min(58, raw));
  return Math.max(64, Math.min(99, raw));
}

export function matchStudents(users, ratings, detected) {
  const wanted = new Set(detected?.skills || []);
  const ranked = users
    .filter((user) => user.role === "student")
    .map((student) => {
      const overlap = (student.skills || []).filter((skill) => wanted.has(skill));
      const rating = avgRating(ratings, student.id);
      let score = overlap.length * 50 + (rating.avg || 0) * 6 + Math.min(student.experience || 0, 15);
      if (!detected?.online && detected?.city && student.city === detected.city) score += 20;
      const fit = fitPercent(overlap.length, rating.avg, student.experience, wanted.size);
      return { student, score, overlap, rating, fit, near: overlap.length === 0 };
    })
    .sort((a, b) => b.score - a.score || b.fit - a.fit || b.rating.avg - a.rating.avg);
  const exact = ranked.filter((item) => item.overlap.length);
  return (exact.length ? exact : ranked.slice(0, 3)).slice(0, 6);
}

export function responseRate(user, data) {
  if (!user) return null;
  const apps = (data.applications || []).filter((item) => {
    const job = data.jobs.find((entry) => entry.id === item.jobId);
    return job && job.employerId === user.id;
  });
  if (!apps.length) return null;
  const answered = apps.filter((item) => item.status !== "pending").length;
  return Math.round((answered / apps.length) * 100);
}

export function completedCount(user, data) {
  if (!user) return 0;
  return (data.applications || []).filter((item) => item.studentId === user.id && item.status === "completed").length;
}

export function skillChoices() {
  return [...SKILLS, "Промоутер", "Кумакчӣ дар офис"].filter((skill, index, list) => list.indexOf(skill) === index);
}
