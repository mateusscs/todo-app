// Testes de aceite do QA para a feature 001-marcar-tarefa-concluida.
// Cobrem os cenários de aceite de US1/US2, os edge cases e os FR/SC verificáveis por HTTP e HTML renderizado.
// Não cobrem (verificação manual pendente, ver qa-report.md): foco e teclado em navegador real (quickstart #5),
// layout visual com título longo (#7), fluxo sem JavaScript (#11) e comportamento do submit automático com JS.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { criarApp } = require('../../src/app');
const { criarRepositorio } = require('../../src/tarefas');

const FORM = { 'Content-Type': 'application/x-www-form-urlencoded' };

async function comServidor(fn) {
  const repo = criarRepositorio();
  const servidor = criarApp(repo).listen(0);
  const base = `http://127.0.0.1:${servidor.address().port}`;
  try {
    await fn(base, repo);
  } finally {
    servidor.close();
  }
}

async function criar(base, titulo) {
  const resp = await fetch(`${base}/tarefas`, {
    method: 'POST',
    headers: FORM,
    body: `titulo=${encodeURIComponent(titulo)}`,
    redirect: 'manual',
  });
  assert.equal(resp.status, 302, 'criação de tarefa deve redirecionar');
}

function definir(base, id, corpo) {
  return fetch(`${base}/tarefas/${id}/conclusao`, {
    method: 'POST',
    headers: FORM,
    body: corpo,
    redirect: 'manual',
  });
}

async function paginaLista(base) {
  return (await fetch(`${base}/`)).text();
}

function blocoLi(html, id) {
  const m = html.match(new RegExp(`<li id="tarefa-${id}"[^>]*>[\\s\\S]*?</li>`));
  return m ? m[0] : null;
}

// Lê o estado observável de uma tarefa a partir do HTML renderizado.
function estado(html, id) {
  const li = blocoLi(html, id);
  if (!li) return null;
  const abertura = li.match(/<li [^>]*>/)[0];
  const caixa = li.match(/<input type="checkbox"[^>]*>/)[0];
  return {
    concluida: /\sclass="concluida"/.test(abertura),
    marcada: /\schecked>/.test(caixa),
    titulo: li.match(/<label [^>]*>([\s\S]*?)<\/label>/)[1],
  };
}

function idsNaLista(html) {
  return [...html.matchAll(/<li id="tarefa-(\d+)"/g)].map((m) => Number(m[1]));
}

// ---------------------------------------------------------------- US1

test('[US1-AS2, FR-001, FR-002] cada tarefa exibe uma caixa de seleção rotulada pelo próprio título', async () => {
  await comServidor(async (base) => {
    await criar(base, 'Comprar pão');
    await criar(base, 'Ler livro');
    const html = await paginaLista(base);
    for (const [id, titulo] of [
      [1, 'Comprar pão'],
      [2, 'Ler livro'],
    ]) {
      const li = blocoLi(html, id);
      assert.ok(li, `li da tarefa ${id} deve existir`);
      assert.equal(li.match(/<input type="checkbox"/g).length, 1, 'uma caixa por tarefa');
      assert.match(li, new RegExp(`<input type="checkbox" id="tarefa-${id}-concluida" name="concluida"`));
      assert.match(li, new RegExp(`<label for="tarefa-${id}-concluida">${titulo}</label>`));
    }
  });
});

test('[US1-AS1, FR-003, FR-004, FR-005, SC-002] marcar tarefa pendente: título riscado e tarefa continua na lista', async () => {
  await comServidor(async (base) => {
    await criar(base, 'Comprar pão');
    await criar(base, 'Ler livro');
    const resp = await definir(base, 1, 'concluida=on');
    assert.equal(resp.status, 302);
    assert.equal(resp.headers.get('location'), '/#tarefa-1');

    const html = await paginaLista(base);
    assert.deepEqual(estado(html, 1), { concluida: true, marcada: true, titulo: 'Comprar pão' });
    assert.deepEqual(idsNaLista(html), [1, 2], 'a tarefa concluída permanece na lista, na mesma posição');
    assert.match(html, /li\.concluida label \{[^}]*text-decoration: line-through/);
  });
});

