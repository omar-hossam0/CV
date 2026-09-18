# 🚀 تقرير استهلاك الموارد وحسابات النشر على AWS (AI Models & Full Stack Resource Sizing Report)

---

## 📌 1. الملخص التنفيذي (Executive Summary)

يقدم هذا التقرير تحليلاً شاملاً ودقيقاً لاستهلاك الموارد (**الذاكرة RAM، أنوية المعالج vCPU Cores، وحجم التخزين والشبكة**) للموديلات الأربعة (AI Models 1–4) ولمنظومة المشروع ككل، وذلك بهدف الإعداد للنشر على بيئة الإنتاج السحابية (**Production on AWS**).

### 💡 الخلاصة الفنية للموديلات:
* **Model 1 (CV-Job Matcher):** هو الموديل الوحيد الذي يعتمد على نموذج تعلم عميق محلي (**BERT Sentence Transformers / PyTorch**)، وهو المحرك الأساسي لاستهلاك الرام والمعالج.
* **Model 2 (CV Classifier):** يعتمد على خوارزمية بحث نصي وأوزان كلمات مفتاحية (**FastAPI / Rule-based**)، استهلاكه خفيف جداً.
* **Model 3 (Skill Analyzer):** يعتمد على قاعدة بيانات مهارات مدمجة ومطابقة نصوص (**Flask / Keyword Extraction**)، استهلاكه خفيف جداً.
* **Model 4 (Career Assistant Chat):** يعمل كـ **API Proxy** يستدعي نموذج **Llama 3.3 70B** سحابياً عبر **Groq API**، وبالتالي استهلاكه للموارد الداخلية شبه منعدم.

---

## 🔬 2. التحليل التفصيلي لاستهلاك كل موديل (Per-Model Breakdown)

| الموديل | المنفذ (Port) | التقنية والمكتبات | استهلاك RAM (خامل / تشغيل) | استهلاك vCPU | زمن الاستجابة (Latency) | الحاجة لـ GPU |
| :--- | :---: | :--- | :---: | :---: | :---: | :---: |
| **Model 1: CV Matcher** | `5001` | PyTorch, SentenceTransformers, FastAPI | **500MB – 1.4GB** | **1.0 – 2.0 Cores** | 20ms – 60ms | ❌ غير مطلوب |
| **Model 2: CV Classifier** | `5002` | FastAPI, Pydantic, Python String Match | **60MB – 100MB** | **0.1 – 0.25 Core** | < 5ms | ❌ غير مطلوب |
| **Model 3: Skill Analyzer** | `5003` | Flask, In-Memory Dictionary | **50MB – 80MB** | **0.1 – 0.25 Core** | < 5ms | ❌ غير مطلوب |
| **Model 4: Career Chat** | `5004` | FastAPI, Groq Cloud API SDK | **60MB – 100MB** | **0.1 – 0.25 Core** | 300ms – 800ms (I/O) | ❌ غير مطلوب |

---

### 🔹 تفاصيل الموديل الأول: Model 1 - CV-Job Matcher (Port 5001)
* **الملف المصدري:** `model-1-cv-matcher/cv_job_matcher.py`
* **الموديل المستخدم:** `all-MiniLM-L6-v2` (حجم الأوزان ~88MB، 22.7M Parameters، بُعد المتجهات 384 Dim).
* **طبيعة العمل:** 
  * يحمّل موديل المحولات (Transformer) في الذاكرة.
  * يحسب الـ Embeddings لكل من السيرة الذاتية (CV) ونصوص الوظائف عبر PyTorch CPU.
  * يدمج تشابه الجيب تماماً (Cosine Similarity) مع تطابق الكلمات المفتاحية التقنية بنسبة (50% Semantic + 50% Keywords).
* **استهلاك الـ RAM:**
  * **عند بدء التشغيل (Idle):** ~500MB – 700MB.
  * **تحت الضغط وتعدد الطلبات (Peak Load):** ~1.0GB – 1.4GB.
* **استهلاك المعالج (vCPU):**
  * يحتاج **1.0 إلى 2.0 vCPU** لتقديم زمن معالجة سريع (Inference) يتراوح بين 20ms إلى 60ms للطلب الواحد.
* **هل يحتاج GPU؟**
  * **لا؛** موديل `MiniLM-L6` خفيف ومصمم خصيصاً ليعمل بكفاءة وسرعة فائقة على الـ CPU.

---

