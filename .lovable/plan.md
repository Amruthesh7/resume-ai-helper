

# AI Resume Analyzer - Project Plan

## Overview
A modern, vibrant web application that helps job seekers optimize their resumes for Applicant Tracking Systems (ATS). Users upload their PDF resumes and receive comprehensive AI-powered analysis with actionable suggestions.

---

## Core Features

### 1. User Authentication
- **Sign up / Login pages** with email and password
- Required authentication to access the analyzer
- Clean, modern auth forms matching the vibrant design

### 2. Dashboard
- Welcome screen showing recent analyses (up to 5 saved)
- Quick "Upload New Resume" action button
- Overview cards showing latest ATS scores at a glance
- Progress tracking visualization

### 3. Resume Upload & Analysis
- **PDF upload** with drag-and-drop support
- **Optional job description input** for targeted keyword analysis
- Loading animation while AI processes the resume
- Clear progress indicators

### 4. ATS Analysis Results
The AI will analyze resumes and provide:

- **ATS Compatibility Score** (0-100)
  - Visual gauge/meter showing the overall score
  - Score breakdown by category

- **Keyword Gap Analysis**
  - Missing keywords from job description
  - Industry-standard keywords to add
  - Keyword density recommendations

- **Formatting Suggestions**
  - Section structure feedback
  - Bullet point analysis
  - Length and readability assessment
  - ATS-friendly format recommendations

- **Language Improvements**
  - Stronger action verb suggestions
  - Passive voice detection
  - Quantification opportunities
  - Professional phrasing recommendations

### 5. Analysis History
- Save up to 5 recent resume analyses
- View past results and compare scores
- Delete old analyses when limit reached

---

## Design Style
- **Modern & vibrant** aesthetic
- Bold accent colors (gradients of purple, blue, teal)
- Clean typography with good contrast
- Smooth animations and transitions
- Card-based layouts with subtle shadows
- Mobile-responsive design

---

## Pages Structure
1. **Landing Page** - Hero section, features overview, CTA to sign up
2. **Login / Sign Up** - Authentication forms
3. **Dashboard** - Analysis history and quick actions
4. **Upload Resume** - File upload with optional job description
5. **Analysis Results** - Comprehensive feedback display

---

## Technical Approach
- **Backend**: Lovable Cloud with Supabase for authentication and data storage
- **AI Analysis**: Powered by Lovable AI for resume parsing and analysis
- **File Storage**: Supabase Storage for PDF uploads
- **Database**: Tables for users, analyses, and results