test('[SC-002] a interação de marcar termina com a página já exibindo o novo estado, sem ação extra', async () => {
  await comServidor(async (base) => {
    await criar(base, 'Estudar');
    // fetch segue o redirecionamento 302 como um navegador faria
    const resp = await fetch(`${base}/tarefas/1/conclusao`, { method: 'POST', headers: FORM, body: 'concluida=on' });
    assert.equal(resp.status, 200);
    const html = await resp.text();
    assert.equal(estado(html, 1).concluida, true);
    assert.match(html, /id="tarefa-1"/, 'a âncora #tarefa-1 deve existir na página final');
  });
});

test('[US1-AS3, FR-007, SC-003] estado concluído persiste em recarregamentos sucessivos', async () => {
  await comServidor(async (base) => {
    for (const t of ['A', 'B', 'C']) await criar(base, t);
    await definir(base, 1, 'concluida=on');
    await definir(base, 3, 'concluida=on');
    const snapshots = [];
    for (let i = 0; i < 3; i++) {
      const html = await paginaLista(base);
      snapshots.push([1, 2, 3].map((id) => estado(html, id).concluida));
    }
    for (const s of snapshots) assert.deepEqual(s, [true, false, true]);
  });
});

test('[edge: única tarefa] marcar a única tarefa da lista a mantém visível e riscada', async () => {
  await comServidor(async (base) => {
    await criar(base, 'Única');
    await definir(base, 1, 'concluida=on');
    const html = await paginaLista(base);
    assert.deepEqual(idsNaLista(html), [1]);
    assert.deepEqual(estado(html, 1), { concluida: true, marcada: true, titulo: 'Única' });
  });
});

test('[FR-005] marcar uma tarefa não altera título, ordem nem estado das demais', async () => {
  await comServidor(async (base) => {
    for (const t of ['Primeira', 'Segunda', 'Terceira']) await criar(base, t);
    await definir(base, 2, 'concluida=on');
    const html = await paginaLista(base);
    assert.deepEqual(idsNaLista(html), [1, 2, 3]);
    assert.deepEqual(estado(html, 1), { concluida: false, marcada: false, titulo: 'Primeira' });
    assert.deepEqual(estado(html, 2), { concluida: true, marcada: true, titulo: 'Segunda' });
    assert.deepEqual(estado(html, 3), { concluida: false, marcada: false, titulo: 'Terceira' });
  });
});

// ---------------------------------------------------------------- US2

test('[US2-AS1, FR-006] desmarcar tarefa concluída volta ao estado pendente, sem risco e com caixa desmarcada', async () => {
  await comServidor(async (base) => {
    await criar(base, 'Revisar');
    await definir(base, 1, 'concluida=on');
    const resp = await definir(base, 1, '');
    assert.equal(resp.status, 302);
    const html = await paginaLista(base);
    assert.deepEqual(estado(html, 1), { concluida: false, marcada: false, titulo: 'Revisar' });
  });
});

test('[US2-AS2, FR-007, SC-003] tarefa desmarcada aparece como pendente após recarregar a página', async () => {
  await comServidor(async (base) => {
    await criar(base, 'Revisar');
    await definir(base, 1, 'concluida=on');
    await definir(base, 1, '');
    for (let i = 0; i < 2; i++) {
      const html = await paginaLista(base);
      assert.deepEqual(estado(html, 1), { concluida: false, marcada: false, titulo: 'Revisar' });
    }
  });
});

// ---------------------------------------------------------------- Edge cases e falhas

