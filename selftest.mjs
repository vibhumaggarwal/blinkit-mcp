#!/usr/bin/env node
/**
 * Starts the server the way a client does, over stdio, and checks it answers.
 *   node selftest.mjs            protocol only: handshake, tool list, input validation (free)
 *   node selftest.mjs --live     also runs a real location + search on Blinkit (free on hunch-browser; spends credits on Browser Use)
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { extractJson } from "./server.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const live = process.argv.includes("--live");
let failed = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failed++;
};

check("extractJson: bare", extractJson('{"a":1}')?.a === 1);
check("extractJson: fenced with prose", extractJson('Here:\n```json\n{"a":[1,2]}\n```\nDone.')?.a?.length === 2);
check("extractJson: prose around", extractJson('Result: {"a":{"b":2}} — end}')?.a?.b === 2);
check("extractJson: escaped quotes", extractJson('{\\"a\\": \\"x\\", \\"b\\": [{\\"c\\": 2}]}')?.b?.[0]?.c === 2);
check("extractJson: none", extractJson("nothing here") === undefined);

const client = new Client({ name: "blinkit-selftest", version: "0" });
await client.connect(new StdioClientTransport({ command: process.execPath, args: [join(here, "server.mjs")], env: { ...process.env }, stderr: "inherit" }));

const { tools } = await client.listTools();
const names = tools.map((t) => t.name);
const want = ["blinkit_status", "blinkit_set_location", "blinkit_search", "blinkit_add_to_cart", "blinkit_view_cart", "blinkit_update_cart", "blinkit_login", "blinkit_submit_otp", "blinkit_addresses", "blinkit_checkout", "blinkit_orders", "blinkit_live_view", "blinkit_close"];
check("handshake + tools/list", want.every((n) => names.includes(n)), `${names.length} tools`);

const bad = await client.callTool({ name: "blinkit_login", arguments: { phone: "12345" } }).catch((e) => ({ isError: true, thrown: e.message }));
check("rejects a bad phone number", bad.isError === true);

const idle = await client.callTool({ name: "blinkit_close", arguments: {} });
check("blinkit_close with nothing running", !idle.isError, idle.content?.[0]?.text);

if (live) {
  const call = async (name, args) => {
    const t = Date.now();
    const res = await client.callTool({ name, arguments: args }, undefined, { timeout: 10 * 60_000 });
    const text = res.content?.map((c) => c.text).join("\n") ?? "";
    console.log(`--- ${name} (${Math.round((Date.now() - t) / 1000)}s)\n${text}`);
    // hunch-browser's skills answer flat; Browser Use's agent answers under "data".
    const body = extractJson(text);
    return { res, body, data: body?.data ?? body };
  };
  const loc = await call("blinkit_set_location", { location: process.env.BLINKIT_TEST_LOCATION ?? "Indiranagar, Bengaluru" });
  check("live: set location", !loc.res.isError && Boolean(loc.data?.deliveryLocation));
  const found = await call("blinkit_search", { query: "amul milk", limit: 5 });
  check("live: search returns priced products", !found.res.isError && found.data?.results?.length > 0 && found.data.results.every((r) => r.name && typeof r.price === "number"));
  const closed = await call("blinkit_close", {});
  check("live: browser stopped", !closed.res.isError);
}

await client.close();
console.log(failed ? `\n${failed} check(s) failed` : "\nall checks passed");
process.exit(failed ? 1 : 0);
