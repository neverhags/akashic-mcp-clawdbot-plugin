export const AkashicBridgeConstants = {
  env: {
    mcpUrl: "AKASHIC_MCP_URL",
    ownerId: "AKASHIC_OWNER_ID",
    authToken: "AKASHIC_AUTH_TOKEN",
    promptName: "AKASHIC_PROMPT_NAME",
    toolNamePrefix: "AKASHIC_TOOL_PREFIX"
  },
  defaults: {
    toolNamePrefix: "akashic_"
  },
  hook: {
    name: "akashic-system-prompt",
    description: "Inject Akashic prompt into TOOLS.md during agent bootstrap",
    targetBootstrapFile: "TOOLS.md"
  },
  mcp: {
    jsonrpc: "2.0",
    methods: {
      initialize: "initialize",
      toolsList: "tools/list",
      toolsCall: "tools/call",
      resourcesList: "resources/list",
      resourcesRead: "resources/read",
      promptsList: "prompts/list",
      promptsGet: "prompts/get"
    }
  },
  prompt: {
    sectionDelimiterStart: "\n\n<akashic_prompt>\n",
    sectionDelimiterEnd: "\n</akashic_prompt>\n"
  }
} as const;