test('[FR-008, SC-005, edge: falha] id inexistente responde 404 com alerta acessível e não altera nenhuma tarefa', async () => {
  await comServidor(async (base) => {
    await criar(base, 'A');
    await criar(base, 'B');
    await definir(base, 2, 'concluida=on');
    const resp = await definir(base, 99, 'concluida=on');
    assert.equal(resp.status, 404);
    const html = await resp.text();
    assert.match(html, /<p class="erro" role="alert">Tarefa não encontrada\.<\/p>/);
    assert.deepEqual(estado(html, 1), { concluida: false, marcada: false, titulo: 'A' });
    assert.deepEqual(estado(html, 2), { concluida: true, marcada: true, titulo: 'B' });
  });
});

test('[FR-008, edge: falha] erro interno responde 500 com alerta, sem expor detalhes e sem mudar o estado visível', async () => {
  await comServidor(async (base, repo) => {
    await criar(base, 'Tarefa A');
    repo.definirConclusao = () => {
      throw new Error('segredo-interno-xyz');
    };
    const resp = await definir(base, 1, 'concluida=on');
    assert.equal(resp.status, 500);
    const html = await resp.text();
    assert.match(html, /<p class="erro" role="alert">Não foi possível atualizar a tarefa\. Tente novamente\.<\/p>/);
    assert.doesNotMatch(html, /segredo-interno-xyz/);
    assert.doesNotMatch(html, /\n\s+at /, 'não deve haver stack trace');
    // o estado exibido é o persistido: a tarefa continua pendente
    assert.deepEqual(estado(html, 1), { concluida: false, marcada: false, titulo: 'Tarefa A' });
  });
});

test('[edge: título longo, FR-004] título de 300 caracteres é exibido completo, riscado e com quebra de linha habilitada', async () => {
  await comServidor(async (base) => {
    const longo = Array.from({ length: 300 }, (_, i) => String.fromCharCode(97 + (i % 26))).join('');
    await criar(base, longo);
    await definir(base, 1, 'concluida=on');
    const html = await paginaLista(base);
    assert.equal(estado(html, 1).titulo, longo, 'o título não pode ser truncado');
    assert.equal(estado(html, 1).concluida, true);
    assert.match(html, /li label \{[^}]*overflow-wrap:\s*anywhere/);
  });
});

test('[edge: cliques repetidos] alternar rapidamente em sequência converge para o último estado enviado', async () => {
  await comServidor(async (base) => {
    await criar(base, 'Rápida');
    const sequencia = ['concluida=on', '', 'concluida=on', '', 'concluida=on'];
    for (const corpo of sequencia) {
      const resp = await definir(base, 1, corpo);
      assert.equal(resp.status, 302);
    }
    const html = await paginaLista(base);
    assert.equal(estado(html, 1).concluida, true);
    assert.deepEqual(idsNaLista(html), [1], 'sem duplicação');
  });
});

test('[edge: cliques repetidos] requisições concorrentes na mesma tarefa não geram erro, duplicação nem perda das demais', async () => {
  await comServidor(async (base) => {
    for (const t of ['A', 'B', 'C']) await criar(base, t);
    const corpos = Array.from({ length: 12 }, (_, i) => (i % 2 === 0 ? 'concluida=on' : ''));
    const respostas = await Promise.all(corpos.map((c) => definir(base, 2, c)));
    assert.deepEqual(
      respostas.map((r) => r.status),
      corpos.map(() => 302),
    );
    const html = await paginaLista(base);
    assert.deepEqual(idsNaLista(html), [1, 2, 3]);
    assert.equal(estado(html, 1).concluida, false);
    assert.equal(estado(html, 3).concluida, false);
    assert.equal(typeof estado(html, 2).concluida, 'boolean');
  });
});

test('[contrato] id com formato inválido ou inexistente responde 404 com alerta', async () => {
  await comServidor(async (base) => {
    await criar(base, 'Única');
    for (const id of ['abc', '1.5', '-1', '1e3', '0', encodeURIComponent(' 1'), '99999999999999999999']) {
      const resp = await definir(base, id, 'concluida=on');
      assert.equal(resp.status, 404, `id "${id}" deve responder 404`);
      assert.match(await resp.text(), /role="alert">Tarefa não encontrada\./, `id "${id}"`);
    }
    const html = await paginaLista(base);
    assert.equal(estado(html, 1).concluida, false, 'nenhum id inválido pode alterar a tarefa');
  });
});

