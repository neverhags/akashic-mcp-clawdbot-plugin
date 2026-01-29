import { AkashicBridgeConfigLoader } from "./src/config.js";
import { AkashicMcpHttpClient } from "./src/mcp-client.js";
import { AkashicPromptCache } from "./src/prompt-cache.js";
import { AkashicBootstrapHook } from "./src/bootstrap-hook.js";
import { AkashicToolRegistry } from "./src/tool-registry.js";
import { AkashicBridgeConstants } from "./src/constants.js";

export default function register(api: any) {
  const cfg = new AkashicBridgeConfigLoader().load({ pluginConfig: api.pluginConfig, env: process.env });
  if (!cfg) {
    api.logger.warn?.("[akashic-bridge] missing config (mcpUrl/ownerId); plugin idle");
    return;
  }

  const client = new AkashicMcpHttpClient(cfg);
  const promptCache = new AkashicPromptCache();

  api.registerHook(["agent:bootstrap"], new AkashicBootstrapHook(cfg, client, promptCache).handler(), {
    name: AkashicBridgeConstants.hook.name,
    description: AkashicBridgeConstants.hook.description
  });

  api.registerCommand({
    name: "akashicprompts",
    description: "List Akashic MCP prompts (raw JSON)",
    requireAuth: true,
    handler: async () => {
      try {
        const result = await client.listPrompts({});
        return { text: JSON.stringify(result) };
      } catch (err) {
        return { text: `error: ${String(err)}` };
      }
    }
  });

  new AkashicToolRegistry(api, cfg, client, promptCache)
    .registerAll()
    .catch((err) => api.logger.warn?.(`[akashic-bridge] tool registration failed: ${String(err)}`));
}

