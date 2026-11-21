const path = require('path');
const express = require('express');
const { criarRepositorio } = require('./tarefas');

function criarApp(repositorio = criarRepositorio()) {
  const app = express();
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '..', 'views'));
  app.use(express.urlencoded({ extended: false }));

  app.get('/', (req, res) => {
    res.render('index', { tarefas: repositorio.listar(), erro: null });
  });

  app.post('/tarefas', (req, res) => {
    try {
      repositorio.adicionar(req.body.titulo);
      res.redirect('/');
    } catch (e) {
      res.status(400).render('index', { tarefas: repositorio.listar(), erro: e.message });
    }
  });

  app.post('/tarefas/:id/conclusao', (req, res) => {
    const renderizarErro = (status, mensagem) =>
      res.status(status).render('index', { tarefas: repositorio.listar(), erro: mensagem });

    if (!/^\d+$/.test(req.params.id)) {
      return renderizarErro(404, 'Tarefa não encontrada.');
    }
    try {
      const atualizada = repositorio.definirConclusao(
        Number(req.params.id),
        Boolean(req.body && 'concluida' in req.body),
      );
      if (!atualizada) {
        return renderizarErro(404, 'Tarefa não encontrada.');
      }
      return res.redirect(`/#tarefa-${atualizada.id}`);
    } catch (e) {
      return renderizarErro(500, 'Não foi possível atualizar a tarefa. Tente novamente.');
    }
  });

  return app;
}

module.exports = { criarApp };
