"""
Training Script for Your Custom CV and Job Descriptions
This will train the model specifically on your data for better accuracy
"""

import pandas as pd
import re
from cv_job_matching_model import CVJobMatcher


def prepare_training_data():
    """
    Prepare training data from your CV and job descriptions
    """
    print("\n" + "="*80)
    print("Preparing Training Data from Your CV and Jobs")
    print("="*80)

    # Read CV
    print("\nReading CV...")
    with open('cv.txt', 'r', encoding='utf-8') as f:
        cv_text = f.read()
    print(f"✅ CV loaded ({len(cv_text)} characters)")

    # Read Job Descriptions
    print("\nReading job descriptions...")
    with open('Job_description.txt', 'r', encoding='utf-8') as f:
        content = f.read()

    # Parse jobs - handle both "1." and "1)" formats
    lines = content.split('\n')
    job_data = []
    current_job = []

    for line in lines:
        if re.match(r'^\s*\d+[.\)]\s+', line):
            # Save previous job
            if current_job:
                job_text = '\n'.join(current_job).strip()
                if job_text:
                    first_line = current_job[0]
                    title = re.sub(r'^\s*\d+[.\)]\s*', '', first_line).strip()
                    job_data.append({
                        'Job Title': title,
                        'job_description_clean': job_text
                    })
            current_job = [line]
        else:
            if current_job:
                current_job.append(line)

    # Last job
    if current_job:
        job_text = '\n'.join(current_job).strip()
        if job_text:
            first_line = current_job[0]
            title = re.sub(r'^\s*\d+[.\)]\s*', '', first_line).strip()
            job_data.append({
                'Job Title': title,
                'job_description_clean': job_text
            })

    print(f"✅ Parsed {len(job_data)} job descriptions")

    # Create training samples
    print("\nCreating training samples...")
    training_samples = []

    # Define which jobs match your CV profile (Backend/Full-stack Developer)
    # Based on your skills: Node.js, Express, MongoDB, Python, APIs, Computer Vision
    matching_job_keywords = [
        'back-end developer', 'backend developer',
        'full stack developer', 'full-stack',
        'api integration', 'node.js',
        'machine learning', 'data analyst',
        'devops', 'database administrator'
    ]

    non_matching_keywords = [
        'graphic designer', 'accountant', 'hr coordinator',
        'game developer', 'digital marketing', 'embedded systems'
    ]

    # Create positive samples (matching jobs)
    for job in job_data:
        title_lower = job['Job Title'].lower()
        is_match = any(
            keyword in title_lower for keyword in matching_job_keywords)

        if is_match:
            # This job matches your profile
            for _ in range(3):  # Add multiple samples for better learning
                training_samples.append({
                    'Resume': cv_text,
                    'job': f"{job['Job Title']} {job['job_description_clean']}",
                    'label': 1,
                    'Category': 'Backend Developer'
                })

    # Create negative samples (non-matching jobs)
    for job in job_data:
        title_lower = job['Job Title'].lower()
        is_non_match = any(
            keyword in title_lower for keyword in non_matching_keywords)

        if is_non_match:
            # This job does NOT match your profile
            for _ in range(2):
                training_samples.append({
                    'Resume': cv_text,
                    'job': f"{job['Job Title']} {job['job_description_clean']}",
                    'label': 0,
                    'Category': 'Other'
                })

    # Create semi-matching samples (partial matches)
    for job in job_data:
        title_lower = job['Job Title'].lower()
        is_match = any(
            keyword in title_lower for keyword in matching_job_keywords)
        is_non_match = any(
            keyword in title_lower for keyword in non_matching_keywords)

        if not is_match and not is_non_match:
            # Semi-relevant job
            training_samples.append({
                'Resume': cv_text,
                'job': f"{job['Job Title']} {job['job_description_clean']}",
                'label': 0,  # Treat as non-match for binary classification
                'Category': 'Semi-relevant'
            })

    df = pd.DataFrame(training_samples)

    print(f"\n✅ Created {len(df)} training samples:")
    print(f"   - Positive samples (matches): {sum(df['label'] == 1)}")
    print(f"   - Negative samples (non-matches): {sum(df['label'] == 0)}")

    # Save training data
    df.to_csv('my_training_data.csv', index=False)
    print("\n✅ Training data saved to: my_training_data.csv")

    # Save jobs data
    jobs_df = pd.DataFrame(job_data)
    jobs_df.to_csv('my_jobs.csv', index=False)
    print("✅ Jobs data saved to: my_jobs.csv")

    return df, jobs_df


