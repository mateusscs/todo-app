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

const FORM = { 'Content-Type': 'application/x-www-form-urlencoded' };

async function criar(base, titulo) {
  await fetch(`${base}/tarefas`, {
    method: 'POST',
    headers: FORM,
    body: `titulo=${encodeURIComponent(titulo)}`,
    redirect: 'manual',
  });
}

function concluir(base, id, corpo) {
  return fetch(`${base}/tarefas/${id}/conclusao`, {
    method: 'POST',
    headers: FORM,
    body: corpo,
    redirect: 'manual',
  });
}

test('POST /tarefas/:id/conclusao marca como concluída, redireciona e persiste', async () => {
  await comServidor(async (base) => {
    await criar(base, 'Estudar');
    await criar(base, 'Outra');
    const resp = await concluir(base, 1, 'concluida=on');
    assert.equal(resp.status, 302);
    assert.equal(resp.headers.get('location'), '/#tarefa-1');
    const html = await (await fetch(`${base}/`)).text();
    assert.match(html, /<li id="tarefa-1" data-id="1" class="concluida">/);
    assert.match(html, /id="tarefa-1-concluida" name="concluida" checked>/);
    assert.match(html, /<li id="tarefa-2" data-id="2">/);
    assert.match(html, /id="tarefa-2-concluida" name="concluida">/);
    assert.match(html, /Estudar/);
  });
});

test('POST conclusao responde 404 para tarefa inexistente', async () => {
  await comServidor(async (base) => {
    await criar(base, 'A');
    const resp = await concluir(base, 99, 'concluida=on');
    assert.equal(resp.status, 404);
    const html = await resp.text();
    assert.match(html, /role="alert">Tarefa não encontrada\./);
    assert.match(html, /<li id="tarefa-1"/);
  });
});

test('POST conclusao responde 404 para id não numérico', async () => {
  await comServidor(async (base) => {
    const resp = await concluir(base, 'abc', 'concluida=on');
    assert.equal(resp.status, 404);
    assert.match(await resp.text(), /role="alert">Tarefa não encontrada\./);
  });
});

test('POST conclusao responde 500 sem stack trace quando o repositório falha', async () => {
  const repo = criarRepositorio();
  repo.definirConclusao = () => {
    throw new Error('falha interna secreta');
  };
  const servidor = criarApp(repo).listen(0);
  try {
    const base = `http://127.0.0.1:${servidor.address().port}`;
    const resp = await concluir(base, 1, 'concluida=on');
    assert.equal(resp.status, 500);
    const html = await resp.text();
    assert.match(html, /role="alert">Não foi possível atualizar a tarefa\. Tente novamente\./);
    assert.doesNotMatch(html, /falha interna secreta|at .*\.js/);
  } finally {
    servidor.close();
  }
});

test('título é escapado na lista de tarefas', async () => {
  await comServidor(async (base) => {
    await criar(base, '<script>alert(1)</script>');
    const html = await (await fetch(`${base}/`)).text();
    assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;<\/label>/);
    assert.doesNotMatch(html, /<script>alert\(1\)/);
  });
});

test('GET / renderiza formulário, checkbox rotulado e botão Salvar por tarefa', async () => {
  await comServidor(async (base) => {
    await criar(base, 'Item');
    const html = await (await fetch(`${base}/`)).text();
    assert.match(html, /<form method="post" action="\/tarefas\/1\/conclusao">/);
    assert.match(html, /<input type="checkbox" id="tarefa-1-concluida" name="concluida">/);
    assert.match(html, /<label for="tarefa-1-concluida">Item<\/label>/);
    assert.match(html, /<button type="submit">Salvar<\/button>/);
  });
});

test('página define a classe .concluida com texto riscado e script de melhoria progressiva', async () => {
  await comServidor(async (base) => {
    const html = await (await fetch(`${base}/`)).text();
    assert.match(html, /\.concluida label \{[^}]*text-decoration: line-through/);
    assert.match(html, /overflow-wrap/);
    assert.match(html, /addEventListener\('change'/);
  });
});

test('respostas 404 e 500 exibem a mensagem com role="alert"', async () => {
  await comServidor(async (base) => {
    const html = await (await concluir(base, 5, '')).text();
    assert.match(html, /<p class="erro" role="alert">/);
  });
});
