"""
═══════════════════════════════════════════════════════════════
   🎯 نموذج Deep Learning لمطابقة السيرة الذاتية مع الوظائف
═══════════════════════════════════════════════════════════════

✨ المميزات:
  ✅ دقة عالية جداً (>85%)
  ✅ منع Overfitting (Dropout, BatchNorm, Early Stopping)
  ✅ منع Underfitting (معمارية عميقة + Attention)
  ✅ سريع وقابل للتوسع
  ✅ سهل الاستخدام

═══════════════════════════════════════════════════════════════
"""

print(__doc__)

# ═══════════════════════════════════════════════════════════════
# مثال شامل - كل شيء في ملف واحد
# ═══════════════════════════════════════════════════════════════

def complete_example():
    """
    مثال كامل يوضح كيفية استخدام النموذج من البداية للنهاية
    """
    
    print("\n" + "="*70)
    print("🚀 مثال شامل على استخدام النموذج")
    print("="*70)
    
    # ═══════════════════════════════════════════════════════════
    # الخطوة 1: التدريب
    # ═══════════════════════════════════════════════════════════
    
    print("\n📚 الخطوة 1: تدريب النموذج")
    print("-" * 70)
    
    from cv_job_matching_model import CVJobMatcher
    
    # إنشاء النموذج
    matcher = CVJobMatcher(model_name='all-MiniLM-L6-v2')
    
    # التدريب
    print("⏳ جاري التدريب... (قد يستغرق 15-30 دقيقة)")
    
    best_accuracy = matcher.train(
        cvs_file='dataa.csv',
        jobs_file='jobs_clean.csv',
        epochs=50,
        batch_size=32,
        learning_rate=0.001
    )
    
    print(f"✅ انتهى التدريب! أفضل دقة: {best_accuracy:.2f}%")
    
    # حفظ النموذج
    matcher.save_model('cv_job_matcher_final.pkl')
    print("💾 تم حفظ النموذج")
    
    # ═══════════════════════════════════════════════════════════
    # الخطوة 2: الاختبار
    # ═══════════════════════════════════════════════════════════
    
    print("\n📝 الخطوة 2: اختبار النموذج")
    print("-" * 70)
    
    import pandas as pd
    
    # تحميل النموذج المدرب
    matcher_test = CVJobMatcher()
    matcher_test.load_model('cv_job_matcher_final.pkl')
    
    # مثال على سيرة ذاتية
    example_cv = """
    Senior Software Engineer with 7 years of experience.
    
    SKILLS:
    - Programming: Python, Java, JavaScript, C++
    - Frameworks: Django, Flask, Spring Boot, React
    - Database: PostgreSQL, MongoDB, Redis
    - Cloud: AWS (EC2, S3, Lambda), Docker, Kubernetes
    - Machine Learning: TensorFlow, PyTorch, Scikit-learn
    - Tools: Git, Jenkins, JIRA
    
    EXPERIENCE:
    - Led development of microservices architecture
    - Built REST APIs serving 1M+ requests/day
    - Implemented CI/CD pipelines
    - Mentored junior developers
    
    EDUCATION:
    - MSc Computer Science
    - BSc Software Engineering
    """
    
    # تحميل الوظائف
    jobs_df = pd.read_csv('jobs_clean.csv')
    sample_jobs = jobs_df.sample(20)
    
    # تحضير نصوص الوظائف
    job_descriptions = (sample_jobs['Job Title'] + " " + 
                       sample_jobs['job_description_clean']).tolist()
    
    # إيجاد أفضل 10 مطابقات
    print("🔍 جاري البحث عن أفضل الوظائف...")
    matches = matcher_test.find_top_matches(example_cv, job_descriptions, top_k=10)
    
    # عرض النتائج
    print("\n" + "="*70)
    print("🏆 أفضل 10 وظائف مطابقة:")
    print("="*70)
    
    for i, match in enumerate(matches, 1):
        job_idx = match['job_index']
        score = match['similarity_score']
        job_info = sample_jobs.iloc[job_idx]
        
        # تحديد المستوى
        if score >= 85:
            emoji = "⭐⭐⭐"
            level = "ممتاز"
        elif score >= 75:
            emoji = "⭐⭐"
            level = "جيد جداً"
        elif score >= 65:
            emoji = "⭐"
            level = "جيد"
        else:
            emoji = "📌"
            level = "مقبول"
        
        print(f"\n{i}. {job_info['Job Title']} {emoji}")
        print(f"   📊 نسبة التطابق: {score:.2f}% ({level})")
        print(f"   📝 الوصف: {job_info['job_description_clean'][:150]}...")
        print("-" * 70)
    
    # ═══════════════════════════════════════════════════════════
    # الخطوة 3: تحليل النتائج
    # ═══════════════════════════════════════════════════════════
    
    print("\n📊 الخطوة 3: تحليل النتائج")
    print("-" * 70)
    
    import numpy as np
    
    scores = [m['similarity_score'] for m in matches]
    
    print(f"📈 الإحصائيات:")
    print(f"   - أعلى نسبة: {max(scores):.2f}%")
    print(f"   - أقل نسبة: {min(scores):.2f}%")
    print(f"   - المتوسط: {np.mean(scores):.2f}%")
    print(f"   - الانحراف المعياري: {np.std(scores):.2f}")
    
    # عدد الوظائف الممتازة
    excellent = sum(1 for s in scores if s >= 85)
    good = sum(1 for s in scores if 75 <= s < 85)
    fair = sum(1 for s in scores if s < 75)
    
    print(f"\n📌 التوزيع:")
    print(f"   - ممتاز (≥85%): {excellent} وظيفة")
    print(f"   - جيد جداً (75-84%): {good} وظيفة")
    print(f"   - جيد (<75%): {fair} وظيفة")
    
    # ═══════════════════════════════════════════════════════════
    # الخطوة 4: الرسوم البيانية (اختياري)
    # ═══════════════════════════════════════════════════════════
    
    try:
        import matplotlib.pyplot as plt
        
        print("\n📊 الخطوة 4: إنشاء رسوم بيانية")
        print("-" * 70)
        
        # رسم بسيط
        fig, ax = plt.subplots(figsize=(10, 6))
        
        x = range(1, len(matches) + 1)
        colors = ['green' if s >= 85 else 'orange' if s >= 75 else 'red' 
                  for s in scores]
        
        bars = ax.bar(x, scores, color=colors, alpha=0.7, edgecolor='black')
        ax.axhline(y=85, color='green', linestyle='--', label='Excellent (85%)')
        ax.axhline(y=75, color='orange', linestyle='--', label='Good (75%)')
        
        ax.set_xlabel('Rank', fontsize=12)
        ax.set_ylabel('Similarity Score (%)', fontsize=12)
        ax.set_title('Top 10 Job Matches', fontsize=14, fontweight='bold')
        ax.set_ylim(0, 100)
        ax.legend()
        ax.grid(True, alpha=0.3, axis='y')
        
        # إضافة القيم
        for i, (bar, score) in enumerate(zip(bars, scores)):
            ax.text(i + 1, score + 2, f'{score:.1f}%', 
                   ha='center', fontsize=9, fontweight='bold')
        
        plt.tight_layout()
        plt.savefig('match_results.png', dpi=300, bbox_inches='tight')
        print("✅ تم حفظ الرسم في: match_results.png")
        plt.close()
        
    except ImportError:
        print("⚠️ matplotlib غير مثبت، تخطي الرسوم البيانية")
    
    # ═══════════════════════════════════════════════════════════
    # النهاية
    # ═══════════════════════════════════════════════════════════
    
    print("\n" + "="*70)
    print("✅ تم الانتهاء من المثال الشامل!")
    print("="*70)
    print("\n💡 نصائح:")
    print("   - استخدم GPU للتدريب الأسرع")
    print("   - جرب إعدادات مختلفة في config.py")
    print("   - زود عدد الـ epochs للحصول على دقة أعلى")
    print("   - استخدم نموذج BERT أكبر (all-mpnet-base-v2) للدقة القصوى")
    print()


