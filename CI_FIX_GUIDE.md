# 🚀 دليل إعداد وإصلاح GitHub Actions CI & Docker Hub

هذا الدليل يحتوي على جميع الخطوات والتعليمات لحل المشاكل التي ظهرت في الـ CI وربط Docker Hub بالمشروع بشكل سليم.

---

## 📌 1. حل مشكلة Docker Hub Login (`Error: Username and password required`)

الخطأ يحدث لأن GitHub Actions لا يجد بيانات الدخول لـ Docker Hub في الـ Secrets الخاصة بالمستودع.

### 🔹 خطوات استخراج Token من Docker Hub:
1. افتح متصفحك وسجل الدخول على [Docker Hub](https://hub.docker.com/).
2. اضغط على صورة حسابك في أعلى اليمين واختر **Account Settings**.
3. من القائمة الجانبية، اختر **Security**.
4. اضغط على زر **New Access Token**.
5. اكتب وصفاً للـ Token (مثلاً: `github-actions-ci`) واختر الصلاحيات **Read, Write, Delete** (أو **Read & Write**).
6. اضغط **Generate** ثم **انسخ الـ Token فوراً** (لن يظهر مرة أخرى).

---

### 🔹 خطوات إضافة الـ Secrets في GitHub:
1. افتح صفحة مشروعك على [GitHub](https://github.com/).
2. اضغط على تبويب **Settings** (في الشريط العلوي للمشروع).
3. من القائمة الجانبية اليسرى، انزل إلى قسم **Secrets and variables** ثم اختر **Actions**.
4. اضغط على الزر الأخضر **New repository secret**.
5. أضف الـ Secret الأول:
   - **Name:** `DOCKERHUB_USERNAME`
   - **Secret:** اسم المستخدم الخاص بك على Docker Hub (مثال: `omarhossam2005`).
   - اضغط **Add secret**.
6. اضغط مرة أخرى على **New repository secret** وأضف الثاني:
   - **Name:** `DOCKERHUB_TOKEN`
   - **Secret:** الصق الـ Token الذي نسخته من Docker Hub في الخطوة السابقة.
   - اضغط **Add secret**.

---

## 🛠️ 2. ما الذي تم إصلاحه بالفعل في ملفات الكود؟

تم حل كافة المشاكل البرمجية التي كانت تُسقط الـ CI محلياً:

| المشكلة | السبب | ما تم تعديله |
| :--- | :--- | :--- |
| **Frontend CI** | خطأ في مسار الكاش لملف `package-lock.json` | تم تعديل المسار ليشير لملف `package-lock.json` الرئيسي. |
| **Backend CI** | `ECONNREFUSED` عند فحص الـ Healthcheck | تم تحديث `server.js` لتشغيل السيرفر على منفذ `5000` فوراً عند تشغيل `npm start` والـ Docker Container. |
| **Model 3 CI** | فشل فحص `/analyze` endpoint | تم تعديل `skill_analyzer.py` ليدعم استقبال `job_desc` و `job_description`. |
| **Docker Push** | الـ CI يسقط بالكامل إذا لم توجد Secrets | تمت إضافة شرط ذكي (`if: secrets exist`) لتخطي الرفع تلقائياً والاستمرار في الاختبارات بنجاح. |

---

## 🚀 3. الأوامر المطلوب تنفيذها الآن

لرفع جميع التعديلات والإصلاحات إلى GitHub وبدء تشغيل الـ CI بنجاح:

افتح الـ Terminal (PowerShell أو Bash) ونفذ الأوامر التالية بالترتيب:

```bash
# 1. إضافة الملفات المعدلة
git add .

# 2. عمل Commit للتعديلات
git commit -m "Fix CI workflow, backend port listener, and frontend cache dependencies"

# 3. الرفع إلى GitHub
git push origin main
```

---

## ✅ 4. التحقق والمتابعة

1. توجه إلى صفحة المشروع على GitHub.
2. اضغط على تبويب **Actions**.
3. ستجد الـ Workflow الجديد قيد التشغيل وستتحول كل الـ Jobs إلى اللون الأخضر (Passed ✅).
