import { useEffect, useMemo, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'studiocats-manager.v1.projects'
const imagePool = ['/demo/portfolio-01.png', '/demo/portfolio-02.png', '/demo/portfolio-03.png', '/demo/portfolio-04.png', '/demo/portfolio-05.png']
const seedProjects = [
  { id: 'cloud-layer-dress', demo: true, title: 'Cloud Layer Dress', slug: 'cloud-layer-dress', category: 'Virtual Fashion', date: '2026.08.21', status: '초안', summary: 'CLO 3D에서 완성한 레이어드 드레스와 리깅 과정을 정리하는 가상 패션 프로젝트입니다.', tags: ['CLO 3D', 'Virtual Fashion', 'Render'], boothUrl: 'https://studiocats.booth.pm/', youtubeUrl: '', gallery: [{ id: 'cloud-cover', src: imagePool[0], name: 'cloud-layer-cover.png' }, { id: 'cloud-02', src: imagePool[1], name: 'cloud-layer-detail.png' }, { id: 'cloud-03', src: imagePool[2], name: 'cloud-layer-pattern.png' }, { id: 'cloud-04', src: imagePool[3], name: 'cloud-layer-render.png' }], coverId: 'cloud-cover' },
  { id: 'softform-collection', demo: true, title: 'Softform Collection', slug: 'softform-collection', category: 'Virtual Fashion', date: '2026.08.10', status: '초안', summary: '부드러운 구조감과 실루엣을 탐구한 버추얼 컬렉션입니다.', tags: ['CLO 3D', 'Unreal Engine'], boothUrl: '', youtubeUrl: '', gallery: [{ id: 'softform-cover', src: imagePool[1], name: 'softform-cover.png' }], coverId: 'softform-cover' },
  { id: 'signal-accessory-set', demo: true, title: 'Signal Accessory Set', slug: 'signal-accessory-set', category: 'Anime Style', date: '2026.07.28', status: '초안', summary: 'VRChat 아바타를 위한 액세서리 세트입니다.', tags: ['VRChat', 'Blender'], boothUrl: 'https://studiocats.booth.pm/', youtubeUrl: '', gallery: [{ id: 'signal-cover', src: imagePool[4], name: 'signal-cover.png' }], coverId: 'signal-cover' },
]

function Icon({ name, size = 18 }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    folder: <path d="M3 6.5h6l2 2h10v9.8A2.7 2.7 0 0 1 18.3 21H5.7A2.7 2.7 0 0 1 3 18.3z" />, cube: <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9zM4.3 7.7 12 12l7.7-4.3M12 12v9" />,
    book: <><path d="M3.5 5.5A2.5 2.5 0 0 1 6 3h5.5v16H6A2.5 2.5 0 0 0 3.5 21z" /><path d="M20.5 5.5A2.5 2.5 0 0 0 18 3h-5.5v16H18a2.5 2.5 0 0 1 2.5 2z" /></>, user: <><circle cx="12" cy="7.5" r="3.5" /><path d="M4.5 21c.8-4 3.2-6 7.5-6s6.7 2 7.5 6" /></>,
    image: <><rect x="3" y="4" width="18" height="16" rx="1.5" /><circle cx="8.5" cy="9" r="1.5" /><path d="m4 18 5.5-5 3.4 3.1 2.3-2.1L20 18" /></>, settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1-2.1 2.1-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.4v.2h-3v-.2a1.6 1.6 0 0 0-1-1.4 1.6 1.6 0 0 0-1.8.3l-.1.1-2.1-2.1.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.4-1H5.5v-3h.2a1.6 1.6 0 0 0 1.4-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1L8.8 6l.1.1a1.6 1.6 0 0 0 1.8.3 1.6 1.6 0 0 0 1-1.4v-.2h3V5a1.6 1.6 0 0 0 1 1.4 1.6 1.6 0 0 0 1.8-.3l.1-.1 2.1 2.1-.1.1a1.6 1.6 0 0 0-.3 1.8 1.6 1.6 0 0 0 1.4 1h.2v3h-.2a1.6 1.6 0 0 0-1.4 1Z" /></>,
    plus: <path d="M12 5v14M5 12h14" />, eye: <><path d="M2.5 12s3.3-5.5 9.5-5.5S21.5 12 21.5 12s-3.3 5.5-9.5 5.5S2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.5" /></>, upload: <><path d="M12 16V3M7 8l5-5 5 5" /><path d="M4 14v5h16v-5" /></>, more: <path d="M5 12h.01M12 12h.01M19 12h.01" strokeWidth="3" strokeLinecap="round" />, star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z" />, trash: <><path d="M4 7h16M9 7V4h6v3M6.5 7l.8 13h9.4l.8-13M10 11v5M14 11v5" /></>, grip: <path d="M8 6h.01M16 6h.01M8 12h.01M16 12h.01M8 18h.01M16 18h.01" strokeWidth="3" strokeLinecap="round" />, arrow: <path d="m8 5 7 7-7 7" />, close: <path d="m6 6 12 12M18 6 6 18" />,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function readStoredProjects() { try { const stored = window.localStorage.getItem(STORAGE_KEY); return stored ? JSON.parse(stored) : seedProjects } catch { return seedProjects } }
function makeProject() { const stamp = Date.now(); return { id: `project-${stamp}`, title: '새 프로젝트', slug: `new-project-${stamp}`, category: 'Virtual Fashion', date: new Date().toISOString().slice(0, 10).replaceAll('-', '.'), status: '초안', summary: '', tags: [], boothUrl: '', youtubeUrl: '', gallery: [], coverId: '' } }
function readFiles(files) { return Promise.all(files.map((file) => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve({ name: file.name, dataUrl: reader.result }); reader.onerror = reject; reader.readAsDataURL(file) }))) }

