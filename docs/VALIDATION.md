# Validation record

Date: October 17, 2026.

## What was checked

- Automated API tests cover rule-based pricing, verified excerpts, contradictory findings, strict structured AI requests, refusal/error handling, quote tampering and expiry, explicit checkout approval, sandbox order binding, capture mismatch, pending capture, lost-response reconciliation, stable idempotency IDs, and input/origin/body limits.
- Application checks cover the HTML route and response headers, inline JavaScript syntax, localhost development, configured public origins behind a proxy, and rejection of request targets that could override the canonical callback origin.
- The dependency-free Worker build was generated and imported successfully; its default fetch handler is valid ES module code.

External API calls in automated tests are mocked. They verify request construction and application decisions, not provider credentials or live service behavior.

## Still required before submission

- A fresh analysis against the configured real AI service.
- A complete PayPal sandbox journey using separate merchant and buyer accounts, including returned order/capture references and checked amount/currency.
- Manual desktop/mobile browser checks, keyboard navigation, cancellation, retries, pending-order recovery and agreement export.
- User testing and a labeled scope-classification evaluation. No user-outcome or performance claims have been established.
- A public open-source repository and working judge access, plus the public under-three-minute video.

The hosted owner preview starts with unconfigured AI and PayPal accounts. It labels its analysis as a rules-based sample and does not simulate a payment. The project must not be submitted as a verified connected AI/payment demo in that state.
