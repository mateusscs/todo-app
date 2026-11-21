const { test } = require('node:test');
const assert = require('node:assert/strict');
const { criarRepositorio } = require('../src/tarefas');

test('tarefa nova nasce pendente (concluida=false)', () => {
  const repo = criarRepositorio();
  assert.equal(repo.adicionar('A').concluida, false);
  assert.equal(repo.listar()[0].concluida, false);
});

test('definirConclusao marca a tarefa como concluída', () => {
  const repo = criarRepositorio();
  const { id } = repo.adicionar('A');
  const atualizada = repo.definirConclusao(id, true);
  assert.equal(atualizada.concluida, true);
  assert.equal(repo.listar()[0].concluida, true);
});

test('definirConclusao desmarca a tarefa', () => {
  const repo = criarRepositorio();
  const { id } = repo.adicionar('A');
  repo.definirConclusao(id, true);
  assert.equal(repo.definirConclusao(id, false).concluida, false);
  assert.equal(repo.listar()[0].concluida, false);
});

test('definirConclusao é idempotente', () => {
  const repo = criarRepositorio();
  const { id } = repo.adicionar('A');
  repo.definirConclusao(id, true);
  assert.equal(repo.definirConclusao(id, true).concluida, true);
  repo.definirConclusao(id, false);
  assert.equal(repo.definirConclusao(id, false).concluida, false);
  assert.equal(repo.listar().length, 1);
});

test('definirConclusao retorna null para id inexistente', () => {
  const repo = criarRepositorio();
  repo.adicionar('A');
  assert.equal(repo.definirConclusao(999, true), null);
  assert.equal(repo.listar()[0].concluida, false);
});

test('definirConclusao preserva ordem e quantidade', () => {
  const repo = criarRepositorio();
  const [a, b, c] = ['A', 'B', 'C'].map((t) => repo.adicionar(t));
  repo.definirConclusao(b.id, true);
  const lista = repo.listar();
  assert.deepEqual(lista.map((t) => t.id), [a.id, b.id, c.id]);
  assert.deepEqual(lista.map((t) => t.concluida), [false, true, false]);
});

test('listar e definirConclusao retornam cópias', () => {
  const repo = criarRepositorio();
  const { id } = repo.adicionar('A');
  repo.listar()[0].concluida = true;
  assert.equal(repo.listar()[0].concluida, false);
  repo.definirConclusao(id, true).concluida = false;
  assert.equal(repo.listar()[0].concluida, true);
});