function App() {
  const [projects, setProjects] = useState(readStoredProjects)
  const [selectedId, setSelectedId] = useState(() => readStoredProjects()[0]?.id ?? '')
  const [activeNav, setActiveNav] = useState('Portfolio')
  const [tagDraft, setTagDraft] = useState('')
  const [toast, setToast] = useState('')
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isPublishOpen, setIsPublishOpen] = useState(false)
  const [draggedImageId, setDraggedImageId] = useState(null)
  const [repositoryState, setRepositoryState] = useState('저장소 연결 중')
  const [isHydrated, setIsHydrated] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishResult, setPublishResult] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/portfolio').then(async (response) => { if (!response.ok) throw new Error((await response.json()).error); return response.json() }).then((data) => {
      if (cancelled || !data.projects?.length) return
      setProjects(data.projects); setSelectedId((current) => data.projects.some((project) => project.id === current) ? current : data.projects[0].id); setRepositoryState('저장됨')
    }).catch(() => { if (!cancelled) { setRepositoryState('브라우저 임시 저장'); setToast('저장소 연결이 안 돼서 이 브라우저에만 임시 저장 중이야.') } }).finally(() => { if (!cancelled) setIsHydrated(true) })
    return () => { cancelled = true }
  }, [])
  useEffect(() => { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects)) }, [projects])
  useEffect(() => { if (!toast) return undefined; const timer = window.setTimeout(() => setToast(''), 3000); return () => window.clearTimeout(timer) }, [toast])
  useEffect(() => {
    if (!isHydrated) return undefined
    const timer = window.setTimeout(async () => {
      setRepositoryState('저장 중')
      try { const response = await fetch('/api/portfolio', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projects }) }); if (!response.ok) throw new Error((await response.json()).error); setRepositoryState('저장됨') } catch { setRepositoryState('브라우저 임시 저장') }
    }, 700)
    return () => window.clearTimeout(timer)
  }, [projects, isHydrated])

  const selected = useMemo(() => projects.find((project) => project.id === selectedId) ?? projects[0], [projects, selectedId])
  const cover = selected?.gallery?.find((image) => image.id === selected.coverId) ?? selected?.gallery?.[0]
  function updateProject(patch) { setProjects((current) => current.map((project) => (project.id === selected.id ? { ...project, ...patch } : project))) }
  function addProject() { const project = makeProject(); setProjects((current) => [project, ...current]); setSelectedId(project.id); setToast('새 프로젝트를 만들었어. 먼저 이미지를 넣어줘.') }
  function deleteProject() { if (projects.length === 1 || !window.confirm(`“${selected.title}” 프로젝트를 삭제할까?`)) return; const next = projects.filter((project) => project.id !== selected.id); setProjects(next); setSelectedId(next[0].id); setToast('프로젝트를 삭제했어.') }
  function addTag() { const tag = tagDraft.trim(); if (!tag || selected.tags.includes(tag)) return; updateProject({ tags: [...selected.tags, tag] }); setTagDraft('') }
  function removeTag(tag) { updateProject({ tags: selected.tags.filter((item) => item !== tag) }) }
  async function addImages(event) {
    const files = [...event.target.files]; event.target.value = ''
    if (!files.length) return
    if (files.some((file) => file.size > 5 * 1024 * 1024)) return setToast('이미지 한 장은 5MB 이하로 넣어줘.')
    try {
      setRepositoryState('이미지 복사 중')
      const response = await fetch('/api/media', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ files: await readFiles(files) }) })
      const body = await response.json(); if (!response.ok) throw new Error(body.error)
      const gallery = [...selected.gallery, ...body.images]; updateProject({ gallery, coverId: selected.coverId || body.images[0].id }); setRepositoryState('저장 대기'); setToast(`${body.images.length}장을 홈페이지 폴더에 복사했어.`)
    } catch (error) { setRepositoryState('저장 실패'); setToast(error.message || '이미지 추가에 실패했어.') }
  }
  function removeImage(imageId) { const gallery = selected.gallery.filter((image) => image.id !== imageId); updateProject({ gallery, coverId: selected.coverId === imageId ? (gallery[0]?.id ?? '') : selected.coverId }); setToast('이미지를 목록에서 뺐어. 업로드 파일은 안전하게 남겨뒀어.') }
  function reorderImages(overImageId) { if (!draggedImageId || draggedImageId === overImageId) return; const from = selected.gallery.findIndex((image) => image.id === draggedImageId); const to = selected.gallery.findIndex((image) => image.id === overImageId); const gallery = [...selected.gallery]; const [moved] = gallery.splice(from, 1); gallery.splice(to, 0, moved); updateProject({ gallery }); setDraggedImageId(null) }
  function preparePublish() { if (selected.demo) return setToast('샘플 항목은 공개하지 않아. 새 프로젝트로 실제 작업을 만들어줘.'); if (!selected.gallery.length) return setToast('공개하려면 이미지를 최소 한 장 넣어줘.'); setPublishResult(null); setIsPublishOpen(true) }
  async function publishProject() {
    const next = projects.map((project) => project.id === selected.id ? { ...project, status: '공개됨' } : project)
    setIsPublishing(true); setRepositoryState('공개 파일 생성 중')
    try {
      const saveResponse = await fetch('/api/portfolio', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projects: next }) }); const saveBody = await saveResponse.json(); if (!saveResponse.ok) throw new Error(saveBody.error)
      setProjects(saveBody.projects)
      const response = await fetch('/api/generate', { method: 'POST' }); const body = await response.json(); if (!response.ok) throw new Error(body.error)
      setRepositoryState('공개 파일 생성됨'); setPublishResult(body); setToast(`사이트 파일 ${body.generated.length}개를 만들었어. GitHub 반영은 한 번 더 확인하고 눌러줘.`)
    } catch (error) { setRepositoryState('저장 실패'); setToast(error.message || '공개 파일 생성에 실패했어.') } finally { setIsPublishing(false) }
  }
  async function publishToGitHub() {
    setIsPublishing(true); setRepositoryState('GitHub 반영 중')
    try {
      const response = await fetch('/api/publish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `Publish portfolio: ${selected.title}` }) })
      const body = await response.json(); if (!response.ok) throw new Error(body.error)
      setRepositoryState(body.committed ? `${body.branch}에 반영됨` : '반영할 변경 없음'); setIsPublishOpen(false); setToast(body.committed ? `${body.branch} 브랜치에 커밋하고 push했어.` : body.message)
    } catch (error) { setRepositoryState('GitHub 반영 실패'); setToast(error.message || 'GitHub 반영에 실패했어.') } finally { setIsPublishing(false) }
  }

  if (!selected) return <main className="manager-shell"><p className="toast">프로젝트를 불러오는 중이야.</p></main>
  const navItems = [['Dashboard', '대시보드', 'grid'], ['Portfolio', '포트폴리오', 'folder'], ['Apps', 'Apps', 'cube'], ['Journal', '저널', 'book'], ['About', '소개', 'user'], ['Media', '미디어', 'image'], ['Settings', '설정', 'settings']]
  return <main className="manager-shell">
    <aside className="sidebar"><div className="brand"><img className="brand-mark" src="/logo_img.png" alt="StudioCats" /><span>StudioCats<br /><strong>Manager</strong></span></div><nav aria-label="관리 메뉴">{navItems.map(([key, label, icon]) => <button className={`nav-item ${activeNav === key ? 'is-active' : ''}`} onClick={() => { setActiveNav(key); if (key !== 'Portfolio') setToast(`${label} 화면은 포트폴리오 흐름이 안정된 다음 연결할게.`) }} key={key}><Icon name={icon} /><span>{label}</span></button>)}</nav><div className="sidebar-bottom"><span className="sync-dot" />{repositoryState}</div></aside>
    <section className="project-list" aria-label="포트폴리오 목록"><header className="list-header"><div><h1>포트폴리오</h1><p>총 {projects.length}개 프로젝트</p></div><button className="outline-button" onClick={addProject}><Icon name="plus" />새 프로젝트</button></header><div className="project-rows">{projects.map((project) => { const projectCover = project.gallery.find((image) => image.id === project.coverId) ?? project.gallery[0]; return <button className={`project-row ${project.id === selected.id ? 'is-selected' : ''}`} key={project.id} onClick={() => setSelectedId(project.id)}>{projectCover ? <img src={projectCover.src} alt="" /> : <span className="project-empty">이미지 없음</span>}<span className="project-row-copy"><strong>{project.title}</strong><span>{project.category}</span><span>{project.date}</span></span><span className={`status ${project.status === '공개됨' ? 'is-public' : ''}`}>{project.status}</span></button> })}</div></section>
    <section className="editor" aria-label="프로젝트 편집"><header className="topbar"><div className="draft-state"><span className="sync-dot" />{selected.status} <span>{repositoryState}</span></div><div className="top-actions"><button className="preview-button" onClick={() => setIsPreviewOpen(true)} disabled={!cover}><Icon name="eye" />미리보기</button><button className="publish-button" onClick={preparePublish}>공개하기</button><button className="icon-button" aria-label="더 보기"><Icon name="more" /></button></div></header><div className="editor-scroll"><div className="editor-heading"><div><h2>프로젝트 편집</h2>{selected.demo && <p className="field-hint">지금 보이는 건 UI 예시야. 실제 공개는 새 프로젝트로 등록하면 돼.</p>}</div><button className="text-danger" onClick={deleteProject}>프로젝트 삭제</button></div><div className="field-grid"><label>제목<input value={selected.title} onChange={(event) => updateProject({ title: event.target.value })} /></label><label>슬러그<input value={selected.slug} onChange={(event) => updateProject({ slug: event.target.value })} /></label><label>카테고리<select value={selected.category} onChange={(event) => updateProject({ category: event.target.value })}><option>Virtual Fashion</option><option>Anime Style</option><option>3D Works</option></select></label><label>제작일<input value={selected.date} onChange={(event) => updateProject({ date: event.target.value })} /></label></div><label className="wide-field">설명<textarea value={selected.summary} onChange={(event) => updateProject({ summary: event.target.value })} placeholder="프로젝트를 소개하는 짧은 글을 써줘." rows="4" /></label><div className="wide-field"><span className="field-label">태그</span><div className="tag-box">{selected.tags.map((tag) => <button key={tag} className="tag" onClick={() => removeTag(tag)}>{tag}<Icon name="close" size={13} /></button>)}<input value={tagDraft} onChange={(event) => setTagDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addTag() } }} onBlur={addTag} placeholder="태그 입력 후 Enter" /></div></div><div className="field-grid links"><label>BOOTH / 외부 링크<input value={selected.boothUrl} onChange={(event) => updateProject({ boothUrl: event.target.value })} placeholder="https://" /></label><label>YouTube 링크<input value={selected.youtubeUrl} onChange={(event) => updateProject({ youtubeUrl: event.target.value })} placeholder="https://youtu.be/..." /></label></div><section className="gallery-section"><div className="section-title"><div><h3>이미지 갤러리</h3><p>이미지를 홈페이지 폴더에 복사해두고, 드래그로 순서를 바꿔. 별표가 대표 썸네일이야.</p></div><label className="add-image"><Icon name="upload" />이미지 추가<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple onChange={addImages} /></label></div>{selected.gallery.length ? <div className="gallery-grid">{selected.gallery.map((image, index) => <article className={`media-tile ${selected.coverId === image.id ? 'is-cover' : ''}`} draggable onDragStart={() => setDraggedImageId(image.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => reorderImages(image.id)} key={image.id}><div className="tile-actions"><span className="tile-order"><Icon name="grip" size={15} />{index + 1}</span><button aria-label="대표 썸네일로 지정" className={selected.coverId === image.id ? 'star is-active' : 'star'} onClick={() => { updateProject({ coverId: image.id }); setToast('대표 썸네일을 바꿨어.') }}><Icon name="star" size={17} /></button><button aria-label="이미지 삭제" className="tile-delete" onClick={() => removeImage(image.id)}><Icon name="trash" size={16} /></button></div><img src={image.src} alt={image.name} />{selected.coverId === image.id && <span className="cover-label">대표 썸네일</span>}</article>)}</div> : <p className="field-hint">아직 이미지가 없어. “이미지 추가”로 시작하면 돼.</p>}</section></div></section>
    <aside className="preview-rail"><div><span className="rail-title">미리보기</span><p>포트폴리오 카드 미리보기</p></div>{cover ? <article className="portfolio-preview"><img src={cover.src} alt="" /><div><h3>{selected.title || '제목 없음'}</h3><p>{selected.category}</p><span>자세히 보기 <Icon name="arrow" size={16} /></span></div></article> : <p className="field-hint">대표 이미지를 넣으면 여기서 카드가 보여.</p>}{selected.youtubeUrl && <a className="video-note" href={selected.youtubeUrl} target="_blank" rel="noreferrer">YouTube 영상 연결됨 <Icon name="arrow" size={15} /></a>}</aside>
    {toast && <div className="toast" role="status">{toast}</div>}
    {isPreviewOpen && cover && <div className="modal-backdrop" role="presentation" onMouseDown={() => setIsPreviewOpen(false)}><section className="modal preview-modal" role="dialog" aria-modal="true" aria-label="포트폴리오 미리보기" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setIsPreviewOpen(false)} aria-label="미리보기 닫기"><Icon name="close" /></button><span className="modal-title">사이트 카드 미리보기</span><article className="site-card"><img src={cover.src} alt="" /><div><span>{selected.category}</span><h2>{selected.title || '제목 없음'}</h2><p>{selected.summary || '프로젝트 설명이 여기에 표시돼.'}</p>{selected.youtubeUrl && <small>▶ YouTube 영상 포함</small>}</div></article></section></div>}
    {isPublishOpen && <div className="modal-backdrop" role="presentation" onMouseDown={() => !isPublishing && setIsPublishOpen(false)}><section className="modal publish-modal" role="dialog" aria-modal="true" aria-label="사이트 공개" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => !isPublishing && setIsPublishOpen(false)} aria-label="닫기"><Icon name="close" /></button>{publishResult ? <><span className="modal-title">파일 생성 완료</span><h2>{publishResult.generated.length}개 파일을 확인했어.</h2><p>아래 버튼은 포트폴리오 데이터·이미지·생성된 페이지 파일만 커밋하고 현재 브랜치에 push해. 다른 작업 파일은 건드리지 않아.</p><button className="publish-button" disabled={isPublishing} onClick={publishToGitHub}>{isPublishing ? 'GitHub 반영 중…' : 'GitHub에 커밋 및 push'}</button></> : <><span className="modal-title">공개할 준비 됐어?</span><h2>{selected.title}의 정적 사이트 파일을 만들게.</h2><p>먼저 프로젝트 HTML, 카테고리 목록, 사이트맵만 생성해서 변경점을 확인할 수 있어. GitHub push는 다음 확인 단계에서만 일어나.</p><button className="publish-button" disabled={isPublishing} onClick={publishProject}>{isPublishing ? '생성 중…' : '사이트 파일 생성'}</button></>}</section></div>}
  </main>
}

export default App
