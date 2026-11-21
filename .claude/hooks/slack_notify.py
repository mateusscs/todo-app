"""Hook SubagentStop da Fábrica de Software: registra no Slack a finalização de cada subagente.

Requisito do Projeto Final 4: "Cada subagente deve registrar no Slack a finalização da sua tarefa."
Lê o bloco de status (STATUS/PARECER/ARTEFATOS/TESTES/BLOQUEIOS/PRÓXIMO) que o subagente devolveu e envia
para um Incoming Webhook do Slack. A URL vem da variável SLACK_WEBHOOK_URL (defina em
.claude/settings.local.json, bloco "env", que não vai para o Git). Sem a variável, só grava o log local.
"""
import json
import os
import re
import subprocess
import sys
import urllib.request
from datetime import datetime
from pathlib import Path

CAMPOS = ("STATUS", "PARECER", "ARTEFATOS", "TESTES", "BLOQUEIOS", "PRÓXIMO")
NOMES = {
    "subagent-analista-requisitos": "Analista de Requisitos",
    "subagent-arquiteto": "Arquiteto",
    "subagent-criador-tarefas": "Criador de Tarefas",
    "subagent-desenvolvedor": "Desenvolvedor",
    "subagent-revisor-codigo": "Revisor de Código",
    "subagent-qa": "QA",
}


def texto_da_mensagem(msg) -> str:
    conteudo = msg.get("content", "") if isinstance(msg, dict) else ""
    if isinstance(conteudo, str):
        return conteudo
    return "\n".join(b.get("text", "") for b in conteudo if isinstance(b, dict) and b.get("type") == "text")


def ultima_resposta(evento: dict) -> str:
    if evento.get("last_assistant_message"):
        return evento["last_assistant_message"]
    transcript = evento.get("agent_transcript_path") or evento.get("transcript_path")
    if not transcript or not Path(transcript).exists():
        return ""
    ultima = ""
    for linha in Path(transcript).read_text(encoding="utf-8", errors="replace").splitlines():
        try:
            item = json.loads(linha)
        except json.JSONDecodeError:
            continue
        if item.get("type") == "assistant":
            texto = texto_da_mensagem(item.get("message", {}))
            if texto.strip():
                ultima = texto
    return ultima


def bloco_status(texto: str) -> dict:
    """Extrai o bloco de status; ARTEFATOS pode ocupar várias linhas."""
    campos, atual = {}, None
    for linha in texto.splitlines():
        linha = linha.strip().strip("`")
        m = re.match(rf"^({'|'.join(CAMPOS)}):\s*(.*)$", linha)
        if m:
            atual = m.group(1)
            campos[atual] = m.group(2).strip()
        elif atual == "ARTEFATOS" and linha and not linha.startswith("```"):
            campos[atual] += ("\n" if campos[atual] else "") + linha
    return campos


def branch_atual(raiz: Path) -> str:
    try:
        return subprocess.run(["git", "branch", "--show-current"], cwd=raiz, capture_output=True,
                              text=True, timeout=10).stdout.strip() or "?"
    except Exception:
        return "?"


def montar_mensagem(agente: str, campos: dict, branch: str) -> str:
    status = campos.get("STATUS", "sem bloco de status")
    icone = {"DONE": ":white_check_mark:", "HUMAN_REVIEW_REQUIRED": ":eyes:", "NEEDS_CLARIFICATION": ":question:",
             "BLOCKED": ":no_entry:"}.get(status.split()[0] if status else "", ":robot_face:")
    linhas = [f"{icone} *Fábrica de Software* · *{NOMES.get(agente, agente)}* (`{agente}`) finalizou a tarefa",
              f"*Branch:* `{branch}`", f"*STATUS:* {status}"]
    if campos.get("PARECER"):
        linhas.append(f"*PARECER:* {campos['PARECER']}")
    if campos.get("ARTEFATOS"):
        artefatos = campos["ARTEFATOS"].splitlines()
        resumo = "\n".join(f"• {a.lstrip('-• ').strip()}" for a in artefatos[:8])
        if len(artefatos) > 8:
            resumo += f"\n• … e mais {len(artefatos) - 8}"
        linhas.append(f"*ARTEFATOS:*\n{resumo}")
    for campo in ("TESTES", "BLOQUEIOS", "PRÓXIMO"):
        if campos.get(campo):
            linhas.append(f"*{campo}:* {campos[campo]}")
    return "\n".join(linhas)


def main():
    evento = json.load(sys.stdin)
    agente = evento.get("agent_type") or "subagente"
    if agente not in NOMES:
        return  # só os subagentes da fábrica são registrados
    raiz = Path(os.environ.get("CLAUDE_PROJECT_DIR") or evento.get("cwd") or os.getcwd())
    texto = montar_mensagem(agente, bloco_status(ultima_resposta(evento)), branch_atual(raiz))

    log = raiz / ".claude" / "fabrica" / "slack-log.jsonl"
    log.parent.mkdir(parents=True, exist_ok=True)
    registro = {"quando": datetime.now().isoformat(timespec="seconds"), "agente": agente, "texto": texto}

    url = os.environ.get("SLACK_WEBHOOK_URL")
    if url:
        try:
            req = urllib.request.Request(url, data=json.dumps({"text": texto}).encode("utf-8"),
                                         headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                registro["slack"] = resp.status
        except Exception as erro:  # o hook nunca bloqueia a fábrica por falha do Slack
            registro["slack_erro"] = str(erro)
    else:
        registro["slack"] = "SLACK_WEBHOOK_URL não definida (apenas log local)"

    with open(log, "a", encoding="utf-8") as f:
        f.write(json.dumps(registro, ensure_ascii=False) + "\n")


if __name__ == "__main__":
    main()
