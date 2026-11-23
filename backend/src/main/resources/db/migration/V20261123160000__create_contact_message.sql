-- PF-006: the contact outbox. A message is stored PENDING (or SPAM when the honeypot is filled), emailed with no
-- transaction open, then marked SENT or FAILED; ContactRetryJob resends FAILED rows below the attempt limit.
-- name, email, and message are a real visitor's personal data, sent only to the owner and never logged
-- (Non-Negotiable 9). No column holds an IP address, a user agent, or a referrer (Non-Negotiable 3).
CREATE TABLE contact_message (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
    name                VARCHAR(100)  NOT NULL,
    email               VARCHAR(254)  NOT NULL,
    message             VARCHAR(2000) NOT NULL,
    status              VARCHAR(16)   NOT NULL DEFAULT 'PENDING'
                            CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'SPAM')),
    attempts            INT           NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    last_error          VARCHAR(64), -- a reason code such as HTTP_503, never provider text (PF-006 D8)
    provider_message_id VARCHAR(100),
    sender_hash         VARCHAR(64)   NOT NULL CHECK (sender_hash ~ '^[0-9a-f]{64}$'),
    version             BIGINT        NOT NULL DEFAULT 0
);

-- The retry job's candidates (status = 'FAILED' ... ORDER BY id) and the owner's stuck-row SQL; sent and spam rows
-- stay out of it, so it stays small.
CREATE INDEX idx_contact_message_unsent ON contact_message (status, id) WHERE status IN ('PENDING', 'FAILED');
