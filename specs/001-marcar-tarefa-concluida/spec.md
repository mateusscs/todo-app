# Feature Specification: Marcar Tarefa como Concluída

**Feature Branch**: `001-marcar-tarefa-concluida`

**Created**: 2026-11-21

**Status**: Draft

**Input**: User description: "Permitir marcar uma tarefa como concluída: cada tarefa da lista ganha uma caixa de seleção; ao marcar, o título aparece riscado e a tarefa continua na lista."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Marcar Tarefa como Concluída (Priority: P1)

O usuário visualiza a lista de tarefas e, ao lado de cada item, encontra uma caixa de seleção (checkbox). Ao clicar na caixa de uma tarefa pendente, a tarefa é marcada como concluída: seu título exibe riscado visualmente e ela permanece visível na lista.

**Why this priority**: É o núcleo da feature; sem isso nenhuma outra história faz sentido. Permite ao usuário registrar progresso sem perder o histórico de tarefas.

**Independent Test**: Pode ser testado acessando a lista de tarefas, marcando qualquer tarefa e verificando que o título aparece riscado e a tarefa continua na lista — entrega valor completo por si só.

**Acceptance Scenarios**:

1. **Given** o usuário está na página de lista de tarefas com ao menos uma tarefa pendente, **When** ele marca a caixa de seleção dessa tarefa, **Then** o título da tarefa é exibido com texto riscado e a tarefa permanece visível na lista.
2. **Given** o usuário está na página de lista de tarefas, **When** a página é carregada, **Then** cada item da lista exibe uma caixa de seleção associada ao seu título.
3. **Given** uma tarefa já está marcada como concluída, **When** o usuário recarrega a página, **Then** a tarefa continua exibida como concluída (estado persistido).

---

### User Story 2 - Desmarcar Tarefa Concluída (Priority: P2)

O usuário que marcou uma tarefa como concluída por engano, ou que deseja reabri-la, pode desmarcar a caixa de seleção. A tarefa volta ao estado pendente e o título deixa de aparecer riscado.

**Why this priority**: Permite corrigir marcações acidentais e reabre tarefas, tornando o sistema reversível e confiável.

**Independent Test**: Pode ser testado marcando uma tarefa como concluída e, em seguida, desmarcando-a — a tarefa volta ao título sem risco e ao estado pendente.

**Acceptance Scenarios**:

1. **Given** uma tarefa está marcada como concluída (caixa selecionada, título riscado), **When** o usuário desmarca a caixa de seleção, **Then** o título da tarefa é exibido sem risco e a tarefa retorna ao estado pendente.
2. **Given** uma tarefa é desmarcada, **When** o usuário recarrega a página, **Then** a tarefa é exibida como pendente (estado persistido).

---

### Edge Cases

- O que acontece quando o usuário marca a única tarefa da lista? A tarefa permanece visível na lista com título riscado.
- O que acontece se a requisição de atualização de estado falhar (erro de rede ou servidor)? A interface deve exibir mensagem de erro acessível ao usuário e não alterar o estado visual da tarefa.
- O que acontece com uma tarefa cujo título é muito longo? O risco deve se aplicar ao título completo sem quebrar o layout.
- O que acontece se o usuário tentar marcar/desmarcar rapidamente várias vezes seguidas? Cada ação deve ser processada corretamente, sem duplicação ou perda de estado.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE exibir uma caixa de seleção (checkbox) ao lado do título de cada tarefa na lista de tarefas.
- **FR-002**: O sistema DEVE associar cada caixa de seleção exclusivamente à sua tarefa correspondente, por meio de `<label>` acessível.
- **FR-003**: Ao marcar a caixa de seleção de uma tarefa pendente, o sistema DEVE atualizar o estado da tarefa para "concluída" e persistir essa alteração.
- **FR-004**: O sistema DEVE exibir o título de tarefas concluídas com texto riscado (indicador visual de conclusão).
- **FR-005**: O sistema DEVE manter todas as tarefas visíveis na lista, independentemente do estado (pendente ou concluída).
- **FR-006**: Ao desmarcar a caixa de seleção de uma tarefa concluída, o sistema DEVE atualizar o estado da tarefa para "pendente" e persistir essa alteração.
- **FR-007**: O sistema DEVE persistir o estado de conclusão de cada tarefa entre recarregamentos de página.
- **FR-008**: Em caso de falha ao persistir a alteração de estado, o sistema DEVE exibir mensagem de erro clara e acessível ao usuário, sem alterar o estado visual da tarefa.
- **FR-009**: A caixa de seleção e seu rótulo DEVEM ser utilizáveis apenas com teclado, respeitando o princípio de acessibilidade do projeto.

### Key Entities *(include if feature involves data)*

- **Tarefa**: Representa uma tarefa do usuário. Passa a ter um atributo de estado de conclusão (pendente/concluída) além do título já existente.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O usuário consegue marcar ou desmarcar uma tarefa como concluída em no máximo 2 interações a partir da lista de tarefas (1 clique na caixa de seleção).
- **SC-002**: O estado de conclusão de uma tarefa é refletido visualmente (título riscado / sem risco) ao término da interação de marcar/desmarcar, sem que o usuário precise executar nenhuma ação adicional.
- **SC-003**: O estado de conclusão persiste após recarregamento da página em 100% dos casos sem erros de servidor.
- **SC-004**: Todos os controles de marcação são operáveis exclusivamente por teclado, sem dependência de mouse.
- **SC-005**: Mensagens de erro em caso de falha de persistência são perceptíveis por leitores de tela.

## Assumptions

- A lista de tarefas já existe e está funcional; esta feature adiciona o controle de conclusão a ela.
- A persistência é feita no servidor (mesma camada de dados existente), não apenas no cliente (sem localStorage).
- Não existe, neste momento, filtro por estado (pendentes vs. concluídas); todas as tarefas permanecem na mesma lista independentemente do estado.
- A atualização de estado ao marcar/desmarcar é enviada ao servidor via requisição HTTP (submissão de formulário ou equivalente sem JavaScript extra), compatível com a stack Express + EJS do projeto.
- O indicador visual de conclusão é o risco no texto (CSS `text-decoration: line-through`); não serão adicionados ícones ou cores adicionais nesta versão.
- Não há requisito de ordenação automática (tarefas concluídas não são movidas para o final da lista nesta versão).
