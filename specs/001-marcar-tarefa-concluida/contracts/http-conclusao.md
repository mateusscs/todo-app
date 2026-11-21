# Contrato HTTP: Conclusão de Tarefa

**Feature**: `001-marcar-tarefa-concluida` | Decisões em [../research.md](../research.md) D3–D6

## `POST /tarefas/:id/conclusao` (novo)

Define o estado de conclusão de uma tarefa (operação idempotente).

**Requisição**

- `Content-Type: application/x-www-form-urlencoded` (submissão de formulário HTML)
- Parâmetro de rota `id`: somente dígitos (`/^\d+$/`).
- Corpo:

| Campo       | Presença  | Significado |
|-------------|-----------|-------------|
| `concluida` | presente (qualquer valor; o navegador envia `on`) | marcar como **concluída** |
| `concluida` | ausente   | marcar como **pendente** |

**Respostas**

| Situação | Status | Corpo / cabeçalhos |
|----------|--------|--------------------|
| Sucesso | `302 Found` | `Location: /#tarefa-<id>` |
| `id` com formato inválido ou tarefa inexistente | `404 Not Found` | HTML da página `index` com a lista atual e a mensagem "Tarefa não encontrada." em elemento `role="alert"` |
| Erro inesperado no servidor | `500 Internal Server Error` | HTML da página `index` com a mensagem "Não foi possível atualizar a tarefa. Tente novamente." em `role="alert"`; sem stack trace |

Em todas as respostas de erro, a lista renderizada reflete o estado persistido no servidor
(FR-008: o estado visual não muda quando a gravação falha).

## `GET /` (alterado)

Continua retornando `200` com a lista completa, na ordem de criação, todas as tarefas visíveis
(FR-005). Contrato de marcação HTML por tarefa (usado pelos testes de aceite):

| Elemento | Regra |
|----------|-------|
| `<li id="tarefa-<id>" data-id="<id>">` | um por tarefa; recebe a classe `concluida` quando `concluida === true` |
| `<form method="post" action="/tarefas/<id>/conclusao">` | um por tarefa, dentro do `<li>` |
| `<input type="checkbox" id="tarefa-<id>-concluida" name="concluida">` | atributo `checked` presente se e somente se a tarefa estiver concluída (FR-001) |
| `<label for="tarefa-<id>-concluida">` | contém o título escapado (`<%= %>`) (FR-002) |
| `<button type="submit">Salvar</button>` | fallback sem JavaScript; ocultado por script de melhoria progressiva |
| CSS `.concluida` | aplica `text-decoration: line-through` ao título (FR-004) |
| Mensagem de erro | `<p class="erro" role="alert">` (SC-005) |

## `POST /tarefas` (inalterado)

Comportamento existente mantido; a tarefa criada passa a ter `concluida: false`.
