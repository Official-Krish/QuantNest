import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";
import * as zerodha from "./tools/zerodha.js";
import * as groww from "./tools/groww.js";
import * as jupiter from "./tools/jupiter.js";
import * as lighter from "./tools/lighter.js";

const configSchema = Type.Object({
  brokers: Type.Optional(
    Type.Record(Type.String(), Type.Record(Type.String(), Type.String())),
  ),
});

export default defineToolPlugin({
  id: "quantnest",
  name: "QuantNest Trading",
  description:
    "Multi-broker trading tools for Zerodha, Groww, Jupiter, and Lighter",
  configSchema,
  tools: (tool) => [
    tool(zerodha.getPositions),
    tool(zerodha.placeOrder),
    tool(groww.getPortfolio),
    tool(groww.placeOrder),
    tool(jupiter.getQuoteTool),
    tool(jupiter.swap),
    tool(lighter.execute),
  ],
});
