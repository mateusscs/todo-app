# Relatório de Revisão de Código: Marcar Tarefa como Concluída

**Feature**: `001-marcar-tarefa-concluida` | **Etapa**: E5, rodada 1 | **Data**: 2026-11-21
**Intervalo revisado**: `main...HEAD` (HEAD `2cb098f`)
**Arquivos revisados**: `src/app.js`, `src/tarefas.js`, `views/index.ejs`, `test/app.test.js`, `test/tarefas.test.js`
**Referências**: `.specify/memory/constitution.md` v1.0.0, `spec.md`, `plan.md`, `research.md` (D1–D9), `data-model.md`, `contracts/http-conclusao.md`, `quickstart.md`, `tasks.md`

## Verificação executada

- `npm test`: 23 testes, 23 aprovados, 0 falhas; código de saída `0`.
- Lint/build: não existem no projeto (premissa ratificada).

## Resumo

A implementação é pequena, aderente ao contrato HTTP e ao modelo de dados, respeita as camadas
(repositório em `src/tarefas.js`, rota em `src/app.js`, apresentação em `views/`), mantém o escaping
padrão do EJS (`<%= %>`) e não introduz dependências. Os testes usam `node:test`, são determinísticos
(servidor efêmero na porta 0, repositório novo por teste) e cobrem FR-001..FR-008 no nível HTTP/HTML.
FR-009/SC-004 (uso só com teclado) é atendido pela marcação nativa (checkbox + label + botão), mas a
confirmação em navegador continua pendente (ver Pendências).

**Não há apontamentos bloqueantes**: nenhum Crítico e nenhuma violação da constituição.

## Apontamentos (ordenados por severidade)

| # | Severidade | Bloqueante | Arquivo:linha | Resumo |
|---|------------|------------|---------------|--------|
| 1 | Médio | Não | `views/index.ejs:40` | Botões "Salvar" idênticos, sem contexto para leitor de tela |
| 2 | Baixo | Não | `src/app.js:25-26,41` | Falha em `listar()` dentro de `renderizarErro` escapa do `try/catch` |
| 3 | Baixo | Não | `views/index.ejs:17` | Cor cinza extra em tarefas concluídas diverge da premissa da spec |
| 4 | Baixo | Não | `test/app.test.js` (teste "respostas 404 e 500 exibem a mensagem com role=\"alert\"") | Nome do teste promete 404 e 500, mas só exercita 404 |
| 5 | Sugestão | Não | `src/app.js:24` | Sem proteção CSRF nas rotas POST |
| 6 | Sugestão | Não | `views/index.ejs:22-53` | Página sem `<main>` (pré-existente) |

### 1. Médio: botões "Salvar" sem nome acessível distinto

- **Arquivo/linha**: `views/index.ejs:40` (`<button type="submit">Salvar</button>`).
- **Problema**: sem JavaScript, cada tarefa tem um botão com o mesmo nome acessível, "Salvar". Quem usa
  leitor de tela e navega por botões (ou pela lista de controles) ouve "Salvar, botão" N vezes, sem saber
  a qual tarefa cada um se refere. O princípio VI pede controles acessíveis e utilizáveis só com teclado,
  e o fluxo sem JS (premissa ratificada: caixa + "Salvar") depende desse botão.
- **Impacto**: usabilidade reduzida com tecnologia assistiva no modo sem JS. O fluxo com JS não é afetado,
  porque o botão fica oculto.
- **Correção esperada**: manter o texto visível "Salvar" (exigido pelo contrato e pelos testes) e adicionar
  o contexto de forma acessível sem mudar o texto visível. Por exemplo, um trecho visualmente oculto dentro
  do botão, como `<button type="submit">Salvar<span class="visualmente-oculto"> "<%= tarefa.titulo %>"</span></button>`,
  com a classe CSS `visualmente-oculto` padrão (clip/position absolute). Outra opção é
  `aria-describedby="tarefa-<id>-rotulo"` apontando para um `id` no `<label>`. Atenção: o teste
  `GET / renderiza formulário...` hoje casa `/<button type="submit">Salvar<\/button>/`. Se a marcação mudar,
  ajuste o teste para continuar verificando o texto "Salvar" e o novo vínculo. Se a mudança alterar o
  contrato (`contracts/http-conclusao.md`), reporte ao orquestrador antes, em vez de editar o artefato.

### 2. Baixo: falha em `listar()` durante o tratamento de erro escapa do `try/catch`

