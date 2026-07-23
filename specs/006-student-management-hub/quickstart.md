# Quickstart: Teacher Student Management Hub

## Prerequisites

- Branch `006-student-management-hub`
- Local `.env` with Supabase + `SESSION_SECRET`
- Seeded demo teacher (e.g. WhatsApp `963912345678`, code `AlMoayed-DEMO`)

```bash
npm install
npx supabase db push   # if needed; no new migration for this feature
npm run dev
```

## Manual QA path

1. Log in as teacher → open `/teacher/students`.
2. Confirm title «إدارة الطلاب», search, filters, Add button.
3. **Add**: create student with name + WhatsApp → toast; appears as مجاني / نشط.
4. **Search / filter**: by name, tier, status, group; empty copy when no matches.
5. **Pagination**: with &gt;8 matching rows, «الصفحة X من Y», السابق/التالي.
6. **Deactivate**: confirm dialog → معطل; **Activate** without heavy confirm.
7. **Pro**: approve / revoke without confirm; toast only.
8. **Group**: assign; clear via «بدون مجموعة».
9. **Edit**: change name/group; WhatsApp read-only.
10. **Unlink**: confirm Arabic copy → removed from this teacher only.
11. Multi-tenant (if second teacher fixture): no cross-roster visibility.

## Automated checks (after implement)

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run test:e2e   # or targeted teach-001 e2e when present
npm run build
```

## Registry

After behavior lands, update `.speckit/spec.yaml` **TEACH-001** acceptance to include: manual add, search, 8-page pagination, edit (no WhatsApp), unlink confirm, deactivate confirm, group clear.
