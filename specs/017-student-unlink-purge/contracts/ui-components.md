# Contracts: UI (MT-003)

## Teacher — `/teacher/students`

| Control | Behavior |
|---------|----------|
| Row/card remove | Label «إزالة من قائمتك»; Spekit `unlink-student-action` |
| Confirm dialog | Title «تأكيد الإزالة من قائمتك»; body list-only + account-safe copy |
| Success | Toast «تمت الإزالة من قائمتك.» |
| Cancel | No roster change |

## Admin — `/admin/students`

| Control | Behavior |
|---------|----------|
| Nav | «إدارة الطلاب» in Super Admin header |
| Table | All student-role rows; search; pagination; show teacher link count |
| Empty | Arabic empty state |
| Purge | Opens two-step dialog |

### Purge dialog steps

1. **Warn**: Student name + «مرتبط بـ N مدرسين» + irreversible warning → إلغاء / متابعة  
2. **Final**: «لا يمكن التراجع» → إلغاء / حذف نهائي → API DELETE

RTL: `dir="rtl"` shell; touch targets `h-10`–`h-12`.
