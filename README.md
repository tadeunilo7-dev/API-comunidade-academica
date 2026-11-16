# API

API e interface web para uma comunidade acadêmica. O sistema permite que estudantes criem perfis, encontrem pessoas com interesses em comum, publiquem projetos e postagens, organizem eventos e encontros, participem de grupos de estudo e conversem.

Sistemas de Informação - Estácio UNIMETA

## Integrantes

1. Nilo Tadeu da Silva Meleiro Neto
2. Guilherme de Souza Bezerra
3. Nemuel Kalebe da Silva Lacerda
4. Rubisney de Abreu Maia Júnior

## Tecnologias

- Python
- FastAPI e Pydantic
- SQLite
- React e TypeScript
- Vite
- Docker e Docker Compose

## Como rodar

### Opção recomendada: Docker

1. Instale e abra o [Docker Desktop]
Link de download: https://www.docker.com/products/docker-desktop/
2. Baixe o projeto pelo GitHub em **Code → Download ZIP** e extraia o arquivo, ou clone o repositório.
3. Abra um terminal na pasta do projeto e execute:

   ```bash
   docker compose up --build
   ```

4. Acesse a interface em <http://localhost:5173>.
5. A API fica em <http://localhost:8000>; sua documentação interativa está em <http://localhost:8000/docs>.

Para encerrar, pressione `Ctrl+C` no terminal. O banco SQLite fica em um volume Docker e continua disponível após reiniciar os serviços. Para apagar o banco e os dados salvos, execute `docker compose down -v`.

Contas de demonstração usam a senha `aluno123`:

- `larissa@exemplo.com`
- `caio@exemplo.com`
- `bruna@exemplo.com`
- `pedro@exemplo.com`
- `marina@exemplo.com`
- `rafael@exemplo.com`
- `sofia@exemplo.com`
- `thiago@exemplo.com`

### Rodar sem Docker

É necessário ter Python e Node.js instalados.

1. Na pasta do projeto, instale as dependências da API e inicie o servidor:

   ```bash
   python -m pip install -r requirements.txt
   python -m uvicorn fastAPI:app --reload
   ```

2. Em outro terminal, instale as dependências da interface e inicie o Vite:

   ```bash
   npm install
   npm run dev
   ```

3. Abra o endereço informado pelo Vite, normalmente <http://localhost:5173>.

## Endpoints

Endereço-base: `http://localhost:8000`. As respostas usam JSON, salvo quando indicado `204 No Content`.

| Método | Rota | Descrição |

| `GET` | `/health` | Verifica a API e o SQLite. |

| `GET` | `/cursos` | Lista os cursos disponíveis. |

| `POST` | `/cadastro` | Cria conta e perfil de estudante. |

| `POST` | `/login` | Autentica com e-mail e senha. |

| `POST` | `/alunos` | Cadastra um perfil de aluno. |

| `GET` | `/alunos` | Lista os perfis cadastrados. |

| `GET` | `/alunos/{aluno_id}` | Consulta um perfil. |

| `PUT` | `/alunos/{aluno_id}` | Atualiza perfil, interesses, habilidades e foto. |

| `GET` | `/alunos/{aluno_id}/seguir?seguidor_id={id}` | Consulta o seguimento e a contagem de seguidores. |

| `POST` | `/alunos/{aluno_id}/seguir` | Segue um perfil. |

| `DELETE` | `/alunos/{aluno_id}/seguir?seguidor_id={id}` | Deixa de seguir um perfil. |

| `GET` | `/alunos/{aluno_id}/seguindo` | Lista os perfis seguidos. |

| `GET` | `/alunos/{aluno_id}/participacoes` | Lista as participações do aluno. |

| `GET` | `/alunos/{aluno_id}/convites` | Lista convites recebidos. |

| `GET` | `/alunos/{aluno_id}/favoritos` | Lista publicações salvas. |

