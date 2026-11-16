import React from 'react';

export type PostKind = 'Projeto' | 'Evento' | 'Grupo de estudo' | 'Ideia' | 'Postagem livre';
export type PostRecord = {
  id: string;
  type: PostKind;
  title: string;
  description: string;
  raw?: Record<string, unknown>;
};

type Course = string;

function splitList(value: string) {
  return value.split(/[,;\n]/).map((part) => part.trim()).filter(Boolean);
}

function apiType(type: PostKind) {
  return type === 'Grupo de estudo' ? 'grupo_estudo' : type === 'Postagem livre' ? 'livre' : type.toLocaleLowerCase('pt-BR');
}

export function PublicationDialog({
  studentId, courses, item, defaultType, onClose, onSaved,
}: {
  studentId: string; courses: Course[]; item?: PostRecord; defaultType: PostKind; onClose: () => void; onSaved: () => void;
}) {
  const raw = item?.raw ?? {};
  const [type, setType] = React.useState<PostKind>(item?.type ?? defaultType);
  const [title, setTitle] = React.useState(item?.title ?? '');
  const [description, setDescription] = React.useState(item?.description ?? '');
  const [vagas, setVagas] = React.useState(String(raw.vagas ?? ''));
  const [skills, setSkills] = React.useState(Array.isArray(raw.habilidades_desejadas) ? raw.habilidades_desejadas.join(', ') : '');
  const [objectives, setObjectives] = React.useState(Array.isArray(raw.objetivos) ? raw.objetivos.join(', ') : '');
  const [discipline, setDiscipline] = React.useState(String(raw.disciplina ?? ''));
  const [subject, setSubject] = React.useState(String(raw.assunto ?? ''));
  const [startsAt, setStartsAt] = React.useState(typeof raw.inicio === 'string' ? raw.inicio.slice(0, 16) : '');
  const [location, setLocation] = React.useState(String(raw.local ?? ''));
  const [modality, setModality] = React.useState(String(raw.modalidade ?? 'presencial'));
  const [limit, setLimit] = React.useState(String(raw.limite_participantes ?? ''));
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const textoLivre = description.trim();
    const payload: Record<string, unknown> = { titulo: type === 'Postagem livre' ? 'Postagem livre' : title.trim(), descricao: textoLivre };
    if (!item) {
      payload.tipo = apiType(type);
      payload.autor_id = studentId;
    }
    if (type === 'Projeto') {
      payload.vagas = vagas ? Number(vagas) : null;
      payload.habilidades_desejadas = splitList(skills);
    } else if (type === 'Ideia') {
      payload.objetivos = splitList(objectives);
      payload.habilidades_desejadas = splitList(skills);
    } else if (type === 'Evento') {
      payload.inicio = new Date(startsAt).toISOString();
      payload.local = location.trim();
      payload.modalidade = modality;
      payload.limite_participantes = limit ? Number(limit) : null;
    } else if (type === 'Grupo de estudo') {
      payload.disciplina = discipline.trim();
      payload.assunto = subject.trim();
      payload.limite_participantes = limit ? Number(limit) : null;
    }
    try {
      const url = item
        ? `/publicacoes/${encodeURIComponent(item.id)}?aluno_id=${encodeURIComponent(studentId)}`
        : '/publicacoes';
      const response = await fetch(url, {
        method: item ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = response.status === 204 ? null : await response.json();
      if (!response.ok) throw new Error(data?.detail ?? 'Não foi possível salvar a publicação.');
      onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Falha ao conectar à API.');
    } finally {
      setBusy(false);
    }
  }

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="feature-dialog" role="dialog" aria-modal="true" aria-labelledby="publication-dialog-title">
      <div className="feature-dialog-heading"><div><div className="eyebrow">PUBLICAÇÃO DA COMUNIDADE</div><h2 id="publication-dialog-title">{item ? 'Editar publicação' : 'Criar publicação'}</h2></div><button className="close-button" onClick={onClose} aria-label="Fechar">×</button></div>
      <form className="feature-form" onSubmit={submit}>
        {!item && <label>Tipo<select value={type} onChange={(event) => setType(event.target.value as PostKind)}><option>Projeto</option><option>Ideia</option><option>Evento</option><option>Grupo de estudo</option></select></label>}
        {type !== 'Postagem livre' && <label>Título<input required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Dê um nome à publicação" /></label>}
        <label>{type === 'Postagem livre' ? 'O que você quer compartilhar?' : 'Descrição'}<textarea required maxLength={1000} value={description} onChange={(event) => setDescription(event.target.value)} placeholder={type === 'Postagem livre' ? 'Escreva uma mensagem para a comunidade…' : 'Explique a ideia e o que as pessoas precisam saber'} /></label>
        {type === 'Projeto' && <><label>Vagas necessárias<input type="number" min="1" max="100" value={vagas} onChange={(event) => setVagas(event.target.value)} placeholder="Opcional" /></label><label>Habilidades desejadas<input value={skills} onChange={(event) => setSkills(event.target.value)} placeholder="Ex.: Python, design, pesquisa" /></label></>}
        {type === 'Ideia' && <><label>Objetivos<input value={objectives} onChange={(event) => setObjectives(event.target.value)} placeholder="Separe os objetivos por vírgula" /></label><label>Habilidades desejadas<input value={skills} onChange={(event) => setSkills(event.target.value)} placeholder="Ex.: pesquisa, prototipação" /></label></>}
        {type === 'Evento' && <><label>Data e horário<input required type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} /></label><div className="feature-form-row"><label>Modalidade<select value={modality} onChange={(event) => setModality(event.target.value)}><option value="presencial">Presencial</option><option value="online">Online</option><option value="hibrido">Híbrido</option></select></label><label>Limite de participantes<input type="number" min="1" max="1000" value={limit} onChange={(event) => setLimit(event.target.value)} placeholder="Sem limite" /></label></div><label>Local ou link<input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Campus, sala ou link" /></label></>}
        {type === 'Grupo de estudo' && <><div className="feature-form-row"><label>Disciplina<input value={discipline} onChange={(event) => setDiscipline(event.target.value)} placeholder="Ex.: Lógica de programação" /></label><label>Assunto<input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Ex.: lógica de programação" /></label></div><label>Limite de participantes<input type="number" min="1" max="1000" value={limit} onChange={(event) => setLimit(event.target.value)} placeholder="Sem limite" /></label></>}
        {error && <p className="login-error" role="alert">{error}</p>}
        <div className="feature-dialog-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancelar</button><button className="primary-action" disabled={busy}>{busy ? 'Salvando…' : item ? 'Salvar alterações' : 'Publicar'}</button></div>
      </form>
    </section>
  </div>;
}

export function MeetingDialog({ studentId, projects, onClose, onSaved }: {
  studentId: string; projects: Array<{ id: string; title: string }>; onClose: () => void; onSaved: () => void;
}) {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [startsAt, setStartsAt] = React.useState('');
  const [modality, setModality] = React.useState('presencial');
  const [location, setLocation] = React.useState('');
  const [postId, setPostId] = React.useState('');
  const [limit, setLimit] = React.useState('');
  const [error, setError] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await fetch('/encontros', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ titulo: title.trim(), descricao: description.trim(), inicio: new Date(startsAt).toISOString(), modalidade: modality, local: location.trim() || null, organizador_id: studentId, publicacao_id: postId || null, limite_participantes: limit ? Number(limit) : null }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail ?? 'Não foi possível criar o encontro.');
      onSaved();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Falha ao conectar à API.'); }
    finally { setBusy(false); }
  }
  return <div className="modal-backdrop"><section className="feature-dialog" role="dialog" aria-modal="true"><div className="feature-dialog-heading"><div><div className="eyebrow">ENCONTRO DA COMUNIDADE</div><h2>Organizar encontro</h2></div><button className="close-button" onClick={onClose}>×</button></div><form className="feature-form" onSubmit={submit}><label>Nome<input required value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120}/></label><label>Descrição<textarea required value={description} onChange={(event) => setDescription(event.target.value)} maxLength={1000}/></label><label>Data e horário<input required type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)}/></label><div className="feature-form-row"><label>Modalidade<select value={modality} onChange={(event) => setModality(event.target.value)}><option value="presencial">Presencial</option><option value="online">Online</option><option value="hibrido">Híbrido</option></select></label><label>Local ou link<input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Opcional"/></label></div><label>Limite de participantes<input type="number" min="1" max="1000" value={limit} onChange={(event) => setLimit(event.target.value)} placeholder="Sem limite" /></label><label>Relacionado a<select value={postId} onChange={(event) => setPostId(event.target.value)}><option value="">Interesse em comum</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label>{error && <p className="login-error">{error}</p>}<div className="feature-dialog-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancelar</button><button className="primary-action" disabled={busy}>{busy ? 'Salvando…' : 'Criar encontro'}</button></div></form></section></div>;
}

