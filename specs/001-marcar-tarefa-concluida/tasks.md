---
description: "Lista de tarefas: Marcar Tarefa como Concluída"
---

# Tasks: Marcar Tarefa como Concluída

**Input**: Documentos em `specs/001-marcar-tarefa-concluida/` (spec.md, plan.md, research.md, data-model.md, contracts/http-conclusao.md, quickstart.md)

**Prerequisites**: plan.md, spec.md

**Tests**: Não há tarefas de teste separadas. Pela constituição (princípio II) e pelo plano, os testes unitários/HTTP do Desenvolvedor (`test/tarefas.test.js`, `test/app.test.js`) fazem parte da definição de pronto de cada tarefa de implementação abaixo. Os testes de aceite em `test/aceite/` são do QA e não geram tarefas aqui.

**Verificação**: `npm test` (deve sair com código 0). Não há lint nem build.

**Organization**: Tarefas agrupadas por história de usuário (US1 P1, US2 P2).

## Format: `- [ ] T### [P?] [USn?] Descrição com caminho do arquivo`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar a base existente; nenhuma dependência nova nem estrutura nova de produção (plan.md).

- [X] T001 Confirmar a linha de base executando `npm test` na branch `001-marcar-tarefa-concluida` e registrar que `src/app.js`, `src/tarefas.js`, `views/index.ejs` e `test/app.test.js` existem e a suíte passa (sem alterar `package.json`; nenhuma dependência nova)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Campo e operação de dados usados por ambas as histórias (research D1, D2).

**CRITICAL**: Nenhuma história pode começar antes desta fase.

- [X] T002 Em `src/tarefas.js`, adicionar o campo `concluida` (booleano, `false` ao criar em `adicionar`, incluído nas cópias de `listar()`) conforme `data-model.md` `Tarefa.concluida`, e o método idempotente `definirConclusao(id, concluida)` que aplica `Boolean(concluida)`, retorna a cópia atualizada ou `null` se o `id` não existir, sem alterar a ordem nem remover itens (FR-003, FR-005, FR-006); criar `test/tarefas.test.js` com `node:test` cobrindo: `concluida=false` ao criar, marcar, desmarcar, idempotência, `null` para id inexistente, ordem preservada e `listar()` retornando cópias

**Checkpoint**: `npm test` passa; repositório pronto para as rotas e a view.

---

## Phase 3: User Story 1 - Marcar Tarefa como Concluída (Priority: P1) MVP

**Goal**: Cada tarefa exibe um checkbox rotulado; marcar grava como concluída e exibe o título riscado, sem sair da lista e sem persistência perdida ao recarregar.

