/**
 * Centered vinyl-style music player (playlist-ready).
 * Exposes window.VinylPlayer for future next/prev UI.
 */
(function () {
  "use strict";

  /**
   * @typedef {{ title: string, src: string }} Track
   */

  /** @type {Track[]} Add tracks here — order is playlist order. */
  const PLAYLIST = [
    {
      title: "Tobu - Candyland",
      src: "assets/Tobu%20-%20Candyland.mp3",
    },
    // { title: "Artist — Song", src: "assets/file.mp3" },
  ];

  function init() {
    const root = document.getElementById("vinyl-player");
    const audio = document.getElementById("vinyl-audio");
    const titleEl = document.getElementById("vinyl-track-title");
    const toggle = document.getElementById("vinyl-play-toggle");
    if (!root || !audio || !titleEl || !toggle) return;

    let currentIndex = 0;

    function loadTrack(index) {
      const t = PLAYLIST[index];
      if (!t) return;
      const wasPlaying = !audio.paused;
      currentIndex = index;
      audio.src = t.src;
      titleEl.textContent = t.title;
      if (wasPlaying) {
        audio.play().catch(function () {
          root.classList.remove("vinyl-player--playing");
          toggle.setAttribute("aria-pressed", "false");
        });
      }
    }

    function setPlayingUI(playing) {
      root.classList.toggle("vinyl-player--playing", !!playing);
      toggle.setAttribute("aria-pressed", playing ? "true" : "false");
    }

    loadTrack(0);

    audio.addEventListener("play", function () {
      setPlayingUI(true);
    });
    audio.addEventListener("pause", function () {
      setPlayingUI(false);
    });
    audio.addEventListener("ended", function () {
      setPlayingUI(false);
    });

    toggle.addEventListener("click", async function () {
      if (audio.paused) {
        try {
          await audio.play();
        } catch (_) {
          setPlayingUI(false);
        }
      } else {
        audio.pause();
      }
    });

    window.VinylPlayer = {
      PLAYLIST: PLAYLIST,
      getCurrentIndex: function () {
        return currentIndex;
      },
      loadTrack: loadTrack,
      next: function () {
        var next = (currentIndex + 1) % PLAYLIST.length;
        loadTrack(next);
      },
      prev: function () {
        var prev = (currentIndex - 1 + PLAYLIST.length) % PLAYLIST.length;
        loadTrack(prev);
      },
      play: function () {
        return audio.play();
      },
      pause: function () {
        audio.pause();
      },
      getAudio: function () {
        return audio;
      },
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
