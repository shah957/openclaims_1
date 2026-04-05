---
doc: 05-rules-engine
depends_on:
  - 00-concept.md
  - 01-technical-architecture.md
  - 04-document-processing.md
referenced_by:
  - 09-phase-4-processing.md
  - 10-phase-5-organizer.md
  - 11-phase-6-polish.md
status: complete
---

# OpenClaims Ops Rules Engine

## 1. Rule Definitions

| Rule ID | Name | Checks | Inputs | Pass / fail logic | Severity | Score |
|---|---|---|---|---|---|---|
| `deadline` | Deadline check | Claim submitted before deadline | `program.rules.deadline`, `claim.submitted_at` | pass if submitted on time | `hard_fail` on miss | `1` or `0` |
| `amount_cap` | Amount cap check | Requested amount within configured cap | `claim.amount_requested`, `program.rules.max_amount_per_claim` | pass if `requested <= cap` | `hard_fail` on miss | `1` or `0` |
| `amount_match` | Amount vs receipt | Requested amount roughly matches extracted total | `claim.amount_requested`, `extraction.total_amount` | pass within 10%; soft fail otherwise | `soft_fail` | `1`, `0.5`, or `0` |
| `category_validation` | Category validation | Category allowed and roughly matches document | `claim.category`, `program.rules.allowed_categories`, `extraction.category_guess` | hard fail if category disallowed; warning if extraction disagrees | `hard_fail` or `warning` | `1`, `0.7`, or `0` |
| `document_quality` | Document quality | Required document present with acceptable extraction confidence | document rows, `extraction.confidence` | pass if file exists and confidence >= 0.5 | `soft_fail` | `confidence` |
| `duplicate_document` | Duplicate document check | Same hash already exists in program | `duplicate_hash`, program documents | warning/soft fail on match | `soft_fail` | `1` or `0` |
| `budget_availability` | Budget availability | Program can still fund the claim | `budget_total`, `budget_committed`, `amount_requested` | pass if still within budget | `hard_fail` on miss | `1` or `0` |

## 2. Full Rules List

### Deadline check

- Hard fail if `submitted_at > deadline`.
- Message: `Submitted after deadline`.

### Amount cap check

- Hard fail if requested amount exceeds cap.
- Message: `Requested amount exceeds program cap`.

### Amount vs receipt match

- Pass when receipt total exists and differs by `<= 10%`.
- Soft fail when total exists but differs by more than `10%`.
- Soft fail when total is missing.

### Category validation

- Hard fail if selected category is not allowed.
- Warning when category is allowed but extracted merchant/category looks inconsistent.

### Document quality check

- Soft fail if no document exists.
- Soft fail if extraction confidence is below `0.5`.

### Duplicate document check

- Soft fail if the same SHA-256 hash appears in another claim in the same program.

### Budget availability check

- Hard fail if `budget_committed + amount_requested > budget_total`.

## 3. Confidence Scoring Formula

### Weights

| Rule bucket | Weight |
|---|---:|
| Amount cap + match | `0.30` |
| Document quality | `0.25` |
| Category validation | `0.15` |
| Duplicate document | `0.15` |
| Deadline | `0.10` |
| Budget availability | `0.05` |

### Formula

```ts
confidence =
  deadline * 0.10 +
  amount * 0.30 +
  category * 0.15 +
  documentQuality * 0.25 +
  duplicateDocument * 0.15 +
  budget * 0.05;
```

### Example calculations

- Clean claim:
  - `1, 1, 0.9, 0.95, 1, 1` => about `0.96`
- Borderline claim:
  - `1, 0.5, 0.7, 0.55, 1, 1` => about `0.72`
- Bad claim:
  - `0, 0, 0, 0.2, 0, 0` => about `0.05`

## 4. Routing Logic

```text
                ┌──────────────────────────┐
                │ Start rules evaluation   │
                └────────────┬─────────────┘
                             │
                             ▼
               ┌─────────────────────────────┐
               │ Any hard_fail result?       │
               └────────────┬────────────────┘
                            │ yes
                            ▼
                    ┌───────────────┐
                    │ AUTO_REJECT   │
                    └───────────────┘
                            ▲
                            │ no
                            │
               ┌────────────┴────────────────┐
               │ Any soft_fail OR confidence │
               │ below auto-approve threshold│
               └────────────┬────────────────┘
                            │ yes
                            ▼
                    ┌───────────────┐
                    │ FLAG          │
                    └───────────────┘
                            ▲
                            │ no
                            │
                            ▼
                    ┌───────────────┐
                    │ AUTO_APPROVE  │
                    └───────────────┘
```

## 5. TypeScript Implementation

