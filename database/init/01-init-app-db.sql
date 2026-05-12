CREATE DATABASE vid2tweet;
\c vid2tweet;
CREATE TABLE IF NOT EXISTS pipeline_results (
  id SERIAL PRIMARY KEY,
  youtube_url TEXT NOT NULL,
  tweet_text TEXT,
  tweet_id TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT NOW()
);
