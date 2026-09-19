export function youtubeId(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return null;
    const host = url.hostname.toLowerCase();
    let id = null;
    if (host === 'youtu.be') id = url.pathname.slice(1).split('/')[0];
    else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'www.youtube-nocookie.com'].includes(host)) {
      id = url.pathname === '/watch' ? url.searchParams.get('v') : /^\/(?:embed|shorts)\/([^/]+)/.exec(url.pathname)?.[1];
    }
    return /^[A-Za-z0-9_-]{11}$/.test(id || '') ? id : null;
  } catch { return null; }
}

function activateFrame(frame, id) {
  if (frame.dataset.activated === 'true') return;
  frame.dataset.activated = 'true';
  frame.classList.remove('is-ready');
  frame.removeAttribute('role');
  frame.removeAttribute('tabindex');
  frame.removeAttribute('aria-label');

  const source = new URL('https://www.youtube-nocookie.com/embed/' + id);
  for (const key of ['start', 'end']) if (Number(frame.dataset[key]) > 0) source.searchParams.set(key, frame.dataset[key]);
  source.searchParams.set('autoplay', '1');

  const player = document.createElement('iframe');
  player.src = source.href;
  player.title = 'Project Kinetica Showcase';
  player.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  player.allowFullscreen = true;
  player.referrerPolicy = 'strict-origin-when-cross-origin';
  frame.replaceChildren(player);
}

async function initialize() {
  try {
    const response = await fetch(new URL('./video-config.json', import.meta.url), {cache: 'no-cache'});
    if (!response.ok) return;
    const id = youtubeId((await response.json()).showcaseUrl);
    if (!id) return;
    document.querySelectorAll('[data-external-video]').forEach(frame => {
      const caption = frame.closest('figure')?.querySelector('figcaption');
      if (caption && frame.dataset.playCaption) caption.textContent = frame.dataset.playCaption;
      frame.classList.add('is-ready');
      frame.tabIndex = 0;
      frame.setAttribute('role', 'button');
      frame.setAttribute('aria-label', frame.dataset.playLabel || 'Play Project Kinetica Showcase');

      const activate = event => {
        if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;
        event.preventDefault();
        activateFrame(frame, id);
      };
      frame.addEventListener('click', activate);
      frame.addEventListener('keydown', activate);
    });
  } catch { /* Retain the poster when the configuration cannot be loaded. */ }
}
if (typeof document !== 'undefined') initialize();