- **Arquivo/linha**: `src/app.js:25-26` (`renderizarErro` chama `repositorio.listar()`) e `src/app.js:41`
  (chamada dentro do `catch`); também `src/app.js:29` (404 de id inválido, fora do `try`).
- **Problema**: se `listar()` lançar exceção, ela sai do `catch` e cai no handler padrão do Express. Esse
  handler devolve o stack trace no corpo quando `NODE_ENV !== 'production'`, e o `npm start` não define
  `NODE_ENV`. A premissa do Desenvolvedor ("falha em `listar()` cai no handler padrão do Express") está
  correta e é aceitável para o repositório em memória atual, onde `listar()` não falha. O mesmo
  comportamento já existe em `GET /` e `POST /tarefas`.
- **Impacto**: baixo hoje. O risco aparece se a persistência mudar (por exemplo, para arquivo ou banco).
  Não viola a constituição, que restringe o stack trace "em produção".
- **Correção esperada (opcional nesta feature)**: nenhuma ação obrigatória. Se quiser endurecer, registre
  um handler de erro final em `criarApp`, por exemplo
  `app.use((err, req, res, next) => res.status(500).send('Erro interno.'))`, para nunca expor detalhes
  independentemente de `NODE_ENV`. Registre como premissa/pendência na descrição do PR.

### 3. Baixo: cor adicional em tarefas concluídas

- **Arquivo/linha**: `views/index.ejs:17` (`li.concluida label { text-decoration: line-through; color: #64748b; }`).
- **Problema**: a spec, em Assumptions, diz que "o indicador visual de conclusão é o risco no texto [...];
  não serão adicionados ícones ou cores adicionais nesta versão". A regra adiciona a cor `#64748b`.
- **Impacto**: pequeno. O contraste de `#64748b` sobre branco é de cerca de 4,8:1, que passa no WCAG AA
  para texto normal, então não há violação do princípio VI. É só um desvio da premissa da spec.
- **Correção esperada**: remover `color: #64748b;` da regra e manter só o `text-decoration: line-through`.
  Se a cor for desejada, registrar a divergência para o orquestrador ou humano decidir, em vez de manter
  silenciosamente. Os testes não dependem da cor.

### 4. Baixo: nome de teste promete mais do que verifica

- **Arquivo/linha**: `test/app.test.js`, teste `'respostas 404 e 500 exibem a mensagem com role="alert"'`
  (cerca da linha 165).
- **Problema**: o teste só faz um POST para id inexistente (404). O caso 500 está coberto por outro teste
  (`POST conclusao responde 500 sem stack trace...`), mas o nome induz a erro sobre a cobertura.
- **Impacto**: legibilidade/rastreabilidade da suíte. Não é um falso positivo.
- **Correção esperada**: renomear para `'resposta de erro exibe a mensagem em <p class="erro" role="alert">'`
  ou incluir no mesmo teste a verificação do 500 com um repositório que lança exceção.

### 5. Sugestão: ausência de proteção CSRF

- **Arquivo/linha**: `src/app.js:24` (`app.post('/tarefas/:id/conclusao', ...)`), assim como o `POST /tarefas` existente.
- **Problema**: um site de terceiros pode submeter um formulário que altera o estado das tarefas. Como a
  aplicação não tem autenticação nem dados sensíveis, e o padrão já existe no projeto, o impacto é mínimo
  e a constituição não exige CSRF.
- **Correção esperada**: nenhuma nesta feature (YAGNI). Registrar como item para uma futura feature de autenticação.

### 6. Sugestão: página sem marco `<main>` (pré-existente)

- **Arquivo/linha**: `views/index.ejs:22-53` (conteúdo direto no `<body>`).
- **Problema**: o princípio VI cita `<main>` entre os elementos semânticos esperados. A ausência vem de
  antes desta feature e está fora do escopo do diff.
- **Correção esperada**: nenhuma obrigatória aqui. Se o Desenvolvedor tocar a view de novo, pode envolver
  o conteúdo em `<main>` sem impacto nos testes atuais.

## Avaliação das premissas do Desenvolvedor

- **`line-through` aplicado ao `label` dentro de `li.concluida`**: aceita. O contrato diz que ".concluida
  aplica `text-decoration: line-through` ao título" e o título está no `label`. A classe fica no `<li>`,
  como no contrato, e o risco se aplica ao título inteiro, inclusive com `overflow-wrap: anywhere` para
  títulos longos. A ressalva é só a cor extra (apontamento 3).
