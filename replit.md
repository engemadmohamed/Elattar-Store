# Al Mohandes | المهندس — متجر القرطاسية

متجر إلكتروني عربي كامل لبيع الأقلام والدفاتر والأدوات المكتبية.

## Stack

- **Frontend**: React 19 + Vite + Tailwind CSS + shadcn/ui + TanStack Query
- **Backend**: Express (TypeScript) + Mongoose
- **Database**: MongoDB Atlas
- **Image hosting**: Cloudinary
- **Routing**: wouter (client-side SPA)

## تشغيل محلي (Local dev)

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5000
- API:      http://localhost:3001
- Admin:    http://localhost:5000/<VITE_ADMIN_PATH>/login

## متغيرات البيئة المطلوبة (.env)

راجع `.env.example` للقيم الكاملة. القيم الإلزامية:

| المتغير | الوصف |
|---------|-------|
| `MONGO_URI` | رابط MongoDB Atlas |
| `JWT_SECRET` | مفتاح JWT (سلسلة عشوائية طويلة) |
| `ADMIN_SEED_EMAIL` | إيميل حساب الأدمن الأول |
| `ADMIN_SEED_PASSWORD` | باسورد حساب الأدمن الأول |
| `VITE_ADMIN_PATH` | مسار لوحة التحكم السري (بدل `/admin`) |
| `CLOUDINARY_CLOUD_NAME` | اسم حساب Cloudinary |
| `CLOUDINARY_API_KEY` | مفتاح Cloudinary |
| `CLOUDINARY_API_SECRET` | سر Cloudinary |

## Seed البيانات الأولية

```bash
npm run seed      # يضيف الأدمن + الفئات
npm run db:reset  # يمسح كل البيانات أولاً ثم يضيف من جديد
```

## النشر على Vercel

المشروع جاهز للنشر مباشرةً. الملفات المضافة:

- `vercel.json` — يوجّه `/api/*` للـ serverless function، وكل شيء آخر للـ SPA
- `server/app.ts` — Express app بدون `listen()` (يُستخدم من `api/index.ts`)
- `api/index.ts` — Vercel serverless handler يلف Express

### خطوات النشر على Vercel

1. ارفع الكود على GitHub (أو استخدم `vercel deploy`)
2. في لوحة تحكم Vercel، أضف **Environment Variables** التالية:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `VITE_ADMIN_PATH`
   - `NODE_ENV=production`
   - `APP_BASE_URL` — الرابط النهائي للموقع (مثلاً `https://al-mohandes.vercel.app`)
3. اضغط Deploy — Vercel يبني Vite ويرفع العملية.

> **ملاحظة**: على Vercel لازم تستخدم Cloudinary لرفع الصور — الـ filesystem مؤقت هناك.

## هيكل المشروع

```
├── api/
│   └── index.ts          # Vercel serverless entry point
├── client/
│   └── src/              # React frontend
├── server/
│   ├── app.ts            # Express app (shared)
│   ├── index.ts          # Local dev entry (listen)
│   ├── routes/           # API routes
│   ├── models/           # Mongoose models
│   └── middleware/       # Auth middleware
├── vercel.json           # Vercel deployment config
└── vite.config.ts        # Frontend build config
```

## User preferences

- المستخدم يريد النشر على Vercel (frontend + backend معاً).
- يُفضَّل استخدام Cloudinary لرفع الصور في الإنتاج.
