function dayKey(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function longestStreak(days) {
  const list = [...days].sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  let prev = null;
  list.forEach((day) => {
    run = prev != null && day - prev === 86400000 ? run + 1 : 1;
    prev = day;
    if (run > best) best = run;
  });
  return best;
}

function currentStreak(days) {
  const today = dayKey(Date.now());
  let cursor = days.has(today) ? today : today - 86400000;
  if (!days.has(cursor)) return 0;
  let count = 0;
  while (days.has(cursor)) {
    count += 1;
    cursor -= 86400000;
  }
  return count;
}

export function progressFor(user, data) {
  if (!user || user.role !== "student") return null;
  const applications = (data.applications || []).filter((item) => item.studentId === user.id);
  const done = applications.filter((item) => item.status === "completed");
  const ratings = (data.ratings || []).filter((item) => item.toId === user.id);
  const saved = (data.savedJobs || []).filter((item) => item.userId === user.id);
  const five = ratings.some((item) => item.stars >= 5);
  const days = new Set(applications.map((item) => dayKey(item.createdAt || Date.now())));
  const streak = currentStreak(days);
  const bestStreak = longestStreak(days);
  const xp = done.length * 80 + applications.length * 25 + ratings.length * 20 + saved.length * 8 + (user.verified ? 40 : 0) + (user.experience || 0) * 6;
  const steps = [
    { name: "Новичок", min: 0 },
    { name: "Фаъол", min: 160 },
    { name: "ПРО-Донишҷӯ", min: 420 },
  ];
  const level = [...steps].reverse().find((item) => xp >= item.min) || steps[0];
  const index = steps.findIndex((item) => item.name === level.name);
  const next = steps[index + 1]?.min ?? level.min;
  const span = Math.max(1, next - level.min);
  const pct = index === steps.length - 1 ? 100 : Math.max(0, Math.min(100, Math.round(((xp - level.min) / span) * 100)));
  const badges = [
    { id: "first-step", title: "Қадами аввал", text: "Аввалин ариза фиристода шуд", ok: applications.length >= 1 },
    { id: "finisher", title: "Иҷрошуда", text: "Як кор то охир анҷом ёфт", ok: done.length >= 1 },
    { id: "star", title: "Ситора", text: "Баҳои 5 ситора гирифтед", ok: five },
    { id: "verified", title: "Тасдиқ", text: "Профили донишҷӯ тасдиқ шуд", ok: Boolean(user.verified) },
    { id: "saver", title: "Захира", text: "Се кор захира шуд", ok: saved.length >= 3 },
    { id: "streak", title: "Пайдарпай", text: "Ду рӯз пайиҳам фаъол будед", ok: streak >= 2 || bestStreak >= 2 },
  ];
  return { xp, level: level.name, pct, next, streak, bestStreak, badges, done: done.length, apps: applications.length };
}
