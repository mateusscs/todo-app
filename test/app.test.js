const { test } = require('node:test');
const assert = require('node:assert/strict');
const { criarApp } = require('../src/app');
const { criarRepositorio } = require('../src/tarefas');

async function comServidor(fn) {
  const servidor = criarApp(criarRepositorio()).listen(0);
  const { port } = servidor.address();
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    servidor.close();
  }
}

test('repositório adiciona e lista tarefas', () => {
  const repo = criarRepositorio();
  repo.adicionar('  Estudar Spec Kit  ');
  assert.deepEqual(repo.listar().map((t) => t.titulo), ['Estudar Spec Kit']);
});

test('repositório rejeita título vazio', () => {
  assert.throws(() => criarRepositorio().adicionar('   '), /obrigatório/);
});

test('GET / mostra a lista vazia', async () => {
  await comServidor(async (base) => {
    const html = await (await fetch(`${base}/`)).text();
    assert.match(html, /Nenhuma tarefa cadastrada/);
  });
});

test('POST /tarefas adiciona e redireciona para a lista', async () => {
  await comServidor(async (base) => {
    const resp = await fetch(`${base}/tarefas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'titulo=Preparar+apresentacao',
      redirect: 'manual',
    });
    assert.equal(resp.status, 302);
    const html = await (await fetch(`${base}/`)).text();
    assert.match(html, /Preparar apresentacao/);
  });
});

test('POST /tarefas sem título responde 400', async () => {
  await comServidor(async (base) => {
    const resp = await fetch(`${base}/tarefas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'titulo=',
    });
    assert.equal(resp.status, 400);
  });
});
