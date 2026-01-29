import { AkashicBridgeConstants } from "./constants.js";
import { JsonRpcErrorResponse, JsonRpcProtocolError, type JsonRpcRequest, type JsonRpcResponse } from "./jsonrpc.js";
import type { AkashicBridgeConfig } from "./config.js";

type ToolSpec = Readonly<{
  name: string;
  description?: string;
  inputSchema?: unknown;
  parameters?: unknown;
}>;

type ToolsListResult = Readonly<{ tools: ToolSpec[] }>;

export class AkashicMcpHttpClient {
  private idSeq = 1;
  private initialized = false;

  public constructor(private readonly cfg: AkashicBridgeConfig) {}

  public async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    await this.call(AkashicBridgeConstants.mcp.methods.initialize, {
      clientInfo: { name: "clawdbot-akashic-bridge", version: "0.1.0" },
      capabilities: { tools: {}, resources: {}, prompts: {} }
    });
    this.initialized = true;
  }

  public async listTools(): Promise<ToolSpec[]> {
    await this.ensureInitialized();
    const result = (await this.call(AkashicBridgeConstants.mcp.methods.toolsList, {})) as ToolsListResult;
    const tools = Array.isArray(result?.tools) ? result.tools : [];
    return tools.filter((t) => typeof t?.name === "string" && t.name.trim().length > 0);
  }

  public async callTool(params: { name: string; arguments?: unknown }): Promise<unknown> {
    await this.ensureInitialized();
    return this.call(AkashicBridgeConstants.mcp.methods.toolsCall, params);
  }

  public async listResources(params: unknown): Promise<unknown> {
    await this.ensureInitialized();
    return this.call(AkashicBridgeConstants.mcp.methods.resourcesList, params);
  }

  public async readResource(params: unknown): Promise<unknown> {
    await this.ensureInitialized();
    return this.call(AkashicBridgeConstants.mcp.methods.resourcesRead, params);
  }

  public async listPrompts(params: unknown): Promise<unknown> {
    await this.ensureInitialized();
    return this.call(AkashicBridgeConstants.mcp.methods.promptsList, params);
  }

  public async getPrompt(params: unknown): Promise<unknown> {
    await this.ensureInitialized();
    return this.call(AkashicBridgeConstants.mcp.methods.promptsGet, params);
  }

  private async call(method: string, params?: unknown, retryCount = 0): Promise<unknown> {
    const url = new URL(this.cfg.mcpUrl);
    url.searchParams.set("owner_id", this.cfg.ownerId);

    const req: JsonRpcRequest = {
      jsonrpc: AkashicBridgeConstants.mcp.jsonrpc,
      id: this.idSeq++,
      method,
      params
    };

    const headers: Record<string, string> = {
      "content-type": "application/json"
    };

    if (this.cfg.authToken) {
      headers.authorization = `Bearer ${this.cfg.authToken}`;
    }

    let res: Response;
    let bodyText: string | null = null;

    try {
      res = await fetch(url.toString(), {
        method: "POST",
        headers,
        body: JSON.stringify(req)
      });
      bodyText = await res.text();
    } catch (err) {
      if (retryCount < 2 && (err as any)?.code === "ECONNRESET" || (err as any)?.message?.includes("fetch")) {
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 500));
        return this.call(method, params, retryCount + 1);
      }
      throw new JsonRpcProtocolError(`Network error: ${String(err)}`);
    }

    if (!res.ok) {
      const isRetryable = res.status >= 500 && res.status < 600 && retryCount < 2;
      const errorMsg = `HTTP ${res.status}${bodyText ? `: ${bodyText.substring(0, 200)}` : ""}`;

      if (isRetryable) {
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 500));
        return this.call(method, params, retryCount + 1);
      }

      throw new JsonRpcProtocolError(errorMsg);
    }

    let parsed: JsonRpcResponse;
    try {
      parsed = JSON.parse(bodyText) as JsonRpcResponse;
    } catch (err) {
      throw new JsonRpcProtocolError(`Invalid JSON response: ${bodyText?.substring(0, 200) ?? "empty"}`);
    }

    if (!parsed || typeof parsed !== "object") {
      throw new JsonRpcProtocolError("Invalid JSON-RPC response structure");
    }

    if ("error" in parsed && parsed.error && typeof parsed.error.message === "string") {
      const isRetryable = parsed.error.code >= -32603 && parsed.error.code <= -32000 && retryCount < 2;
      if (isRetryable) {
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 500));
        return this.call(method, params, retryCount + 1);
      }
      throw new JsonRpcErrorResponse(parsed.error.message, parsed.error.code, parsed.error.data);
    }

    if (!("result" in parsed)) {
      throw new JsonRpcProtocolError("Missing result in JSON-RPC response");
    }

    return parsed.result;
  }
}

