import type { AkashicMcpHttpClient } from "./mcp-client.js";
import type { AkashicPromptCache } from "./prompt-cache.js";
import type { AkashicBridgeConfig } from "./config.js";

type Api = Readonly<{
  registerTool: (tool: any, opts?: any) => void;
  logger: { info?: (msg: string) => void; warn?: (msg: string) => void };
}>;

function toToolName(prefix: string, name: string): string {
  return `${prefix}${name}`;
}

function toolResultFromUnknown(value: unknown): any {
  const v = value as any;
  if (v && typeof v === "object" && Array.isArray(v.content)) return v;
  return { content: [{ type: "text", text: JSON.stringify(value) }] };
}

export class AkashicToolRegistry {
  public constructor(
    private readonly api: Api,
    private readonly cfg: AkashicBridgeConfig,
    private readonly client: AkashicMcpHttpClient,
    private readonly promptCache: AkashicPromptCache
  ) {}

  public async registerAll(): Promise<void> {
    await this.registerProxyTools();
    this.registerConvenienceTools();
  }

  private async registerProxyTools(): Promise<void> {
    const tools = await this.client.listTools();

    for (const t of tools) {
      const remoteName = t.name.trim();
      const localName = toToolName(this.cfg.toolNamePrefix, remoteName);
      const parameters =
        (t as any).inputSchema ??
        (t as any).parameters ??
        ({ type: "object", additionalProperties: true, properties: {} } as const);
      const description = typeof t.description === "string" ? t.description : `Proxy for ${remoteName}`;

      this.api.registerTool({
        name: localName,
        description,
        parameters,
        execute: async (_id: string, args: unknown) => toolResultFromUnknown(await this.client.callTool({ name: remoteName, arguments: args }))
      });
    }

    this.api.logger.info?.(`[akashic-bridge] registered ${tools.length} proxy tools`);
  }

  private registerConvenienceTools(): void {
    const prefix = this.cfg.toolNamePrefix;

    this.api.registerTool({
      name: toToolName(prefix, "resources_list"),
      description: "List Akashic MCP resources (documents/files)",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          cursor: { type: "string" },
          limit: { type: "number" }
        }
      },
      execute: async (_id: string, args: unknown) => toolResultFromUnknown(await this.client.listResources(args))
    });

    this.api.registerTool({
      name: toToolName(prefix, "resources_read"),
      description: "Read an Akashic MCP resource by URI",
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["uri"],
        properties: {
          uri: { type: "string" }
        }
      },
      execute: async (_id: string, args: unknown) => toolResultFromUnknown(await this.client.readResource(args))
    });

    this.api.registerTool({
      name: toToolName(prefix, "prompts_list"),
      description: "List Akashic MCP prompts",
      parameters: { type: "object", additionalProperties: false, properties: {} },
      execute: async () => toolResultFromUnknown(await this.client.listPrompts({}))
    });

    this.api.registerTool({
      name: toToolName(prefix, "prompts_get"),
      description: "Get an Akashic MCP prompt by name",
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["name"],
        properties: {
          name: { type: "string" }
        }
      },
      execute: async (_id: string, args: unknown) => toolResultFromUnknown(await this.client.getPrompt(args))
    });

    this.api.registerTool({
      name: toToolName(prefix, "prompt_refresh"),
      description: "Refresh cached Akashic prompt for system prompt injection",
      parameters: { type: "object", additionalProperties: false, properties: {} },
      execute: async () =>
        toolResultFromUnknown({
          promptName: this.cfg.promptName ?? null,
          loaded: (await this.promptCache.refresh({ client: this.client, promptName: this.cfg.promptName })) != null
        })
    });

    this.api.registerTool({
      name: toToolName(prefix, "prompt_status"),
      description: "Show cached Akashic prompt status",
      parameters: { type: "object", additionalProperties: false, properties: {} },
      execute: async () => toolResultFromUnknown({ promptName: this.cfg.promptName ?? null, loaded: this.promptCache.get() != null })
    });
  }
}

