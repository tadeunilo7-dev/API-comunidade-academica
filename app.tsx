import React from 'react';
import './app.css';
import { MeetingDialog, ParticipantManager, PublicationDialog, type PostRecord, type PostKind } from './features';

type IconName = 'home' | 'project' | 'calendar' | 'group' | 'people' | 'search' | 'arrow' | 'plus' | 'spark' | 'pin' | 'clock' | 'chat' | 'bell';

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-7h6v7"/></>,
    project: <><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M8 9h8M8 13h5"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01"/></>,
    group: <><circle cx="9" cy="8" r="3"/><path d="M3 20v-1a6 6 0 0 1 12 0v1M16 5.2a3 3 0 0 1 0 5.6M18 14a5 5 0 0 1 3 5v1"/></>,
    people: <><circle cx="9" cy="8" r="3"/><path d="M3 20v-1a6 6 0 0 1 12 0v1M16 5a3 3 0 0 1 0 6"/></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z"/></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    chat: <><path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20l1.1-4.3A8.5 8.5 0 1 1 21 11.5Z"/><path d="M8 11h.01M12 11h.01M16 11h.01"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function UserAvatar({ name, src, className }: { name: string; src?: string; className: string }) {
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  return <span className={className}>{src ? <img src={src} alt=""/> : initials}</span>;
}

const navigation: { label: string; icon: IconName }[] = [
  { label: 'Início', icon: 'home' },
  { label: 'Projetos', icon: 'project' },
  { label: 'Eventos', icon: 'calendar' },
  { label: 'Grupos de estudo', icon: 'group' },
  { label: 'Pessoas', icon: 'people' },
  { label: 'Seguindo', icon: 'people' },
  { label: 'Favoritos', icon: 'spark' },
  { label: 'Bate-papo', icon: 'chat' },
  { label: 'Notificações', icon: 'bell' },
  { label: 'Encontros', icon: 'calendar' },
  { label: 'Minhas participações', icon: 'group' },
  { label: 'Minhas publicações', icon: 'project' },
];

const suggestions = [
  { type: 'Projeto', title: 'Aplicativo de apoio aos estudos', description: 'Uma equipe para criar ferramentas que deixem a rotina acadêmica mais leve.', tags: ['Desenvolvimento', 'Design'], people: '2/5 vagas ocupadas', tone: 'petroleum', initials: 'AS' },
  { type: 'Grupo de estudo', title: 'Introdução à inteligência artificial', description: 'Encontros semanais para estudar conceitos e explorar aplicações práticas.', tags: ['Inteligência artificial', 'Iniciante'], people: '6/12 vagas ocupadas', tone: 'lavender', initials: 'IA' },
  { type: 'Evento', title: 'Encontro de tecnologia e criatividade', description: 'Uma conversa aberta sobre ideias, projetos e caminhos para colaborar.', tags: ['Tecnologia', 'Conversa'], people: '12/30 vagas ocupadas', tone: 'yellow', initials: 'TC' },
];

type CommunityItem = (typeof suggestions)[number] & { id?: string; authorId?: string; details?: string; relevance?: number; raw?: Record<string, unknown>; startAt?: string };
type StudentProfile = { id: string; nome: string; email: string; matricula?: string; instituicao?: string; curso?: string | null; interesses: string[]; habilidades: string[]; areas_interesse: string[]; descricao?: string; avatar_url?: string };
type ParticipationRecord = { id: string; aluno_id: string; publicacao_id: string; status: string; titulo: string; tipo: string; detalhes: Record<string, unknown> };
type MeetingRecord = { id: string; titulo: string; descricao: string; inicio: string; local?: string | null; modalidade: string; organizador_id: string; organizador_nome: string; publicacao_id?: string | null; limite_participantes?: number | null; participantes?: number };
type MessageRecord = { id: string; remetente_id: string; destinatario_id: string; conteudo: string; enviada_em: string };
type ConversationRecord = { aluno_id: string; nome: string; curso?: string | null; avatar_url?: string; ultima_mensagem: string; enviada_em: string; remetente_id: string };
type CommentRecord = { id: string; publicacao_id: string; autor_id: string; autor_nome: string; conteudo: string; criada_em: string };
type NotificationRecord = { id: string; tipo: 'solicitacao_participacao' | 'presenca_confirmada' | 'comentario' | 'novo_seguidor' | 'nova_publicacao' | 'convite_projeto'; publicacao_id?: string | null; publicacao_titulo?: string | null; aluno_nome: string; aluno_id?: string; criada_em: string; conteudo?: string };

