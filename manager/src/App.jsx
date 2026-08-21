import { useEffect, useMemo, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'studiocats-manager.v1.projects'

const imagePool = [
  '/demo/portfolio-01.png',
  '/demo/portfolio-02.png',
  '/demo/portfolio-03.png',
  '/demo/portfolio-04.png',
  '/demo/portfolio-05.png',
]

const seedProjects = [
  {
    id: 'cloud-layer-dress',
    title: 'Cloud Layer Dress',
    slug: 'cloud-layer-dress',
    category: 'Virtual Fashion',
    date: '2026.08.21',
    status: '초안',
    summary: 'CLO 3D에서 완성한 레이어드 드레스와 리깅 과정을 정리하는 가상 패션 프로젝트입니다.',
    tags: ['CLO 3D', 'Virtual Fashion', 'Render'],
    boothUrl: 'https://studiocats.booth.pm/',
    youtubeUrl: '',
    gallery: [
      { id: 'cloud-cover', src: imagePool[0], name: 'cloud-layer-cover.png' },
      { id: 'cloud-02', src: imagePool[1], name: 'cloud-layer-detail.png' },
      { id: 'cloud-03', src: imagePool[2], name: 'cloud-layer-pattern.png' },
      { id: 'cloud-04', src: imagePool[3], name: 'cloud-layer-render.png' },
    ],
    coverId: 'cloud-cover',
  },
  {
    id: 'softform-collection',
    title: 'Softform Collection',
    slug: 'softform-collection',
    category: 'Virtual Fashion',
    date: '2026.08.10',
    status: '공개됨',
    summary: '부드러운 구조감과 실루엣을 탐구한 버추얼 컬렉션입니다.',
    tags: ['CLO 3D', 'Unreal Engine'],
    boothUrl: '',
    youtubeUrl: 'https://www.youtube.com/',
    gallery: [{ id: 'softform-cover', src: imagePool[1], name: 'softform-cover.png' }],
    coverId: 'softform-cover',
  },
  {
    id: 'signal-accessory-set',
    title: 'Signal Accessory Set',
    slug: 'signal-accessory-set',
    category: 'Anime Style',
    date: '2026.07.28',
    status: '공개됨',
    summary: 'VRChat 아바타를 위한 액세서리 세트입니다.',
    tags: ['VRChat', 'Blender'],
    boothUrl: 'https://studiocats.booth.pm/',
    youtubeUrl: '',
    gallery: [{ id: 'signal-cover', src: imagePool[4], name: 'signal-cover.png' }],
    coverId: 'signal-cover',
  },
]

function Icon({ name, size = 18 }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    folder: <path d="M3 6.5h6l2 2h10v9.8A2.7 2.7 0 0 1 18.3 21H5.7A2.7 2.7 0 0 1 3 18.3z" />,
    cube: <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9zM4.3 7.7 12 12l7.7-4.3M12 12v9" />,
    book: <><path d="M3.5 5.5A2.5 2.5 0 0 1 6 3h5.5v16H6A2.5 2.5 0 0 0 3.5 21z" /><path d="M20.5 5.5A2.5 2.5 0 0 0 18 3h-5.5v16H18a2.5 2.5 0 0 1 2.5 2z" /></>,
    user: <><circle cx="12" cy="7.5" r="3.5" /><path d="M4.5 21c.8-4 3.2-6 7.5-6s6.7 2 7.5 6" /></>,
    image: <><rect x="3" y="4" width="18" height="16" rx="1.5" /><circle cx="8.5" cy="9" r="1.5" /><path d="m4 18 5.5-5 3.4 3.1 2.3-2.1L20 18" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1-2.1 2.1-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.4v.2h-3v-.2a1.6 1.6 0 0 0-1-1.4 1.6 1.6 0 0 0-1.8.3l-.1.1-2.1-2.1.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.4-1H5.5v-3h.2a1.6 1.6 0 0 0 1.4-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1L8.8 6l.1.1a1.6 1.6 0 0 0 1.8.3 1.6 1.6 0 0 0 1-1.4v-.2h3V5a1.6 1.6 0 0 0 1 1.4 1.6 1.6 0 0 0 1.8-.3l.1-.1 2.1 2.1-.1.1a1.6 1.6 0 0 0-.3 1.8 1.6 1.6 0 0 0 1.4 1h.2v3h-.2a1.6 1.6 0 0 0-1.4 1Z" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    eye: <><path d="M2.5 12s3.3-5.5 9.5-5.5S21.5 12 21.5 12s-3.3 5.5-9.5 5.5S2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
    upload: <><path d="M12 16V3M7 8l5-5 5 5" /><path d="M4 14v5h16v-5" /></>,
    more: <path d="M5 12h.01M12 12h.01M19 12h.01" strokeWidth="3" strokeLinecap="round" />,
    star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z" />,
    trash: <><path d="M4 7h16M9 7V4h6v3M6.5 7l.8 13h9.4l.8-13M10 11v5M14 11v5" /></>,
    grip: <path d="M8 6h.01M16 6h.01M8 12h.01M16 12h.01M8 18h.01M16 18h.01" strokeWidth="3" strokeLinecap="round" />,
    arrow: <path d="m8 5 7 7-7 7" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
  }

  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function readStoredProjects() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : seedProjects
  } catch {
    return seedProjects
  }
}

