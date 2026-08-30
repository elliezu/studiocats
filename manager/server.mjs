import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { mkdir, readFile, readdir, rename, stat, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { dirname, extname, join, parse, relative, resolve } from 'node:path'
import { spawn } from 'node:child_process'

const managerRoot = dirname(fileURLToPath(import.meta.url))
const siteRoot = resolve(managerRoot, '..')
const contentFile = join(siteRoot, 'content', 'portfolio.json')
const appsFile = join(siteRoot, 'content', 'apps.json')
const journalFile = join(siteRoot, 'content', 'journal.json')
const siteFile = join(siteRoot, 'content', 'site.json')
const uploadRoot = join(siteRoot, 'uploads', 'portfolio')
const mediaRoots = { portfolio: uploadRoot, apps: join(siteRoot, 'uploads', 'apps'), journal: join(siteRoot, 'uploads', 'journal') }
const generator = join(managerRoot, 'scripts', 'generate-site.mjs')
const port = Number(process.env.MANAGER_API_PORT ?? 5174)
const allowedCategories = new Set(['Anime Style', 'Virtual Fashion', '3D Works'])
const allowedStatuses = new Set(['초안', '공개 준비', '공개됨'])
const allowedAppCategories = new Set(['Windows', 'Blender', 'Unity', 'ComfyUI', 'AI Tools'])
const allowedBlockTypes = new Set(['text', 'heading', 'image', 'youtube', 'link', 'code'])
const imageExtensions = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' }

function send(response, statusCode, body, headers = {}) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers })
  response.end(JSON.stringify(body))
}

async function readBody(request, maxBytes = 70 * 1024 * 1024) {
  const chunks = []
  let length = 0
  for await (const chunk of request) {
    length += chunk.length
    if (length > maxBytes) throw new Error('요청이 너무 큽니다. 한 번에 12MB 이하만 저장할 수 있어요.')
    chunks.push(chunk)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function cleanText(value, limit = 4000) {
  return typeof value === 'string' ? value.trim().slice(0, limit) : ''
}

function cleanSlug(value, fallback) {
  const slug = cleanText(value, 80).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')
  return slug || fallback
}

function normalizeProject(project, index) {
  const fallback = `project-${index + 1}`
  const gallery = Array.isArray(project.gallery) ? project.gallery
    .filter((image) => image && typeof image.src === 'string' && (image.src.startsWith('/uploads/portfolio/') || image.src.startsWith('/demo/')))
    .slice(0, 30)
    .map((image, imageIndex) => ({ id: cleanText(image.id, 120) || `${fallback}-image-${imageIndex + 1}`, src: image.src, name: cleanText(image.name, 180) || 'image' })) : []
  if (!gallery.length && project.status === '공개됨') throw new Error('공개하려면 이미지를 최소 한 장 넣어줘.')
  const coverId = gallery.some((image) => image.id === project.coverId) ? project.coverId : gallery[0].id
  const category = allowedCategories.has(project.category) ? project.category : 'Virtual Fashion'
  const status = allowedStatuses.has(project.status) ? project.status : '초안'
  return {
    id: cleanText(project.id, 120) || fallback,
    demo: Boolean(project.demo),
    title: cleanText(project.title, 120) || '제목 없음',
    slug: cleanSlug(project.slug, fallback),
    category,
    date: cleanText(project.date, 20),
    status,
    summary: cleanText(project.summary, 4000),
    tags: Array.isArray(project.tags) ? [...new Set(project.tags.map((tag) => cleanText(tag, 50)).filter(Boolean))].slice(0, 20) : [],
    boothUrl: cleanText(project.boothUrl, 500),
    youtubeUrl: cleanText(project.youtubeUrl, 500),
    gallery,
    coverId,
  }
}

async function readPortfolio() {
  try {
    const raw = JSON.parse(await readFile(contentFile, 'utf8'))
    return { version: 1, updatedAt: raw.updatedAt ?? null, projects: Array.isArray(raw.projects) ? raw.projects : [] }
  } catch (error) {
    if (error.code === 'ENOENT') return { version: 1, updatedAt: null, projects: [] }
    throw error
  }
}

async function writePortfolio(projects) {
  const normalized = projects.map(normalizeProject)
  const ids = new Set()
  const slugsByCategory = new Set()
  for (const project of normalized) {
    if (ids.has(project.id)) throw new Error('프로젝트 ID가 중복돼요.')
    const key = `${project.category}/${project.slug}`
    if (slugsByCategory.has(key)) throw new Error('같은 카테고리에 중복된 슬러그가 있어요.')
    ids.add(project.id)
    slugsByCategory.add(key)
  }
  await mkdir(dirname(contentFile), { recursive: true })
  const payload = JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), projects: normalized }, null, 2) + '\n'
  const temporary = `${contentFile}.tmp`
  await writeFile(temporary, payload, 'utf8')
  await rename(temporary, contentFile)
  return JSON.parse(payload)
}

