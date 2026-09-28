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
// Sem vložte URL, kam sa má formulár odosielať (napr. Formspree, Make webhook
// alebo Google Apps Script). Kým je prázdna, formulár otvorí e-mailového klienta.
const FORM_ENDPOINT = "";
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
    meno: data.get("meno"),
    email: data.get("email"),
    firma: data.get("firma"),
    telefon: data.get("telefon"),
    sluzby: data.getAll("sluzby").join(", "),
    sprava: data.get("sprava"),
    _subject: `Nový dopyt z webu – ${data.get("meno")}`,
  };

  if (!FORM_ENDPOINT) {
    const body = Object.entries(payload)
      .filter(([k, v]) => v && k !== "_subject")
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
    window.location.href = `mailto:${FALLBACK_EMAIL}?subject=${encodeURIComponent(payload._subject)}&body=${encodeURIComponent(body)}`;
    return;
  }

  const button = form.querySelector("button[type=submit]");
  button.disabled = true;
  setStatus("Odosielam…");
  try {
    const res = await fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
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
  const MAX_VISIBLE = 3;
  const AGES = ["teraz", "pred 1 min", "pred 3 min"];
  let index = 0;

  const build = ({ app, title, text }) => {
    const wrap = document.createElement("div");
    wrap.className = "notif-wrap";
    wrap.innerHTML = `<div><div class="notif">
      <span class="notif__icon">FH</span>
      <div class="notif__body">
        <div class="notif__meta"><span></span><span class="notif__when"></span></div>
        <p class="notif__title"></p><p class="notif__text"></p>
      </div></div></div>`;
    wrap.querySelector(".notif__meta span").textContent = app;
    wrap.querySelector(".notif__title").textContent = title;
    wrap.querySelector(".notif__text").textContent = text;
    return wrap;
  };

  const pushNext = () => {
    const wrap = build(notifications[index]);
    index = (index + 1) % notifications.length;
    stack.prepend(wrap);
    requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add("is-in")));

    const live = [...stack.children].filter((el) => !el.classList.contains("is-out"));
    live.forEach((el, i) => {
      const when = el.querySelector(".notif__when");
      if (i < AGES.length) when.textContent = AGES[i];
    });
    // Drop the oldest once more than 3 are on screen
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
