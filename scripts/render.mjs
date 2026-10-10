import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const site = JSON.parse(readFileSync(new URL('../content/site.json', import.meta.url)));
const project = JSON.parse(readFileSync(new URL('../content/kinetica.json', import.meta.url)));
const notes = JSON.parse(readFileSync(new URL('../content/notes.json', import.meta.url)));
const root = new URL('../dist/', import.meta.url);
const basePath = (process.env.SITE_BASE_PATH || '').replace(/\/$/, '');
if (basePath && !/^\/[A-Za-z0-9_/-]+$/.test(basePath)) throw new Error('Invalid SITE_BASE_PATH');
const e = x => String(x).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const a = (url,label,cls='',download=false) => `<a class="${cls}" href="${e(url)}"${download?' download':''}>${label}</a>`;
// Text links are the default; only primary actions opt into button styling.
const portfolioUrl = new URL('https://dull-pigeon.github.io/Technical-Art-Portfolio/');
const action = (url,label,cls='text-link',direction='') => {
 const clean = label.replace(/^[←]\s*|\s*[→↗↓↑]$/g,'');
 const target = new URL(url,portfolioUrl);
 const relative = !/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(url);
 const internal = relative || (target.origin === portfolioUrl.origin &&
  (target.pathname === portfolioUrl.pathname.slice(0,-1) || target.pathname.startsWith(portfolioUrl.pathname)));
 const arrow = direction || (internal && target.hash === '#top' ? '↑' :
  /\.pdf$/i.test(target.pathname) ? '↓' : internal ? '→' : '↗');
 const text = `<span class="action-label">${e(clean)}</span>`;
 const marker = `<span class="action-arrow" aria-hidden="true">${arrow}</span>`;
 return a(url,arrow === '←' ? marker+text : text+marker,cls+' action-link',arrow === '↓');
};
const back = (url,parent) => action(url,parent,'text-link','←');
const media = (key,compact=false) => {
 const m=project.media[key];
 const width=m.width||1920, height=m.height||1080;
 let body=m.type==='external-video' ? `<div class="external-video" data-external-video data-start="${m.start||0}" data-end="${m.end||0}" data-play-label="${e(m.playLabel||`Play ${m.label}`)}"${m.playCaption?` data-play-caption="${e(m.playCaption)}"`:''}><img src="${e(m.poster)}" alt="${e(m.alt)}" width="${width}" height="${height}" loading="lazy"><span class="video-play-icon" aria-hidden="true"></span></div>` : m.src ? (m.type==='video' ? `<video controls playsinline preload="none" ${m.poster?`poster="${e(m.poster)}"`:''} aria-label="${e(m.label)}"><source src="${e(m.src)}" type="video/mp4">${action(m.src,'Download video','text-link','↓')}</video>` : `<img src="${e(m.src)}" alt="${e(m.alt)}" loading="${key==='hero'?'eager':'lazy'}" width="${width}" height="${height}">`) : `<div class="media-placeholder"><span class="frame-corner" aria-hidden="true"></span><div><span class="micro">IMAGE</span><p>${e(m.label)}</p></div><span class="aspect micro">16:9</span></div>`;
 return `<figure class="media media-${e(key)} ${compact?'compact':''}">${body}${m.caption?`<figcaption>${e(m.caption)}</figcaption>`:''}</figure>`;
};

