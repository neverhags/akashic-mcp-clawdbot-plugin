# akashic-mcp-clawdbot-plugin

Clawdbot plugin that bridges the gateway to Akashic MCP (Model Context Protocol) for memory and context tools.

## Install

From the Clawdbot workspace or config directory:

```bash
clawdbot plugins install git+ssh://git@github.com/neverhags/akashic-mcp-clawdbot-plugin.git
```

Or clone into `~/.clawdbot/extensions/akashic-bridge` or your workspace `.clawdbot/extensions/akashic-bridge`.

## Config

In `clawdbot.json` under `plugins.entries.akashic-bridge`:

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