test('[contrato] presença do campo concluida, qualquer que seja o valor, marca; ausência desmarca', async () => {
  await comServidor(async (base) => {
    await criar(base, 'Contrato');
    for (const corpo of ['concluida=on', 'concluida=', 'concluida=off']) {
      await definir(base, 1, corpo);
      assert.equal(estado(await paginaLista(base), 1).concluida, true, `corpo "${corpo}"`);
    }
    await definir(base, 1, '');
    assert.equal(estado(await paginaLista(base), 1).concluida, false);
  });
});

test('[FR-002, segurança básica] título com HTML é escapado no rótulo e não executa', async () => {
  await comServidor(async (base) => {
    await criar(base, '<img src=x onerror=alert(1)>');
    await definir(base, 1, 'concluida=on');
    const html = await paginaLista(base);
    assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
    assert.doesNotMatch(html, /<img src=x/);
  });
});

test('[FR-002] ids são únicos na página e cada rótulo aponta para uma caixa existente', async () => {
  await comServidor(async (base) => {
    for (const t of ['A', 'B', 'C']) await criar(base, t);
    const html = await paginaLista(base);
    const ids = [...html.matchAll(/ id="(tarefa-\d+-concluida)"/g)].map((m) => m[1]);
    const fors = [...html.matchAll(/<label for="(tarefa-\d+-concluida)"/g)].map((m) => m[1]);
    assert.equal(ids.length, 3);
    assert.equal(new Set(ids).size, ids.length, 'ids de caixa devem ser únicos');
    assert.deepEqual(fors, ids, 'cada label aponta para a caixa correspondente');
  });
});

// ---------------------------------------------------------------- Acessibilidade e fallback (FR-009, SC-001, SC-004, SC-005)

test('[FR-009, SC-004] controles são nativos (checkbox, label, button) e sem atributos que quebrem o uso por teclado', async () => {
  await comServidor(async (base) => {
    await criar(base, 'A');
    await criar(base, 'B');
    const html = await paginaLista(base);
    assert.equal(html.match(/<input type="checkbox"/g).length, 2);
    assert.equal(html.match(/<button type="submit">Salvar<\/button>/g).length, 2);
    assert.match(html, /<form method="post" action="\/tarefas\/1\/conclusao">/);
    assert.doesNotMatch(html, /onclick=/, 'sem manipuladores inline de clique');
    assert.doesNotMatch(html, /tabindex="(-1|[1-9]\d*)"/, 'sem tabindex que remova ou reordene o foco');
    assert.doesNotMatch(html, /role="checkbox"/, 'usar o checkbox nativo, não um papel improvisado');
  });
});

test('[SC-001, premissa sem JS] o botão "Salvar" de cada tarefa está no HTML do servidor, sem atributo hidden', async () => {
  await comServidor(async (base) => {
    await criar(base, 'A');
    const html = await paginaLista(base);
    const li = blocoLi(html, 1);
    assert.match(li, /<button type="submit">Salvar<\/button>/);
    assert.doesNotMatch(li, /hidden/);
    // melhoria progressiva: o script submete no change e só então oculta o botão
    assert.match(html, /addEventListener\('change'/);
    assert.match(html, /botao\.hidden = true/);
  });
});

test('[SC-005] erros de persistência são anunciados por elemento com role="alert" e não ficam ocultos', async () => {
  await comServidor(async (base) => {
    await criar(base, 'A');
    const html404 = await (await definir(base, 42, 'concluida=on')).text();
    const alerta = html404.match(/<p class="erro"[^>]*>[^<]*<\/p>/)[0];
    assert.match(alerta, /role="alert"/);
    assert.doesNotMatch(alerta, /hidden|aria-hidden="true"/);
  });
});