// Validate structured notes before writing any generated pages.
const slugs = new Set();
const requiredText = (value, field) => {
 if (typeof value !== 'string' || !value.trim()) throw new Error(`Missing note ${field}`);
};
const noteUrl = value => {
 requiredText(value, 'URL');
 if (!/^\/(?!\/)/.test(value) && !/^https:\/\//.test(value)) throw new Error('Note URLs must be site-relative or HTTPS');
 return value;
};
const noteImageContent = (image,eager=false) => {
 noteUrl(image.src);
 requiredText(image.alt, 'image alt text');
 if (!Number.isInteger(image.width) || image.width <= 0 || !Number.isInteger(image.height) || image.height <= 0) throw new Error('Note images require positive integer dimensions');
 if (image.layout !== undefined && !['paired','portrait'].includes(image.layout)) throw new Error('Invalid note image layout');
 return `<img src="${e(image.src)}" alt="${e(image.alt)}" width="${image.width}" height="${image.height}" loading="${eager?'eager':'lazy'}">`;
};
const noteImage = (image,eager=false) => `<figure class="media note-media${image.layout?' note-media-'+image.layout:''}">${noteImageContent(image,eager)}${image.caption?`<figcaption>${e(image.caption)}</figcaption>`:''}</figure>`;
const noteSectionMedia = item => {
 if (item.images === undefined) return noteImage(item);
 if (item.layout !== 'paired' || !Array.isArray(item.images) || item.images.length !== 2) throw new Error('Note comparisons require two images and paired layout');
 requiredText(item.caption, 'comparison caption');
 const panels = item.images.map(image => {
  if (!image || image.images !== undefined || image.layout !== undefined || image.caption !== undefined) throw new Error('Comparison panels must be plain images without layout or captions');
  return noteImageContent(image);
 });
 if (item.images[0].width !== item.images[1].width || item.images[0].height !== item.images[1].height) throw new Error('Comparison images require identical dimensions');
 return `<figure class="media note-media note-comparison"><div class="note-comparison-panels">${panels.join('')}</div><figcaption>${e(item.caption)}</figcaption></figure>`;
};
if (!Array.isArray(notes)) throw new Error('Notes must be an array');
for (const note of notes) {
 for (const field of ['slug','date','project','title','summary']) requiredText(note[field], field);
 if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(note.slug) || slugs.has(note.slug)) throw new Error('Invalid or duplicate note slug');
 slugs.add(note.slug);
 if (!/^\d{4}-\d{2}-\d{2}$/.test(note.date) || !Number.isFinite(Date.parse(note.date)) || new Date(note.date).toISOString().slice(0,10) !== note.date) throw new Error('Invalid note publication date');
 if (!Array.isArray(note.body) || !note.body.length || !Array.isArray(note.media)) throw new Error('Note body and media must be arrays');
 if (note.tags !== undefined && (!Array.isArray(note.tags) || note.tags.some(tag => typeof tag !== 'string' || !tag.trim()))) throw new Error('Invalid note tags');
 if (note.hero) noteImage(note.hero);
 note.media.forEach(image => noteImage(image));
 for (const block of note.body) {
  if (block.heading !== undefined) requiredText(block.heading, 'heading');
  if (!Array.isArray(block.paragraphs) || !block.paragraphs.length) throw new Error('Note sections require paragraphs');
  block.paragraphs.forEach(value => requiredText(value, 'paragraph'));
  if (block.media !== undefined) {
   if (!Array.isArray(block.media)) throw new Error('Note section media must be an array');
   block.media.forEach(item => noteSectionMedia(item));
   for (let i=0; i<block.media.length; i++) {
    if (block.media[i].layout === 'paired' && block.media[i].images === undefined) {
     if (block.media[i+1]?.layout !== 'paired' || block.media[i+1].images !== undefined) throw new Error('Paired note images must be adjacent pairs');
     i++;
    }
   }
  }
  if (block.links !== undefined) {
   if (!Array.isArray(block.links)) throw new Error('Note links must be an array');
   block.links.forEach(link => { requiredText(link.label, 'link label'); noteUrl(link.url); if (link.primary !== undefined && typeof link.primary !== 'boolean') throw new Error('Note link primary must be a boolean'); });
  }
 }
}
notes.sort((a,b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
const noteMeta = note => `<div class="micro note-meta"><time datetime="${e(note.date)}">${e(note.date)}</time> / ${e(note.project)} / Development note</div>`;
const noteList = items => items.length ? `<div class="note-list">${items.map(note => `<article class="note-preview">${noteMeta(note)}<h3>${action('/notes/'+note.slug+'/',note.title,'heading-link')}</h3><p>${e(note.summary)}</p></article>`).join('')}</div>` : '<p>No development notes published yet.</p>';
const homeNotes = `<section id="notes" class="home-notes" aria-labelledby="notes-heading"><div class="section-heading"><h2 id="notes-heading">${action('/notes/','Development Notes','heading-link')}</h2></div>${noteList(notes.slice(0,3))}</section>`;

const footer=()=>`<footer id="contact"><div><span class="micro">CONTACT / ELSEWHERE</span><h2>Lin Wenqi.</h2><p>Dull Pigeon is the public creator identity used for project repositories and video.</p></div><div class="footer-links">${action(site.github,'Dull Pigeon on GitHub')}${site.email?action('mailto:'+site.email,site.email):''}${site.resume?action(site.resume,'Résumé'):''}</div><div class="colophon"><span>${e(site.name)} · Technical Art</span><span>Shaders / VFX / Systems</span>${action('#top','Back to top')}</div></footer>`;
const shell=(title,description,body,active='work')=>`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${e(title)} — ${e(site.name)}</title><meta name="description" content="${e(description)}"><meta name="color-scheme" content="light"><link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%23156280'/%3E%3Cpath d='M8 8v16M9 16l14-8M9 16l14 8' stroke='%23f7f9fb' stroke-width='3'/%3E%3C/svg%3E"><link rel="stylesheet" href="/styles.css"><script type="module" src="/external-video.mjs"></script></head><body id="top"><a class="skip" href="#main">Skip to content</a><header><a class="brand" href="/">${e(site.name)}<span>Technical Art</span></a><nav aria-label="Main navigation">${a('/#work','Work',active==='work'?'active':'')}${a('/#notes','Notes',active==='notes'?'active':'')}${a('/#about','About')}${a('#contact','Contact')}</nav></header><main id="main">${body}</main>${footer()}</body></html>`.replace(/(href|src|poster)="\/(?!\/)/g, `$1="${basePath}/`);
const home=`<section class="home-hero"><div class="eyebrow"><span class="dot"></span> TECHNICAL ART PORTFOLIO</div><h1>Shaders, VFX and<br><span>real-time systems.</span></h1><div class="hero-bottom"><p>${e(site.intro)}</p><span class="micro">COMPUTER SCIENCE UNDERGRADUATE<br>SHADERS · VFX · SYSTEMS</span></div></section><section id="work" class="work"><div class="section-heading"><h2>Selected Work</h2><span class="micro">01 / FEATURED STUDY</span></div><article class="featured">${a('/projects/kinetica/',media('hero'), 'project-image')}<div class="project-info"><div><span class="micro">UNITY 6 / TECHNICAL ART</span><h3>${action('/projects/kinetica/','Project Kinetica','heading-link')}</h3><p>${e(site.projects[0].summary)}</p><div class="tags"><span>Vertex deformation</span><span>Impact systems</span><span>VFX</span></div></div><div class="project-side"><span class="status">Completed study</span>${action('/projects/kinetica/','Explore case study','button')}</div></div></article>${site.projects.filter(p=>!p.published).map(p=>`<article class="future"><div><span class="micro">02 / ${e(p.category)}</span><h3>${e(p.name)}</h3></div><p>${e(p.summary)}</p><span class="micro">${e(p.engine)}<br>${e(p.status)}</span></article>`).join('')}</section>${homeNotes}<section id="about" class="about"><span class="micro">ABOUT / APPROACH</span><div><h2>Shaders, VFX and<br>systems that connect them.</h2><p>${e(site.about)}</p><div class="skill-list"><span>Shader development</span><span>Real-time VFX</span><span>Technical systems</span><span>Unity / C#</span></div></div></section>`;
writeFileSync(new URL('index.html',root),shell('Technical Art Portfolio',site.intro,home));
const sections=[['overview','Overview'],['systems','Systems'],['comparisons','Comparisons'],['iterations','Iterations'],['scope','Sources']];
const study=`<section class="case-hero">${back('/#work','Selected Work')}<div class="case-heading"><div><span class="micro">01 / REAL-TIME MATERIAL RESPONSE</span><h1>Project Kinetica<span class="period">.</span></h1></div><span class="status">Completed study</span></div><p class="case-intro">${e(project.summary)}</p>${media('showcase')}<dl class="metadata">${project.meta.map(([k,v])=>`<div><dt>${e(k)}</dt><dd>${e(v)}</dd></div>`).join('')}</dl></section><div class="case-layout"><aside><nav aria-label="Case study sections">${sections.map(([id,label],i)=>a('#'+id,`<span>0${i+1}</span> ${label}`)).join('')}</nav></aside><div class="case-content"><section id="overview"><span class="micro">01 / OVERVIEW</span><h2>From weapon motion<br>to material response.</h2><p>The study follows one impact through detection, evaluation and presentation. Reusable weapon and material presets keep the calculations separate from the authored response.</p><ol class="pipeline">${['Weapon motion','Collision','Impact solver','Impact data','Deformation / VFX'].map((s,i)=>`<li><span>0${i+1}</span>${s}</li>`).join('')}</ol><p class="caption">Conceptual pipeline. In the implementation, deformation is called directly; the event payload feeds VFX and Debug observers.</p></section><section id="systems"><span class="micro">02 / SELECTED TECHNICAL HIGHLIGHTS</span><h2>Detection, evaluation<br>and response.</h2>${project.highlights.map(h=>`<article class="highlight"><span class="micro">${e(h.label)}</span><h3>${e(h.title)}</h3><p>${e(h.text)}</p><p class="secondary">${e(h.detail)}</p>${h.media?media(h.media,true):''}</article>`).join('')}</section><section id="comparisons"><span class="micro">03 / COMPARISONS</span><h2>Material and weapon<br>comparisons.</h2><p>Final Showcase frames compare authored responses rather than controlled physical measurements.</p>${media('materials')}<div class="materials">${project.materials.map(([n,t,d])=>`<article><span class="micro">${e(n)}</span><h3>${e(t)}</h3><p>${e(d)}</p></article>`).join('')}</div><h3 class="spaced">Changing the weapon</h3><p>Spear, hammer and sword strike Slime with different motion and weapon settings. The localized response follows each recorded contact.</p>${media('weapons')}</section><section id="iterations"><span class="micro">04 / PROBLEMS, ITERATIONS & PERFORMANCE</span><h2>Iteration and performance.</h2>${project.iterations.map(([t,d],i)=>`<article class="iteration"><span class="micro">0${i+1}</span><div><h3>${e(t)}</h3><p>${e(d)}</p></div></article>`).join('')}<details><summary>Supporting evidence / Runtime debugging <span aria-hidden="true">+</span></summary><p>The Debug Panel observes the same impact event as the VFX manager. It shows evaluated data for one recorded impact and is not a profiler. Solver deformation force is an intermediate value that ImpactReceiver scales again before passing it to the shader.</p>${media('debug',true)}${action(project.media.debug.src,'Open full-size Debug frame')}</details><details class="technical-evidence"><summary>Architecture and Shader Graph captures <span aria-hidden="true">+</span></summary><p>The architecture diagram follows the frozen implementation. The Shader Graph images are the supplied Unity captures.</p>${media('architecture',true)}${media('shaderSpatial',true)}${media('shaderTemporal',true)}</details></section><section id="scope"><span class="micro">05 / SCOPE, SOURCES & CREDITS</span><h2>Scope, sources and credits.</h2><p>This is a material-response study, not a complete combat or destruction system. Displacement affects rendered vertices, without changing topology or collision geometry. A single swept detection point approximates the weapon’s contact region.</p><p>The implementation is frozen. Effects are instantiated per impact; deformation stores one hit at a time. No performance benchmark is claimed.</p><div class="source-links">${action(project.breakdown,'Technical Breakdown PDF','button')}${action(project.repository,'Public selected source')}</div><p class="caption">Selected source corresponds to the frozen implementation at ${e(project.sourceCommit.slice(0,7))}. The PDF documents the implementation, results and limitations.</p><div class="credits"><h3>Credits</h3>${project.credits.map(([use,asset,source])=>`<div><span class="micro">${e(use)}</span><p><strong>${e(asset)}</strong><br>${e(source)}</p></div>`).join('')}</div></section></div></div><div class="end-link">${back('/#work','Selected Work')}</div>`;
mkdirSync(new URL('projects/kinetica/',root),{recursive:true});
writeFileSync(new URL('projects/kinetica/index.html',root),shell('Project Kinetica',project.summary,study));
writeFileSync(new URL('404.html',root),shell('Page not found','Page not found',`<section class="home-hero"><span class="micro">404</span><h1>Page not found.</h1>${back('/','Portfolio')}</section>`));
mkdirSync(new URL('notes/',root),{recursive:true});
writeFileSync(new URL('notes/index.html',root),shell('Development Notes','Notes on ongoing Technical Art and game-development work.',`<section class="notes-index">${back('/#notes','Portfolio')}<div class="eyebrow">TECHNICAL ART / DEVELOPMENT</div><h1>Development Notes.</h1>${noteList(notes)}</section>`,'notes'));
for (const note of notes) {
 const body = `<article class="note-page">${back('/notes/','Development Notes')}<div class="note-heading">${noteMeta(note)}<h1>${e(note.title)}</h1><p class="note-summary">${e(note.summary)}</p></div>${note.hero?noteImage(note.hero,true):''}<div class="note-body">${note.body.map(block => `<section>${block.heading?`<h2>${e(block.heading)}</h2>`:''}${block.paragraphs.map(p => `<p>${e(p)}</p>`).join('')}${block.media?.length?`<div class="note-section-media">${block.media.map(item => noteSectionMedia(item)).join('')}</div>`:''}${block.links?.length?`<div class="note-links">${block.links.map(link => action(noteUrl(link.url),link.label,link.primary?'button':'text-link')).join('')}</div>`:''}</section>`).join('')}${note.media.map(image => noteImage(image)).join('')}${note.tags?.length?`<div class="tags" aria-label="Technical tags">${note.tags.map(tag => `<span>${e(tag)}</span>`).join('')}</div>`:''}</div><div class="end-link">${back('/notes/','Development Notes')}</div></article>`;
 mkdirSync(new URL('notes/'+note.slug+'/',root),{recursive:true});
 writeFileSync(new URL('notes/'+note.slug+'/index.html',root),shell(note.title,note.summary,body,'notes'));
}
console.log(`Rendered home, Kinetica, 404, notes index and ${notes.length} note pages.`);
