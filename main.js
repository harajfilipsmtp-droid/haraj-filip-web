// Header border after scrolling
const header = document.getElementById("header");
const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 10);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

// Smooth scrolling only for in-page links (menu, buttons), not for the whole page
document.addEventListener("click", (e) => {
  const link = e.target.closest('a[href^="#"]');
  const target = link && link.getAttribute("href").length > 1 && document.querySelector(link.getAttribute("href"));
  if (!target) return;
  e.preventDefault();
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  history.pushState(null, "", link.getAttribute("href"));
});

// Fade in elements when they come into view
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);
document.querySelectorAll(".reveal").forEach((el) => {
  // Stagger siblings (cards, steps) so they appear one after another
  // (.reveal--solo blocks appear on their own as you scroll, without a stagger delay)
  const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
  if (!el.classList.contains("reveal--solo")) el.style.transitionDelay = `${siblings.indexOf(el) * 0.1}s`;
  observer.observe(el);
});

// Fill timeline dots as the user scrolls past each step
const steps = document.querySelectorAll("#timeline li");
const updateTimeline = () => {
  const mark = window.innerHeight * 0.6;
  steps.forEach((step) => step.classList.toggle("is-active", step.getBoundingClientRect().top < mark));
};
updateTimeline();
let timelineQueued = false;
window.addEventListener("scroll", () => {
  if (timelineQueued) return;
  timelineQueued = true;
  requestAnimationFrame(() => { updateTimeline(); timelineQueued = false; });
}, { passive: true });

// ---------- Contact form ----------
// Odpovede spracúvajú Netlify Forms (formulár "kontakt" v index.html). Netlify ich
// uloží a pošle e-mailom. Ak odoslanie zlyhá, formulár otvorí e-mailového klienta.
const FORM_ENDPOINT = "/";
const FALLBACK_EMAIL = "harajfilip.co@gmail.com";

const form = document.getElementById("contactForm");
const statusEl = document.getElementById("formStatus");

const setStatus = (text, type) => {
  statusEl.textContent = text;
  statusEl.className = `form__status ${type ? `is-${type}` : ""}`;
};

const validate = () => {
  let ok = true;
  form.querySelectorAll("[required]").forEach((input) => {
    const wrapper = input.closest(".field, .consent");
    const valid = input.type === "checkbox" ? input.checked : input.checkValidity() && input.value.trim() !== "";
    wrapper.classList.toggle("is-invalid", !valid);
    if (!valid) ok = false;
  });
  return ok;
};

form.querySelectorAll("input, textarea").forEach((input) =>
  input.addEventListener("input", () => input.closest(".field, .consent")?.classList.remove("is-invalid"))
);

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (form._gotcha.value) return; // bot
  if (!validate()) {
    setStatus("Vyplňte prosím povinné polia označené *.", "error");
    return;
  }

  const data = new FormData(form);
  const payload = {
    "form-name": "kontakt",
    subject: `Nový dopyt z webu – ${data.get("meno")}`,
    meno: data.get("meno"),
    email: data.get("email"),
    firma: data.get("firma"),
    telefon: data.get("telefon"),
    sluzby: data.getAll("sluzby").join(", "),
    sprava: data.get("sprava"),
    suhlas: "áno",
  };

  const mailtoFallback = () => {
    const body = Object.entries(payload)
      .filter(([k, v]) => v && !["form-name", "subject", "suhlas"].includes(k))
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
    window.location.href = `mailto:${FALLBACK_EMAIL}?subject=${encodeURIComponent(payload.subject)}&body=${encodeURIComponent(body)}`;
  };

  // Opened straight from disk (no server) – fall back to the e-mail client
  if (location.protocol === "file:") return mailtoFallback();

  const button = form.querySelector("button[type=submit]");
  button.disabled = true;
  setStatus("Odosielam…");
  try {
    const res = await fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(payload).toString(),
    });
    if (!res.ok) throw new Error(res.status);
    form.reset();
    setStatus("Ďakujem! Dopyt som dostal a čoskoro sa vám ozvem.", "ok");
  } catch {
    setStatus(`Odoslanie zlyhalo. Napíšte mi prosím priamo na ${FALLBACK_EMAIL}.`, "error");
  } finally {
    button.disabled = false;
  }
});

// ---------- Hero phone: rotates to the right while scrolling ----------
const phone = document.getElementById("phone");
// Build the phone body thickness (layers behind the screen image)
if (phone) {
  const LAYERS = 14;
  for (let i = LAYERS; i >= 1; i--) {
    const edge = document.createElement("span");
    edge.className = `phone__edge${i === LAYERS ? " phone__edge--back" : ""}`;
    edge.style.setProperty("--i", i);
    edge.setAttribute("aria-hidden", "true");
    phone.prepend(edge);
  }
}
if (phone && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const stage = phone.parentElement;
  let ticking = false;
  const updatePhone = () => {
    const rect = stage.getBoundingClientRect();
    // 0 when the page is at the top, 1 once the phone has scrolled ~70 % out of view
    const progress = Math.min(Math.max(window.scrollY / (rect.height * 0.7), 0), 1).toFixed(3);
    if (progress !== stage.style.getPropertyValue("--p")) stage.style.setProperty("--p", progress);
    ticking = false;
  };
  updatePhone();
  window.addEventListener("scroll", () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updatePhone);
    }
  }, { passive: true });
}

