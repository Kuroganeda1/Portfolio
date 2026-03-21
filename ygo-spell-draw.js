/**
 * Deck → bio hand deals out → 3D flip (GIPHY embed on front) → overlay fades
 * so bio cards are readable → click deck to stack and replay.
 */
(function () {
  "use strict";

  var ASSETS = {
    deck: "assets/Deck.webp",
    cardBack: "assets/cardback.png",
  };

  function cardFlyDims() {
    return window.innerWidth <= 520 ? { w: 180, h: 262 } : { w: 220, h: 320 };
  }

  var DEAL_COUNT = 4;

  function prefersReducedMotion() {
    return (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function getTiming() {
    if (prefersReducedMotion()) {
      return {
        dealStagger: 0,
        dealMove: 80,
        dealFade: 80,
        emerge: 120,
        flyToCenter: 220,
        flipDelay: 60,
        spellFxDelay: 120,
        messageDelay: 200,
        unflip: 80,
        flyBack: 240,
        overlayClose: 120,
        handStagger: 40,
        handDealStagger: 50,
      };
    }
    return {
      dealStagger: 95,
      dealMove: 380,
      dealFade: 280,
      emerge: 340,
      flyToCenter: 880,
      flipDelay: 200,
      spellFxDelay: 350,
      messageDelay: 520,
      unflip: 780,
      flyBack: 900,
      overlayClose: 380,
      handStagger: 55,
      handDealStagger: 72,
    };
  }

  function wait(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function playChime() {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      var ctx = new Ctx();
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type = "sine";
      o.frequency.setValueAtTime(349.23, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(523.25, ctx.currentTime + 0.1);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.065, ctx.currentTime + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.32);
      o.start(ctx.currentTime);
      o.stop(ctx.currentTime + 0.34);
    } catch (e) {
      /* ignore */
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var deckBtn = document.getElementById("ygo-deck-btn");
    var deckImg = document.getElementById("ygo-deck-img");
    var overlay = document.getElementById("ygo-spell-overlay");
    var dealLayer = document.getElementById("ygo-deal-layer");
    var burst = document.getElementById("ygo-spell-burst");
    var flash = document.getElementById("ygo-spell-flash");
    var returnBtn = document.getElementById("ygo-overlay-deck-return");
    var anchor = document.getElementById("ygo-focus-anchor");
    var flipCard = document.getElementById("ygo-flip-card");
    var faceBack = flipCard && flipCard.querySelector(".ygo-flip-face--back");
    var msg = document.getElementById("ygo-spell-msg");
    var hand = document.getElementById("ygo-hand");
    var handCards = hand
      ? [].slice.call(hand.querySelectorAll("[data-ygo-info-card]"))
      : [];

    if (!deckBtn || !overlay || !dealLayer || !anchor || !flipCard) return;

    if (faceBack) faceBack.style.backgroundImage = 'url("' + ASSETS.cardBack + '")';

    if (deckImg) {
      deckImg.addEventListener("error", function onDeckErr() {
        deckImg.removeEventListener("error", onDeckErr);
        deckImg.src = "assets/deck.png";
      });
    }

    var busy = false;
    /** Respect Spell is visible with message; user can skip to bio with Esc / dim. */
    var spellRevealVisible = false;
    /** Overlay gone; bio info cards stay fanned — click deck to stack. */
    var bioVisible = false;
    var autoDismissTimer = null;
    var dismissingSpell = false;

    var SPELL_HOLD_MS = 2800;
    var SPELL_HOLD_MS_RM = 500;

    function clearAutoDismissTimer() {
      if (autoDismissTimer) {
        clearTimeout(autoDismissTimer);
        autoDismissTimer = null;
      }
    }

    /** Vector from each card’s layout center to deck center (for stack transform). */
    function setStackOffsets() {
      var deckRect = deckBtn.getBoundingClientRect();
      var dcx = deckRect.left + deckRect.width / 2;
      var dcy = deckRect.top + deckRect.height / 2;
      handCards.forEach(function (card) {
        var r = card.getBoundingClientRect();
        var cx = r.left + r.width / 2;
        var cy = r.top + r.height / 2;
        card.style.setProperty("--tx", dcx - cx + "px");
        card.style.setProperty("--ty", dcy - cy + "px");
        card.style.setProperty("--s", prefersReducedMotion() ? "0.42" : "0.34");
      });
    }

    /** First paint: measure in “dealt” layout, then stack on deck without flash. */
    function initHandLayout() {
      if (!hand || !handCards.length) return;
      hand.classList.add("ygo-hand--init");
      handCards.forEach(function (c) {
        c.classList.remove("ygo-info-card--stacked");
        c.classList.add("ygo-info-card--no-trans");
      });
      setStackOffsets();
      handCards.forEach(function (c) {
        c.classList.add("ygo-info-card--stacked");
      });
      void hand.offsetHeight;
      handCards.forEach(function (c) {
        c.classList.remove("ygo-info-card--no-trans");
      });
      hand.classList.remove("ygo-hand--init");
      hand.setAttribute("aria-hidden", "true");
    }

    function dealHandOut() {
      if (!hand || !handCards.length) return;
      var rm = prefersReducedMotion();
      var t = getTiming();
      hand.setAttribute("aria-hidden", "false");
      handCards.forEach(function (c, i) {
        window.setTimeout(function () {
          c.classList.remove("ygo-info-card--stacked");
        }, rm ? 0 : 40 + i * t.handDealStagger);
      });
    }

    /** Slide info cards back onto the deck (call while they’re in dealt state). */
    function stackHandIn() {
      if (!hand || !handCards.length) return;
      var rm = prefersReducedMotion();
      var t = getTiming();
      setStackOffsets();
      requestAnimationFrame(function () {
        handCards.forEach(function (c, i) {
          window.setTimeout(function () {
            c.classList.add("ygo-info-card--stacked");
          }, rm ? 0 : i * t.handStagger);
        });
      });
    }

    /** Clear overlay spell UI only (bio hand unchanged). */
    function resetOverlaySpellOnly() {
      overlay.classList.remove("spell-active");
      if (burst) burst.classList.remove("is-active");
      if (flash) flash.classList.remove("is-active");
      if (returnBtn) returnBtn.hidden = true;
      flipCard.classList.remove("is-flipped", "spell-pulse");
      anchor.style.opacity = "0";
      anchor.style.pointerEvents = "none";
      anchor.style.transform = "none";
      anchor.style.transition = "none";
      anchor.style.position = "";
      anchor.style.left = "";
      anchor.style.top = "";
      anchor.style.width = "";
      anchor.style.height = "";
      anchor.style.margin = "";
      dealLayer.innerHTML = "";
      if (msg) {
        msg.hidden = true;
        msg.classList.remove("is-visible");
      }
    }

    function hardResetDom() {
      clearAutoDismissTimer();
      spellRevealVisible = false;
      bioVisible = false;
      dismissingSpell = false;
      document.body.classList.remove("ygo-bio-reveal");
      overlay.classList.remove("is-on", "spell-active", "is-dismissing");
      overlay.setAttribute("aria-hidden", "true");
      resetOverlaySpellOnly();
      document.body.style.overflow = "";
      deckBtn.disabled = false;
    }

    function clearDealCards() {
      dealLayer.innerHTML = "";
    }

    function runDealBurst(deckRect, t) {
      return new Promise(function (resolve) {
        var rm = prefersReducedMotion();
        var baseLeft = deckRect.left + deckRect.width / 2 - 28;
        var baseTop = deckRect.top + deckRect.height / 2 - 41;
        var moves = [
          { x: -18, y: -52, rot: -10 },
          { x: 8, y: -64, rot: 4 },
          { x: 28, y: -48, rot: 12 },
          { x: -6, y: -72, rot: -7 },
        ];

        for (var i = 0; i < DEAL_COUNT; i++) {
          (function (idx) {
            var el = document.createElement("div");
            el.className = "ygo-deal-card";
            el.setAttribute("aria-hidden", "true");
            el.style.left = baseLeft + "px";
            el.style.top = baseTop + "px";
            el.style.backgroundImage = 'url("' + ASSETS.cardBack + '")';
            el.style.transform = "translate(0,0) rotate(0deg)";
            dealLayer.appendChild(el);

            window.setTimeout(
              function () {
                var m = moves[idx] || moves[0];
                el.style.transform =
                  "translate(" + m.x + "px," + m.y + "px) rotate(" + m.rot + "deg)";
              },
              rm ? 0 : idx * t.dealStagger,
            );
          })(i);
        }

        window.setTimeout(
          function () {
            var cards = dealLayer.querySelectorAll(".ygo-deal-card");
            cards.forEach(function (c) {
              c.classList.add("is-fade");
            });
            window.setTimeout(function () {
              clearDealCards();
              resolve();
            }, rm ? 50 : t.dealFade);
          },
          rm ? 120 : t.dealMove,
        );
      });
    }

    /**
     * Move the drawn card with left/top only — NOT transform on this ancestor —
     * so the inner 3D flip can show the spell front (GIPHY) after rotateY.
     */
    function flyFocusFromDeck(deckRect, t) {
      return new Promise(function (resolve) {
        var rm = prefersReducedMotion();
        var dims = cardFlyDims();
        var w = dims.w;
        var h = dims.h;
        var easeFly = "cubic-bezier(0.22, 1, 0.36, 1)";
        var easeEmerge = "cubic-bezier(0.25, 0.85, 0.3, 1)";

        var left0 = deckRect.left + deckRect.width / 2 - w / 2;
        var top0 = deckRect.top + deckRect.height / 2 - h / 2;
        var topEmerge = top0 - (rm ? 10 : 48);
        var left1 = window.innerWidth / 2 - w / 2;
        var top1 = window.innerHeight * 0.42 - h / 2;

        flipCard.classList.remove("is-flipped", "spell-pulse");
        anchor.style.position = "fixed";
        anchor.style.width = w + "px";
        anchor.style.height = h + "px";
        anchor.style.margin = "0";
        anchor.style.transform = "none";
        anchor.style.pointerEvents = "none";
        anchor.style.transition = "none";
        anchor.style.left = left0 + "px";
        anchor.style.top = top0 + "px";
        anchor.style.opacity = "1";

        if (rm) {
          anchor.style.transition =
            "left 0.22s " + easeFly + ", top 0.22s " + easeFly;
          anchor.style.left = left1 + "px";
          anchor.style.top = top1 + "px";
          window.setTimeout(resolve, 240);
          return;
        }

        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            anchor.style.transition =
              "left 0.34s " + easeEmerge + ", top 0.34s " + easeEmerge;
            anchor.style.left = left0 + "px";
            anchor.style.top = topEmerge + "px";

            window.setTimeout(function () {
              anchor.style.transition =
                "left " +
                t.flyToCenter / 1000 +
                "s " +
                easeFly +
                ", top " +
                t.flyToCenter / 1000 +
                "s " +
                easeFly;
              anchor.style.left = left1 + "px";
              anchor.style.top = top1 + "px";
              window.setTimeout(resolve, t.flyToCenter + 60);
            }, t.emerge);
          });
        });
      });
    }

    /** Fade spell away so the fanned bio cards in About are visible. */
    async function dismissOverlayRevealBio() {
      if (bioVisible || dismissingSpell || !overlay.classList.contains("is-on")) return;
      dismissingSpell = true;
      busy = true;
      clearAutoDismissTimer();
      spellRevealVisible = false;

      var rm = prefersReducedMotion();
      overlay.classList.add("is-dismissing");
      await wait(rm ? 80 : 540);

      overlay.classList.remove("is-dismissing", "is-on");
      overlay.setAttribute("aria-hidden", "true");
      resetOverlaySpellOnly();
      document.body.style.overflow = "";
      document.body.classList.add("ygo-bio-reveal");

      bioVisible = true;
      dismissingSpell = false;
      busy = false;
      deckBtn.disabled = false;

      var aboutEl = document.getElementById("about");
      if (aboutEl && !rm) {
        window.requestAnimationFrame(function () {
          aboutEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });
      }
    }

    /** Stack bio cards on deck and return to idle (ready to replay spell). */
    async function stackHandAndResetIdle() {
      if (busy || !bioVisible) return;
      busy = true;
      document.body.classList.remove("ygo-bio-reveal");

      stackHandIn();
      var t = getTiming();
      var rm = prefersReducedMotion();
      var handTime =
        t.handStagger * Math.max(0, handCards.length - 1) + (rm ? 80 : 520);
      await wait(handTime);

      hand.setAttribute("aria-hidden", "true");
      bioVisible = false;
      busy = false;
      deckBtn.disabled = false;
    }

    async function playSequence() {
      if (busy) return;
      if (overlay.classList.contains("is-on")) return;

      busy = true;
      spellRevealVisible = false;
      bioVisible = false;
      document.body.classList.remove("ygo-bio-reveal");
      clearAutoDismissTimer();
      deckBtn.disabled = true;
      document.body.style.overflow = "hidden";

      var t = getTiming();
      var deckRect = deckBtn.getBoundingClientRect();

      overlay.classList.remove("is-dismissing");
      overlay.classList.add("is-on");
      overlay.setAttribute("aria-hidden", "false");
      overlay.classList.remove("spell-active");
      if (burst) burst.classList.remove("is-active");
      if (flash) flash.classList.remove("is-active");
      if (returnBtn) returnBtn.hidden = true;
      if (msg) {
        msg.hidden = true;
        msg.classList.remove("is-visible");
      }

      dealHandOut();

      await runDealBurst(deckRect, t);
      await flyFocusFromDeck(deckRect, t);

      await wait(t.flipDelay);
      if (!overlay.classList.contains("is-on")) {
        busy = false;
        deckBtn.disabled = false;
        return;
      }
      flipCard.classList.add("is-flipped");
      spellRevealVisible = true;
      busy = false;

      await wait(t.spellFxDelay);
      if (!overlay.classList.contains("is-on")) {
        busy = false;
        deckBtn.disabled = !bioVisible;
        return;
      }
      overlay.classList.add("spell-active");
      flipCard.classList.add("spell-pulse");
      if (burst) {
        burst.classList.remove("is-active");
        void burst.offsetWidth;
        burst.classList.add("is-active");
      }
      if (flash) {
        flash.classList.remove("is-active");
        void flash.offsetWidth;
        flash.classList.add("is-active");
      }
      playChime();

      await wait(t.messageDelay);
      if (!overlay.classList.contains("is-on")) {
        busy = false;
        deckBtn.disabled = !bioVisible;
        return;
      }
      if (msg) {
        msg.hidden = false;
        msg.classList.add("is-visible");
      }

      busy = false;

      var holdMs = prefersReducedMotion() ? SPELL_HOLD_MS_RM : SPELL_HOLD_MS;
      clearAutoDismissTimer();
      autoDismissTimer = setTimeout(function () {
        autoDismissTimer = null;
        if (overlay.classList.contains("is-on")) dismissOverlayRevealBio();
      }, holdMs);
    }

    function onDeckActivate() {
      if (busy) return;
      if (overlay.classList.contains("is-on")) return;
      if (bioVisible) {
        stackHandAndResetIdle();
        return;
      }
      playSequence();
    }

    deckBtn.addEventListener("click", onDeckActivate);

    deckBtn.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onDeckActivate();
      }
    });

    if (returnBtn) {
      returnBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        if (spellRevealVisible) dismissOverlayRevealBio();
      });
    }

    overlay.addEventListener("click", function (e) {
      if (!spellRevealVisible || busy || dismissingSpell) return;
      if (e.target.closest(".ygo-focus-anchor")) return;
      if (e.target.closest(".ygo-spell-msg")) return;
      if (e.target.closest(".ygo-overlay-deck-return")) return;
      if (e.target.classList.contains("ygo-spell-dim")) dismissOverlayRevealBio();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (
        spellRevealVisible &&
        overlay.classList.contains("is-on") &&
        !dismissingSpell
      ) {
        e.preventDefault();
        dismissOverlayRevealBio();
        return;
      }
      if (bioVisible && !busy) {
        e.preventDefault();
        stackHandAndResetIdle();
      }
    });

    window.addEventListener(
      "resize",
      function () {
        if (!hand || !handCards.length) return;
        var anyStacked = handCards.some(function (c) {
          return c.classList.contains("ygo-info-card--stacked");
        });
        if (anyStacked) {
          handCards.forEach(function (c) {
            c.classList.add("ygo-info-card--no-trans");
          });
          setStackOffsets();
          handCards.forEach(function (c) {
            c.classList.remove("ygo-info-card--no-trans");
          });
        }
      },
      { passive: true },
    );

    initHandLayout();
    hardResetDom();
  });
})();
