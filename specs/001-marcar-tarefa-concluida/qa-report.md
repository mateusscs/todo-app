# Relatório de QA: Marcar Tarefa como Concluída

**Feature**: `001-marcar-tarefa-concluida` | **Etapa**: E6, rodada 1 | **Data**: 2026-11-21
**Branch**: `001-marcar-tarefa-concluida` (confirmada com `git branch --show-current`)
**Intervalo validado**: `main...HEAD` (HEAD `8390fb8`)
**Referências**: `spec.md` (US1, US2, edge cases, FR-001..FR-009, SC-001..SC-005), `plan.md`, `contracts/http-conclusao.md`, `data-model.md`, `quickstart.md`, `tasks.md`, `review-report.md`, `notes/e4-verificacao-quickstart.md`

## Parecer final

**aprovado com ressalvas**

- 0 defeitos Críticos ou Altos. 0 testes falhando.
- A entrega atende aos critérios de aceite de US1 e US2 e aos FR/SC verificáveis por HTTP e HTML renderizado.
- Ressalvas não bloqueantes: 1 defeito Médio (suspeita por inspeção, não reproduzida em navegador), 1 defeito Baixo (desvio de premissa de cor), e as verificações manuais em navegador listadas na seção 5.

## 1. Plano de testes

**Estratégia**: testes de aceite de integração em `node:test` com `fetch` nativo contra o app Express em porta efêmera (`listen(0)`), repositório novo por teste, sem rede externa e sem dependências novas. Os testes checam o comportamento observável (status, `Location`, HTML renderizado, CSS e marcação) e não detalhes internos.

**Fora do alcance automatizado** (sem navegador no projeto): foco e teclado em navegador real, layout visual, comportamento sem JavaScript e comportamento do submit automático com JS. Esses itens constam da seção 5 como verificação manual pendente, sem resultado inventado.

**Dados de teste**: títulos fixos (`Comprar pão`, `Ler livro`, etc.), um título de 300 caracteres sem espaços (pior caso de quebra) e um título com HTML (`<img src=x onerror=alert(1)>`). Nenhuma credencial, serviço externo ou segredo.

## 2. Rastreabilidade: cenário / FR / SC → teste → resultado

Arquivo de teste: `test/aceite/marcar-tarefa-concluida.test.js` (20 testes). Todos aprovados.

