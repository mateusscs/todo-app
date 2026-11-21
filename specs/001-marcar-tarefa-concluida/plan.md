# Implementation Plan: Marcar Tarefa como Concluída

**Branch**: `001-marcar-tarefa-concluida` | **Date**: 2026-11-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-marcar-tarefa-concluida/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Cada tarefa da lista passa a exibir uma caixa de seleção com o título como rótulo; marcá-la grava a
tarefa como concluída no servidor e o título aparece riscado, sem sair da lista nem mudar de posição;
desmarcá-la volta ao estado pendente (US1, US2; FR-001..FR-009).

Abordagem técnica (detalhes em [research.md](./research.md)):

- **Dados** (`src/tarefas.js`): novo campo booleano `concluida` (padrão `false`) e novo método
  idempotente `definirConclusao(id, concluida)` no repositório em memória existente (D1, D2).
- **Rota** (`src/app.js`): `POST /tarefas/:id/conclusao`; a presença do campo `concluida` no
  formulário define o estado; sucesso → `302 /#tarefa-<id>` (PRG); id inválido ou inexistente →
  `404` com a página da lista e mensagem em `role="alert"`; erro inesperado → `500` com mensagem
  genérica (D3, D5, D6). Contrato: [contracts/http-conclusao.md](./contracts/http-conclusao.md).
- **View** (`views/index.ejs`): um `<form>` por tarefa com `<input type="checkbox">` + `<label>` +
  botão "Salvar" (fallback sem JS); script inline de melhoria progressiva envia no `change` e oculta
  o botão; CSS `.concluida { text-decoration: line-through }` (D4, D7).
- **Testes**: `node:test` + `fetch` nativo, sem dependências novas (D8).

## Technical Context

**Language/Version**: JavaScript (CommonJS) em Node.js 22 LTS (constituição e CI; `package.json` declara `>=20`)

**Primary Dependencies**: Express 4 (`^4.21.2`), EJS (`^3.1.10`) — nenhuma dependência nova

**Storage**: Repositório em memória em `src/tarefas.js` (já existente). Sem banco de dados e, portanto, sem migrações; o estado persiste entre recarregamentos de página enquanto o processo estiver ativo, que é o exigido por FR-007/SC-003

**Testing**: `node:test` (runner nativo) + `node:assert/strict` + `fetch` nativo contra `criarApp(criarRepositorio()).listen(0)`

**Comandos de verificação** (critério de avanço do orquestrador):

| Tipo | Comando | Situação |
|------|---------|----------|
| Teste (obrigatório) | `npm test` (executa `node --test`) | Existe; deve sair com código `0`. Executado também pelo CI (`.github/workflows/ci.yml`) |
| Cobertura | `node --test --experimental-test-coverage` | Informativo; a constituição **não** define cobertura mínima, portanto não é gate |
| Lint | — | **Não existe** no projeto e não é exigido pela constituição; não será adicionado (princípio I) |
| Build / typecheck | — | **Não existem** (JavaScript sem etapa de build) |

**Diretórios de testes**: testes unitários e de integração do Desenvolvedor em `test/` (`test/tarefas.test.js` para o repositório; `test/app.test.js` para rotas); testes de aceite do QA em `test/aceite/` (ex.: `test/aceite/marcar-tarefa-concluida.test.js`), descobertos automaticamente por `node --test`.

**Dados de teste**: cada teste cria seu próprio repositório (`criarRepositorio()`) e servidor em porta `0`; nenhum estado compartilhado, nenhuma rede externa.

**Variáveis de ambiente**: nenhuma nova. Existente: `PORT` (opcional, padrão `3000`); os testes não a usam. Nenhum segredo envolvido.

**Target Platform**: Servidor Node.js (Linux no CI; Windows/macOS em desenvolvimento) servindo HTML para navegadores modernos, com e sem JavaScript

**Project Type**: Aplicação web server-side renderizada (Express + EJS), projeto único

**Performance Goals**: Não há meta numérica na spec; uma requisição POST + redirect por interação, com operação O(n) sobre a lista em memória (escala de demonstração)

**Constraints**: Sem JavaScript obrigatório; sem `localStorage`; indicador visual apenas `line-through`; sem filtro e sem reordenação; escaping padrão do EJS ativo; interface em pt-BR

**Scale/Scope**: Uma tela (`views/index.ejs`), uma rota nova, um método novo no repositório; ~3 arquivos de produção alterados

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Verificação | Pré-pesquisa | Pós-design |
|-----------|-------------|--------------|------------|
| I. Simplicidade Primeiro | Nenhuma dependência nova; reuso do repositório em memória; script inline mínimo opcional em vez de pasta estática; sem toggle/rotas duplicadas | PASS | PASS |
| II. Testes Obrigatórios | Testes `node:test` para repositório, rota e aceite; `npm test` como gate; testes determinísticos (porta 0, repositório isolado) | PASS | PASS |
| III. Código Limpo e Legível | Identificadores em português (`concluida`, `definirConclusao`, `/tarefas/:id/conclusao`); dados em `src/tarefas.js`, rota em `src/app.js`, apresentação em `views/`; o script da view só dispara submissão nativa (sem regra de negócio) | PASS | PASS |
| IV. Segurança Básica | `:id` validado (`/^\d+$/`) no servidor; `concluida` lido apenas por presença; título continua escapado com `<%= %>`; erro 500 sem stack trace; nenhum segredo | PASS | PASS |
| V. Entrega por Pull Request | Trabalho na branch da feature; PR com CI (`npm test`) e aprovação humana; merge pelo humano | PASS | PASS |
| VI. Acessibilidade e UX | `<form>`, `<label for>` por checkbox, `<button>`, checkbox nativo operável por teclado, `role="alert"` em erros, foco/rolagem retornam à tarefa via `#tarefa-<id>`; estado também exposto por `checked` | PASS | PASS |
| Restrições Técnicas | Node 22, Express 4, EJS, npm, `node:test`, pt-BR | PASS | PASS |