### 🔹 تفاصيل الموديل الثاني: Model 2 - CV Classifier (Port 5002)
* **الملف المصدري:** `model-2-cv-classifier/cv_classifier.py`
* **طبيعة العمل:** 
  * يقوم بتصنيف السيرة الذاتية إلى 20 مجالاً وظيفياً (`JOB_KEYWORDS`) بناءً على تكرار الأنماط وتطابق الكلمات المفتاحية وتوليد Top 5 Predictions.
* **استهلاك الـ RAM:** **60MB – 100MB** فقط (بيئة تشغيل Python + FastAPI).
* **استهلاك المعالج (vCPU):** **0.1 – 0.25 Core** (عمليات String Searching سريعة جداً).

---

### 🔹 تفاصيل الموديل الثالث: Model 3 - Skill Analyzer (Port 5003)
* **الملف المصدري:** `model-3-skill-analyzer/skill_analyzer.py`
* **طبيعة العمل:** 
  * فحص المهارات ومقارنتها بقاعدة بيانات مدمجة (`SKILLS_DATABASE`) تضم أكثر من 200 مهارة موزعة على 14 تصنيفاً، وتحديد الأولويات (HIGH / MEDIUM / LOW) وتوليد روابط يوتيوب التعليمية.
* **استهلاك الـ RAM:** **50MB – 80MB** فقط.
* **استهلاك المعالج (vCPU):** **0.1 – 0.25 Core**.

---

### 🔹 تفاصيل الموديل الرابع: Model 4 - Career Assistant Chat (Port 5004)
* **الملف المصدري:** `model-4-chat-model/chat_model.py`
* **طبيعة العمل:** 
  * يعمل كوسيط (Proxy) لإرسال الأسئلة إلى خوادم **Groq Cloud API** التي تشغل نموذج `llama-3.3-70b-versatile` مع وجود Fallback محلي في حال انقطاع المفتاح أو الشبكة.
* **استهلاك الـ RAM:** **60MB – 100MB** فقط.
* **استهلاك المعالج (vCPU):** **0.1 – 0.25 Core** (انتظار شبكة Network I/O Bound).

---

## 📊 3. الحجم الكامل للمنظومة (Full-Stack System Profile)

لتشغيل المنظومة كاملة بجميع خدماتها (Frontend + Backend + MongoDB + 4 AI Models):

| المكون (Service) | بيئة التشغيل | استهلاك RAM الموصى به | أنوية المعالج (vCPU) |
| :--- | :--- | :---: | :---: |
| **الموديلات الأربعة مجتمعة** | Python / FastAPI / Flask | **1.5 GB – 2.0 GB** | **1.5 – 2.0 vCPU** |
| **Backend API** | Node.js (Express) | **250 MB – 400 MB** | **0.25 – 0.5 vCPU** |
| **Frontend UI** | Nginx (Static Build) | **50 MB – 100 MB** | **0.1 vCPU** |
| **قاعدة البيانات (MongoDB)** | Mongo 8 / WiredTiger | **500 MB – 1.0 GB** | **0.5 vCPU** |
| **نظام التشغيل و Docker Overhead** | Linux OS / Kernel Buffers | **500 MB** | **0.25 vCPU** |
| **المجموع الكلي (Total System)** | **كامل المشروع** | **~3.0 GB – 4.5 GB** | **2.5 – 3.0 vCPU** |

---

## ☁️ 4. خيارات وحسابات النشر على AWS (AWS Architecture Options)

