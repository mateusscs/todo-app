// Repositório de tarefas em memória (suficiente para a demonstração; reinicia com o servidor).
function criarRepositorio() {
  let proximoId = 1;
  const tarefas = [];

  return {
    listar() {
      return tarefas.map((t) => ({ ...t }));
    },
    adicionar(titulo) {
      const texto = String(titulo ?? '').trim();
      if (!texto) {
        throw new Error('O título da tarefa é obrigatório.');
      }
      const tarefa = {
        id: proximoId++,
        titulo: texto,
        criadaEm: new Date().toISOString(),
        concluida: false,
      };
      tarefas.push(tarefa);
      return { ...tarefa };
    },
    definirConclusao(id, concluida) {
      const tarefa = tarefas.find((t) => t.id === id);
      if (!tarefa) {
        return null;
      }
      tarefa.concluida = Boolean(concluida);
      return { ...tarefa };
    },
  };
}

module.exports = { criarRepositorio };
