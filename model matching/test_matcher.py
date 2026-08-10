"""
CV-Job Matching Model Testing
"""

import pandas as pd
import os
from cv_job_matching_model import CVJobMatcher


def test_custom_cv_with_jobs():
    """
    Test the model with your custom CV and job descriptions
    """
    print("\n" + "="*80)
    print("CV-Job Matching System")
    print("="*80)
    
    # Load the trained model
    print("\nLoading the trained model...")
    matcher = CVJobMatcher()
    
    try:
        matcher.load_model('cv_job_matcher_final.pkl')
        print("Model loaded successfully!")
    except FileNotFoundError:
        print("\nERROR: Model not found!")
        print("Please train the model first by running: python cv_job_matching_model.py")
        return
    
    # Get CV file path from user
    print("\n" + "-"*80)
    cv_file_path = input("Enter the path to your CV file (.txt or .csv): ").strip()
    
    if not os.path.exists(cv_file_path):
        print(f"ERROR: CV file not found at: {cv_file_path}")
        return
    
    # Read CV content
    try:
        if cv_file_path.endswith('.txt'):
            with open(cv_file_path, 'r', encoding='utf-8') as f:
                cv_text = f.read()
        elif cv_file_path.endswith('.csv'):
            cv_df = pd.read_csv(cv_file_path)
            # Assume first column or 'Resume' column contains CV text
            if 'Resume' in cv_df.columns:
                cv_text = cv_df['Resume'].iloc[0]
            else:
                cv_text = cv_df.iloc[0, 0]
        else:
            print("ERROR: CV file must be .txt or .csv")
            return
        
        print(f"CV loaded successfully! ({len(cv_text)} characters)")
    except Exception as e:
        print(f"ERROR reading CV file: {e}")
        return
    
    # Get job descriptions file path from user
    print("\n" + "-"*80)
    jobs_file_path = input("Enter the path to job descriptions file (.txt or .csv): ").strip()
    
    if not os.path.exists(jobs_file_path):
        print(f"ERROR: Job descriptions file not found at: {jobs_file_path}")
        return
    
    # Read job descriptions
    try:
        if jobs_file_path.endswith('.txt'):
            with open(jobs_file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Split jobs by number pattern (1., 2., 3., etc.)
            import re
            # Find all job sections starting with number followed by dot
            job_sections = re.split(r'\n(?=\d+\.\s)', content)
            job_descriptions = []
            job_titles = []
            
            for section in job_sections:
                section = section.strip()
                if section and re.match(r'^\d+\.', section):
                    # Extract job title (first line after number)
                    lines = section.split('\n')
                    if len(lines) > 0:
                        # Get title (remove number prefix)
                        title_line = lines[0]
                        title = re.sub(r'^\d+\.\s*', '', title_line).strip()
                        
                        # Get full description (everything in this section)
                        full_desc = section.strip()
                        
                        job_titles.append(title)
                        job_descriptions.append(full_desc)
            
            print(f"Job descriptions loaded successfully! ({len(job_descriptions)} jobs)")
            
        elif jobs_file_path.endswith('.csv'):
            jobs_df = pd.read_csv(jobs_file_path)
            job_titles = []
            job_descriptions = []
            
            # Assume there's a column with job descriptions
            if 'job_description' in jobs_df.columns:
                job_descriptions = jobs_df['job_description'].tolist()
            elif 'Job Description' in jobs_df.columns:
                job_descriptions = jobs_df['Job Description'].tolist()
            elif 'description' in jobs_df.columns:
                job_descriptions = jobs_df['description'].tolist()
            else:
                # Combine all text columns
                job_descriptions = jobs_df.apply(lambda row: ' '.join(row.astype(str)), axis=1).tolist()
            
            # Try to extract titles
            if 'title' in jobs_df.columns:
                job_titles = jobs_df['title'].tolist()
            elif 'Job Title' in jobs_df.columns:
                job_titles = jobs_df['Job Title'].tolist()
            else:
                job_titles = [f"Job {i+1}" for i in range(len(job_descriptions))]
            
            print(f"Job descriptions loaded successfully! ({len(job_descriptions)} jobs)")
        else:
            print("ERROR: Job file must be .txt or .csv")
            return
        
        if len(job_descriptions) == 0:
            print("ERROR: No jobs found in the file!")
            return
            
    except Exception as e:
        print(f"ERROR reading job descriptions file: {e}")
        return
    
    # Display CV preview
    print("\n" + "="*80)
    print("Your CV Preview:")
    print("="*80)
    print(cv_text[:500] + "..." if len(cv_text) > 500 else cv_text)
    print("-"*80)
    
    # Display CV preview
    print("\n" + "="*80)
    print("Your CV Preview:")
    print("="*80)
    print(cv_text[:500] + "..." if len(cv_text) > 500 else cv_text)
    print("-"*80)
    
    # Find top matches
    print("\nSearching for the best 10 matching jobs...")
    matches = matcher.find_top_matches(cv_text, job_descriptions, top_k=10)
    
    # Display results
    print("\n" + "="*80)
    print("TOP 10 MATCHING JOBS:")
    print("="*80)
    
    for i, match in enumerate(matches, 1):
        job_idx = match['job_index']
        score = match['similarity_score']
        
        # Determine match level
        if score >= 85:
            level = "Excellent"
            emoji = "***"
        elif score >= 75:
            level = "Very Good"
            emoji = "**"
        elif score >= 65:
            level = "Good"
            emoji = "*"
        else:
            level = "Fair"
            emoji = ""
        
        # Get job title if available
        if job_titles and job_idx < len(job_titles):
            job_title = job_titles[job_idx]
            print(f"\n{i}. {job_title} {emoji}")
        else:
            print(f"\n{i}. Job {job_idx + 1} {emoji}")
        
        print(f"   Match Score: {score:.2f}% ({level})")
        print(f"   Description Preview: {job_descriptions[job_idx][:250]}...")
        print("-" * 80)
    
    print("\nTest completed successfully!")


if __name__ == "__main__":
    import sys
    
    print("\n" + "="*80)
    print("CV-Job Matching Test System")
    print("="*80)
    print("\nThis program will:")
    print("1. Load your CV from a file")
    print("2. Load 20 job descriptions from a file")
    print("3. Find the top 10 matching jobs for your CV")
    print("="*80)
    
    test_custom_cv_with_jobs()