```ts
export type RuleSeverity = "hard_fail" | "soft_fail" | "warning" | "pass";
export type RulesDecision = "auto_approve" | "auto_reject" | "flag";

export interface RuleCheckResult {
  rule: string;
  passed: boolean;
  severity: RuleSeverity;
  message: string;
  score: number;
}

export interface RunRulesInput {
  claim: {
    program_id: string;
    amount_requested: number;
    category: string;
    submitted_at: string;
  };
  program: {
    budget_total: number;
    budget_committed: number;
    rules: {
      deadline?: string;
      max_amount_per_claim?: number;
      allowed_categories?: string[];
      auto_approve_threshold?: number;
    };
  };
  extraction: {
    total_amount: number | null;
    category_guess: string | null;
    confidence: number;
  } | null;
  duplicateDocument: boolean;
  hasDocument: boolean;
}

export function runRulesEngine(input: RunRulesInput) {
  const { claim, program, extraction, duplicateDocument, hasDocument } = input;
  const results: RuleCheckResult[] = [];

  const deadlinePassed =
    !program.rules.deadline || new Date(claim.submitted_at) <= new Date(program.rules.deadline);
  results.push({
    rule: "deadline",
    passed: deadlinePassed,
    severity: deadlinePassed ? "pass" : "hard_fail",
    message: deadlinePassed ? "Submitted before deadline." : "Submitted after deadline.",
    score: deadlinePassed ? 1 : 0,
  });

  const amountCap = program.rules.max_amount_per_claim ?? Number.POSITIVE_INFINITY;
  const withinCap = claim.amount_requested <= amountCap;
  const extractedTotal = extraction?.total_amount ?? null;
  const matchesReceipt =
    extractedTotal !== null &&
    Math.abs(claim.amount_requested - extractedTotal) / Math.max(extractedTotal, 1) <= 0.1;
  results.push({
    rule: "amount",
    passed: withinCap && matchesReceipt,
    severity: !withinCap ? "hard_fail" : matchesReceipt ? "pass" : "soft_fail",
    message: !withinCap
      ? "Requested amount exceeds the program cap."
      : matchesReceipt
        ? "Requested amount matches receipt."
        : "Requested amount does not closely match receipt total.",
    score: !withinCap ? 0 : matchesReceipt ? 1 : extractedTotal === null ? 0.4 : 0.5,
  });

  const allowedCategories = program.rules.allowed_categories ?? [];
  const categoryAllowed = allowedCategories.length === 0 || allowedCategories.includes(claim.category);
  const categoryMatchesExtraction = !extraction?.category_guess || extraction.category_guess === claim.category;
  results.push({
    rule: "category",
    passed: categoryAllowed,
    severity: !categoryAllowed ? "hard_fail" : categoryMatchesExtraction ? "pass" : "warning",
    message: !categoryAllowed
      ? "Category is not allowed for this program."
      : categoryMatchesExtraction
        ? "Category is allowed."
        : "Category is allowed, but the extracted document category looks different.",
    score: !categoryAllowed ? 0 : categoryMatchesExtraction ? 1 : 0.7,
  });

  const extractionConfidence = hasDocument ? extraction?.confidence ?? 0 : 0;
  const documentQualityPass = hasDocument && extractionConfidence >= 0.5;
  results.push({
    rule: "document_quality",
    passed: documentQualityPass,
    severity: documentQualityPass ? "pass" : "soft_fail",
    message: documentQualityPass
      ? `Extraction confidence ${extractionConfidence.toFixed(2)} is acceptable.`
      : "Document is missing or extraction confidence is too low.",
    score: extractionConfidence,
  });

  results.push({
    rule: "duplicate_document",
    passed: !duplicateDocument,
    severity: duplicateDocument ? "soft_fail" : "pass",
    message: duplicateDocument ? "Potential duplicate document detected." : "No duplicate document detected.",
    score: duplicateDocument ? 0 : 1,
  });

  const budgetAvailable = program.budget_committed + claim.amount_requested <= program.budget_total;
  results.push({
    rule: "budget",
    passed: budgetAvailable,
    severity: budgetAvailable ? "pass" : "hard_fail",
    message: budgetAvailable ? "Program budget can cover this claim." : "Program budget would be exceeded.",
    score: budgetAvailable ? 1 : 0,
  });

  const weightByRule: Record<string, number> = {
    deadline: 0.1,
    amount: 0.3,
    category: 0.15,
    document_quality: 0.25,
    duplicate_document: 0.15,
    budget: 0.05,
  };

  const confidence = results.reduce((sum, result) => sum + result.score * weightByRule[result.rule], 0);
  const threshold = program.rules.auto_approve_threshold ?? 0.85;
  const hasHardFail = results.some((result) => result.severity === "hard_fail");
  const hasSoftFail = results.some((result) => result.severity === "soft_fail");

  const decision: RulesDecision = hasHardFail
    ? "auto_reject"
    : hasSoftFail || confidence < threshold
      ? "flag"
      : "auto_approve";

  return { results, confidence, decision };
}
```

## 6. Unit Test Scenarios

| Scenario | Input summary | Expected |
|---|---|---|
| Clean food claim | under cap, deadline valid, food receipt, high confidence | `auto_approve` |
| After deadline | deadline missed | `auto_reject` |
| Over budget | budget exhausted | `auto_reject` |
| Amount mismatch | receipt total very different | `flag` |
| Duplicate document | matching hash found in same program | `flag` |

## 7. Output Persistence

- Store the raw `results` array in `claims.rule_check_result`.
- Store numeric confidence in `claims.confidence_score`.
- Map decision to `claims.status`.
- Add an `audit_log` row for every final routing decision.
