import { AkashicBridgeConstants } from "./constants.js";
import type { AkashicBridgeConfig } from "./config.js";
import type { AkashicMcpHttpClient } from "./mcp-client.js";
import type { AkashicPromptCache } from "./prompt-cache.js";

type BootstrapFile = Readonly<{
  name: string;
  path: string;
  content?: string;
  missing?: boolean;
}>;

export class AkashicBootstrapHook {
  public constructor(
    private readonly cfg: AkashicBridgeConfig,
    private readonly client: AkashicMcpHttpClient,
    private readonly cache: AkashicPromptCache
  ) {}

  public handler(): (event: unknown) => Promise<void> {
    return async (event: unknown) => {
      const e = event as any;
      if (!e || e.type !== "agent" || e.action !== "bootstrap") return;
      const context = e.context as any;
      if (!context || typeof context.workspaceDir !== "string") return;
      const files = Array.isArray(context.bootstrapFiles) ? (context.bootstrapFiles as BootstrapFile[]) : [];
      if (files.length === 0) return;

      const existing = this.cache.get();
      const promptText = existing ?? (await this.cache.refresh({ client: this.client, promptName: this.cfg.promptName }));
      if (!promptText) return;

      const updated = files.map((f) => {
        if (f?.name !== AkashicBridgeConstants.hook.targetBootstrapFile) return f;
        if (f?.missing) return f;
        const content = typeof f.content === "string" ? f.content : "";
        const injection = this.cache.buildInjectionBlock(promptText);
        const next = content.includes(injection) ? content : `${content}${injection}`;
        return { ...f, content: next };
      });

      context.bootstrapFiles = updated;
    };
  }
}