- **500 cobre falhas em `definirConclusao`; falha em `listar()` vai para o handler padrão do Express**:
  aceita com ressalva Baixa (apontamento 2). É consistente com research D5 e com as rotas existentes.

## Aderência verificada

| Item | Resultado | Evidência |
|------|-----------|-----------|
| FR-001 checkbox por tarefa | OK | `views/index.ejs:38`; teste "GET / renderiza formulário..." |
| FR-002 label associado | OK | `for`/`id` únicos `tarefa-<id>-concluida` (`views/index.ejs:38-39`) |
| FR-003 / FR-006 marcar e desmarcar com persistência | OK | `src/tarefas.js` `definirConclusao`; rota `src/app.js:24-43`; testes de marcar, desmarcar e persistir |
| FR-004 risco | OK (ver #3) | `views/index.ejs:17` |
| FR-005 todas visíveis, ordem preservada | OK | testes "preserva ordem" (repositório e HTTP) |
| FR-007 persistência entre recarregamentos | OK (em memória, premissa ratificada) | GET após POST nos testes |
| FR-008 erro acessível, estado real re-renderizado | OK | 404/500 com `role="alert"`, lista de `listar()` |
| FR-009 / SC-004 teclado | OK por construção (controles nativos); validação manual pendente | ver #1 |
| Contrato HTTP (302 `Location: /#tarefa-<id>`, 404, 500, presença de `concluida`) | OK | `src/app.js:28-42`; testes correspondentes |
| Data model (`concluida: false` na criação, `Boolean(...)`, `null` se inexistente, cópias) | OK | `src/tarefas.js:15-31`; `test/tarefas.test.js` |
| I. Simplicidade | OK | sem dependências novas; JS de melhoria progressiva com 6 linhas |
| II. Testes `node:test`, `npm test` = 0 | OK | 23/23 |
| III. Código limpo/camadas, nomes em pt-BR | OK | conversão do corpo na rota e escrita no repositório (D6) |
| IV. Validação/escaping/sem stack trace | OK (ver #2) | `/^\d+$/` no id; `<%= %>`; teste de XSS; teste de 500 sem stack |
| VI. Acessibilidade | OK com ressalva (ver #1, #6) | label, `role="alert"`, contraste AA |
| Segredos/`.env` | OK | `.env` no `.gitignore`; nenhum segredo no diff |
| Migrações | Não se aplica | persistência em memória (D9) |
| Complexity Tracking | Não se aplica | nenhuma violação encontrada |

## Qualidade dos testes

- Verificam comportamento observável (status, `Location`, HTML renderizado) e regras do repositório,
  incluindo idempotência, ordem, cópias defensivas, 404 numérico e não numérico, 500 sem vazamento e
  escaping de título.
- Não encontrei falsos positivos. Os casos de desmarcar isolam o `<li>` antes de verificar a ausência de `checked`.
- O teste de CSS/script (`addEventListener('change'`) verifica só a presença do texto. Isso é aceitável
  dado o escopo, e a confirmação de comportamento fica para a verificação manual.

## Pendências registradas (não resolvidas nesta etapa)

- Verificações manuais em navegador pendentes: quickstart #5 (teclado/foco e retorno de rolagem à tarefa
  pelo fragmento `#tarefa-<id>`), #7 (layout visual com título de cerca de 300 caracteres) e #11 (fluxo
  sem JavaScript). Também falta conferir o submit automático com JS, conforme
  `notes/e4-verificacao-quickstart.md`.

## Parecer

**aprovado com ressalvas**: nenhum apontamento bloqueante. Os apontamentos 1 a 6 não bloqueiam e devem
constar na descrição do PR (ou ser corrigidos pelo Desenvolvedor, se o orquestrador decidir).

---

## Revisão dos testes do QA (E6)

**Escopo:** só `test/aceite/marcar-tarefa-concluida.test.js` (commit `62014fe`, intervalo `2cb098f..HEAD`).
O código de produção não foi reaberto.
**Execução:** `npm test`: 43 testes, 43 passaram, 0 falhas (Node v24.14.1).

### Avaliação geral

- **Determinismo:** cada teste cria um repositório próprio (`criarRepositorio()`) e um servidor próprio em porta
  efêmera (`listen(0)`), fechado no `finally`. Os testes não dependem de rede externa nem de ordem de execução
  ou estado compartilhado. O teste concorrente (12 requisições em paralelo) verifica só invariantes que não
  dependem da ordem de chegada. Por isso não é intermitente.
- **Correção frente à spec e ao contrato:** as asserções seguem o contrato `contracts/http-conclusao.md`:
  302 com `Location: /#tarefa-<id>`, 404 para id inválido ou inexistente, 500 com mensagem genérica e sem stack
  trace, presença ou ausência de `concluida`, marcação HTML por tarefa e `role="alert"`. Também seguem os cenários
  US1/US2, os edge cases e FR-001 a FR-009 / SC-002 a SC-005. Não encontrei falso positivo: os estados são lidos do
  `<li>` isolado, e os testes de "não alterar as demais" comparam título, classe e `checked` de cada tarefa.
- **Legibilidade:** os nomes dos testes trazem rastreabilidade (`[US1-AS1, FR-003...]`). Os helpers são pequenos e
  coesos (`criar`, `definir`, `estado`, `idsNaLista`), e o cabeçalho lista o que não é coberto (verificação manual).
- **Constituição:** usa `node:test` e `node:assert/strict`, sem dependências novas, com nomes em pt-BR. Atende ao princípio II.

### Apontamentos (ordenados por severidade)

Nenhum apontamento **Crítico** e nenhuma violação da constituição.

1. **Baixo**: `test/aceite/marcar-tarefa-concluida.test.js:14` e `:19`, ciclo de vida do servidor no helper `comServidor`.
   - **Problema:** `listen(0)` sem host escuta em todas as interfaces (no Windows pode abrir aviso de firewall e
     expõe a porta na rede durante os testes). Além disso, `servidor.address()` é lido de forma síncrona logo após
     `listen`, e `servidor.close()` não é aguardado. Funciona no Node 20+ para TCP, mas depende de detalhe de
     implementação e pode deixar o fechamento pendente entre testes.
   - **Correção:** `const servidor = criarApp(repo).listen(0, '127.0.0.1'); await once(servidor, 'listening');`
     (com `once` de `node:events`) e, no `finally`, `await new Promise((r) => servidor.close(r));`.
2. **Baixo**: `test/aceite/marcar-tarefa-concluida.test.js:52-61` (`estado`) e `:59`.
   - **Problema:** `/\schecked>/` supõe que `checked` seja o último atributo do `<input>`. Se a view reordenar os
     atributos ou passar a usar `checked="checked"`, o teste falha de forma falsa. Além disso, quando o `<li>` não
     existe, `estado()` retorna `null` e o acesso `.concluida` lança `TypeError`, em vez de uma falha de asserção
     com mensagem clara.
   - **Correção:** usar `/\schecked(?=[\s>=\/])/`. Nos chamadores, ou dentro de `estado`, fazer
     `assert.ok(li, \`li da tarefa ${id} deve existir\`)` antes de ler os campos.
3. **Baixo**: `test/aceite/marcar-tarefa-concluida.test.js:217`, `:321`, `:323-324`, asserções acopladas ao texto da implementação.
   - **Problema:** as regex sobre CSS (`li label { ... overflow-wrap: anywhere`) e sobre o script
     (`addEventListener('change'`, `botao.hidden = true`) verificam a forma do código, não o comportamento. Uma
     refatoração equivalente quebra o teste. Já `doesNotMatch(li, /hidden/)` pode falhar de forma falsa se um
     título contiver a palavra "hidden".
   - **Correção:** aceitável no escopo atual, porque o comportamento real fica para a verificação manual já
     registrada. Se quiser endurecer, restringir a busca ao atributo (`/<button[^>]*\shidden[\s>=]/`) e manter
     as verificações de CSS/script como "presença mínima", com um comentário dizendo isso.
4. **Sugestão**: `test/aceite/marcar-tarefa-concluida.test.js:248`.
   - **Problema:** `typeof estado(html, 2).concluida === 'boolean'` é sempre verdadeiro quando o `<li>` existe.
     A asserção não acrescenta verificação, embora o resto do teste (status 302, ids, tarefas 1 e 3 intactas) tenha valor.
   - **Correção:** remover a linha ou trocar por um comentário explicando que o estado final da tarefa 2 depende
     da ordem de chegada e, por isso, não é verificado.

### Parecer (E6)

**aprovado com ressalvas**: os testes são determinísticos, corretos frente à spec e ao contrato, e não têm
falso positivo. Os apontamentos 1 a 4 não bloqueiam e podem ir para a descrição do PR ou ser ajustados pelo QA,
se o orquestrador decidir.
