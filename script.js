document.documentElement.classList.add("anime-ready");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const nav = document.querySelector("[data-navbar]");
const navToggle = document.querySelector("[data-nav-toggle]");
const navMenu = document.querySelector("[data-nav-menu]");
const testimonialCards = [...document.querySelectorAll(".testimonial-card")];
const testimonialDotsContainer = document.querySelector("[data-testimonial-dots]");
const CYBERCORE_BEAM_COUNT = 70;
let testimonialIndex = 0;
let testimonialTimer;

// Sticky navbar state is controlled by scroll position for a glassmorphism effect.
function updateNavbar() {
  nav.classList.toggle("is-scrolled", window.scrollY > 24);
}

updateNavbar();
window.addEventListener("scroll", updateNavbar, { passive: true });

navToggle.addEventListener("click", () => {
  const isOpen = navMenu.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));

  if (!prefersReducedMotion) {
    anime({
      targets: navMenu.querySelectorAll("a"),
      opacity: [0, 1],
      translateY: [-10, 0],
      delay: anime.stagger(45),
      duration: 420,
      easing: "easeOutCubic"
    });
  }
});

// Smooth in-page navigation with mobile menu closing.
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));

    if (!target) return;

    event.preventDefault();
    navMenu.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
  });
});

// Hero timeline: staggered text reveal, dashboard lift, and floating chips.
function animateHero() {
  if (prefersReducedMotion) {
    anime.set(".hero-item", { opacity: 1 });
    return;
  }

  const timeline = anime.timeline({ easing: "easeOutExpo" });

  timeline
    .add({
      targets: ".hero-item",
      opacity: [0, 1],
      translateY: [38, 0],
      delay: anime.stagger(110),
      duration: 980
    })
    .add({
      targets: ".browser-card",
      rotateX: [8, 0],
      rotateY: [-10, 0],
      scale: [0.96, 1],
      duration: 900
    }, "-=760")
    .add({
      targets: ".floating-chip",
      opacity: [0, 1],
      translateY: [18, 0],
      delay: anime.stagger(100),
      duration: 700
    }, "-=560");
}

function setupCybercoreBackground() {
  const container = document.querySelector("[data-cybercore-beams]");
  if (!container) return;

  const beams = Array.from({ length: CYBERCORE_BEAM_COUNT }, (_, index) => {
    const beam = document.createElement("span");
    const riseDuration = Math.random() * 3 + 5;
    const type = Math.random() < 0.15 ? "secondary" : "primary";

    beam.className = `cybercore-light-beam ${type}`;
    beam.style.left = `${Math.random() * 100}%`;
    beam.style.width = `${Math.floor(Math.random() * 2) + 1}px`;
    beam.style.animationDelay = `${Math.random() * 6}s`;
    beam.style.animationDuration = `${riseDuration}s, ${riseDuration}s`;
    beam.setAttribute("aria-hidden", "true");
    beam.dataset.beamIndex = String(index);

    return beam;
  });

  container.replaceChildren(...beams);
}

// Ambient background movement uses Anime.js instead of CSS keyframes.
function animateBackground() {
  if (prefersReducedMotion) return;

  anime({
    targets: ".orb-one",
    translateX: [0, 90, 20, 0],
    translateY: [0, 50, 110, 0],
    scale: [1, 1.12, 0.96, 1],
    duration: 18000,
    easing: "easeInOutSine",
    loop: true
  });

  anime({
    targets: ".orb-two",
    translateX: [0, -80, -30, 0],
    translateY: [0, -70, 40, 0],
    scale: [1, 0.94, 1.15, 1],
    duration: 21000,
    easing: "easeInOutSine",
    loop: true
  });

  anime({
    targets: ".orb-three",
    translateX: [0, 60, -40, 0],
    translateY: [0, -90, -20, 0],
    scale: [1, 1.08, 0.98, 1],
    duration: 24000,
    easing: "easeInOutSine",
    loop: true
  });
}

// Reveals sections and cards only when they enter the viewport.
function setupScrollReveals() {
  if (prefersReducedMotion) {
    anime.set([".reveal", ".reveal-card", ".text-reveal .word"], { opacity: 1, translateY: 0 });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      anime({
        targets: entry.target,
        opacity: [0, 1],
        translateY: [34, 0],
        duration: 820,
        easing: "easeOutCubic"
      });

      observer.unobserve(entry.target);
    });
  }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });

  document.querySelectorAll(".reveal, .reveal-card").forEach((element) => observer.observe(element));
}

// Splits the about headline into words for a precise Anime.js text reveal.
function setupTextReveal() {
  const textReveal = document.querySelector("[data-text-reveal]");
  if (!textReveal) return;

  const words = textReveal.textContent.trim().split(" ");
  textReveal.innerHTML = words.map((word) => `<span class="word">${word}</span>`).join(" ");

  if (prefersReducedMotion) {
    anime.set(".text-reveal .word", { opacity: 1, translateY: 0 });
    return;
  }

  const textObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      anime({
        targets: ".text-reveal .word",
        opacity: [0, 1],
        translateY: [24, 0],
        delay: anime.stagger(24),
        duration: 680,
        easing: "easeOutCubic"
      });

      textObserver.unobserve(entry.target);
    });
  }, { threshold: 0.28 });

  textObserver.observe(textReveal);
}

