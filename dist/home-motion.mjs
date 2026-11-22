const motion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (!motion.matches && typeof IntersectionObserver === 'function') {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      if (!motion.matches && !entry.target.matches(':focus-within')) {
        entry.target.classList.add('is-revealed');
      }
    }
  }, { rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.featured, .future-preview, .home-notes').forEach(section => {
    observer.observe(section);
  });
}
