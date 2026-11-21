<!--
Sync Impact Report
==================
Version change: n/a → 1.0.0 (ratificação inicial)
Modified principles: n/a (versão inicial)
Added sections:
  - Core Principles (I. Simplicidade Primeiro, II. Testes Obrigatórios, III. Código Limpo e Legível,
    IV. Segurança Básica, V. Entrega por Pull Request, VI. Acessibilidade e UX)
  - Restrições Técnicas
  - Fluxo de Desenvolvimento
  - Governance
Removed sections: nenhuma
Deferred items: nenhum
-->

# Todo-App Constitution

## Core Principles

### I. Simplicidade Primeiro
Toda implementação MUST ser a solução mínima que atende à especificação aprovada. Dependências novas
MUST ser justificadas por escrito no `plan.md` (em `research.md` quando couber), demonstrando por
que a biblioteca padrão do Node.js 22 e as dependências já presentes não resolvem o problema.
Soluções especulativas, abstrações antecipadas e código "para o futuro" são proibidos (YAGNI).
Rationale: o projeto é pequeno e didático; complexidade incidental compromete manutenção, revisão
e estabilidade.

### II. Testes Obrigatórios (NON-NEGOTIABLE)
Toda funcionalidade de produção MUST ter testes automatizados escritos com o runner nativo
`node:test`. O comando `npm test` MUST executar toda a suíte e sair com código `0` antes de
qualquer PR ser aberto e novamente antes do merge. Correções de bug MUST incluir um teste que
reproduz o bug antes da correção. Testes MUST ser determinísticos e independentes de rede ou de
estado externo não controlado.
Rationale: testes são a única evidência objetiva de que a feature funciona e continua funcionando;
sem eles não há critério de aceite verificável.

### III. Código Limpo e Legível
Identificadores (variáveis, funções, rotas, arquivos de domínio) MUST ser em português, coerentes
com o idioma da interface (pt-BR). Funções MUST ser pequenas e ter responsabilidade única. A
separação de camadas MUST ser respeitada: repositório de dados em `src/tarefas.js`, rotas e
configuração do Express em `src/app.js`, e templates de apresentação em `views/`. Lógica de
negócio não pode vazar para as views, e acesso a dados não pode vazar para as rotas.
Rationale: nomes no idioma do domínio e camadas explícitas reduzem o custo de leitura e evitam
acoplamentos que inviabilizam testes.

### IV. Segurança Básica
Toda entrada vinda do usuário MUST ser validada no servidor antes de ser usada e MUST ser
escapada ao ser renderizada em HTML (o escaping padrão do EJS MUST permanecer ativo; `<%- %>`
só com justificativa). Segredos, credenciais, tokens e arquivos `.env` MUST NOT ser commitados;
configuração sensível vive em variáveis de ambiente. Mensagens de erro MUST NOT expor stack
traces nem detalhes internos em produção.
Rationale: mesmo uma aplicação simples lida com entrada não confiável; falhas básicas de
validação e escaping são a origem mais comum de incidentes.

### V. Entrega por Pull Request
Nenhuma mudança chega à branch `main` sem Pull Request. Cada PR MUST ter CI verde no GitHub
Actions (no mínimo `npm test`) e aprovação humana explícita antes do merge. Push direto em
`main`, force-push em branches publicadas e merge sem revisão são proibidos. O merge é sempre
do humano; agentes automatizados não executam merge.
Rationale: PR + CI + revisão humana é o ponto de controle que protege a branch base de
regressões e de mudanças não autorizadas.

### VI. Acessibilidade e UX
As views MUST usar HTML semântico (`<main>`, `<nav>`, `<form>`, `<label>`, `<button>`),
associar todo controle de formulário a um `<label>` acessível, preservar foco de teclado e
manter contraste suficiente entre texto e fundo. Mensagens de erro e de sucesso MUST ser
perceptíveis por leitores de tela. Novos componentes MUST ser utilizáveis apenas com teclado.
Rationale: acessibilidade é requisito de qualidade, não enfeite; corrigir depois custa mais e
exclui pessoas no caminho.

## Restrições Técnicas

- Runtime: Node.js 22 LTS.
- Framework HTTP: Express 4.
- Template engine: EJS, com escaping padrão ativo.
- Idioma da interface e das mensagens ao usuário: pt-BR.
- Gerenciador de pacotes: npm.
- Testes: `node:test` executado via `npm test`.
- Dependências novas exigem justificativa no `plan.md` conforme o princípio I.

## Fluxo de Desenvolvimento

- Todo trabalho segue o fluxo do Spec Kit: `speckit-specify` → `speckit-clarify` (quando houver
  ambiguidade) → `speckit-plan` → `speckit-tasks` → `speckit-analyze` → `speckit-implement`.
- Cada feature vive em sua própria branch (`###-nome-curto`), criada a partir de `main`.
- Commits são feitos na branch da feature; `main` só recebe código via merge de PR aprovado.
- O PR MUST descrever: resumo da feature, requisitos cobertos (`FR-xxx`), critérios de sucesso
  (`SC-xxx`), comandos de verificação executados e seus resultados, premissas assumidas e
  pendências conhecidas.
- CI no GitHub Actions MUST executar `npm test` em cada PR; falha reprova o merge.

## Governance

Esta constituição é a autoridade máxima do projeto: em caso de conflito com outro documento,
ela prevalece. Emendas (inclusão, alteração ou remoção de princípios ou seções) MUST ser
propostas em um PR dedicado e aprovadas explicitamente por um humano responsável pelo projeto
antes do merge. O versionamento desta constituição segue SemVer: MAJOR para remoções ou
redefinições incompatíveis de princípios; MINOR para novos princípios ou expansões materiais;
PATCH para esclarecimentos e correções não semânticas. Toda emenda MUST atualizar a linha de
versão e a data de última emenda. Revisões de código e de PR MUST verificar aderência aos
princípios; desvios MUST ser justificados por escrito no PR (e, quando afetarem arquitetura, na
seção `Complexity Tracking` do `plan.md`) ou corrigidos antes do merge.

**Version**: 1.0.0 | **Ratified**: 2026-11-21 | **Last Amended**: 2026-11-21
