(() => {
  const blooms = [...document.querySelectorAll(".about-bloom-video")];
  const trigger = document.querySelector(".about-bloom-left");

  if (!trigger || blooms.length === 0) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let frameRequest = 0;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const smoothstep = (value) => value * value * (3 - 2 * value);

  const seek = (video, progress) => {
    if (!Number.isFinite(video.duration) || video.duration <= 0) return;

    const endFrame = Math.max(0, video.duration - 0.08);
    const targetTime = endFrame * progress;

    if (Math.abs(video.currentTime - targetTime) > 1 / 48) {
      video.currentTime = targetTime;
    }
  };

  const render = () => {
    frameRequest = 0;

    if (reducedMotion.matches) {
      blooms.forEach((video) => seek(video, 1));
      return;
    }

    const bounds = trigger.getBoundingClientRect();
    const triggerTop = bounds.top + window.scrollY;
    const start = Math.max(0, triggerTop - window.innerHeight * 0.8);
    const distance = Math.max(240, window.innerHeight * 0.68);
    const progress = clamp((window.scrollY - start) / distance, 0, 1);
    const easedProgress = smoothstep(progress);

    blooms.forEach((video) => seek(video, easedProgress));
  };

  const requestRender = () => {
    if (!frameRequest) frameRequest = window.requestAnimationFrame(render);
  };

  blooms.forEach((video) => {
    video.pause();
    video.addEventListener("loadedmetadata", requestRender, { once: true });
    video.addEventListener("durationchange", requestRender);
  });

  window.addEventListener("scroll", requestRender, { passive: true });
  window.addEventListener("resize", requestRender, { passive: true });
  reducedMotion.addEventListener?.("change", requestRender);
  requestRender();
})();
