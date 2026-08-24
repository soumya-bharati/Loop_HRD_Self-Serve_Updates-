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

1. Fill a form (or upload CSV) for one or more employees. Dependants can be nested under each employee.
2. Assign benefits. Ineligible options are greyed out with a reason.
3. Optionally add more dependants based on the covers selected.
4. Review assignment, payroll, endorsement cost, and CD shortfall.
5. Set enrolment (due date, send now / schedule) → success.

### Add new dependant

1. Search an existing employee. Selecting them shows **already enrolled** dependants (name, relationship, gender, DOB, contact).
2. Add new dependant details. Remaining slots respect the family definition (existing + new).
3. If the employee has more than one GMC plan, pick a plan; otherwise it is auto-assigned.
4. Review cost / CD → success.

### Bulk add

1. Download the CSV template and re-upload.
2. Validate totals, field errors, and plan assignment.
3. Upload mid-term proof when a dependant start is after the employee start.
4. Review assignment and cost → enrolment → processing → success.

### Delete a single employee

1. Search the employee (family is listed).
2. Enter date of leaving (today back to T-45).
3. Review off-board + refund (claims, non-insurance, not prorated, flat wellness stays active).
4. Confirm → success.

### Bulk delete

1. Download the delete template, confirm intent, upload.
2. Validation pass/fail → refund estimate → success (rejected rows as an error sheet stub).

### Edit employee or dependant

1. Search the employee (or employee + dependant).
2. Edit personal / contact details only (no plan or benefit changes). Existing dependants are shown as read-only context on the employee edit screen.
3. Proof upload when required (**Priya Nair**).
4. Review cost deltas. Eligibility is blocked if a dependant DOB is before `2000-01-01`.
5. Optional “simulate save failure” clears proof.

## Sample employees

Defined in [`src/data/employees.ts`](src/data/employees.ts). Useful for search / add-dependant / edit / delete:

| Employee ID | Name | Dependants already on cover |
| --- | --- | --- |
| EMP-20487 | Rahul Sharma | Spouse (Anita), Child (Aarav), Parent (Suresh) |
| EMP-19821 | Priya Nair | Child (Kavya) — edit requires proof |
| EMP-17654 | Ajit Jain | Spouse (Meera) |
| EMP-22109 | Neha Kapoor | Spouse (Rohan), Child (Ishaan) |

Rahul has a GMC claim on file and flat wellness; delete refunds behave differently for him.

## Project layout

```
src/
  pages/
    Endorsements/          Dashboard, summary cards, month list, lives action modal
    LivesWizard/           Multi-step wizard (context, chrome, steps)
  data/
    employees.ts           Searchable employees + dependants
    flexDeal.ts            Deals, purchase groups, eligibility, cost / refund helpers
    endorsements.ts        Month groups and dashboard summary
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