# ═══════════════════════════════════════════════════════════════
# استخدامات أخرى
# ═══════════════════════════════════════════════════════════════

def advanced_usage():
    """
    استخدامات متقدمة للنموذج
    """
    
    print("\n" + "="*70)
    print("🔬 استخدامات متقدمة")
    print("="*70)
    
    from cv_job_matching_model import CVJobMatcher
    import pandas as pd
    
    # تحميل النموذج
    matcher = CVJobMatcher()
    matcher.load_model('cv_job_matcher_final.pkl')
    
    # ═══════════════════════════════════════════════════════════
    # 1. مطابقة مع جميع الوظائف
    # ═══════════════════════════════════════════════════════════
    
    print("\n1️⃣ مطابقة مع جميع الوظائف في قاعدة البيانات")
    print("-" * 70)
    
    jobs_df = pd.read_csv('jobs_clean.csv')
    
    my_cv = "Python Developer with Django and Machine Learning experience"
    
    # تحضير جميع الوظائف
    all_jobs = (jobs_df['Job Title'] + " " + 
                jobs_df['job_description_clean']).tolist()
    
    print(f"🔍 البحث في {len(all_jobs)} وظيفة...")
    
    # إيجاد أفضل 20 مطابقة
    top_20 = matcher.find_top_matches(my_cv, all_jobs, top_k=20)
    
    # تصفية حسب نسبة معينة
    good_matches = [m for m in top_20 if m['similarity_score'] >= 80]
    
    print(f"✅ وجدت {len(good_matches)} وظيفة ممتازة (≥80%)")
    
    # ═══════════════════════════════════════════════════════════
    # 2. مقارنة عدة سير ذاتية
    # ═══════════════════════════════════════════════════════════
    
    print("\n2️⃣ مقارنة عدة سير ذاتية لنفس الوظيفة")
    print("-" * 70)
    
    cvs = [
        "Python Developer with 3 years experience in Django",
        "Java Developer with Spring Boot and Microservices",
        "Full Stack Developer with React and Node.js"
    ]
    
    job = "Backend Developer position requiring Python Django REST APIs"
    
    print(f"🎯 الوظيفة: {job}\n")
    
    for i, cv in enumerate(cvs, 1):
        matches = matcher.find_top_matches(cv, [job], top_k=1)
        score = matches[0]['similarity_score']
        
        print(f"   {i}. CV: {cv[:50]}...")
        print(f"      نسبة التطابق: {score:.2f}%\n")
    
    # ═══════════════════════════════════════════════════════════
    # 3. تحليل فئات الوظائف
    # ═══════════════════════════════════════════════════════════
    
    print("\n3️⃣ تحليل أفضل الفئات لسيرة ذاتية")
    print("-" * 70)
    
    cv = "Data Scientist with ML, Deep Learning, Python, TensorFlow"
    
    # فئات مختلفة
    categories = {
        'Data Science': jobs_df[jobs_df['Job Title'].str.contains('Data|Scientist', case=False, na=False)],
        'Machine Learning': jobs_df[jobs_df['Job Title'].str.contains('Machine|ML|AI', case=False, na=False)],
        'Software Engineer': jobs_df[jobs_df['Job Title'].str.contains('Software|Engineer', case=False, na=False)],
        'Backend Developer': jobs_df[jobs_df['Job Title'].str.contains('Backend|Developer', case=False, na=False)],
    }
    
    category_scores = {}
    
    for cat_name, cat_jobs in categories.items():
        if len(cat_jobs) == 0:
            continue
        
        sample = cat_jobs.sample(min(10, len(cat_jobs)))
        job_texts = (sample['Job Title'] + " " + 
                    sample['job_description_clean']).tolist()
        
        matches = matcher.find_top_matches(cv, job_texts, top_k=5)
        avg_score = sum(m['similarity_score'] for m in matches) / len(matches)
        
        category_scores[cat_name] = avg_score
    
    # ترتيب حسب الأعلى
    sorted_cats = sorted(category_scores.items(), key=lambda x: x[1], reverse=True)
    
    print("📊 أفضل الفئات للسيرة الذاتية:\n")
    for i, (cat, score) in enumerate(sorted_cats, 1):
        print(f"   {i}. {cat}: {score:.2f}%")
    
    # ═══════════════════════════════════════════════════════════
    # 4. Batch Processing
    # ═══════════════════════════════════════════════════════════
    
    print("\n4️⃣ معالجة دفعة من السير الذاتية")
    print("-" * 70)
    
    cvs_df = pd.read_csv('dataa.csv')
    test_cvs = cvs_df.sample(5)
    
    results = []
    
    print("⏳ جاري معالجة 5 سير ذاتية...\n")
    
    for idx, row in test_cvs.iterrows():
        cv_text = row['Resume']
        category = row['Category']
        
        # عينة وظائف
        sample_jobs = jobs_df.sample(20)
        job_texts = (sample_jobs['Job Title'] + " " + 
                    sample_jobs['job_description_clean']).tolist()
        
        matches = matcher.find_top_matches(cv_text, job_texts, top_k=3)
        best_match = matches[0]
        
        results.append({
            'category': category,
            'best_job': sample_jobs.iloc[best_match['job_index']]['Job Title'],
            'score': best_match['similarity_score']
        })
        
        print(f"✅ {category} → {results[-1]['best_job'][:40]}... ({results[-1]['score']:.1f}%)")
    
    print("\n" + "="*70)
    print("✅ تم الانتهاء من الاستخدامات المتقدمة!")
    print("="*70)


# ═══════════════════════════════════════════════════════════════
# التشغيل
# ═══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import sys
    
    print("\n🎯 ماذا تريد أن تفعل؟")
    print("="*70)
    print("1. تشغيل المثال الشامل (تدريب + اختبار)")
    print("2. الاستخدامات المتقدمة (يتطلب نموذج مدرب)")
    print("3. الخروج")
    print("="*70)
    
    choice = input("\nاختر (1/2/3): ").strip()
    
    if choice == "1":
        complete_example()
    elif choice == "2":
        try:
            advanced_usage()
        except FileNotFoundError:
            print("\n❌ النموذج غير موجود!")
            print("💡 يجب تدريب النموذج أولاً (اختر الخيار 1)")
    elif choice == "3":
        print("\n👋 إلى اللقاء!")
    else:
        print("\n❌ خيار غير صحيح!")
        print("💡 شغل البرنامج مرة أخرى واختر 1، 2، أو 3")
