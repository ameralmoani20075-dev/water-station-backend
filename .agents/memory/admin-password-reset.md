---
name: Admin password reset
description: Admin can reset station passwords but cannot view them (bcrypt).
---

## Rule
Passwords are bcrypt-hashed — cannot be shown in plaintext. The admin feature is password RESET (`POST /admin/stations/:id/reset-password`). Admin also has `PATCH /admin/stations/:id/username` to change login username.

**Why:** bcryptjs hashes are one-way. Showing plaintext would require storing unhashed passwords, which is insecure.

**How to apply:** Do NOT add a "view password" endpoint. Admin can only reset. `zod` is NOT installed in api-server — use manual validation (`typeof req.body.x === "string"`).
