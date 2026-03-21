/**
 * EmailJS contact form
 *
 * 1. Email Templates → create a template with variables:
 *    {{from_name}}, {{from_email}}, {{message}}
 *    Set “To Email” to your inbox (e.g. titus.adesina@gmail.com) in the template or service.
 * 2. Account → API keys → copy your Public Key
 * 3. Paste TEMPLATE_ID and PUBLIC_KEY below (required for send to work)
 *
 * https://dashboard.emailjs.com/
 */
const EMAILJS_SERVICE_ID = "service_7ou2e8i";
/** e.g. template_abc123 */
const EMAILJS_TEMPLATE_ID = "template_n21myhq";
/** Public Key from EmailJS → Account → API keys */
const EMAILJS_PUBLIC_KEY = "B0BJ-fYjw0afV2Ed0";

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("email-modal");
  const form = document.getElementById("email-contact-form");
  const statusEl = document.getElementById("email-form-status");
  const closeEls = modal
    ? modal.querySelectorAll("[data-email-modal-close]")
    : [];

  if (!modal || !form || typeof emailjs === "undefined") return;

  if (EMAILJS_PUBLIC_KEY) {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  }

  function openModal() {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    const first = form.querySelector("input, textarea");
    if (first) first.focus();
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (statusEl) statusEl.textContent = "";
  }

  document.querySelectorAll(".js-open-email").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      openModal();
    });
  });

  closeEls.forEach((btn) => {
    btn.addEventListener("click", closeModal);
  });

  modal.addEventListener("click", (e) => {
    if (e.target.classList.contains("email-modal__backdrop")) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!statusEl) return;

    if (!EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      statusEl.textContent =
        "EmailJS isn’t finished yet: open email-contact.js and set EMAILJS_TEMPLATE_ID and EMAILJS_PUBLIC_KEY (see comments at top).";
      return;
    }

    const submitBtn = form.querySelector('[type="submit"]');
    const fromName = form.elements.namedItem("from_name");
    const fromEmail = form.elements.namedItem("from_email");
    const message = form.elements.namedItem("message");

    const params = {
      from_name: fromName && fromName.value ? fromName.value.trim() : "",
      from_email: fromEmail && fromEmail.value ? fromEmail.value.trim() : "",
      message: message && message.value ? message.value.trim() : "",
    };

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.dataset.label = submitBtn.textContent;
      submitBtn.textContent = "Sending…";
    }
    statusEl.textContent = "";

    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params);
      statusEl.textContent = "Thanks — your message was sent.";
      form.reset();
      setTimeout(closeModal, 1800);
    } catch (err) {
      console.error(err);
      statusEl.textContent =
        "Couldn’t send right now. Try again or email titus.adesina@gmail.com directly.";
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = submitBtn.dataset.label || "Send";
      }
    }
  });
});
