# Quickstart: Marcar Tarefa como Concluída

**Feature**: `001-marcar-tarefa-concluida` | Contrato: [contracts/http-conclusao.md](./contracts/http-conclusao.md) | Modelo: [data-model.md](./data-model.md)

## Pré-requisitos

- Node.js 22 LTS (CI) — o `package.json` aceita `>=20`.
- Na raiz do repositório, na branch `001-marcar-tarefa-concluida`: `npm ci`.

## Verificação automatizada

```bash
npm test                                      # gate obrigatório: deve sair com código 0
node --test --experimental-test-coverage      # relatório de cobertura (informativo)
```

Lint e build/typecheck: não existem neste projeto.

## Validação manual ponta a ponta

```bash
npm start   # http://localhost:3000 (ou PORT)
```

| # | Cenário | Passos | Resultado esperado | Rastreio |
|---|---------|--------|--------------------|----------|
| 1 | Caixa por tarefa | Adicione "Comprar pão" e "Ler livro" | Cada item mostra uma caixa de seleção com o título como rótulo; clicar no título marca a caixa | US1-AS2, FR-001, FR-002 |
| 2 | Marcar | Marque a caixa de "Comprar pão" (com JS: só o clique; sem JS: clique + "Salvar") | Título riscado, tarefa continua na lista, na mesma posição | US1-AS1, FR-003, FR-004, FR-005, SC-001, SC-002 |
| 3 | Persistência | Recarregue a página (F5) | "Comprar pão" continua riscada e com a caixa marcada | US1-AS3, FR-007, SC-003 |
| 4 | Desmarcar | Desmarque a caixa de "Comprar pão" e recarregue | Título sem risco, caixa desmarcada | US2-AS1, US2-AS2, FR-006 |
| 5 | Só teclado | Use `Tab` até a caixa, `Espaço` para alternar (sem JS: `Tab` até "Salvar" e `Enter`) | Estado alterado; o foco/rolagem volta para a tarefa alterada | FR-009, SC-004 |
| 6 | Única tarefa | Com uma única tarefa, marque-a | Continua visível, riscada | Edge case |
| 7 | Título longo | Adicione um título com ~300 caracteres e marque-o | Risco em todo o texto, sem estourar o layout | Edge case |
| 8 | Falha (tarefa inexistente) | `curl -i -X POST -d concluida=on http://localhost:3000/tarefas/999/conclusao` | `404`, HTML com "Tarefa não encontrada." em `role="alert"`; nenhuma tarefa alterada | FR-008, SC-005 |
| 9 | Id inválido | `curl -i -X POST http://localhost:3000/tarefas/abc/conclusao` | `404` com a mesma mensagem | Princípio IV |
| 10 | Cliques repetidos | Envie duas vezes seguidas `curl -X POST -d concluida=on .../tarefas/1/conclusao` | Tarefa 1 concluída (estado não se inverte) | Edge case, research D2 |
| 11 | Sem JavaScript | Desative JS no navegador e repita 2–4 | Botão "Salvar" visível; fluxo funciona | Premissa ratificada |
