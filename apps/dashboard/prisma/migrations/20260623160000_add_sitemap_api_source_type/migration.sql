-- Add missing SourceType enum values for site crawl and custom API sources.
ALTER TYPE "SourceType" ADD VALUE IF NOT EXISTS 'sitemap';
ALTER TYPE "SourceType" ADD VALUE IF NOT EXISTS 'api';