| `POST` | `/publicacoes` | Cria postagem livre, ideia, projeto, evento ou grupo de estudo. |

| `GET` | `/publicacoes` | Lista publicações; aceita o filtro `tipo`. |

| `GET` | `/publicacoes/{publicacao_id}` | Consulta uma publicação. |

| `PUT` | `/publicacoes/{publicacao_id}?aluno_id={id}` | Edita publicação própria. |

| `DELETE` | `/publicacoes/{publicacao_id}?aluno_id={id}` | Exclui publicação própria. |

| `GET` | `/publicacoes/{publicacao_id}/participacoes` | Lista solicitações e participantes. |

| `POST` | `/publicacoes/{publicacao_id}/participacoes` | Solicita participação ou confirma presença em evento. |

| `PATCH` | `/participacoes/{participacao_id}?gestor_id={id}` | Aceita ou recusa uma solicitação. |

| `DELETE` | `/participacoes/{participacao_id}?aluno_id={id}` | Cancela a participação; o criador pode removê-la usando `gestor_id`. |

| `GET` | `/publicacoes/{publicacao_id}/comentarios` | Lista comentários. |

| `POST` | `/publicacoes/{publicacao_id}/comentarios` | Adiciona um comentário. |

| `POST` | `/publicacoes/{publicacao_id}/convites` | Convida aluno para projeto ou grupo de estudo. |

| `PATCH` | `/convites/{convite_id}` | Aceita ou recusa um convite. |

| `POST` | `/publicacoes/{publicacao_id}/favoritos` | Salva publicação nos favoritos. |

| `DELETE` | `/publicacoes/{publicacao_id}/favoritos?aluno_id={id}` | Remove dos favoritos. |

| `GET` | `/notificacoes?aluno_id={id}` | Lista notificações da comunidade. |

| `GET` | `/encontros` | Lista encontros. |

| `POST` | `/encontros` | Cria encontro com limite opcional de participantes. |

| `GET` | `/encontros/{encontro_id}/participantes` | Lista presenças confirmadas. |

| `POST` | `/encontros/{encontro_id}/participacoes` | Confirma presença. |

| `DELETE` | `/encontros/{encontro_id}/participacoes?aluno_id={id}` | Cancela presença. |

| `DELETE` | `/encontros/{encontro_id}?organizador_id={id}` | Exclui encontro próprio. |

| `GET` | `/busca` | Busca alunos e publicações por `q`, `tipo`, `curso`, `interesse`, `habilidade` e `data`. |

| `GET` | `/conversas?aluno_id={id}` | Lista conversas de um aluno. |

| `GET` | `/mensagens/{outro_id}?aluno_id={id}` | Lista mensagens entre alunos. |

| `POST` | `/mensagens` | Envia mensagem. |

## Exemplo de requisição

Cria uma conta. Campos como nome, e-mail, curso, instituição e senha são obrigatórios; interesses, habilidades e áreas de interesse são listas opcionais.

**POST** `http://localhost:8000/cadastro`

```json
{
  "nome": "Ana Silva",
  "email": "ana@example.com",
  "curso": "Sistemas de Informação",
  "instituicao": "Estácio UNIMETA",
  "senha": "senha123",
  "interesses": ["desenvolvimento web", "tecnologia"],
  "habilidades": ["Python", "React"],
  "areas_interesse": ["projetos acadêmicos"]
}
```

Em caso de sucesso, a API responde com `201 Created` e os dados do aluno criado. A resposta JSON pode ser conferida no Postman ou em <http://localhost:8000/docs>.

## Ferramentas utilizadas

- Visual Studio Code: edição do projeto.
- Postman: testar requisições e consultar respostas da API.
- Docker Desktop: executar a interface e a API em contêineres.
- Git e GitHub: versionamento e compartilhamento do projeto.
- ChatGPT 6.1: auxiliar no desenvolvimento e corrigir erros.