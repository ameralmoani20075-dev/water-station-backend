---
name: Filter 30-day reminder
description: How lastChangedAt is tracked and the 30-day reminder works.
---

## Rule
`filters` table has `lastChangedAt timestamp (nullable)`. Backend sets it to `now()` when `isFull` transitions from `false → true` (filter was just replaced). Frontend shows amber warning badge when `isFull=true` AND `differenceInDays(now, lastChangedAt) >= 30`.

**Why:** User wants reminder when filter hasn't been physically changed in 30 days.

**How to apply:** Reminder only shows for working filters (isFull=true) that haven't been changed recently. Filters with no lastChangedAt (never changed) do NOT trigger the reminder — they show "لم يُسجّل تغيير بعد".
