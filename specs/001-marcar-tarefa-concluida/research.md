# Research: Marcar Tarefa como Concluída

**Feature**: `001-marcar-tarefa-concluida` | **Data**: 2026-11-21 | **Plano**: [plan.md](./plan.md)

Fase 0 do `speckit-plan`. Cada item registra a decisão, a justificativa e as alternativas avaliadas.
Não resta nenhuma incógnita técnica em aberto.

---

## D1. Onde e como persistir o estado de conclusão

- **Decisão**: Acrescentar o campo booleano `concluida` (padrão `false`) ao objeto de tarefa no
  repositório em memória existente (`src/tarefas.js`), com um novo método
  `definirConclusao(id, concluida)`.
- **Justificativa**: A premissa ratificada da spec exige persistência "no servidor, mesma camada de
  dados existente". O repositório em memória já é a camada de dados; ele sobrevive a recarregamentos
  de página (FR-007, SC-003), que é o que a spec pede. Respeita o princípio I (sem dependências novas)
  e o princípio III (acesso a dados só em `src/tarefas.js`).
- **Alternativas avaliadas**:
  - Arquivo JSON / SQLite: persistiria entre reinícios do servidor, mas isso não é requisito e
    adicionaria I/O, dependência ou estratégia de migração (rejeitado por YAGNI).
  - `localStorage` no cliente: explicitamente excluído pela spec.

## D2. Semântica da operação: "definir" em vez de "alternar"

- **Decisão**: A operação é idempotente: o cliente envia o estado desejado (`concluida` presente =
  concluída; ausente = pendente) e o servidor grava exatamente esse estado. Não há "toggle" no
  servidor.
