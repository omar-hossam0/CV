"""
Test the TRAINED model (not hybrid) on your CV and jobs
"""

import pandas as pd
import re
from cv_job_matching_model import CVJobMatcher


def main():
    """
    Test the trained model on your CV and job descriptions
    """
    print("\n" + "="*80)
    print("Testing TRAINED Model on Your CV")
    print("="*80)

    # Load the custom trained model
    print("\nLoading your custom trained model...")
    matcher = CVJobMatcher()

    try:
        matcher.load_model('cv_job_matcher_custom.pkl')
        print("✅ Custom trained model loaded successfully!")
        use_hybrid = False  # Use trained model only
    except FileNotFoundError:
        print(
            "⚠️ Custom model not found. Please train first with: python train_on_my_jobs.py")
        return

    # Read CV
    print("\nReading CV...")
    with open('cv.txt', 'r', encoding='utf-8') as f:
        cv_text = f.read()
    print(f"✅ CV loaded ({len(cv_text)} characters)")

    # Read job descriptions
    print("\nReading job descriptions...")
    with open('Job_description.txt', 'r', encoding='utf-8') as f:
        content = f.read()

    # Parse jobs - handle both "1." and "1)" formats
    lines = content.split('\n')
    job_descriptions = []
    job_titles = []
    current_job = []

    for line in lines:
        if re.match(r'^\s*\d+[.\)]\s+', line):
            # Save previous job
            if current_job:
                job_text = '\n'.join(current_job).strip()
                if job_text:
                    first_line = current_job[0]
                    title = re.sub(r'^\s*\d+[.\)]\s*', '', first_line).strip()
                    job_titles.append(title)
                    job_descriptions.append(job_text)
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
            job_titles.append(title)
            job_descriptions.append(job_text)

    print(f"✅ Loaded {len(job_descriptions)} job descriptions")

    if len(job_descriptions) == 0:
        print("\n❌ ERROR: No job descriptions found!")
        return

    # Find matches using TRAINED MODEL ONLY
    print("\n🔍 Analyzing with TRAINED MODEL (no hybrid)...")
    print("   Using only the neural network you trained on your data")
    matches = matcher.find_top_matches(
        cv_text, job_descriptions, top_k=10, use_hybrid=False)

    # Display results
    print("\n" + "="*80)
    print("TOP 10 MATCHING JOBS (FROM TRAINED MODEL):")
    print("="*80)

    for i, match in enumerate(matches, 1):
        job_idx = match['job_index']
        score = match['similarity_score']

        # Determine match level
        if score >= 80:
            level = "Excellent Match"
            emoji = "🌟🌟🌟"
        elif score >= 70:
            level = "Very Good Match"
            emoji = "🌟🌟"
        elif score >= 60:
            level = "Good Match"
            emoji = "🌟"
        elif score >= 50:
            level = "Fair Match"
            emoji = "✓"
        else:
            level = "Low Match"
            emoji = "○"

        job_title = job_titles[job_idx]
        job_preview = job_descriptions[job_idx][:300].replace('\n', ' ')

        print(f"\n{i}. {job_title} {emoji}")
        print(f"   Match Score: {score:.2f}% ({level})")
        print(f"   Description Preview: {job_preview}...")
        print("-" * 80)

    # Summary
    print("\n" + "="*80)
    print("ANALYSIS COMPLETE!")
    print("="*80)

    if len(matches) > 0:
        print(f"\nTop Match: {job_titles[matches[0]['job_index']]}")
        print(f"Score: {matches[0]['similarity_score']:.2f}%")
        print("\n✅ These results are from the neural network trained on your specific CV and jobs!")
    else:
        print("\n⚠️ No matches found.")


if __name__ == "__main__":
    main()
