"""Endpoints da comunidade acadêmica com persistência SQLite."""
from datetime import datetime
import hashlib
import secrets
import sqlite3
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

import SQLite as banco
from classes import (
    Aluno,
    Evento,
    GrupoEstudo,
    Ideia,
    Projeto,
    Publicacao,
    PublicacaoLivre,
    StatusParticipacao,
    Usuario,
)

app = FastAPI(title="Comunidade Acadêmica API", version="0.3.0")

CURSOS_ESTACIO = [
    "Acompanhamento do Transtorno do Espectro Autista (TEA)",
    "Administração", "Administração Pública", "Agronegócio", "Agronomia",
    "Análise e Desenvolvimento de Sistemas", "Antropologia", "Arquitetura e Urbanismo",
    "Artes Visuais", "Ciência da Computação", "Ciência de Dados", "Ciências Biológicas",
    "Direito", "Enfermagem", "Engenharia Civil", "Engenharia de Produção",
    "Gestão de Recursos Humanos", "Psicologia", "Publicidade e Propaganda",
]


class LoginEntrada(BaseModel):
    identificador: str = Field(min_length=5, max_length=254, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", description="E-mail usado no cadastro")
    senha: str = Field(min_length=1)


class CadastroEntrada(BaseModel):
    nome: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=254, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    curso: str = Field(min_length=2, max_length=120)
    instituicao: str = Field(min_length=2, max_length=160)
    senha: str = Field(min_length=6, max_length=100)
    interesses: list[str] = Field(default_factory=list, max_length=20)
    habilidades: list[str] = Field(default_factory=list, max_length=20)
    areas_interesse: list[str] = Field(default_factory=list, max_length=20)


class AlunoEntrada(BaseModel):
    nome: str = Field(min_length=1)
    email: str = Field(min_length=3)
    instituicao: str = ""
    curso: str | None = None
    interesses: list[str] = Field(default_factory=list)
    habilidades: list[str] = Field(default_factory=list)


class AlunoPerfilAlteracao(BaseModel):
    curso: str | None = Field(default=None, min_length=2)
    instituicao: str | None = Field(default=None, min_length=2, max_length=160)
    interesses: list[str] | None = Field(default=None, max_length=20)
    habilidades: list[str] | None = Field(default=None, max_length=20)
    areas_interesse: list[str] | None = Field(default=None, max_length=20)
    descricao: str | None = Field(default=None, max_length=600)
    avatar_url: str | None = Field(default=None, max_length=2_800_000)


class SeguirEntrada(BaseModel):
    seguidor_id: str = Field(min_length=1)


class EncontroEntrada(BaseModel):
    titulo: str = Field(min_length=2, max_length=120)
    descricao: str = Field(min_length=2, max_length=1000)
    inicio: datetime
    modalidade: str = Field(min_length=2, max_length=30)
    local: str | None = Field(default=None, max_length=180)
    organizador_id: str
    publicacao_id: str | None = None
    limite_participantes: int | None = Field(default=None, ge=1, le=1000)


class PublicacaoAlteracao(BaseModel):
    titulo: str | None = Field(default=None, min_length=1)
    descricao: str | None = Field(default=None, min_length=1)
    vagas: int | None = Field(default=None, ge=1)
    habilidades_desejadas: list[str] | None = None
    objetivos: list[str] | None = None
    inicio: datetime | None = None
    local: str | None = None
    modalidade: str | None = None
    limite_participantes: int | None = Field(default=None, ge=1)
    assunto: str | None = None
    disciplina: str | None = None


class ParticipacaoEntrada(BaseModel):
    aluno_id: str


class StatusEntrada(BaseModel):
    status: StatusParticipacao


class MensagemEntrada(BaseModel):
    remetente_id: str
    destinatario_id: str
    conteudo: str = Field(min_length=1, max_length=2000)


class ComentarioEntrada(BaseModel):
    aluno_id: str
    conteudo: str = Field(min_length=1, max_length=2000)


class ConviteEntrada(BaseModel):
    convidante_id: str
    convidado_id: str


class ConviteResposta(BaseModel):
    aluno_id: str
    status: str = Field(pattern=r"^(aceito|recusado)$")


class PresencaEncontroEntrada(BaseModel):
    aluno_id: str


class FavoritoEntrada(BaseModel):
    aluno_id: str


def _aluno_dict(aluno: Aluno) -> dict[str, Any]:
    return {
        "id": aluno.id,
        "nome": aluno.nome,
        "email": aluno.email,
        "instituicao": aluno.instituicao,
        "curso": aluno.curso,
        "interesses": aluno.interesses,
        "habilidades": aluno.habilidades,
        "descricao": aluno.descricao,
        "areas_interesse": aluno.areas_interesse,
        "avatar_url": aluno.avatar_url,
    }


def _publicacao_dict(item: Publicacao) -> dict[str, Any]:
    dados: dict[str, Any] = {
        "id": item.id,
        "tipo": item.tipo,
        "titulo": item.titulo,
        "descricao": item.descricao,
        "autor_id": item.autor.id if item.autor else None,
        "criada_em": item.criada_em.isoformat(),
    }
    if isinstance(item, Ideia):
        dados.update(objetivos=item.objetivos, habilidades_desejadas=item.habilidades_desejadas)
    elif isinstance(item, Projeto):
        dados.update(vagas=item.vagas, habilidades_desejadas=item.habilidades_desejadas)
    elif isinstance(item, Evento):
        dados.update(inicio=item.inicio.isoformat() if item.inicio else None,
                     local=item.local, modalidade=item.modalidade,
                     limite_participantes=item.limite_participantes)
    elif isinstance(item, GrupoEstudo):
        dados.update(assunto=item.assunto, disciplina=item.disciplina,
                     limite_participantes=item.limite_participantes)
    return dados


def _publicacao_para_banco(item: Publicacao) -> dict[str, Any]:
    serializada = _publicacao_dict(item)
    campos_comuns = {"id", "tipo", "titulo", "descricao", "autor_id", "criada_em"}
    return {
        "id": item.id,
        "tipo": item.tipo,
        "titulo": item.titulo,
        "descricao": item.descricao,
        "autor_id": serializada["autor_id"],
        "criada_em": serializada["criada_em"],
        "detalhes": {k: v for k, v in serializada.items() if k not in campos_comuns},
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "banco": "sqlite"}


@app.post("/login")
def login(entrada: LoginEntrada) -> dict[str, Any]:
    dados_usuario = banco.obter_usuario_por_identificador(entrada.identificador.strip().casefold())
    if dados_usuario is None:
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos.")
    usuario = Usuario(**dados_usuario)
    if not usuario.validar_senha(entrada.senha):
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos.")
    aluno = banco.obter_aluno(usuario.aluno_id)
    if aluno is None:
        raise HTTPException(status_code=404, detail="Perfil do aluno não encontrado.")
    return {"aluno": aluno}


@app.get("/cursos")
def listar_cursos() -> list[str]:
    return CURSOS_ESTACIO


@app.post("/cadastro", status_code=201)
def cadastrar_aluno(entrada: CadastroEntrada) -> dict[str, Any]:
    matricula = f"CAD{secrets.token_hex(12)}"
    email = entrada.email.strip().casefold()
    aluno = Aluno(
        nome=entrada.nome.strip(), email=email, instituicao=entrada.instituicao.strip(), curso=entrada.curso,
        interesses=[item.strip() for item in entrada.interesses if item.strip()],
        habilidades=[item.strip() for item in entrada.habilidades if item.strip()],
        areas_interesse=[item.strip() for item in entrada.areas_interesse if item.strip()],
    )
    senha_hash = hashlib.sha256(entrada.senha.encode("utf-8")).hexdigest()
    try:
        banco.criar_conta(_aluno_dict(aluno), matricula, senha_hash)
    except sqlite3.IntegrityError as exc:
        raise HTTPException(status_code=409, detail="Este e-mail já está cadastrado.") from exc
    dados = _aluno_dict(aluno)
    return {"aluno": dados}


@app.post("/alunos", status_code=201)
def criar_aluno(entrada: AlunoEntrada) -> dict[str, Any]:
    aluno = Aluno(**entrada.dict())
    try:
        banco.criar_aluno(_aluno_dict(aluno))
    except sqlite3.IntegrityError as exc:
        raise HTTPException(status_code=409, detail="Já existe aluno com este e-mail.") from exc
    return _aluno_dict(aluno)


@app.get("/alunos")
def listar_alunos() -> list[dict[str, Any]]:
    return banco.listar_alunos()


@app.get("/alunos/{aluno_id}")
def obter_aluno(aluno_id: str) -> dict[str, Any]:
    aluno = banco.obter_aluno(aluno_id)
    if aluno is None:
        raise HTTPException(status_code=404, detail="Aluno não encontrado.")
    return aluno


@app.put("/alunos/{aluno_id}")
def atualizar_perfil_aluno(aluno_id: str, entrada: AlunoPerfilAlteracao) -> dict[str, Any]:
    dados = entrada.dict(exclude_unset=True)
    if not dados:
        raise HTTPException(status_code=400, detail="Informe ao menos um campo para atualizar.")
    if dados.get("descricao") is not None:
        dados["descricao"] = dados["descricao"].strip()
    if dados.get("instituicao") is not None:
        dados["instituicao"] = dados["instituicao"].strip()
    if dados.get("avatar_url") is not None:
        avatar = dados["avatar_url"]
        if avatar and not avatar.startswith(("data:image/png;base64,", "data:image/jpeg;base64,", "data:image/webp;base64,")):
            raise HTTPException(status_code=422, detail="A foto deve estar em PNG, JPEG ou WebP.")
    for campo in ("interesses", "habilidades", "areas_interesse"):
        if campo in dados:
            dados[campo] = [item.strip() for item in dados[campo] if item.strip()]
    if not banco.atualizar_aluno(aluno_id, dados):
        raise HTTPException(status_code=404, detail="Aluno não encontrado.")
    return banco.obter_aluno(aluno_id)


@app.get("/alunos/{aluno_id}/seguir")
def estado_seguimento(aluno_id: str, seguidor_id: str | None = None) -> dict[str, Any]:
    if banco.obter_aluno(aluno_id) is None:
        raise HTTPException(status_code=404, detail="Aluno não encontrado.")
    if seguidor_id and banco.obter_aluno(seguidor_id) is None:
        raise HTTPException(status_code=404, detail="Aluno que consulta não encontrado.")
    return {
        "seguindo": bool(seguidor_id and seguidor_id != aluno_id and banco.obter_seguimento(seguidor_id, aluno_id)),
        "seguidores": banco.contar_seguidores(aluno_id),
    }


@app.get("/alunos/{aluno_id}/seguindo")
def listar_alunos_seguidos(aluno_id: str) -> list[dict[str, Any]]:
    if banco.obter_aluno(aluno_id) is None:
        raise HTTPException(status_code=404, detail="Aluno não encontrado.")
    return banco.listar_seguidos(aluno_id)


@app.post("/alunos/{aluno_id}/seguir")
def seguir_aluno(aluno_id: str, entrada: SeguirEntrada) -> dict[str, Any]:
    if banco.obter_aluno(aluno_id) is None or banco.obter_aluno(entrada.seguidor_id) is None:
        raise HTTPException(status_code=404, detail="Aluno não encontrado.")
    if aluno_id == entrada.seguidor_id:
        raise HTTPException(status_code=400, detail="Não é possível seguir o próprio perfil.")
    banco.seguir_aluno(entrada.seguidor_id, aluno_id, datetime.now().isoformat(timespec="seconds"))
    return {"seguindo": True, "seguidores": banco.contar_seguidores(aluno_id)}


@app.delete("/alunos/{aluno_id}/seguir")
def deixar_de_seguir_aluno(aluno_id: str, seguidor_id: str) -> dict[str, Any]:
    if banco.obter_aluno(aluno_id) is None or banco.obter_aluno(seguidor_id) is None:
        raise HTTPException(status_code=404, detail="Aluno não encontrado.")
    banco.deixar_de_seguir(seguidor_id, aluno_id)
    return {"seguindo": False, "seguidores": banco.contar_seguidores(aluno_id)}


@app.post("/publicacoes", status_code=201)
def criar_publicacao(dados: dict[str, Any]) -> dict[str, Any]:
    tipos = {
        "livre": PublicacaoLivre,
        "ideia": Ideia,
        "projeto": Projeto,
        "evento": Evento,
        "grupo_estudo": GrupoEstudo,
    }
    tipo = str(dados.get("tipo", "livre")).casefold()
    classe = tipos.get(tipo)
    if classe is None:
        raise HTTPException(status_code=422, detail="Tipo deve ser livre, ideia, projeto, evento ou grupo_estudo.")
    if not dados.get("titulo") or not dados.get("descricao"):
        raise HTTPException(status_code=422, detail="Título e descrição são obrigatórios.")
    autor_id = dados.get("autor_id")
    autor = banco.obter_aluno(autor_id) if autor_id else None
    if autor_id and autor is None:
        raise HTTPException(status_code=404, detail="Autor não encontrado.")
    if autor:
        autor = Aluno(**autor)
    campos: dict[str, Any] = {"titulo": dados["titulo"].strip(), "descricao": dados["descricao"].strip(), "autor": autor}
    if tipo == "grupo_estudo" and not (dados.get("disciplina") or dados.get("assunto")):
        raise HTTPException(status_code=422, detail="Informe a disciplina ou o assunto do grupo.")
    if tipo == "evento" and not dados.get("inicio"):
        raise HTTPException(status_code=422, detail="Informe a data e o horário do evento.")
    if tipo == "projeto" and dados.get("vagas") is not None and int(dados["vagas"]) < 1:
        raise HTTPException(status_code=422, detail="As vagas devem ser maiores que zero.")
    permitidos = {
        "livre": set(),
        "ideia": {"objetivos", "habilidades_desejadas"},
        "projeto": {"vagas", "habilidades_desejadas"},
        "evento": {"inicio", "local", "modalidade", "limite_participantes"},
        "grupo_estudo": {"assunto", "disciplina", "limite_participantes"},
    }
    campos.update({k: v for k, v in dados.items() if k in permitidos[tipo]})
    if tipo == "evento" and isinstance(campos.get("inicio"), str):
        try:
            campos["inicio"] = datetime.fromisoformat(campos["inicio"])
        except ValueError as exc:
            raise HTTPException(status_code=422, detail="Data inválida; use ISO 8601.") from exc
    try:
        item = classe(**campos)
    except TypeError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    try:
        banco.criar_publicacao(_publicacao_para_banco(item))
    except sqlite3.IntegrityError as exc:
        raise HTTPException(status_code=409, detail="Não foi possível salvar a publicação.") from exc
    if autor_id:
        banco.notificar_nova_publicacao(autor_id, item.id, item.criada_em.isoformat(timespec="seconds"))
    return banco.obter_publicacao(item.id)


@app.get("/publicacoes")
def listar_publicacoes(tipo: str | None = None) -> list[dict[str, Any]]:
    # Aceita os nomes de classe (Projeto) e os nomes curtos (projeto).
    aliases = {"livre": "PublicacaoLivre", "ideia": "Ideia", "projeto": "Projeto",
               "evento": "Evento", "grupo_estudo": "GrupoEstudo"}
    return banco.listar_publicacoes(aliases.get(tipo.casefold(), tipo) if tipo else None)


@app.get("/publicacoes/{publicacao_id}")
def obter_publicacao(publicacao_id: str) -> dict[str, Any]:
    item = banco.obter_publicacao(publicacao_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Publicação não encontrada.")
    return item


@app.get("/alunos/{aluno_id}/participacoes")
def participacoes_do_aluno(aluno_id: str) -> list[dict[str, Any]]:
    if banco.obter_aluno(aluno_id) is None:
        raise HTTPException(status_code=404, detail="Aluno não encontrado.")
    return banco.listar_participacoes_aluno(aluno_id)


@app.get("/publicacoes/{publicacao_id}/participacoes")
def participacoes_da_publicacao(publicacao_id: str) -> list[dict[str, Any]]:
    if banco.obter_publicacao(publicacao_id) is None:
        raise HTTPException(status_code=404, detail="Publicação não encontrada.")
    return banco.listar_participacoes_publicacao(publicacao_id)


@app.get("/publicacoes/{publicacao_id}/comentarios")
def comentarios_da_publicacao(publicacao_id: str) -> list[dict[str, Any]]:
    if banco.obter_publicacao(publicacao_id) is None:
        raise HTTPException(status_code=404, detail="Publicação não encontrada.")
    return banco.listar_comentarios(publicacao_id)


@app.post("/publicacoes/{publicacao_id}/comentarios", status_code=201)
def comentar_publicacao(publicacao_id: str, entrada: ComentarioEntrada) -> dict[str, Any]:
    if banco.obter_publicacao(publicacao_id) is None:
        raise HTTPException(status_code=404, detail="Publicação não encontrada.")
    autor = banco.obter_aluno(entrada.aluno_id)
    if autor is None:
        raise HTTPException(status_code=404, detail="Aluno não encontrado.")
    conteudo = entrada.conteudo.strip()
    if not conteudo:
        raise HTTPException(status_code=422, detail="O comentário não pode ficar vazio.")
    comentario = {
        "id": secrets.token_urlsafe(12), "publicacao_id": publicacao_id,
        "autor_id": entrada.aluno_id, "autor_nome": autor["nome"],
        "conteudo": conteudo, "criada_em": datetime.now().isoformat(timespec="seconds"),
    }
    banco.criar_comentario(comentario)
    return comentario


@app.get("/notificacoes")
def listar_notificacoes(aluno_id: str) -> list[dict[str, Any]]:
    if banco.obter_aluno(aluno_id) is None:
        raise HTTPException(status_code=404, detail="Aluno não encontrado.")
    return banco.listar_notificacoes(aluno_id)


@app.post("/publicacoes/{publicacao_id}/convites", status_code=201)
def convidar_aluno(publicacao_id: str, entrada: ConviteEntrada) -> dict[str, Any]:
    publicacao = banco.obter_publicacao(publicacao_id)
    if publicacao is None:
        raise HTTPException(status_code=404, detail="Publicação não encontrada.")
    if publicacao["tipo"] not in {"Projeto", "GrupoEstudo"}:
        raise HTTPException(status_code=409, detail="Convites estão disponíveis para projetos e grupos de estudo.")
    if publicacao.get("autor_id") != entrada.convidante_id:
        raise HTTPException(status_code=403, detail="Somente o criador pode convidar participantes.")
    if banco.obter_aluno(entrada.convidado_id) is None:
        raise HTTPException(status_code=404, detail="Aluno convidado não encontrado.")
    if entrada.convidado_id == entrada.convidante_id:
        raise HTTPException(status_code=400, detail="Não é possível convidar a si mesmo.")
    if banco.obter_participacao_aluno_publicacao(entrada.convidado_id, publicacao_id):
        raise HTTPException(status_code=409, detail="Este aluno já participa ou tem solicitação nesta publicação.")
    convite = {"id": secrets.token_urlsafe(12), "publicacao_id": publicacao_id,
               "convidante_id": entrada.convidante_id, "convidado_id": entrada.convidado_id,
               "criado_em": datetime.now().isoformat(timespec="seconds")}
    try:
        banco.criar_convite(convite)
    except sqlite3.IntegrityError as exc:
        raise HTTPException(status_code=409, detail="Já existe um convite para este aluno.") from exc
    return {**convite, "status": "pendente", "publicacao_titulo": publicacao["titulo"]}


@app.get("/alunos/{aluno_id}/convites")
def listar_convites(aluno_id: str) -> list[dict[str, Any]]:
    if banco.obter_aluno(aluno_id) is None:
        raise HTTPException(status_code=404, detail="Aluno não encontrado.")
    return banco.listar_convites_aluno(aluno_id)


@app.patch("/convites/{convite_id}")
def responder_convite(convite_id: str, entrada: ConviteResposta) -> dict[str, Any]:
    if banco.obter_aluno(entrada.aluno_id) is None:
        raise HTTPException(status_code=404, detail="Aluno não encontrado.")
    convite = next((item for item in banco.listar_convites_aluno(entrada.aluno_id) if item["id"] == convite_id), None)
    if convite is None:
        raise HTTPException(status_code=404, detail="Convite pendente não encontrado.")
    if entrada.status == "aceito":
        publicacao = banco.obter_publicacao(convite["publicacao_id"])
        existente = banco.obter_participacao_aluno_publicacao(entrada.aluno_id, publicacao["id"])
        limite_bruto = publicacao.get("vagas") if publicacao["tipo"] == "Projeto" else publicacao.get("limite_participantes")
        limite = int(limite_bruto) if limite_bruto is not None else None
        if limite is not None and (not existente or existente["status"] in {"recusada", "cancelada"}) and banco.contar_participacoes(publicacao["id"]) >= limite:
            raise HTTPException(status_code=409, detail="A publicação atingiu o limite de participantes.")
        if existente:
            banco.atualizar_status_participacao(existente["id"], "aceita")
        else:
            banco.criar_participacao({"id": secrets.token_urlsafe(12), "aluno_id": entrada.aluno_id,
                                      "publicacao_id": publicacao["id"], "status": "aceita",
                                      "solicitada_em": datetime.now().isoformat(timespec="seconds")}, limite)
    atualizado = banco.atualizar_convite(convite_id, entrada.aluno_id, entrada.status)
    if atualizado is None:
        raise HTTPException(status_code=409, detail="Este convite já foi respondido.")
    return atualizado


@app.get("/alunos/{aluno_id}/favoritos")
def listar_favoritos(aluno_id: str) -> list[dict[str, Any]]:
    if banco.obter_aluno(aluno_id) is None:
        raise HTTPException(status_code=404, detail="Aluno não encontrado.")
    return [banco.obter_publicacao(item["id"]) for item in banco.listar_favoritos(aluno_id)]


@app.post("/publicacoes/{publicacao_id}/favoritos", status_code=201)
def favoritar_publicacao(publicacao_id: str, entrada: FavoritoEntrada) -> dict[str, bool]:
    if banco.obter_publicacao(publicacao_id) is None:
        raise HTTPException(status_code=404, detail="Publicação não encontrada.")
    if banco.obter_aluno(entrada.aluno_id) is None:
        raise HTTPException(status_code=404, detail="Aluno não encontrado.")
    banco.favoritar_publicacao(entrada.aluno_id, publicacao_id, datetime.now().isoformat(timespec="seconds"))
    return {"favoritado": True}


@app.delete("/publicacoes/{publicacao_id}/favoritos")
def desfavoritar_publicacao(publicacao_id: str, aluno_id: str) -> dict[str, bool]:
    if banco.obter_aluno(aluno_id) is None:
        raise HTTPException(status_code=404, detail="Aluno não encontrado.")
    banco.desfavoritar_publicacao(aluno_id, publicacao_id)
    return {"favoritado": False}


@app.post("/publicacoes/{publicacao_id}/participacoes", status_code=201)
def solicitar_participacao(publicacao_id: str, entrada: ParticipacaoEntrada) -> dict[str, Any]:
    item = banco.obter_publicacao(publicacao_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Publicação não encontrada.")
    if banco.obter_aluno(entrada.aluno_id) is None:
        raise HTTPException(status_code=404, detail="Aluno não encontrado.")
    if item["tipo"] not in {"Projeto", "Evento", "GrupoEstudo"}:
        raise HTTPException(status_code=409, detail="Esta publicação não aceita participantes.")

    limite_bruto = item.get("vagas") if item["tipo"] == "Projeto" else item.get("limite_participantes")
    try:
        limite = int(limite_bruto) if limite_bruto is not None else None
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=422, detail="O limite de participantes é inválido.") from exc
    if limite is not None and limite < 1:
        raise HTTPException(status_code=422, detail="O limite de participantes deve ser maior que zero.")

    dados_participacao = {
        "id": secrets.token_urlsafe(12),
        "aluno_id": entrada.aluno_id,
        "publicacao_id": publicacao_id,
        "status": StatusParticipacao.ACEITA.value if item["tipo"] == "Evento" else StatusParticipacao.PENDENTE.value,
        "solicitada_em": datetime.now().isoformat(timespec="seconds"),
    }
    try:
        return banco.criar_participacao(dados_participacao, limite)
    except banco.LimiteParticipacaoAtingido as exc:
        raise HTTPException(status_code=409, detail="A publicação atingiu o limite de participantes.") from exc
    except sqlite3.IntegrityError as exc:
        if "aluno_id" in str(exc):
            raise HTTPException(status_code=404, detail="Aluno não encontrado.") from exc
        if "publicacao_id" in str(exc):
            raise HTTPException(status_code=404, detail="Esta publicação não existe mais. Atualize a página.") from exc
        raise HTTPException(status_code=409, detail="Não foi possível registrar a participação.") from exc
    except sqlite3.OperationalError as exc:
        raise HTTPException(status_code=503, detail="O banco de dados está ocupado. Tente novamente em instantes.") from exc

@app.patch("/participacoes/{participacao_id}")
def atualizar_participacao(participacao_id: str, entrada: StatusEntrada, gestor_id: str) -> dict[str, Any]:
    participacao = banco.obter_participacao(participacao_id)
    if participacao is None:
        raise HTTPException(status_code=404, detail="Participação não encontrada.")
    publicacao = banco.obter_publicacao(participacao["publicacao_id"])
    if publicacao is None or publicacao.get("autor_id") != gestor_id:
        raise HTTPException(status_code=403, detail="Somente o criador pode gerenciar participantes.")
    if entrada.status == StatusParticipacao.ACEITA:
        limite = publicacao.get("vagas") if publicacao["tipo"] == "Projeto" else publicacao.get("limite_participantes")
        if limite is not None and participacao["status"] not in {"pendente", "aceita"} and banco.contar_participacoes(publicacao["id"]) >= limite:
            raise HTTPException(status_code=409, detail="Não há mais vagas disponíveis.")
    if not banco.atualizar_status_participacao(participacao_id, entrada.status.value):
        raise HTTPException(status_code=404, detail="Participação não encontrada.")
    return banco.obter_participacao(participacao_id)


@app.delete("/participacoes/{participacao_id}", status_code=204)
def remover_participacao(participacao_id: str, aluno_id: str | None = None, gestor_id: str | None = None) -> None:
    participacao = banco.obter_participacao(participacao_id)
    if participacao is None:
        raise HTTPException(status_code=404, detail="Participação não encontrada.")
    publicacao = banco.obter_publicacao(participacao["publicacao_id"])
    if aluno_id != participacao["aluno_id"] and (gestor_id is None or publicacao is None or publicacao.get("autor_id") != gestor_id):
        raise HTTPException(status_code=403, detail="Somente o participante ou o criador pode remover esta participação.")
    banco.remover_participacao(participacao_id)


@app.put("/publicacoes/{publicacao_id}")
def atualizar_publicacao(publicacao_id: str, entrada: PublicacaoAlteracao, aluno_id: str) -> dict[str, Any]:
    atual = banco.obter_publicacao(publicacao_id)
    if atual is None:
        raise HTTPException(status_code=404, detail="Publicação não encontrada.")
    if atual.get("autor_id") != aluno_id:
        raise HTTPException(status_code=403, detail="Somente o autor pode editar esta publicação.")
    dados = entrada.dict(exclude_unset=True)
    if not dados:
        raise HTTPException(status_code=400, detail="Informe ao menos um campo para atualizar.")
    detalhes = {k: v for k, v in dados.items() if k not in {"titulo", "descricao"}}
    dados_banco: dict[str, Any] = {}
    if "titulo" in dados:
        dados_banco["titulo"] = dados["titulo"]
    if "descricao" in dados:
        dados_banco["descricao"] = dados["descricao"]
    if detalhes:
        novos_detalhes = {k: v for k, v in atual.items() if k not in {"id", "tipo", "titulo", "descricao", "autor_id", "criada_em"}}
        novos_detalhes.update({k: v.isoformat() if isinstance(v, datetime) else v for k, v in detalhes.items()})
        dados_banco["detalhes"] = novos_detalhes
    if not banco.atualizar_publicacao(publicacao_id, dados_banco):
        raise HTTPException(status_code=404, detail="Publicação não encontrada.")
    return banco.obter_publicacao(publicacao_id)


@app.delete("/publicacoes/{publicacao_id}", status_code=204)
def excluir_publicacao(publicacao_id: str, aluno_id: str) -> None:
    atual = banco.obter_publicacao(publicacao_id)
    if atual is None:
        raise HTTPException(status_code=404, detail="Publicação não encontrada.")
    if atual.get("autor_id") != aluno_id:
        raise HTTPException(status_code=403, detail="Somente o autor pode excluir esta publicação.")
    banco.excluir_publicacao(publicacao_id)


@app.get("/encontros")
def listar_encontros() -> list[dict[str, Any]]:
    return banco.listar_encontros()


@app.post("/encontros", status_code=201)
def criar_encontro(entrada: EncontroEntrada) -> dict[str, Any]:
    if banco.obter_aluno(entrada.organizador_id) is None:
        raise HTTPException(status_code=404, detail="Organizador não encontrado.")
    if entrada.publicacao_id and banco.obter_publicacao(entrada.publicacao_id) is None:
        raise HTTPException(status_code=404, detail="Projeto ou grupo relacionado não encontrado.")
    encontro = {
        "id": str(__import__("uuid").uuid4()), "organizador_id": entrada.organizador_id,
        "publicacao_id": entrada.publicacao_id, "titulo": entrada.titulo.strip(),
        "descricao": entrada.descricao.strip(), "inicio": entrada.inicio.isoformat(),
        "local": entrada.local, "modalidade": entrada.modalidade,
        "limite_participantes": entrada.limite_participantes, "criado_em": datetime.now().isoformat(),
    }
    banco.criar_encontro(encontro)
    return next(item for item in banco.listar_encontros() if item["id"] == encontro["id"])


@app.get("/encontros/{encontro_id}/participantes")
def participantes_encontro(encontro_id: str) -> list[dict[str, Any]]:
    if not any(item["id"] == encontro_id for item in banco.listar_encontros()):
        raise HTTPException(status_code=404, detail="Encontro não encontrado.")
    return banco.listar_participantes_encontro(encontro_id)


@app.post("/encontros/{encontro_id}/participacoes", status_code=201)
def confirmar_presenca_encontro(encontro_id: str, entrada: PresencaEncontroEntrada) -> dict[str, Any]:
    encontro = next((item for item in banco.listar_encontros() if item["id"] == encontro_id), None)
    if encontro is None:
        raise HTTPException(status_code=404, detail="Encontro não encontrado.")
    if banco.obter_aluno(entrada.aluno_id) is None:
        raise HTTPException(status_code=404, detail="Aluno não encontrado.")
    if not banco.adicionar_presenca_encontro(encontro_id, entrada.aluno_id, datetime.now().isoformat(timespec="seconds"), encontro.get("limite_participantes")):
        raise HTTPException(status_code=409, detail="O encontro atingiu o limite de participantes.")
    return {"confirmada": True, "participantes": len(banco.listar_participantes_encontro(encontro_id))}


@app.delete("/encontros/{encontro_id}/participacoes")
def cancelar_presenca_encontro(encontro_id: str, aluno_id: str) -> dict[str, Any]:
    if not any(item["id"] == encontro_id for item in banco.listar_encontros()):
        raise HTTPException(status_code=404, detail="Encontro não encontrado.")
    banco.cancelar_presenca_encontro(encontro_id, aluno_id)
    return {"confirmada": False, "participantes": len(banco.listar_participantes_encontro(encontro_id))}


@app.delete("/encontros/{encontro_id}", status_code=204)
def excluir_encontro(encontro_id: str, organizador_id: str) -> None:
    if not banco.excluir_encontro(encontro_id, organizador_id):
        raise HTTPException(status_code=404, detail="Encontro não encontrado para este organizador.")


@app.get("/busca")
def buscar(q: str = "", tipo: str | None = None, curso: str | None = None, interesse: str | None = None, habilidade: str | None = None, data: str | None = None) -> dict[str, list[dict[str, Any]]]:
    termo = q.strip().casefold()
    alunos = banco.listar_alunos()
    publicacoes = banco.listar_publicacoes()
    def contem(texto: str, valor: str | None) -> bool:
        return not valor or valor.casefold() in texto.casefold()
    alunos_filtrados = [a for a in alunos if contem(" ".join([a["nome"], a.get("curso") or "", *a["interesses"], *a["habilidades"], *a.get("areas_interesse", [])]), termo) and contem(a.get("curso") or "", curso) and contem(" ".join(a["interesses"] + a.get("areas_interesse", [])), interesse) and contem(" ".join(a["habilidades"]), habilidade)]
    pubs_filtradas = []
    for item in publicacoes:
        tipo_item = item["tipo"].casefold()
        aliases_tipo = {"projetos": "projeto", "eventos": "evento", "grupos de estudo": "grupoestudo", "grupo_estudo": "grupoestudo"}
        matches_tipo = not tipo or tipo.casefold() in tipo_item or tipo_item == aliases_tipo.get(tipo.casefold())
        autor = banco.obter_aluno(item.get("autor_id")) if item.get("autor_id") else None
        texto = " ".join([item.get("titulo", ""), item.get("descricao", ""), *[str(v) for v in item.values() if isinstance(v, str)]])
        data_item = item.get("inicio", "")
        if matches_tipo and contem(texto, termo) and contem((autor or {}).get("curso") or "", curso) and contem(texto, interesse) and contem(texto, habilidade) and (not data or data in data_item):
            pubs_filtradas.append(item)
    return {"alunos": alunos_filtrados, "publicacoes": pubs_filtradas}


@app.get("/conversas")
def listar_conversas(aluno_id: str) -> list[dict[str, Any]]:
    if banco.obter_aluno(aluno_id) is None:
        raise HTTPException(status_code=404, detail="Aluno não encontrado.")
    return banco.listar_conversas(aluno_id)


@app.get("/mensagens/{outro_id}")
def listar_mensagens(outro_id: str, aluno_id: str) -> list[dict[str, Any]]:
    if banco.obter_aluno(aluno_id) is None or banco.obter_aluno(outro_id) is None:
        raise HTTPException(status_code=404, detail="Aluno não encontrado.")
    return banco.listar_mensagens(aluno_id, outro_id)


@app.post("/mensagens", status_code=201)
def enviar_mensagem(entrada: MensagemEntrada) -> dict[str, Any]:
    if entrada.remetente_id == entrada.destinatario_id:
        raise HTTPException(status_code=400, detail="Não é possível enviar mensagem para si mesmo.")
    if banco.obter_aluno(entrada.remetente_id) is None or banco.obter_aluno(entrada.destinatario_id) is None:
        raise HTTPException(status_code=404, detail="Aluno não encontrado.")
    conteudo = entrada.conteudo.strip()
    if not conteudo:
        raise HTTPException(status_code=422, detail="A mensagem não pode ficar vazia.")
    mensagem = {"id": secrets.token_urlsafe(12), "remetente_id": entrada.remetente_id,
                "destinatario_id": entrada.destinatario_id, "conteudo": conteudo,
                "enviada_em": datetime.now().isoformat(timespec="seconds")}
    banco.criar_mensagem(mensagem)
    return mensagem
