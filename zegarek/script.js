function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function getDaysInYear(year) {
  return new Date(year, 1, 29).getMonth() === 1 ? 366 : 365;
}

function capitalizeFirst(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Numer tygodnia ISO: poniedziałek jako początek tygodnia
function getISOWeek(date) {
  const tempDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = tempDate.getUTCDay() || 7;

  tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNumber);

  const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil((((tempDate - yearStart) / 86400000) + 1) / 7);

  return weekNumber;
}

function getISOWeeksInYear(year) {
  const dec28 = new Date(Date.UTC(year, 11, 28));
  return getISOWeek(dec28);
}

function getISOWeekYear(date) {
  const tempDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = tempDate.getUTCDay() || 7;

  tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNumber);

  return tempDate.getUTCFullYear();
}

function updateClock() {
  const now = new Date();

  const time = now.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  const date = now.toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const day = getDayOfYear(now);
  const totalDays = getDaysInYear(now.getFullYear());

  const isoWeek = getISOWeek(now);
  const isoWeekYear = getISOWeekYear(now);
  const totalWeeks = getISOWeeksInYear(isoWeekYear);

  document.getElementById("time").textContent = time;
  document.getElementById("date").textContent = capitalizeFirst(date);
  document.getElementById("dayOfYear").textContent = `Dzień ${day} / ${totalDays}`;
  document.getElementById("weekOfYear").textContent = `Tydzień ${isoWeek} / ${totalWeeks} roku`;
}

updateClock();
setInterval(updateClock, 1000);
