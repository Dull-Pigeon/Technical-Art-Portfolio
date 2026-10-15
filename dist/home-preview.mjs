export function initializeHomePreview(root) {
  const video = root.querySelector('video[data-src]');
  const button = root.querySelector('.preview-toggle');
  if (!video || !button || !video.dataset.src || typeof video.play !== 'function') return;

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let observer;
  let inView = false;
  let manuallyPaused = false;
  let motionConsent = false;
  let autoplayBlocked = false;
  let pendingPlay = false;
  let request = 0;

  video.muted = true;
  video.defaultMuted = true;
  video.loop = true;
  video.playsInline = true;

  function showPlaying(playing) {
    root.dataset.playing = String(playing);
    button.setAttribute('aria-label', playing ? 'Pause preview' : 'Play preview');
  }

  function canPlay() {
    return inView && document.visibilityState === 'visible' && !manuallyPaused &&
      !autoplayBlocked && (!motion.matches || motionConsent);
  }

  function pause() {
    request += 1;
    pendingPlay = false;
    video.pause();
    if (video.paused) showPlaying(false);
  }

  function play() {
    if (!canPlay() || pendingPlay || !video.paused) return;
    pendingPlay = true;
    const current = ++request;

    // Do not request the local file until playback is actually wanted.
    if (!video.hasAttribute('src')) video.src = video.dataset.src;
    else if (video.error) video.load();

    const failed = () => {
      if (current !== request) return;
      pendingPlay = false;
      autoplayBlocked = true;
      video.pause();
      root.dataset.ready = 'false';
      showPlaying(false);
    };

    try {
      Promise.resolve(video.play()).then(() => {
        if (current === request) pendingPlay = false;
        // A pending play can settle after a scroll, tab change or manual pause.
        if (!canPlay()) video.pause();
      }, failed);
    } catch {
      failed();
    }
  }

  function reconcile() {
    if (!canPlay()) pause();
    else if (observer) play();
  }

  video.addEventListener('playing', () => {
    if (!canPlay()) {
      pause();
      return;
    }
    root.dataset.ready = 'true';
    showPlaying(true);
  });
  video.addEventListener('pause', () => showPlaying(false));
  video.addEventListener('ended', () => showPlaying(false));
  video.addEventListener('error', () => {
    autoplayBlocked = true;
    root.dataset.ready = 'false';
    pause();
  });

  button.type = 'button';
  button.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    if (pendingPlay || !video.paused) {
      manuallyPaused = true;
      pause();
      return;
    }

    manuallyPaused = false;
    motionConsent = true;
    autoplayBlocked = false;
    // Focus can scroll the button into view before the observer is delivered.
    const rect = root.getBoundingClientRect();
    const visibleWidth = Math.max(0, Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0));
    const visibleHeight = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0));
    inView = rect.width > 0 && rect.height > 0 &&
      visibleWidth * visibleHeight >= rect.width * rect.height * 0.5;
    play();
  });

  document.addEventListener('visibilitychange', reconcile);
  const motionChanged = () => {
    if (motion.matches) {
      motionConsent = false;
      root.dataset.ready = 'false';
      pause();
    }
    reconcile();
  };
  if (motion.addEventListener) motion.addEventListener('change', motionChanged);
  else motion.addListener(motionChanged);

  if (typeof IntersectionObserver === 'function') {
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.target !== root) continue;
        inView = entry.isIntersecting && entry.intersectionRatio >= 0.5;
        reconcile();
      }
    }, {threshold: [0, 0.5]});
    observer.observe(root);
  }

  root.dataset.ready = 'false';
  showPlaying(false);
  button.hidden = false;
}

if (typeof document !== 'undefined') {
  document.querySelectorAll('[data-home-preview]').forEach(initializeHomePreview);
}