// ---------- Live clock on the hero phone ----------
const phoneTime = document.getElementById("phoneTime");
if (phoneTime) {
  const tickClock = () => {
    const now = new Date();
    phoneTime.textContent = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
    phoneTime.dateTime = now.toISOString();
    const lockDate = document.getElementById("lockDate");
    if (lockDate) lockDate.textContent = now.toLocaleDateString("sk-SK", { weekday: "long", day: "numeric", month: "long" });
  };
  tickClock();
  // Re-sync exactly on the next minute, then update every minute
  setTimeout(() => {
    tickClock();
    setInterval(tickClock, 60_000);
  }, (60 - new Date().getSeconds()) * 1000);
}

// ---------- Rotating notifications on the hero phone ----------
// Illustrative numbers showing what the automations report every day.
const notifications = [
  { app: "Dashboard", title: "Denný report tržieb", text: "Včerajšie tržby: 4 820 € · +12 % oproti priemeru" },
  { app: "Faktúry", title: "AI spracovala 38 faktúr", text: "36 spárovaných s platbami, 2 čakajú na úhradu" },
  { app: "CRM", title: "7 nových leadov z webu", text: "3 rezervovali hovor na zajtra · 12 reportov vygenerovaných" },
  { app: "WhatsApp bot", title: "Nová rezervácia konzultácie", text: "Klient: Ján K. · status-bot: HOT · e-mail uložený do CRM" },
];
const stack = document.getElementById("notifs");
if (stack) {
  const MAX_VISIBLE = 4;
  const AGES = ["teraz", "pred 1 min", "pred 3 min", "pred 6 min"]; // newest (bottom) → oldest (top)
  let index = 0;

  const build = ({ title, text }) => {
    const wrap = document.createElement("div");
    wrap.className = "notif-wrap";
    wrap.innerHTML = `<div><div class="notif">
      <span class="notif__icon">FH</span>
      <div class="notif__body">
        <div class="notif__row"><p class="notif__title"></p><span class="notif__when"></span></div>
        <p class="notif__text"></p>
      </div></div></div>`;
    wrap.querySelector(".notif__title").textContent = title;
    wrap.querySelector(".notif__text").textContent = text;
    return wrap;
  };

  // New notifications slide in at the bottom (like the iOS lock screen) and push older ones up
  const pushNext = () => {
    const wrap = build(notifications[index]);
    index = (index + 1) % notifications.length;
    stack.append(wrap);
    requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add("is-in")));

    const live = [...stack.children].filter((el) => !el.classList.contains("is-out")).reverse();
    live.forEach((el, i) => {
      if (i < AGES.length) el.querySelector(".notif__when").textContent = AGES[i];
    });
    // Drop the oldest (top) once more than 4 are on screen
    live.slice(MAX_VISIBLE).forEach((el) => {
      el.classList.add("is-out");
      setTimeout(() => el.remove(), 600);
    });
  };

  // Only run while the phone is on screen, so it doesn't repaint during the rest of the page
  let timer;
  new IntersectionObserver(([entry]) => {
    clearInterval(timer);
    if (entry.isIntersecting) timer = setInterval(pushNext, 2600);
  }).observe(stack);
  setTimeout(pushNext, 1000);
}

