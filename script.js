// Simple interactions: typing effect, reveal on scroll, mobile nav toggle, year
document.addEventListener("DOMContentLoaded", () => {
  // Typing effect for the title
  const titleEl = document.getElementById("titleType");
  const text = "Hi — I’m Titus.";
  let i = 0;
  const speed = 50;
  titleEl.textContent = "";
  function type() {
    if (i < text.length) {
      titleEl.textContent += text.charAt(i);
      i++;
      setTimeout(type, speed);
    }
  }
  type();

  // reveal on scroll with staggered flip for ygo cards
  const reveals = Array.from(document.querySelectorAll(".reveal"));
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const idx = reveals.indexOf(el);
          const delay = (idx >= 0 ? idx : 0) * 140;
          setTimeout(() => {
            el.classList.add("show");
          }, delay);
          obs.unobserve(el);
        }
      });
    },
    { threshold: 0.12 },
  );
  reveals.forEach((el) => observer.observe(el));

  // Screenshot popup: open on demo card click, close on backdrop click (and flip card back)
  const popup = document.getElementById("screenshot-popup");
  const popupBackdrop = popup && popup.querySelector(".popup-backdrop");
  const popupImg = popup && popup.querySelector(".popup-img");
  const popupVideo = popup && popup.querySelector(".popup-video");
  let popupCard = null;

  function openPopup(card) {
    const demo = card.querySelector(".project-demo");
    if (!demo || !popup) return;
    const img = demo.querySelector(".proj-img");
    const video = demo.querySelector(".proj-video");
    popupImg.hidden = true;
    popupVideo.hidden = true;
    popupVideo.pause();
    popupVideo.removeAttribute("src");
    if (video && (video.src || video.getAttribute("src"))) {
      popupVideo.src = video.src || video.getAttribute("src");
      popupVideo.hidden = false;
      popupVideo.play().catch(() => {});
    } else if (img && img.src) {
      popupImg.src = img.src;
      popupImg.alt = img.alt || "Demo";
      popupImg.hidden = false;
    }
    popupCard = card;
    popup.classList.add("is-open");
    popup.setAttribute("aria-hidden", "false");
  }

  function closePopup() {
    if (!popup) return;
    popup.classList.remove("is-open");
    popup.setAttribute("aria-hidden", "true");
    popupVideo.pause();
    popupVideo.removeAttribute("src");
    popupImg.removeAttribute("src");
    if (popupCard) {
      const inner = popupCard.querySelector(".ygo-inner");
      const video = popupCard.querySelector(".proj-video");
      inner.classList.remove("flipped");
      if (video) video.pause();
      popupCard = null;
    }
  }

  if (popupBackdrop) {
    popupBackdrop.addEventListener("click", closePopup);
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && popup && popup.classList.contains("is-open")) closePopup();
  });

  // Manual flip: click to flip, or (if flipped + demo) open popup
  document.querySelectorAll(".ygo-card").forEach((card) => {
    const inner = card.querySelector(".ygo-inner");
    const video = card.querySelector(".proj-video");
    function syncVideo() {
      if (!video) return;
      if (inner.classList.contains("flipped")) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    }
    card.addEventListener("click", (e) => {
      if (e.target.closest(".project-link") || e.target.closest(".view-btn")) return;
      const isFlipped = inner.classList.contains("flipped");
      const isDemo = card.querySelector(".project-demo");
      if (isFlipped && isDemo) {
        openPopup(card);
        return;
      }
      inner.classList.toggle("flipped");
      syncVideo();
    });
    card.setAttribute("tabindex", "0");
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const isFlipped = inner.classList.contains("flipped");
        const isDemo = card.querySelector(".project-demo");
        if (isFlipped && isDemo) {
          openPopup(card);
          return;
        }
        inner.classList.toggle("flipped");
        syncVideo();
      }
    });
  });

  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const a = btn.closest(".project-link");
      if (a && a.href) window.open(a.href, "_blank", "noopener");
    });
  });

  // mobile nav toggle
  const navToggle = document.getElementById("navToggle");
  const nav = document.getElementById("nav");
  navToggle.addEventListener("click", () => {
    if (nav.style.display === "flex") {
      nav.style.display = "none";
    } else {
      nav.style.display = "flex";
      nav.style.flexDirection = "column";
      nav.style.gap = "12px";
    }
  });

  // set year
  const y = new Date().getFullYear();
  document.getElementById("year").textContent = y;
});