function normalized(value: string) {
  return value.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function overlapScore(terms: string[], text: string, points: number) {
  const haystack = ` ${normalized(text)} `;
  return terms.reduce((total, term) => {
    const needle = normalized(term);
    return needle.length > 1 && haystack.includes(` ${needle} `) ? total + points : total;
  }, 0);
}

function personSimilarity(current: StudentProfile, candidate: StudentProfile) {
  const currentCourse = normalized(current.curso ?? '');
  let score = currentCourse && currentCourse === normalized(candidate.curso ?? '') ? 8 : 0;
  const candidateData = `${candidate.interesses.join(' ')} ${(candidate.areas_interesse ?? []).join(' ')} ${candidate.habilidades.join(' ')}`;
  score += overlapScore(current.interesses, candidateData, 4);
  score += overlapScore(current.areas_interesse ?? [], candidateData, 4);
  score += overlapScore(current.habilidades, `${candidate.habilidades.join(' ')} ${candidate.interesses.join(' ')}`, 3);
  return score;
}

function PeopleDirectory({ students, current, onOpen }: { students: StudentProfile[]; current: StudentProfile; onOpen: (id: string) => void }) {
  const [search, setSearch] = React.useState('');
  const ranked = students.filter((person) => person.id !== current.id)
    .map((person) => ({ person, score: personSimilarity(current, person) }))
    .filter(({ person }) => `${person.nome} ${person.curso ?? ''} ${person.interesses.join(' ')} ${person.habilidades.join(' ')}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.score - a.score || a.person.nome.localeCompare(b.person.nome, 'pt-BR'));
  return <section className="directory-view">
    <div className="eyebrow">PESSOAS COM ALGO EM COMUM</div><h1>Encontre colegas</h1><p>Perfis de outros alunos, priorizados por curso, interesses e habilidades parecidos com os seus.</p>
    <div className="directory-search"><Icon name="search" size={18}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar alunos, cursos e interesses" aria-label="Buscar alunos"/></div>
    <div className="student-grid">{ranked.map(({ person, score }) => <button className="student-card" key={person.id} onClick={() => onOpen(person.id)}><UserAvatar name={person.nome} src={person.avatar_url} className="avatar avatar-teal" /><span className="student-card-main"><strong>{person.nome}</strong><small>{person.curso || 'Curso não informado'}</small><span className="student-card-tags">{score > 0 && <i className="match-badge">Em comum</i>}{person.interesses.slice(0,2).map((tag) => <i key={tag}>{tag}</i>)}{person.habilidades.slice(0,1).map((tag) => <i key={tag}>{tag}</i>)}</span></span><Icon name="arrow" size={17}/></button>)}</div>
    {!ranked.length && <div className="no-results">Nenhum outro aluno encontrado para essa busca.</div>}
  </section>;
}

function FollowingDirectory({ profiles, posts, onOpenProfile, onOpenPost }: { profiles: StudentProfile[]; posts: CommunityItem[]; onOpenProfile: (id: string) => void; onOpenPost: (post: CommunityItem) => void }) {
  const [typeFilter, setTypeFilter] = React.useState('');
  const [dateFilter, setDateFilter] = React.useState('');
  const filteredPosts = posts.filter((post) => {
    const postDate = post.startAt ?? String(post.raw?.criada_em ?? '');
    return (!typeFilter || post.type === typeFilter) && (!dateFilter || postDate.startsWith(dateFilter));
  });
  return <section className="directory-view following-view">
    <div className="eyebrow">SUA REDE</div><h1>Seguindo</h1><p>Acompanhe os perfis e as publicações das pessoas que você segue.</p>
    <section className="following-section"><div className="section-heading"><div><h2>Perfis que você segue</h2><p>{profiles.length} {profiles.length === 1 ? 'pessoa' : 'pessoas'}</p></div></div>
      {profiles.length ? <div className="following-profile-grid">{profiles.map((person) => <button className="student-card" key={person.id} onClick={() => onOpenProfile(person.id)}><UserAvatar name={person.nome} src={person.avatar_url} className="avatar avatar-teal" /><span className="student-card-main"><strong>{person.nome}</strong><small>{person.curso || 'Curso não informado'}</small></span><Icon name="arrow" size={17}/></button>)}</div> : <div className="empty-state">Você ainda não segue ninguém. Abra o perfil de um aluno e selecione “Seguir”.</div>}
    </section>
    <section className="following-section"><div className="section-heading"><div><h2>Publicações recentes</h2><p>Conteúdos compartilhados por quem você segue.</p></div></div>
      <div className="following-filters"><label>Tipo<select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="">Todos os tipos</option><option>Projeto</option><option>Evento</option><option>Grupo de estudo</option><option>Ideia</option><option>Postagem livre</option></select></label><label>Data<input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)}/></label><button className="secondary-button" onClick={() => { setTypeFilter(''); setDateFilter(''); }}>Limpar</button></div>
      {filteredPosts.length ? <div className="following-post-list">{filteredPosts.map((post) => <article className="following-post-card" key={post.id ?? post.title}><div className="following-post-author"><button type="button" className="profile-inline-link" onClick={() => post.authorId && onOpenProfile(post.authorId)}>{profiles.find((person) => person.id === post.authorId)?.nome ?? 'Aluno seguido'}</button><span className="type-pill static-pill">{post.type}</span></div>{post.type !== 'Postagem livre' && <h3>{post.title}</h3>}<p>{post.description}</p><button className="secondary-button" onClick={() => onOpenPost(post)}>Ver publicação</button></article>)}</div> : <div className="empty-state">Nenhuma publicação encontrada com esses filtros.</div>}
    </section>
  </section>;
}

function FavoritesDirectory({ posts, profiles, onOpenPost, onOpenProfile, onRemove }: { posts: CommunityItem[]; profiles: StudentProfile[]; onOpenPost: (post: CommunityItem) => void; onOpenProfile: (id: string) => void; onRemove: (post: CommunityItem) => void }) {
  return <section className="directory-view following-view"><div className="eyebrow">GUARDADAS PARA DEPOIS</div><h1>Favoritos</h1><p>Publicações que você salvou para consultar novamente.</p>{posts.length ? <div className="following-post-list">{posts.map((post) => <article className="following-post-card" key={post.id ?? post.title}><div className="following-post-author"><button type="button" className="profile-inline-link" onClick={() => post.authorId && onOpenProfile(post.authorId)}>{profiles.find((person) => person.id === post.authorId)?.nome ?? 'Aluno da comunidade'}</button><span className="type-pill static-pill">{post.type}</span></div>{post.type !== 'Postagem livre' && <h3>{post.title}</h3>}<p>{post.description}</p><div className="favorite-card-actions"><button className="secondary-button" onClick={() => onOpenPost(post)}>Ver publicação</button><button className="text-action" onClick={() => onRemove(post)}>Remover dos favoritos</button></div></article>)}</div> : <div className="empty-state">Você ainda não salvou publicações nos favoritos.</div>}</section>;
}

function NotificationCenter({ notifications, posts, studentId, onOpenProfile, onOpenPost, onManagePost, onChanged }: { notifications: NotificationRecord[]; posts: CommunityItem[]; studentId: string; onOpenProfile: (id: string) => void; onOpenPost: (post: CommunityItem) => void; onManagePost: (post: CommunityItem) => void; onChanged: () => void }) {
  const [busyId, setBusyId] = React.useState('');
  const [error, setError] = React.useState('');
  async function respond(notification: NotificationRecord, status: 'aceito' | 'recusado') {
    setBusyId(notification.id); setError('');
    try {
      const response = await fetch(`/convites/${encodeURIComponent(notification.id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ aluno_id: studentId, status }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail ?? 'Não foi possível responder ao convite.');
      onChanged();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Falha ao conectar à API.'); }
    finally { setBusyId(''); }
  }
  function content(notification: NotificationRecord) {
    if (notification.tipo === 'novo_seguidor') return <><strong>{notification.aluno_nome} começou a seguir você.</strong><p>Veja o perfil para conhecer interesses e habilidades.</p></>;
    if (notification.tipo === 'nova_publicacao') return <><strong>{notification.aluno_nome} fez uma nova publicação.</strong><p><b>{notification.publicacao_titulo ?? 'Publicação'}</b></p></>;
    if (notification.tipo === 'convite_projeto') return <><strong>{notification.aluno_nome} convidou você para colaborar.</strong><p><b>{notification.publicacao_titulo ?? 'Projeto ou grupo'}</b></p></>;
    if (notification.tipo === 'comentario') return <><strong>{notification.aluno_nome} comentou em uma publicação.</strong><p>{notification.conteudo} · <b>{notification.publicacao_titulo}</b></p></>;
    if (notification.tipo === 'presenca_confirmada') return <><strong>{notification.aluno_nome} confirmou presença.</strong><p>Em <b>{notification.publicacao_titulo}</b></p></>;
    return <><strong>{notification.aluno_nome} solicitou participação.</strong><p>Em <b>{notification.publicacao_titulo}</b></p></>;
  }
  return <section className="directory-view"><div className="resource-heading"><div><div className="eyebrow">ATIVIDADES NA SUA REDE</div><h1>Notificações</h1><p>Novos seguidores, publicações, convites e atividades nos seus posts.</p></div></div>{error && <p className="meeting-error" role="alert">{error}</p>}<div className="notification-list">{notifications.map((notification) => {
    const post = notification.publicacao_id ? posts.find((item) => item.id === notification.publicacao_id) : undefined;
    const action = notification.tipo === 'novo_seguidor' && notification.aluno_id ? <button className="secondary-button" onClick={() => onOpenProfile(notification.aluno_id!)}>Ver perfil</button> : notification.tipo === 'nova_publicacao' && post ? <button className="secondary-button" onClick={() => onOpenPost(post)}>Ver publicação</button> : notification.tipo === 'solicitacao_participacao' && post ? <button className="secondary-button" onClick={() => onManagePost(post)}>Gerenciar pedido</button> : notification.tipo === 'comentario' && post ? <button className="secondary-button" onClick={() => onOpenPost(post)}>Ver comentário</button> : notification.tipo === 'presenca_confirmada' && post ? <button className="secondary-button" onClick={() => onOpenPost(post)}>Ver evento</button> : null;
    return <article className="notification-card" key={`${notification.tipo}-${notification.id}`}><span className="notification-icon"><Icon name={notification.tipo === 'novo_seguidor' ? 'people' : notification.tipo === 'nova_publicacao' ? 'project' : notification.tipo === 'comentario' ? 'chat' : notification.tipo === 'presenca_confirmada' ? 'calendar' : 'bell'} size={17}/></span><div className="notification-copy">{content(notification)}<small>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(notification.criada_em))}</small></div>{notification.tipo === 'convite_projeto' ? <div className="invite-actions"><button className="primary-action" disabled={busyId === notification.id} onClick={() => void respond(notification, 'aceito')}>{busyId === notification.id ? 'Aguarde…' : 'Aceitar'}</button><button className="secondary-button" disabled={busyId === notification.id} onClick={() => void respond(notification, 'recusado')}>Recusar</button></div> : action}</article>;
  })}{!notifications.length && <div className="empty-state">Você não tem novas notificações.</div>}</div></section>;
}

