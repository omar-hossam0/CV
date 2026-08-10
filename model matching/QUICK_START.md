# 🚀 دليل البدء السريع

## ⚡ تشغيل سريع (3 خطوات)

### الطريقة الأولى: استخدام PowerShell Script

```powershell
# افتح PowerShell في مجلد المشروع
cd "d:\Dulms\Level3 term(1)\Project\code\model matching"

# شغل السكريبت
.\run.ps1

# اختر الخيار 4 (تشغيل كامل)
```

---

### الطريقة الثانية: يدوياً

#### الخطوة 1: تثبيت المكتبات

```powershell
pip install -r requirements.txt
```

#### الخطوة 2: تدريب النموذج

```powershell
python cv_job_matching_model.py
```

#### الخطوة 3: اختبار النموذج

```powershell
python test_matcher.py
```

---

## 📊 استخدام النموذج في كودك

```python
from cv_job_matching_model import CVJobMatcher
import pandas as pd

# 1. تحميل النموذج المدرب
matcher = CVJobMatcher()
matcher.load_model('cv_job_matcher_final.pkl')

# 2. تحضير السيرة الذاتية
my_cv = """
Senior Python Developer with 5 years experience.
Expert in Django, Flask, REST APIs, and Machine Learning.
Skills: Python, TensorFlow, Docker, AWS, PostgreSQL
"""

# 3. تحضير الوظائف
jobs_df = pd.read_csv('jobs_clean.csv')
sample_jobs = jobs_df.sample(20)  # اختر 20 وظيفة

# تحضير نصوص الوظائف
job_texts = (sample_jobs['Job Title'] + " " + 
             sample_jobs['job_description_clean']).tolist()

# 4. إيجاد أفضل المطابقات
matches = matcher.find_top_matches(my_cv, job_texts, top_k=10)

# 5. عرض النتائج
print("🏆 أفضل 10 وظائف:\n")
for i, match in enumerate(matches, 1):
    idx = match['job_index']
    score = match['similarity_score']
    job = sample_jobs.iloc[idx]
    
    print(f"{i}. {job['Job Title']}")
    print(f"   نسبة التطابق: {score:.2f}%\n")
```

---

## ⚙️ تخصيص الإعدادات

### استخدام ملف config.py

```python
from config import apply_preset, TRAINING_CONFIG

# طريقة 1: استخدام preset جاهز
apply_preset('high_accuracy')  # للحصول على أعلى دقة

# طريقة 2: تعديل يدوي
TRAINING_CONFIG['epochs'] = 100
TRAINING_CONFIG['batch_size'] = 16
TRAINING_CONFIG['learning_rate'] = 0.0005

# ثم التدريب
from cv_job_matching_model import CVJobMatcher
matcher = CVJobMatcher()
matcher.train('dataa.csv', 'jobs_clean.csv', **TRAINING_CONFIG)
```

---

## 🎯 أمثلة عملية

### مثال 1: تدريب سريع للاختبار

```python
from cv_job_matching_model import CVJobMatcher

matcher = CVJobMatcher()
matcher.train(
    cvs_file='dataa.csv',
    jobs_file='jobs_clean.csv',
    epochs=10,           # قليل للاختبار
    batch_size=64,       # كبير للسرعة
)
```

### مثال 2: تدريب للإنتاج (Production)

```python
matcher = CVJobMatcher(model_name='all-mpnet-base-v2')  # نموذج أكبر
matcher.train(
    cvs_file='dataa.csv',
    jobs_file='jobs_clean.csv',
    epochs=100,          # كثير للدقة
    batch_size=16,       # صغير للجودة
    learning_rate=0.0001 # بطيء ومستقر
)
```

### مثال 3: مطابقة متقدمة

```python
# تحميل النموذج
matcher = CVJobMatcher()
matcher.load_model('cv_job_matcher_final.pkl')

# قراءة جميع الوظائف
jobs_df = pd.read_csv('jobs_clean.csv')
all_job_texts = (jobs_df['Job Title'] + " " + 
                 jobs_df['job_description_clean']).tolist()

# مطابقة مع سيرة ذاتية
cv = "Software Engineer with Python, Django, ML experience..."
matches = matcher.find_top_matches(cv, all_job_texts, top_k=20)

# تصفية حسب نسبة التطابق
good_matches = [m for m in matches if m['similarity_score'] >= 70]

print(f"وجدت {len(good_matches)} وظيفة مطابقة (>70%)")
for match in good_matches:
    idx = match['job_index']
    score = match['similarity_score']
    print(f"{jobs_df.iloc[idx]['Job Title']}: {score:.1f}%")
```

---

