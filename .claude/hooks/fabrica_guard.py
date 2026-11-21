"""Hook PreToolUse da Fábrica de Software no Claude Code.

Aplica, por agente, as regras de `permission` (edit/bash) que no opencode ficavam no cabeçalho de cada agente.
A política vem de .claude/fabrica/policy.json, gerada pelo scripts/converter.py a partir dos arquivos originais.
Semântica do opencode preservada: as regras são lidas em ordem e vale a ÚLTIMA que casar com o pedido.
"""
import json
import os
import re
import sys
from pathlib import Path

FERRAMENTAS_EDICAO = {"Write", "Edit", "MultiEdit", "NotebookEdit"}


def raiz_projeto(evento: dict) -> Path:
    return Path(os.environ.get("CLAUDE_PROJECT_DIR") or evento.get("cwd") or os.getcwd())


def agente_atual(evento: dict, raiz: Path) -> str | None:
    """Subagente: vem em agent_type. Sessão principal: o agente definido em settings.json (o orquestrador)."""
    if evento.get("agent_type"):
        return evento["agent_type"]
    # Sessão conduzida diretamente pelo humano (ex.: rodar /speckit-constitution), fora do orquestrador.
    if os.environ.get("FABRICA_AGENTE_PRINCIPAL"):
        return os.environ["FABRICA_AGENTE_PRINCIPAL"]
    for nome in ("settings.local.json", "settings.json"):
        arq = raiz / ".claude" / nome
        if arq.exists():
            try:
                agente = json.loads(arq.read_text(encoding="utf-8")).get("agent")
                if agente:
                    return agente
            except (OSError, json.JSONDecodeError):
                pass
    return None


def padrao_para_regex(padrao: str, caminho: bool) -> re.Pattern:
    """`**` casa qualquer coisa; `*` casa qualquer coisa (bash) ou um segmento de caminho (edit)."""
    partes = []
    i = 0
    while i < len(padrao):
        if padrao.startswith("**", i):
            partes.append(".*")
            i += 2
        elif padrao[i] == "*":
            partes.append("[^/]*" if caminho else ".*")
            i += 1
        else:
            partes.append(re.escape(padrao[i]))
            i += 1
    return re.compile("^" + "".join(partes) + "$", re.S)


def decidir(regras: list, alvo: str, caminho: bool) -> str:
    decisao = "allow"
    for padrao, acao in regras:
        if padrao_para_regex(padrao, caminho).match(alvo):
            decisao = acao  # vale a última regra que casar
    return decisao


def segmentos_bash(comando: str) -> list[str]:
    """Avalia o comando inteiro e cada comando encadeado (&&, ||, ;, |), para não burlar a regra com `cd x && git push`."""
    partes = re.split(r"\s*(?:&&|\|\||;|\|)\s*", comando.strip())
    return [comando.strip()] + [p.strip() for p in partes if p.strip()]


def responder(decisao: str, motivo: str):
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": decisao,
            "permissionDecisionReason": motivo,
        }
    }, ensure_ascii=False))
    sys.exit(0)


def main():
    evento = json.load(sys.stdin)
    raiz = raiz_projeto(evento)
    if os.environ.get("FABRICA_HOOK_DEBUG"):
        with open(raiz / ".claude" / "fabrica" / "hook-debug.jsonl", "a", encoding="utf-8") as f:
            f.write(json.dumps(evento, ensure_ascii=False) + "\n")

    politica_arq = raiz / ".claude" / "fabrica" / "policy.json"
    if not politica_arq.exists():
        return
    politica = json.loads(politica_arq.read_text(encoding="utf-8"))
    agente = agente_atual(evento, raiz)
    regras = politica.get(agente or "", {})
    if not regras:
        return  # agente fora da fábrica: sem restrições extras

    ferramenta = evento.get("tool_name", "")
    entrada = evento.get("tool_input", {}) or {}

    if ferramenta == "Bash" and regras.get("bash"):
        for seg in segmentos_bash(entrada.get("command", "")):
            if decidir(regras["bash"], seg, caminho=False) == "deny":
                responder("deny", f"Fábrica: o agente `{agente}` não pode executar `{seg}` (regra bash da política).")

    if ferramenta in FERRAMENTAS_EDICAO and regras.get("edit"):
        alvo = entrada.get("file_path") or entrada.get("notebook_path") or ""
        try:
            rel = Path(alvo).resolve().relative_to(raiz.resolve()).as_posix()
        except ValueError:
            responder("deny", f"Fábrica: `{agente}` só edita arquivos dentro do projeto (tentou `{alvo}`).")
        decisao = decidir(regras["edit"], rel, caminho=True)
        if decisao in ("deny", "ask"):
            responder(decisao, f"Fábrica: o agente `{agente}` não pode editar `{rel}` (regra edit da política).")


if __name__ == "__main__":
    main()
