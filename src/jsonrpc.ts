import { AkashicBridgeConstants } from "./constants.js";

export type JsonRpcId = number;

export type JsonRpcRequest = Readonly<{
  jsonrpc: typeof AkashicBridgeConstants.mcp.jsonrpc;
  id: JsonRpcId;
  method: string;
  params?: unknown;
}>;

export type JsonRpcSuccess = Readonly<{
  jsonrpc: string;
  id: JsonRpcId;
  result: unknown;
}>;

export type JsonRpcError = Readonly<{
  jsonrpc: string;
  id: JsonRpcId | null;
  error: { code: number; message: string; data?: unknown };
}>;

export type JsonRpcResponse = JsonRpcSuccess | JsonRpcError;

export class JsonRpcErrorResponse extends Error {
  public readonly code: number;
  public readonly data?: unknown;

  public constructor(message: string, code: number, data?: unknown) {
    super(message);
    this.code = code;
    this.data = data;
  }
}

export class JsonRpcProtocolError extends Error {}

