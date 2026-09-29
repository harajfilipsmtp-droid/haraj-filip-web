// Header border after scrolling
const header = document.getElementById("header");
const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 10);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

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
  const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
  el.style.transitionDelay = `${siblings.indexOf(el) * 0.1}s`;
  observer.observe(el);
});

// Fill timeline dots as the user scrolls past each step
const steps = document.querySelectorAll("#timeline li");
const updateTimeline = () => {
  const mark = window.innerHeight * 0.6;
  steps.forEach((step) => step.classList.toggle("is-active", step.getBoundingClientRect().top < mark));
};
updateTimeline();
window.addEventListener("scroll", updateTimeline, { passive: true });

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

// ---------- Project detail panels ----------
const openDetail = (dialog) => {
  dialog.showModal();
  document.body.classList.add("has-dialog");
  dialog.scrollTop = 0;
};
document.querySelectorAll("[data-open]").forEach((btn) =>
  btn.addEventListener("click", () => openDetail(document.getElementById(btn.dataset.open)))
);
document.querySelectorAll(".detail").forEach((dialog) => {
  dialog.addEventListener("close", () => document.body.classList.remove("has-dialog"));
  dialog.querySelector(".detail__close").addEventListener("click", () => dialog.close());
  // Close when clicking the dimmed backdrop
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });
  // "Chcem niečo podobné" closes the panel and scrolls to contact
  dialog.querySelector(".detail__cta").addEventListener("click", () => dialog.close());
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
    const progress = Math.min(Math.max(window.scrollY / (rect.height * 0.7), 0), 1);
    stage.style.setProperty("--p", progress.toFixed(3));
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

  setTimeout(() => {
    pushNext();
    setInterval(pushNext, 2600);
  }, 1000);
}

// ---------- Interactive render (FIG section) ----------
const scene = document.getElementById("scene");
if (scene) {
  const tilt = scene.querySelector(".scene__tilt");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 3D tilt + glare + parallax that follow the mouse
  if (!reduce && window.matchMedia("(hover: hover)").matches) {
    scene.addEventListener("pointermove", (e) => {
      const r = tilt.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5; // -0.5 … 0.5
      const y = (e.clientY - r.top) / r.height - 0.5;
      scene.classList.add("is-hover");
      tilt.style.setProperty("--ry", `${x * 8}deg`);
      tilt.style.setProperty("--rx", `${-y * 8}deg`);
      tilt.style.setProperty("--mx", (x * 2).toFixed(3));
      tilt.style.setProperty("--my", (y * 2).toFixed(3));
      tilt.style.setProperty("--gx", `${(x + 0.5) * 100}%`);
      tilt.style.setProperty("--gy", `${(y + 0.5) * 100}%`);
    });
    scene.addEventListener("pointerleave", () => {
      scene.classList.remove("is-hover");
      ["--rx", "--ry", "--mx", "--my"].forEach((v) => tilt.style.removeProperty(v));
    });
  }

  // Gentle vertical parallax while scrolling past the image
  if (!reduce) {
    let queued = false;
    const onParallax = () => {
      const r = tilt.getBoundingClientRect();
      const progress = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight; // ~ -1 … 1
      tilt.style.setProperty("--sy", `${Math.max(-1, Math.min(1, progress)) * 24}px`);
      queued = false;
    };
    onParallax();
    window.addEventListener("scroll", () => {
      if (!queued) { queued = true; requestAnimationFrame(onParallax); }
    }, { passive: true });
  }

  // Tags pop up one after another along the cable, like events in a pipeline
  const tags = [...scene.querySelectorAll(".scene__tag")];
  let current = 0;
  let timer;
  const step = () => {
    const tag = tags[current];
    tag.classList.add("is-on");
    setTimeout(() => tag.classList.remove("is-on"), 2600);
    current = (current + 1) % tags.length;
  };
  new IntersectionObserver(([entry]) => {
    clearInterval(timer);
    if (entry.isIntersecting) {
      step();
      timer = setInterval(step, 1300);
    }
  }, { threshold: 0.3 }).observe(scene);
}