// ---------- MacBook: lid opens with scroll, then a sample automation runs on screen ----------
const mbwrap = document.getElementById("mbwrap");
if (mbwrap) {
  const mb = document.getElementById("mb");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ease = (x) => 1 - Math.pow(1 - x, 3);
  const stage = mbwrap.querySelector(".mbwrap__sticky");
  const label = mbwrap.querySelector(".mbwrap__label");
  let open = -1;

  const onLid = () => {
    const r = mbwrap.getBoundingClientRect();
    // 0 when the stage pins to the top, 1 after ~55 % of the pinned scroll distance.
    // The stage height (100svh) is used instead of innerHeight, which jumps on phones as the address bar hides.
    const progress = Math.min(Math.max(-r.top / ((r.height - stage.offsetHeight) * 0.55), 0), 1);
    const next = reduce ? 1 : Math.round(ease(progress) * 1000) / 1000;
    if (next !== open) {
      open = next;
      mb.style.setProperty("--open", open);
      label.style.setProperty("--open", open);
    }
    // Run the screen animation only while the section is actually on screen
    const inView = r.bottom > 0 && r.top < window.innerHeight;
    if (open > 0.97 && inView) startApp(); else stopApp();
  };

  const invoices = [
    { sup: "Stavmat s.r.o.", sum: "1 240,00 €", due: "24. 10. 2026", vs: "2026104" },
    { sup: "DrevoTrade s.r.o.", sum: "3 870,50 €", due: "30. 10. 2026", vs: "1100482" },
    { sup: "Kancel Pro a.s.", sum: "212,30 €", due: "18. 10. 2026", vs: "5520193" },
    { sup: "Elektro Varga", sum: "945,00 €", due: "2. 11. 2026", vs: "8810027" },
  ];
  const app = document.getElementById("app");
  const nodes = [...app.querySelectorAll("[data-node]")];
  const links = [...app.querySelectorAll("[data-link]")];
  const fields = [...app.querySelectorAll("[data-field]")];
  const rows = document.getElementById("appRows");
  const toast = document.getElementById("appToast");
  const saved = document.getElementById("appSaved");
  let timers = [];
  let running = false;
  let index = 0;
  let minutes = 160;

  const at = (ms, fn) => timers.push(setTimeout(fn, ms));
  const activate = (n) => nodes.forEach((node, i) => {
    node.classList.toggle("is-active", i === n);
    node.classList.toggle("is-done", i < n);
  });
  const run = (l) => { links[l].classList.remove("is-run"); void links[l].offsetWidth; links[l].classList.add("is-run"); };
  const type = (el, text, start) => {
    at(start, () => el.classList.add("is-typing"));
    [...text].forEach((_, i) => at(start + i * 35, () => { el.textContent = text.slice(0, i + 1); }));
    at(start + text.length * 35 + 120, () => el.classList.remove("is-typing"));
    return start + text.length * 35 + 160;
  };

  const cycle = () => {
    const inv = invoices[index++ % invoices.length];
    fields.forEach((f) => { f.textContent = ""; });
    toast.classList.remove("is-on");
    activate(0);
    at(700, () => run(0));
    at(1500, () => activate(1));
    let t = 1700;
    fields.forEach((f) => { t = type(f, inv[f.dataset.field], t); });
    at(t + 200, () => run(1));
    let row;
    at(t + 1000, () => {
      activate(2);
      row = document.createElement("li");
      row.className = "is-new";
      row.innerHTML = `<span>${inv.sup}</span><span>${inv.sum}</span><em>Čaká na platbu</em>`;
      rows.prepend(row);
      while (rows.children.length > 4) rows.lastElementChild.remove();
    });
    at(t + 2000, () => run(2));
    at(t + 2800, () => {
      activate(3);
      const em = row.querySelector("em");
      em.textContent = "Zaplatená";
      em.classList.add("is-paid");
      row.classList.remove("is-new");
      toast.classList.add("is-on");
      minutes += 12;
      saved.textContent = `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
    });
    at(t + 4600, () => { activate(4); toast.classList.remove("is-on"); });
    at(t + 5200, cycle);
  };

  function startApp() {
    if (running) return;
    running = true;
    cycle();
  }
  function stopApp() {
    if (!running) return;
    running = false;
    timers.forEach(clearTimeout);
    timers = [];
  }

  let queued = false;
  onLid();
  window.addEventListener("scroll", () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { onLid(); queued = false; });
  }, { passive: true });
  window.addEventListener("resize", onLid);
}

// ---------- Project screenshot sliders ----------
document.querySelectorAll("[data-slider]").forEach((slider) => {
  const item = slider.closest(".gallery__item");
  const slides = [...slider.querySelectorAll(".slider__slide")];
  const dotsEl = item.querySelector(".slider__dots");
  const [prev, next] = item.querySelectorAll(".slider__btn");
  const dots = slides.map((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Snímka ${i + 1}`);
    dot.addEventListener("click", () => goTo(i));
    dotsEl.append(dot);
    return dot;
  });
  const current = () => (slider.clientWidth ? Math.round(slider.scrollLeft / slider.clientWidth) : 0);
  const goTo = (i) => slider.scrollTo({ left: Math.max(0, Math.min(slides.length - 1, i)) * slider.clientWidth });
  const update = () => {
    const i = current();
    dots.forEach((d, k) => d.classList.toggle("is-active", k === i));
    prev.disabled = i === 0;
    next.disabled = i === slides.length - 1;
  };
  prev.addEventListener("click", () => goTo(current() - 1));
  next.addEventListener("click", () => goTo(current() + 1));
  slider.addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });

  // Drag to swipe with the mouse (touch already swipes natively)
  let startX = null, startScroll = 0;
  slider.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse") return;
    startX = e.clientX; startScroll = slider.scrollLeft;
    slider.style.scrollSnapType = "none"; slider.style.scrollBehavior = "auto"; slider.style.cursor = "grabbing";
  });
  window.addEventListener("pointermove", (e) => {
    if (startX !== null) slider.scrollLeft = startScroll - (e.clientX - startX);
  });
  window.addEventListener("pointerup", (e) => {
    if (startX === null) return;
    const moved = e.clientX - startX;
    startX = null;
    slider.style.scrollSnapType = ""; slider.style.scrollBehavior = ""; slider.style.cursor = "";
    const base = Math.round(startScroll / slider.clientWidth);
    goTo(Math.abs(moved) > 40 ? base - Math.sign(moved) : base);
  });

  // Keyboard arrows when the slider is focused
  slider.tabIndex = 0;
  slider.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); goTo(current() + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); goTo(current() - 1); }
  });
  update();
  // Re-sync when the detail panel opens (the slider has no width while closed)
  slider.closest("dialog")?.addEventListener("toggle", update);
  new ResizeObserver(update).observe(slider);
});
