-- PF-005: one row per page view, append-only (FR-12). No column holds personal data: no IP address, no user-agent
-- string, and no full referrer URL (Non-Negotiable 3, SITE-006).
CREATE TABLE page_view (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    viewed_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    path          VARCHAR(255) NOT NULL CHECK (path LIKE '/%'),
    referrer_host VARCHAR(255),
    ref_tag       VARCHAR(64)  CHECK (ref_tag ~ '^[a-z0-9-]{1,64}$'),
    visitor_hash  VARCHAR(64)  NOT NULL CHECK (visitor_hash ~ '^[0-9a-f]{64}$'),
    device_type   VARCHAR(16)  NOT NULL CHECK (device_type IN ('DESKTOP', 'MOBILE', 'TABLET')),
    browser       VARCHAR(32)  NOT NULL
);

-- min(viewed_at) for the stats summary and future time-window queries.
CREATE INDEX idx_page_view_viewed_at ON page_view (viewed_at);

-- The owner's per-tag SQL in the Neon console (PF-005 D4).
CREATE INDEX idx_page_view_ref_tag ON page_view (ref_tag) WHERE ref_tag IS NOT NULL;
