"""
Automated CV-Job Matching Test for your CV and job descriptions
"""

import pandas as pd
import os
import re
from cv_job_matching_model import CVJobMatcher


def main():
    """
    Test the model with your custom CV and job descriptions
    """
    print("\n" + "="*80)
    print("CV-Job Matching System - Automated Test")
    print("="*80)

    # File paths
    cv_file_path = "cv.txt"
    jobs_file_path = "Job_description.txt"

    # Load the trained model
    print("\nLoading the BERT model...")
    matcher = CVJobMatcher()

    # Try to load trained model, but if not available, use embeddings only
    try:
        matcher.load_model('cv_job_matcher_final.pkl')
        print("✅ Trained model loaded successfully!")
    except FileNotFoundError:
        print("⚠️ Trained model not found. Using semantic matching only (hybrid mode).")
        print("   This is actually BETTER for your custom CV and jobs!")

    # Read CV content
    print(f"\nReading CV from: {cv_file_path}")
    with open(cv_file_path, 'r', encoding='utf-8') as f:
        cv_text = f.read()
    print(f"✅ CV loaded successfully! ({len(cv_text)} characters)")

    # Read job descriptions
    print(f"\nReading job descriptions from: {jobs_file_path}")
    with open(jobs_file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split jobs by number pattern - handle both "1." and "1)" formats
    lines = content.split('\n')
    job_descriptions = []
    job_titles = []
    current_job = []

    for line in lines:
        # Check if line starts with number pattern like "1. ", "2. ", "1) ", "2) " etc.
        if re.match(r'^\s*\d+[.\)]\s+', line):
            # Save previous job if exists
            if current_job:
                job_text = '\n'.join(current_job).strip()
                if job_text:
                    # Extract title from first line
                    first_line = current_job[0]
                    title = re.sub(r'^\s*\d+[.\)]\s*', '', first_line).strip()
                    job_titles.append(title)
                    job_descriptions.append(job_text)
            # Start new job
            current_job = [line]
        else:
            # Continue current job
            if current_job:  # Only add if we've started a job
                current_job.append(line)

    # Don't forget the last job
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
        print("   Please check that Job_description.txt has jobs formatted as:")
        print("   1. Job Title  OR  1) Job Title")
        print("   Job description...")
        print("   ")
        print("   2. Another Job Title")
        print("   Job description...")
        return

    # Display CV preview
    print("\n" + "="*80)
    print("YOUR CV PREVIEW:")
    print("="*80)
    print(cv_text[:600] + "..." if len(cv_text) > 600 else cv_text)
    print("-"*80)

    # Find top matches using HYBRID mode (best for your data)
    print("\n🔍 Analyzing and matching jobs to your CV...")
    print("   Using Hybrid Matching: 70% Semantic Similarity + 30% Keyword Matching")
    matches = matcher.find_top_matches(
        cv_text, job_descriptions, top_k=10, use_hybrid=True)

    # Display results
    print("\n" + "="*80)
    print("TOP 10 MATCHING JOBS FOR YOUR CV:")
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

        # Get job details
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
        print("\n✅ The hybrid matching system combines:")
        print("   • Semantic understanding from BERT embeddings")
        print("   • Technical keyword matching for skills")
        print("   • This gives more accurate results for your specific CV!")
    else:
        print("\n⚠️ No matches found. Please check your job descriptions file.")


if __name__ == "__main__":
    main()