type Participant = { id: string; aluno_id: string; status: string; nome: string; curso?: string | null };

export function ParticipantManager({ postId, managerId, students, allowInvites = true, onClose, onChanged, onOpenProfile }: { postId: string; managerId: string; students: Array<{id:string;nome:string;curso?:string|null}>; allowInvites?: boolean; onClose: () => void; onChanged: () => void; onOpenProfile: (studentId: string) => void }) {
  const [participants, setParticipants] = React.useState<Participant[]>([]);
  const [error, setError] = React.useState('');
  const [busyId, setBusyId] = React.useState('');
  const [inviteeId, setInviteeId] = React.useState('');
  const [inviteError, setInviteError] = React.useState('');
  const [inviteBusy, setInviteBusy] = React.useState(false);
  const [invitedIds, setInvitedIds] = React.useState<string[]>([]);
  async function load() {
    const response = await fetch(`/publicacoes/${encodeURIComponent(postId)}/participacoes`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail ?? 'Não foi possível carregar as solicitações.');
    setParticipants(data);
  }
  React.useEffect(() => { load().catch((reason) => setError(reason.message)); }, [postId]);
  async function update(id: string, status?: 'aceita' | 'recusada') {
    setBusyId(id); setError('');
    try {
      const url = `/participacoes/${encodeURIComponent(id)}?gestor_id=${encodeURIComponent(managerId)}`;
      const response = status
        ? await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
        : await fetch(url, { method: 'DELETE' });
      const data = response.status === 204 ? null : await response.json();
      if (!response.ok) throw new Error(data?.detail ?? 'Não foi possível atualizar a participação.');
      await load(); onChanged();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Falha ao conectar à API.'); }
    finally { setBusyId(''); }
  }
  async function sendInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!inviteeId) return;
    setInviteBusy(true); setInviteError('');
    try {
      const response = await fetch(`/publicacoes/${encodeURIComponent(postId)}/convites`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ convidante_id: managerId, convidado_id: inviteeId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail ?? 'Não foi possível enviar o convite.');
      setInvitedIds((current) => [...current, inviteeId]); setInviteeId(''); onChanged();
    } catch (reason) { setInviteError(reason instanceof Error ? reason.message : 'Falha ao conectar à API.'); }
    finally { setInviteBusy(false); }
  }
  const inviteOptions = students.filter((person) => person.id !== managerId && !participants.some((participant) => participant.aluno_id === person.id) && !invitedIds.includes(person.id));
  return <div className="modal-backdrop"><section className="feature-dialog" role="dialog" aria-modal="true"><div className="feature-dialog-heading"><div><div className="eyebrow">GERENCIAR PARTICIPAÇÕES</div><h2>Solicitações e participantes</h2></div><button className="close-button" onClick={onClose}>×</button></div>{error && <p className="login-error">{error}</p>}{allowInvites && <form className="invite-form" onSubmit={sendInvite}><label>Convidar aluno para colaborar<select value={inviteeId} onChange={(event) => setInviteeId(event.target.value)}><option value="">Selecione um aluno</option>{inviteOptions.map((person) => <option key={person.id} value={person.id}>{person.nome}{person.curso ? ` · ${person.curso}` : ''}</option>)}</select></label><button className="primary-action" disabled={!inviteeId || inviteBusy || !inviteOptions.length}>{inviteBusy ? 'Enviando…' : 'Enviar convite'}</button></form>}{inviteError && <p className="login-error" role="alert">{inviteError}</p>}<div className="participant-list">{participants.map((person) => <div className="participant-row" key={person.id}><div><button type="button" className="profile-inline-link" onClick={() => onOpenProfile(person.aluno_id)}>{person.nome}</button><small>{person.curso ?? 'Curso não informado'} · {person.status}</small></div><div className="participant-actions">{person.status === 'pendente' && <><button onClick={() => update(person.id, 'aceita')} disabled={busyId === person.id}>Aceitar</button><button onClick={() => update(person.id, 'recusada')} disabled={busyId === person.id}>Recusar</button></>}<button className="remove-participant" onClick={() => update(person.id)} disabled={busyId === person.id}>Remover</button></div></div>)}{!participants.length && <div className="empty-state">Ainda não há solicitações de participação.</div>}</div><div className="feature-dialog-actions"><button className="secondary-button" onClick={onClose}>Fechar</button></div></section></div>;
}

