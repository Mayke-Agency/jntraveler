/*** File: script.js */

(() => {
  "use strict";

  const wrapIndex = (n, len) => ((n % len) + len) % len;
  const toNum = (v, fallback = 0) => (Number.isFinite(Number(v)) ? Number(v) : fallback);

  function preloadImages(root) {
    root.querySelectorAll("img[src]").forEach((img) => {
      img.loading = "eager";
      img.decoding = "async";
      try { img.fetchPriority = "high"; } catch (_) {}

      const src = img.getAttribute("src");
      if (!src) return;

      const pre = new Image();
      pre.decoding = "async";
      pre.src = src;
    });
  }

  function getCarouselRoot(fromEl) {
    // First try closest carousel wrapper
    const near = fromEl.closest("[data-carousel]");
    if (near) return near;

    // Fallback: if controls are elsewhere, try hero-media search
    // (safe fallback; won't throw if not found)
    return document.querySelector("[data-carousel]");
  }

  function getCarouselState(root) {
    const slides = Array.from(root.querySelectorAll(".carousel-slide"));
    const dots = Array.from(root.querySelectorAll(".carousel-dot"));

    if (!slides.length) return null;

    let index = slides.findIndex((s) => s.classList.contains("is-active"));
    if (index < 0) index = 0;

    return { root, slides, dots, index };
  }

  function applyState(state) {
    const { slides, dots, index } = state;

    slides.forEach((s, i) => s.classList.toggle("is-active", i === index));

    if (dots.length) {
      dots.forEach((d, i) => {
        const active = i === index;
        d.classList.toggle("is-active", active);
        d.setAttribute("aria-selected", active ? "true" : "false");
      });
    }
  }

  // Store timers per carousel
  const timers = new WeakMap();
  const paused = new WeakMap();

  function stop(root) {
    const t = timers.get(root);
    if (t) clearInterval(t);
    timers.delete(root);
  }

  function start(root, interval) {
    if (paused.get(root)) return;

    stop(root);
    const t = setInterval(() => {
      const state = getCarouselState(root);
      if (!state) return;
      state.index = wrapIndex(state.index + 1, state.slides.length);
      applyState(state);
    }, interval);

    timers.set(root, t);
  }

  function restart(root, interval) {
    stop(root);
    start(root, interval);
  }

  function go(root, nextIndex, interval, user = false) {
    const state = getCarouselState(root);
    if (!state) return;

    state.index = wrapIndex(nextIndex, state.slides.length);
    applyState(state);

    if (user) restart(root, interval);
  }

  // ---------- Init each carousel ----------
  function initCarousel(root, { autoplay = true, interval = 5500 } = {}) {
    preloadImages(root);

    // Ensure initial state is consistent
    const state = getCarouselState(root);
    if (state) applyState(state);

    if (autoplay) start(root, interval);

    // Pause behaviors
    root.addEventListener("mouseenter", () => { paused.set(root, true); stop(root); });
    root.addEventListener("mouseleave", () => { paused.set(root, false); start(root, interval); });

    root.addEventListener("focusin", () => { paused.set(root, true); stop(root); });
    root.addEventListener("focusout", () => { paused.set(root, false); start(root, interval); });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { paused.set(root, true); stop(root); }
      else { paused.set(root, false); start(root, interval); }
    });

    // Keyboard support
    root.setAttribute("tabindex", root.getAttribute("tabindex") || "0");
    root.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        const s = getCarouselState(root);
        if (!s) return;
        go(root, s.index + 1, interval, true);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        const s = getCarouselState(root);
        if (!s) return;
        go(root, s.index - 1, interval, true);
      }
    });

    // Touch swipe
    let down = false, startX = 0, startY = 0;
    root.addEventListener("touchstart", (e) => {
      down = true;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });

    root.addEventListener("touchend", (e) => {
      if (!down) return;
      down = false;

      const pt = e.changedTouches[0];
      const dx = pt.clientX - startX;
      const dy = pt.clientY - startY;

      if (Math.abs(dy) > Math.abs(dx)) return;

      const s = getCarouselState(root);
      if (!s) return;

      if (dx > 40) go(root, s.index - 1, interval, true);
      if (dx < -40) go(root, s.index + 1, interval, true);
    }, { passive: true });

    // Debug
    console.log("[carousel:init]", root.getAttribute("data-carousel"), {
      slides: root.querySelectorAll(".carousel-slide").length,
      prev: !!root.querySelector("[data-carousel-prev]"),
      next: !!root.querySelector("[data-carousel-next]"),
      dots: root.querySelectorAll(".carousel-dot").length
    });
  }

  // Init all carousels
  const interval = 5500;
  document.querySelectorAll("[data-carousel]").forEach((root) => {
    initCarousel(root, { autoplay: true, interval });
  });

  // ----------  click handling (delegation) ----------
  document.addEventListener("click", (e) => {
    const prevBtn = e.target.closest("[data-carousel-prev]");
    const nextBtn = e.target.closest("[data-carousel-next]");
    const dotBtn  = e.target.closest("[data-carousel-dot]");

    if (!prevBtn && !nextBtn && !dotBtn) return;

    const root = getCarouselRoot(e.target);
    if (!root) return;

    const state = getCarouselState(root);
    if (!state) return;

    if (prevBtn) {
      e.preventDefault();
      go(root, state.index - 1, interval, true);
      return;
    }

    if (nextBtn) {
      e.preventDefault();
      go(root, state.index + 1, interval, true);
      return;
    }

    if (dotBtn) {
      e.preventDefault();
      const n = toNum(dotBtn.getAttribute("data-carousel-dot"), 0);
      go(root, n, interval, true);
    }
  }, true); // capture phase helps if something stops propagation
      /* ==============================
      MOBILE NAV TOGGLE
      ============================== */

      const navToggle = document.querySelector(".nav-toggle");
      const siteNav = document.querySelector(".site-nav");

      if(navToggle){
        navToggle.addEventListener("click", () => {
          siteNav.classList.toggle("open");
        });
      }

    /* ==============================
   NAV INQUIRE DROPDOWN
============================== */

const inquireWrappers = document.querySelectorAll(".nav-inquire");

inquireWrappers.forEach((wrapper) => {
  const toggle = wrapper.querySelector(".inquire-toggle");
  const dropdown = wrapper.querySelector(".inquire-dropdown");

  if (!toggle || !dropdown) return;

  toggle.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const isOpen = wrapper.classList.contains("open");

    // close all others
    document.querySelectorAll(".nav-inquire.open").forEach((openItem) => {
      openItem.classList.remove("open");
      const btn = openItem.querySelector(".inquire-toggle");
      if (btn) btn.setAttribute("aria-expanded", "false");
    });

    if (!isOpen) {
      wrapper.classList.add("open");
      toggle.setAttribute("aria-expanded", "true");
    }
  });
});

/* close on outside click */
document.addEventListener("click", (e) => {
  document.querySelectorAll(".nav-inquire.open").forEach((wrapper) => {
    if (!wrapper.contains(e.target)) {
      wrapper.classList.remove("open");
      const btn = wrapper.querySelector(".inquire-toggle");
      if (btn) btn.setAttribute("aria-expanded", "false");
    }
  });
});

/* close on escape */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.querySelectorAll(".nav-inquire.open").forEach((wrapper) => {
      wrapper.classList.remove("open");
      const btn = wrapper.querySelector(".inquire-toggle");
      if (btn) btn.setAttribute("aria-expanded", "false");
    });
  }
});  
})();
