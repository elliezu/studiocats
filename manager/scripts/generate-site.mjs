import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const managerRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const siteRoot = resolve(managerRoot, '..')
const contentRoot = join(siteRoot, 'content')
const portfolioPath = join(contentRoot, 'portfolio.json')
const appsPath = join(contentRoot, 'apps.json')
const journalPath = join(contentRoot, 'journal.json')
const manifestPath = join(contentRoot, '.generated-portfolio.json')
let domain = 'https://studiocats.kr'
const sections = [
  { name: 'Anime Style', slug: 'animation-style', number: '01', subtitle: 'VRChat' },
  { name: 'Virtual Fashion', slug: 'virtual-fashion', number: '02', subtitle: 'Film · Render · CLO 3D' },
  { name: '3D Works', slug: '3d-works', number: '03', subtitle: 'Monthly Archive' },
]

const css = `*{box-sizing:border-box}html,body{margin:0}body{background:#F8F8F6;color:#102848;font-family:Arial,'Pretendard',sans-serif;-webkit-font-smoothing:antialiased}a{color:inherit;text-decoration:none}a:hover{color:#D88830}img{display:block;max-width:100%}h1,h2,h3{margin:0;font-family:Arial,'Pretendard',sans-serif;letter-spacing:-.045em}.wrap{max-width:1400px;margin:0 auto;padding:0 36px}header{position:sticky;top:0;z-index:10;background:rgba(248,248,246,.96);border-bottom:1px solid #DCD9D1}.hd{min-height:82px;display:flex;align-items:center;justify-content:space-between;gap:26px}.mark img{width:40px;height:40px;object-fit:contain}.main,footer nav{display:flex;align-items:center;gap:18px;font-size:11px;letter-spacing:.08em;text-transform:uppercase}.main a[aria-current=page]{color:#D88830}.sub{font-size:11px;letter-spacing:.08em}.page{padding:48px 0 76px}.kicker{font-size:10px;letter-spacing:.2em;color:#8C8778;text-transform:uppercase}.heading{display:flex;justify-content:space-between;align-items:end;gap:24px;border-bottom:1px solid #102848;padding-bottom:22px}.heading h1{font-size:52px;line-height:1}.heading p{max-width:560px;margin:14px 0 0;color:#526078;font-size:14px;line-height:1.6}.count{font-size:11px;letter-spacing:.14em;color:#8C8778;text-transform:uppercase;white-space:nowrap}.project-list{border-top:1px solid #DCD9D1}.project{display:grid;grid-template-columns:minmax(230px,360px) minmax(260px,1fr) 150px;gap:28px;padding:25px 0;border-bottom:1px solid #DCD9D1;align-items:start}.project-cover{aspect-ratio:4/3;width:100%;object-fit:cover;background:#F1F0EB;border:1px solid #DCD9D1}.project h2{font-size:25px;line-height:1.1}.project .date{display:block;margin-top:9px;font-size:10px;letter-spacing:.16em;color:#8C8778}.project .summary{font-size:14px;line-height:1.65;color:#33465F;margin:12px 0 0;max-width:600px}.tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px}.tag{font-size:10px;letter-spacing:.08em;padding:5px 7px;background:#ECEAE5;color:#59667C}.open{border:1px solid #102848;display:flex;align-items:center;justify-content:space-between;padding:11px 13px;font-size:11px;letter-spacing:.12em;text-transform:uppercase}.open:hover{border-color:#D88830}.hero{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(300px,.8fr);gap:46px;align-items:start}.hero-cover{width:100%;aspect-ratio:4/3;object-fit:cover;background:#F1F0EB;border:1px solid #DCD9D1}.detail-copy h1{font-size:52px;line-height:1.02;margin-top:11px}.detail-copy .date{display:block;margin-top:15px;font-size:11px;letter-spacing:.15em;color:#8C8778}.detail-copy .summary{margin:28px 0 0;color:#33465F;font-size:15px;line-height:1.75;white-space:pre-wrap}.actions{display:grid;gap:10px;margin-top:28px}.youtube{margin-top:50px;border-top:1px solid #DCD9D1;padding-top:18px}.youtube h2,.gallery h2{font-size:19px}.video{margin-top:15px;aspect-ratio:16/9;width:100%;border:0;background:#111}.gallery{margin-top:50px;border-top:1px solid #DCD9D1;padding-top:18px}.gallery-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:15px}.gallery-grid img{width:100%;aspect-ratio:1/1;object-fit:cover;background:#F1F0EB;border:1px solid #DCD9D1}.empty{min-height:48vh;display:grid;align-content:center;gap:16px;border-bottom:1px solid #DCD9D1}.empty h1{font-size:50px}.empty p{color:#526078;font-size:14px;line-height:1.6}footer{border-top:1px solid #DCD9D1}.footer{display:flex;justify-content:space-between;align-items:center;gap:24px;padding:21px 0}.footer img{height:46px;width:auto}.footer small{font-size:10px;letter-spacing:.12em;color:#8C8778}@media(max-width:860px){.wrap{padding:0 20px}.hd{min-height:70px}.main{gap:11px;font-size:9px;overflow:auto}.sub{display:none}.page{padding:33px 0 55px}.heading{display:block}.heading h1,.detail-copy h1,.empty h1{font-size:38px}.count{display:block;margin-top:16px}.project{grid-template-columns:120px 1fr;gap:16px}.project .open{grid-column:2}.project-cover{min-height:90px}.project h2{font-size:19px}.project .summary{font-size:12px}.hero{grid-template-columns:1fr;gap:25px}.gallery-grid{grid-template-columns:repeat(2,1fr)}footer nav{display:none}.footer{align-items:flex-start;flex-direction:column}}`