| Cenário / requisito | Teste de aceite | Resultado |
|---|---|---|
| US1-AS1 (marcar, título riscado, tarefa continua na lista) | `[US1-AS1, FR-003, FR-004, FR-005, SC-002] marcar tarefa pendente...` | Aprovado |
| US1-AS2 (caixa rotulada por item) | `[US1-AS2, FR-001, FR-002] cada tarefa exibe uma caixa...` | Aprovado |
| US1-AS3 (persistência após recarregar) | `[US1-AS3, FR-007, SC-003] estado concluído persiste...` | Aprovado |
| US2-AS1 (desmarcar volta a pendente) | `[US2-AS1, FR-006] desmarcar tarefa concluída...` | Aprovado |
| US2-AS2 (desmarcado persiste como pendente) | `[US2-AS2, FR-007, SC-003] tarefa desmarcada aparece como pendente...` | Aprovado |
| FR-001 (caixa por tarefa) | `[US1-AS2, FR-001, FR-002]` | Aprovado |
| FR-002 (label associado, ids únicos) | `[US1-AS2, FR-001, FR-002]`; `[FR-002] ids são únicos na página...` | Aprovado |
| FR-003 (marcar e persistir) | `[US1-AS1, ...]` | Aprovado |
| FR-004 (risco no título) | `[US1-AS1, ...]` (regra CSS `li.concluida label` com `line-through`) | Aprovado (verificação estática do CSS) |
| FR-005 (todas as tarefas visíveis, ordem preservada) | `[US1-AS1, ...]`; `[FR-005] marcar uma tarefa não altera título, ordem...` | Aprovado |
| FR-006 (desmarcar persistido) | `[US2-AS1, FR-006]` | Aprovado |
| FR-007 (persistência entre recarregamentos) | `[US1-AS3, ...]`; `[US2-AS2, ...]` | Aprovado |
| FR-008 (erro acessível, estado visual inalterado) | `[FR-008, SC-005, edge: falha] id inexistente responde 404...`; `[FR-008, edge: falha] erro interno responde 500...` | Aprovado (servidor). Falha de rede no cliente: ver defeito D1 |
| FR-009 (operável só com teclado) | `[FR-009, SC-004] controles são nativos...` (checkbox, label e button nativos; sem `onclick`, `tabindex` removendo foco, nem `role` improvisado) | Parcial: estrutura verificada; uso real com teclado pendente (seção 5) |
| SC-001 (até 2 interações; 1 com JS) | `[SC-001, premissa sem JS] o botão "Salvar"...` (botão no HTML do servidor; script de `change` e ocultação do botão) | Parcial: estrutura verificada; contagem real de interações pendente (seção 5) |
| SC-002 (estado refletido ao fim da interação) | `[SC-002] a interação de marcar termina com a página já exibindo o novo estado...` | Aprovado (servidor) |
| SC-003 (persistência em 100% dos casos sem erro de servidor) | `[US1-AS3, ...]`; `[US2-AS2, ...]`; `[contrato] presença do campo...` | Aprovado (dentro do armazenamento em memória, premissa ratificada) |
| SC-004 (controles operáveis só por teclado) | `[FR-009, SC-004] ...` | Parcial: estrutura verificada; teste de teclado pendente (seção 5) |
| SC-005 (erro perceptível por leitor de tela) | `[SC-005] erros de persistência são anunciados por elemento com role="alert"...`; `[FR-008, edge: falha] ...` | Aprovado (marcação `role="alert"`, não oculta). Leitor de tela real pendente |
| Edge: única tarefa marcada | `[edge: única tarefa] marcar a única tarefa...` | Aprovado |
| Edge: título longo | `[edge: título longo, FR-004] título de 300 caracteres...` (título completo, sem truncar; `overflow-wrap: anywhere`) | Aprovado (HTML/CSS). Layout visual pendente |
| Edge: cliques repetidos e rápidos | `[edge: cliques repetidos] alternar rapidamente em sequência...`; `[edge: cliques repetidos] requisições concorrentes...` | Aprovado (HTTP). Comportamento de UI com JS pendente |
| Contrato: id inválido/inexistente → 404 com alerta | `[contrato] id com formato inválido ou inexistente...` (`abc`, `1.5`, `-1`, `1e3`, `0`, ` 1`, id gigante) | Aprovado |
| Contrato: presença de `concluida` marca, ausência desmarca | `[contrato] presença do campo concluida...` (`on`, vazio, `off`; ausente) | Aprovado |
| Segurança básica: título escapado | `[FR-002, segurança básica] título com HTML é escapado...` | Aprovado |

## 3. Testes automatizados criados

- `test/aceite/marcar-tarefa-concluida.test.js`: 20 testes de aceite (criado nesta etapa).

Nenhum teste do Desenvolvedor foi alterado. Nenhum arquivo de produção foi alterado. Nenhum artefato do Spec Kit foi editado.

## 4. Relatório de execução

| # | Comando | Código de saída | Resultado |
|---|---|---|---|
| 1 | `git switch 001-marcar-tarefa-concluida` | 0 | Já na branch |
| 2 | `git branch --show-current` | 0 | `001-marcar-tarefa-concluida` |
| 3 | `npm test` (linha de base, antes dos testes de aceite) | 0 | 23 executados, 23 aprovados, 0 reprovados |
| 4 | `npm test` (após criar `test/aceite/`) | 0 | 43 executados, 43 aprovados, 0 reprovados |
| 5 | `node --test test/aceite/marcar-tarefa-concluida.test.js` | 0 | 20 executados, 20 aprovados, 0 reprovados |
| 6 | `npm test` (final, após pequena limpeza no teste de 500) | 0 | 43 executados, 43 aprovados, 0 reprovados |
| 7 | Verificação de sensibilidade (cópia descartável fora do projeto, mutante A: `definirConclusao` sempre marca como concluída) | 1 | 17 aprovados, 3 reprovados (US2-AS1, US2-AS2, contrato de presença/ausência) |
| 8 | Verificação de sensibilidade (cópia descartável, mutante B: alerta sem `role="alert"`) | 1 | 16 aprovados, 4 reprovados (404, 500, id inválido, SC-005) |

Os mutantes 7 e 8 foram aplicados em cópias descartáveis no scratchpad, nunca no projeto. Mostram que os testes de aceite detectam regressões reais.

