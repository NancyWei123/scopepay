# ScopePay — hackathon strategy

**ScopePay helps freelance web developers agree on a fair response to a client’s extra request: add and pay, swap existing work, or defer.** AI compares the request with the agreed brief and explains its evidence. The freelancer reviews the proposal before a client can approve a PayPal sandbox payment.

## Current status and submission gate

This is a prototype in development. Without configured AI and PayPal credentials, the interface is a **sample preview**. Sample analysis and payment previews do not establish a working integration. Do not describe the present build as a verified AI or PayPal implementation.

The project is not ready for submission until a fresh request has completed real model inference, a client has approved a real PayPal **sandbox** order, and the backend has verified its capture. Record those checks against the final build. See the [README](../README.md) for setup and the actual configuration requirements.

## A focused audience and promise

Start with independent web developers and small student studios selling fixed-price website work. A typical problem is a client asking for an extra page or language after the original agreement. The freelancer needs a clear conversation before starting that work; the client needs a choice they can understand.

The product promise is a quicker, clearer change decision. Do not claim measured revenue recovery, legal enforceability, escrow, guaranteed payment, or independent market validation. Prices are proposals reviewed by the freelancer. Sandbox transactions move no real money.

## Why this version could stand out

The market already contains close alternatives. [EasyScope](https://www.easyscope.io/en) advertises AI scope detection, cost and timeline estimates, approval links, invoicing, and PayPal payment URLs. [Stria](https://getstria.com/product-shot-ai) advertises verified scope excerpts, clarification when evidence is weak, rate-card pricing, versioned approvals, and payment workflows. Scope detection plus a generated invoice is not a novel claim.

Our design hypothesis is that **three concrete choices make scope negotiation easier**:

| Choice | What the client agrees to | What the product must explain |
| --- | --- | --- |
| Add and pay | Keep the original scope and buy the addition | Added work, reviewed price, and any delivery effect |
| Swap | Replace a named original deliverable with the requested work | Exactly what is removed and added; any unresolved difference |
| Defer | Keep the current agreement and revisit the addition later | What stays in the present scope and what is postponed |

Treat this as a differentiating product direction, not proof that nobody else offers it. A swap must not be called budget-neutral unless its reviewed estimates support that claim. An ambiguous brief should lead to a clarification, not invented contractual evidence.

## Honest prize targets

Aim primarily for **Best Use of PayPal + AI** and **Best Demo Delivery**, both listed at $5,000. These are aspirations, not predicted wins. Do not claim sponsor award eligibility without actually using the relevant sponsor tool. No sponsor award is part of this plan.

The judging criteria are equally weighted: technology, design, impact, innovation, and presentation. Demonstrate one complete journey with a fresh AI analysis and confirmed sandbox capture, then make its audience and benefit easy to understand. See the [official rules, sections 6 and 8](https://paypalaihackathon.devpost.com/rules).

## Validation plan — targets, not results

Recruit five freelancers or student developers with fixed-price project experience and two people who have commissioned a small website. Ask about their most recent real scope change, what they agreed, and how payment was handled. Use an anonymized or synthetic brief for testing. Record participant consent and separate quotes from our interpretation.

Ask participants to compare the three options, explain what a swap removes, edit an estimate, and identify when payment is due. Do not coach them through those decisions. Report the small sample size and inconvenient findings as well as positive feedback.

| Check | Target before submission |
| --- | --- |
| Understanding | At least 4 of 5 developer testers correctly explain all three choices |
| Speed | Median reviewed change proposal in under 3 minutes in the task trial |
| AI evaluation | At least 30 labeled requests covering included, extra, mixed, and ambiguous work; publish actual outcomes |
| Evidence | Every displayed quotation matches the supplied brief; unsupported findings ask for review |
| Pricing | Correct reviewed amount and currency in every tested checkout; client changes cannot override server totals |
| Payments | At least 10 completed sandbox approval/capture journeys, including retry and cancellation checks |

Targets may change after testing. Never report them as achieved without saved evidence.

## Build plan: October 17–November 12, 2026

| Dates | Deliverable and exit condition |
| --- | --- |
| Oct 17–23 | Finish the connected core: brief + request → real AI comparison → reviewed options → sandbox checkout and capture. Keep preview status explicit. |
| Oct 24–30 | Test the three choices with the seven planned participants. Improve unclear evidence, pricing, and swap explanations. Start the labeled evaluation set. |
| Oct 31–Nov 6 | Resolve payment errors and retries, run the evaluation, tighten responsive/accessibility behavior, and finish reproducible setup instructions. |
| Nov 7–12 | Test the final build from a clean setup, record a real end-to-end video, complete the public repository and Devpost description, and submit early. |

## Essential submission checks

- **Deadline: November 13, 2026, 7:00 am Sydney/Melbourne time**, equivalent to November 12, noon PST. Aim to submit the previous day. [Official schedule](https://paypalaihackathon.devpost.com/details/dates)
- Meaningful PayPal sandbox and AI integrations; a working hosted build or complete runnable setup.
- Public source repository with all required source/assets, setup instructions, and a detectable open-source license.
- English project description explaining the audience, features, and AI/tools used.
- Publicly visible YouTube demo under three minutes, showing the functioning product; use only material we have permission to include.
- Keep judge access working through December 15. Provide clear test-access instructions without publishing server secrets.

Check the [challenge overview](https://paypalaihackathon.devpost.com/) and [official rules](https://paypalaihackathon.devpost.com/rules) again before submission. Adult residents of Australia are not a named geographic exclusion, but each entrant must confirm the remaining eligibility conditions.
