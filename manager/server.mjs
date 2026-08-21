import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { dirname, extname, join, parse, relative, resolve } from 'node:path'
import { spawn } from 'node:child_process'

const managerRoot = dirname(fileURLToPath(import.meta.url))
const siteRoot = resolve(managerRoot, '..')
const contentFile = join(siteRoot, 'content', 'portfolio.json')
const uploadRoot = join(siteRoot, 'uploads', 'portfolio')
const generator = join(managerRoot, 'scripts', 'generate-site.mjs')
const port = Number(process.env.MANAGER_API_PORT ?? 5174)
const allowedCategories = new Set(['Anime Style', 'Virtual Fashion', '3D Works'])
const allowedStatuses = new Set(['초안', '공개 준비', '공개됨'])
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
  const managedPaths = ['content/portfolio.json', 'content/.generated-portfolio.json', 'uploads/portfolio', 'animation-style', 'virtual-fashion', '3d-works', 'sitemap.xml']
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
  const relativePath = decodeURIComponent(pathname.slice('/uploads/portfolio/'.length))
  const target = resolve(uploadRoot, relativePath)
  const pathWithinUploads = relative(uploadRoot, target)
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

async function importMedia(files) {
  if (!Array.isArray(files) || !files.length) throw new Error('가져올 이미지가 없어요.')
  if (files.length > 12) throw new Error('한 번에 최대 12장까지 추가할 수 있어요.')
  await mkdir(uploadRoot, { recursive: true })
  const imported = []
  for (const file of files) {
    const match = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(file.dataUrl ?? '')
    if (!match) throw new Error('PNG, JPG, WebP, GIF 이미지만 추가할 수 있어요.')
    const buffer = Buffer.from(match[2], 'base64')
    if (!buffer.length || buffer.length > 5 * 1024 * 1024) throw new Error('이미지 한 장은 5MB 이하로 넣어줘.')
    const base = cleanSlug(parse(cleanText(file.name, 180) || 'portfolio-image').name, 'portfolio-image').slice(0, 56)
    const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 10)
    const filename = `${base}-${hash}.${imageExtensions[match[1]]}`
    await writeFile(join(uploadRoot, filename), buffer, { flag: 'w' })
    imported.push({ id: `image-${hash}`, src: `/uploads/portfolio/${filename}`, name: filename })
  }
  return imported
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host ?? '127.0.0.1'}`)
  try {
    if (request.method === 'GET' && url.pathname === '/api/portfolio') return send(response, 200, await readPortfolio())
    if (request.method === 'PUT' && url.pathname === '/api/portfolio') {
      const body = await readBody(request)
      return send(response, 200, await writePortfolio(Array.isArray(body.projects) ? body.projects : []))
    }
    if (request.method === 'POST' && url.pathname === '/api/media') {
      const body = await readBody(request)
      return send(response, 201, { images: await importMedia(body.files) })
    }
    if (request.method === 'POST' && url.pathname === '/api/generate') {
      const result = await runNode(generator)
      return send(response, 200, JSON.parse(result.stdout))
    }
    if (request.method === 'POST' && url.pathname === '/api/publish') {
      const body = await readBody(request, 256 * 1024)
      return send(response, 200, await publishToGit(body.message))
    }
    if (request.method === 'GET' && url.pathname.startsWith('/uploads/portfolio/')) return serveMedia(request, response, url.pathname)
    return send(response, 404, { error: '알 수 없는 Manager API 요청이에요.' })
  } catch (error) {
    return send(response, 400, { error: error.message || '요청 처리 중 오류가 났어요.' })
  }
})

server.listen(port, '127.0.0.1', () => console.log(`StudioCats Manager API: http://127.0.0.1:${port}`))