**Cobertura**: a suíte cobre as rotas `GET /`, `POST /tarefas` e `POST /tarefas/:id/conclusao` e o repositório em memória. Não houve medição numérica de cobertura (`--experimental-test-coverage` não foi executado nesta rodada, por ser informativo segundo o `quickstart.md`).

**Lint e build**: não existem neste projeto (premissa ratificada). Não aplicável.

**Servidores**: nenhum servidor ficou em execução. Todos os testes usam `listen(0)` e fecham o servidor no `finally`.

## 5. Verificações manuais pendentes (sem resultado inventado)

Esses cenários exigem navegador real e não foram executados:

| Item | Origem | O que verificar |
|---|---|---|
| Teclado e foco | quickstart #5, FR-009, SC-004 | `Tab` até a caixa, `Espaço` alterna; sem JS, `Tab` até "Salvar" e `Enter`; após a ação, a página volta à tarefa alterada (`#tarefa-<id>`) |
| Layout com título longo | quickstart #7, edge case | Título de ~300 caracteres riscado, sem estourar o layout |
| Fluxo sem JavaScript | quickstart #11, premissa ratificada | Com JS desativado: caixa + "Salvar" altera o estado |
| Submit automático com JS | `notes/e4-verificacao-quickstart.md` | Um clique na caixa envia o formulário e reflete o estado |
| Leitor de tela | SC-005, FR-008 | Anúncio do alerta de erro e dos botões "Salvar" repetidos |
| Falha de rede com JS | D1 (abaixo) | Comportamento quando o servidor está inacessível |

## 6. Defeitos encontrados

Nenhum defeito Crítico ou Alto. Nenhum teste reprovado. Os itens abaixo são não bloqueantes.

### D1. Média: falha de rede no fluxo com JS não exibe mensagem da aplicação

- **Requisito**: edge case da spec ("erro de rede ou servidor"), FR-008, SC-005.
- **Severidade**: Média. Não bloqueante por ser um edge case, não um FR. Status: **suspeita por inspeção de código, não reproduzida** (exige navegador).
- **Passos para reproduzir**: com `npm start` rodando, abrir `http://localhost:3000` com JS ativo, adicionar uma tarefa, parar o servidor e clicar na caixa da tarefa.
- **Resultado esperado**: mensagem de erro acessível da aplicação, sem alterar o estado visual da tarefa (spec, edge case e FR-008).
- **Resultado obtido (por inspeção)**: o script inline chama `form.submit()` sem tratamento de erro. Se o servidor não responder, o navegador mostra a própria página de erro, fora da aplicação, e o `role="alert"` do app não aparece. Os erros 404 e 500 do servidor estão corretos (testados). O problema está só na falha de conexão.
- **Observação**: a premissa de submit nativo está ratificada, e a correção possível (fora do escopo desta rodada) seria um tratamento de erro no script; decisão do orquestrador.

### D2. Baixa: cor extra em tarefas concluídas diverge da premissa da spec

- **Requisito**: Assumptions da spec ("não serão adicionados ícones ou cores adicionais nesta versão"), FR-004.
- **Severidade**: Baixa. Não afeta FR nem SC. Confirmado por leitura estática.
- **Passos para reproduzir**: ler `views/index.ejs`, regra `li.concluida label { text-decoration: line-through; color: #64748b; }`.
- **Resultado esperado**: somente `text-decoration: line-through` no título concluído.
- **Resultado obtido**: a regra também define `color: #64748b`. O contraste sobre branco é adequado (WCAG AA), então não há violação de acessibilidade, só desvio da premissa. Concorda com o apontamento 3 do `review-report.md`.

### Observações (não são defeitos desta rodada)

- **Botões "Salvar" repetidos sem contexto para leitor de tela** (`review-report.md`, apontamento 1, Médio). A spec não exige nomes distintos. Fica para verificação manual com leitor de tela (seção 5).
- **Falha de `listar()` dentro do tratamento de erro** (`review-report.md`, apontamento 2, Baixo). Não reproduzível com o repositório atual, que não lança exceção em `listar()`.

## 7. Arquivos criados ou alterados nesta etapa

- `test/aceite/marcar-tarefa-concluida.test.js` (criado)
- `specs/001-marcar-tarefa-concluida/qa-report.md` (criado)

Para revisão pelo Revisor de Código: somente o arquivo de teste de aceite. Nenhum código de produção foi alterado.