function MeetingDirectory({ meetings, student, onDelete, onOpenProfile, onChanged }: { meetings: MeetingRecord[]; student: StudentProfile; onDelete: (meeting: MeetingRecord) => void; onOpenProfile: (id: string) => void; onChanged: () => void }) {
  const [attendees, setAttendees] = React.useState<Record<string, Array<{id:string;nome:string;avatar_url?:string}>>>({});
  const [busy, setBusy] = React.useState('');
  const [errors, setErrors] = React.useState<Record<string,string>>({});
  React.useEffect(() => {
    let cancelled = false;
    Promise.all(meetings.map(async (meeting) => {
      const response = await fetch(`/encontros/${encodeURIComponent(meeting.id)}/participantes`);
      return [meeting.id, response.ok ? await response.json() : []] as const;
    })).then((entries) => { if (!cancelled) setAttendees(Object.fromEntries(entries)); }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [meetings]);
  async function toggle(meeting: MeetingRecord) {
    const present = (attendees[meeting.id] ?? []).some((person) => person.id === student.id);
    setBusy(meeting.id); setErrors((current) => ({ ...current, [meeting.id]: '' }));
    try {
      const response = await fetch(`/encontros/${encodeURIComponent(meeting.id)}/participacoes${present ? `?aluno_id=${encodeURIComponent(student.id)}` : ''}`, {
        method: present ? 'DELETE' : 'POST', headers: { 'Content-Type': 'application/json' },
        ...(!present ? { body: JSON.stringify({ aluno_id: student.id }) } : {}),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail ?? 'Não foi possível atualizar sua presença.');
      const responsePeople = await fetch(`/encontros/${encodeURIComponent(meeting.id)}/participantes`);
      const people = responsePeople.ok ? await responsePeople.json() : [];
      setAttendees((current) => ({ ...current, [meeting.id]: people })); onChanged();
    } catch (error) { setErrors((current) => ({ ...current, [meeting.id]: error instanceof Error ? error.message : 'Falha ao conectar à API.' })); }
    finally { setBusy(''); }
  }
  return <div className="meeting-list">{meetings.map((meeting) => {
    const people = attendees[meeting.id] ?? [];
    const present = people.some((person) => person.id === student.id);
    return <article className="meeting-card meeting-card-expanded" key={meeting.id}><div className="meeting-date"><strong>{new Intl.DateTimeFormat('pt-BR',{day:'2-digit'}).format(new Date(meeting.inicio))}</strong><small>{new Intl.DateTimeFormat('pt-BR',{month:'short'}).format(new Date(meeting.inicio)).replace('.','')}</small></div><div className="meeting-copy"><h2>{meeting.titulo}</h2><p>{meeting.descricao}</p><small>{new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(meeting.inicio))} · {meeting.modalidade} · {meeting.local || 'Local a combinar'} · por {meeting.organizador_nome}</small><div className="meeting-attendees"><strong>Presenças: {people.length}{meeting.limite_participantes ? `/${meeting.limite_participantes}` : ''}</strong>{people.map((person) => <span className="meeting-attendee" key={person.id}><UserAvatar name={person.nome} src={person.avatar_url} className="avatar avatar-teal" /><button type="button" className="profile-inline-link" onClick={() => onOpenProfile(person.id)}>{person.nome}</button></span>)}</div>{errors[meeting.id] && <small className="meeting-error">{errors[meeting.id]}</small>}</div><div className="meeting-actions">{meeting.organizador_id !== student.id && <button className="secondary-button" onClick={() => toggle(meeting)} disabled={busy === meeting.id}>{busy === meeting.id ? 'Aguarde…' : present ? 'Cancelar presença' : 'Confirmar presença'}</button>}{meeting.organizador_id === student.id && <button className="secondary-button" onClick={() => onDelete(meeting)}>Excluir</button>}</div></article>;
  })}{!meetings.length && <div className="empty-state">Ainda não há encontros. Organize o primeiro.</div>}</div>;
}

function StudentProfileView({ person, own, currentStudentId, courses, onBack, onSaved, onMessage, onFollowChanged }: { person: StudentProfile; own: boolean; currentStudentId: string; courses: string[]; onBack: () => void; onSaved: (profile: StudentProfile) => void; onMessage: () => void; onFollowChanged: () => void }) {
  const initials = person.nome.split(/\s+/).slice(0,2).map((part) => part[0]).join('').toUpperCase();
  const [description, setDescription] = React.useState(person.descricao ?? '');
  const [course, setCourse] = React.useState(person.curso ?? '');
  const [institution, setInstitution] = React.useState(person.instituicao ?? '');
  const [interests, setInterests] = React.useState(person.interesses.join(', '));
  const [skills, setSkills] = React.useState(person.habilidades.join(', '));
  const [areas, setAreas] = React.useState((person.areas_interesse ?? []).join(', '));
  const [avatarUrl, setAvatarUrl] = React.useState(person.avatar_url ?? '');
  const [saving, setSaving] = React.useState(false);
  const [saveMessage, setSaveMessage] = React.useState('');
  const [following, setFollowing] = React.useState(false);
  const [followers, setFollowers] = React.useState(0);
  const [followBusy, setFollowBusy] = React.useState(false);
  const [followError, setFollowError] = React.useState('');
  const interestTags = interests.split(/[,;\n]/).map((tag) => tag.trim()).filter(Boolean);
  const skillTags = skills.split(/[,;\n]/).map((tag) => tag.trim()).filter(Boolean);
  const areaTags = areas.split(/[,;\n]/).map((tag) => tag.trim()).filter(Boolean);

  React.useEffect(() => {
    let cancelled = false;
    fetch(`/alunos/${encodeURIComponent(person.id)}/seguir?seguidor_id=${encodeURIComponent(currentStudentId)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail ?? 'Não foi possível carregar os seguidores.');
        return data as { seguindo: boolean; seguidores: number };
      })
      .then((data) => { if (!cancelled) { setFollowing(data.seguindo); setFollowers(data.seguidores); } })
      .catch((error) => { if (!cancelled) setFollowError(error instanceof Error ? error.message : 'Não foi possível carregar os seguidores.'); });
    return () => { cancelled = true; };
  }, [person.id, currentStudentId]);

  async function toggleFollow() {
    setFollowBusy(true); setFollowError('');
    try {
      const url = `/alunos/${encodeURIComponent(person.id)}/seguir${following ? `?seguidor_id=${encodeURIComponent(currentStudentId)}` : ''}`;
      const response = await fetch(url, {
        method: following ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        ...(following ? {} : { body: JSON.stringify({ seguidor_id: currentStudentId }) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail ?? 'Não foi possível atualizar o seguimento.');
      setFollowing(data.seguindo); setFollowers(data.seguidores); onFollowChanged();
    } catch (error) { setFollowError(error instanceof Error ? error.message : 'Não foi possível atualizar o seguimento.'); }
    finally { setFollowBusy(false); }
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setSaveMessage('');
    const split = (value: string) => value.split(/[,;\n]/).map((part) => part.trim()).filter(Boolean);
    try {
      const response = await fetch(`/alunos/${encodeURIComponent(person.id)}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ curso: course, instituicao: institution, interesses: split(interests), habilidades: split(skills), areas_interesse: split(areas), descricao: description, avatar_url: avatarUrl }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail ?? 'Não foi possível salvar o perfil.');
      const updated = { ...data, matricula: person.matricula } as StudentProfile;
      setDescription(updated.descricao ?? ''); setCourse(updated.curso ?? ''); setInstitution(updated.instituicao ?? '');
      setInterests(updated.interesses.join(', ')); setSkills(updated.habilidades.join(', '));
      setAreas((updated.areas_interesse ?? []).join(', '));
      setAvatarUrl(updated.avatar_url ?? '');
      onSaved(updated); setSaveMessage('Perfil salvo.');
    } catch (error) { setSaveMessage(error instanceof Error ? error.message : 'Falha ao conectar à API.'); }
    finally { setSaving(false); }
  }

  function selectAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setSaveMessage('Escolha uma imagem PNG, JPEG ou WebP de até 2 MB.'); event.target.value = ''; return;
    }
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === 'string') { setAvatarUrl(reader.result); setSaveMessage('Salve o perfil para atualizar sua foto.'); } };
    reader.onerror = () => setSaveMessage('Não foi possível carregar esta imagem.');
    reader.readAsDataURL(file);
  }

  return <section className="student-profile-view">
    <button className="back-link" onClick={onBack}>← Voltar</button>
    <article className="profile-hero"><div className="profile-cover"><span className="cover-orbit cover-orbit-a"/><span className="cover-orbit cover-orbit-b"/></div><div className="profile-identity"><UserAvatar name={person.nome} src={avatarUrl} className="profile-large-avatar" /><div><div className="eyebrow">{own ? 'MEU PERFIL' : 'PERFIL DO ALUNO'}</div><h1>{person.nome}</h1><p>{course || 'Curso não informado'}</p></div><div className="profile-actions"><span className="profile-follower-count">{followers} {followers === 1 ? 'seguidor' : 'seguidores'}</span>{!own && <><button type="button" className={following ? 'secondary-button' : 'primary-action'} onClick={toggleFollow} disabled={followBusy}>{followBusy ? 'Aguarde…' : following ? 'Seguindo' : 'Seguir'}</button><button type="button" className="secondary-button" onClick={onMessage}><Icon name="chat" size={15}/> Iniciar conversa</button></>}</div></div>{followError && !own && <p className="profile-follow-error" role="alert">{followError}</p>}</article>
    <article className="profile-section description-section"><div className="eyebrow">{own ? 'SEU PERFIL' : 'SOBRE'}</div><h2>{own ? 'Informações e interesses' : 'Descrição'}</h2>{own ? <form className="profile-edit-form" onSubmit={saveProfile}><label>Curso<input required minLength={2} maxLength={120} value={course} onChange={(event) => setCourse(event.target.value)} placeholder="Informe seu curso" /></label><label>Instituição de ensino<input required minLength={2} maxLength={160} value={institution} onChange={(event) => setInstitution(event.target.value)} placeholder="Universidade ou faculdade" /></label><label>Interesses<input value={interests} onChange={(event) => setInterests(event.target.value)} placeholder="Ex.: educação, tecnologia" /></label><label>Habilidades<input value={skills} onChange={(event) => setSkills(event.target.value)} placeholder="Ex.: Python, pesquisa, design" /></label><label>Áreas de interesse para projetos<input value={areas} onChange={(event) => setAreas(event.target.value)} placeholder="Ex.: jogos, sustentabilidade" /></label><label>Foto de perfil<input type="file" accept="image/png,image/jpeg,image/webp" onChange={selectAvatar} /><small>PNG, JPEG ou WebP · até 2 MB</small></label><label>Descrição<textarea maxLength={600} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Conte um pouco sobre você e o que gostaria de construir com outras pessoas." aria-label="Descrição do perfil"/><small className="character-count">{description.length}/600 caracteres</small></label><div className="description-form-footer"><span className="description-save-message" role="status">{saveMessage}</span><button type="submit" className="primary-action" disabled={saving}>{saving ? 'Salvando…' : 'Salvar perfil'}</button></div></form> : <p className="profile-description-text">{description || 'Este aluno ainda não adicionou uma descrição.'}</p>}</article>
    <div className="profile-detail-grid"><article className="profile-section"><div className="eyebrow">SOBRE</div><h2>Perfil acadêmico</h2><dl><div><dt>Curso</dt><dd>{course || 'Não informado'}</dd></div><div><dt>Instituição</dt><dd>{person.instituicao || 'Não informada'}</dd></div><div><dt>E-mail</dt><dd>{person.email}</dd></div>{own && person.matricula && <div><dt>Matrícula</dt><dd>{person.matricula}</dd></div>}</dl></article><article className="profile-section"><div className="eyebrow">O QUE GOSTA DE EXPLORAR</div><h2>Interesses</h2><div className="profile-chip-list">{interestTags.map((tag) => <span key={tag}>{tag}</span>)}{!interestTags.length && <small>Nenhum interesse informado.</small>}</div></article><article className="profile-section profile-skills"><div className="eyebrow">NO QUE PODE COLABORAR</div><h2>Habilidades</h2><div className="profile-chip-list skill-chips">{skillTags.map((tag) => <span key={tag}>{tag}</span>)}{!skillTags.length && <small>Nenhuma habilidade informada.</small>}</div><div className="profile-chip-list area-chips">{areaTags.map((tag) => <span key={tag}>{tag}</span>)}</div></article></div>
  </section>;
}

type ProjectParticipant = { id: string; aluno_id: string; nome: string; curso?: string | null; habilidades: string[]; avatar_url?: string; status: string };

