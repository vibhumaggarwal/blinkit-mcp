# Blinkit MCP

Order groceries from [Blinkit](https://blinkit.com) by talking to Claude (or any MCP client).

> "Get me two Amul Taaza and a loaf of bread, deliver to Indiranagar."

Claude sets your location, searches, fills the cart and shows you the bill. You pay yourself, through
a live link to the browser. **It never pays on its own.**

## Tools

| Tool | What it does |
|---|---|
| `blinkit_set_location` | Set the delivery area |
| `blinkit_search` | Products with price, MRP, pack size and stock |
| `blinkit_add_to_cart` | Add an item by name or id |
| `blinkit_view_cart` | Items, bill breakdown, grand total, delivery time |
| `blinkit_update_cart` | Change a quantity, remove an item, or clear the cart |
| `blinkit_login` / `blinkit_submit_otp` | Log in with your phone number and OTP |
| `blinkit_addresses` | Your saved delivery addresses |
| `blinkit_orders` | Your recent orders |
| `blinkit_checkout` | The final bill plus a live browser link to pay in |
| `blinkit_live_view` | Watch or take over the browser |
| `blinkit_status` / `blinkit_close` | Session state; stop the browser |

The browser profile is kept between runs, so you log in once. The cart carries over from one call to
the next.

## Setup

Needs Node 20+ and a [Browser Use Cloud](https://cloud.browser-use.com) API key (it runs the browser).

```sh
git clone https://github.com/vibhumaggarwal/blinkit-mcp
cd blinkit-mcp
npm install
cp .env.example .env    # paste your BROWSER_USE_API_KEY
```

### Claude Code

```sh
claude mcp add blinkit -s user -- node "$PWD/server.mjs"
```

### Claude Desktop, Cursor and others

```json
{
  "mcpServers": {
    "blinkit": {
      "command": "node",
      "args": ["/absolute/path/to/blinkit-mcp/server.mjs"],
      "env": { "BROWSER_USE_API_KEY": "bu_..." }
    }
  }
}
```

Check it works:

```sh
node selftest.mjs          # protocol checks, free
node selftest.mjs --live   # a real location + search on Blinkit (uses Browser Use credits)
```

## Good to know

- Blinkit only delivers in India, and it blocks most data-centre traffic. Browser Use handles the
  browser side.
- Logging in with a number Blinkit doesn't know creates an account. Use your own number.
- Each step is a Browser Use agent task: roughly 20–80 seconds and a few cents.
- State lives in `~/.blinkit-mcp` (override with `BLINKIT_MCP_HOME`).
- Unofficial. Not affiliated with Blinkit or Zomato.

## License

MIT
