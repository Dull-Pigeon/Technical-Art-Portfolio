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

async function initialize() {
  try {
    const response = await fetch(new URL('./video-config.json', import.meta.url), {cache: 'no-cache'});
    if (!response.ok) return;
    const id = youtubeId((await response.json()).showcaseUrl);
    if (!id) return;
    document.querySelectorAll('[data-external-video]').forEach(frame => {
      const status = frame.querySelector('.video-status');
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'video-status'; button.textContent = 'Play on YouTube';
      status.replaceWith(button);
      const caption = frame.closest('figure')?.querySelector('figcaption');
      if (caption && frame.dataset.playCaption) caption.textContent = frame.dataset.playCaption;
      button.addEventListener('click', () => {
        const source = new URL('https://www.youtube-nocookie.com/embed/' + id);
        for (const key of ['start', 'end']) if (Number(frame.dataset[key]) > 0) source.searchParams.set(key, frame.dataset[key]);
        source.searchParams.set('autoplay', '1');
        const player = document.createElement('iframe');
        player.src = source.href; player.title = 'Project Kinetica Showcase';
        player.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
        player.allowFullscreen = true; player.referrerPolicy = 'strict-origin-when-cross-origin';
        frame.replaceChildren(player);
      }, {once:true});
    });
  } catch { /* Retain the poster when the configuration cannot be loaded. */ }
}
if (typeof document !== 'undefined') initialize();
