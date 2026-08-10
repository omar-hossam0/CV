import pandas as pd
import numpy as np
import re
import torch
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score
from transformers import AutoTokenizer, AutoModelForSequenceClassification, TrainingArguments, Trainer
from datasets import Dataset
import nlpaug.augmenter.word as naw
import warnings
warnings.filterwarnings("ignore")



# تحميل البيانات
df = pd.read_csv("dataaaaaaaaaaa.csv")
df.columns = df.columns.str.strip()

# تنظيف النصوص
def clean_text(text):
    if pd.isna(text): return ""
    text = str(text).lower()
    text = re.sub(r'[^a-z\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

df['RESUME'] = df['RESUME'].apply(clean_text)

# تصفية الكلاسات
min_samples = 3
valid = df['Category'].value_counts()[df['Category'].value_counts() >= min_samples].index
df = df[df['Category'].isin(valid)].copy()

print(f"عدد الكلاسات: {df['Category'].nunique()}")

# Label Encoding
le = LabelEncoder()
df['label'] = le.fit_transform(df['Category'])

# Data Augmentation
aug = naw.SynonymAug(aug_src='wordnet', aug_p=0.3)

augmented_texts = []
augmented_labels = []

for label in df['label'].unique():
    current = df[df['label'] == label].shape[0]
    if current < 60:
        needed = 60 - current
        samples = df[df['label'] == label]['RESUME'].sample(min(needed, current), replace=True)
        for text in samples:
            try:
                augmented_texts.append(aug.augment(text))
                augmented_labels.append(label)
            except:
                pass

if augmented_texts:
    aug_df = pd.DataFrame({'RESUME': augmented_texts, 'label': augmented_labels})
    df = pd.concat([df, aug_df], ignore_index=True)

print(f"عدد العينات بعد التوسيع: {len(df)}")

# تقسيم
train_df, test_df = train_test_split(df, test_size=0.15, random_state=42, stratify=df['label'])
train_dataset = Dataset.from_pandas(train_df[['RESUME', 'label']])
test_dataset = Dataset.from_pandas(test_df[['RESUME', 'label']])

# Tokenizer
model_name = "bert-base-uncased"
tokenizer = AutoTokenizer.from_pretrained(model_name)

def tokenize(examples):
    return tokenizer(examples['RESUME'], truncation=True, padding="max_length", max_length=384)

train_dataset = train_dataset.map(tokenize, batched=True)
test_dataset = test_dataset.map(tokenize, batched=True)
train_dataset = train_dataset.rename_column("label", "labels")
test_dataset = test_dataset.rename_column("label", "labels")
train_dataset.set_format("torch", columns=["input_ids", "attention_mask", "labels"])
test_dataset.set_format("torch", columns=["input_ids", "attention_mask", "labels"])

# Class Weights
from sklearn.utils.class_weight import compute_class_weight
class_weights = compute_class_weight('balanced', classes=np.unique(train_df['label']), y=train_df['label'])
class_weights = torch.tensor(class_weights, dtype=torch.float)

# Custom Trainer
class WeightedTrainer(Trainer):
    def compute_loss(self, model, inputs, return_outputs=False):
        labels = inputs.pop("labels")
        outputs = model(**inputs)
        logits = outputs.logits
        loss_fct = torch.nn.CrossEntropyLoss(weight=class_weights.to(logits.device))
        loss = loss_fct(logits.view(-1, model.num_labels), labels.view(-1))
        return (loss, outputs) if return_outputs else loss

# الموديل
model = AutoModelForSequenceClassification.from_pretrained(model_name, num_labels=len(le.classes_))

# نقل الموديل للـ GPU
model = model.to('cuda')

# التدريب
training_args = TrainingArguments(
    output_dir="./cv_bert_90plus",
    num_train_epochs=8,
    per_device_train_batch_size=12,
    per_device_eval_batch_size=12,
    gradient_accumulation_steps=2,
    warmup_steps=200,
    weight_decay=0.01,
    learning_rate=2e-5,
    evaluation_strategy="steps",
    eval_steps=200,
    save_strategy="steps",
    save_steps=200,
    load_best_model_at_end=True,
    metric_for_best_model="accuracy",
    fp16=True,
    report_to=[],
    lr_scheduler_type="cosine",
)

trainer = WeightedTrainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=test_dataset,
    compute_metrics=lambda p: {"accuracy": accuracy_score(p.label_ids, p.predictions.argmax(-1))},
)

print("بدء التدريب على GPU... (30-45 دقيقة)")
trainer.train()

# النتيجة
eval_result = trainer.evaluate()
accuracy = eval_result['eval_accuracy']
print(f"\nالدقة النهائية: {accuracy:.4f} ({accuracy*100:.2f}%)")

if accuracy >= 0.90:
    print("مبروك! وصلتي لـ 90%+")