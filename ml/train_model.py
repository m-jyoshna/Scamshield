"""
SCAM JOB DETECTOR - ML Training Script
======================================
Dataset: EMSCAD (Kaggle) - fake_job_postings.csv
Run this on Google Colab (free GPU) or locally.

Steps:
1. Download dataset from Kaggle
2. Run: python train_model.py
3. Model saved as scam_model.pkl
"""

import pandas as pd
import numpy as np
import joblib
import re
import json
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline, FeatureUnion
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.metrics import classification_report, accuracy_score
import warnings
warnings.filterwarnings('ignore')


# ─── Red Flag Keywords (Rule-Based Layer) ────────────────────────────────────
RED_FLAG_KEYWORDS = [
    "work from home immediately", "no experience needed", "no experience required",
    "urgently hiring", "urgent hiring", "earn $", "make money fast",
    "wire transfer", "western union", "money gram", "gift card",
    "send money", "advance fee", "processing fee", "training fee",
    "provide your bank", "ssn required upfront", "social security",
    "click here to apply", "limited time offer", "act now",
    "guaranteed income", "guaranteed salary", "get rich",
    "$5000 per week", "$3000 per week", "$2000 per week",
    "no interview", "immediate start", "start today",
    "work anywhere", "be your own boss", "unlimited earning",
    "data entry clerk", "repackaging", "reshipping",
    "you have been selected", "congratulations you",
    "confidential company", "undisclosed company"
]


# ─── Custom Text Feature Extractor ───────────────────────────────────────────
class TextFeatureExtractor(BaseEstimator, TransformerMixin):
    def fit(self, X, y=None):
        return self

    def transform(self, X):
        features = []
        for text in X:
            text_lower = text.lower()
            feat = [
                len(text),                                          # text length
                len(text.split()),                                  # word count
                text.count('!'),                                    # exclamation marks
                text.count('$'),                                    # dollar signs
                text.count('?'),                                    # question marks
                sum(1 for w in text.split() if w.isupper()),       # ALL CAPS words
                sum(1 for kw in RED_FLAG_KEYWORDS if kw in text_lower),  # red flags
                1 if re.search(r'gmail|yahoo|hotmail', text_lower) else 0,  # generic email
                1 if re.search(r'\$\d+/?(per|a)?\s*(week|day|hour)', text_lower) else 0,  # suspicious salary
                1 if len(text) < 200 else 0,                       # very short posting
            ]
            features.append(feat)
        return np.array(features)


class TextSelector(BaseEstimator, TransformerMixin):
    def fit(self, X, y=None):
        return self
    def transform(self, X):
        return X


def clean_text(text):
    if pd.isna(text):
        return ""
    text = str(text)
    text = re.sub(r'<[^>]+>', ' ', text)       # remove HTML
    text = re.sub(r'http\S+', ' url ', text)   # replace URLs
    text = re.sub(r'\s+', ' ', text)           # normalize whitespace
    return text.strip().lower()


def train():
    print("📂 Loading dataset...")
    try:
        df = pd.read_csv('fake_job_postings.csv')
    except FileNotFoundError:
        print("❌ Dataset not found!")
        print("   Download from: https://www.kaggle.com/datasets/shivamb/real-or-fake-fake-jobposting-prediction")
        print("   Place 'fake_job_postings.csv' in this folder and re-run.")
        return

    print(f"   Total records: {len(df)}")
    print(f"   Fake postings: {df['fraudulent'].sum()} ({df['fraudulent'].mean()*100:.1f}%)")

    # Combine text fields
    text_cols = ['title', 'company_profile', 'description', 'requirements', 'benefits']
    df['combined_text'] = df[text_cols].fillna('').apply(
        lambda row: ' '.join([clean_text(v) for v in row]), axis=1
    )

    X = df['combined_text']
    y = df['fraudulent']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print("\n🤖 Training model (this takes ~2-3 minutes)...")

    # Feature union: TF-IDF + custom numeric features
    from sklearn.pipeline import FeatureUnion
    from sklearn.preprocessing import StandardScaler

    tfidf = TfidfVectorizer(
        max_features=15000,
        ngram_range=(1, 3),
        sublinear_tf=True,
        stop_words='english'
    )

    model = Pipeline([
        ('tfidf', tfidf),
        ('clf', GradientBoostingClassifier(
            n_estimators=200,
            max_depth=5,
            learning_rate=0.1,
            random_state=42
        ))
    ])

    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)

    print("\n📊 Model Performance:")
    print(f"   Accuracy: {accuracy_score(y_test, y_pred)*100:.2f}%")
    print("\n" + classification_report(y_test, y_pred, target_names=['Real', 'Fake']))

    # Save model
    joblib.dump(model, '../backend/scam_model.pkl')
    print("✅ Model saved to ../backend/scam_model.pkl")

    # Save red flag keywords for backend use
    with open('../backend/red_flags.json', 'w') as f:
        json.dump(RED_FLAG_KEYWORDS, f)
    print("✅ Red flags saved to ../backend/red_flags.json")


if __name__ == '__main__':
    train()
