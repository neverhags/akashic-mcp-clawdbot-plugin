import { AkashicBridgeConstants } from "./constants.js";
import type { AkashicMcpHttpClient } from "./mcp-client.js";

type PromptGetResult = Readonly<{
  description?: string;
  messages?: Array<{ role: string; content: unknown }>;
  content?: unknown;
}>;

function asText(value: unknown): string {
  if (typeof value === "string") return value;
  return "";
}

function normalizePromptText(payload: unknown): string {
  const p = (payload ?? {}) as PromptGetResult;

  const messages = Array.isArray(p.messages) ? p.messages : [];
  for (const m of messages) {
    const role = typeof m?.role === "string" ? m.role : "";
    if (role === "system") {
      const c = m?.content as any;
      if (typeof c === "string") return c;
      if (Array.isArray(c) && c.length > 0 && typeof c[0]?.text === "string") return c[0].text;
      if (c && typeof c.text === "string") return c.text;
    }
  }

  const c = (p as any).content;
  if (typeof c === "string") return c;
  if (Array.isArray(c) && c.length > 0 && typeof c[0]?.text === "string") return c[0].text;
  if (c && typeof c.text === "string") return c.text;

  return "";
}

export class AkashicPromptCache {
  private value: string | null = null;

  public get(): string | null {
    return this.value;
  }

  public async refresh(params: { client: AkashicMcpHttpClient; promptName?: string }): Promise<string | null> {
    if (!params.promptName) {
      this.value = null;
      return null;
    }

    const result = (await params.client.getPrompt({ name: params.promptName })) as unknown;
    const text = normalizePromptText(result).trim();
    this.value = text.length > 0 ? text : null;
    return this.value;
  }

  public buildInjectionBlock(promptText: string): string {
    return `${AkashicBridgeConstants.prompt.sectionDelimiterStart}${promptText}${AkashicBridgeConstants.prompt.sectionDelimiterEnd}`;
  }
}

