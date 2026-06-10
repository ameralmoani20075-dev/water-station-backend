# نظام إدارة محطة المياه

نظام متكامل لإدارة محطات المياه — نقطة بيع، منتجات، نفقات، مناوبات، وإحصائيات، مع لوحة تحكم للمدير.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/water-station run dev` — run the frontend (port 18701)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET`

## Demo Accounts

| النوع | اسم المستخدم | كلمة المرور |
|-------|-------------|-------------|
| مدير | admin | admin123 |
| محطة ١ | station1 | station1 |
| محطة ٢ | station2 | station2 |

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui (Arabic RTL)
- API: Express 5 + express-session
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (zod/v4), drizzle-zod
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/` — DB schema (stations, products, sales, expenses, shifts)
- `artifacts/api-server/src/routes/` — API route handlers
- `artifacts/water-station/src/` — React frontend

## Architecture decisions

- Session-based auth via express-session (not JWT) — simpler for multi-station use
- Each station sees only its own data (scoped by stationId from session)
- Admin role can view all stations and toggle their active status
- Coupon sales: total = price × quantity − 5 دينار discount
- Stock is auto-decremented on each sale

## Product

- نقطة البيع: بيع المنتجات وتسجيل المبيعات اليومية بضغطة زر
- المنتجات: إضافة وتعديل وحذف المنتجات والأسعار
- النفقات: تتبع النفقات اليومية حسب الفئة
- المناوبات: تسجيل دوام العمال وساعات العمل
- الإحصائيات: إيرادات يومية/أسبوعية/شهرية ومخططات بيانية
- الإعدادات: تغيير اسم المحطة وكلمة المرور
- لوحة المدير: رؤية جميع المحطات والتحكم في تفعيلها

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm run typecheck:libs` after any schema change in `lib/db/` before typechecking artifacts
- bcryptjs is installed in `artifacts/api-server/node_modules/` — use from that path if running scripts manually
- Session cookie is not secure in dev (set secure: false) — change for production

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
