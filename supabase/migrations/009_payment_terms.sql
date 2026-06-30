-- Payment terms (net days) per workspace, used to compute the invoice due
-- date printed on the PDF/print view and included in the CSV export.
ALTER TABLE workspace_config
  ADD COLUMN IF NOT EXISTS payment_terms_days integer NOT NULL DEFAULT 15;