- **Justificativa**: Atende ao edge case de cliques rápidos repetidos ("sem duplicação ou perda de
  estado"): reenviar o mesmo formulário produz o mesmo resultado, e o último envio prevalece. Um
  toggle no servidor inverteria o estado a cada reenvio (ex.: duplo envio ou F5 após POST) e
  divergiria do que o usuário vê na caixa.
- **Alternativas avaliadas**: rota `POST /tarefas/:id/alternar` (rejeitada pelo motivo acima); duas
  rotas `/concluir` e `/reabrir` (funciona, mas duplica rota e handler sem ganho).

## D3. Contrato HTTP

- **Decisão**: `POST /tarefas/:id/conclusao` com corpo `application/x-www-form-urlencoded`; campo
  `concluida=on` quando a caixa está marcada (ausente quando desmarcada, comportamento nativo do
  HTML). Sucesso: `302` para `/#tarefa-<id>`. Erros: `404` (tarefa inexistente ou id inválido)
  renderizando a página da lista com mensagem de erro. Detalhes em
  [contracts/http-conclusao.md](./contracts/http-conclusao.md).
- **Justificativa**: Formulários HTML só emitem GET/POST; usar POST evita `method-override` (nova
  dependência). O padrão POST → redirect → GET (PRG) já é usado em `POST /tarefas` e evita reenvio
  ao recarregar. O nome da rota está em português (princípio III).
- **Alternativas avaliadas**: `PATCH /tarefas/:id` via `fetch` (exige JavaScript obrigatório,
  contraria a premissa ratificada); `method-override` (dependência nova sem necessidade).

## D4. Interação sem JavaScript obrigatório e o critério SC-001

- **Decisão**: Cada tarefa é renderizada dentro de seu próprio `<form method="post">` contendo um
  `<input type="checkbox" name="concluida">` associado a um `<label>` com o título, e um
  `<button type="submit">Salvar</button>`. Como **melhoria progressiva**, um pequeno `<script>` inline
  na view (sem dependências) envia o formulário automaticamente no evento `change` da caixa e oculta
  os botões "Salvar" (atributo `hidden`).
  - Sem JavaScript: marcar a caixa + acionar "Salvar" = 2 interações (dentro do limite de SC-001).
  - Com JavaScript: 1 interação (clique ou `Espaço` na caixa), como descrito em US1.
- **Justificativa**: Um `<input type="checkbox">` não submete formulário sem JavaScript; a premissa
  ratificada proíbe JavaScript *obrigatório*, não JavaScript opcional. A melhoria progressiva entrega
  a experiência de US1 ("ao clicar na caixa...") quando há JS e permanece funcional e acessível sem
  ele. O script não contém lógica de negócio (só dispara a submissão nativa), mantendo o princípio III.
- **Alternativas avaliadas**:
  - Apenas checkbox + botão, sem script: cumpre SC-001 (2 interações), mas não a narrativa de 1 clique
    de US1; rejeitada como experiência padrão, mantida como fallback.
  - `<button role="checkbox" aria-checked>` estilizado: 1 clique sem JS, mas não é uma caixa de
    seleção nativa (FR-001) e exige ARIA manual; rejeitada.
  - Arquivo JS estático em `public/` + `express.static`: mais estrutura (nova pasta e middleware) para
    ~6 linhas; rejeitada por simplicidade.

## D5. Falha de persistência (FR-008, SC-005)

- **Decisão**: Em erro, o servidor responde com status de erro e re-renderiza `index` com a lista no
  **estado real do servidor** e a mensagem em um elemento com `role="alert"`. A mensagem de erro
  existente (`<p class="erro">`) passa a ter `role="alert"`, reutilizada por ambos os fluxos.
  - Tarefa inexistente / id inválido: `404`, mensagem "Tarefa não encontrada.".
  - Erro inesperado: tratado pelo mesmo `try/catch` da rota, `500`, mensagem genérica "Não foi
    possível atualizar a tarefa. Tente novamente." (sem stack trace — princípio IV).
- **Justificativa**: Como a página é re-renderizada a partir do servidor, a caixa e o risco refletem o
  estado persistido; logo, uma falha nunca deixa a interface mostrando um estado não salvo
  ("sem alterar o estado visual da tarefa"). `role="alert"` é anunciado por leitores de tela.
- **Falha de rede**: sem resposta do servidor, o navegador mostra sua própria página de erro e a
  tarefa não é alterada no servidor; ao voltar, a lista reflete o estado real. Não é tratável no
  servidor e não exige código adicional.
- **Alternativas avaliadas**: mensagens via query string/flash após redirect (exigiria sessão ou
  dependência `connect-flash`; rejeitada).

## D6. Validação de entrada (princípio IV)

- **Decisão**: O `:id` é aceito somente se casar com `/^\d+$/` e for convertido com `Number`; qualquer
  outro valor resulta em "não encontrada" (`404`). O campo `concluida` é interpretado como booleano
  pela presença (`req.body.concluida !== undefined`); nenhum valor do usuário é ecoado em HTML.
  A conversão do corpo para booleano fica na rota; a busca por id e a escrita ficam no repositório.
- **Justificativa**: Validação simples no servidor e escaping padrão do EJS (`<%= %>`) preservado.
- **Alternativas avaliadas**: biblioteca de validação (ex.: `express-validator`) — dependência nova
  desnecessária para um inteiro e um booleano.

## D7. Indicador visual, acessibilidade e foco

- **Decisão**: Classe CSS `concluida` no `<li>` (ou no rótulo) aplicando
  `text-decoration: line-through`; `overflow-wrap: anywhere` no rótulo para títulos longos. O id do
  checkbox é `tarefa-<id>-concluida`, ligado ao `<label for>`. O `<li>` recebe `id="tarefa-<id>"`; o
  redirect para `/#tarefa-<id>` leva a rolagem e o ponto de partida da navegação por teclado de volta
  à tarefa alterada. O estado concluído também é exposto pelo próprio checkbox (`checked`), que
  leitores de tela anunciam — o risco não é a única pista (não depender só de estilo).
- **Justificativa**: Atende FR-002, FR-004, FR-009, SC-004 e o princípio VI (HTML semântico, label,
  foco), e o edge case de título longo. Sem cores/ícones extras (premissa ratificada).
- **Alternativas avaliadas**: `<s>`/`<del>` no título (semântica de "conteúdo removido", inadequada
  para "concluído"); foco programático via `autofocus` com parâmetro na URL (mais código, ganho
  pequeno).

## D8. Estratégia de testes e comandos de verificação

- **Decisão**:
  - Teste: `npm test` (= `node --test`), comando já existente e executado pelo CI.
  - Cobertura: a constituição **não** exige percentual mínimo; o relatório é obtido com
    `node --test --experimental-test-coverage` (informativo, não é gate).
  - Lint: o projeto **não** possui linter e a constituição não exige; nenhum será adicionado
    (princípio I).
  - Build/typecheck: **não existem** (JavaScript CommonJS sem etapa de build).
  - Testes unitários do Desenvolvedor em `test/` (ex.: `test/tarefas.test.js` e casos HTTP em
    `test/app.test.js`); testes de aceite do QA em `test/aceite/` (descobertos automaticamente pelo
    `node --test`, que inclui `**/test/**/*.js`).
  - Testes usam `criarApp(criarRepositorio())` com porta `0` (padrão existente): determinísticos,
    sem rede externa nem estado compartilhado.
- **Justificativa**: Reaproveita o runner nativo exigido pelo princípio II; nada novo a instalar.
- **Alternativas avaliadas**: `supertest`/`jsdom` (dependências novas; `fetch` nativo + regex/
  `includes` sobre o HTML bastam); `c8` para cobertura (desnecessário com cobertura nativa).

## D9. Banco de dados, migrações e variáveis de ambiente

- **Decisão**: Não há banco de dados nem migração (repositório em memória). Nenhuma variável de
  ambiente nova; a única existente é `PORT` (opcional, padrão 3000), e os testes não dependem dela
  (usam porta `0`).
- **Justificativa**: Escopo da feature não toca configuração nem armazenamento externo.
- **Alternativas avaliadas**: não aplicável.