## 🔧 حل المشاكل

### مشكلة: Out of Memory

```python
# حل 1: تقليل Batch Size
matcher.train(..., batch_size=8)

# حل 2: تقليل عدد العينات
matcher.train(..., sample_size=5000)
```

### مشكلة: التدريب بطيء جداً

```python
# حل 1: استخدام نموذج أصغر
matcher = CVJobMatcher(model_name='all-MiniLM-L6-v2')

# حل 2: تقليل Epochs
matcher.train(..., epochs=20)

# حل 3: زيادة Batch Size
matcher.train(..., batch_size=64)
```

### مشكلة: Overfitting

```python
# حل 1: زيادة Dropout
from cv_job_matching_model import SiameseMatchingNetwork
model = SiameseMatchingNetwork(dropout=0.5)

# حل 2: Early Stopping
# (موجود تلقائياً في النموذج)
```

---

## 📈 تقييم الأداء

```python
from test_matcher import evaluate_model_performance

# تقييم شامل
evaluate_model_performance()

# أو يدوياً
matcher = CVJobMatcher()
matcher.load_model('cv_job_matcher_final.pkl')

cvs_df = pd.read_csv('dataa.csv')
test_sample = cvs_df.sample(100)

correct = 0
for _, row in test_sample.iterrows():
    cv = row['Resume']
    category = row['Category']
    
    # مطابقة
    jobs_df = pd.read_csv('jobs_clean.csv')
    sample = jobs_df.sample(20)
    job_texts = (sample['Job Title'] + " " + 
                 sample['job_description_clean']).tolist()
    
    matches = matcher.find_top_matches(cv, job_texts, top_k=5)
    
    # التحقق
    top_titles = [sample.iloc[m['job_index']]['Job Title'] 
                  for m in matches[:5]]
    
    if any(category.lower() in t.lower() for t in top_titles):
        correct += 1

accuracy = (correct / len(test_sample)) * 100
print(f"Accuracy: {accuracy:.2f}%")
```

---

## 💡 نصائح للحصول على أفضل النتائج

### 1. جودة البيانات

- تأكد من نظافة البيانات
- أزل التكرارات
- نظف النصوص من الرموز الغريبة

### 2. معايرة النموذج

```python
# جرب قيم مختلفة
learning_rates = [0.0001, 0.0005, 0.001, 0.005]
batch_sizes = [16, 32, 64]
dropouts = [0.2, 0.3, 0.4, 0.5]

# اختبر كل تركيبة
for lr in learning_rates:
    for bs in batch_sizes:
        for dr in dropouts:
            # تدريب واختبار
            pass
```

### 3. استخدام GPU

```python
import torch

# التحقق من وجود GPU
if torch.cuda.is_available():
    print(f"✅ GPU متاح: {torch.cuda.get_device_name(0)}")
    print(f"   الذاكرة: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")
else:
    print("⚠️ GPU غير متاح، سيتم استخدام CPU")
```

---

## 📚 موارد إضافية

- [Sentence Transformers Documentation](https://www.sbert.net/)
- [PyTorch Tutorials](https://pytorch.org/tutorials/)
- [BERT Paper](https://arxiv.org/abs/1810.04805)

---

## 🎓 تدريب متقدم

### استخدام Hyperparameter Tuning

```python
from sklearn.model_selection import ParameterGrid

param_grid = {
    'learning_rate': [0.0001, 0.001, 0.01],
    'batch_size': [16, 32, 64],
    'dropout': [0.2, 0.3, 0.4],
}

best_acc = 0
best_params = None

for params in ParameterGrid(param_grid):
    print(f"\nتجربة: {params}")
    
    matcher = CVJobMatcher()
    acc = matcher.train(
        cvs_file='dataa.csv',
        jobs_file='jobs_clean.csv',
        epochs=20,
        **params
    )
    
    if acc > best_acc:
        best_acc = acc
        best_params = params
        matcher.save_model(f'best_model_{acc:.2f}.pkl')

print(f"\n🏆 أفضل Accuracy: {best_acc:.2f}%")
print(f"⚙️ أفضل Parameters: {best_params}")
```

---

## ✅ Checklist قبل الإنتاج

- [ ] البيانات نظيفة ومنسقة
- [ ] تم تدريب النموذج على بيانات كافية
- [ ] Validation Accuracy > 85%
- [ ] تم اختبار النموذج على بيانات جديدة
- [ ] تم حفظ النموذج في مكان آمن
- [ ] توثيق الكود كامل
- [ ] تم اختبار الأداء على الإنتاج

---

**🎉 الآن أنت جاهز للبدء! حظاً موفقاً!**
