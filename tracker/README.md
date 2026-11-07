# Start page visit tracker

City-level visit log for `start.greatbrittongc.com` using the same Supabase project as Field.

## One-time setup

1. Open Supabase → **SQL Editor** for project `znkucrtehtyoatxfnozw`.
2. Run the migration:

`supabase/migrations/20261107000000_start_visits.sql`

(also copied to the Field repo migrations folder)

3. Deploy / push this site so `/tracker/` is live.
4. Open `https://start.greatbrittongc.com/tracker/` and sign in with a Field invite email (one-time code).

## What is stored

- Timestamp
- City / region / country (from a geo lookup; **IP is not saved**)
- Path and referrer

Anonymous visitors can insert only. Only signed-in Field users can read the log.