Resultado: **PASS** sem violações; `Complexity Tracking` não se aplica.

## Project Structure

### Documentation (this feature)

```text
specs/001-marcar-tarefa-concluida/
├── spec.md              # Especificação aprovada (E1)
├── checklists/
│   └── requirements.md  # Checklist de qualidade da spec (E1)
├── plan.md              # Este arquivo
├── research.md          # Fase 0: decisões D1–D9
├── data-model.md        # Fase 1: entidade Tarefa + campo concluida
├── quickstart.md        # Fase 1: cenários de validação ponta a ponta
├── contracts/
│   └── http-conclusao.md  # Fase 1: contrato HTTP/HTML
└── tasks.md             # Fase 2 (speckit-tasks — NÃO criado por este comando)
```

### Source Code (repository root)

```text
src/
├── app.js        # ALTERAR: rota POST /tarefas/:id/conclusao, validação de id, tratamento 404/500
├── server.js     # inalterado
└── tarefas.js    # ALTERAR: campo concluida (false ao criar) + definirConclusao(id, concluida)

views/
└── index.ejs     # ALTERAR: form + checkbox + label + botão Salvar por tarefa; classe .concluida
                  #          (line-through, overflow-wrap); role="alert" na mensagem de erro;
                  #          script inline de melhoria progressiva

test/
├── app.test.js   # ALTERAR (Dev): casos HTTP da rota nova (302, 404 id inexistente/inválido,
│                 #   idempotência, renderização de checked/.concluida)
├── tarefas.test.js  # NOVO (Dev): testes unitários de definirConclusao e concluida=false ao criar
└── aceite/
    └── marcar-tarefa-concluida.test.js  # NOVO (QA): cenários de aceite de US1/US2 e edge cases
```

**Structure Decision**: Projeto único já existente (Express + EJS), mantendo a separação de camadas
exigida pelo princípio III. Nenhuma pasta nova de produção; apenas `test/aceite/` para os testes de
aceite do QA.

### Rastreabilidade

| Requisito / critério | Onde é atendido | Verificação |
|----------------------|-----------------|-------------|
| FR-001, US1-AS2 | `index.ejs`: checkbox por tarefa | teste HTTP de `GET /` + quickstart #1 |
| FR-002 | `index.ejs`: `<label for="tarefa-<id>-concluida">` | teste HTTP (marcação) + quickstart #1 |
| FR-003, US1-AS1 | `definirConclusao(id, true)` + rota | unitário + HTTP + aceite |
| FR-004 | classe `.concluida` + CSS `line-through` | teste HTTP (classe presente) + quickstart #2 |
| FR-005 | `listar()` inalterado na ordem; nada é removido | aceite (lista com N itens após marcar) |
| FR-006, US2-AS1 | `definirConclusao(id, false)` (campo ausente) | unitário + HTTP + aceite |
| FR-007, US1-AS3, US2-AS2, SC-003 | estado no repositório do servidor; PRG | aceite (POST seguido de GET) |
| FR-008, SC-005 | 404/500 re-renderizam estado real + `role="alert"` | HTTP (404 + `role="alert"`) + quickstart #8 |
| FR-009, SC-004 | checkbox nativo + label + botão; foco via fragmento | quickstart #5 (manual) |
| SC-001 | 1 interação com JS; 2 sem JS | quickstart #2, #11 |
| SC-002 | resposta re-renderiza a lista com o novo estado | aceite + quickstart #2 |
| Edge cases | idempotência (D2), título longo (`overflow-wrap`), única tarefa | HTTP/aceite + quickstart #6, #7, #10 |

### Riscos e pontos de atenção

- **Persistência só em memória**: o estado se perde ao reiniciar o servidor (comportamento atual do
  projeto, inclusive para os títulos). Atende à spec (recarregamento de página), mas é registrado
  como pendência informativa ao orquestrador.
- **SC-001 sem JavaScript**: sem JS são 2 interações (caixa + "Salvar"), dentro do limite de SC-001;
  com JS, 1 interação, como narra US1 (research D4).
- **Versão do Node**: CI e constituição usam Node 22; `engines` aceita `>=20`. Sem impacto nesta
  feature (APIs usadas existem desde o Node 18).
- **Foco após recarga**: o retorno do foco usa a navegação por fragmento do navegador; a verificação
  é manual (quickstart #5), pois não há testes de navegador no projeto.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Não se aplica: o Constitution Check não apresentou violações.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