function makeProject() {
  const stamp = Date.now()
  return {
    id: `project-${stamp}`, title: '새 프로젝트', slug: `new-project-${stamp}`, category: 'Virtual Fashion',
    date: new Date().toISOString().slice(0, 10).replaceAll('-', '.'), status: '초안', summary: '', tags: [], boothUrl: '', youtubeUrl: '',
    gallery: [{ id: `cover-${stamp}`, src: imagePool[0], name: '대표-이미지를-선택해줘.png' }], coverId: `cover-${stamp}`,
  }
}

function App() {
  const [projects, setProjects] = useState(readStoredProjects)
  const [selectedId, setSelectedId] = useState(() => readStoredProjects()[0].id)
  const [activeNav, setActiveNav] = useState('Portfolio')
  const [tagDraft, setTagDraft] = useState('')
  const [toast, setToast] = useState('')
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isPublishOpen, setIsPublishOpen] = useState(false)
  const [draggedImageId, setDraggedImageId] = useState(null)

  useEffect(() => { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects)) }, [projects])
  useEffect(() => { if (!toast) return undefined; const timer = window.setTimeout(() => setToast(''), 2600); return () => window.clearTimeout(timer) }, [toast])

  const selected = useMemo(() => projects.find((project) => project.id === selectedId) ?? projects[0], [projects, selectedId])
  const cover = selected.gallery.find((image) => image.id === selected.coverId) ?? selected.gallery[0]

  function updateProject(patch) { setProjects((current) => current.map((project) => (project.id === selected.id ? { ...project, ...patch } : project))) }
  function addProject() { const project = makeProject(); setProjects((current) => [project, ...current]); setSelectedId(project.id); setToast('새 프로젝트를 만들었어.') }
  function deleteProject() { if (projects.length === 1 || !window.confirm(`“${selected.title}” 프로젝트를 삭제할까?`)) return; const next = projects.filter((project) => project.id !== selected.id); setProjects(next); setSelectedId(next[0].id); setToast('프로젝트를 삭제했어.') }
  function addTag() { const tag = tagDraft.trim(); if (!tag || selected.tags.includes(tag)) return; updateProject({ tags: [...selected.tags, tag] }); setTagDraft('') }
  function removeTag(tag) { updateProject({ tags: selected.tags.filter((item) => item !== tag) }) }
  function addImages(event) {
    const files = [...event.target.files]
    if (!files.length) return
    if (files.find((file) => file.size > 2_500_000)) { setToast('MVP에서는 2.5MB 이하 이미지로 테스트해줘.'); event.target.value = ''; return }
    Promise.all(files.map((file) => new Promise((resolve) => { const reader = new FileReader(); reader.onload = () => resolve({ id: `image-${Date.now()}-${file.name}`, src: reader.result, name: file.name }); reader.readAsDataURL(file) }))).then((images) => { updateProject({ gallery: [...selected.gallery, ...images] }); setToast(`${images.length}장을 추가했어.`) })
    event.target.value = ''
  }
  function removeImage(imageId) { if (selected.gallery.length === 1) { setToast('이미지는 최소 한 장이 필요해.'); return }; const gallery = selected.gallery.filter((image) => image.id !== imageId); updateProject({ gallery, coverId: selected.coverId === imageId ? gallery[0].id : selected.coverId }); setToast('이미지를 제거했어.') }
  function reorderImages(overImageId) { if (!draggedImageId || draggedImageId === overImageId) return; const from = selected.gallery.findIndex((image) => image.id === draggedImageId); const to = selected.gallery.findIndex((image) => image.id === overImageId); const gallery = [...selected.gallery]; const [moved] = gallery.splice(from, 1); gallery.splice(to, 0, moved); updateProject({ gallery }); setDraggedImageId(null) }
  function preparePublish() { updateProject({ status: '공개 준비' }); setIsPublishOpen(true) }

  const navItems = [['Dashboard', '대시보드', 'grid'], ['Portfolio', '포트폴리오', 'folder'], ['Apps', 'Apps', 'cube'], ['Journal', '저널', 'book'], ['About', '소개', 'user'], ['Media', '미디어', 'image'], ['Settings', '설정', 'settings']]

  return <main className="manager-shell">
    <aside className="sidebar"><div className="brand"><img className="brand-mark" src="/logo_img.png" alt="StudioCats" /><span>StudioCats<br /><strong>Manager</strong></span></div><nav aria-label="관리 메뉴">{navItems.map(([key, label, icon]) => <button className={`nav-item ${activeNav === key ? 'is-active' : ''}`} onClick={() => { setActiveNav(key); if (key !== 'Portfolio') setToast(`${label} 화면은 다음 단계에서 연결할게.`) }} key={key}><Icon name={icon} /><span>{label}</span></button>)}</nav><div className="sidebar-bottom"><span className="sync-dot" />로컬 초안 저장 중</div></aside>
    <section className="project-list" aria-label="포트폴리오 목록"><header className="list-header"><div><h1>포트폴리오</h1><p>총 {projects.length}개 프로젝트</p></div><button className="outline-button" onClick={addProject}><Icon name="plus" />새 프로젝트</button></header><div className="project-rows">{projects.map((project) => { const projectCover = project.gallery.find((image) => image.id === project.coverId) ?? project.gallery[0]; return <button className={`project-row ${project.id === selected.id ? 'is-selected' : ''}`} key={project.id} onClick={() => setSelectedId(project.id)}><img src={projectCover.src} alt="" /><span className="project-row-copy"><strong>{project.title}</strong><span>{project.category}</span><span>{project.date}</span></span><span className={`status ${project.status === '공개됨' ? 'is-public' : ''}`}>{project.status}</span></button> })}</div></section>
    <section className="editor" aria-label="프로젝트 편집"><header className="topbar"><div className="draft-state"><span className="sync-dot" />{selected.status} <span>자동 저장됨</span></div><div className="top-actions"><button className="preview-button" onClick={() => setIsPreviewOpen(true)}><Icon name="eye" />미리보기</button><button className="publish-button" onClick={preparePublish}>공개하기</button><button className="icon-button" aria-label="더 보기"><Icon name="more" /></button></div></header><div className="editor-scroll"><div className="editor-heading"><h2>프로젝트 편집</h2><button className="text-danger" onClick={deleteProject}>프로젝트 삭제</button></div><div className="field-grid"><label>제목<input value={selected.title} onChange={(event) => updateProject({ title: event.target.value })} /></label><label>슬러그<input value={selected.slug} onChange={(event) => updateProject({ slug: event.target.value })} /></label><label>카테고리<select value={selected.category} onChange={(event) => updateProject({ category: event.target.value })}><option>Virtual Fashion</option><option>Anime Style</option><option>3D Works</option></select></label><label>제작일<input value={selected.date} onChange={(event) => updateProject({ date: event.target.value })} /></label></div><label className="wide-field">설명<textarea value={selected.summary} onChange={(event) => updateProject({ summary: event.target.value })} placeholder="프로젝트를 소개하는 짧은 글을 써줘." rows="4" /></label><div className="wide-field"><span className="field-label">태그</span><div className="tag-box">{selected.tags.map((tag) => <button key={tag} className="tag" onClick={() => removeTag(tag)}>{tag}<Icon name="close" size={13} /></button>)}<input value={tagDraft} onChange={(event) => setTagDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addTag() } }} onBlur={addTag} placeholder="태그 입력 후 Enter" /></div></div><div className="field-grid links"><label>BOOTH / 외부 링크<input value={selected.boothUrl} onChange={(event) => updateProject({ boothUrl: event.target.value })} placeholder="https://" /></label><label>YouTube 링크<input value={selected.youtubeUrl} onChange={(event) => updateProject({ youtubeUrl: event.target.value })} placeholder="https://youtu.be/..." /></label></div><section className="gallery-section"><div className="section-title"><div><h3>이미지 갤러리</h3><p>드래그로 순서를 바꾸고, 별표를 눌러 대표 썸네일을 지정해.</p></div><label className="add-image"><Icon name="upload" />이미지 추가<input type="file" accept="image/*" multiple onChange={addImages} /></label></div><div className="gallery-grid">{selected.gallery.map((image, index) => <article className={`media-tile ${selected.coverId === image.id ? 'is-cover' : ''}`} draggable onDragStart={() => setDraggedImageId(image.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => reorderImages(image.id)} key={image.id}><div className="tile-actions"><span className="tile-order"><Icon name="grip" size={15} />{index + 1}</span><button aria-label="대표 썸네일로 지정" className={selected.coverId === image.id ? 'star is-active' : 'star'} onClick={() => { updateProject({ coverId: image.id }); setToast('대표 썸네일을 바꿨어.') }}><Icon name="star" size={17} /></button><button aria-label="이미지 삭제" className="tile-delete" onClick={() => removeImage(image.id)}><Icon name="trash" size={16} /></button></div><img src={image.src} alt={image.name} />{selected.coverId === image.id && <span className="cover-label">대표 썸네일</span>}</article>)}</div></section></div></section>
    <aside className="preview-rail"><div><span className="rail-title">미리보기</span><p>포트폴리오 카드 미리보기</p></div><article className="portfolio-preview"><img src={cover.src} alt="" /><div><h3>{selected.title || '제목 없음'}</h3><p>{selected.category}</p><span>자세히 보기 <Icon name="arrow" size={16} /></span></div></article>{selected.youtubeUrl && <a className="video-note" href={selected.youtubeUrl} target="_blank" rel="noreferrer">YouTube 영상 연결됨 <Icon name="arrow" size={15} /></a>}</aside>
    {toast && <div className="toast" role="status">{toast}</div>}
    {isPreviewOpen && <div className="modal-backdrop" role="presentation" onMouseDown={() => setIsPreviewOpen(false)}><section className="modal preview-modal" role="dialog" aria-modal="true" aria-label="포트폴리오 미리보기" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setIsPreviewOpen(false)} aria-label="미리보기 닫기"><Icon name="close" /></button><span className="modal-title">사이트 카드 미리보기</span><article className="site-card"><img src={cover.src} alt="" /><div><span>{selected.category}</span><h2>{selected.title || '제목 없음'}</h2><p>{selected.summary || '프로젝트 설명이 여기에 표시돼.'}</p>{selected.youtubeUrl && <small>▶ YouTube 영상 포함</small>}</div></article></section></div>}
    {isPublishOpen && <div className="modal-backdrop" role="presentation" onMouseDown={() => setIsPublishOpen(false)}><section className="modal publish-modal" role="dialog" aria-modal="true" aria-label="공개 준비" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setIsPublishOpen(false)} aria-label="닫기"><Icon name="close" /></button><span className="modal-title">공개 준비 완료</span><h2>{selected.title}의 로컬 초안을 저장했어.</h2><p>다음 단계에서 이 데이터를 정적 HTML로 생성하고 GitHub Pages에 푸시하는 연결을 붙일게. 지금은 대표 썸네일·이미지 순서·YouTube 링크가 저장되는 UI MVP야.</p><button className="publish-button" onClick={() => { setIsPublishOpen(false); setToast('공개 준비 상태로 저장했어.') }}>확인</button></section></div>}
  </main>
}

export default App
