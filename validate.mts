const pluginDir = new URL(".", import.meta.url).pathname;
process.chdir(pluginDir);

const hooks: { event: string[]; handler: unknown; opts: unknown }[] = [];
const tools: { name: string; description?: string }[] = [];
const commands: { name: string }[] = [];
let warnCalls: string[] = [];
let infoCalls: string[] = [];

const api = {
  pluginConfig: null as Record<string, unknown> | null,
  logger: {
    warn: (msg: string) => { warnCalls.push(msg); },
    info: (msg: string) => { infoCalls.push(msg); },
  },
  registerHook: (event: string[], handler: unknown, opts: unknown) => {
    hooks.push({ event, handler, opts });
  },
  registerTool: (tool: { name: string; description?: string }) => {
    tools.push({ name: tool.name, description: tool.description });
  },
  registerCommand: (cmd: { name: string }) => {
    commands.push({ name: cmd.name });
  },
};

async function run() {
  const register = (await import("./index.ts")).default;

  warnCalls = [];
  infoCalls = [];
  hooks.length = 0;
  tools.length = 0;
  commands.length = 0;
  api.pluginConfig = null;

  register(api);

  if (hooks.length !== 0 || tools.length !== 0 || commands.length !== 0) {
    console.error("FAIL: sin config debería no registrar nada");
    process.exit(1);
  }
  if (!warnCalls.some((m) => m.includes("missing config") || m.includes("plugin idle"))) {
    console.error("FAIL: debería avisar plugin idle");
    process.exit(1);
  }
  console.log("OK: sin config -> plugin idle");

  warnCalls = [];
  infoCalls = [];
  hooks.length = 0;
  tools.length = 0;
  commands.length = 0;
  api.pluginConfig = {
    mcpUrl: "https://akashic-mcp.com/mcp",
    ownerId: "00000000-0000-0000-0000-000000000000",
    toolNamePrefix: "akashic_",
  };

  register(api);

  if (hooks.length !== 1) {
    console.error("FAIL: con config debería registrar 1 hook, got", hooks.length);
    process.exit(1);
  }
  if (!commands.some((c) => c.name === "akashicprompts")) {
    console.error("FAIL: debería registrar comando akashicprompts");
    process.exit(1);
  }

  await new Promise((r) => setTimeout(r, 500));

  if (tools.length === 0 && !warnCalls.some((m) => m.includes("tool registration failed"))) {
    console.log("OK: con config -> hook + comando; tools async (pueden fallar si MCP no responde)");
  } else if (tools.length > 0) {
    console.log("OK: con config -> hook + comando +", tools.length, "tools");
  } else {
    console.log("OK: con config -> hook + comando; tools no registrados (MCP inaccesible o error)");
  }

  console.log("Plugin validado.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
