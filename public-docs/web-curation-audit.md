# Canonical 67-task curation audit

## Decision

The recommendation to retain **33 of 67 tasks** was accepted on 2026-09-03.
The other **34 redundant tasks** remain in their original directories for
audit and reproducibility, but are excluded from the canonical manifest. The
retained set has three explicitly separate tiers:

| Tier | Tasks | Purpose |
| --- | ---: | --- |
| Primary benchmark | 23 | 20 real or behavior-derived lineages; main evaluation denominator |
| Synthetic calibration supplement | 6 | Three adjacent V1 pass/fail transition pairs |
| Legacy diagnostic supplement | 4 | One representative per V1 reasoning family |
| Removed from curated manifests | 34 | Template duplicates or dominated variants |

The canonical primary tier has **23/23**
valid GPT-5.6 code-only failures. Screenshot-only CUA passed
**12/23** and failed
**11/23**. These are
adaptive development results and must remain separated by generation.

## First 30 tasks

Retain only **4 of the original 30**:

| Reasoning family | Retained representative | Why |
| --- | --- | --- |
| Numeric representation | `web.tax-rounding-contract.002` | Richest policy-driven numeric composition |
| Temporal representation | `web.support-window-contract.001` | Slot lookup, symbolic time mapping, timezone projection, and a distinct tab interaction |
| Capability semantics | `web.delegated-action-contract.001` | Assignment, role, conditions, allowed modes, and precedence |
| Relational join | `web.configuration-inheritance-contract.001` | Graph traversal and cycle protection |

Remove the other **26** because they are dominated by these representatives or
by later transition ladders. Across the 30-task block:

- all 42 tasks use a synthetic external-contract card;
- the 30 independent contexts use one source repository, one framework, one UI
  surface, one discovery interaction, and one patch topology;
- the formal V1 diversity audit failed 13 gates
  and reported `ready: false`;
- GPT-5.6 CUA passed 27/30 stage-one tasks after the evaluation fix.

The original result files remain historical evidence, but the 26 removed
bundles should not appear in a new published runnable manifest.

## V1 difficulty ladders

Retain only anchor/easy for account recovery, subscription renewal, and
warehouse cutoff: **6 tasks total**. These are the adjacent pass/fail
transitions. Remove all six medium/hard rungs because they add correlated
difficulty without locating another boundary.

## V2 and V3

Retain **9 of 11 V2 tasks**. Remove the original Saleor and React Spectrum
uppers because their later lower-1/lower-2 pairs isolate the boundary more
cleanly. Retain the Vue pair and the MapLibre, Handsontable, and masonry roots.

Retain all **14 V3 tasks**. They span 13 source repositories, 14 product
domains, 13 framework categories, 14 UI surfaces, and 14 mechanisms. Every
root failed code-only; nine passed screenshot-only CUA and five are audited
frontier-boundary failures.

## Reporting policy

1. Use **23 primary tasks** as the main runnable benchmark.
2. Keep the six V1 transition tasks and four diagnostics in separate supplements.
3. Never pool primary, calibration, and diagnostic success rates.
4. Preserve removed-task results and bundles in place for provenance, but
   exclude them from the canonical manifest.

## Removed tasks

- `web.invoice-settlement-contract.001`
- `web.fulfillment-promise-contract.001`
- `web.asset-entitlement-contract.001`
- `web.order-routing-contract.001`
- `web.usage-charge-contract.001`
- `web.refund-policy-contract.001`
- `web.inventory-source-contract.001`
- `web.storage-quota-contract.002`
- `web.subscription-renewal-contract.002`
- `web.warehouse-cutoff-contract.001`
- `web.deployment-action-contract.001`
- `web.account-recovery-contract.001`
- `web.incident-escalation-contract.001`
- `web.returns-destination-contract.001`
- `web.energy-budget-contract.001`
- `web.locale-fallback-contract.001`
- `web.feature-flag-contract.001`
- `web.shipping-rate-contract.001`
- `web.notification-channel-contract.001`
- `web.review-assignment-contract.001`
- `web.policy-template-contract.001`
- `web.payment-rail-contract.001`
- `web.warehouse-bin-contract.001`
- `web.release-channel-contract.001`
- `web.oncall-owner-contract.001`
- `web.identity-mapping-contract.001`
- `web.account-recovery-frontier-medium.001`
- `web.account-recovery-frontier-hard.001`
- `web.subscription-renewal-frontier-medium.001`
- `web.subscription-renewal-frontier-hard.001`
- `web.warehouse-cutoff-frontier-medium.001`
- `web.warehouse-cutoff-frontier-hard.001`
- `web.saleor-export-current-search.001`
- `web.react-spectrum-combobox-selection.001`

## Artifacts

- `dataset/audits/web-canonical-67-audit.yaml`
- `dataset/audits/web-primary-23-proposed-manifest.yaml`
- `dataset/audits/web-curated-33-proposed-manifest.yaml`
- `dataset/audits/web-curated-33-admission.yaml`
- `dataset/collections/web-curated-33/manifest.yaml`
- `viewer/data/corpus-audit.json`
- `viewer/index.html`
