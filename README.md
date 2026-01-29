# akashic-mcp-clawdbot-plugin

Clawdbot/Moltbot plugin that bridges the gateway to **Akashic MCP** so the agent can use persistent memory and context tools (store, search, retrieve, update, project main memory, module state, etc.) via the Model Context Protocol.

---

## About Akashic MCP

**Akashic MCP** is an MCP (Model Context Protocol) server that provides **persistent memory with semantic search** for LLMs and agents.

- **Protocol**: MCP over HTTP/JSON-RPC 2.0
- **Backend**: Hybrid architecture — **Qdrant** (vector DB) for semantic search + **PostgreSQL** for metadata, users, OAuth, and file storage
- **Embeddings**: Automatic embedding generation (e.g. Ollama/nomic-embed-text); no manual vectors required
- **Features**: Store/search/retrieve/update/delete memories, collections, project main memory, module state, system change tracking, file attachments linked to memories, related-memory networks
- **Auth**: Multi-provider (OAuth2, JWT, Google OAuth, Firebase); data isolated by `owner_id`
- **Production**: [akashic-mcp.com](https://akashic-mcp.com) — MCP endpoint at `https://akashic-mcp.com/mcp`

This plugin exposes Akashic MCP tools to the Clawdbot/Moltbot agent so it can use that memory layer from within the gateway.

---

## About Clawdbot / Moltbot

**Moltbot** (formerly Clawdbot) is a **personal AI assistant gateway** you run on your own devices. It connects the channels you already use to coding agents like Pi.

- **Channels**: WhatsApp, Telegram, Slack, Discord, Google Chat, Signal, iMessage, BlueBubbles, Microsoft Teams, Matrix, Zalo, WebChat, and more via plugins
- **Architecture**: Single **Gateway** process (WebSocket control plane at `ws://127.0.0.1:18789` by default); CLI, Control UI, and companion apps connect to it
- **Agent**: Pi (RPC mode) with tool streaming; plugins can add **agent tools**, Gateway RPC methods, CLI commands, and background services
- **Docs**: [docs.clawd.bot](https://docs.clawd.bot) / [docs.molt.bot](https://docs.molt.bot) — wizard, configuration, plugins, gateway, security
- **Install**: `npm install -g moltbot@latest` then `moltbot onboard --install-daemon`; legacy CLI name `clawdbot` remains available
- **Repo**: [github.com/moltbot/moltbot](https://github.com/moltbot/moltbot)

Plugins are TypeScript modules loaded at runtime; they can register agent tools (e.g. `akashic_*`) so the agent can call the MCP server during a turn.

---

## Install

From the Clawdbot/Moltbot workspace or config directory:

```bash
clawdbot plugins install git+ssh://git@github.com:neverhags/akashic-mcp-clawdbot-plugin.git
```

Or with Moltbot:

```bash
moltbot plugins install git+ssh://git@github.com:neverhags/akashic-mcp-clawdbot-plugin.git
```

Alternatively, clone this repo into:

- `~/.clawdbot/extensions/akashic-bridge`, or  
- your workspace `<<workspace>>/.clawdbot/extensions/akashic-bridge`

Restart the Gateway after installing or changing config.

---

## Config

In `clawdbot.json` or `moltbot.json` under `plugins.entries.akashic-bridge`:

```json
{
  "akashic-bridge": {
    "enabled": true,
    "config": {
      "mcpUrl": "https://akashic-mcp.com/mcp",
      "ownerId": "<your-owner-id>",
      "promptName": "akashic-mcp-rules",
      "toolNamePrefix": "akashic_"
    }
  }
}
```

- **mcpUrl**: Akashic MCP HTTP endpoint (default production: `https://akashic-mcp.com/mcp`).
- **ownerId**: Your Akashic MCP owner UUID; used for data isolation.
- **promptName**: Optional prompt to inject (e.g. rules/workflow).
- **toolNamePrefix**: Prefix for tools exposed to the agent (e.g. `akashic_search_memory`).

---

## Links

- **Akashic MCP**: [akashic-mcp.com](https://akashic-mcp.com)
- **Moltbot**: [molt.bot](https://molt.bot) · [docs.molt.bot](https://docs.molt.bot) · [GitHub](https://github.com/moltbot/moltbot)
- **Clawdbot docs**: [docs.clawd.bot](https://docs.clawd.bot)
- **Plugin docs (Moltbot)**: [Plugin](https://docs.clawd.bot/plugin) · [Plugin agent tools](https://docs.clawd.bot/plugins/agent-tools)