function PublicationDetailsDialog({ item, authorName, authorId, studentId, onClose, onCommented, onOpenProfile }: { item: CommunityItem; authorName: string; authorId?: string; studentId: string; onClose: () => void; onCommented: () => void; onOpenProfile: (studentId: string) => void }) {
  const [participants, setParticipants] = React.useState<ProjectParticipant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = React.useState(item.type === 'Projeto');
  const [participantError, setParticipantError] = React.useState('');
  const [comments, setComments] = React.useState<CommentRecord[]>([]);
  const [commentDraft, setCommentDraft] = React.useState('');
  const [commentError, setCommentError] = React.useState('');
  const [commentBusy, setCommentBusy] = React.useState(false);
  const raw = item.raw ?? {};

  React.useEffect(() => {
    if (item.type !== 'Projeto' || !item.id) return;
    let cancelled = false;
    fetch(`/publicacoes/${encodeURIComponent(item.id)}/participacoes`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail ?? 'Não foi possível carregar os participantes.');
        return data as ProjectParticipant[];
      })
      .then((data) => { if (!cancelled) setParticipants(data.filter((participant) => participant.status === 'aceita')); })
      .catch((error) => { if (!cancelled) setParticipantError(error instanceof Error ? error.message : 'Falha ao carregar participantes.'); })
      .finally(() => { if (!cancelled) setLoadingParticipants(false); });
    return () => { cancelled = true; };
  }, [item.id, item.type]);

  React.useEffect(() => {
    if (!item.id) return;
    fetch(`/publicacoes/${encodeURIComponent(item.id)}/comentarios`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail ?? 'Não foi possível carregar os comentários.');
        setComments(data as CommentRecord[]);
      })
      .catch((error) => setCommentError(error instanceof Error ? error.message : 'Falha ao carregar comentários.'));
  }, [item.id]);

  async function submitComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!item.id || !commentDraft.trim()) return;
    setCommentBusy(true); setCommentError('');
    try {
      const response = await fetch(`/publicacoes/${encodeURIComponent(item.id)}/comentarios`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aluno_id: studentId, conteudo: commentDraft }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail ?? 'Não foi possível publicar o comentário.');
      setComments((current) => [...current, data as CommentRecord]);
      setCommentDraft(''); onCommented();
    } catch (error) { setCommentError(error instanceof Error ? error.message : 'Falha ao enviar comentário.'); }
    finally { setCommentBusy(false); }
  }

  const desiredSkills = Array.isArray(raw.habilidades_desejadas) ? raw.habilidades_desejadas.filter((value): value is string => typeof value === 'string') : [];
  const createdAt = typeof raw.criada_em === 'string' ? new Date(raw.criada_em) : null;
  const eventAt = typeof raw.inicio === 'string' ? new Date(raw.inicio) : null;
  const formatDate = (date: Date | null, options: Intl.DateTimeFormatOptions) => date && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat('pt-BR', options).format(date) : '';

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="feature-dialog publication-details-dialog" role="dialog" aria-modal="true" aria-labelledby="publication-details-title"><div className="feature-dialog-heading"><div><div className="eyebrow">DETALHES DA PUBLICAÇÃO · {item.type.toLocaleUpperCase('pt-BR')}</div><h2 id="publication-details-title">{item.title}</h2></div><button className="close-button" onClick={onClose} aria-label="Fechar detalhes">×</button></div><div className="publication-detail-content"><p className="publication-detail-description">{item.description}</p><dl className="publication-detail-meta"><div><dt>Publicado por</dt><dd>{authorId ? <button type="button" className="profile-inline-link" onClick={() => onOpenProfile(authorId)}>{authorName}</button> : authorName}</dd></div>{createdAt && <div><dt>Publicado em</dt><dd>{formatDate(createdAt, { dateStyle: 'long' })}</dd></div>}{item.type === 'Projeto' && <div><dt>Vagas</dt><dd>{typeof raw.vagas === 'number' ? raw.vagas : 'A combinar'}</dd></div>}{item.type === 'Evento' && eventAt && <div><dt>Data e horário</dt><dd>{formatDate(eventAt, { dateStyle: 'long', timeStyle: 'short' })}</dd></div>}{item.type === 'Evento' && <div><dt>Local ou modalidade</dt><dd>{[raw.modalidade, raw.local].filter((value): value is string => typeof value === 'string' && value.length > 0).join(' · ') || 'A combinar'}</dd></div>}{item.type === 'Grupo de estudo' && <><div><dt>Disciplina</dt><dd>{typeof raw.disciplina === 'string' && raw.disciplina ? raw.disciplina : 'Não informada'}</dd></div><div><dt>Assunto</dt><dd>{typeof raw.assunto === 'string' && raw.assunto ? raw.assunto : 'Não informado'}</dd></div></>}</dl>{item.tags.length > 0 && <div className="publication-detail-tags">{item.tags.map((tag) => <span className="interest-tag" key={tag}>{tag}</span>)}</div>}{item.type === 'Projeto' && desiredSkills.length > 0 && <section className="project-skills"><h3>Habilidades procuradas</h3><div className="publication-detail-tags">{desiredSkills.map((skill) => <span className="interest-tag" key={skill}>{skill}</span>)}</div></section>}{item.type === 'Projeto' && <section className="project-participants"><h3>Participantes do projeto <span>{participants.length}</span></h3>{participantError ? <p className="detail-error">{participantError}</p> : loadingParticipants ? <p className="detail-muted">Carregando participantes…</p> : participants.length ? <div className="project-participant-list">{participants.map((person) => <div className="project-participant" key={person.id}><UserAvatar name={person.nome} src={person.avatar_url} className="avatar avatar-teal" /><span className="project-participant-copy"><button type="button" className="profile-inline-link" onClick={() => onOpenProfile(person.aluno_id)}>{person.nome}</button><small>{person.curso || 'Curso não informado'}</small>{person.habilidades?.length ? <span className="participant-skill-tags">{person.habilidades.map((skill) => <i key={skill}>{skill}</i>)}</span> : <small className="participant-no-skills">Habilidades não informadas</small>}</span></div>)}</div> : <p className="detail-muted">Ainda não há participantes confirmados neste projeto.</p>}</section>}<section className="post-comments"><h3>Comentários <span>{comments.length}</span></h3>{commentError && <p className="detail-error">{commentError}</p>}<div className="post-comment-list">{comments.map((comment) => <article className="post-comment" key={comment.id}><div><strong>{comment.autor_nome}</strong><small>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(comment.criada_em))}</small></div><p>{comment.conteudo}</p></article>)}{!comments.length && <p className="detail-muted">Ainda não há comentários nesta publicação.</p>}</div><form className="post-comment-form" onSubmit={submitComment}><input value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} placeholder="Escreva um comentário..." maxLength={2000} aria-label="Comentário" required/><button className="primary-action" disabled={commentBusy || !commentDraft.trim()}>{commentBusy ? 'Publicando…' : 'Comentar'}</button></form></section></div><div className="feature-dialog-actions"><button className="secondary-button" onClick={onClose}>Fechar</button></div></section></div>;
}

