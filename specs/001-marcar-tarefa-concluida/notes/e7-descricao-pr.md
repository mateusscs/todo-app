## Resumo

Permite marcar uma tarefa como concluída: cada tarefa da lista ganha uma caixa de seleção com rótulo acessível; ao marcar, o título aparece riscado e a tarefa continua na lista, na mesma posição. Desmarcar devolve a tarefa ao estado pendente. O estado é gravado no servidor e continua igual depois de recarregar a página.

- Spec: [`specs/001-marcar-tarefa-concluida/spec.md`](specs/001-marcar-tarefa-concluida/spec.md) (aprovada pelo humano no Checkpoint 1)
- Plano: `plan.md`, `research.md`, `data-model.md`, `contracts/http-conclusao.md`, `quickstart.md`
- Tarefas: `tasks.md` (T001–T008, todas concluídas)

### Mudanças
- `src/tarefas.js`: campo `concluida` (padrão `false`) e `definirConclusao(id, concluida)`, que grava o estado pedido (repetir o mesmo valor não altera nada).
- `src/app.js`: `POST /tarefas/:id/conclusao`. Sucesso: 302 para `/#tarefa-<id>`. Id inválido ou inexistente: 404 com mensagem em `role="alert"`. Erro inesperado: 500 genérico, sem stack trace.
- `views/index.ejs`: um formulário por tarefa (checkbox, `<label for>`, botão "Salvar" para quem está sem JS), classe `.concluida` com `line-through`, `overflow-wrap` para títulos longos e script inline que envia o formulário ao marcar a caixa.
- Testes: `test/tarefas.test.js` (novo), `test/app.test.js` (estendido), `test/aceite/marcar-tarefa-concluida.test.js` (QA).

## Requisitos cobertos
- **FR-001 a FR-008**: verificados por testes HTTP/HTML automatizados.
- **FR-009** (uso só pelo teclado): a estrutura (checkbox nativo, label e botão) é verificada pelos testes. O uso real com teclado depende de verificação manual.
- **SC-002, SC-003**: verificados automaticamente.
- **SC-001, SC-004, SC-005**: verificados parcialmente (estrutura). A parte de navegador está pendente (ver abaixo).

## Testes executados
| Comando | Resultado |
|---|---|
| `npm test` (execução local, após a sincronização com `origin/main`) | código 0, 43/43 aprovados (23 do Desenvolvedor e 20 de aceite do QA) |
| Mutantes do QA (em cópias descartáveis) | os testes de aceite falham como esperado (3 e 4 falhas) |

Lint e build não existem no projeto. O plano não incluiu cobertura mínima porque a constituição não exige uma.

## Parecer do Revisor de Código: aprovado com ressalvas
Sem apontamentos bloqueantes nem violações da constituição. Ressalvas não bloqueantes:
1. **Médio:** os botões "Salvar" têm todos o mesmo nome acessível. Sem JS, quem usa leitor de tela não sabe a qual tarefa cada um se refere (`views/index.ejs:40`).
2. **Baixo:** se `listar()` falhar dentro de `renderizarErro`, o erro vai para o handler padrão do Express, que mostra o stack trace fora de `production`.
3. **Baixo:** `color: #64748b` nas tarefas concluídas contraria a premissa "sem cores adicionais" (o contraste passa no AA).
4. **Baixo:** o nome de um teste cita 404 e 500, mas o teste só cobre 404.
5. **Sugestão:** sem proteção CSRF nos POST. Já existia antes desta feature.
6. **Sugestão:** a página não tem `<main>`. Já existia antes desta feature.

Revisão dos testes do QA, também aprovada com ressalvas (todas baixas): `listen(0)` sem host e `close()` sem `await`; uma regex de `checked` frágil; asserções sobre o texto do CSS e do script em vez do comportamento; uma asserção sempre verdadeira.

## Parecer do QA: aprovado com ressalvas
- **D1 (Média):** com JS, uma falha de rede no envio mostra a página de erro do navegador, e não a mensagem da aplicação. O cenário foi identificado por inspeção, não reproduzido. Também foi apontado pelo `speckit-analyze` (C1).
- **D2 (Baixa):** a cor extra nas tarefas concluídas (o mesmo item 3 do Revisor).

## Premissas assumidas
- Persistência no repositório em memória que já existe: o estado se perde quando o servidor reinicia (como já acontece hoje com as próprias tarefas) e continua igual entre recarregamentos de página.
- Sem JS, marcar uma tarefa exige 2 interações (caixa e "Salvar"), dentro do limite do SC-001. Com JS, basta 1 (research D4).
- `definirConclusao` grava o estado pedido em vez de inverter o atual.
- O `line-through` é aplicado ao `label` dentro de `li.concluida`.

## Dependências novas
Nenhuma.

## Pendências e riscos
- **Verificação manual em navegador ainda não feita:** quickstart #5 (teclado e retorno do foco), #7 (layout com título longo), #11 (sem JavaScript), envio automático com JS, leitor de tela real e falha de rede no navegador. Ver `specs/001-marcar-tarefa-concluida/notes/e4-verificacao-quickstart.md`.
- O Spec Kit 1.4.4.dev0 não tem o script `update-agent-context`, então o arquivo de contexto do agente não foi atualizado.
- Os scripts PowerShell do Spec Kit não puderam ser executados neste ambiente (política de execução). As etapas seguiram os templates diretamente.
- Achados do `speckit-analyze`: nenhum CRITICAL. F1 (T003 e T004 alteram o mesmo arquivo de teste e foram feitas em sequência), C1 (ver D1), B1 (2 interações sem JS) e E1 (tarefas de verificação sem FR associado).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
