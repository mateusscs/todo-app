# E4 - Verificação do quickstart (Phase 5)

Verificado por HTTP/HTML renderizado (servidor temporário, já encerrado):
- #1/#2/#3: caixa com label associado (for/id); POST concluida=on -> 302 /#tarefa-1; reload mostra `class="concluida"` e `checked`.
- #4: POST sem campo -> 302; nenhuma caixa marcada.
- #6/#7: CSS `overflow-wrap:anywhere` presente no label; risco via `li.concluida label`.
- #8/#9: 404 com `role="alert"` "Tarefa não encontrada." (id 999 e abc).
- #10: dois POSTs concluida=on seguidos mantêm a tarefa concluída.
- #11 (parcial): botão "Salvar" presente no HTML; é ocultado só por script.

Verificação manual pendente em navegador: #5 (Tab/Espaço/Enter, retorno de foco/rolagem), #7 (layout visual com ~300 caracteres), #11 (JS desativado) e comportamento do submit automático com JS.