const esc = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character])
const attr = (value = '') => esc(value).replace(/`/g, '&#96;')
const toPath = (source, depth) => source.startsWith('http') ? source : `${'../'.repeat(depth)}${source.replace(/^\//, '')}`
const coverOf = (project) => project.gallery.find((image) => image.id === project.coverId) ?? project.gallery[0]
const youtubeId = (url = '') => {
  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes('youtu.be')) return parsed.pathname.slice(1)
    if (parsed.hostname.includes('youtube.com')) return parsed.searchParams.get('v') || parsed.pathname.split('/').pop()
  } catch {}
  return ''
}

function navigation(prefix, active) {
  return `<header><div class="wrap hd"><a class="mark" href="${prefix}" aria-label="StudioCats home"><img src="${prefix}uploads/logo_img.png" alt="StudioCats"></a><div style="display:flex;align-items:center;gap:26px"><nav class="main" aria-label="Sections">${sections.map((section) => `<a href="${prefix}${section.slug}/"${active === section.slug ? ' aria-current="page"' : ''}>${section.number} ${section.name}</a>`).join('')}<a href="${prefix}apps/"${active === 'apps' ? ' aria-current="page"' : ''}>04 Apps</a><a href="${prefix}ai-automation/"${active === 'journal' ? ' aria-current="page"' : ''}>05 Journal</a></nav><div class="sub"><a href="${prefix}about/">About</a></div></div></div></header>`
}

function footer(prefix) {
  return `<footer><div class="wrap footer"><a href="${prefix}" aria-label="StudioCats home"><img src="${prefix}uploads/StudioCats_combined_logo_vertical_v2.png" alt="StudioCats"></a><nav aria-label="Footer">${sections.map((section) => `<a href="${prefix}${section.slug}/">${section.name}</a>`).join('')}<a href="${prefix}apps/">Apps</a><a href="${prefix}ai-automation/">Journal</a><a href="${prefix}about/">About</a></nav><small>© 2026 StudioCats · All rights reserved</small></div></footer>`
}

function document({ title, description, canonical, prefix, active, body }) {
  return `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} — StudioCats</title><meta name="description" content="${attr(description)}"><link rel="canonical" href="${canonical}"><meta property="og:type" content="website"><meta property="og:site_name" content="StudioCats"><meta property="og:title" content="${attr(title)}"><meta property="og:description" content="${attr(description)}"><meta property="og:url" content="${canonical}"><link rel="icon" href="${prefix}uploads/logo_img.png"><style>${css}</style></head><body>${navigation(prefix, active)}<main>${body}</main>${footer(prefix)}</body></html>`
}

function renderSection(section, projects) {
  const prefix = '../'
  const list = projects.length ? projects.map((project) => {
    const cover = coverOf(project)
    return `<article class="project"><img class="project-cover" src="${toPath(cover.src, 1)}" alt="${attr(project.title)}"><div><div class="kicker">${section.number} / ${esc(project.category)}</div><h2><a href="./${attr(project.slug)}/">${esc(project.title)}</a></h2><span class="date">${esc(project.date)}</span><p class="summary">${esc(project.summary)}</p><div class="tags">${project.tags.map((tag) => `<span class="tag">${esc(tag)}</span>`).join('')}</div></div><a class="open" href="./${attr(project.slug)}/"><span>자세히 보기</span><span>→</span></a></article>`
  }).join('') : `<section class="empty"><div class="kicker">${section.number} / 준비 중</div><h1>${esc(section.name)}</h1><p>작업을 선별하고 설명을 붙이는 대로 이곳에 열립니다.</p></section>`
  const body = `<div class="wrap page"><section class="heading"><div><div class="kicker">${section.number} / SECTION</div><h1>${esc(section.name)}</h1><p>${projects.length ? '선별한 프로젝트와 제작 기록을 정리합니다.' : section.subtitle}</p></div><span class="count">${projects.length} PROJECT${projects.length === 1 ? '' : 'S'}</span></section><div class="project-list">${list}</div></div>`
  return document({ title: section.name, description: `${section.name} — StudioCats 포트폴리오`, canonical: `${domain}/${section.slug}/`, prefix, active: section.slug, body })
}

function renderDetail(section, project) {
  const prefix = '../../'
  const cover = coverOf(project)
  const videoId = youtubeId(project.youtubeUrl)
  const actions = [project.boothUrl && `<a class="open" href="${attr(project.boothUrl)}" target="_blank" rel="noopener"><span>BOOTH에서 보기</span><span>↗</span></a>`, project.youtubeUrl && `<a class="open" href="${attr(project.youtubeUrl)}" target="_blank" rel="noopener"><span>YouTube에서 보기</span><span>↗</span></a>`].filter(Boolean).join('')
  const gallery = project.gallery.length > 1 ? `<section class="gallery"><h2>Gallery</h2><div class="gallery-grid">${project.gallery.map((image) => `<img src="${toPath(image.src, 2)}" alt="${attr(project.title)}">`).join('')}</div></section>` : ''
  const video = videoId ? `<section class="youtube"><h2>Video</h2><iframe class="video" title="${attr(project.title)} YouTube video" src="https://www.youtube-nocookie.com/embed/${attr(videoId)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></section>` : ''
  const body = `<div class="wrap page"><article class="hero"><img class="hero-cover" src="${toPath(cover.src, 2)}" alt="${attr(project.title)}"><div class="detail-copy"><div class="kicker">${section.number} / ${esc(project.category)}</div><h1>${esc(project.title)}</h1><span class="date">${esc(project.date)}</span><div class="tags">${project.tags.map((tag) => `<span class="tag">${esc(tag)}</span>`).join('')}</div><p class="summary">${esc(project.summary)}</p><div class="actions">${actions}</div></div></article>${video}${gallery}</div>`
  return document({ title: project.title, description: project.summary || `${project.title} — StudioCats`, canonical: `${domain}/${section.slug}/${project.slug}/`, prefix, active: section.slug, body })
}

function renderApps(apps) {
  const prefix = '../'
  const list = apps.length ? apps.map((app) => {
    const visual = app.image ? `<img class="project-cover" src="${toPath(app.image, 1)}" alt="${attr(app.title)}">` : `<div class="project-cover" style="display:grid;place-items:center;background:#102848;color:#F8F8F6;font-size:12px;letter-spacing:.12em">${esc(app.distribution || 'APP')}</div>`
    const meta = [app.version, app.platform].filter(Boolean).join(' · ')
    const price = [app.price, app.license].filter(Boolean).join(' · ')
    return `<article class="project">${visual}<div><div class="kicker">${esc(app.category)}</div><h2>${esc(app.title)}</h2><span class="date">${esc(meta)}</span><p class="summary">${esc(app.summary)}</p><div class="tags">${[app.distribution, app.details].filter(Boolean).map((tag) => `<span class="tag">${esc(tag)}</span>`).join('')}</div></div><div><span class="date">${esc(price)}</span>${app.externalUrl ? `<a class="open" href="${attr(app.externalUrl)}" target="_blank" rel="noopener" style="margin-top:14px"><span>${esc(app.buttonLabel)}</span><span>↗</span></a>` : ''}</div></article>`
  }).join('') : `<section class="empty"><div class="kicker">04 / 준비 중</div><h1>Apps</h1><p>도구를 정리하는 대로 이곳에 열립니다.</p></section>`
  const body = `<div class="wrap page"><section class="heading"><div><div class="kicker">04 / SECTION</div><h1>Apps</h1><p>3D 에셋을 만들며 필요해서 함께 만든 애드온과 데스크톱 도구입니다.</p></div><span class="count">${apps.length} TOOL${apps.length === 1 ? '' : 'S'}</span></section><div class="project-list">${list}</div></div>`
  return document({ title: 'Apps', description: 'StudioCats 도구와 애드온', canonical: `${domain}/apps/`, prefix, active: 'apps', body })
}

function renderJournalList(posts) {
  const prefix = '../'
  const list = posts.length ? posts.map((post) => { const protectedPost = post.protection?.mode === 'password' && /^[a-f0-9]{64}$/i.test(post.protection?.passwordHash || ''); return `<article class="project">${post.hero ? `<img class="project-cover" src="${toPath(post.hero, 1)}" alt="${attr(post.title)}">` : `<div class="project-cover" style="background:#ECEAE5"></div>`}<div><div class="kicker">05 / JOURNAL</div><h2><a href="./${attr(post.slug)}/">${esc(post.title)}</a></h2><span class="date">${esc(post.date)}</span><p class="summary">${esc(post.summary)}</p><div class="tags">${post.tags.map((tag) => `<span class="tag">${esc(tag)}</span>`).join('')}${protectedPost ? `<span class="tag">🔒 인증 필요</span>` : ''}</div></div><a class="open" href="./${attr(post.slug)}/"><span>${protectedPost ? '비밀번호 인증' : '읽기'}</span><span>→</span></a></article>` }).join('') : `<section class="empty"><div class="kicker">05 / 준비 중</div><h1>Journal</h1><p>작업을 선별하고 설명을 붙이는 대로 이곳에 열립니다.</p></section>`
  const body = `<div class="wrap page"><section class="heading"><div><div class="kicker">05 / JOURNAL</div><h1>Journal</h1><p>작업 과정과 도구, 생각을 기록합니다.</p></div><span class="count">${posts.length} POST${posts.length === 1 ? '' : 'S'}</span></section><div class="project-list">${list}</div></div>`
  return document({ title: 'Journal', description: 'StudioCats 작업 기록', canonical: `${domain}/ai-automation/`, prefix, active: 'journal', body })
}

function renderJournalDetail(post) {
  const prefix = '../../'
  const block = (item) => {
    if (item.type === 'heading') return `<h2 style="font-size:25px;margin-top:42px">${esc(item.value)}</h2>`
    if (item.type === 'image') return `<figure style="margin:34px 0"><img class="hero-cover" src="${toPath(item.value, 2)}" alt="${attr(item.caption || post.title)}"><figcaption class="date" style="margin-top:10px">${esc(item.caption)}</figcaption></figure>`
    if (item.type === 'youtube') { const id = youtubeId(item.value); return id ? `<section class="youtube"><iframe class="video" title="${attr(post.title)} video" src="https://www.youtube-nocookie.com/embed/${attr(id)}" loading="lazy" allowfullscreen></iframe></section>` : '' }
    if (item.type === 'link') return `<a class="open" href="${attr(item.value)}" target="_blank" rel="noopener" style="margin-top:22px"><span>${esc(item.caption || item.value)}</span><span>↗</span></a>`
    if (item.type === 'code') return `<pre style="overflow:auto;background:#102848;color:#F8F8F6;padding:20px;font-size:12px;line-height:1.6;margin-top:26px"><code>${esc(item.value)}</code></pre>`
    return `<p class="summary" style="white-space:pre-wrap;max-width:760px;margin-top:24px">${esc(item.value)}</p>`
  }
  const article = `<article id="journal-content" style="max-width:820px"><div class="kicker">05 / JOURNAL</div><h1 style="font-size:52px;line-height:1.05;margin-top:14px">${esc(post.title)}</h1><span class="date" style="display:block;margin-top:17px">${esc(post.date)}</span><div class="tags">${post.tags.map((tag) => `<span class="tag">${esc(tag)}</span>`).join('')}</div>${post.hero ? `<img class="hero-cover" src="${toPath(post.hero, 2)}" alt="${attr(post.title)}" style="margin-top:30px">` : ''}<p class="summary" style="font-size:17px;white-space:pre-wrap;margin-top:28px">${esc(post.summary)}</p>${post.blocks.map(block).join('')}</article>`
  const passwordHash = post.protection?.mode === 'password' && /^[a-f0-9]{64}$/i.test(post.protection?.passwordHash || '') ? post.protection.passwordHash.toLowerCase() : ''
  const gate = passwordHash ? `<section id="journal-password-gate" style="max-width:520px;border:1px solid #DCD9D1;padding:32px;margin-top:18px"><div class="kicker">STUDENT MATERIAL</div><h2 style="font-size:28px;margin-top:12px">비밀번호 인증이 필요한 콘텐츠입니다.</h2><p class="summary" style="margin-top:14px">안내받은 비밀번호를 입력하면 콘텐츠를 열람할 수 있습니다.</p><form id="journal-password-form" style="display:flex;gap:8px;margin-top:24px"><label style="flex:1"><span style="position:absolute;width:1px;height:1px;overflow:hidden">글 비밀번호</span><input id="journal-password-input" type="password" autocomplete="current-password" required style="box-sizing:border-box;width:100%;padding:12px;border:1px solid #102848;background:#fff;font:inherit" placeholder="비밀번호 입력"></label><button class="open" type="submit" style="background:#102848;color:#F8F8F6;white-space:nowrap">콘텐츠 열람 →</button></form><p id="journal-password-error" class="date" role="alert" style="display:none;color:#B44734;margin-top:12px">비밀번호가 일치하지 않습니다. 다시 확인해 주세요.</p></section><script>document.addEventListener('DOMContentLoaded',()=>{const hash=${JSON.stringify(passwordHash)};const key=${JSON.stringify(`studiocats-journal:${post.slug}:${passwordHash}`)};const article=document.getElementById('journal-content');const gate=document.getElementById('journal-password-gate');const form=document.getElementById('journal-password-form');const input=document.getElementById('journal-password-input');const error=document.getElementById('journal-password-error');const open=()=>{article.hidden=false;gate.hidden=true};if(sessionStorage.getItem(key)==='open'){open();return}article.hidden=true;form.addEventListener('submit',async(event)=>{event.preventDefault();const bytes=new TextEncoder().encode(input.value);const digest=await crypto.subtle.digest('SHA-256',bytes);const actual=Array.from(new Uint8Array(digest)).map((byte)=>byte.toString(16).padStart(2,'0')).join('');if(actual===hash){sessionStorage.setItem(key,'open');open()}else{error.style.display='block';input.select()}})});</script>` : ''
  const body = `<div class="wrap page">${gate}${article}</div>`
  return document({ title: post.title, description: post.summary || post.title, canonical: `${domain}/ai-automation/${post.slug}/`, prefix, active: 'journal', body })
}

function renderAbout(site) {
  const prefix = '../'
  const skills = site.skills.map((group) => `<div><div class="kicker">${esc(group.title)}</div><div class="tags">${group.items.map((item) => `<span class="tag">${esc(item)}</span>`).join('')}</div></div>`).join('')
  const list = (title, items) => items.length ? `<section class="gallery"><h2>${esc(title)}</h2><div class="tags" style="display:grid;gap:8px">${items.map((item) => `<span class="tag" style="font-size:13px;padding:10px">${esc(item)}</span>`).join('')}</div></section>` : ''
  const links = site.links.map((link) => `<a class="open" href="${attr(link.url)}" target="_blank" rel="noopener"><span>${esc(link.label)}</span><span>↗</span></a>`).join('')
  const body = `<div class="wrap page"><article class="hero"><div><div class="kicker">ABOUT</div><h1 style="font-size:52px;line-height:1.08;margin-top:14px;white-space:pre-wrap">${esc(site.aboutTitle)}</h1><p class="summary" style="font-size:16px;white-space:pre-wrap;margin-top:26px">${esc(site.aboutIntro)}</p><section class="gallery"><h2>Tools & Skills</h2><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px;margin-top:18px">${skills}</div></section>${list('경력', site.career)}${list('작업 분야', site.services)}</div><aside class="detail-copy"><div class="kicker">CONTACT</div><h2 style="font-size:34px;margin-top:12px">문의</h2><p class="summary">${esc(site.contactText)}</p><div class="actions"><a class="open" href="mailto:${attr(site.email)}"><span>${esc(site.email || 'Email')}</span><span>↗</span></a>${links}</div></aside></article></div>`
  return document({ title: `About ${site.brand}`, description: site.aboutIntro || `${site.brand} 소개`, canonical: `${domain}/about/`, prefix, active: 'about', body })
}

async function write(relativePath, contents) {
  const destination = join(siteRoot, relativePath)
  await mkdir(dirname(destination), { recursive: true })
  await writeFile(destination, contents, 'utf8')
}

async function previousManifest() {
  try { return JSON.parse(await readFile(manifestPath, 'utf8')) } catch { return { files: [] } }
}

const source = JSON.parse(await readFile(portfolioPath, 'utf8'))
const appsSource = JSON.parse(await readFile(appsPath, 'utf8'))
const journalSource = JSON.parse(await readFile(journalPath, 'utf8'))
const siteSource = JSON.parse(await readFile(join(contentRoot, 'site.json'), 'utf8'))
domain = String(siteSource.domain || domain).replace(/\/$/, '')
const publicProjects = (source.projects ?? []).filter((project) => project.status === '공개됨' && !project.demo)
const publicApps = (appsSource.apps ?? []).filter((app) => app.status === '공개됨').toSorted((a, b) => a.order - b.order)
const publicPosts = (journalSource.posts ?? []).filter((post) => post.status === '공개됨').toSorted((a, b) => String(b.date).localeCompare(String(a.date)))
const previous = await previousManifest()
const files = new Set()
for (const section of sections) {
  const projects = publicProjects.filter((project) => project.category === section.name)
  const listPath = `${section.slug}/index.html`
  const wasGenerated = (previous.files ?? []).includes(listPath)
  if (!projects.length && !wasGenerated) continue
  await write(listPath, renderSection(section, projects))
  files.add(listPath)
  for (const project of projects) {
    const detailPath = `${section.slug}/${project.slug}/index.html`
    await write(detailPath, renderDetail(section, project))
    files.add(detailPath)
  }
}

await write('apps/index.html', renderApps(publicApps))
files.add('apps/index.html')
await write('about/index.html', renderAbout(siteSource))
files.add('about/index.html')
const journalIndex = 'ai-automation/index.html'
const hadJournal = (previous.files ?? []).includes(journalIndex)
if (publicPosts.length || hadJournal) {
  await write(journalIndex, renderJournalList(publicPosts))
  files.add(journalIndex)
  for (const post of publicPosts) {
    const detailPath = `ai-automation/${post.slug}/index.html`
    await write(detailPath, renderJournalDetail(post))
    files.add(detailPath)
  }
}

const today = new Date().toISOString().slice(0, 10)
const basePages = ['', 'apps/', 'ai-automation/', 'about/', ...sections.map((section) => `${section.slug}/`)]
const detailPages = publicProjects.map((project) => {
  const section = sections.find((item) => item.name === project.category)
  return `${section.slug}/${project.slug}/`
})
const sitemapPages = [...basePages, ...detailPages]
const journalPages = publicPosts.map((post) => `ai-automation/${post.slug}/`)
const allSitemapPages = [...sitemapPages, ...journalPages]
if (publicProjects.length || publicApps.length || publicPosts.length || (previous.files ?? []).includes('sitemap.xml')) {
  await write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${allSitemapPages.map((page) => `  <url><loc>${domain}/${page}</loc><lastmod>${today}</lastmod><priority>${page === '' ? '1.0' : page.includes('/') && page.split('/').length > 2 ? '0.7' : '0.8'}</priority></url>`).join('\n')}\n</urlset>\n`)
  files.add('sitemap.xml')
}

for (const stale of previous.files ?? []) {
  if (!files.has(stale) && stale.includes('/')) {
    const destination = resolve(siteRoot, stale)
    if (destination.startsWith(siteRoot)) await rm(destination, { force: true })
  }
}
if (files.size || (previous.files ?? []).length) await writeFile(manifestPath, JSON.stringify({ files: [...files].sort(), generatedAt: new Date().toISOString() }, null, 2) + '\n', 'utf8')
console.log(JSON.stringify({ generated: [...files].sort(), publishedProjects: publicProjects.length, publishedApps: publicApps.length, publishedPosts: publicPosts.length }))
