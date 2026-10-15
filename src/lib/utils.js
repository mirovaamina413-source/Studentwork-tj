export const CATEGORIES = [
  "Ҳама",
  "Промоутер",
  "Пешхизмат",
  "СММ & Дизайн",
  "Тарҷума",
  "Кумакчӣ дар офис",
  "Доставка",
];

export const JOB_CATEGORIES = CATEGORIES.filter((item) => item !== "Ҳама");

const MORE_CITIES = [
  "Абдураҳмони Ҷомӣ", "Айнӣ", "Ашт", "Балҷувон", "Бобоҷон Ғафуров", "Бохтар", "Бустон",
  "Ваҳдат", "Варзоб", "Вахш", "Данғара", "Дустӣ", "Ёвон", "Зафаробод", "Истаравшан",
  "Истиқлол", "Исфара", "Ишкошим", "Конибодом", "Кӯлоб", "Қубодиён", "Лахш",
  "Муминобод", "Мурғоб", "Норак", "Нуробод", "Панҷ", "Панҷакент", "Рашт", "Роғун",
  "Роштқалъа", "Рӯдакӣ", "Рӯшон", "Сангвор", "Спитамен", "Темурмалик", "Тоҷикобод",
  "Турсунзода", "Файзобод", "Фархор", "Ҳисор", "Хоруғ", "Хуросон", "Шаҳринав", "Шаҳритӯс", "Ҷомӣ",
];

export const LOCATIONS = ["Душанбе", "Хуҷанд", ...MORE_CITIES.sort((a, b) => a.localeCompare(b, "tg"))];

export function isAllCities(value) {
  return !value || value === "Ҳама шаҳрҳо" || value === "Ҳамаи шаҳрҳо";
}

export function selectedCities(value) {
  if (isAllCities(value)) return [];
  return String(value).split("|").map((city) => city.trim()).filter(Boolean);
}

export const SKILLS = ["Тарҷума", "Барномасозӣ", "Дизайн", "Пешхизмат", "Доставка", "СММ"];

export const DAYS = [
  { id: "mon", label: "Душанбе", short: "Дш" },
  { id: "tue", label: "Сешанбе", short: "Сш" },
  { id: "wed", label: "Чоршанбе", short: "Чш" },
  { id: "thu", label: "Панҷшанбе", short: "Пш" },
  { id: "fri", label: "Ҷумъа", short: "Ҷм" },
  { id: "sat", label: "Шанбе", short: "Шн" },
  { id: "sun", label: "Якшанбе", short: "Яш" },
];

export const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

export const VIEWS = ["home", "jobs", "find", "post", "solve", "courses", "tasks", "employers", "students", "rankings", "studentDash", "employerDash", "safety", "inbox", "notices", "settings"];

export const VIP_PIN_FEE = 20;

export const ESCROW_TEXT = "Пул дар ҳисоби махсус нигоҳ дошта мешавад то иҷрои кор";

