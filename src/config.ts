import { AkashicBridgeConstants } from "./constants.js";

export type AkashicBridgeConfig = Readonly<{
  mcpUrl: string;
  ownerId: string;
  authToken?: string;
  promptName?: string;
  toolNamePrefix: string;
}>;

type PluginConfigShape = Readonly<{
  mcpUrl?: unknown;
  ownerId?: unknown;
  authToken?: unknown;
  promptName?: unknown;
  toolNamePrefix?: unknown;
}>;

function asOptionalTrimmedString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function asTrimmedString(value: unknown): string {
  const result = asOptionalTrimmedString(value);
  if (!result) throw new Error("Invalid config");
  return result;
}

const ALLOWED_HOSTS = ["localhost", "127.0.0.1", "::1"];

function isAllowedInsecureHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return ALLOWED_HOSTS.some((h) => lower === h || lower.endsWith(`.${h}`));
}

function validateMcpUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (url.protocol === "https:") return raw;
    if (url.protocol === "http:" && isAllowedInsecureHost(url.hostname)) return raw;
    return null;
  } catch {
    return null;
  }
}

export class AkashicBridgeConfigLoader {
  public load(params: { pluginConfig: unknown; env: NodeJS.ProcessEnv }): AkashicBridgeConfig | null {
    const pc = (params.pluginConfig ?? {}) as PluginConfigShape;
    const env = params.env;

    const mcpUrlRaw =
      asOptionalTrimmedString(pc.mcpUrl) ?? asOptionalTrimmedString(env[AkashicBridgeConstants.env.mcpUrl]);
    const ownerId =
      asOptionalTrimmedString(pc.ownerId) ?? asOptionalTrimmedString(env[AkashicBridgeConstants.env.ownerId]);

    if (!mcpUrlRaw || !ownerId) return null;

    const mcpUrl = validateMcpUrl(mcpUrlRaw);
    if (!mcpUrl) return null;

    const authToken =
      asOptionalTrimmedString(pc.authToken) ?? asOptionalTrimmedString(env[AkashicBridgeConstants.env.authToken]);
    const promptName =
      asOptionalTrimmedString(pc.promptName) ?? asOptionalTrimmedString(env[AkashicBridgeConstants.env.promptName]);

    const toolNamePrefixRaw =
      asOptionalTrimmedString(pc.toolNamePrefix) ??
      asOptionalTrimmedString(env[AkashicBridgeConstants.env.toolNamePrefix]) ??
      AkashicBridgeConstants.defaults.toolNamePrefix;

    const toolNamePrefix = asTrimmedString(toolNamePrefixRaw);

    return { mcpUrl, ownerId, authToken, promptName, toolNamePrefix };
  }
}

