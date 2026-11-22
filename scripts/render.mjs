import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
const site = JSON.parse(readFileSync(new URL('../content/site.json', import.meta.url)));
const project = JSON.parse(readFileSync(new URL('../content/kinetica.json', import.meta.url)));
const notes = JSON.parse(readFileSync(new URL('../content/notes.json', import.meta.url)));
const root = new URL('../dist/', import.meta.url);
const stylesheet = name => {
 const version = createHash('sha256').update(readFileSync(new URL(name, root))).digest('hex').slice(0, 12);
 return `<link rel="stylesheet" href="/${name}?v=${version}">`;
};
const commonStyles = stylesheet('styles.css');
const homeStyles = stylesheet('home.css');
const caseStyles = stylesheet('kinetica.css');
const notesStyles = stylesheet('notes.css');
const basePath = (process.env.SITE_BASE_PATH || '').replace(/\/$/, '');
if (basePath && !/^\/[A-Za-z0-9_/-]+$/.test(basePath)) throw new Error('Invalid SITE_BASE_PATH');
const e = x => String(x).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
if (!Array.isArray(site.focusAreas) || !site.focusAreas.length || site.focusAreas.some(value => typeof value !== 'string' || !value.trim())) throw new Error('Site focus areas must contain nonempty text');

const a = (url,label,cls='',download=false) => `<a class="${cls}" href="${e(url)}"${download?' download':''}>${label}</a>`;
// Text links are the default; only primary actions opt into button styling.
const portfolioUrl = new URL('https://dull-pigeon.github.io/Technical-Art-Portfolio/');
const githubMark = readFileSync(new URL('assets/github-mark.svg',root),'utf8').trim();
const action = (url,label,cls='text-link',icon='') => {
 const clean = label.replace(/^[←]\s*|\s*[→↗↓↑]$/g,'');
 const download = /\.pdf$/i.test(new URL(url,portfolioUrl).pathname);
 return a(url,icon+`<span class="action-label">${e(clean)}</span>`,cls+' action-link',download);
};
const back = (url,parent) => action(url,'Back to '+parent);
// Opt in per technical figure; ordinary photos and video posters still fit the page.
const readableImage = (image,markup,label) => {
 if (image.readableWidth === undefined) return markup;
 if (!Number.isInteger(image.readableWidth) || image.readableWidth <= 0 || !Number.isInteger(image.width) || image.readableWidth > image.width || typeof label !== 'string' || !label.trim()) throw new Error('Readable images require a label and a positive minimum width within the source width');
 return `<div class="evidence-pan" tabindex="0" role="region" aria-label="${e(label)}" style="--evidence-width:${image.readableWidth}px">${markup}</div>`;
};
const previewToggle = (label='preview') => `<button class="preview-toggle" type="button" aria-label="Play ${e(label)}" hidden><svg class="preview-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg><svg class="preview-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg></button>`;
const comparisonVideos = {materials:'/assets/kinetica/material-comparison.mp4',weapons:'/assets/kinetica/weapon-comparison.mp4'};
const localComparison = (key,image) => {
 if (!Object.hasOwn(comparisonVideos,key) || image.src !== comparisonVideos[key] || image.width !== 1920 || image.height !== 1080 || typeof image.poster !== 'string' || !image.poster.startsWith('/assets/kinetica/') || typeof image.alt !== 'string' || !image.alt.trim() || typeof image.previewLabel !== 'string' || !image.previewLabel.trim()) throw new Error('Local comparisons require their reviewed video, poster, label and 1920 by 1080 dimensions');
 return `<div class="local-preview" data-local-preview data-preview-label="${e(image.previewLabel)}"><img src="${e(image.poster)}" alt="${e(image.alt)}" width="${image.width}" height="${image.height}" loading="lazy"><video class="preview-video" width="${image.width}" height="${image.height}" poster="${e(image.poster)}" data-src="${e(image.src)}" muted loop playsinline preload="none" aria-hidden="true" tabindex="-1"></video>${previewToggle(image.previewLabel)}</div>`;
};
const media = (key,compact=false) => {
 const m=project.media[key];
 const width=m.width||1920, height=m.height||1080;
 if (m.type !== undefined && !['external-video','local-video'].includes(m.type)) throw new Error('Unsupported project media type');
 let body=m.type==='local-video' ? localComparison(key,m) : m.type==='external-video' ? `<div class="external-video" data-external-video data-start="${m.start||0}" data-end="${m.end||0}" data-play-label="${e(m.playLabel||`Play ${m.label}`)}"${m.playCaption?` data-play-caption="${e(m.playCaption)}"`:''}><img src="${e(m.poster)}" alt="${e(m.alt)}" width="${width}" height="${height}" loading="lazy"><span class="video-play-icon" aria-hidden="true"></span></div>` : m.src ? `<img src="${e(m.src)}" alt="${e(m.alt)}" loading="${key==='hero'?'eager':'lazy'}" width="${width}" height="${height}">` : `<div class="media-placeholder"><span class="frame-corner" aria-hidden="true"></span><div><span class="micro">IMAGE</span><p>${e(m.label)}</p></div><span class="aspect micro">16:9</span></div>`;
 if (m.readableWidth !== undefined && (!m.src || m.type !== undefined)) throw new Error('Readable width is limited to technical images');
 return `<figure class="media media-${e(key)} ${compact?'compact':''}">${readableImage(m,body,m.label)}${m.caption?`<figcaption>${e(m.caption)}</figcaption>`:''}</figure>`;
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
 if (image.readableWidth !== undefined && (typeof image.disclosure !== 'string' || !image.disclosure.trim() || image.layout !== undefined)) throw new Error('Readable width requires a single disclosed note image');
 return `<img src="${e(image.src)}" alt="${e(image.alt)}" width="${image.width}" height="${image.height}" loading="${eager?'eager':'lazy'}">`;
};
const noteImage = (image,eager=false) => {
 const img = noteImageContent(image,eager);
 const body = readableImage(image,img,image.disclosure);
 return `<figure class="media note-media${image.layout?' note-media-'+image.layout:''}">${body}${image.caption?`<figcaption>${e(image.caption)}</figcaption>`:''}</figure>`;
};
// Homepage project covers show complete 16:9 images; article media keeps its own ratio.
const previewImage = (image,eager=false) => {
 if (!image || typeof image !== 'object' || Array.isArray(image)) throw new Error('Preview images require an image record');
 if (image.layout !== undefined || image.images !== undefined || image.caption !== undefined || image.disclosure !== undefined || image.cropTop !== undefined) throw new Error('Project previews must be plain image records without crops');
 const body = noteImageContent(image,eager);
 if (image.width * 9 !== image.height * 16) throw new Error('Homepage project covers require 16:9 dimensions');
 if (image.video !== undefined && image.video !== '/assets/kinetica/homepage-hammer-slime.mp4') throw new Error('Only the reviewed Kinetica homepage video is allowed');
 const video = image.video ? `<video class="preview-video" width="${image.width}" height="${image.height}" poster="${e(image.src)}" data-src="${e(image.video)}" muted loop playsinline preload="none" aria-hidden="true" tabindex="-1"></video>` : '';
 return `<figure class="media preview-media">${body}${video}</figure>`;
};
const noteSectionMedia = item => {
 if (item.disclosure !== undefined) {
  requiredText(item.disclosure, 'media disclosure label');
  if (item.layout !== undefined || item.images !== undefined) throw new Error('Note disclosures require a single full-width image');
  return `<details class="note-evidence"><summary>${e(item.disclosure)} <span class="disclosure-marker" aria-hidden="true"></span></summary>${noteImage(item)}</details>`;
 }
 if (item.images === undefined) return noteImage(item);
 if (item.layout !== 'paired' || !Array.isArray(item.images) || item.images.length !== 2) throw new Error('Note comparisons require two images and paired layout');
 requiredText(item.caption, 'comparison caption');
 const panels = item.images.map(image => {
  if (!image || image.images !== undefined || image.layout !== undefined || image.caption !== undefined || image.disclosure !== undefined) throw new Error('Comparison panels must be plain images without layout, captions or disclosures');
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
for (const item of site.projects) {
 if (item.preview !== undefined) {
  previewImage(item.preview);
  if (item.preview.video && item.slug !== 'kinetica') throw new Error('Local video is limited to the Kinetica homepage preview');
  if (!item.published && !item.noteUrl) throw new Error('Unpublished image previews require an existing note link');
 }
 if (item.previewLabel !== undefined) requiredText(item.previewLabel, 'project preview label');
 if (item.noteUrl !== undefined) {
  noteUrl(item.noteUrl);
  if (!notes.some(note=>item.noteUrl === '/notes/'+note.slug+'/')) throw new Error('Project preview must link to an existing note');
 }
}
const noteList = (items, metadata, heading = 'h3') => items.length ? `<div class="note-list">${items.map(note => `<article class="note-preview"><div class="note-preview-copy">${metadata(note)}<${heading}>${action('/notes/'+note.slug+'/',note.title,'heading-link')}</${heading}><p>${e(note.summary)}</p></div></article>`).join('')}</div>` : '<p>No development notes published yet.</p>';
const noteDate = note => `<time class="note-date" datetime="${e(note.date)}">${e(note.date)}</time>`;
const homeNotes = `<section id="notes" class="home-notes" aria-labelledby="notes-heading"><div class="section-heading"><h2 id="notes-heading">${action('/notes/','Development Notes','heading-link')}</h2></div>${noteList(notes.slice(0,3),noteDate)}</section>`;
const featuredProject = site.projects.find(item=>item.slug === 'kinetica' && item.published);
if (!featuredProject) throw new Error('The completed Kinetica study must remain featured');
const featuredImage = a('/projects/kinetica/',featuredProject.preview?previewImage(featuredProject.preview,true):media('hero'),'project-image');
const featuredPreview = featuredProject.preview?.video ? `<div class="project-preview" data-home-preview data-preview-label="Project Kinetica preview">${featuredImage}${previewToggle()}</div>` : featuredImage;
const projectTitle = (href, name) => action(href, name.replace(/^Project /, ''), 'heading-link');
const projectDescription = item => `${item.statement ? `<h4 class="project-statement">${e(item.statement)}</h4>` : ''}<p>${e(item.summary)}</p>`;
const upcomingProjects = site.projects.filter(item => !item.published).map(item => {
 const image = item.preview ? a(item.noteUrl,previewImage(item.preview),'project-image secondary-project-image') : '';
 const title = item.noteUrl ? projectTitle(item.noteUrl,item.name) : e(item.name);
 return `<article class="future${image?' future-preview':''}">${image}<h3 class="environment-title">${title}</h3><div class="secondary-project-info"><span class="project-progress">${item.previewLabel?e(item.previewLabel)+' / ':''}${e(item.status)}</span>${projectDescription(item)}</div></article>`;
}).join('');

const footer=(design='')=>{
 return `<footer id="contact"${design==='kinetica-case'?' class="case-footer"':''}><div>${design?'<h2>Contact</h2>':'<span class="micro">CONTACT / ELSEWHERE</span><h2>Lin Wenqi.</h2><p>Dull Pigeon is the public creator identity used for project repositories and video.</p>'}</div><div class="footer-links">${action(site.github,design?'GitHub':'Dull Pigeon on GitHub','text-link github-badge',githubMark)}${site.email?action('mailto:'+site.email,site.email):''}${site.resume?action(site.resume,'Résumé'):''}</div><div class="colophon"><span>${e(site.name)}${design?'':' · Technical Art'}</span>${design?'<span class="footer-studies">TECHNICAL ART &amp; ENVIRONMENT STUDIES</span>':`<span class="focus-areas">${site.focusAreas.map(e).join(' / ')}</span>`}${action('#top','Back to top')}</div></footer>`;
};
const shell=(title,description,body,active='work',design='')=>`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${e(title)} — ${e(site.name)}</title><meta name="description" content="${e(description)}"><meta name="color-scheme" content="light"><link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%23156280'/%3E%3Cpath d='M8 8v16M9 16l14-8M9 16l14 8' stroke='%23f7f9fb' stroke-width='3'/%3E%3C/svg%3E">${commonStyles}${design?homeStyles:''}${design==='kinetica-case'?caseStyles:''}${design==='portfolio-journal'?notesStyles:''}<script type="module" src="/external-video.mjs"></script></head><body id="top"${design?` class="${design}"`:''}><a class="skip" href="#main">Skip to content</a><header><a class="brand" href="/">${e(site.name)+(design?'':'<span>Technical Art</span>')}</a><nav aria-label="Main navigation">${a('/#work','Work',active==='work'?'active':'')}${a('/#notes','Notes',active==='notes'?'active':'')}${a('/#about','About')}${a('#contact','Contact')}</nav></header><main id="main">${body}</main>${footer(design)}</body></html>`.replace(/(href|src|poster|data-src)="\/(?!\/)/g, `$1="${basePath}/`);
const home = `
<section class="home-introduction" aria-labelledby="intro-heading">
 <h1 class="masthead" id="intro-heading"><strong>${e(site.headline[0])}</strong> <em>${e(site.headline[1])}</em></h1>
 <p class="cover-intro">${e(site.intro)}</p>
</section>
<section id="work" class="work" aria-labelledby="work-heading">
 <div class="section-heading work-rule"><h2 id="work-heading">Selected Work</h2></div>
 <article class="featured">
  ${featuredPreview}
  <h3 class="study-title">${projectTitle('/projects/kinetica/',featuredProject.name)}</h3>
  <div class="study-copy">
   <div><span class="status">${e(featuredProject.status)}</span>${projectDescription(featuredProject)}</div>${action('/projects/kinetica/','Explore case study','button')}
  </div>
 </article>
 ${upcomingProjects}
</section>
${homeNotes}
<section id="about" class="home-about">
 <h2>About</h2><p>${e(site.about)}</p>
</section>`;
const homeScripts = '<script type="module" src="/home-motion.mjs"></script>' +
 (featuredProject.preview?.video?'<script type="module" src="/home-preview.mjs"></script>':'');
writeFileSync(new URL('index.html',root),shell('Technical Art Portfolio',site.intro,home+homeScripts,'work','portfolio-home'));
const sections=[['overview','Overview'],['systems','Systems'],['comparisons','Comparisons'],['iterations','Iterations'],['scope','Sources']];
const study = `
<section class="case-hero" aria-labelledby="case-title">
  <div class="case-topline">${back('/#work','Selected Work')}<span class="status">${e(featuredProject.status)}</span></div>
  <div class="case-masthead"><h1 id="case-title">Kinetica</h1><p>${e(featuredProject.category)}</p></div>
  <div class="case-opening">
    <div class="case-brief"><p class="case-intro">${e(project.summary)}</p>
      <dl class="metadata">${project.meta.map(([label,value])=>`<div><dt>${e(label)}</dt><dd>${e(value)}</dd></div>`).join('')}</dl>
    </div>
    ${media('showcase')}
  </div>
</section>
<nav class="case-contents" aria-label="Case study sections">${sections.map(([id,label])=>a('#'+id,label)).join('')}</nav>
<div class="case-content">
  <section id="overview">
    <div class="overview-intro"><h2>From weapon motion<br><em>to material response.</em></h2>
      <p>The study follows one impact through detection, evaluation and presentation. Reusable weapon and material presets keep the calculations separate from the authored response.</p>
    </div>
    <ol class="pipeline">${['Weapon motion','Contact detection','Impact evaluation','Visual response'].map((stage,i)=>`<li><span aria-hidden="true">0${i+1}</span>${stage}</li>`).join('')}</ol>
  </section>
  <section id="systems">
    <h2>Technical <em>systems.</em></h2>
    <div class="system-highlights">${project.highlights.map(h=>`<article class="highlight"><span class="micro">${e(h.label)}</span><h3>${e(h.title)}</h3><p>${e(h.text)}</p><p class="secondary">${e(h.detail)}</p>${h.media?media(h.media,true):''}</article>`).join('')}</div>
  </section>
  <section id="comparisons">
    <h2>Comparing <em>responses.</em></h2>
    <div class="comparison-spread"><div class="comparison-text"><h3>Hammer <em>on three materials.</em></h3>
      <dl class="material-key">${project.materials.map(([name,result,detail])=>`<div><dt>${e(name)}</dt><dd><strong>${e(result)}</strong> ${e(detail)}</dd></div>`).join('')}</dl>
    </div>${media('materials')}</div>
    <div class="comparison-spread comparison-weapons"><div class="comparison-text"><h3>Three weapons <em>on Slime.</em></h3>
      <p>Spear, hammer and sword strike Slime with different motion and weapon settings. The localized response follows each recorded contact.</p>
    </div>${media('weapons')}</div>
  </section>
  <section id="iterations">
    <div class="chapter-columns"><h2>Iterations <em>&amp; evidence.</em></h2>
      <div>${project.iterations.map(([title,detail])=>`<article class="iteration"><h3>${e(title)}</h3><p>${e(detail)}</p></article>`).join('')}</div>
    </div>
    <details><summary>Runtime debugging <span class="disclosure-marker" aria-hidden="true"></span></summary>
      <p>The hammer strike on Slime registers a pressure of 8.08 and a solver deformation force of 6.46. The Debug Panel reads the same event as the VFX manager. ImpactReceiver scales the solver force by the material properties before passing it to the shader.</p>${media('debug',true)}
    </details>
    <details class="technical-evidence"><summary>Architecture and Shader Graph captures <span class="disclosure-marker" aria-hidden="true"></span></summary>
      ${media('architecture',true)}${media('shaderSpatial',true)}${media('shaderTemporal',true)}
    </details>
  </section>
  <section id="scope">
    <h2>Scope <em>&amp; sources.</em></h2>
    <div class="scope-grid"><div>
      <p>A single swept point represents the weapon’s contact region. The shader displaces rendered vertices while mesh topology and collision geometry stay fixed.</p>
      <p>Each renderer stores its most recent hit. Each impact spawns a separate material-specific particle effect.</p>
      <div class="source-links">${action(project.breakdown,'Download technical breakdown (PDF)','button')}${action(project.repository,'View source on GitHub')}</div>
    </div><div class="credits"><h3>Credits</h3>${project.credits.map(([use,asset,source])=>`<div><span class="micro">${e(use)}</span><p><strong>${e(asset)}</strong><br>${e(source)}</p></div>`).join('')}</div></div>
  </section>
</div>`;
mkdirSync(new URL('projects/kinetica/',root),{recursive:true});
writeFileSync(new URL('projects/kinetica/index.html',root),shell('Project Kinetica',project.summary,study+'<script type="module" src="/home-preview.mjs"></script><script type="module" src="/case-contents.mjs"></script>','work','kinetica-case'));
writeFileSync(new URL('404.html',root),shell('Page not found','Page not found',`<section class="home-hero"><span class="micro">404</span><h1>Page not found.</h1>${back('/','Portfolio')}</section>`));
mkdirSync(new URL('notes/',root),{recursive:true});
const monthName = new Intl.DateTimeFormat('en', {month:'long', year:'numeric', timeZone:'UTC'});
const archiveMonths = new Map();
for (const note of notes) {
 const month = note.date.slice(0,7);
 if (!archiveMonths.has(month)) archiveMonths.set(month,[]);
 archiveMonths.get(month).push(note);
}
const archive = Array.from(archiveMonths, ([month,items]) => `<section class="archive-month">
 <h2><time datetime="${month}">${monthName.format(new Date(items[0].date))}</time></h2>
 ${noteList(items,noteDate)}
</section>`).join('');
const notesIndex = `<section class="journal" aria-labelledby="journal-title">
 <div class="journal-opening">${back('/#notes','Portfolio')}
  <h1 id="journal-title">Development Notes</h1>
 </div>
 ${archive || '<p>No development notes published yet.</p>'}
</section>`;
writeFileSync(new URL('notes/index.html',root),shell('Development Notes','Development records for technical art and environment projects.',notesIndex,'notes','portfolio-journal'));

const articleSection = (block,index) => `<section>
${block.heading?`<h2 id="section-${index+1}">${e(block.heading)}</h2>`:''}
${block.paragraphs.map(p=>`<p>${e(p)}</p>`).join('')}
${block.media?.length?`<div class="note-section-media">${block.media.map(noteSectionMedia).join('')}</div>`:''}
${block.links?.length?`<div class="note-links">${block.links.map(link=>action(noteUrl(link.url),link.label,link.primary?'button':'text-link')).join('')}</div>`:''}
</section>`;
const adjacentNote = (note,direction) => note ? `<div class="neighbor neighbor-${direction}"><span>${direction === 'previous' ? 'Previous note' : 'Next note'} · ${noteDate(note)}</span>${action('/notes/'+note.slug+'/',note.title,'heading-link')}</div>` : '';
for (const [index,note] of notes.entries()) {
 const contents = note.body.flatMap((block,i)=>block.heading?[a('#section-'+(i+1),e(block.heading))]:[]);
 const body = `<article class="note-page">
  <div class="article-dateline">${back('/notes/','Development Notes')}${noteDate(note)}</div>
  <div class="note-heading"><h1>${e(note.title)}</h1><p class="note-summary">${e(note.summary)}</p></div>
${note.hero?noteImage(note.hero,true):''}
  <div class="article-reading">
${contents.length>1?`<aside><nav aria-label="Article contents"><span>Contents</span>${contents.join('')}</nav></aside>`:''}
   <div class="note-body">${note.body.map(articleSection).join('')}${note.media.map(image=>noteImage(image)).join('')}
${note.tags?.length?`<div class="tags" aria-label="Technical tags">${note.tags.map(tag=>`<span>${e(tag)}</span>`).join('')}</div>`:''}
   </div>
  </div>
  <nav id="article-navigation" class="article-navigation" aria-label="Development Notes navigation">
   <div class="neighbors">${adjacentNote(notes[index+1],'previous')}${adjacentNote(notes[index-1],'next')}</div>
  </nav>
 </article>`;
 mkdirSync(new URL('notes/'+note.slug+'/',root),{recursive:true});
 writeFileSync(new URL('notes/'+note.slug+'/index.html',root),shell(note.title,note.summary,body,'notes','portfolio-journal'));
}
console.log(`Rendered home, Kinetica, 404, notes index and ${notes.length} note pages.`);