async function readContent(file, collection) {
  try {
    const raw = JSON.parse(await readFile(file, 'utf8'))
    return { version: 1, updatedAt: raw.updatedAt ?? null, [collection]: Array.isArray(raw[collection]) ? raw[collection] : [] }
  } catch (error) {
    if (error.code === 'ENOENT') return { version: 1, updatedAt: null, [collection]: [] }
    throw error
  }
}

async function writeContent(file, collection, entries) {
  await mkdir(dirname(file), { recursive: true })
  const payload = JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), [collection]: entries }, null, 2) + '\n'
  const temporary = `${file}.tmp`
  await writeFile(temporary, payload, 'utf8')
  await rename(temporary, file)
  return JSON.parse(payload)
}

function normalizeApp(app, index) {
  const fallback = `app-${index + 1}`
  const status = allowedStatuses.has(app.status) ? app.status : '초안'
  const image = cleanText(app.image, 500)
  if (image && !image.startsWith('/uploads/')) throw new Error('앱 이미지는 홈페이지 uploads 폴더 안의 경로여야 해.')
  return {
    id: cleanText(app.id, 120) || fallback,
    title: cleanText(app.title, 120) || '이름 없는 앱',
    slug: cleanSlug(app.slug, fallback),
    category: allowedAppCategories.has(app.category) ? app.category : 'AI Tools',
    status,
    version: cleanText(app.version, 120),
    platform: cleanText(app.platform, 120),
    summary: cleanText(app.summary, 1200),
    details: cleanText(app.details, 240),
    distribution: cleanText(app.distribution, 80),
    license: cleanText(app.license, 120),
    price: cleanText(app.price, 80),
    externalUrl: cleanText(app.externalUrl, 500),
    buttonLabel: cleanText(app.buttonLabel, 60) || '열기',
    image,
    order: Number.isFinite(Number(app.order)) ? Number(app.order) : (index + 1) * 10,
  }
}

async function writeApps(apps) {
  const normalized = apps.map(normalizeApp)
  const ids = new Set(); const slugs = new Set()
  for (const app of normalized) {
    if (ids.has(app.id) || slugs.has(app.slug)) throw new Error('앱 ID 또는 슬러그가 중복돼.')
    ids.add(app.id); slugs.add(app.slug)
  }
  return writeContent(appsFile, 'apps', normalized)
}

function normalizePost(post, index) {
  const fallback = `post-${index + 1}`
  const status = allowedStatuses.has(post.status) ? post.status : '초안'
  const protectionMode = post.protection?.mode === 'password' ? 'password' : 'public'
  const requestedPassword = cleanText(post.protection?.password, 240)
  const savedPasswordHash = cleanText(post.protection?.passwordHash, 128)
  if (protectionMode === 'password' && !requestedPassword && !/^[a-f0-9]{64}$/i.test(savedPasswordHash)) {
    throw new Error('비밀번호 글은 비밀번호를 한 번 입력해줘.')
  }
  const blocks = Array.isArray(post.blocks) ? post.blocks.slice(0, 80).map((block) => ({
    id: cleanText(block.id, 120) || `block-${index + 1}`,
    type: allowedBlockTypes.has(block.type) ? block.type : 'text',
    value: cleanText(block.value, 8000),
    caption: cleanText(block.caption, 500),
  })).filter((block) => block.value) : []
  const hero = cleanText(post.hero, 500)
  if (hero && !hero.startsWith('/uploads/')) throw new Error('저널 이미지는 홈페이지 uploads 폴더 안의 경로여야 해.')
  return {
    id: cleanText(post.id, 120) || fallback,
    title: cleanText(post.title, 160) || '제목 없는 글',
    slug: cleanSlug(post.slug, fallback),
    status,
    date: cleanText(post.date, 20),
    summary: cleanText(post.summary, 800),
    tags: Array.isArray(post.tags) ? [...new Set(post.tags.map((tag) => cleanText(tag, 50)).filter(Boolean))].slice(0, 20) : [],
    hero,
    blocks,
    protection: protectionMode === 'password'
      ? { mode: 'password', passwordHash: requestedPassword ? createHash('sha256').update(requestedPassword).digest('hex') : savedPasswordHash.toLowerCase() }
      : { mode: 'public' },
  }
}

async function writeJournal(posts) {
  const normalized = posts.map(normalizePost)
  const ids = new Set(); const slugs = new Set()
  for (const post of normalized) {
    if (ids.has(post.id) || slugs.has(post.slug)) throw new Error('저널 글 ID 또는 슬러그가 중복돼.')
    ids.add(post.id); slugs.add(post.slug)
  }
  return writeContent(journalFile, 'posts', normalized)
}

