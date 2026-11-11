# ScopePay — demo recording plan

**Use this script only after a connected, real end-to-end run succeeds.** The current credential-free experience is a sample preview; it cannot support claims that AI inference or PayPal integration has been verified. Follow the [README](../README.md) to configure the final build, complete the actual checks, and adapt labels or wording to what the product demonstrably does.

Target length: **2 minutes 50 seconds**, leaving a small buffer below the three-minute limit. The narration below is approximately 300 words. Keep the browser readable. Use synthetic project content and a PayPal sandbox buyer account. Do not record developer secrets, personal account details, or production payments.

| Time | On-screen action | Simple English narration |
| --- | --- | --- |
| 0:00–0:18 | Open the connected app. Show the original brief and the new client request. | “You agree on a fixed price for a small website. Then your client asks for one more feature. Is it included? What should it cost? ScopePay helps both sides make that decision before extra work begins.” |
| 0:18–0:40 | Enter or edit a fresh request, then run analysis. Wait for the actual model response. | “Here is the agreed project brief. Here is a new request from the client. I will run a fresh AI analysis now. The AI compares the request with this brief. It helps prepare a proposal, and the freelancer still reviews the result.” |
| 0:40–1:05 | Open the evidence for a finding and show the corresponding brief passage. | “This finding points back to the original wording. We can check why the system considers this extra work. If the agreement is unclear, we should clarify it. We should not charge someone just because an AI sounds confident.” |
| 1:05–1:28 | Show all three options and their actual displayed estimates. | “The client has three choices. Add the work and pay the reviewed extra price. Swap an existing deliverable for the new request. Or defer the request and keep the current agreement. Each option explains what changes.” |
| 1:28–1:48 | Select Swap. Show exactly what would be removed and added, without committing a payment. | “Let’s first look at Swap. This shows the work we would remove and the work we would add. The client can see the trade-off before making a decision. A swap does not silently change the original project.” |
| 1:48–2:26 | Return to Add and pay. Show the reviewed amount, open real PayPal sandbox checkout, and approve with the sandbox buyer. | “Now the client decides to keep the original work and buy the addition. This is PayPal’s real sandbox checkout. No real money moves. The client sees the price and approves the payment in PayPal.” |
| 2:26–2:50 | Return to ScopePay. Wait for confirmed backend capture; show the actual capture result or reference. | “ScopePay confirms the payment only after the backend verifies capture. We can now see the sandbox result. The client stays in control, and the freelancer has a clear agreement before starting the addition. We want to make fair conversations easier for small freelance projects. This is a clearer way to agree on extra work.” |

## Before recording

- Test this exact fresh-input journey on the final build with real AI credentials and PayPal sandbox credentials.
- Confirm the checkout uses the reviewed server-side amount and currency, and the success screen follows a completed capture.
- If a step fails or remains simulated, fix it before using this script. Never edit a sample result into a real transaction sequence.
- Rehearse once with a timer. Keep the actual approval and capture visible; shorten the introduction if needed.
- Upload the final video as publicly visible on YouTube and place its link in the submission. Recheck the [official requirements](https://paypalaihackathon.devpost.com/).
