from __future__ import annotations

from dataclasses import dataclass, field
import hashlib
from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import uuid4


def _novo_id() -> str:
    """Gera identificadores simples, independentes do banco de dados."""
    return str(uuid4())


@dataclass
class Usuario:
    """Credenciais de acesso, separadas dos dados públicos do perfil do aluno."""

    matricula: str
    email: str
    senha_hash: str = field(repr=False)
    aluno_id: str

    def validar_senha(self, senha: str) -> bool:
        return hashlib.sha256(senha.encode("utf-8")).hexdigest() == self.senha_hash


class StatusParticipacao(str, Enum):
    PENDENTE = "pendente"
    ACEITA = "aceita"
    RECUSADA = "recusada"
    CANCELADA = "cancelada"


@dataclass
class Aluno:
    """Pessoa cadastrada na comunidade acadêmica."""

    nome: str
    email: str
    instituicao: str = ""
    curso: Optional[str] = None
    interesses: list[str] = field(default_factory=list)
    habilidades: list[str] = field(default_factory=list)
    descricao: str = ""
    areas_interesse: list[str] = field(default_factory=list)
    avatar_url: str = ""
    id: str = field(default_factory=_novo_id)
    publicacoes: list[Publicacao] = field(default_factory=list, repr=False)

    def publicar(self, publicacao: Publicacao) -> None:
        """Define este aluno como autor e registra a publicação uma vez."""
        if publicacao.autor is not None and publicacao.autor is not self:
            raise ValueError("A publicação já pertence a outro autor.")
        publicacao.autor = self
        if publicacao not in self.publicacoes:
            self.publicacoes.append(publicacao)


@dataclass
class Publicacao:
    """Dados compartilhados por todas as publicações da comunidade."""

    titulo: str
    descricao: str
    autor: Optional[Aluno] = None
    id: str = field(default_factory=_novo_id)
    criada_em: datetime = field(default_factory=datetime.now)

    @property
    def tipo(self) -> str:
        return type(self).__name__


@dataclass
class PublicacaoLivre(Publicacao):
    """Postagem livre, sem campos acadêmicos obrigatórios específicos."""

    pass


@dataclass
class Ideia(Publicacao):
    """Proposta inicial que pode buscar colaboradores ou evoluir para projeto."""

    objetivos: list[str] = field(default_factory=list)
    habilidades_desejadas: list[str] = field(default_factory=list)


@dataclass
class Projeto(Publicacao):
    """Iniciativa colaborativa com vagas e participantes."""

    vagas: Optional[int] = None
    habilidades_desejadas: list[str] = field(default_factory=list)
    participantes: list[Participacao] = field(default_factory=list, repr=False)


@dataclass
class Evento(Publicacao):
    """Atividade com data e local ou modalidade definidos."""

    inicio: Optional[datetime] = None
    local: Optional[str] = None
    modalidade: Optional[str] = None
    limite_participantes: Optional[int] = None
    participantes: list[Participacao] = field(default_factory=list, repr=False)


@dataclass
class GrupoEstudo(Publicacao):
    """Grupo organizado em torno de uma disciplina ou assunto."""

    assunto: Optional[str] = None
    disciplina: Optional[str] = None
    limite_participantes: Optional[int] = None
    participantes: list[Participacao] = field(default_factory=list, repr=False)


@dataclass
class Participacao:
    """Relaciona um aluno a uma publicação colaborativa ou evento."""

    aluno: Aluno
    publicacao: Publicacao
    status: StatusParticipacao = StatusParticipacao.PENDENTE
    solicitada_em: datetime = field(default_factory=datetime.now)
    id: str = field(default_factory=_novo_id)

    def __post_init__(self) -> None:
        if not isinstance(self.publicacao, (Projeto, Evento, GrupoEstudo)):
            raise TypeError(
                "Participação só é válida em Projeto, Evento ou GrupoEstudo."
            )
        colecao = self.publicacao.participantes
        if any(p.aluno.id == self.aluno.id for p in colecao):
            raise ValueError("Este aluno já possui participação nesta publicação.")
        colecao.append(self)


ParticipacaoProjeto = Participacao
