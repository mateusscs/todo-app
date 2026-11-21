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
      const tarefa = { id: proximoId++, titulo: texto, criadaEm: new Date().toISOString() };
      tarefas.push(tarefa);
      return { ...tarefa };
    },
  };
}

module.exports = { criarRepositorio };
