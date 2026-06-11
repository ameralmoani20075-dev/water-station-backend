---
name: Debt partial payment
description: How partial debt payments work — DB column, backend logic, and frontend UI.
---

## Rule
`debts` table has `paidAmount numeric(10,3) default 0`. Backend auto-sets `isPaid=true` when `paidAmount >= amount`. Frontend has a "دفع جزئي" dialog that sends `paidAmount` to `PATCH /debts/:id`.

**Why:** User requested partial debt payment tracking. Full paid/unpaid toggle still works; partial payment shows a progress bar.

**How to apply:** When updating debts use `{ paidAmount: number }` in the PATCH body. When marking fully paid use `{ isPaid: true }` (backend will set paidAmount = amount). paidAmount is included in all API responses.
