# Data Model: Marcar Tarefa como Concluída

**Feature**: `001-marcar-tarefa-concluida` | **Data**: 2026-11-21 | **Plano**: [plan.md](./plan.md)

Armazenamento: repositório em memória em `src/tarefas.js` (sem banco de dados, sem migração — ver
[research.md](./research.md) D1 e D9).

## Entidade: Tarefa

| Campo       | Tipo             | Origem       | Regras |
|-------------|------------------|--------------|--------|
| `id`        | inteiro positivo | existente    | Gerado sequencialmente pelo repositório; imutável. |
| `titulo`    | string           | existente    | Obrigatório, sem espaços nas pontas (regra atual de `adicionar`). Inalterado por esta feature. |
| `criadaEm`  | string ISO-8601  | existente    | Definido na criação; inalterado. |
| `concluida` | booleano         | **novo**     | `false` ao criar. Alterado apenas por `definirConclusao`. Representa o estado pendente (`false`) / concluída (`true`) da spec (FR-003, FR-006). |

Nenhum relacionamento com outras entidades.

## Estados e transições

```text
            definirConclusao(id, true)
 pendente  ──────────────────────────▶  concluída
 (false)   ◀──────────────────────────  (true)
            definirConclusao(id, false)
```

- Estado inicial: `pendente` (`concluida: false`).
- Transições idempotentes: aplicar o mesmo estado novamente não muda nada e não gera erro
  (edge case de cliques repetidos; research D2).
- Nenhuma transição remove a tarefa da lista nem altera sua posição (FR-005; sem reordenação).

## Operações do repositório (`criarRepositorio()`)

| Operação | Entrada | Saída | Erros |
|----------|---------|-------|-------|
| `listar()` | — | cópias das tarefas, na ordem de criação, **incluindo** `concluida` | — |
| `adicionar(titulo)` | string | cópia da tarefa criada, com `concluida: false` | `Error` se título vazio (existente) |
| `definirConclusao(id, concluida)` (**novo**) | `id`: número; `concluida`: booleano | cópia da tarefa atualizada, ou `null` se não existir tarefa com esse `id` | — |

Regras de validação:

- `definirConclusao` converte `concluida` com `Boolean(...)` para garantir o tipo armazenado.
- A validação do formato de `:id` vindo da URL (somente dígitos) é feita na rota antes de chamar o
  repositório (research D6); o repositório só procura por igualdade estrita de `id`.
- As cópias retornadas impedem que a camada de rotas/views altere o estado interno (padrão atual).
