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

  return app;
}

module.exports = { criarApp };
