# ScopePay

**A fair price for every change.** ScopePay helps independent web designers and developers discuss late client requests. Compare the request with the agreed brief, review evidence and pricing, then choose **add work**, **swap scope**, or **defer**. The paid path uses PayPal sandbox Orders v2.

Built for the [PayPal AI Hackathon](https://paypalaihackathon.devpost.com/). This is an early working prototype, with real provider adapters and a clearly labelled rules-based sample preview. The owner preview is private; it is not a public judge-access URL.

## Current status

- Interactive workspace, editable brief/message/rate/budget, three options, local activity history and agreement export.
- Optional server-side OpenAI analysis; exact evidence excerpts are checked against the submitted text and prices are calculated by the server.
- Optional server-side PayPal **sandbox only** create → buyer approval → capture flow, with signed quotes, amount binding and stable request IDs.
- Without provider credentials, the application runs an explicit sample preview. **Sample analysis is not AI and no payment is simulated.**
- Live OpenAI calls and genuine PayPal sandbox checkout have **not been verified in this build environment**. Connect your accounts and run the acceptance checklist before submitting or filming.

## Run on Windows, macOS or Linux

Install [Node.js](https://nodejs.org/) 22.9 or later (this build was tested with Node 24), then download this repository. There are no npm dependencies to install.

```sh
cd scopepay
npm start
```

Open **http://127.0.0.1:3000**. The sample workspace works without a `.env` file. Stop the server with Ctrl+C. After changing source code, restart it and refresh the page.

For connected mode, copy `.env.example` to `.env`:

```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

```sh
# macOS/Linux
cp .env.example .env
```

Fill in the values in your local `.env` using a text editor, then restart the server. Never put secret values in browser code, Git, screenshots, or the submission text.

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Your OpenAI API key; server-side analysis only |
| `OPENAI_MODEL` | Model with Chat Completions strict Structured Outputs (`json_schema`); default `gpt-4.1-mini` |
| `PAYPAL_CLIENT_ID` | **Sandbox** REST app client ID |
| `PAYPAL_CLIENT_SECRET` | Matching sandbox REST app secret |
| `QUOTE_SIGNING_SECRET` | Random secret of at least 32 characters, used to authenticate quotes and checkout approvals |
| `PORT` | Local port, default `3000` |
| `HOST` | Local bind address, default `127.0.0.1`; use `0.0.0.0` on a hosting provider |
| `PUBLIC_ORIGIN` | For hosted Node deployments, exact public HTTPS origin; required with a non-local domain and used for PayPal callbacks. Worker hosting derives its origin from the request. |

Generate a signing secret with:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Keep the generated value private. The app refuses payments without signing configuration. It always calls `https://api-m.sandbox.paypal.com`; there is no live-payments switch.

## Set up PayPal and AI

1. Open [PayPal Developer dashboard](https://developer.paypal.com/dashboard/). Create a **Sandbox** REST app under Apps & Credentials, linked to your sandbox business account. Copy its client ID and secret to `.env`.
2. Create or select a **different sandbox personal buyer account** under Testing Tools → Sandbox Accounts. Use that buyer account in the PayPal approval window; do not pay with the merchant account.
3. Set an OpenAI API key with access to your selected model. The API account needs available usage credit; a ChatGPT subscription does not supply API usage.
4. Set the signing secret, restart, and open Setup. Confirm AI and PayPal are connected. Click **Analyze change** for a fresh model run; **Load sample** intentionally stays a sample.
5. Review and agree to the paid option. Continue to PayPal sandbox, sign in with the sandbox buyer, approve, and return. Only the server's validated capture response can mark the order paid.

This environment does not include your service accounts. Use `.env` locally or configure encrypted runtime environment values through the hosting provider. Do not paste secrets into a public repository or application text fields.

## Tests and build

```sh
npm test
npm run build
npm run validate
```

Tests use mocked external services; they do not move funds or establish that live credentials work. The build combines the dependency-free source modules into `dist/server/index.js`, a Cloudflare-compatible Worker with a default `fetch(request, env)` export. The Node adapter runs the same source locally.

## Architecture

| File | Responsibility |
| --- | --- |
| `worker/ui.js` | Responsive, accessible HTML/CSS/JS workspace; local activity and agreement exports |
| `worker/api.js` | Input validation, model adapter, evidence checks, quote signatures, sandbox Orders API and capture validation |
| `worker/index.js` | Routes and response security headers |
| `scripts/dev.mjs` | Dependency-free Node HTTP adapter |
| `scripts/build.mjs` | Single-module Worker build |
| `tests/` | API boundary, pricing and payment verification tests |
| `docs/STRATEGY.md` | Competition, user validation plan, schedule and judging strategy |
| `docs/DEMO_SCRIPT.md` | Under-three-minute end-to-end video plan |

Quotes are signed server-side. Checkout accepts a signed quote and a selected option rather than trusting an amount from the browser. PayPal's approval redirect is only a navigation event: the server checks order identity, quote reference, currency, amount and completed capture. The AI does not receive payment credentials or independently authorize a payment.

## Limits and next steps

This prototype has one freelancer/client workspace in one browser. Saving an agreement is local draft bookkeeping, not proof that a separate client has signed it. Browser activity is editable, browser-local history, not an immutable audit ledger. Signed quote tokens provide integrity, not confidentiality; do not place confidential briefs in shared URLs.

Estimates and scope swaps need human review. An evidence excerpt confirms that text exists, not that the model's interpretation is legally correct. The tool is not escrow, arbitration, or a guarantee of payment. No tax calculation, refunds, durable payment database or webhook reconciliation is included. For production, add separate client identities and durable approved versions, webhook verification/reconciliation, rate limiting and an appropriate data-retention policy. The sample rate card only recognizes a small set of website requests; unsupported requests require clarification.

## Before submitting

- Connect real AI and PayPal **sandbox** accounts and complete a fresh analysis and successful sandbox capture.
- Check cancellation, decline/retry, expired quote, edited inputs and browser refresh; confirm no redirect alone marks a payment complete.
- Ask freelancers to test the three choices and document actual findings. Do not claim unmeasured time or money savings.
- Publish this source on **GitHub, GitLab or Bitbucket** with `LICENSE` at its root. The private preview/source hosting is not a substitute for the required public repository.
- Give judges complete setup instructions or an unrestricted working demo through the end of judging. Provide test-account access through the appropriate private judging fields; keep your secret API keys out of public source.
- Record a **public YouTube demo under three minutes** showing a real model run and real sandbox approval/capture. Submit the description, tool disclosure, repository URL and video URL before **13 November 2026, 7:00 am Australia/Sydney**.

## Tools and references

AI runtime: OpenAI Chat Completions with strict Structured Outputs (model configured by `OPENAI_MODEL`). AI assists scope classification, reasoning and negotiation suggestions; the server validates output and computes money. Development assistance: OpenAI Codex. Payments: PayPal REST OAuth and Orders v2 sandbox. Runtime: JavaScript, Node.js/Cloudflare Workers, Web Crypto. No sponsor-tool prize eligibility is claimed.

- [Official hackathon rules](https://paypalaihackathon.devpost.com/rules)
- [PayPal Orders v2](https://developer.paypal.com/api/orders/v2/)
- [PayPal authentication](https://developer.paypal.com/api/rest/authentication/)
- [PayPal idempotency](https://developer.paypal.com/api/rest/reference/idempotency/)
- [OpenAI Chat Completions reference](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create)

MIT licensed. See [LICENSE](LICENSE).
