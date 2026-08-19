CREATE TABLE IF NOT EXISTS place_search_cache (
  cache_key TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL
) STRICT;

CREATE INDEX IF NOT EXISTS idx_place_search_cache_expiry
  ON place_search_cache(expires_at);