function cleanList(values, limit = 20, itemLimit = 200) {
  return Array.isArray(values) ? values.map((value) => cleanText(value, itemLimit)).filter(Boolean).slice(0, limit) : []
}

function normalizeSite(site = {}) {
  const domain = cleanText(site.domain, 300).replace(/\/$/, '') || 'https://studiocats.kr'
  if (!/^https:\/\//.test(domain)) throw new Error('사이트 주소는 https://로 시작해야 해.')
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    domain,
    brand: cleanText(site.brand, 100) || 'StudioCats',
    email: cleanText(site.email, 200),
    aboutTitle: cleanText(site.aboutTitle, 500),
    aboutIntro: cleanText(site.aboutIntro, 3000),
    contactText: cleanText(site.contactText, 1500),
    skills: Array.isArray(site.skills) ? site.skills.slice(0, 8).map((group) => ({ title: cleanText(group.title, 80), items: cleanList(group.items, 20, 80) })).filter((group) => group.title) : [],
    career: cleanList(site.career, 30, 300),
    services: cleanList(site.services, 30, 300),
    links: Array.isArray(site.links) ? site.links.slice(0, 16).map((link) => ({ label: cleanText(link.label, 80), url: cleanText(link.url, 500) })).filter((link) => link.label && link.url) : [],
  }
}

async function readSite() {
  try { return JSON.parse(await readFile(siteFile, 'utf8')) } catch (error) { if (error.code === 'ENOENT') return normalizeSite(); throw error }
}

async function writeSite(site) {
  const normalized = normalizeSite(site)
  await mkdir(dirname(siteFile), { recursive: true })
  const payload = JSON.stringify(normalized, null, 2) + '\n'
  const temporary = `${siteFile}.tmp`
  await writeFile(temporary, payload, 'utf8')
  await rename(temporary, siteFile)
  return normalized
}

function runCommand(command, args) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, { cwd: siteRoot, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => { stdout += chunk })
    child.stderr.on('data', (chunk) => { stderr += chunk })
    child.on('error', rejectRun)
    child.on('close', (code) => resolveRun({ code, stdout, stderr }))
  })
}

async function runNode(script) {
  const result = await runCommand(process.execPath, [script])
  if (result.code !== 0) throw new Error(result.stderr || result.stdout || `생성기가 ${result.code} 코드로 종료됐어요.`)
  return result
}

async function runGit(args) {
  const result = await runCommand('git', args)
  if (result.code !== 0) throw new Error(result.stderr || result.stdout || `Git 명령이 ${result.code} 코드로 종료됐어요.`)
  return result
}

async function publishToGit(message) {
  await runNode(generator)
  const managedPaths = ['content/portfolio.json', 'content/apps.json', 'content/journal.json', 'content/site.json', 'content/.generated-portfolio.json', 'uploads/portfolio', 'uploads/apps', 'uploads/journal', 'animation-style', 'virtual-fashion', '3d-works', 'apps', 'ai-automation', 'about', 'sitemap.xml']
  const before = await runGit(['status', '--porcelain', '--', ...managedPaths])
  if (!before.stdout.trim()) {
    const branch = (await runGit(['branch', '--show-current'])).stdout.trim()
    return { committed: false, branch, message: '공개할 변경이 없어요.' }
  }
  await runGit(['add', '--', ...managedPaths])
  const staged = await runGit(['diff', '--cached', '--name-only', '--', ...managedPaths])
  if (!staged.stdout.trim()) return { committed: false, message: '관리 대상 파일에 커밋할 변경이 없어요.' }
  const commitMessage = cleanText(message, 160) || 'Publish StudioCats portfolio'
  await runGit(['commit', '-m', commitMessage, '--', ...managedPaths])
  const branch = (await runGit(['branch', '--show-current'])).stdout.trim()
  if (!branch) throw new Error('현재 Git 브랜치를 찾을 수 없어요.')
  await runGit(['push', 'origin', branch])
  return { committed: true, branch, files: staged.stdout.trim().split(/\r?\n/) }
}

function mediaType(pathname) {
  return ({ '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' })[extname(pathname).toLowerCase()] ?? 'application/octet-stream'
}

async function serveMedia(request, response, pathname) {
  const mediaRoot = join(siteRoot, 'uploads')
  const relativePath = decodeURIComponent(pathname.slice('/uploads/'.length))
  const target = resolve(mediaRoot, relativePath)
  const pathWithinUploads = relative(mediaRoot, target)
  if (!relativePath || pathWithinUploads.startsWith('..') || pathWithinUploads === '') return send(response, 403, { error: '허용되지 않은 경로예요.' })
  try {
    const file = await stat(target)
    if (!file.isFile()) return send(response, 404, { error: '이미지를 찾을 수 없어요.' })
    response.writeHead(200, { 'Content-Type': mediaType(target), 'Content-Length': file.size, 'Cache-Control': 'no-store' })
    createReadStream(target).pipe(response)
  } catch {
    send(response, 404, { error: '이미지를 찾을 수 없어요.' })
  }
}