**Independent Test**: Em `GET /`, marcar uma tarefa pendente (`POST /tarefas/:id/conclusao` com `concluida=on`) e verificar `302 /#tarefa-<id>`, `checked` + classe `concluida` no `GET /` seguinte e a tarefa ainda presente na lista (quickstart #1, #2, #3).

- [X] T003 [US1] Em `src/app.js`, implementar `POST /tarefas/:id/conclusao` conforme `contracts/http-conclusao.md`: validar `:id` com `/^\d+$/`; ler `concluida` apenas por presença no corpo (`express.urlencoded` já ativo ou adicionar se faltar); chamar `repositorio.definirConclusao`; sucesso `302` para `/#tarefa-<id>`; id inválido/inexistente `404` re-renderizando `index` com "Tarefa não encontrada." (FR-003, FR-007, FR-008); erro inesperado `500` com "Não foi possível atualizar a tarefa. Tente novamente." sem stack trace; estender `test/app.test.js` com casos de 302, 404 (inexistente e id não numérico), 500 (repositório que lança), persistência entre POST e GET e título escapado
- [X] T004 [P] [US1] Em `views/index.ejs`, renderizar por tarefa `<li id="tarefa-<id>" data-id="<id>">` (classe `concluida` quando concluída) com `<form method="post" action="/tarefas/<id>/conclusao">`, `<input type="checkbox" id="tarefa-<id>-concluida" name="concluida">` com `checked` se e somente se concluída, `<label for="tarefa-<id>-concluida">` com o título escapado por `<%= %>` e `<button type="submit">Salvar</button>` (FR-001, FR-002, FR-009); estender `test/app.test.js` verificando essa marcação no `GET /`
- [X] T005 [US1] Em `views/index.ejs`, adicionar o CSS `.concluida` com `text-decoration: line-through` aplicado ao título e `overflow-wrap` para títulos longos (FR-004), a mensagem de erro `<p class="erro" role="alert">` exibida quando a rota fornecer erro (FR-008, SC-005) e o script inline de melhoria progressiva que submete o formulário no `change` do checkbox e oculta o botão "Salvar" (SC-001); sem regra de negócio no script; estender `test/app.test.js` para a classe `.concluida` e o `role="alert"` nas respostas 404/500

**Checkpoint**: US1 funcional e testável sozinha (MVP); `npm test` passa.

---

## Phase 4: User Story 2 - Desmarcar Tarefa Concluída (Priority: P2)

**Goal**: Desmarcar o checkbox devolve a tarefa ao estado pendente, sem risco, persistido ao recarregar.

**Independent Test**: Marcar uma tarefa e depois enviar `POST /tarefas/:id/conclusao` sem o campo `concluida`; verificar `302`, ausência de `checked` e da classe `concluida` no `GET /` seguinte (quickstart #4).

- [ ] T006 [US2] Estender `test/app.test.js` com os casos de desmarcar via `POST /tarefas/:id/conclusao` sem o campo `concluida` (FR-006): volta a pendente, persiste após novo `GET /`, ordem da lista inalterada e repetição do mesmo estado idempotente (sem erro nem duplicação); ajustar a rota em `src/app.js` e/ou a marcação em `views/index.ejs` somente se algum desses casos falhar

**Checkpoint**: US1 e US2 funcionam de forma independente; `npm test` passa.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [ ] T007 Executar `npm test` completo e confirmar código de saída 0 (ver Pendências)
- [ ] T008 [P] Percorrer os cenários manuais de `specs/001-marcar-tarefa-concluida/quickstart.md` (teclado #5, título longo, única tarefa, com e sem JavaScript) e corrigir em `views/index.ejs` ou `src/app.js` qualquer divergência encontrada (FR-009, SC-001, SC-004)

---

## Dependencies & Execution Order

- Phase 1 (T001) -> Phase 2 (T002) -> US1 (T003..T005) -> US2 (T006) -> Polish (T007, T008).
- T003 depende de T002. T004 depende de T002 e é [P] com T003 (arquivos diferentes: `views/index.ejs` x `src/app.js`), mas ambos alteram `test/app.test.js`, portanto os trechos de teste devem ser integrados sem conflito. T005 depende de T004 (mesmo arquivo `views/index.ejs`).
- T006 depende de T003 e T004. T008 pode rodar em paralelo com T007.
- US2 reutiliza a rota e a view de US1; é independente em comportamento, mas a implementação é entregue pela fase US1 (idempotência de `definirConclusao` e leitura do campo por presença).

## Parallel Example

```text
Após T002:  T003 (src/app.js + test/app.test.js)  ||  T004 (views/index.ejs)
Polish:     T007 (npm test)  ||  T008 (quickstart manual)
```

## Cobertura de Requisitos

| Requisito | Tarefas |
|-----------|---------|
| FR-001 | T004 |
| FR-002 | T004 |
| FR-003 | T002, T003 |
| FR-004 | T005 |
| FR-005 | T002, T004, T006 |
| FR-006 | T002, T006 |
| FR-007 | T002, T003 |
| FR-008 | T003, T005 |
| FR-009 | T004, T008 |
| SC-001..SC-005 | T003, T005, T006, T008 |

## Implementation Strategy

- **MVP**: Phases 1 a 3 (T001..T005), entregando US1 completa; validar com `npm test` e quickstart #1..#3.
- **Incremento**: Phase 4 (US2) e Polish.
- Os testes de aceite em `test/aceite/` são responsabilidade do QA (E5), fora desta lista.

## Pendências / Observações

- Persistência apenas em memória (perde o estado ao reiniciar o processo); atende FR-007 por recarregamento de página, conforme plan.md.
- Não há lint nem build; o único gate é `npm test`.
