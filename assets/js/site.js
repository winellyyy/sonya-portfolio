(() => {
  const about = document.querySelector(".about");
  const bloomVideos = [...document.querySelectorAll(".about__bloom-video")];
  const cases = document.querySelector("#cases");
  const contacts = document.querySelector("#contacts");
  const backToCases = document.querySelector(".back-to-cases");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let animationFrame = 0;
  let aboutIsNearViewport = true;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const smoothstep = (value) => value * value * (3 - 2 * value);

  const seekBloom = (video, progress) => {
    if (video.readyState < 1 || !Number.isFinite(video.duration) || video.duration <= 0) return;

    const endTime = Math.max(0, video.duration - 0.06);
    const targetTime = reducedMotion.matches
      ? endTime
      : Math.round(endTime * progress * 24) / 24;

    if (Math.abs(video.currentTime - targetTime) < 1 / 30) return;

    try {
      video.currentTime = targetTime;
    } catch {
      // The poster remains visible if a browser cannot seek the selected source yet.
    }
  };

  const render = () => {
    animationFrame = 0;

    if (about && bloomVideos.length && (aboutIsNearViewport || reducedMotion.matches)) {
      const bounds = about.getBoundingClientRect();
      const startLine = window.innerHeight * 0.78;
      const distance = Math.max(320, window.innerHeight * 0.72);
      const progress = smoothstep(clamp((startLine - bounds.top) / distance, 0, 1));

      bloomVideos.forEach((video) => seekBloom(video, progress));
    }

    if (cases && contacts && backToCases) {
      const casesTop = cases.getBoundingClientRect().top;
      const contactsTop = contacts.getBoundingClientRect().top;
      const shouldShow = casesTop < 0 && contactsTop > window.innerHeight * 0.45;
      backToCases.classList.toggle("is-visible", shouldShow);
    }
  };

  const requestRender = () => {
    if (!animationFrame) animationFrame = window.requestAnimationFrame(render);
  };

  bloomVideos.forEach((video) => {
    video.pause();
    video.addEventListener("loadedmetadata", requestRender);
    video.addEventListener("durationchange", requestRender);
    video.addEventListener("canplay", requestRender, { once: true });
  });

  if (about && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        aboutIsNearViewport = entry.isIntersecting;
        requestRender();
      },
      { rootMargin: "90% 0px 90% 0px" },
    );
    observer.observe(about);
  }

  window.addEventListener("scroll", requestRender, { passive: true });
  window.addEventListener("resize", requestRender, { passive: true });
  reducedMotion.addEventListener?.("change", requestRender);
  requestRender();
})();
