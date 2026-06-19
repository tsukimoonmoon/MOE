const searchInput = document.getElementById("shortcut-search");
const rows = Array.from(document.querySelectorAll("tbody tr"));
const blocks = Array.from(document.querySelectorAll(".table-block"));
const canvas = document.getElementById("particle-field");
const ctx = canvas.getContext("2d");
const dot = document.querySelector(".cursor-dot");
const ring = document.querySelector(".cursor-ring");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let particles = [];
let animationFrame;
let width = 0;
let height = 0;
let dpr = 1;
let ringX = 0;
let ringY = 0;
let mouseX = 0;
let mouseY = 0;

const randomBetween = (min, max) => Math.random() * (max - min) + min;

const resizeParticles = () => {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const count = Math.max(18, Math.min(58, Math.floor((width * height) / 24000)));
  particles = Array.from({ length: count }, () => ({
    x: randomBetween(0, width),
    y: randomBetween(0, height),
    radius: randomBetween(1.1, 2.4),
    alpha: randomBetween(0.16, 0.34),
    speedX: randomBetween(-0.12, 0.12),
    speedY: randomBetween(-0.08, 0.08),
    phase: randomBetween(0, Math.PI * 2),
  }));
};

const drawParticles = (time = 0) => {
  ctx.clearRect(0, 0, width, height);

  for (let i = 0; i < particles.length; i += 1) {
    for (let j = i + 1; j < particles.length; j += 1) {
      const a = particles[i];
      const b = particles[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 115) {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(107, 114, 128, ${0.08 * (1 - distance / 115)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  particles.forEach((particle) => {
    particle.x += particle.speedX;
    particle.y += particle.speedY;

    if (particle.x < -10) particle.x = width + 10;
    if (particle.x > width + 10) particle.x = -10;
    if (particle.y < -10) particle.y = height + 10;
    if (particle.y > height + 10) particle.y = -10;

    const pulse = (Math.sin(time * 0.0012 + particle.phase) + 1) * 0.5;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius + pulse * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(75, 85, 99, ${particle.alpha + pulse * 0.12})`;
    ctx.fill();
  });

  animationFrame = requestAnimationFrame(drawParticles);
};

const startParticles = () => {
  cancelAnimationFrame(animationFrame);
  resizeParticles();

  if (prefersReducedMotion.matches) {
    drawParticles(0);
    cancelAnimationFrame(animationFrame);
    return;
  }

  drawParticles();
};

window.addEventListener("resize", startParticles);
prefersReducedMotion.addEventListener("change", startParticles);
startParticles();

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -80px" }
);

document.querySelectorAll(".reveal, .table-block").forEach((element) => {
  element.classList.add("reveal");
  revealObserver.observe(element);
});

window.addEventListener(
  "mousemove",
  (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
  },
  { passive: true }
);

const animateCursor = () => {
  ringX += (mouseX - ringX) * 0.18;
  ringY += (mouseY - ringY) * 0.18;
  ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
  requestAnimationFrame(animateCursor);
};

animateCursor();

document.querySelectorAll("a, input, .table-block").forEach((element) => {
  element.addEventListener("mouseenter", () => ring.classList.add("is-hovering"));
  element.addEventListener("mouseleave", () => ring.classList.remove("is-hovering"));
});

const empty = document.createElement("div");
empty.className = "empty";
empty.textContent = "没有匹配的快捷键。";
empty.hidden = true;
document.querySelector(".page").appendChild(empty);

const updateSearch = () => {
  const query = searchInput.value.trim().toLowerCase();
  let visibleRows = 0;

  rows.forEach((row) => {
    const matched = !query || row.textContent.toLowerCase().includes(query);
    row.classList.toggle("is-hidden", !matched);
    if (matched) visibleRows += 1;
  });

  blocks.forEach((block) => {
    const hasVisibleRow = block.querySelector("tbody tr:not(.is-hidden)");
    block.classList.toggle("is-hidden", !hasVisibleRow);
  });

  empty.hidden = !query || visibleRows > 0;
};

searchInput.addEventListener("input", updateSearch);

document.addEventListener("keydown", (event) => {
  if (event.key === "/" && document.activeElement !== searchInput) {
    event.preventDefault();
    searchInput.focus();
  }

  if (event.key === "Escape" && document.activeElement === searchInput) {
    searchInput.value = "";
    searchInput.blur();
    updateSearch();
  }
});
