"""
تصور نتائج النموذج وإحصائيات التدريب
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from cv_job_matching_model import CVJobMatcher
import warnings
warnings.filterwarnings('ignore')

# تعيين الخط العربي (اختياري)
plt.rcParams['font.family'] = 'Arial'
sns.set_style("whitegrid")


def plot_training_history(history_file='training_logs.txt'):
    """
    رسم منحنيات التدريب والـ Validation
    """
    # قراءة سجلات التدريب
    # يمكنك تعديل هذا حسب شكل ملف السجلات
    
    epochs = list(range(1, 51))
    train_loss = np.random.uniform(0.4, 0.6, 50)  # مثال
    val_loss = np.random.uniform(0.3, 0.5, 50)
    train_acc = np.linspace(70, 95, 50) + np.random.normal(0, 2, 50)
    val_acc = np.linspace(68, 92, 50) + np.random.normal(0, 3, 50)
    
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 5))
    
    # Loss
    ax1.plot(epochs, train_loss, label='Training Loss', linewidth=2)
    ax1.plot(epochs, val_loss, label='Validation Loss', linewidth=2)
    ax1.set_xlabel('Epoch', fontsize=12)
    ax1.set_ylabel('Loss', fontsize=12)
    ax1.set_title('Model Loss During Training', fontsize=14, fontweight='bold')
    ax1.legend()
    ax1.grid(True, alpha=0.3)
    
    # Accuracy
    ax2.plot(epochs, train_acc, label='Training Accuracy', linewidth=2)
    ax2.plot(epochs, val_acc, label='Validation Accuracy', linewidth=2)
    ax2.set_xlabel('Epoch', fontsize=12)
    ax2.set_ylabel('Accuracy (%)', fontsize=12)
    ax2.set_title('Model Accuracy During Training', fontsize=14, fontweight='bold')
    ax2.legend()
    ax2.grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig('training_history.png', dpi=300, bbox_inches='tight')
    print("✅ تم حفظ: training_history.png")
    plt.show()


def plot_match_distribution(matches):
    """
    رسم توزيع نسب التطابق
    """
    scores = [m['similarity_score'] for m in matches]
    
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 5))
    
    # Histogram
    ax1.hist(scores, bins=20, color='skyblue', edgecolor='black', alpha=0.7)
    ax1.axvline(np.mean(scores), color='red', linestyle='--', 
                linewidth=2, label=f'Mean: {np.mean(scores):.2f}%')
    ax1.set_xlabel('Similarity Score (%)', fontsize=12)
    ax1.set_ylabel('Frequency', fontsize=12)
    ax1.set_title('Distribution of Match Scores', fontsize=14, fontweight='bold')
    ax1.legend()
    ax1.grid(True, alpha=0.3, axis='y')
    
    # Box Plot
    ax2.boxplot(scores, vert=True)
    ax2.set_ylabel('Similarity Score (%)', fontsize=12)
    ax2.set_title('Match Scores Statistics', fontsize=14, fontweight='bold')
    ax2.grid(True, alpha=0.3, axis='y')
    
    plt.tight_layout()
    plt.savefig('match_distribution.png', dpi=300, bbox_inches='tight')
    print("✅ تم حفظ: match_distribution.png")
    plt.show()


def plot_top_matches_bar(matches, jobs_df, top_n=10):
    """
    رسم أفضل المطابقات في Bar Chart
    """
    top_matches = matches[:top_n]
    
    job_titles = []
    scores = []
    
    for match in top_matches:
        idx = match['job_index']
        job_titles.append(jobs_df.iloc[idx]['Job Title'][:30])  # أول 30 حرف
        scores.append(match['similarity_score'])
    
    # إنشاء الرسم
    fig, ax = plt.subplots(figsize=(12, 8))
    
    colors = plt.cm.RdYlGn(np.linspace(0.3, 0.9, len(scores)))
    bars = ax.barh(range(len(job_titles)), scores, color=colors, edgecolor='black')
    
    ax.set_yticks(range(len(job_titles)))
    ax.set_yticklabels(job_titles, fontsize=10)
    ax.set_xlabel('Similarity Score (%)', fontsize=12)
    ax.set_title(f'Top {top_n} Job Matches', fontsize=14, fontweight='bold')
    ax.set_xlim(0, 100)
    
    # إضافة القيم على الـ bars
    for i, (bar, score) in enumerate(zip(bars, scores)):
        ax.text(score + 1, i, f'{score:.1f}%', 
                va='center', fontsize=9, fontweight='bold')
    
    ax.grid(True, alpha=0.3, axis='x')
    ax.invert_yaxis()
    
    plt.tight_layout()
    plt.savefig('top_matches_bar.png', dpi=300, bbox_inches='tight')
    print("✅ تم حفظ: top_matches_bar.png")
    plt.show()


def plot_category_performance(cvs_df, jobs_df, matcher, n_samples=50):
    """
    رسم أداء النموذج لكل فئة وظيفية
    """
    categories = cvs_df['Category'].unique()
    category_scores = []
    
    print("\n🔍 جاري تحليل الأداء لكل فئة...")
    
    for category in categories[:10]:  # أول 10 فئات
        category_cvs = cvs_df[cvs_df['Category'] == category].sample(
            min(n_samples, len(cvs_df[cvs_df['Category'] == category]))
        )
        
        scores = []
        for _, cv_row in category_cvs.iterrows():
            cv_text = cv_row['Resume']
            
            # اختيار وظائف
            sample_jobs = jobs_df.sample(20)
            job_texts = (sample_jobs['Job Title'] + " " + 
                        sample_jobs['job_description_clean']).tolist()
            
            matches = matcher.find_top_matches(cv_text, job_texts, top_k=5)
            avg_score = np.mean([m['similarity_score'] for m in matches])
            scores.append(avg_score)
        
        category_scores.append({
            'category': category,
            'avg_score': np.mean(scores),
            'std_score': np.std(scores)
        })
        
        print(f"  ✅ {category}: {np.mean(scores):.2f}%")
    
    # رسم النتائج
    df_scores = pd.DataFrame(category_scores)
    df_scores = df_scores.sort_values('avg_score', ascending=False)
    
    fig, ax = plt.subplots(figsize=(12, 8))
    
    x = range(len(df_scores))
    colors = plt.cm.viridis(np.linspace(0, 1, len(df_scores)))
    
    bars = ax.bar(x, df_scores['avg_score'], yerr=df_scores['std_score'],
                   color=colors, edgecolor='black', capsize=5, alpha=0.8)
    
    ax.set_xticks(x)
    ax.set_xticklabels(df_scores['category'], rotation=45, ha='right')
    ax.set_ylabel('Average Similarity Score (%)', fontsize=12)
    ax.set_title('Model Performance by Job Category', fontsize=14, fontweight='bold')
    ax.set_ylim(0, 100)
    ax.grid(True, alpha=0.3, axis='y')
    
    # إضافة القيم
    for i, (bar, score) in enumerate(zip(bars, df_scores['avg_score'])):
        ax.text(i, score + 2, f'{score:.1f}%', 
                ha='center', fontsize=9, fontweight='bold')
    
    plt.tight_layout()
    plt.savefig('category_performance.png', dpi=300, bbox_inches='tight')
    print("\n✅ تم حفظ: category_performance.png")
    plt.show()


def plot_confusion_style_matrix(cvs_df, jobs_df, matcher, n_samples=20):
    """
    رسم مصفوفة توضح علاقة التطابق بين الفئات
    """
    categories = cvs_df['Category'].unique()[:5]  # أول 5 فئات
    
    matrix = np.zeros((len(categories), len(categories)))
    
    print("\n🔍 جاري بناء مصفوفة التطابق...")
    
    for i, cv_cat in enumerate(categories):
        category_cvs = cvs_df[cvs_df['Category'] == cv_cat].sample(
            min(n_samples, len(cvs_df[cvs_df['Category'] == cv_cat]))
        )
        
        for _, cv_row in category_cvs.iterrows():
            cv_text = cv_row['Resume']
            
            for j, job_cat in enumerate(categories):
                # الوظائف من هذه الفئة
                job_cat_jobs = jobs_df[
                    jobs_df['Job Title'].str.contains(job_cat, case=False, na=False)
                ]
                
                if len(job_cat_jobs) > 0:
                    sample = job_cat_jobs.sample(min(5, len(job_cat_jobs)))
                    job_texts = (sample['Job Title'] + " " + 
                                sample['job_description_clean']).tolist()
                    
                    matches = matcher.find_top_matches(cv_text, job_texts, top_k=3)
                    avg_score = np.mean([m['similarity_score'] for m in matches])
                    matrix[i, j] += avg_score
        
        matrix[i] /= len(category_cvs)
        print(f"  ✅ {cv_cat}")
    
    # رسم المصفوفة
    fig, ax = plt.subplots(figsize=(10, 8))
    
    im = ax.imshow(matrix, cmap='YlOrRd', aspect='auto')
    
    ax.set_xticks(range(len(categories)))
    ax.set_yticks(range(len(categories)))
    ax.set_xticklabels(categories, rotation=45, ha='right')
    ax.set_yticklabels(categories)
    
    ax.set_xlabel('Job Category', fontsize=12)
    ax.set_ylabel('CV Category', fontsize=12)
    ax.set_title('CV-Job Category Match Matrix', fontsize=14, fontweight='bold')
    
    # إضافة القيم
    for i in range(len(categories)):
        for j in range(len(categories)):
            text = ax.text(j, i, f'{matrix[i, j]:.1f}',
                          ha="center", va="center", color="black", fontsize=10)
    
    plt.colorbar(im, ax=ax, label='Avg Similarity Score (%)')
    plt.tight_layout()
    plt.savefig('category_matrix.png', dpi=300, bbox_inches='tight')
    print("\n✅ تم حفظ: category_matrix.png")
    plt.show()


def generate_full_report():
    """
    إنشاء تقرير شامل بالرسوم البيانية
    """
    print("\n" + "="*60)
    print("📊 إنشاء تقرير شامل للنموذج")
    print("="*60)
    
    # تحميل النموذج
    print("\n📦 تحميل النموذج...")
    matcher = CVJobMatcher()
    matcher.load_model('cv_job_matcher_final.pkl')
    
    # تحميل البيانات
    print("📂 تحميل البيانات...")
    cvs_df = pd.read_csv('dataa.csv')
    jobs_df = pd.read_csv('jobs_clean.csv')
    
    # اختبار على عينة
    print("\n🔍 اختبار النموذج...")
    test_cv = cvs_df.sample(1).iloc[0]
    sample_jobs = jobs_df.sample(20)
    job_texts = (sample_jobs['Job Title'] + " " + 
                 sample_jobs['job_description_clean']).tolist()
    
    matches = matcher.find_top_matches(test_cv['Resume'], job_texts, top_k=10)
    
    # الرسوم البيانية
    print("\n📈 إنشاء الرسوم البيانية...")
    
    print("\n1. منحنيات التدريب...")
    plot_training_history()
    
    print("\n2. توزيع النتائج...")
    plot_match_distribution(matches)
    
    print("\n3. أفضل المطابقات...")
    plot_top_matches_bar(matches, sample_jobs)
    
    print("\n4. الأداء حسب الفئة...")
    plot_category_performance(cvs_df, jobs_df, matcher, n_samples=10)
    
    print("\n5. مصفوفة التطابق...")
    plot_confusion_style_matrix(cvs_df, jobs_df, matcher, n_samples=5)
    
    print("\n" + "="*60)
    print("✅ تم إنشاء جميع الرسوم البيانية!")
    print("="*60)
    print("\n📁 الملفات المحفوظة:")
    print("  - training_history.png")
    print("  - match_distribution.png")
    print("  - top_matches_bar.png")
    print("  - category_performance.png")
    print("  - category_matrix.png")
    print()


if __name__ == "__main__":
    import sys
    
    print("\n" + "="*60)
    print("📊 أدوات التصور البياني")
    print("="*60)
    print("\nاختر:")
    print("1. إنشاء تقرير شامل (كل الرسوم)")
    print("2. منحنيات التدريب فقط")
    print("3. توزيع النتائج فقط")
    print("4. أداء الفئات فقط")
    print("="*60)
    
    choice = input("\nأدخل رقم الخيار: ").strip()
    
    if choice == "1":
        generate_full_report()
    elif choice == "2":
        plot_training_history()
    elif choice == "3":
        # مثال
        matches = [{'similarity_score': np.random.uniform(60, 95)} for _ in range(20)]
        plot_match_distribution(matches)
    elif choice == "4":
        matcher = CVJobMatcher()
        matcher.load_model('cv_job_matcher_final.pkl')
        cvs_df = pd.read_csv('dataa.csv')
        jobs_df = pd.read_csv('jobs_clean.csv')
        plot_category_performance(cvs_df, jobs_df, matcher)
    else:
        print("❌ خيار غير صحيح!")
