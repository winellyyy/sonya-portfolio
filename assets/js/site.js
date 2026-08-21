(() => {
  const bloomSection = document.querySelector(".semantic-about");
  const bloomVideos = [...document.querySelectorAll(".about-bloom video")];
  const backButton = document.querySelector(".back-to-cases");
  const casesAnchor = document.querySelector("#cases");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let frameRequested = false;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const updateBloom = () => {
    if (!bloomSection || bloomVideos.length === 0) return;

    const rect = bloomSection.getBoundingClientRect();
    const start = window.innerHeight * 0.72;
    const finish = -rect.height * 0.2;
    const progress = reduceMotion.matches ? 1 : clamp((start - rect.top) / (start - finish), 0, 1);

    for (const video of bloomVideos) {
      if (!Number.isFinite(video.duration) || video.duration <= 0 || video.readyState < 1) continue;
      const frameDuration = 1 / 24;
      const target = Math.round((progress * (video.duration - frameDuration)) / frameDuration) * frameDuration;
      if (Math.abs(video.currentTime - target) > frameDuration / 2) video.currentTime = target;
    }
  };

  const updateBackButton = () => {
    if (!backButton || !casesAnchor) return;
    const threshold = casesAnchor.getBoundingClientRect().top + window.scrollY - 100;
    backButton.classList.toggle("is-visible", window.scrollY > threshold);
  };

  const update = () => {
    frameRequested = false;
    updateBloom();
    updateBackButton();
  };

  const requestUpdate = () => {
    if (frameRequested) return;
    frameRequested = true;
    window.requestAnimationFrame(update);
  };

  for (const video of bloomVideos) {
    video.pause();
    video.addEventListener("loadedmetadata", requestUpdate, { once: true });
    video.addEventListener("durationchange", requestUpdate);
  }

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate, { passive: true });
  reduceMotion.addEventListener?.("change", requestUpdate);
  requestUpdate();
})();
