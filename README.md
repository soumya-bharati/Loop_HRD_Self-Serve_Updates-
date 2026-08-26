# Loop HRD — Flex Self-Serve Updates

Prototype of the HR dashboard **Endorsements** experience for Flex deal accounts. HR can add, edit, and delete employees and dependants, assign benefits, review endorsement cost / CD impact, and launch enrolment.

All data is mocked. There is no backend.

## Prerequisites

- Node.js 20+ recommended
- npm

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app lands on `/endorsements`.

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server on port **3000** |
| `npm run build` | Typecheck (`tsc -b`) and production build |
| `npm run preview` | Serve the production build |
| `npm run lint` | Oxlint |

## What you can click through

From Endorsements, use **Add/Edit/Delete Lives**, then choose an action and method.

### Add new employee(s)

1. Select a Flex deal (required when the account has multiple active deals), then fill the existing form or upload CSV.
2. Complete deal-configured employee attributes. Eligibility and company assignment are calculated automatically.
3. Review locked **Assigned by company** benefits and add other eligible benefits.
4. Add or update dependants using benefit-derived family slots and merged dependant attributes.
5. Review assignment, payroll, endorsement cost, and CD shortfall.
6. Set enrolment (due date, send now / schedule) → success.

### Add new dependant

1. Search an existing employee. Selecting them shows **already enrolled** dependants (name, relationship, gender, DOB, contact).
2. Review existing locked dependants and remaining slots per relationship and benefit.
3. Add details and select eligible benefits. Active coverage enforces 45-day spouse/child midterm rules; draft coverage is evaluated independently.
4. Complete dynamic attributes and upload supporting evidence when required.
5. Review payroll delta, policy cost, and CD impact → success.

### Bulk add

1. Download the CSV template and re-upload.
2. Validate totals, field errors, and plan assignment.
3. Upload mid-term proof when a dependant start is after the employee start.
4. Review assignment and cost → enrolment → processing → success.

### Delete a single employee

1. Search the employee (family is listed).
2. Enter date of leaving (today back to T-45).
3. Review ending coverage and flat-validity benefits that remain active.
4. Review policy/CD-grouped refunds with explicit zero-refund reasons.
5. Confirm with **Off-board employee** → success.

### Bulk delete

1. Download the delete template, confirm intent, upload.
2. Validation pass/fail → refund estimate → success (rejected rows as an error sheet stub).

### Edit employee or dependant

1. Search the employee (or employee + dependant).
2. Edit personal / contact details only (no plan or benefit changes). Existing dependants are shown as read-only context on the employee edit screen.
3. Review field-level `existing → new` changes. KYC upload appears only for name, DOB, or gender changes.
4. Eligibility/payroll-impacting corrections are rejected without changing coverage.
5. Add multiple valid corrections to a batch, then submit them together.

## Sample employees

Defined in [`src/data/employees.ts`](src/data/employees.ts). Useful for search / add-dependant / edit / delete:

| Employee ID | Name | Dependants already on cover |
| --- | --- | --- |
| EMP-20487 | Rahul Sharma | Spouse (Anita), Child (Aarav), Parent (Suresh) |
| EMP-19821 | Priya Nair | Child (Kavya) — edit requires proof |
| EMP-17654 | Ajit Jain | Spouse (Meera) |
| EMP-22109 | Neha Kapoor | Spouse (Rohan), Child (Ishaan) |
| EMP-23140 | Vikram Mehta | Spouse + two children — all CareFlex family slots consumed |
| EMP-24516 | Farah Khan | Offboarding fixture with refundable cover and retained wellness |
| EMP-25773 | Arjun Rao | DOB correction fixture where GTL eligibility can change |

Rahul has a GMC claim on file and flat wellness; delete refunds behave differently for him.

## Project layout

```
src/
  pages/
    Endorsements/          Dashboard, summary cards, month list, lives action modal
    LivesWizard/           Multi-step wizard (context, chrome, steps)
  data/
    employees.ts           Searchable employees + dependants
    flexDeal.ts            Legacy adapters and bulk-flow mock helpers
    endorsements.ts        Month groups and dashboard summary
  domain/flex/             Config-driven deals, eligibility, assignment,
                           family slots, attributes, financial/refund rules,
                           midterm validation, and corrections
  components/layout/       App shell, sidebar, top nav
  theme/                   styled-components theme
```

Wizard route: `/endorsements/lives/:action?method=single|single-dependant|bulk`  
(`action` is `add`, `edit`, or `delete`).

Other sidebar items (Policies, Employees, Claims, CD Accounts) are placeholders.

## Stack

Vite 8 · React 19 · TypeScript · styled-components · React Router 7

Path alias: `@/` → `src/`.

## Out of scope (mocked)

Real Excel multi-sheet files, rater / CD / claims APIs, endorsement pipeline, Manage Invites backend, mid-term benefit changes after the window closes, and deleting a single dependant.
