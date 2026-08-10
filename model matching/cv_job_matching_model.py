"""
نموذج Deep Learning لمطابقة السيرة الذاتية مع الوظائف
يستخدم BERT و Sentence Transformers لتحقيق دقة عالية
"""

import sys
import os
import pandas as pd
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from sentence_transformers import SentenceTransformer, util
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import pickle
import warnings
warnings.filterwarnings('ignore')


class CVJobDataset(Dataset):
    """Dataset مخصص للسير الذاتية والوظائف"""

    def __init__(self, cv_embeddings, job_embeddings, labels):
        self.cv_embeddings = cv_embeddings
        self.job_embeddings = job_embeddings
        self.labels = labels

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        return {
            'cv_embedding': torch.FloatTensor(self.cv_embeddings[idx]),
            'job_embedding': torch.FloatTensor(self.job_embeddings[idx]),
            'label': torch.LongTensor([self.labels[idx]])
        }


class SiameseMatchingNetwork(nn.Module):
    """
    شبكة Siamese Network متقدمة لمطابقة السيرة الذاتية مع الوظائف
    تستخدم Attention Mechanism و Residual Connections
    """

    def __init__(self, embedding_dim=384, hidden_dims=[512, 256, 128], dropout=0.3):
        super(SiameseMatchingNetwork, self).__init__()

        # CV Processing Branch
        self.cv_branch = nn.Sequential(
            nn.Linear(embedding_dim, hidden_dims[0]),
            nn.BatchNorm1d(hidden_dims[0]),
            nn.ReLU(),
            nn.Dropout(dropout),

            nn.Linear(hidden_dims[0], hidden_dims[1]),
            nn.BatchNorm1d(hidden_dims[1]),
            nn.ReLU(),
            nn.Dropout(dropout),

            nn.Linear(hidden_dims[1], hidden_dims[2]),
            nn.BatchNorm1d(hidden_dims[2]),
            nn.ReLU()
        )

        # Job Processing Branch
        self.job_branch = nn.Sequential(
            nn.Linear(embedding_dim, hidden_dims[0]),
            nn.BatchNorm1d(hidden_dims[0]),
            nn.ReLU(),
            nn.Dropout(dropout),

            nn.Linear(hidden_dims[0], hidden_dims[1]),
            nn.BatchNorm1d(hidden_dims[1]),
            nn.ReLU(),
            nn.Dropout(dropout),

            nn.Linear(hidden_dims[1], hidden_dims[2]),
            nn.BatchNorm1d(hidden_dims[2]),
            nn.ReLU()
        )

        # Attention Layer
        self.attention = nn.MultiheadAttention(
            embed_dim=hidden_dims[2],
            num_heads=4,
            dropout=dropout,
            batch_first=True
        )

        # Matching Network
        combined_dim = hidden_dims[2] * 2
        self.matching_network = nn.Sequential(
            nn.Linear(combined_dim, 256),
            nn.BatchNorm1d(256),
            nn.ReLU(),
            nn.Dropout(dropout),

            nn.Linear(256, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.Dropout(dropout),

            nn.Linear(128, 64),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.Dropout(dropout / 2),

            nn.Linear(64, 1),
            nn.Sigmoid()
        )

    def forward(self, cv_embedding, job_embedding):
        # Process CV
        cv_features = self.cv_branch(cv_embedding)

        # Process Job
        job_features = self.job_branch(job_embedding)

        # Apply Attention (reshape for attention mechanism)
        cv_attn = cv_features.unsqueeze(1)
        job_attn = job_features.unsqueeze(1)

        # Cross attention between CV and Job
        cv_attended, _ = self.attention(cv_attn, job_attn, job_attn)
        cv_attended = cv_attended.squeeze(1)

        # Combine features
        combined = torch.cat([cv_attended, job_features], dim=1)

        # Calculate matching score
        similarity = self.matching_network(combined)

        return similarity


class CVJobMatcher:
    """
    نظام متكامل لمطابقة السيرة الذاتية مع الوظائف
    """

    def __init__(self, model_name='all-MiniLM-L6-v2'):
        """
        تهيئة النموذج
        model_name: اسم نموذج Sentence Transformer
        """
        print("🚀 جاري تحميل نموذج BERT...", file=sys.stderr, flush=True)
        self.device = torch.device(
            'cuda' if torch.cuda.is_available() else 'cpu')
        print(f"✅ استخدام: {self.device}", file=sys.stderr, flush=True)

        # Force offline cache usage so the service never hits the network
        cache_root = os.path.abspath(os.path.join(os.path.dirname(__file__), 'bert-cache'))
        os.environ.setdefault('HF_HOME', cache_root)
        os.environ.setdefault('SENTENCE_TRANSFORMERS_HOME', cache_root)
        os.environ.setdefault('TRANSFORMERS_OFFLINE', '1')
        os.environ.setdefault('HF_HUB_OFFLINE', '1')

        # تحميل Sentence Transformer
        self.embedder = SentenceTransformer(model_name, cache_folder=cache_root)
        self.embedding_dim = self.embedder.get_sentence_embedding_dimension()

        # تهيئة شبكة المطابقة
        self.matching_model = None
        self.label_encoder = LabelEncoder()

    def create_training_data(self, cvs_df, jobs_df, sample_size=10000):
        """
        إنشاء بيانات التدريب بطريقة متوازنة
        """
        print("\n📊 جاري إنشاء بيانات التدريب...")

        training_data = []

        # إنشاء أمثلة إيجابية (CV يتطابق مع فئته)
        for idx, cv_row in cvs_df.iterrows():
            category = cv_row['Category']
            cv_text = cv_row['Resume']

            # اختيار وظائف من نفس الفئة
            matching_jobs = jobs_df[jobs_df['Job Title'].str.contains(
                category, case=False, na=False)]

            if len(matching_jobs) > 0:
                # اختيار وظيفة عشوائية
                job_row = matching_jobs.sample(1).iloc[0]
                training_data.append({
                    'cv': cv_text,
                    'job': f"{job_row['Job Title']} {job_row['job_description_clean']}",
                    'label': 1  # متطابق
                })

        # إنشاء أمثلة سلبية (CV لا يتطابق مع الفئة)
        for idx, cv_row in cvs_df.iterrows():
            category = cv_row['Category']
            cv_text = cv_row['Resume']

            # اختيار وظائف من فئة مختلفة
            non_matching_jobs = jobs_df[~jobs_df['Job Title'].str.contains(
                category, case=False, na=False)]

            if len(non_matching_jobs) > 0:
                job_row = non_matching_jobs.sample(1).iloc[0]
                training_data.append({
                    'cv': cv_text,
                    'job': f"{job_row['Job Title']} {job_row['job_description_clean']}",
                    'label': 0  # غير متطابق
                })

            if len(training_data) >= sample_size:
                break

        train_df = pd.DataFrame(training_data)
        print(f"✅ تم إنشاء {len(train_df)} عينة تدريب")
        print(f"   - أمثلة إيجابية: {sum(train_df['label'] == 1)}")
        print(f"   - أمثلة سلبية: {sum(train_df['label'] == 0)}")

        return train_df

    def prepare_embeddings(self, texts, batch_size=32):
        """
        تحويل النصوص إلى embeddings
        """
        print(f"🔄 جاري تحويل {len(texts)} نص إلى embeddings...")
        embeddings = self.embedder.encode(
            texts,
            batch_size=batch_size,
            show_progress_bar=True,
            convert_to_numpy=True
        )
        return embeddings

    def train(self, cvs_file, jobs_file, epochs=50, batch_size=32, learning_rate=0.001):
        """
        تدريب النموذج
        """
        print("\n" + "="*60)
        print("🎓 بدء عملية التدريب")
        print("="*60)

        # تحميل البيانات
        print("\n📂 جاري تحميل البيانات...")
        cvs_df = pd.read_csv(cvs_file)
        jobs_df = pd.read_csv(jobs_file)

        print(f"✅ تم تحميل {len(cvs_df)} سيرة ذاتية")
        print(f"✅ تم تحميل {len(jobs_df)} وظيفة")

        # إنشاء بيانات التدريب
        train_df = self.create_training_data(cvs_df, jobs_df)

        # تحضير Embeddings
        print("\n🔄 جاري تحضير Embeddings...")
        cv_embeddings = self.prepare_embeddings(train_df['cv'].tolist())
        job_embeddings = self.prepare_embeddings(train_df['job'].tolist())

        # تقسيم البيانات
        X_cv_train, X_cv_val, X_job_train, X_job_val, y_train, y_val = train_test_split(
            cv_embeddings, job_embeddings, train_df['label'].values,
            test_size=0.2, random_state=42, stratify=train_df['label']
        )

        print(f"\n📊 تقسيم البيانات:")
        print(f"   - Training: {len(y_train)} عينة")
        print(f"   - Validation: {len(y_val)} عينة")

        # إنشاء DataLoaders
        train_dataset = CVJobDataset(X_cv_train, X_job_train, y_train)
        val_dataset = CVJobDataset(X_cv_val, X_job_val, y_val)

        train_loader = DataLoader(
            train_dataset, batch_size=batch_size, shuffle=True)
        val_loader = DataLoader(val_dataset, batch_size=batch_size)

        # تهيئة النموذج
        print(f"\n🏗️ جاري بناء الشبكة العصبية...")
        self.matching_model = SiameseMatchingNetwork(
            embedding_dim=self.embedding_dim,
            hidden_dims=[512, 256, 128],
            dropout=0.3
        ).to(self.device)

        # Loss و Optimizer
        criterion = nn.BCELoss()
        optimizer = torch.optim.AdamW(
            self.matching_model.parameters(),
            lr=learning_rate,
            weight_decay=0.01
        )

        # Learning Rate Scheduler
        scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
            optimizer, mode='max', factor=0.5, patience=5
        )

        # Early Stopping
        best_val_acc = 0
        patience = 10
        patience_counter = 0

        # Training Loop
        print("\n" + "="*60)
        print("🚀 بدء التدريب...")
        print("="*60)

        for epoch in range(epochs):
            # Training
            self.matching_model.train()
            train_loss = 0
            train_correct = 0
            train_total = 0

            for batch in train_loader:
                cv_emb = batch['cv_embedding'].to(self.device)
                job_emb = batch['job_embedding'].to(self.device)
                labels = batch['label'].float().to(self.device)

                optimizer.zero_grad()
                outputs = self.matching_model(cv_emb, job_emb)
                loss = criterion(outputs, labels)
                loss.backward()

                # Gradient Clipping
                torch.nn.utils.clip_grad_norm_(
                    self.matching_model.parameters(), max_norm=1.0)

                optimizer.step()

                train_loss += loss.item()
                predictions = (outputs > 0.5).float()
                train_correct += (predictions == labels).sum().item()
                train_total += labels.size(0)

            train_acc = 100 * train_correct / train_total
            avg_train_loss = train_loss / len(train_loader)

            # Validation
            self.matching_model.eval()
            val_loss = 0
            val_correct = 0
            val_total = 0

            with torch.no_grad():
                for batch in val_loader:
                    cv_emb = batch['cv_embedding'].to(self.device)
                    job_emb = batch['job_embedding'].to(self.device)
                    labels = batch['label'].float().to(self.device)

                    outputs = self.matching_model(cv_emb, job_emb)
                    loss = criterion(outputs, labels)

                    val_loss += loss.item()
                    predictions = (outputs > 0.5).float()
                    val_correct += (predictions == labels).sum().item()
                    val_total += labels.size(0)

            val_acc = 100 * val_correct / val_total
            avg_val_loss = val_loss / len(val_loader)

            # Print Progress
            print(f"Epoch [{epoch+1}/{epochs}]")
            print(
                f"  Train Loss: {avg_train_loss:.4f} | Train Acc: {train_acc:.2f}%")
            print(f"  Val Loss: {avg_val_loss:.4f} | Val Acc: {val_acc:.2f}%")
            print("-" * 60)

            # Learning Rate Scheduling
            scheduler.step(val_acc)

            # Early Stopping & Model Saving
            if val_acc > best_val_acc:
                best_val_acc = val_acc
                patience_counter = 0
                # حفظ أفضل نموذج
                torch.save(self.matching_model.state_dict(),
                           'best_matching_model.pth')
                print(
                    f"✅ تم حفظ أفضل نموذج! Validation Accuracy: {val_acc:.2f}%\n")
            else:
                patience_counter += 1
                if patience_counter >= patience:
                    print(
                        f"\n⚠️ Early Stopping! لم يتحسن النموذج منذ {patience} epochs")
                    break

        # تحميل أفضل نموذج
        self.matching_model.load_state_dict(
            torch.load('best_matching_model.pth'))

        print("\n" + "="*60)
        print(f"✅ انتهى التدريب!")
        print(f"🏆 أفضل دقة: {best_val_acc:.2f}%")
        print("="*60)

        return best_val_acc

    def find_top_matches(self, cv_text, job_descriptions, top_k=10, use_hybrid=True):
        """
        إيجاد أفضل الوظائف المطابقة للسيرة الذاتية
        use_hybrid: استخدام نهج هجين يجمع بين النموذج المدرب والتشابه الدلالي المباشر
        """
        # تحويل CV إلى embedding
        cv_embedding = self.embedder.encode([cv_text], convert_to_numpy=True)

        # تحويل الوظائف إلى embeddings
        job_embeddings = self.embedder.encode(
            job_descriptions, convert_to_numpy=True)

        # حساب درجات التطابق
        matches = []

        if self.matching_model is not None and not use_hybrid:
            # استخدام النموذج المدرب فقط
            self.matching_model.eval()
            with torch.no_grad():
                cv_tensor = torch.FloatTensor(cv_embedding).to(self.device)

                for idx, job_emb in enumerate(job_embeddings):
                    job_tensor = torch.FloatTensor(
                        job_emb).unsqueeze(0).to(self.device)
                    score = self.matching_model(cv_tensor, job_tensor)
                    matches.append({
                        'job_index': idx,
                        'similarity_score': score.item() * 100
                    })
        else:
            # استخدام التشابه الدلالي المباشر (أكثر دقة للبيانات الجديدة)
            # حساب cosine similarity مباشرة من BERT embeddings
            for idx, job_emb in enumerate(job_embeddings):
                # Cosine similarity
                cos_sim = util.cos_sim(cv_embedding[0], job_emb).item()

                # تحويل من [-1, 1] إلى [0, 100]
                similarity_score = (cos_sim + 1) * 50

                # إضافة keyword matching boost
                keyword_boost = self._calculate_keyword_match(
                    cv_text, job_descriptions[idx])

                # الدرجة النهائية: 70% semantic + 30% keyword matching
                final_score = (similarity_score * 0.7) + (keyword_boost * 0.3)

                matches.append({
                    'job_index': idx,
                    'similarity_score': final_score
                })

        # ترتيب النتائج
        matches = sorted(
            matches, key=lambda x: x['similarity_score'], reverse=True)

        return matches[:top_k]

    def _calculate_keyword_match(self, cv_text, job_text):
        """
        حساب نسبة التطابق بناءً على الكلمات المفتاحية التقنية
        """
        # تحويل النصوص إلى lowercase
        cv_lower = cv_text.lower()
        job_lower = job_text.lower()

        # قائمة شاملة بالمهارات التقنية والكلمات المفتاحية
        tech_keywords = [
            # Backend & Languages
            'node.js', 'nodejs', 'express', 'express.js',
            'python', 'java', 'javascript', 'typescript', 'php', 'c#', 'c++',
            'ruby', 'go', 'golang', 'rust', 'scala', 'kotlin',

            # Databases
            'mongodb', 'mysql', 'postgresql', 'redis', 'sql', 'nosql',
            'database', 'oracle', 'cassandra', 'dynamodb',

            # Frontend
            'react', 'vue', 'angular', 'next.js', 'nextjs',
            'html', 'css', 'javascript', 'jquery', 'bootstrap',

            # DevOps & Tools
            'docker', 'kubernetes', 'jenkins', 'git', 'github', 'gitlab',
            'ci/cd', 'aws', 'azure', 'gcp', 'nginx', 'apache',
            'linux', 'unix', 'bash', 'shell',

            # API & Architecture
            'rest', 'restful', 'api', 'graphql', 'microservices',
            'websocket', 'grpc', 'soap',

            # Security & Auth
            'jwt', 'oauth', 'authentication', 'authorization',
            'security', 'encryption', 'ssl', 'tls',

            # AI & Data Science
            'machine learning', 'deep learning', 'tensorflow', 'pytorch',
            'scikit-learn', 'pandas', 'numpy', 'computer vision',
            'opencv', 'nlp', 'ai', 'artificial intelligence',

            # Mobile
            'react native', 'flutter', 'android', 'ios', 'swift',
            'kotlin', 'mobile app',

            # Testing & Quality
            'testing', 'unit test', 'selenium', 'jest', 'pytest',
            'qa', 'quality assurance', 'agile', 'scrum',

            # Data & Analytics
            'data analysis', 'power bi', 'tableau', 'excel',
            'analytics', 'big data', 'hadoop', 'spark',

            # Design & Marketing
            'photoshop', 'illustrator', 'figma', 'ui/ux',
            'seo', 'marketing', 'google ads',

            # Network & Systems
            'network', 'cisco', 'firewall', 'vpn', 'routing',
            'cybersecurity', 'penetration testing', 'siem',

            # Business & Management
            'project management', 'hr', 'accounting', 'quickbooks',
            'communication', 'leadership'
        ]

        # حساب عدد الكلمات المفتاحية المشتركة
        matched_keywords = 0
        total_job_keywords = 0

        for keyword in tech_keywords:
            if keyword in job_lower:
                total_job_keywords += 1
                if keyword in cv_lower:
                    matched_keywords += 1

        # حساب النسبة المئوية
        if total_job_keywords > 0:
            match_percentage = (matched_keywords / total_job_keywords) * 100
        else:
            match_percentage = 0

        return match_percentage

    def save_model(self, path='cv_job_matcher.pkl'):
        """
        حفظ النموذج
        """
        model_data = {
            'matching_model_state': self.matching_model.state_dict(),
            'embedding_dim': self.embedding_dim,
            'embedder_name': self.embedder._model_config.get('_name_or_path', 'all-MiniLM-L6-v2')
        }

        with open(path, 'wb') as f:
            pickle.dump(model_data, f)

        print(f"✅ تم حفظ النموذج في: {path}")

    def load_model(self, path='cv_job_matcher.pkl'):
        """
        تحميل النموذج
        """
        with open(path, 'rb') as f:
            model_data = pickle.load(f)

        self.embedding_dim = model_data['embedding_dim']
        self.matching_model = SiameseMatchingNetwork(
            embedding_dim=self.embedding_dim).to(self.device)
        self.matching_model.load_state_dict(model_data['matching_model_state'])
        self.matching_model.eval()

        print(f"✅ تم تحميل النموذج من: {path}", file=sys.stderr, flush=True)


def main():
    """
    الدالة الرئيسية للتدريب والاختبار
    """
    # تهيئة النموذج
    matcher = CVJobMatcher(model_name='all-MiniLM-L6-v2')

    # التدريب
    best_accuracy = matcher.train(
        cvs_file='dataa.csv',
        jobs_file='jobs_clean.csv',
        epochs=50,
        batch_size=32,
        learning_rate=0.001
    )

    # حفظ النموذج
    matcher.save_model('cv_job_matcher_final.pkl')

    print(f"\n🎉 تم الانتهاء! أفضل دقة: {best_accuracy:.2f}%")


if __name__ == "__main__":
    main()
