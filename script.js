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
  const total = getDaysInYear(now.getFullYear());

  document.getElementById("time").textContent = time;
  document.getElementById("date").textContent = capitalizeFirst(date);
  document.getElementById("dayOfYear").textContent = `Dzień ${day} / ${total}`;
}

updateClock();
setInterval(updateClock, 1000);