export default function App() {
  const [active, setActive] = React.useState('Início');
  const [query, setQuery] = React.useState('');
  const [student, setStudent] = React.useState<StudentProfile | null>(() => {
    try { const saved = localStorage.getItem('conecta_aluno'); return saved ? JSON.parse(saved) as StudentProfile : null; }
    catch { return null; }
  });
  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loginError, setLoginError] = React.useState('');
  const [loginBusy, setLoginBusy] = React.useState(false);
  const [items, setItems] = React.useState<CommunityItem[]>(suggestions);
  const [directoryStudents, setDirectoryStudents] = React.useState<StudentProfile[]>([]);
  const [followingProfiles, setFollowingProfiles] = React.useState<StudentProfile[]>([]);
  const [favoriteIds, setFavoriteIds] = React.useState<string[]>([]);
  const [selectedProfile, setSelectedProfile] = React.useState<StudentProfile | null>(null);
  const [profileLoading, setProfileLoading] = React.useState(false);
  const [apiStatus, setApiStatus] = React.useState<'loading' | 'online' | 'offline'>('loading');
  const [courses, setCourses] = React.useState<string[]>([]);
  const [registerMode, setRegisterMode] = React.useState(false);
  const [registerName, setRegisterName] = React.useState('');
  const [registerEmail, setRegisterEmail] = React.useState('');
  const [registerCourse, setRegisterCourse] = React.useState('');
  const [registerInstitution, setRegisterInstitution] = React.useState('');
  const [registerPassword, setRegisterPassword] = React.useState('');
  const [registerInterests, setRegisterInterests] = React.useState('');
  const [registerSkills, setRegisterSkills] = React.useState('');
  const [registerAreas, setRegisterAreas] = React.useState('');
  const [reloadToken, setReloadToken] = React.useState(0);
  const [participations, setParticipations] = React.useState<ParticipationRecord[]>([]);
  const [notifications, setNotifications] = React.useState<NotificationRecord[]>([]);
  const [meetings, setMeetings] = React.useState<MeetingRecord[]>([]);
  const [showPublication, setShowPublication] = React.useState(false);
  const [editingPost, setEditingPost] = React.useState<CommunityItem | null>(null);
  const [managedPost, setManagedPost] = React.useState<CommunityItem | null>(null);
  const [detailPost, setDetailPost] = React.useState<CommunityItem | null>(null);
  const [showMeetingForm, setShowMeetingForm] = React.useState(false);
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [courseFilter, setCourseFilter] = React.useState('');
  const [interestFilter, setInterestFilter] = React.useState('');
  const [skillFilter, setSkillFilter] = React.useState('');
  const [dateFilter, setDateFilter] = React.useState('');
  const [chatPersonId, setChatPersonId] = React.useState('');
  const [chatConversations, setChatConversations] = React.useState<ConversationRecord[]>([]);
  const [chatMessages, setChatMessages] = React.useState<MessageRecord[]>([]);
  const [chatInput, setChatInput] = React.useState('');
  const [chatError, setChatError] = React.useState('');
  const [chatBusy, setChatBusy] = React.useState(false);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginBusy(true);
    setLoginError('');
    try {
      const request = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identificador: identifier.trim().toLowerCase(), senha: password }),
      };
      let response: Response | null = null;
      for (let attempt = 0; attempt < 3 && !response; attempt += 1) {
        try {
          response = await fetch('/login', request);
        } catch (error) {
          if (attempt === 2) throw new Error('A API não respondeu após algumas tentativas. Aguarde a inicialização e tente novamente.');
          await new Promise((resolve) => window.setTimeout(resolve, 500 * (attempt + 1)));
        }
      }
      if (!response) throw new Error('Não foi possível conectar à API.');
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail ?? 'Não foi possível entrar.');
      setStudent(data.aluno as StudentProfile);
      localStorage.setItem('conecta_aluno', JSON.stringify(data.aluno));
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Não foi possível conectar à API.');
    } finally {
      setLoginBusy(false);
    }
  }

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoginBusy(true); setLoginError('');
    const split = (value: string) => value.split(/[,;\n]/).map((part) => part.trim()).filter(Boolean);
    try {
      const response = await fetch('/cadastro', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: registerName.trim(), email: registerEmail.trim().toLowerCase(), curso: registerCourse, instituicao: registerInstitution.trim(), senha: registerPassword, interesses: split(registerInterests), habilidades: split(registerSkills), areas_interesse: split(registerAreas) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail ?? 'Não foi possível criar a conta.');
      const registeredProfile = data.aluno as StudentProfile;
      setStudent(registeredProfile);
      setDirectoryStudents((people) => people.some((person) => person.id === registeredProfile.id) ? people.map((person) => person.id === registeredProfile.id ? registeredProfile : person) : [...people, registeredProfile]);
      localStorage.setItem('conecta_aluno', JSON.stringify(registeredProfile));
      setRegisterMode(false); setReloadToken((value) => value + 1);
    } catch (error) { setLoginError(error instanceof Error ? error.message : 'Não foi possível conectar à API.'); }
    finally { setLoginBusy(false); }
  }

  async function openProfile(studentId: string) {
    setProfileLoading(true);
    try {
      const response = await fetch(`/alunos/${encodeURIComponent(studentId)}`);
      if (!response.ok) throw new Error('Não foi possível carregar este perfil.');
      const profile = await response.json() as StudentProfile;
      if (student?.id === profile.id && student.matricula) profile.matricula = student.matricula;
      setSelectedProfile(profile);
      setActive('Perfil');
    } catch {
      setSelectedProfile(null);
      setActive('Perfil');
    } finally {
      setProfileLoading(false);
    }
  }

  function applyProfileUpdate(updated: StudentProfile) {
    setSelectedProfile(updated);
    setDirectoryStudents((people) => people.map((person) => person.id === updated.id ? { ...person, ...updated } : person));
    if (student?.id === updated.id) {
      const merged = { ...student, ...updated };
      setStudent(merged); localStorage.setItem('conecta_aluno', JSON.stringify(merged));
    }
  }

  async function requestParticipation(item: CommunityItem) {
    if (!item.id || !student) return;
    const existing = participations.find((entry) => entry.publicacao_id === item.id);
    try {
      if (existing && ['pendente', 'aceita'].includes(existing.status)) {
        const response = await fetch(`/participacoes/${encodeURIComponent(existing.id)}?aluno_id=${encodeURIComponent(student.id)}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Não foi possível cancelar a participação.');
      } else {
        const publicationCheck = await fetch(`/publicacoes/${encodeURIComponent(item.id)}`);
        if (publicationCheck.status === 404) {
          setReloadToken((value) => value + 1);
          throw new Error('Esta publicação não está mais disponível. Atualizei a lista; escolha uma publicação atual.');
        }
        if (!publicationCheck.ok) throw new Error(`Não foi possível conferir a publicação (HTTP ${publicationCheck.status}).`);
        const response = await fetch(`/publicacoes/${encodeURIComponent(item.id)}/participacoes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ aluno_id: student.id }) });
        const data = await response.json().catch(() => ({} as { detail?: unknown }));
        const detail = typeof data.detail === 'string' ? data.detail : '';
        if (!response.ok) {
          const alreadyParticipating = response.status === 409 && /já (solicitou|participa|aguarda)|já possui participação/i.test(detail);
          if (!alreadyParticipating) throw new Error(detail || `A API respondeu com erro HTTP ${response.status} ao solicitar participação.`);
        }
        window.alert('Solicitação de participação enviada.');
      }
      setReloadToken((value) => value + 1);
    } catch (error) { window.alert(error instanceof Error ? error.message : 'Falha ao conectar à API.'); }
  }

  async function deletePublication(item: CommunityItem) {
    if (!item.id || !student || !window.confirm(`Excluir “${item.title}”?`)) return;
    try {
      const response = await fetch(`/publicacoes/${encodeURIComponent(item.id)}?aluno_id=${encodeURIComponent(student.id)}`, { method: 'DELETE' });
      if (!response.ok) { const data = await response.json(); throw new Error(data.detail ?? 'Não foi possível excluir.'); }
      setReloadToken((value) => value + 1);
    } catch (error) { window.alert(error instanceof Error ? error.message : 'Falha ao conectar à API.'); }
  }

  async function sharePublication(item: CommunityItem) {
    if (!item.id) return;
    const link = `${window.location.origin}/?post=${encodeURIComponent(item.id)}`;
    try { await navigator.clipboard.writeText(link); window.alert('Link copiado. Você já pode compartilhar a publicação.'); }
    catch { window.prompt('Copie este link para compartilhar:', link); }
  }

  async function toggleFavorite(item: CommunityItem) {
    if (!student || !item.id) return;
    const isFavorite = favoriteIds.includes(item.id);
    try {
      const response = await fetch(`/publicacoes/${encodeURIComponent(item.id)}/favoritos${isFavorite ? `?aluno_id=${encodeURIComponent(student.id)}` : ''}`, {
        method: isFavorite ? 'DELETE' : 'POST', headers: { 'Content-Type': 'application/json' },
        ...(!isFavorite ? { body: JSON.stringify({ aluno_id: student.id }) } : {}),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail ?? 'Não foi possível atualizar os favoritos.');
      setFavoriteIds((current) => isFavorite ? current.filter((id) => id !== item.id) : [...current, item.id!]);
    } catch (error) { window.alert(error instanceof Error ? error.message : 'Falha ao conectar à API.'); }
  }

  async function deleteMeeting(meeting: MeetingRecord) {
    if (!student || !window.confirm(`Excluir o encontro “${meeting.titulo}”?`)) return;
    try {
      const response = await fetch(`/encontros/${encodeURIComponent(meeting.id)}?organizador_id=${encodeURIComponent(student.id)}`, { method: 'DELETE' });
      if (!response.ok) { const data = await response.json(); throw new Error(data.detail ?? 'Não foi possível excluir o encontro.'); }
      setReloadToken((value) => value + 1);
    } catch (error) { window.alert(error instanceof Error ? error.message : 'Falha ao conectar à API.'); }
  }

  function logout() {
    localStorage.removeItem('conecta_aluno');
    setStudent(null);
    setPassword('');
    setChatPersonId('');
    setChatMessages([]);
    setChatInput('');
    setChatError('');
    setChatConversations([]);
    setActive('Início');
  }
  React.useEffect(() => {
    if (active !== 'Bate-papo' && active !== 'Pessoas') return;
    let cancelled = false;
    const refreshDirectory = () => fetch('/alunos', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Falha ao atualizar alunos')))
      .then((data: StudentProfile[]) => { if (!cancelled) setDirectoryStudents(data); })
      .catch(() => undefined);
    refreshDirectory();
    const timer = window.setInterval(refreshDirectory, 15000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [active]);
  React.useEffect(() => {
    let firstResponse = true;
    fetch('/cursos').then((response) => response.ok ? response.json() : []).then((data: string[]) => setCourses(data)).catch(() => setCourses([]));
    fetch('/alunos').then((response) => response.ok ? response.json() : []).then((data: StudentProfile[]) => setDirectoryStudents(data)).catch(() => setDirectoryStudents([]));
    const refreshPublications = () => fetch('/publicacoes')
      .then((response) => {
        if (!response.ok) throw new Error('Falha ao buscar publicações');
        return response.json();
      })
      .then((data: Array<Record<string, unknown>>) => {
        const converted = data.map((item, index): CommunityItem => {
          const rawType = String(item.tipo ?? 'Publicação');
          const type = ({ Projeto: 'Projeto', Evento: 'Evento', GrupoEstudo: 'Grupo de estudo', Ideia: 'Ideia', PublicacaoLivre: 'Postagem livre' } as Record<string, string>)[rawType] ?? rawType;
          const detailTags = [item.disciplina, item.assunto, ...(Array.isArray(item.objetivos) ? item.objetivos : []), ...(Array.isArray(item.habilidades_desejadas) ? item.habilidades_desejadas : [])].filter((tag): tag is string => typeof tag === 'string' && tag.length > 0);
          const tones = ['petroleum', 'lavender', 'yellow'];
          const date = typeof item.inicio === 'string' ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(item.inicio)).replace('.', '') : '';
          const details = [date, item.local, item.modalidade].filter((value): value is string => typeof value === 'string' && value.length > 0).join(' · ');
          const places = item.vagas ?? item.limite_participantes;
          const occupied = Number(item.vagas_ocupadas ?? 0);
          const supportsParticipants = ['Projeto', 'Evento', 'GrupoEstudo'].includes(rawType);
          return {
            id: typeof item.id === 'string' ? item.id : undefined,
            type,
            raw: item,
            startAt: typeof item.inicio === 'string' ? item.inicio : undefined,
            title: String(item.titulo ?? 'Sem título'),
            description: String(item.descricao ?? ''),
            tags: detailTags.slice(0, 2),
            people: !supportsParticipants ? 'Ver detalhes' : places != null ? `${occupied}/${String(places)} vagas ocupadas` : `${occupied} ${occupied === 1 ? 'participante' : 'participantes'}`,
            tone: tones[index % tones.length],
            initials: String(item.titulo ?? 'CA').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase(),
            authorId: typeof item.autor_id === 'string' ? item.autor_id : undefined,
            details,
          };
        });
        setItems(converted);
        setApiStatus('online');
        if (!firstResponse) return;
        firstResponse = false;
        const sharedPostId = new URLSearchParams(window.location.search).get('post');
        const sharedPost = converted.find((post) => post.id === sharedPostId);
        if (sharedPost) {
          setActive(sharedPost.type === 'Projeto' ? 'Projetos' : sharedPost.type === 'Evento' ? 'Eventos' : sharedPost.type === 'Grupo de estudo' ? 'Grupos de estudo' : 'Início');
          window.setTimeout(() => document.getElementById(`post-${sharedPost.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
        }
      })
      .catch(() => setApiStatus('offline'));
    refreshPublications();
    const timer = window.setInterval(refreshPublications, 15000);
    return () => window.clearInterval(timer);
  }, [reloadToken]);

  React.useEffect(() => {
    if (!student) { setChatConversations([]); return; }
    let cancelled = false;
    fetch(`/conversas?aluno_id=${encodeURIComponent(student.id)}`)
      .then((response) => response.ok ? response.json() : [])
      .then((data: ConversationRecord[]) => { if (!cancelled) setChatConversations(data); })
      .catch(() => { if (!cancelled) setChatConversations([]); });
    return () => { cancelled = true; };
  }, [student?.id, reloadToken]);
  React.useEffect(() => {
    if (!student) { setFollowingProfiles([]); return; }
    let cancelled = false;
    fetch(`/alunos/${encodeURIComponent(student.id)}/seguindo`)
      .then((response) => response.ok ? response.json() : [])
      .then((data: StudentProfile[]) => { if (!cancelled) setFollowingProfiles(data); })
      .catch(() => { if (!cancelled) setFollowingProfiles([]); });
    return () => { cancelled = true; };
  }, [student?.id, reloadToken]);
  React.useEffect(() => {
    if (!student) { setFavoriteIds([]); return; }
    let cancelled = false;
    fetch(`/alunos/${encodeURIComponent(student.id)}/favoritos`)
      .then((response) => response.ok ? response.json() : [])
      .then((data: Array<{id:string}>) => { if (!cancelled) setFavoriteIds(data.map((item) => item.id)); })
      .catch(() => { if (!cancelled) setFavoriteIds([]); });
    return () => { cancelled = true; };
  }, [student?.id, reloadToken]);
  React.useEffect(() => {
    if (!student) { setParticipations([]); setMeetings([]); setNotifications([]); return; }
    fetch(`/alunos/${encodeURIComponent(student.id)}/participacoes`).then((response) => response.ok ? response.json() : []).then((data: ParticipationRecord[]) => setParticipations(data)).catch(() => setParticipations([]));
    fetch('/encontros').then((response) => response.ok ? response.json() : []).then((data: MeetingRecord[]) => setMeetings(data)).catch(() => setMeetings([]));
    const refreshNotifications = () => fetch(`/notificacoes?aluno_id=${encodeURIComponent(student.id)}`).then((response) => response.ok ? response.json() : []).then((data: NotificationRecord[]) => setNotifications(data)).catch(() => setNotifications([]));
    refreshNotifications();
    const timer = window.setInterval(refreshNotifications, 15000);
    return () => window.clearInterval(timer);
  }, [student?.id, reloadToken]);

  React.useEffect(() => {
    if (!student || active !== 'Bate-papo' || !chatPersonId) { setChatMessages([]); return; }
    let cancelled = false;
    const loadMessages = () => fetch(`/mensagens/${encodeURIComponent(chatPersonId)}?aluno_id=${encodeURIComponent(student.id)}`)
      .then((response) => response.ok ? response.json() : [])
      .then((data: MessageRecord[]) => { if (!cancelled) setChatMessages(data); })
      .catch(() => { if (!cancelled) setChatError('Não foi possível carregar as mensagens.'); });
    loadMessages();
    const timer = window.setInterval(loadMessages, 4000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [student?.id, active, chatPersonId]);

  async function sendChatMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!student || !chatPersonId || !chatInput.trim()) return;
    setChatBusy(true); setChatError('');
    try {
      const response = await fetch('/mensagens', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ remetente_id: student.id, destinatario_id: chatPersonId, conteudo: chatInput }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail ?? 'Não foi possível enviar a mensagem.');
      setChatMessages((messages) => [...messages, data as MessageRecord]); setChatInput(''); setReloadToken((value) => value + 1);
    } catch (error) { setChatError(error instanceof Error ? error.message : 'Falha ao conectar à API.'); }
    finally { setChatBusy(false); }
  }

  const rankedItems = [...items].map((item) => {
    const author = directoryStudents.find((person) => person.id === item.authorId);
    const text = `${item.title} ${item.description} ${item.tags.join(' ')} ${item.details ?? ''} ${author?.curso ?? ''} ${author?.interesses.join(' ') ?? ''} ${author?.habilidades.join(' ') ?? ''} ${author?.areas_interesse.join(' ') ?? ''}`;
    const courseScore = author && normalized(author.curso ?? '') === normalized(student?.curso ?? '') ? 8 : 0;
    const score = courseScore + overlapScore(student?.interesses ?? [], text, 4) + overlapScore(student?.habilidades ?? [], text, 3) + overlapScore(student?.areas_interesse ?? [], text, 3);
    return { item, score };
  }).sort((a, b) => b.score - a.score);
  const matchingItems = rankedItems.filter(({ item }) => {
    const author = directoryStudents.find((person) => person.id === item.authorId);
    const searchText = `${item.title} ${item.description} ${item.tags.join(' ')} ${author?.curso ?? ''} ${author?.interesses.join(' ') ?? ''} ${author?.habilidades.join(' ') ?? ''}`.toLowerCase();
    const matchesSearch = searchText.includes(query.toLowerCase());
    const matchesCourse = !courseFilter || author?.curso === courseFilter;
    const matchesInterest = !interestFilter || searchText.includes(interestFilter.toLowerCase());
    const matchesSkill = !skillFilter || searchText.includes(skillFilter.toLowerCase());
    const matchesDate = !dateFilter || (item.startAt ?? '').startsWith(dateFilter);
    const expectedType = active === 'Projetos' ? 'Projeto' : active === 'Eventos' ? 'Evento' : active === 'Grupos de estudo' ? 'Grupo de estudo' : null;
    const matchesMine = active !== 'Minhas publicações' || item.authorId === student?.id;
    return matchesSearch && matchesCourse && matchesInterest && matchesSkill && matchesDate && matchesMine && (!expectedType || item.type === expectedType);
  }).map(({ item, score }) => ({ ...item, relevance: score }));
  const followingIds = new Set(followingProfiles.map((person) => person.id));
  const followingPosts = rankedItems.filter(({ item }) => Boolean(item.authorId && followingIds.has(item.authorId))).sort((a, b) => String(b.item.raw?.criada_em ?? '').localeCompare(String(a.item.raw?.criada_em ?? ''))).map(({ item, score }) => ({ ...item, relevance: score }));
  const favoritePosts = rankedItems.filter(({ item }) => Boolean(item.id && favoriteIds.includes(item.id))).map(({ item, score }) => ({ ...item, relevance: score }));
  const pageCopy: Record<string, { eyebrow: string; title: string; description: string }> = {
    Projetos: { eyebrow: 'COLABORE E CRIE', title: 'Projetos', description: 'Encontre iniciativas de alunos e oportunidades para colaborar.' },
    Eventos: { eyebrow: 'AGENDA DA COMUNIDADE', title: 'Eventos', description: 'Veja encontros, atividades e oportunidades para participar.' },
    'Grupos de estudo': { eyebrow: 'APRENDER EM CONJUNTO', title: 'Grupos de estudo', description: 'Descubra grupos organizados por disciplina e assunto.' },
    'Minhas publicações': { eyebrow: 'O QUE VOCÊ COMPARTILHOU', title: 'Minhas publicações', description: 'Acompanhe e edite projetos, eventos, grupos e publicações que você criou.' },
    Seguindo: { eyebrow: 'SUA REDE', title: 'Seguindo', description: 'Acompanhe perfis e publicações de pessoas que você segue.' },
    Favoritos: { eyebrow: 'GUARDADAS PARA DEPOIS', title: 'Favoritos', description: 'Publicações salvas para consultar novamente.' },
  };
  const initials = student?.nome.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() ?? 'AL';

  if (!student) return <main className="login-page">
    <section className="login-card">
      <a className="brand login-brand" href="#inicio"><span className="brand-mark"><Icon name="spark" size={19} /></span><span>conecta<span className="brand-dot">.</span></span></a>
      {registerMode ? <><div className="login-eyebrow">NOVO CADASTRO</div><h1>Crie sua conta.</h1><p className="login-intro">Cadastre seus dados para participar da comunidade.</p><form className="login-form register-form" onSubmit={handleRegister}>
        <label>Nome completo<input required minLength={2} maxLength={120} value={registerName} onChange={(event) => setRegisterName(event.target.value)} /></label>
        <label>E-mail<input type="email" autoComplete="email" required maxLength={254} value={registerEmail} onChange={(event) => setRegisterEmail(event.target.value)} placeholder="voce@exemplo.com" /></label>
        <label>Curso<input required minLength={2} maxLength={120} value={registerCourse} onChange={(event) => setRegisterCourse(event.target.value)} placeholder="Ex.: Ciência da Computação" /></label>
        <label>Instituição de ensino<input required minLength={2} maxLength={160} value={registerInstitution} onChange={(event) => setRegisterInstitution(event.target.value)} placeholder="Ex.: Universidade ou faculdade" /></label>
        <label>Senha<input required minLength={6} type="password" value={registerPassword} onChange={(event) => setRegisterPassword(event.target.value)} placeholder="Mínimo de 6 caracteres" /></label>
        <label>Interesses<input value={registerInterests} onChange={(event) => setRegisterInterests(event.target.value)} placeholder="Ex.: tecnologia, educação" /></label>
        <label>Habilidades<input value={registerSkills} onChange={(event) => setRegisterSkills(event.target.value)} placeholder="Ex.: Python, pesquisa" /></label>
        <label>Áreas de interesse em projetos<input value={registerAreas} onChange={(event) => setRegisterAreas(event.target.value)} placeholder="Ex.: desenvolvimento de jogos" /></label>
        {loginError && <div className="login-error" role="alert">{loginError}</div>}
        <button className="primary-action login-submit" disabled={loginBusy}>{loginBusy ? 'Criando conta…' : 'Criar conta'}</button>
      </form><button className="switch-auth" onClick={() => { setRegisterMode(false); setLoginError(''); }}>Já tenho conta · Entrar</button></> : <><div className="login-eyebrow">COMUNIDADE ACADÊMICA</div>
      <h1>Bom ter você por aqui.</h1><p className="login-intro">Entre com seu e-mail e senha para encontrar projetos, grupos e pessoas.</p>
      <form className="login-form" onSubmit={handleLogin}>
        <label>E-mail<input type="email" autoComplete="username" required value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="voce@exemplo.com" /></label>
        <label>Senha<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Digite sua senha" /></label>
        {loginError && <div className="login-error" role="alert">{loginError}</div>}
        <button className="primary-action login-submit" type="submit" disabled={loginBusy}>{loginBusy ? 'Entrando…' : 'Entrar na comunidade'} <Icon name="arrow" size={17} /></button>
      </form>
      <button className="switch-auth" onClick={() => { setRegisterMode(true); setLoginError(''); }}>Criar conta</button>
      <div className="demo-accounts"><strong>Contas fictícias para testar</strong><p>Senha de todas: <code>aluno123</code></p><div><span>larissa@exemplo.com</span><small>Larissa · Administração</small></div><div><span>caio@exemplo.com</span><small>Caio · Análise e Desenvolvimento de Sistemas</small></div><div><span>bruna@exemplo.com</span><small>Bruna · Psicologia</small></div><div><span>pedro@exemplo.com</span><small>Pedro · Direito</small></div><div><span>marina@exemplo.com</span><small>Marina · Ciência de Dados</small></div><div><span>rafael@exemplo.com</span><small>Rafael · Enfermagem</small></div><div><span>sofia@exemplo.com</span><small>Sofia · Publicidade e Propaganda</small></div><div><span>thiago@exemplo.com</span><small>Thiago · Administração Pública</small></div></div></>}
      <div className="login-footer">Protótipo acadêmico · dados de demonstração</div>
    </section>
    <aside className="login-art"><div className="login-art-orbit orbit-a"/><div className="login-art-orbit orbit-b"/><div className="login-art-content"><span className="login-art-spark"><Icon name="spark" size={25}/></span><h2>Boas ideias<br/>encontram pessoas.</h2><p>Um espaço simples para estudar, colaborar e criar junto.</p><div className="login-art-tags"><span>projetos</span><span>encontros</span><span>comunidade</span></div></div><div className="login-art-caption">CONECTE-SE AO QUE VOCÊ QUER CONSTRUIR</div></aside>
  </main>;

  return <div className="community-app">
    <aside className="sidebar">
      <a className="brand" href="#inicio" onClick={() => setActive('Início')} aria-label="Conecta, início"><span className="brand-mark"><Icon name="spark" size={19} /></span><span>conecta<span className="brand-dot">.</span></span></a>
      <div className="workspace-caption">COMUNIDADE ACADÊMICA</div>
      <nav className="main-nav" aria-label="Navegação principal">
        {navigation.map((item) => <button key={item.label} className={`nav-item ${active === item.label ? 'selected' : ''}`} onClick={() => setActive(item.label)}><Icon name={item.icon} /><span>{item.label}</span>{item.label === 'Notificações' && notifications.length > 0 && <span className="nav-count">{notifications.length}</span>}</button>)}
      </nav>
    </aside>

    <main className="main-area" id="inicio">
      <header className="topbar"><div className="crumb">Comunidade <span>/</span> <strong>{active}</strong></div><div className="topbar-right"><span className="term-label">ESPAÇO UNIVERSITÁRIO</span><button className="top-profile-control" aria-label={`Abrir perfil de ${student.nome}`} onClick={() => openProfile(student.id)}><UserAvatar name={student.nome} src={student.avatar_url} className="avatar avatar-lilac top-avatar" /><span className="top-profile-copy"><strong>{student.nome}</strong><small>Meu perfil</small></span></button><button className="top-logout" onClick={logout} title="Encerrar sessão">Desconectar</button></div></header>
      <div className="page-content">
        {active === 'Notificações' ? <NotificationCenter notifications={notifications} posts={items} studentId={student.id} onOpenProfile={openProfile} onOpenPost={setDetailPost} onManagePost={setManagedPost} onChanged={() => setReloadToken((value) => value + 1)} /> : active === 'Bate-papo' ? <section className="chat-view"><div className="resource-heading"><div><div className="eyebrow">CONVERSAS DA COMUNIDADE</div><h1>Bate-papo</h1><p>Converse diretamente com outros alunos.</p></div></div><div className="chat-panel"><aside className="chat-contacts"><section className="chat-existing-list"><h2>Conversas</h2>{chatConversations.map((conversation) => <button className={`chat-contact ${chatPersonId === conversation.aluno_id ? 'selected' : ''}`} key={conversation.aluno_id} onClick={() => { setChatPersonId(conversation.aluno_id); setChatMessages([]); setChatError(''); }}><UserAvatar name={conversation.nome} src={conversation.avatar_url} className="avatar avatar-teal" /><span><strong>{conversation.nome}</strong><small>{conversation.ultima_mensagem}</small></span></button>)}{!chatConversations.length && <p className="chat-empty-list">Você ainda não tem conversas.</p>}</section><section className="chat-potential-list"><h2>Contatos em potencial</h2><p>Selecione alguém para iniciar uma conversa.</p><div className="chat-start-contacts">{directoryStudents.filter((person) => person.id !== student.id && !chatConversations.some((conversation) => conversation.aluno_id === person.id)).map((person) => <button className={`chat-contact ${chatPersonId === person.id ? 'selected' : ''}`} key={person.id} onClick={() => { setChatPersonId(person.id); setChatMessages([]); setChatError(''); }}><UserAvatar name={person.nome} src={person.avatar_url} className="avatar avatar-teal" /><span><strong>{person.nome}</strong><small>{person.curso ?? 'Aluno'}</small></span></button>)}{!directoryStudents.some((person) => person.id !== student.id && !chatConversations.some((conversation) => conversation.aluno_id === person.id)) && <p className="chat-empty-list">Não há novos contatos disponíveis.</p>}</div></section></aside><section className="chat-conversation">{chatPersonId ? <><header className="chat-heading"><strong>{directoryStudents.find((person) => person.id === chatPersonId)?.nome ?? chatConversations.find((conversation) => conversation.aluno_id === chatPersonId)?.nome ?? 'Conversa'}</strong><small>Mensagens atualizadas automaticamente</small></header><div className="chat-messages">{chatMessages.map((message) => <article className={`chat-bubble ${message.remetente_id === student.id ? 'mine' : ''}`} key={message.id}><p>{message.conteudo}</p><small>{new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(message.enviada_em))}</small></article>)}{!chatMessages.length && <div className="empty-state">Comece a conversa enviando uma mensagem.</div>}</div><form className="chat-compose" onSubmit={sendChatMessage}><input value={chatInput} onChange={(event) => setChatInput(event.target.value)} placeholder="Escreva uma mensagem..." maxLength={2000} aria-label="Mensagem"/><button className="primary-action" disabled={chatBusy || !chatInput.trim()}>{chatBusy ? 'Enviando…' : 'Enviar'}</button></form>{chatError && <p className="chat-error" role="alert">{chatError}</p>}</> : <div className="chat-placeholder"><Icon name="chat" size={28}/><strong>Nenhuma conversa iniciada</strong><p>Selecione uma pessoa na lateral. Nenhuma mensagem será enviada até você escrever.</p></div>}</section></div></section> : active === 'Pessoas' ? <PeopleDirectory students={directoryStudents} current={student} onOpen={openProfile} /> : active === 'Seguindo' ? <FollowingDirectory profiles={followingProfiles} posts={followingPosts} onOpenProfile={openProfile} onOpenPost={setDetailPost} /> : active === 'Favoritos' ? <FavoritesDirectory posts={favoritePosts} profiles={directoryStudents} onOpenPost={setDetailPost} onOpenProfile={openProfile} onRemove={toggleFavorite} /> : active === 'Perfil' ? (profileLoading ? <div className="loading-state">Carregando perfil…</div> : selectedProfile ? <StudentProfileView key={selectedProfile.id} person={selectedProfile} own={selectedProfile.id === student.id} currentStudentId={student.id} courses={courses} onBack={() => setActive('Início')} onSaved={applyProfileUpdate} onMessage={() => { setChatPersonId(selectedProfile.id); setChatMessages([]); setChatError(''); setActive('Bate-papo'); }} onFollowChanged={() => setReloadToken((value) => value + 1)} /> : <div className="no-results">Não foi possível carregar o perfil. A API precisa estar ativa.</div>) : active === 'Encontros' ? <section className="directory-view"><div className="resource-heading"><div><div className="eyebrow">ENCONTROS DA COMUNIDADE</div><h1>Encontros e reuniões</h1><p>Organize conversas ligadas a projetos, grupos ou interesses em comum.</p></div><button className="primary-action" onClick={() => setShowMeetingForm(true)}><Icon name="plus"/> Organizar encontro</button></div><MeetingDirectory meetings={meetings} student={student} onDelete={deleteMeeting} onOpenProfile={openProfile} onChanged={() => setReloadToken((value) => value + 1)} /></section> : active === 'Minhas participações' ? <section className="directory-view"><div className="eyebrow">SEUS PROJETOS, EVENTOS E GRUPOS</div><h1>Minhas participações</h1><p>Acompanhe solicitações, confirmações e atividades das quais você faz parte.</p><div className="participation-feed">{participations.map((entry) => <article className="participation-card" key={entry.id}><div><span className="type-pill static-pill">{entry.tipo}</span><h2>{entry.titulo}</h2><small>Status: {entry.status}</small></div><button className="secondary-button" onClick={() => requestParticipation({ id: entry.publicacao_id, type: entry.tipo === 'Evento' ? 'Evento' : entry.tipo === 'Projeto' ? 'Projeto' : 'Grupo de estudo', title: entry.titulo, description: '', tags: [], people: '', tone: 'petroleum', initials: '' })}>{entry.status === 'cancelada' || entry.status === 'recusada' ? 'Solicitar novamente' : 'Cancelar participação'}</button></article>)}{!participations.length && <div className="empty-state">Você ainda não participa de nenhum projeto, evento ou grupo.</div>}</div></section> : <>
        {active === 'Início' ? <section className="welcome-block"><div><div className="eyebrow">UM ESPAÇO PARA CONSTRUIR EM CONJUNTO</div><h1>Olá, {student.nome.split(' ')[0]} <span className="wave">✳</span></h1><p className="welcome-subtitle">Boas ideias começam quando a gente se conecta.</p></div><button className="primary-action" onClick={() => setShowPublication(true)}><Icon name="plus" size={18} /> Compartilhar uma ideia</button></section> : <section className="resource-heading"><div><div className="eyebrow">{pageCopy[active]?.eyebrow ?? 'COMUNIDADE ACADÊMICA'}</div><h1>{pageCopy[active]?.title ?? active}</h1><p>{pageCopy[active]?.description ?? 'Explore publicações e encontre conexões na comunidade.'}</p></div><div className="resource-actions"><span className="resource-count">{matchingItems.length} {matchingItems.length === 1 ? 'publicação' : 'publicações'}</span>{['Projetos','Eventos','Grupos de estudo','Minhas publicações'].includes(active) && <button className="primary-action" onClick={() => setShowPublication(true)}><Icon name="plus"/> {active === 'Minhas publicações' ? 'Nova publicação' : 'Novo'}</button>}</div></section>}

        <section className="discovery-bar" aria-label="Encontrar na comunidade"><div className="search-wrap"><Icon name="search" size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Busque projetos, eventos, grupos ou pessoas" aria-label="Buscar na comunidade" /></div><button className="filter-button" onClick={() => setFiltersOpen((open) => !open)} aria-expanded={filtersOpen}>Filtros <span>{filtersOpen ? '⌃' : '⌄'}</span></button></section>
        {filtersOpen && <section className="filter-panel"><label>Curso do autor<input value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)} placeholder="Ex.: Psicologia" /></label><label>Interesse<input value={interestFilter} onChange={(event) => setInterestFilter(event.target.value)} placeholder="Ex.: tecnologia"/></label><label>Habilidade<input value={skillFilter} onChange={(event) => setSkillFilter(event.target.value)} placeholder="Ex.: Python"/></label><label>Data do evento<input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)}/></label><button className="secondary-button" onClick={() => { setCourseFilter(''); setInterestFilter(''); setSkillFilter(''); setDateFilter(''); }}>Limpar filtros</button></section>}



        <section className={`recommendations ${active === 'Início' ? 'recommendations-home' : ''}`}><div className="section-heading"><div><div className="eyebrow">{active === 'Início' ? (apiStatus === 'online' ? 'PRIORIZADO PELO SEU PERFIL' : 'CONECTANDO À API') : pageCopy[active]?.eyebrow ?? 'PUBLICAÇÕES'}</div><h2>{active === 'Início' ? 'Para você' : pageCopy[active]?.title ?? 'Publicações'}</h2><p>{active === 'Início' ? 'Primeiro, publicações relacionadas ao seu curso, interesses e habilidades.' : pageCopy[active]?.description ?? 'Explore as publicações da comunidade.'}</p></div>{active === 'Início' && <button className="link-action" onClick={() => setActive('Projetos')}>Ver projetos <Icon name="arrow" size={16} /></button>}</div>
          <div className="suggestion-grid">{matchingItems.map((item) => <article className="suggestion-card" key={item.id ?? item.title} id={item.id ? `post-${item.id}` : undefined}><div className={`card-art art-${item.tone}`}><span className="art-orbit orbit-one"/><span className="art-orbit orbit-two"/><span className="art-initials">{item.initials}</span><span className="type-pill">{item.type}</span></div><div className="suggestion-body">{item.type !== 'Postagem livre' && <h3>{item.title}</h3>}<div className="post-description-scroll"><p>{item.description}</p></div><div className="post-byline"><span>Por {item.authorId ? <button type="button" className="profile-inline-link" onClick={() => { void openProfile(item.authorId as string); }}>{directoryStudents.find((person) => person.id === item.authorId)?.nome ?? 'Aluno da comunidade'}</button> : 'Sugestão'}</span>{item.relevance ? <i className="match-badge">Em comum com seu perfil</i> : null}</div>{item.details && <div className="post-detail-line">{item.details}</div>}<div className="tag-row">{item.tags.map((tag) => <span className="interest-tag" key={tag}>{tag}</span>)}</div><div className="card-foot"><span className="member-count"><Icon name="people" size={15} />{item.people}</span><button className="card-arrow" aria-label={`Ver detalhes de ${item.title}`} onClick={() => setDetailPost(item)}><Icon name="arrow" size={17} /></button></div>{item.id && <div className="post-actions">{item.authorId === student.id ? <><button onClick={() => setEditingPost(item)}>Editar</button><button onClick={() => deletePublication(item)}>Excluir</button>{['Projeto','Evento','Grupo de estudo'].includes(item.type) && <button onClick={() => setManagedPost(item)}>Participantes</button>}</> : ['Projeto','Evento','Grupo de estudo'].includes(item.type) ? (() => { const participation = participations.find((entry) => entry.publicacao_id === item.id); const active = participation && ['pendente','aceita'].includes(participation.status); return <button disabled={participation?.status === 'recusada'} onClick={() => requestParticipation(item)}>{participation?.status === 'aceita' ? 'Confirmado · cancelar' : participation?.status === 'pendente' ? 'Solicitação enviada · cancelar' : participation?.status === 'recusada' ? 'Solicitação recusada' : item.type === 'Evento' ? 'Confirmar presença' : 'Solicitar participação'}</button>; })() : null}<button onClick={() => toggleFavorite(item)}>{favoriteIds.includes(item.id ?? '') ? 'Remover favorito' : 'Salvar favorito'}</button><button onClick={() => setDetailPost(item)}>Comentar</button><button onClick={() => sharePublication(item)}>Compartilhar</button></div>}</div></article>)}</div>
          {!matchingItems.length && <div className="no-results">{query ? `Não encontrei publicações para “${query}”.` : `Ainda não há publicações nesta aba.`}</div>}
        </section>

        {active === 'Início' && <footer className="page-footer">Feito para aproximar pessoas e ideias <span>✦</span></footer>}
        </>}
      </div>
    </main>
    {showPublication && <PublicationDialog studentId={student.id} courses={courses} defaultType={active === 'Projetos' ? 'Projeto' : active === 'Eventos' ? 'Evento' : active === 'Grupos de estudo' ? 'Grupo de estudo' : 'Ideia'} onClose={() => setShowPublication(false)} onSaved={() => { setShowPublication(false); setEditingPost(null); setReloadToken((value) => value + 1); }} />}
    {editingPost?.id && <PublicationDialog studentId={student.id} courses={courses} item={editingPost as CommunityItem & PostRecord} defaultType={editingPost.type as PostKind} onClose={() => setEditingPost(null)} onSaved={() => { setEditingPost(null); setReloadToken((value) => value + 1); }} />}
    {detailPost && <PublicationDetailsDialog item={detailPost} authorName={directoryStudents.find((person) => person.id === detailPost.authorId)?.nome ?? 'Aluno da comunidade'} authorId={detailPost.authorId} studentId={student.id} onClose={() => setDetailPost(null)} onCommented={() => setReloadToken((value) => value + 1)} onOpenProfile={(id) => { setDetailPost(null); void openProfile(id); }} />}
    {managedPost?.id && <ParticipantManager postId={managedPost.id} managerId={student.id} students={directoryStudents} allowInvites={managedPost.type !== 'Evento'} onClose={() => setManagedPost(null)} onChanged={() => setReloadToken((value) => value + 1)} onOpenProfile={(id) => { setManagedPost(null); void openProfile(id); }} />}
    {showMeetingForm && <MeetingDialog studentId={student.id} projects={items.filter((item) => ['Projeto','Grupo de estudo'].includes(item.type) && item.id).map((item) => ({id:item.id!,title:item.title}))} onClose={() => setShowMeetingForm(false)} onSaved={() => { setShowMeetingForm(false); setReloadToken((value) => value + 1); }} />}
  </div>;
}
