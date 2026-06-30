// Fallback defaults used before workspace config loads or if the user
// has not yet saved their settings. The live values come from WorkspaceContext.
export const DEFAULTS = {
  HOURLY_RATE_USD:    7,
  WEEKLY_HOUR_CAP:    40,
  INVOICE_CYCLE_DAYS: 14,
  PAYMENT_TERMS_DAYS: 15,
  WEEK_STARTS_ON:     1 as const,  // Monday
  WORKSPACE_NAME:     "My Workspace",
  CONTRACTOR_NAME:    "",
  CLIENT_NAME:        "",
} as const;

// Re-exported as named constants for backward compatibility with existing imports.
// New code should use useWorkspace() instead.
export const HOURLY_RATE_USD    = DEFAULTS.HOURLY_RATE_USD;
export const WEEKLY_HOUR_CAP    = DEFAULTS.WEEKLY_HOUR_CAP;
export const INVOICE_CYCLE_DAYS = DEFAULTS.INVOICE_CYCLE_DAYS;
export const WEEK_STARTS_ON     = DEFAULTS.WEEK_STARTS_ON;