```
┌────────────────────────────────────────────────────────────────────────┐
│                   بنية النشر الموصى بها على AWS                        │
│                                                                        │
│                      [ Cloudflare / Route 53 ]                         │
│                                  │ (HTTPS)                             │
│                                  ▼                                     │
│                     [ Nginx Reverse Proxy / SSL ]                      │
│                                  │                                     │
│          ┌───────────────────────┼───────────────────────┐             │
│          ▼                       ▼                       ▼             │
│   [ Frontend (Web) ]     [ Backend (5000) ]     [ MongoDB / Atlas ]    │
│                                  │                                     │
│          ┌───────────────┬───────┴───────┬───────────────┐             │
│          ▼               ▼               ▼               ▼             │
│     [ Model 1 ]     [ Model 2 ]     [ Model 3 ]     [ Model 4 ]        │
│       (:5001)         (:5002)         (:5003)         (:5004)          │
│     BERT Matcher    Classifier      Skill Gap       Groq Chat          │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 🟢 الخيار الأول: سيرفر واحد (EC2 All-in-One عبر Docker Compose)
> **الأنسب للمرحلة الحالية، البدايات (MVP)، والأوفر في التكلفة وإدارة الصيانة.**

* **السيرفر الموصى به:** **`t4g.large`** (معمارية AWS Graviton ARM) أو **`t3.large`** (معمارية x86 Intel/AMD):
  * **المعالج:** 2 vCPU
  * **الذاكرة:** 8 GB RAM
  * **القرص:** 30 GB EBS gp3 SSD
  * **التكلفة الشهرية التقديرية:** **~$45 – $60 / شهرياً**.
  * **الميزة:** مساحة وفيرة تضمن تشغيل كل الحاويات بما فيها MongoDB بدون خطر الـ (OOM Crash).

#### 💡 بديل أكثر توفيراً (في حال فصل قاعدة البيانات):
لو استخدمت **MongoDB Atlas (Free Tier / M0)** لقاعدة البيانات:
* يمكنك استخدام سيرفر **`t4g.medium`** أو **`t3.medium`** (2 vCPU / 4 GB RAM).
* **التكلفة التقديرية:** **~$25 – $30 / شهرياً**.

---

### 🔵 الخيار الثاني: بيئة ميكروسيرفيس موزعة (AWS ECS Fargate)
> **الأنسب للشركات الكبيرة مع وجود ضغط وترافيك عالي (High Availability & Auto-scaling).**

* **Frontend:** استضافة على **AWS S3 + CloudFront CDN** (تكلفة شبه مجانية < $2/mo وسرعة عالمية).
* **Backend:** Task بحجم `0.5 vCPU / 1 GB RAM`.
* **Model 1 (BERT):** Task مخصصة بحجم `1 vCPU / 2 GB RAM` مع Auto-Scaling Policy.
* **Models 2, 3, 4:** دمجهم في Task مشتركة بحجم `0.5 vCPU / 1 GB RAM`.
* **Database:** **AWS DocumentDB** أو **MongoDB Atlas**.
* **التكلفة التقديرية:** **~$70 – $120 / شهرياً** (شاملة Application Load Balancer).

---

## 🛠️ 5. خطوات وإعدادات هامة قبل الـ Deployment (Production Checklist)

### 1. إيقاف وضع التطوير (`--reload` / `--debug`)
في بيئة الإنتاج، يجب تعديل أوامر تشغيل الموديلات لمنع استهلاك الرام الزائد:
```dockerfile
# Model 1 & 2 & 4 (Uvicorn / Production)
CMD ["uvicorn", "cv_job_matcher:app", "--host", "0.0.0.0", "--port", "5001", "--workers", "2"]

# Model 3 (Gunicorn for Flask)
CMD ["gunicorn", "-w", "2", "-b", "0.0.0.0:5003", "skill_analyzer:app"]
```

### 2. تثبيت كاش الموديل (BERT Model Cache Volume)
* موديل 1 يقوم بتحميل أوزان BERT (~88MB) في أول إقلاع.
* تأكد من ربط Named Volume دائم (`model-1-bert-cache:/app/bert-cache`) حتى لا يتم تنزيل الموديل من HuggingFace عند كل إعادة تشغيل للسيرفر أو انقطاع للإنترنت.

### 3. تفعيل الـ Swap Memory على سيرفر EC2
على سيرفر Linux EC2، يُنصح دائماً بإضافة **2GB Swap File** كشبكة أمان للذاكرة:
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 4. إدارة المتغيرات السرية (Environment Variables)
* تأكد من تمرير المفاتيح التالية بأمان عبر `.env` أو AWS Systems Manager Parameter Store:
  * `GROQ_API_KEY`: لموديل المحادثة (Model 4).
  * `JWT_SECRET`: للمصادقة وتأمين المستخدمين في الـ Backend.
  * `MONGODB_URI`: رابط الاتصال بقاعدة البيانات.
  * `NODE_ENV=production`.

---

## 📋 6. جدول مقارنة التكاليف على AWS (Cost Estimation)

| الخيار | المكونات | المواصفات | التكلفة التقديرية / شهر |
| :--- | :--- | :--- | :---: |
| **All-in-One EC2 (Recommended)** | EC2 `t4g.large` + 30GB gp3 | 2 vCPU, 8GB RAM | **~$45 – $55** |
| **Optimized EC2 + Atlas** | EC2 `t4g.medium` + MongoDB Atlas | 2 vCPU, 4GB RAM | **~$25 – $32** |
| **AWS Lightsail Instance** | Lightsail Bundle 8GB | 2 vCPU, 8GB RAM | **~$40 – $44** |
| **ECS Fargate Microservices** | ECS + ALB + S3 + MongoDB | Distributed Tasks | **~$80 – $130** |

---

*تم إعداد هذا التقرير بناءً على الفحص المصدري المباشر للمشروع وهيكل الموديلات المعتمد.*