export function emptyWeek() {
  return { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function todayId() {
  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date().getDay()];
}

export function initials(name = "") {
  const parts = name.trim().split(/\s+/);
  return `${parts[0]?.[0] || ""}${parts[1]?.[0] || ""}`.toUpperCase();
}

export function formatMoney(value) {
  const number = Math.round(Number(value) * 100) / 100;
  if (!Number.isFinite(number)) return "0";
  return Number.isInteger(number) ? String(number) : number.toFixed(2);
}

export function payLabel(job) {
  const amount = formatMoney(job.payAmount);
  return job.payType === "hourly" ? `${amount} сомонӣ/соат` : `${amount} сомонӣ/кор`;
}

export function formatDate(iso) {
  if (!iso) return "";
  const [year, month, day] = String(iso).split("-");
  if (!day) return iso;
  return `${day}.${month}.${year}`;
}

export function feeRate(vip, rush) {
  if (vip) return 0.05;
  if (rush) return 0.1;
  return 0.08;
}

export function feePercentLabel(rate) {
  return `${Math.round(rate * 100)}%`;
}

export function avgRating(ratings, userId) {
  const list = ratings.filter((item) => item.toId === userId);
  if (!list.length) return { avg: 0, count: 0 };
  const avg = list.reduce((sum, item) => sum + item.stars, 0) / list.length;
  return { avg, count: list.length };
}

export function directionAverage(ratings, direction) {
  const list = ratings.filter((item) => item.direction === direction);
  if (!list.length) return { avg: 0, count: 0 };
  const avg = list.reduce((sum, item) => sum + item.stars, 0) / list.length;
  return { avg, count: list.length };
}

export function formatStars(avg, count) {
  if (!count) return "Нав";
  return `${avg.toFixed(1)} ★`;
}

export function levelFor(experience) {
  const total = experience || 0;
  if (total >= 8) return { name: "ПРО-Донишҷӯ", hint: "Сатҳи баланд" };
  if (total >= 3) return { name: "Фаъол", hint: "Дар роҳи касб" };
  return { name: "Новичок", hint: "Қадами аввал" };
}

export function rangeLabel(hours) {
  if (!hours?.length) return "";
  const list = [...hours].sort((a, b) => a - b);
  const ranges = [];
  let start = list[0];
  let prev = list[0];
  for (let index = 1; index <= list.length; index += 1) {
    if (list[index] === prev + 1) {
      prev = list[index];
      continue;
    }
    const from = `${String(start).padStart(2, "0")}:00`;
    const to = `${String(prev + 1).padStart(2, "0")}:00`;
    ranges.push(`${from}–${to}`);
    start = list[index];
    prev = list[index];
  }
  return ranges.join(", ");
}

export function summarizeAvailability(availability = {}) {
  return DAYS.map((day) => {
    const label = rangeLabel(availability[day.id]);
    return label ? `${day.label}: ${label}` : null;
  }).filter(Boolean);
}

export function isFreeToday(user) {
  return (user?.availability?.[todayId()] || []).length > 0;
}

export function todayWindow(user) {
  return rangeLabel(user?.availability?.[todayId()] || []);
}

export function completeness(user) {
  if (!user || user.role !== "student") return 0;
  let score = 25;
  if (user.university) score += 15;
  if (user.bio && user.bio.length > 20) score += 15;
  if (user.skills?.length) score += 15;
  if (Object.values(user.availability || {}).some((hours) => hours?.length)) score += 15;
  if (user.verified) score += 15;
  return Math.min(100, score);
}

export function badgesFor(user, ratings) {
  if (!user || user.role !== "student") return [];
  const { avg, count } = avgRating(ratings, user.id);
  const items = [];
  if (user.verified) items.push({ id: "verified", label: "Донишҷӯи тасдиқшуда" });
  if (count >= 1 && avg >= 4.8) items.push({ id: "top", label: "Беҳтарин баҳо" });
  if ((user.skills || []).length >= 3) items.push({ id: "skills", label: "Маҳоратҳои гуногун" });
  if (isFreeToday(user)) items.push({ id: "free", label: "Имрӯз озод" });
  return items;
}

export function employerName(user) {
  if (!user) return "Корфармо";
  return user.company || user.name;
}

export function isOpenStatus(status) {
  return status === "open" || status === "published";
}

export function filterJobs(jobs, users, filters) {
  const query = (filters.q || "").trim().toLowerCase();
  return jobs.filter((job) => {
    if (job.status === "done") return false;
    if (filters.category && filters.category !== "Ҳама" && job.category !== filters.category) return false;
    const cities = selectedCities(filters.location);
    if (cities.length && !cities.includes(job.location)) return false;
    if (filters.pay && job.payType !== filters.pay) return false;
    if (!query) return true;
    const employer = users.find((user) => user.id === job.employerId);
    const blob = `${job.title} ${job.description} ${job.category} ${job.location} ${employer?.company || ""} ${employer?.name || ""}`.toLowerCase();
    return blob.includes(query);
  });
}

export function sortJobs(list, mode) {
  const copy = [...list];
  if (mode === "pay") copy.sort((a, b) => b.payAmount - a.payAmount || b.createdAt - a.createdAt);
  else if (mode === "new") copy.sort((a, b) => b.createdAt - a.createdAt);
  else copy.sort((a, b) => Number(b.vip) - Number(a.vip) || b.createdAt - a.createdAt);
  return copy;
}

export function escrowEstimate(job) {
  if (job.payType === "fixed") return Number(job.payAmount) || 0;
  return (Number(job.payAmount) || 0) * 4;
}

export function portfolioFor(user, applications, jobs) {
  if (!user) return [];
  return applications
    .filter((item) => item.studentId === user.id && item.status === "completed")
    .map((item) => {
      const job = jobs.find((entry) => entry.id === item.jobId);
      return job
        ? {
            id: item.id,
            title: job.title,
            category: job.category,
            pay: payLabel(job),
            date: job.date,
            location: job.location,
          }
        : null;
    })
    .filter(Boolean);
}