// Button hover is animated with Anime.js and follows pointer position for a premium glow.
function setupButtonAnimations() {
  document.querySelectorAll("[data-animated-button]").forEach((button) => {
    button.addEventListener("pointermove", (event) => {
      const rect = button.getBoundingClientRect();
      button.style.setProperty("--x", `${event.clientX - rect.left}px`);
      button.style.setProperty("--y", `${event.clientY - rect.top}px`);
    });

    button.addEventListener("mouseenter", () => {
      if (prefersReducedMotion) return;
      anime.remove(button);
      anime({
        targets: button,
        scale: 1.045,
        duration: 320,
        easing: "easeOutCubic"
      });
    });

    button.addEventListener("mouseleave", () => {
      if (prefersReducedMotion) return;
      anime.remove(button);
      anime({
        targets: button,
        scale: 1,
        duration: 360,
        easing: "easeOutElastic(1, .55)"
      });
    });
  });
}

// Portfolio hover effect animates image zoom and overlay content with Anime.js.
function setupPortfolioHover() {
  document.querySelectorAll("[data-portfolio-card]").forEach((card) => {
    const image = card.querySelector("img");
    const content = card.querySelectorAll(".portfolio-overlay span, .portfolio-overlay h3");

    card.addEventListener("mouseenter", () => {
      if (prefersReducedMotion) return;
      anime.remove([image, ...content]);
      anime({
        targets: image,
        scale: 1.12,
        opacity: 0.95,
        duration: 760,
        easing: "easeOutCubic"
      });
      anime({
        targets: content,
        translateY: [-4, -14],
        delay: anime.stagger(45),
        duration: 480,
        easing: "easeOutCubic"
      });
    });

    card.addEventListener("mouseleave", () => {
      if (prefersReducedMotion) return;
      anime.remove([image, ...content]);
      anime({
        targets: image,
        scale: 1.02,
        opacity: 0.72,
        duration: 760,
        easing: "easeOutCubic"
      });
      anime({
        targets: content,
        translateY: 0,
        duration: 420,
        easing: "easeOutCubic"
      });
    });
  });
}

// Inputs use Anime.js focus feedback while CSS handles accessible focus outlines.
function setupFormAnimations() {
  document.querySelectorAll("[data-form-input]").forEach((input) => {
    input.addEventListener("focus", () => {
      if (prefersReducedMotion) return;
      anime.remove(input);
      anime({
        targets: input,
        scale: 1.012,
        duration: 260,
        easing: "easeOutCubic"
      });
    });

    input.addEventListener("blur", () => {
      if (prefersReducedMotion) return;
      anime.remove(input);
      anime({
        targets: input,
        scale: 1,
        duration: 300,
        easing: "easeOutCubic"
      });
    });
  });
}

function createTestimonialDots() {
  testimonialCards.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = `testimonial-dot${index === 0 ? " is-active" : ""}`;
    dot.setAttribute("aria-label", `Show testimonial ${index + 1}`);
    dot.addEventListener("click", () => showTestimonial(index));
    testimonialDotsContainer.appendChild(dot);
  });
}

function showTestimonial(nextIndex) {
  if (nextIndex === testimonialIndex) return;

  const current = testimonialCards[testimonialIndex];
  const next = testimonialCards[nextIndex];
  const direction = nextIndex > testimonialIndex ? 1 : -1;
  const dots = testimonialDotsContainer.querySelectorAll(".testimonial-dot");

  dots[testimonialIndex].classList.remove("is-active");
  dots[nextIndex].classList.add("is-active");

  current.classList.remove("is-active");
  next.classList.add("is-active");

  if (prefersReducedMotion) {
    testimonialIndex = nextIndex;
    restartTestimonials();
    return;
  }

  anime.remove([current, next]);
  anime.set(next, { translateX: `${direction * 32}px`, opacity: 0 });

  anime.timeline({ easing: "easeOutCubic" })
    .add({
      targets: current,
      translateX: `${direction * -32}px`,
      opacity: 0,
      duration: 360
    })
    .add({
      targets: next,
      translateX: [direction * 32, 0],
      opacity: [0, 1],
      duration: 520
    }, "-=120");

  testimonialIndex = nextIndex;
  restartTestimonials();
}

function restartTestimonials() {
  window.clearInterval(testimonialTimer);
  testimonialTimer = window.setInterval(() => {
    showTestimonial((testimonialIndex + 1) % testimonialCards.length);
  }, 5600);
}

function setupTestimonials() {
  createTestimonialDots();

  document.querySelector("[data-testimonial-prev]").addEventListener("click", () => {
    showTestimonial((testimonialIndex - 1 + testimonialCards.length) % testimonialCards.length);
  });

  document.querySelector("[data-testimonial-next]").addEventListener("click", () => {
    showTestimonial((testimonialIndex + 1) % testimonialCards.length);
  });

  anime.set(testimonialCards.slice(1), { opacity: 0, translateX: 32 });
  restartTestimonials();
}

setupCybercoreBackground();
animateHero();
animateBackground();
setupTextReveal();
setupScrollReveals();
setupButtonAnimations();
setupPortfolioHover();
setupFormAnimations();
setupTestimonials();