def train_custom_model():
    """
    Train the model on your custom data
    """
    print("\n" + "="*80)
    print("Training Model on Your CV and Job Descriptions")
    print("="*80)

    # Prepare data
    train_df, jobs_df = prepare_training_data()

    # Initialize matcher
    print("\n🚀 Initializing CV-Job Matcher...")
    matcher = CVJobMatcher(model_name='all-MiniLM-L6-v2')

    # Prepare embeddings
    print("\n🔄 Preparing embeddings...")
    cv_embeddings = matcher.prepare_embeddings(train_df['Resume'].tolist())
    job_embeddings = matcher.prepare_embeddings(train_df['job'].tolist())

    # Train with custom logic
    from sklearn.model_selection import train_test_split
    from torch.utils.data import DataLoader
    import torch
    import torch.nn as nn
    from cv_job_matching_model import CVJobDataset, SiameseMatchingNetwork

    # Split data
    X_cv_train, X_cv_val, X_job_train, X_job_val, y_train, y_val = train_test_split(
        cv_embeddings, job_embeddings, train_df['label'].values,
        test_size=0.2, random_state=42, stratify=train_df['label']
    )

    print(f"\n📊 Data split:")
    print(f"   - Training: {len(y_train)} samples")
    print(f"   - Validation: {len(y_val)} samples")

    # Create datasets
    train_dataset = CVJobDataset(X_cv_train, X_job_train, y_train)
    val_dataset = CVJobDataset(X_cv_val, X_job_val, y_val)

    train_loader = DataLoader(train_dataset, batch_size=8, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=8)

    # Initialize model
    print("\n🏗️ Building neural network...")
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = SiameseMatchingNetwork(
        embedding_dim=matcher.embedding_dim,
        hidden_dims=[512, 256, 128],
        dropout=0.3
    ).to(device)

    # Training setup
    criterion = nn.BCELoss()
    optimizer = torch.optim.AdamW(
        model.parameters(), lr=0.001, weight_decay=0.01)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode='max', factor=0.5, patience=5)

    # Training loop
    print("\n" + "="*80)
    print("🚀 Starting Training...")
    print("="*80)

    best_val_acc = 0
    epochs = 100  # More epochs for small dataset

    for epoch in range(epochs):
        # Training
        model.train()
        train_loss = 0
        train_correct = 0
        train_total = 0

        for batch in train_loader:
            cv_emb = batch['cv_embedding'].to(device)
            job_emb = batch['job_embedding'].to(device)
            labels = batch['label'].float().to(device)

            optimizer.zero_grad()
            outputs = model(cv_emb, job_emb)
            loss = criterion(outputs, labels)
            loss.backward()

            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()

            train_loss += loss.item()
            predictions = (outputs > 0.5).float()
            train_correct += (predictions == labels).sum().item()
            train_total += labels.size(0)

        train_acc = 100 * train_correct / train_total
        avg_train_loss = train_loss / len(train_loader)

        # Validation
        model.eval()
        val_loss = 0
        val_correct = 0
        val_total = 0

        with torch.no_grad():
            for batch in val_loader:
                cv_emb = batch['cv_embedding'].to(device)
                job_emb = batch['job_embedding'].to(device)
                labels = batch['label'].float().to(device)

                outputs = model(cv_emb, job_emb)
                loss = criterion(outputs, labels)

                val_loss += loss.item()
                predictions = (outputs > 0.5).float()
                val_correct += (predictions == labels).sum().item()
                val_total += labels.size(0)

        val_acc = 100 * val_correct / val_total
        avg_val_loss = val_loss / len(val_loader)

        # Print progress every 10 epochs
        if (epoch + 1) % 10 == 0:
            print(f"Epoch [{epoch+1}/{epochs}]")
            print(
                f"  Train Loss: {avg_train_loss:.4f} | Train Acc: {train_acc:.2f}%")
            print(f"  Val Loss: {avg_val_loss:.4f} | Val Acc: {val_acc:.2f}%")
            print("-" * 80)

        # Save best model
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), 'best_matching_model_custom.pth')
            if (epoch + 1) % 10 == 0:
                print(
                    f"✅ New best model saved! Validation Accuracy: {val_acc:.2f}%\n")

        scheduler.step(val_acc)

    # Save final model
    matcher.matching_model = model
    matcher.save_model('cv_job_matcher_custom.pkl')

    print("\n" + "="*80)
    print("✅ Training Complete!")
    print("="*80)
    print(f"🏆 Best Validation Accuracy: {best_val_acc:.2f}%")
    print(f"📁 Model saved to: cv_job_matcher_custom.pkl")

    return matcher


if __name__ == "__main__":
    print("\n" + "="*80)
    print("Custom Model Training System")
    print("="*80)
    print("\nThis will train a model specifically for your CV and job descriptions.")
    print("The model will learn which jobs match your profile best.")

    # Train the model
    matcher = train_custom_model()

    print("\n✅ Training complete! You can now test with: python test_trained_model.py")
