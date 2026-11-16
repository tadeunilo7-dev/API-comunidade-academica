"""Persistência SQLite da comunidade acadêmica."""
import hashlib
import json
import os
import secrets
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

DB_PATH = Path(os.getenv("CONECTA_DB_PATH", str(Path(__file__).with_name("comunidade.db"))))


def conectar() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def inicializar_banco() -> None:
    """Cria as tabelas e índices caso ainda não existam."""
    with conectar() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS alunos (
                id TEXT PRIMARY KEY,
                nome TEXT NOT NULL,
                email TEXT NOT NULL COLLATE NOCASE UNIQUE,
                curso TEXT,
                interesses TEXT NOT NULL DEFAULT '[]',
                habilidades TEXT NOT NULL DEFAULT '[]',
                descricao TEXT NOT NULL DEFAULT '',
                areas_interesse TEXT NOT NULL DEFAULT '[]',
                avatar_url TEXT NOT NULL DEFAULT ''
            );
            CREATE TABLE IF NOT EXISTS usuarios_institucionais (
                matricula TEXT PRIMARY KEY,
                email TEXT NOT NULL COLLATE NOCASE UNIQUE,
                senha_hash TEXT NOT NULL,
                aluno_id TEXT NOT NULL UNIQUE REFERENCES alunos(id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS publicacoes (
                id TEXT PRIMARY KEY,
                tipo TEXT NOT NULL CHECK (tipo IN ('PublicacaoLivre','Ideia','Projeto','Evento','GrupoEstudo')),
                titulo TEXT NOT NULL,
                descricao TEXT NOT NULL,
                autor_id TEXT REFERENCES alunos(id) ON DELETE SET NULL,
                criada_em TEXT NOT NULL,
                detalhes TEXT NOT NULL DEFAULT '{}'
            );
            CREATE INDEX IF NOT EXISTS idx_publicacoes_tipo ON publicacoes(tipo);
            CREATE INDEX IF NOT EXISTS idx_publicacoes_autor ON publicacoes(autor_id);
            CREATE TABLE IF NOT EXISTS participacoes (
                id TEXT PRIMARY KEY,
                aluno_id TEXT NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
                publicacao_id TEXT NOT NULL REFERENCES publicacoes(id) ON DELETE CASCADE,
                status TEXT NOT NULL CHECK (status IN ('pendente','aceita','recusada','cancelada')),
                solicitada_em TEXT NOT NULL,
                UNIQUE (aluno_id, publicacao_id)
            );
            CREATE INDEX IF NOT EXISTS idx_participacoes_publicacao ON participacoes(publicacao_id);
            CREATE TABLE IF NOT EXISTS encontros (
                id TEXT PRIMARY KEY,
                organizador_id TEXT NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
                publicacao_id TEXT REFERENCES publicacoes(id) ON DELETE CASCADE,
                titulo TEXT NOT NULL,
                descricao TEXT NOT NULL,
                inicio TEXT NOT NULL,
                local TEXT,
                modalidade TEXT NOT NULL,
                criado_em TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS mensagens (
                id TEXT PRIMARY KEY,
                remetente_id TEXT NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
                destinatario_id TEXT NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
                conteudo TEXT NOT NULL,
                enviada_em TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_mensagens_partes ON mensagens(remetente_id, destinatario_id, enviada_em);
            CREATE TABLE IF NOT EXISTS seguimentos (
                seguidor_id TEXT NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
                seguido_id TEXT NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
                criado_em TEXT NOT NULL,
                PRIMARY KEY (seguidor_id, seguido_id),
                CHECK (seguidor_id <> seguido_id)
            );
            CREATE INDEX IF NOT EXISTS idx_seguimentos_seguido ON seguimentos(seguido_id);
            CREATE TABLE IF NOT EXISTS favoritos (
                aluno_id TEXT NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
                publicacao_id TEXT NOT NULL REFERENCES publicacoes(id) ON DELETE CASCADE,
                criada_em TEXT NOT NULL,
                PRIMARY KEY (aluno_id, publicacao_id)
            );
            CREATE TABLE IF NOT EXISTS convites (
                id TEXT PRIMARY KEY,
                publicacao_id TEXT NOT NULL REFERENCES publicacoes(id) ON DELETE CASCADE,
                convidante_id TEXT NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
                convidado_id TEXT NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
                status TEXT NOT NULL CHECK (status IN ('pendente','aceito','recusado')),
                criado_em TEXT NOT NULL,
                UNIQUE (publicacao_id, convidado_id),
                CHECK (convidante_id <> convidado_id)
            );
            CREATE TABLE IF NOT EXISTS participacoes_encontros (
                encontro_id TEXT NOT NULL REFERENCES encontros(id) ON DELETE CASCADE,
                aluno_id TEXT NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
                confirmada_em TEXT NOT NULL,
                PRIMARY KEY (encontro_id, aluno_id)
            );
            CREATE TABLE IF NOT EXISTS notificacoes_sociais (
                id TEXT PRIMARY KEY,
                aluno_id TEXT NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
                autor_id TEXT NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
                tipo TEXT NOT NULL CHECK (tipo IN ('novo_seguidor','nova_publicacao')),
                publicacao_id TEXT REFERENCES publicacoes(id) ON DELETE CASCADE,
                criada_em TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS comentarios (
                id TEXT PRIMARY KEY,
                publicacao_id TEXT NOT NULL REFERENCES publicacoes(id) ON DELETE CASCADE,
                autor_id TEXT NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
                conteudo TEXT NOT NULL,
                criada_em TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_comentarios_publicacao ON comentarios(publicacao_id, criada_em);
        """)
        colunas_alunos = {row[1] for row in conn.execute("PRAGMA table_info(alunos)")}
        if "instituicao" not in colunas_alunos:
            conn.execute("ALTER TABLE alunos ADD COLUMN instituicao TEXT NOT NULL DEFAULT ''")
        if "descricao" not in colunas_alunos:
            conn.execute("ALTER TABLE alunos ADD COLUMN descricao TEXT NOT NULL DEFAULT ''")
        if "areas_interesse" not in colunas_alunos:
            conn.execute("ALTER TABLE alunos ADD COLUMN areas_interesse TEXT NOT NULL DEFAULT '[]'")
        if "avatar_url" not in colunas_alunos:
            conn.execute("ALTER TABLE alunos ADD COLUMN avatar_url TEXT NOT NULL DEFAULT ''")
        colunas_encontros = {row[1] for row in conn.execute("PRAGMA table_info(encontros)")}
        if "limite_participantes" not in colunas_encontros:
            conn.execute("ALTER TABLE encontros ADD COLUMN limite_participantes INTEGER")
        senha_demo_hash = hashlib.sha256("aluno123".encode("utf-8")).hexdigest()
        alunos_demo = [
            ("demo-aluno-001", "Larissa Martins", "larissa@exemplo.com", "Administração", ["design", "tecnologia", "educação"], ["Figma", "pesquisa", "prototipação"], ["projetos educacionais", "inovação"], "Gosto de transformar ideias em soluções simples e úteis para a comunidade acadêmica.", "202400000001"),
            ("demo-aluno-002", "Caio Souza", "caio@exemplo.com", "Análise e Desenvolvimento de Sistemas", ["desenvolvimento de jogos", "inteligência artificial"], ["Python", "Unity", "C#"], ["jogos educativos", "tecnologia"], "Curto criar jogos e ferramentas digitais, principalmente quando posso aprender em equipe.", "202400000002"),
            ("demo-aluno-003", "Bruna Oliveira", "bruna@exemplo.com", "Psicologia", ["educação", "saúde mental"], ["pesquisa", "comunicação"], ["bem-estar estudantil", "saúde"], "Tenho interesse em iniciativas de acolhimento, aprendizagem e saúde mental.", "202400000003"),
            ("demo-aluno-004", "Pedro Almeida", "pedro@exemplo.com", "Direito", ["acessibilidade", "direitos humanos", "tecnologia"], ["pesquisa", "redação", "organização"], ["direito digital", "inclusão"], "Quero colaborar com projetos que tornem informação e serviços mais acessíveis.", "202400000004"),
            ("demo-aluno-005", "Marina Costa", "marina@exemplo.com", "Ciência de Dados", ["inteligência artificial", "educação", "visualização de dados"], ["Python", "SQL", "estatística"], ["dados educacionais", "tecnologia"], "Gosto de usar dados para entender problemas e comunicar descobertas com clareza.", "202400000005"),
            ("demo-aluno-006", "Rafael Lima", "rafael@exemplo.com", "Enfermagem", ["saúde mental", "saúde comunitária", "educação"], ["comunicação", "primeiros socorros", "trabalho em equipe"], ["promoção da saúde", "bem-estar"], "Tenho interesse em ações de saúde e acolhimento que aproximem os alunos.", "202400000006"),
            ("demo-aluno-007", "Sofia Santos", "sofia@exemplo.com", "Publicidade e Propaganda", ["design", "comunicação", "cultura"], ["Canva", "redação", "redes sociais"], ["comunicação de projetos", "design"], "Ajudo a dar forma e visibilidade a boas ideias por meio de conteúdo e design.", "202400000007"),
            ("demo-aluno-008", "Thiago Nunes", "thiago@exemplo.com", "Administração Pública", ["sustentabilidade", "cidadania", "educação"], ["planejamento", "pesquisa", "facilitação"], ["impacto social", "sustentabilidade"], "Quero participar de iniciativas colaborativas com impacto positivo no campus.", "202400000008"),
        ]
        for aluno_id, nome, email, curso, interesses, habilidades, areas, descricao, matricula in alunos_demo:
            conn.execute(
                "INSERT OR IGNORE INTO alunos (id,nome,email,curso,interesses,habilidades,descricao,areas_interesse) VALUES (?,?,?,?,?,?,?,?)",
                (aluno_id, nome, email, curso, json.dumps(interesses, ensure_ascii=False), json.dumps(habilidades, ensure_ascii=False), descricao, json.dumps(areas, ensure_ascii=False)),
            )
            conn.execute("UPDATE alunos SET email=?, curso=? WHERE id=?", (email, curso, aluno_id))
            conn.execute("UPDATE alunos SET instituicao='Estácio' WHERE id=? AND instituicao=''", (aluno_id,))
            conn.execute(
                "UPDATE alunos SET descricao=CASE WHEN descricao='' THEN ? ELSE descricao END, areas_interesse=CASE WHEN areas_interesse='[]' THEN ? ELSE areas_interesse END WHERE id=?",
                (descricao, json.dumps(areas, ensure_ascii=False), aluno_id),
            )
            conn.execute(
                "UPDATE usuarios_institucionais SET matricula=?, email=?, senha_hash=? WHERE aluno_id=?",
                (matricula, email, senha_demo_hash, aluno_id),
            )
            conn.execute(
                "INSERT OR IGNORE INTO usuarios_institucionais (matricula,email,senha_hash,aluno_id) VALUES (?,?,?,?)",
                (matricula, email, senha_demo_hash, aluno_id),
            )

        agora = datetime.now()
        publicacoes_demo = [
            {
                "id": "demo-post-projeto-001", "tipo": "Projeto", "titulo": "Aplicativo de apoio aos estudos",
                "descricao": "Queremos criar uma ferramenta simples para organizar grupos de estudo e compartilhar materiais entre alunos.",
                "autor_id": "demo-aluno-002", "criada_em": agora.isoformat(timespec="minutes"),
                "detalhes": {"vagas": 4, "habilidades_desejadas": ["Python", "React", "design de interface"]},
            },
            {
                "id": "demo-post-ideia-001", "tipo": "Ideia", "titulo": "Mapa colaborativo de acessibilidade",
                "descricao": "Uma ideia para reunir informações sobre acessibilidade nos espaços do campus e ajudar a comunidade a propor melhorias.",
                "autor_id": "demo-aluno-001", "criada_em": agora.isoformat(timespec="minutes"),
                "detalhes": {"objetivos": ["mapear espaços", "reunir sugestões"], "habilidades_desejadas": ["pesquisa", "prototipação"]},
            },
            {
                "id": "demo-post-evento-001", "tipo": "Evento", "titulo": "Encontro de tecnologia e criatividade",
                "descricao": "Uma tarde para trocar ideias, apresentar projetos de alunos e conhecer pessoas interessadas em tecnologia.",
                "autor_id": "demo-aluno-003", "criada_em": agora.isoformat(timespec="minutes"),
                "detalhes": {"inicio": (agora + timedelta(days=7)).replace(hour=14, minute=0, second=0, microsecond=0).isoformat(), "local": "Campus Estácio · sala multiuso", "modalidade": "presencial", "limite_participantes": 30},
            },
            {
                "id": "demo-post-grupo-001", "tipo": "GrupoEstudo", "titulo": "Grupo de estudo: fundamentos de Python",
                "descricao": "Encontros para praticar lógica, estruturas de dados e pequenos projetos. Todos os níveis são bem-vindos.",
                "autor_id": "demo-aluno-002", "criada_em": agora.isoformat(timespec="minutes"),
                "detalhes": {"assunto": "Programação para iniciantes", "disciplina": "Lógica de programação", "limite_participantes": 12},
            },
            {
                "id": "demo-post-projeto-002", "tipo": "Projeto", "titulo": "Jogo educativo de matemática",
                "descricao": "Vamos prototipar um jogo curto para praticar matemática de um jeito leve. Procuramos pessoas para programação, roteiro e testes com alunos.",
                "autor_id": "demo-aluno-002", "criada_em": agora.isoformat(timespec="minutes"),
                "detalhes": {"vagas": 5, "habilidades_desejadas": ["Unity", "roteiro", "testes com usuários"]},
            },
            {
                "id": "demo-post-evento-002", "tipo": "Evento", "titulo": "Roda de conversa: saúde mental na faculdade",
                "descricao": "Um encontro aberto para conversar sobre acolhimento, rotina de estudos e redes de apoio entre estudantes.",
                "autor_id": "demo-aluno-006", "criada_em": agora.isoformat(timespec="minutes"),
                "detalhes": {"inicio": (agora + timedelta(days=12)).replace(hour=18, minute=30, second=0, microsecond=0).isoformat(), "local": "Campus Estácio · auditório B", "modalidade": "presencial", "limite_participantes": 40},
            },
            {
                "id": "demo-post-grupo-002", "tipo": "GrupoEstudo", "titulo": "Portfólio e comunicação digital",
                "descricao": "Grupo para trocar feedback em portfólios, peças e apresentações de projetos acadêmicos.",
                "autor_id": "demo-aluno-007", "criada_em": agora.isoformat(timespec="minutes"),
                "detalhes": {"assunto": "Portfólio e comunicação", "disciplina": "Publicidade e Propaganda", "limite_participantes": 10},
            },
            {
                "id": "demo-post-ideia-002", "tipo": "Ideia", "titulo": "Painel de dados sobre a vida no campus",
                "descricao": "Ideia para reunir dados públicos e relatos dos alunos sobre espaços de estudo, mobilidade e atividades acadêmicas.",
                "autor_id": "demo-aluno-005", "criada_em": agora.isoformat(timespec="minutes"),
                "detalhes": {"objetivos": ["visualizar dados", "ouvir estudantes"], "habilidades_desejadas": ["SQL", "visualização de dados", "pesquisa"]},
            },
            {
                "id": "demo-post-livre-001", "tipo": "PublicacaoLivre", "titulo": "Carona solidária para o campus",
                "descricao": "Oi, pessoal! Estou tentando organizar uma rede simples para quem sai da região central no período da manhã. Quem tiver interesse pode comentar ou me chamar para combinarmos os horários.",
                "autor_id": "demo-aluno-008", "criada_em": agora.isoformat(timespec="minutes"), "detalhes": {},
            },
            {
                "id": "demo-post-livre-002", "tipo": "PublicacaoLivre", "titulo": "Dica: espaços tranquilos para estudar",
                "descricao": "Descobri que a biblioteca fica mais vazia no começo da tarde. Se alguém conhecer outros cantinhos bons para estudar entre as aulas, compartilha aqui!",
                "autor_id": "demo-aluno-001", "criada_em": agora.isoformat(timespec="minutes"), "detalhes": {},
            },
            {
                "id": "demo-post-livre-003", "tipo": "PublicacaoLivre", "titulo": "Procuro colegas para trocar revisão de texto",
                "descricao": "Estou finalizando um trabalho e posso ajudar alguém com revisão de texto em troca de uma segunda leitura. Pode ser de qualquer curso.",
                "autor_id": "demo-aluno-004", "criada_em": agora.isoformat(timespec="minutes"), "detalhes": {},
            },
        ]
        for publicacao in publicacoes_demo:
            conn.execute(
                "INSERT OR IGNORE INTO publicacoes (id,tipo,titulo,descricao,autor_id,criada_em,detalhes) VALUES (?,?,?,?,?,?,?)",
                (publicacao["id"], publicacao["tipo"], publicacao["titulo"], publicacao["descricao"], publicacao["autor_id"], publicacao["criada_em"], json.dumps(publicacao["detalhes"], ensure_ascii=False)),
            )

        participacoes_demo = [
            ("demo-part-projeto-001-larissa", "demo-aluno-001", "demo-post-projeto-001"),
            ("demo-part-projeto-001-marina", "demo-aluno-005", "demo-post-projeto-001"),
            ("demo-part-projeto-001-sofia", "demo-aluno-007", "demo-post-projeto-001"),
            ("demo-part-projeto-002-bruna", "demo-aluno-003", "demo-post-projeto-002"),
            ("demo-part-evento-001-marina", "demo-aluno-005", "demo-post-evento-001"),
            ("demo-part-evento-001-sofia", "demo-aluno-007", "demo-post-evento-001"),
            ("demo-part-evento-002-bruna", "demo-aluno-003", "demo-post-evento-002"),
            ("demo-part-evento-002-larissa", "demo-aluno-001", "demo-post-evento-002"),
            ("demo-pending-projeto-001-pedro", "demo-aluno-004", "demo-post-projeto-001"),
            ("demo-pending-projeto-002-marina", "demo-aluno-005", "demo-post-projeto-002"),
        ]
        for participacao_id, aluno_id, publicacao_id in participacoes_demo:
            conn.execute(
                "INSERT OR IGNORE INTO participacoes (id,aluno_id,publicacao_id,status,solicitada_em) VALUES (?,?,?,?,?)",
                (participacao_id, aluno_id, publicacao_id,
                 "pendente" if "pending" in participacao_id else "aceita", agora.isoformat(timespec="seconds")),
            )

        comentarios_demo = [
            ("demo-comment-projeto-001", "demo-post-projeto-001", "demo-aluno-005", "Tenho interesse em ajudar com a parte de dados e organização dos estudos!"),
            ("demo-comment-projeto-002", "demo-post-projeto-002", "demo-aluno-007", "Posso contribuir com ideias para a interface e a identidade visual do jogo."),
            ("demo-comment-ideia-001", "demo-post-ideia-001", "demo-aluno-004", "A proposta é muito importante. Posso ajudar a mapear os pontos de acessibilidade."),
        ]
        for comentario_id, publicacao_id, autor_id, conteudo in comentarios_demo:
            conn.execute(
                "INSERT OR IGNORE INTO comentarios (id,publicacao_id,autor_id,conteudo,criada_em) VALUES (?,?,?,?,?)",
                (comentario_id, publicacao_id, autor_id, conteudo, agora.isoformat(timespec="seconds")),
            )

        # Perfis adicionais da comunidade: não recebem credenciais de demonstração.
        alunos_comunidade = [
            ("comunidade-aluno-009", "Isabela Rocha", "isabela.rocha@comunidade.test", "Arquitetura e Urbanismo", ["acessibilidade", "urbanismo", "design"], ["AutoCAD", "pesquisa", "desenho"], ["espaços inclusivos"], "Gosto de pensar em espaços que acolham diferentes formas de aprender."),
            ("comunidade-aluno-010", "Lucas Ferreira", "lucas.ferreira@comunidade.test", "Ciência da Computação", ["desenvolvimento de jogos", "tecnologia", "educação"], ["Godot", "GDScript", "prototipação"], ["jogos educativos"], "Aprendo criando protótipos e compartilhando o processo."),
            ("comunidade-aluno-011", "Camila Mendes", "camila.mendes@comunidade.test", "Nutrição", ["saúde", "educação", "sustentabilidade"], ["educação alimentar", "pesquisa", "organização"], ["saúde comunitária"], "Tenho interesse em iniciativas práticas de saúde e alimentação."),
            ("comunidade-aluno-012", "André Carvalho", "andre.carvalho@comunidade.test", "Engenharia Civil", ["sustentabilidade", "acessibilidade", "tecnologia"], ["modelagem 3D", "planejamento", "AutoCAD"], ["cidades sustentáveis"], "Quero colaborar com soluções simples para melhorar os espaços que usamos."),
            ("comunidade-aluno-013", "Júlia Barros", "julia.barros@comunidade.test", "Pedagogia", ["educação", "leitura", "inclusão"], ["mediação", "escrita", "planejamento"], ["aprendizagem colaborativa"], "Acredito em aprender junto e trocar materiais sem complicação."),
            ("comunidade-aluno-014", "Mateus Ribeiro", "mateus.ribeiro@comunidade.test", "Engenharia de Produção", ["empreendedorismo", "sustentabilidade", "dados"], ["Excel", "processos", "facilitação"], ["inovação social"], "Curto organizar ideias e transformar conversas em próximos passos."),
            ("comunidade-aluno-015", "Fernanda Alves", "fernanda.alves@comunidade.test", "Design Gráfico", ["design", "cultura", "comunicação"], ["Figma", "ilustração", "identidade visual"], ["comunicação visual"], "Posso ajudar a dar uma cara visual às ideias da comunidade."),
            ("comunidade-aluno-016", "Gabriel Martins", "gabriel.martins@comunidade.test", "Sistemas de Informação", ["inteligência artificial", "Python", "educação"], ["Python", "SQL", "análise de dados"], ["tecnologia educacional"], "Tenho interesse em ferramentas que facilitem a rotina acadêmica."),
        ]
        for aluno_id, nome, email, curso, interesses, habilidades, areas, descricao in alunos_comunidade:
            conn.execute(
                "INSERT OR IGNORE INTO alunos (id,nome,email,instituicao,curso,interesses,habilidades,areas_interesse,descricao) VALUES (?,?,?,?,?,?,?,?,?)",
                (aluno_id, nome, email, "Estácio", curso, json.dumps(interesses, ensure_ascii=False), json.dumps(habilidades, ensure_ascii=False), json.dumps(areas, ensure_ascii=False), descricao),
            )

        publicacoes_comunidade = [
            ("comunidade-post-009", "Projeto", "Mapa de espaços acessíveis", "Vamos reunir relatos e informações sobre acessibilidade nos espaços de estudo para montar um mapa colaborativo. Procuramos pessoas para pesquisa, design e levantamento em campo.", "comunidade-aluno-009", {"vagas": 6, "habilidades_desejadas": ["pesquisa", "design", "acessibilidade"]}),
            ("comunidade-post-010", "Projeto", "Mini jogo para aprender lógica", "Estamos fazendo um jogo curto para ajudar quem está começando em programação. A primeira versão será simples e aberta a sugestões.", "comunidade-aluno-010", {"vagas": 4, "habilidades_desejadas": ["Godot", "roteiro", "testes"]}),
            ("comunidade-post-011", "GrupoEstudo", "Estudo de saúde e alimentação", "Encontros quinzenais para revisar conteúdos de saúde, alimentação e promoção do bem-estar. Alunos de outros cursos também são bem-vindos.", "comunidade-aluno-011", {"assunto": "Saúde e alimentação", "disciplina": "Nutrição e saúde coletiva", "limite_participantes": 12}),
            ("comunidade-post-012", "Evento", "Oficina de prototipação de ideias", "Uma tarde para esboçar soluções, trocar feedback e conhecer colegas de outros cursos. Não é necessário ter experiência.", "comunidade-aluno-014", {"inicio": (agora + timedelta(days=15)).replace(hour=15, minute=0, second=0, microsecond=0).isoformat(), "local": "Sala de convivência", "modalidade": "presencial", "limite_participantes": 24}),
            ("comunidade-post-013", "GrupoEstudo", "Portfólio criativo em construção", "Vamos separar um horário para mostrar trabalhos, trocar referências e dar sugestões construtivas para os portfólios.", "comunidade-aluno-015", {"assunto": "Portfólio e identidade visual", "disciplina": "Design e comunicação", "limite_participantes": 10}),
            ("comunidade-post-014", "PublicacaoLivre", "Alguém anima estudar Python junto?", "Estou revisando lógica e funções durante a semana. Podemos combinar uma chamada curta ou estudar na biblioteca e compartilhar exercícios que deram trabalho.", "comunidade-aluno-016", {}),
            ("comunidade-post-015", "PublicacaoLivre", "Troca de materiais de leitura", "Tenho alguns textos introdutórios sobre aprendizagem colaborativa. Se alguém tiver recomendações sobre inclusão e educação, vamos trocar referências por aqui.", "comunidade-aluno-013", {}),
            ("comunidade-post-016", "Projeto", "Horta e alimentação consciente no campus", "Queremos organizar uma pequena ação de educação alimentar e sustentabilidade, com materiais simples para compartilhar com os estudantes.", "comunidade-aluno-011", {"vagas": 5, "habilidades_desejadas": ["comunicação", "pesquisa", "sustentabilidade"]}),
        ]
        for publicacao_id, tipo, titulo, descricao, autor_id, detalhes in publicacoes_comunidade:
            conn.execute(
                "INSERT OR IGNORE INTO publicacoes (id,tipo,titulo,descricao,autor_id,criada_em,detalhes) VALUES (?,?,?,?,?,?,?)",
                (publicacao_id, tipo, titulo, descricao, autor_id, agora.isoformat(timespec="minutes"), json.dumps(detalhes, ensure_ascii=False)),
            )

        participacoes_comunidade = [
            ("comunidade-part-009-012", "comunidade-aluno-012", "comunidade-post-009"),
            ("comunidade-part-009-013", "comunidade-aluno-013", "comunidade-post-009"),
            ("comunidade-part-010-016", "comunidade-aluno-016", "comunidade-post-010"),
            ("comunidade-part-010-002", "demo-aluno-002", "comunidade-post-010"),
            ("comunidade-part-011-006", "demo-aluno-006", "comunidade-post-011"),
            ("comunidade-part-012-007", "demo-aluno-007", "comunidade-post-012"),
            ("comunidade-part-012-014", "comunidade-aluno-014", "comunidade-post-012"),
            ("comunidade-part-013-001", "demo-aluno-001", "comunidade-post-013"),
            ("comunidade-part-016-008", "demo-aluno-008", "comunidade-post-016"),
            ("comunidade-pending-009-004", "demo-aluno-004", "comunidade-post-009"),
        ]
        for participacao_id, aluno_id, publicacao_id in participacoes_comunidade:
            conn.execute(
                "INSERT OR IGNORE INTO participacoes (id,aluno_id,publicacao_id,status,solicitada_em) VALUES (?,?,?,?,?)",
                (participacao_id, aluno_id, publicacao_id, "pendente" if "pending" in participacao_id else "aceita", agora.isoformat(timespec="seconds")),
            )

        comentarios_comunidade = [
            ("comunidade-comment-009-1", "comunidade-post-009", "comunidade-aluno-012", "Posso ajudar com o levantamento dos espaços. Acho que vale incluir rampas, elevadores e sinalização."),
            ("comunidade-comment-009-2", "comunidade-post-009", "comunidade-aluno-013", "Adorei a ideia! Posso revisar os textos para ficarem fáceis de entender."),
            ("comunidade-comment-010-1", "comunidade-post-010", "demo-aluno-002", "Tenho alguns exemplos de exercícios de lógica que podem virar fases do jogo."),
            ("comunidade-comment-011-1", "comunidade-post-011", "demo-aluno-006", "Tenho interesse! Posso contribuir com referências de promoção da saúde."),
            ("comunidade-comment-012-1", "comunidade-post-012", "demo-aluno-007", "Posso ajudar a divulgar a oficina e preparar um material visual simples."),
            ("comunidade-comment-013-1", "comunidade-post-013", "demo-aluno-001", "Vou levar um projeto acadêmico para receber sugestões também."),
            ("comunidade-comment-014-1", "comunidade-post-014", "comunidade-aluno-010", "Topo estudar junto! Também estou praticando lógica para o protótipo do jogo."),
            ("comunidade-comment-015-1", "comunidade-post-015", "demo-aluno-003", "Tenho indicações sobre aprendizagem e saúde mental. Vou separar os materiais."),
            ("comunidade-comment-016-1", "comunidade-post-016", "demo-aluno-008", "Posso colaborar com o planejamento e pensar numa atividade rápida para o campus."),
        ]
        for comentario_id, publicacao_id, autor_id, conteudo in comentarios_comunidade:
            conn.execute(
                "INSERT OR IGNORE INTO comentarios (id,publicacao_id,autor_id,conteudo,criada_em) VALUES (?,?,?,?,?)",
                (comentario_id, publicacao_id, autor_id, conteudo, agora.isoformat(timespec="seconds")),
            )

        encontros_demo = [
            ("comunidade-encontro-001", "comunidade-aluno-009", "comunidade-post-009", "Rascunho do mapa de acessibilidade", "Vamos definir juntos quais espaços e informações entram na primeira versão do mapa. André e Júlia também vão participar.", 2, 16, "Biblioteca · mesa central", "presencial"),
            ("comunidade-encontro-002", "comunidade-aluno-010", "comunidade-post-010", "Sessão de protótipo do mini jogo", "Encontro aberto para testar a primeira fase e trocar ideias sobre os desafios de lógica. Gabriel e Caio confirmaram presença.", 4, 18, "Online", "online"),
            ("comunidade-encontro-003", "comunidade-aluno-011", "comunidade-post-011", "Conversa sobre saúde e alimentação", "Um papo informal para compartilhar referências e planejar os próximos temas de estudo. Rafael estará com a gente.", 6, 17, "Sala de estudos 2", "presencial"),
            ("comunidade-encontro-004", "comunidade-aluno-015", "comunidade-post-013", "Troca de feedback de portfólio", "Cada pessoa pode trazer um trabalho em andamento para receber sugestões respeitosas do grupo. Larissa também participará.", 9, 16, "Online", "online"),
            ("comunidade-encontro-005", "demo-aluno-008", "comunidade-post-016", "Planejamento da horta comunitária", "Vamos organizar tarefas e pensar numa atividade de educação alimentar para o campus. Camila e Mateus estão convidados.", 12, 14, "Campus Estácio · área de convivência", "presencial"),
        ]
        for encontro_id, organizador_id, publicacao_id, titulo, descricao, dias, hora, local, modalidade in encontros_demo:
            inicio = (agora + timedelta(days=dias)).replace(hour=hora, minute=0, second=0, microsecond=0)
            conn.execute(
                "INSERT OR IGNORE INTO encontros (id,organizador_id,publicacao_id,titulo,descricao,inicio,local,modalidade,criado_em) VALUES (?,?,?,?,?,?,?,?,?)",
                (encontro_id, organizador_id, publicacao_id, titulo, descricao, inicio.isoformat(), local, modalidade, agora.isoformat(timespec="seconds")),
            )


def obter_usuario_por_identificador(identificador: str) -> dict[str, Any] | None:
    chave = identificador.strip().casefold()
    with conectar() as conn:
        row = conn.execute(
            "SELECT matricula, email, senha_hash, aluno_id FROM usuarios_institucionais WHERE lower(matricula)=? OR lower(email)=?",
            (chave, chave),
        ).fetchone()
    return dict(row) if row else None


def criar_conta(aluno: dict[str, Any], matricula: str, senha_hash: str) -> None:
    with conectar() as conn:
        conn.execute(
            "INSERT INTO alunos (id,nome,email,instituicao,curso,interesses,habilidades,descricao,areas_interesse) VALUES (?,?,?,?,?,?,?,?,?)",
            (aluno["id"], aluno["nome"], aluno["email"], aluno.get("instituicao", ""), aluno["curso"],
             json.dumps(aluno.get("interesses", []), ensure_ascii=False),
             json.dumps(aluno.get("habilidades", []), ensure_ascii=False), aluno.get("descricao", ""),
             json.dumps(aluno.get("areas_interesse", []), ensure_ascii=False)),
        )
        conn.execute(
            "INSERT INTO usuarios_institucionais (matricula,email,senha_hash,aluno_id) VALUES (?,?,?,?)",
            (matricula, aluno["email"], senha_hash, aluno["id"]),
        )


def criar_aluno(aluno: dict[str, Any]) -> None:
    with conectar() as conn:
        conn.execute(
            "INSERT INTO alunos (id,nome,email,instituicao,curso,interesses,habilidades,descricao) VALUES (?,?,?,?,?,?,?,?)",
            (aluno["id"], aluno["nome"], aluno["email"], aluno.get("instituicao", ""), aluno.get("curso"),
             json.dumps(aluno.get("interesses", []), ensure_ascii=False),
             json.dumps(aluno.get("habilidades", []), ensure_ascii=False), aluno.get("descricao", "")),
        )


def obter_aluno(aluno_id: str) -> dict[str, Any] | None:
    with conectar() as conn:
        row = conn.execute("SELECT * FROM alunos WHERE id=?", (aluno_id,)).fetchone()
    if row is None:
        return None
    dados = dict(row)
    dados["interesses"] = json.loads(dados["interesses"])
    dados["habilidades"] = json.loads(dados["habilidades"])
    dados["areas_interesse"] = json.loads(dados.get("areas_interesse", "[]"))
    return dados


def atualizar_aluno(aluno_id: str, dados: dict[str, Any]) -> bool:
    permitidos = {"descricao", "curso", "instituicao", "interesses", "habilidades", "areas_interesse", "avatar_url"}
    if not dados or not set(dados).issubset(permitidos):
        return False
    assignments, values = [], []
    for campo, valor in dados.items():
        assignments.append(f"{campo}=?")
        values.append(json.dumps(valor, ensure_ascii=False) if campo in {"interesses", "habilidades", "areas_interesse"} else valor)
    values.append(aluno_id)
    with conectar() as conn:
        cursor = conn.execute(f"UPDATE alunos SET {', '.join(assignments)} WHERE id=?", values)
    return cursor.rowcount > 0


def listar_alunos() -> list[dict[str, Any]]:
    with conectar() as conn:
        ids = [row[0] for row in conn.execute("SELECT id FROM alunos ORDER BY nome")]
    return [obter_aluno(aluno_id) for aluno_id in ids]


def obter_seguimento(seguidor_id: str, seguido_id: str) -> bool:
    with conectar() as conn:
        row = conn.execute(
            "SELECT 1 FROM seguimentos WHERE seguidor_id=? AND seguido_id=?",
            (seguidor_id, seguido_id),
        ).fetchone()
    return row is not None


def contar_seguidores(aluno_id: str) -> int:
    with conectar() as conn:
        row = conn.execute("SELECT count(*) FROM seguimentos WHERE seguido_id=?", (aluno_id,)).fetchone()
    return int(row[0])


def listar_seguidos(seguidor_id: str) -> list[dict[str, Any]]:
    with conectar() as conn:
        ids = [row[0] for row in conn.execute(
            "SELECT seguido_id FROM seguimentos WHERE seguidor_id=? ORDER BY criado_em DESC",
            (seguidor_id,),
        )]
    return [aluno for aluno_id in ids if (aluno := obter_aluno(aluno_id)) is not None]


def seguir_aluno(seguidor_id: str, seguido_id: str, criado_em: str) -> None:
    with conectar() as conn:
        cursor = conn.execute(
            "INSERT OR IGNORE INTO seguimentos (seguidor_id,seguido_id,criado_em) VALUES (?,?,?)",
            (seguidor_id, seguido_id, criado_em),
        )
        if cursor.rowcount:
            conn.execute(
                "INSERT INTO notificacoes_sociais (id,aluno_id,autor_id,tipo,publicacao_id,criada_em) VALUES (?,?,?,?,?,?)",
                (secrets.token_urlsafe(12), seguido_id, seguidor_id, "novo_seguidor", None, criado_em),
            )


def deixar_de_seguir(seguidor_id: str, seguido_id: str) -> bool:
    with conectar() as conn:
        cursor = conn.execute(
            "DELETE FROM seguimentos WHERE seguidor_id=? AND seguido_id=?",
            (seguidor_id, seguido_id),
        )
    return cursor.rowcount > 0


def criar_publicacao(publicacao: dict[str, Any]) -> None:
    with conectar() as conn:
        conn.execute(
            "INSERT INTO publicacoes (id,tipo,titulo,descricao,autor_id,criada_em,detalhes) VALUES (?,?,?,?,?,?,?)",
            (publicacao["id"], publicacao["tipo"], publicacao["titulo"],
             publicacao["descricao"], publicacao.get("autor_id"),
             publicacao["criada_em"], json.dumps(publicacao.get("detalhes", {}), ensure_ascii=False)),
        )


def obter_publicacao(publicacao_id: str) -> dict[str, Any] | None:
    with conectar() as conn:
        row = conn.execute("""SELECT pu.*, (SELECT count(*) FROM participacoes pa WHERE pa.publicacao_id=pu.id AND pa.status IN ('pendente','aceita')) AS vagas_ocupadas FROM publicacoes pu WHERE pu.id=?""", (publicacao_id,)).fetchone()
    if row is None:
        return None
    dados = dict(row)
    detalhes = json.loads(dados.pop("detalhes"))
    dados.update(detalhes)
    return dados


def listar_publicacoes(tipo: str | None = None) -> list[dict[str, Any]]:
    with conectar() as conn:
        if tipo:
            rows = conn.execute("SELECT id FROM publicacoes WHERE lower(tipo)=lower(?) ORDER BY criada_em DESC", (tipo,))
        else:
            rows = conn.execute("SELECT id FROM publicacoes ORDER BY criada_em DESC")
        ids = [row[0] for row in rows]
    return [obter_publicacao(publicacao_id) for publicacao_id in ids]


def contar_participacoes(publicacao_id: str) -> int:
    with conectar() as conn:
        return conn.execute(
            "SELECT count(*) FROM participacoes WHERE publicacao_id=? AND status IN ('pendente','aceita')",
            (publicacao_id,),
        ).fetchone()[0]


class LimiteParticipacaoAtingido(Exception):
    """Indica que não há vagas disponíveis para uma nova participação."""


def criar_participacao(participacao: dict[str, Any], limite: int | None = None) -> dict[str, Any]:
    """Cria ou reativa a participação e retorna o registro persistido.

    Valida os registros relacionados, a duplicidade e o limite dentro da mesma
    transação para evitar respostas baseadas em dados temporários ou desatualizados.
    """
    aluno_id = participacao["aluno_id"]
    publicacao_id = participacao["publicacao_id"]
    status = participacao["status"]
    with conectar() as conn:
        conn.execute("BEGIN IMMEDIATE")
        if conn.execute("SELECT 1 FROM alunos WHERE id=?", (aluno_id,)).fetchone() is None:
            raise sqlite3.IntegrityError("aluno_id não existe na tabela alunos")
        if conn.execute("SELECT 1 FROM publicacoes WHERE id=?", (publicacao_id,)).fetchone() is None:
            raise sqlite3.IntegrityError("publicacao_id não existe na tabela publicacoes")

        existente = conn.execute(
            "SELECT * FROM participacoes WHERE aluno_id=? AND publicacao_id=?",
            (aluno_id, publicacao_id),
        ).fetchone()
        if existente and existente["status"] in {"pendente", "aceita"}:
            return dict(existente)

        if limite is not None:
            quantidade = conn.execute(
                "SELECT count(*) FROM participacoes WHERE publicacao_id=? AND status IN ('pendente','aceita')",
                (publicacao_id,),
            ).fetchone()[0]
            if quantidade >= limite:
                raise LimiteParticipacaoAtingido

        if existente:
            conn.execute(
                "UPDATE participacoes SET status=?, solicitada_em=? WHERE id=?",
                (status, participacao["solicitada_em"], existente["id"]),
            )
            participacao_id = existente["id"]
        else:
            conn.execute(
                "INSERT INTO participacoes (id,aluno_id,publicacao_id,status,solicitada_em) VALUES (?,?,?,?,?)",
                (participacao["id"], aluno_id, publicacao_id, status, participacao["solicitada_em"]),
            )
            participacao_id = participacao["id"]
        row = conn.execute("SELECT * FROM participacoes WHERE id=?", (participacao_id,)).fetchone()
        return dict(row)

def obter_participacao_aluno_publicacao(aluno_id: str, publicacao_id: str) -> dict[str, Any] | None:
    with conectar() as conn:
        row = conn.execute("SELECT * FROM participacoes WHERE aluno_id=? AND publicacao_id=?", (aluno_id, publicacao_id)).fetchone()
    return dict(row) if row else None


def obter_participacao(participacao_id: str) -> dict[str, Any] | None:
    with conectar() as conn:
        row = conn.execute("SELECT * FROM participacoes WHERE id=?", (participacao_id,)).fetchone()
    return dict(row) if row else None


def atualizar_status_participacao(participacao_id: str, status: str) -> bool:
    with conectar() as conn:
        cursor = conn.execute("UPDATE participacoes SET status=? WHERE id=?", (status, participacao_id))
    return cursor.rowcount > 0


inicializar_banco()


def listar_conversas(aluno_id: str) -> list[dict[str, Any]]:
    """Retorna a mensagem mais recente de cada conversa, em ordem cronológica."""
    with conectar() as conn:
        rows = conn.execute("""
            SELECT a.id AS aluno_id, a.nome, a.curso, a.avatar_url,
                   m.conteudo AS ultima_mensagem, m.enviada_em, m.remetente_id
            FROM mensagens m
            JOIN alunos a ON a.id = CASE
                WHEN m.remetente_id=? THEN m.destinatario_id
                ELSE m.remetente_id
            END
            WHERE (m.remetente_id=? OR m.destinatario_id=?)
              AND NOT EXISTS (
                  SELECT 1 FROM mensagens mais_nova
                  WHERE (mais_nova.remetente_id=m.remetente_id
                         AND mais_nova.destinatario_id=m.destinatario_id
                         OR mais_nova.remetente_id=m.destinatario_id
                         AND mais_nova.destinatario_id=m.remetente_id)
                    AND (mais_nova.enviada_em > m.enviada_em
                         OR (mais_nova.enviada_em = m.enviada_em AND mais_nova.id > m.id))
              )
            ORDER BY m.enviada_em DESC, m.id DESC
        """, (aluno_id, aluno_id, aluno_id)).fetchall()
    return [dict(row) for row in rows]


def listar_mensagens(aluno_id: str, outro_id: str) -> list[dict[str, Any]]:
    with conectar() as conn:
        rows = conn.execute("""
            SELECT id, remetente_id, destinatario_id, conteudo, enviada_em
            FROM mensagens
            WHERE (remetente_id=? AND destinatario_id=?) OR (remetente_id=? AND destinatario_id=?)
            ORDER BY enviada_em ASC
        """, (aluno_id, outro_id, outro_id, aluno_id)).fetchall()
    return [dict(row) for row in rows]


def criar_mensagem(mensagem: dict[str, Any]) -> None:
    with conectar() as conn:
        conn.execute(
            "INSERT INTO mensagens (id,remetente_id,destinatario_id,conteudo,enviada_em) VALUES (?,?,?,?,?)",
            (mensagem["id"], mensagem["remetente_id"], mensagem["destinatario_id"], mensagem["conteudo"], mensagem["enviada_em"]),
        )


def listar_comentarios(publicacao_id: str) -> list[dict[str, Any]]:
    with conectar() as conn:
        rows = conn.execute(
            """SELECT c.id, c.publicacao_id, c.autor_id, a.nome AS autor_nome,
                      c.conteudo, c.criada_em
               FROM comentarios c JOIN alunos a ON a.id=c.autor_id
               WHERE c.publicacao_id=? ORDER BY c.criada_em""",
            (publicacao_id,),
        ).fetchall()
    return [dict(row) for row in rows]


def criar_comentario(comentario: dict[str, Any]) -> None:
    with conectar() as conn:
        conn.execute(
            "INSERT INTO comentarios (id,publicacao_id,autor_id,conteudo,criada_em) VALUES (?,?,?,?,?)",
            (comentario["id"], comentario["publicacao_id"], comentario["autor_id"], comentario["conteudo"], comentario["criada_em"]),
        )


def listar_notificacoes(aluno_id: str) -> list[dict[str, Any]]:
    with conectar() as conn:
        solicitacoes = conn.execute(
            """SELECT pa.id, pa.solicitada_em AS criada_em, pa.publicacao_id,
                      pa.aluno_id, pu.titulo AS publicacao_titulo, a.nome AS aluno_nome,
                      CASE WHEN pu.tipo='Evento' THEN 'presenca_confirmada'
                           ELSE 'solicitacao_participacao' END AS tipo
               FROM participacoes pa
               JOIN publicacoes pu ON pu.id=pa.publicacao_id
               JOIN alunos a ON a.id=pa.aluno_id
               WHERE pu.autor_id=? AND pa.aluno_id<>?
                 AND ((pu.tipo='Evento' AND pa.status='aceita')
                   OR (pu.tipo<>'Evento' AND pa.status='pendente'))""",
            (aluno_id, aluno_id),
        ).fetchall()
        comentarios = conn.execute(
            """SELECT c.id, c.criada_em, c.publicacao_id,
                      c.autor_id AS aluno_id, pu.titulo AS publicacao_titulo, a.nome AS aluno_nome,
                      c.conteudo, 'comentario' AS tipo
               FROM comentarios c
               JOIN publicacoes pu ON pu.id=c.publicacao_id
               JOIN alunos a ON a.id=c.autor_id
               WHERE pu.autor_id=? AND c.autor_id<>?""",
            (aluno_id, aluno_id),
        ).fetchall()
        sociais = conn.execute(
            """SELECT n.id, n.criada_em, n.publicacao_id, pu.titulo AS publicacao_titulo,
                      a.nome AS aluno_nome, n.autor_id AS aluno_id, n.tipo
               FROM notificacoes_sociais n JOIN alunos a ON a.id=n.autor_id
               LEFT JOIN publicacoes pu ON pu.id=n.publicacao_id
               WHERE n.aluno_id=?""", (aluno_id,)
        ).fetchall()
        convites = conn.execute(
            """SELECT c.id, c.criado_em AS criada_em, c.publicacao_id,
                      pu.titulo AS publicacao_titulo, a.nome AS aluno_nome,
                      c.convidante_id AS aluno_id, 'convite_projeto' AS tipo
               FROM convites c JOIN publicacoes pu ON pu.id=c.publicacao_id
               JOIN alunos a ON a.id=c.convidante_id
               WHERE c.convidado_id=? AND c.status='pendente'""", (aluno_id,)
        ).fetchall()
    resultado = [dict(row) for row in solicitacoes] + [dict(row) for row in comentarios] + [dict(row) for row in sociais] + [dict(row) for row in convites]
    return sorted(resultado, key=lambda item: item["criada_em"], reverse=True)


def atualizar_publicacao(publicacao_id: str, dados: dict[str, Any]) -> bool:
    """Atualiza os campos enviados de uma publicação."""
    campos = {"titulo", "descricao", "detalhes"}
    if not dados or not set(dados).issubset(campos):
        return False
    sets = []
    valores = []
    for campo, valor in dados.items():
        sets.append(f"{campo}=?")
        valores.append(json.dumps(valor, ensure_ascii=False) if campo == "detalhes" else valor)
    valores.append(publicacao_id)
    with conectar() as conn:
        cursor = conn.execute(f"UPDATE publicacoes SET {', '.join(sets)} WHERE id=?", valores)
    return cursor.rowcount > 0


def excluir_publicacao(publicacao_id: str) -> bool:
    with conectar() as conn:
        cursor = conn.execute("DELETE FROM publicacoes WHERE id=?", (publicacao_id,))
    return cursor.rowcount > 0


def listar_participacoes_aluno(aluno_id: str) -> list[dict[str, Any]]:
    with conectar() as conn:
        rows = conn.execute(
            """SELECT pa.*, pu.titulo, pu.tipo, pu.autor_id, pu.detalhes
               FROM participacoes pa JOIN publicacoes pu ON pu.id=pa.publicacao_id
               WHERE pa.aluno_id=? ORDER BY pa.solicitada_em DESC""", (aluno_id,)
        ).fetchall()
    resultado = []
    for row in rows:
        item = dict(row)
        item["detalhes"] = json.loads(item.pop("detalhes"))
        resultado.append(item)
    return resultado


def listar_participacoes_publicacao(publicacao_id: str) -> list[dict[str, Any]]:
    with conectar() as conn:
        rows = conn.execute(
            """SELECT pa.*, a.nome, a.curso, a.habilidades, a.avatar_url FROM participacoes pa
               JOIN alunos a ON a.id=pa.aluno_id WHERE pa.publicacao_id=?
               ORDER BY pa.solicitada_em""", (publicacao_id,)
        ).fetchall()
    resultado = []
    for row in rows:
        item = dict(row)
        item["habilidades"] = json.loads(item["habilidades"])
        resultado.append(item)
    return resultado


def remover_participacao(participacao_id: str) -> bool:
    with conectar() as conn:
        cursor = conn.execute("DELETE FROM participacoes WHERE id=?", (participacao_id,))
    return cursor.rowcount > 0


def criar_encontro(encontro: dict[str, Any]) -> None:
    with conectar() as conn:
        conn.execute(
            "INSERT INTO encontros (id,organizador_id,publicacao_id,titulo,descricao,inicio,local,modalidade,criado_em,limite_participantes) VALUES (?,?,?,?,?,?,?,?,?,?)",
            (encontro["id"], encontro["organizador_id"], encontro.get("publicacao_id"), encontro["titulo"],
             encontro["descricao"], encontro["inicio"], encontro.get("local"), encontro["modalidade"], encontro["criado_em"], encontro.get("limite_participantes")),
        )


def listar_encontros() -> list[dict[str, Any]]:
    with conectar() as conn:
        rows = conn.execute(
            """SELECT e.*, a.nome AS organizador_nome,
                      (SELECT count(*) FROM participacoes_encontros pe WHERE pe.encontro_id=e.id) AS participantes
               FROM encontros e
               JOIN alunos a ON a.id=e.organizador_id ORDER BY e.inicio"""
        ).fetchall()
    return [dict(row) for row in rows]


def excluir_encontro(encontro_id: str, organizador_id: str) -> bool:
    with conectar() as conn:
        cursor = conn.execute("DELETE FROM encontros WHERE id=? AND organizador_id=?", (encontro_id, organizador_id))
    return cursor.rowcount > 0


def notificar_nova_publicacao(autor_id: str, publicacao_id: str, criada_em: str) -> None:
    with conectar() as conn:
        seguidores = conn.execute("SELECT seguidor_id FROM seguimentos WHERE seguido_id=?", (autor_id,)).fetchall()
        conn.executemany(
            "INSERT INTO notificacoes_sociais (id,aluno_id,autor_id,tipo,publicacao_id,criada_em) VALUES (?,?,?,?,?,?)",
            [(secrets.token_urlsafe(12), row[0], autor_id, "nova_publicacao", publicacao_id, criada_em) for row in seguidores],
        )


def criar_convite(convite: dict[str, Any]) -> None:
    with conectar() as conn:
        conn.execute(
            "INSERT INTO convites (id,publicacao_id,convidante_id,convidado_id,status,criado_em) VALUES (?,?,?,?,?,?)",
            (convite["id"], convite["publicacao_id"], convite["convidante_id"], convite["convidado_id"], "pendente", convite["criado_em"]),
        )


def listar_convites_aluno(aluno_id: str) -> list[dict[str, Any]]:
    with conectar() as conn:
        rows = conn.execute(
            """SELECT c.*, pu.titulo AS publicacao_titulo, a.nome AS convidante_nome
               FROM convites c JOIN publicacoes pu ON pu.id=c.publicacao_id
               JOIN alunos a ON a.id=c.convidante_id WHERE c.convidado_id=? ORDER BY c.criado_em DESC""",
            (aluno_id,),
        ).fetchall()
    return [dict(row) for row in rows]


def atualizar_convite(convite_id: str, aluno_id: str, status: str) -> dict[str, Any] | None:
    with conectar() as conn:
        cursor = conn.execute("UPDATE convites SET status=? WHERE id=? AND convidado_id=? AND status='pendente'", (status, convite_id, aluno_id))
        if not cursor.rowcount:
            return None
        row = conn.execute("SELECT * FROM convites WHERE id=?", (convite_id,)).fetchone()
    return dict(row) if row else None


def adicionar_presenca_encontro(encontro_id: str, aluno_id: str, confirmada_em: str, limite: int | None) -> bool:
    with conectar() as conn:
        conn.execute("BEGIN IMMEDIATE")
        if limite is not None:
            atual = conn.execute("SELECT count(*) FROM participacoes_encontros WHERE encontro_id=?", (encontro_id,)).fetchone()[0]
            if atual >= limite:
                return False
        conn.execute(
            "INSERT OR IGNORE INTO participacoes_encontros (encontro_id,aluno_id,confirmada_em) VALUES (?,?,?)",
            (encontro_id, aluno_id, confirmada_em),
        )
        return True


def cancelar_presenca_encontro(encontro_id: str, aluno_id: str) -> bool:
    with conectar() as conn:
        cursor = conn.execute("DELETE FROM participacoes_encontros WHERE encontro_id=? AND aluno_id=?", (encontro_id, aluno_id))
    return cursor.rowcount > 0


def listar_participantes_encontro(encontro_id: str) -> list[dict[str, Any]]:
    with conectar() as conn:
        rows = conn.execute(
            """SELECT a.id, a.nome, a.curso, a.habilidades, a.avatar_url, pe.confirmada_em
               FROM participacoes_encontros pe JOIN alunos a ON a.id=pe.aluno_id
               WHERE pe.encontro_id=? ORDER BY pe.confirmada_em""", (encontro_id,)
        ).fetchall()
    resultado = []
    for row in rows:
        item = dict(row)
        item["habilidades"] = json.loads(item["habilidades"])
        resultado.append(item)
    return resultado


def listar_favoritos(aluno_id: str) -> list[dict[str, Any]]:
    with conectar() as conn:
        rows = conn.execute(
            """SELECT p.* FROM favoritos f JOIN publicacoes p ON p.id=f.publicacao_id
               WHERE f.aluno_id=? ORDER BY f.criada_em DESC""", (aluno_id,)
        ).fetchall()
    resultado = []
    for row in rows:
        item = dict(row)
        item["detalhes"] = json.loads(item["detalhes"])
        resultado.append(item)
    return resultado


def favoritar_publicacao(aluno_id: str, publicacao_id: str, criada_em: str) -> None:
    with conectar() as conn:
        conn.execute("INSERT OR IGNORE INTO favoritos (aluno_id,publicacao_id,criada_em) VALUES (?,?,?)", (aluno_id, publicacao_id, criada_em))


def desfavoritar_publicacao(aluno_id: str, publicacao_id: str) -> bool:
    with conectar() as conn:
        cursor = conn.execute("DELETE FROM favoritos WHERE aluno_id=? AND publicacao_id=?", (aluno_id, publicacao_id))
    return cursor.rowcount > 0
