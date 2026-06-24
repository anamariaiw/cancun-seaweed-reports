# Cancun Seaweed Reports

A community reporting app for Cancun and Riviera Maya beach conditions.

## Vercel environment variables

SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_BUCKET

Use this bucket name:

beach-photos

## Supabase SQL

Run this in Supabase SQL Editor:

```sql
create table if not exists beach_reports (
  id uuid primary key default gen_random_uuid(),
  beach_name text not null,
  report_date date not null,
  sargassum_level text not null check (sargassum_level in ('Clear', 'Almost Clear', 'Moderate', 'High')),
  notes text,
  photo_url text,
  created_at timestamptz not null default now()
);

create index if not exists beach_reports_created_at_idx
on beach_reports (created_at desc);

create index if not exists beach_reports_beach_name_idx
on beach_reports (beach_name);
```

## Supabase Storage

Create a public storage bucket named:

beach-photos