async function importMedia(files, collection = 'portfolio') {
  if (!Array.isArray(files) || !files.length) throw new Error('가져올 이미지가 없어요.')
  if (files.length > 12) throw new Error('한 번에 최대 12장까지 추가할 수 있어요.')
  const mediaRoot = mediaRoots[collection]
  if (!mediaRoot) throw new Error('알 수 없는 이미지 보관함이야.')
  await mkdir(mediaRoot, { recursive: true })
  const imported = []
  for (const file of files) {
    const match = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(file.dataUrl ?? '')
    if (!match) throw new Error('PNG, JPG, WebP, GIF 이미지만 추가할 수 있어요.')
    const buffer = Buffer.from(match[2], 'base64')
    if (!buffer.length || buffer.length > 5 * 1024 * 1024) throw new Error('이미지 한 장은 5MB 이하로 넣어줘.')
    const base = cleanSlug(parse(cleanText(file.name, 180) || 'portfolio-image').name, 'portfolio-image').slice(0, 56)
    const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 10)
    const filename = `${base}-${hash}.${imageExtensions[match[1]]}`
    await writeFile(join(mediaRoot, filename), buffer, { flag: 'w' })
    imported.push({ id: `image-${hash}`, src: `/uploads/${collection}/${filename}`, name: filename })
  }
  return imported
}

async function listMedia(collection = 'portfolio') {
  const mediaRoot = mediaRoots[collection]
  if (!mediaRoot) throw new Error('알 수 없는 이미지 보관함이야.')
  try {
    const entries = await readdir(mediaRoot, { withFileTypes: true })
    return entries.filter((entry) => entry.isFile() && imageExtensions[mediaType(entry.name)]).map((entry) => ({ name: entry.name, src: `/uploads/${collection}/${entry.name}` })).toSorted((a, b) => a.name.localeCompare(b.name))
  } catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host ?? '127.0.0.1'}`)
  try {
    if (request.method === 'GET' && url.pathname === '/api/portfolio') return send(response, 200, await readPortfolio())
    if (request.method === 'PUT' && url.pathname === '/api/portfolio') {
      const body = await readBody(request)
      return send(response, 200, await writePortfolio(Array.isArray(body.projects) ? body.projects : []))
    }
    if (request.method === 'GET' && url.pathname === '/api/apps') return send(response, 200, await readContent(appsFile, 'apps'))
    if (request.method === 'PUT' && url.pathname === '/api/apps') {
      const body = await readBody(request)
      return send(response, 200, await writeApps(Array.isArray(body.apps) ? body.apps : []))
    }
    if (request.method === 'GET' && url.pathname === '/api/journal') return send(response, 200, await readContent(journalFile, 'posts'))
    if (request.method === 'PUT' && url.pathname === '/api/journal') {
      const body = await readBody(request)
      return send(response, 200, await writeJournal(Array.isArray(body.posts) ? body.posts : []))
    }
    if (request.method === 'GET' && url.pathname === '/api/site') return send(response, 200, await readSite())
    if (request.method === 'PUT' && url.pathname === '/api/site') {
      const body = await readBody(request)
      return send(response, 200, await writeSite(body))
    }
    if (request.method === 'POST' && url.pathname === '/api/media') {
      const body = await readBody(request)
      return send(response, 201, { images: await importMedia(body.files, cleanText(body.collection, 20) || 'portfolio') })
    }
    if (request.method === 'GET' && url.pathname === '/api/media') return send(response, 200, { images: await listMedia(cleanText(url.searchParams.get('collection'), 20) || 'portfolio') })
    if (request.method === 'POST' && url.pathname === '/api/generate') {
      const result = await runNode(generator)
      return send(response, 200, JSON.parse(result.stdout))
    }
    if (request.method === 'POST' && url.pathname === '/api/publish') {
      const body = await readBody(request, 256 * 1024)
      return send(response, 200, await publishToGit(body.message))
    }
    if (request.method === 'GET' && url.pathname.startsWith('/uploads/')) return serveMedia(request, response, url.pathname)
    return send(response, 404, { error: '알 수 없는 Manager API 요청이에요.' })
  } catch (error) {
    return send(response, 400, { error: error.message || '요청 처리 중 오류가 났어요.' })
  }
})

server.listen(port, '127.0.0.1', () => console.log(`StudioCats Manager API: http://127.0.0.1:${port}`))
