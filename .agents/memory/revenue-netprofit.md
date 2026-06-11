---
name: Revenue net profit calculation
description: How net profit is computed in the revenue page.
---

## Rule
Net profit is computed entirely on the frontend: `netProfit = monthlyRevenue + totalDebtPayments + partialDebtPayments - monthlyExpenses`. No backend changes. Uses existing endpoints: `/sales/stats?period=month`, `/expenses?month=YYYY-MM`, and `/debts`.

**Why:** Avoids a new API endpoint. All data is already available from existing hooks.

**How to apply:** `totalDebtPayments` = sum of `paidAmount` from `isPaid=true` debts. `partialDebtPayments` = sum of `paidAmount` from `isPaid=false && paidAmount>0` debts.
