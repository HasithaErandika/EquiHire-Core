// ===========================================================================
// config/config.bal — Single source of truth for all configurable values.
// ALL configurable variables live here. Never add them to any other file.
// Values are read from Config.toml (never committed to version control).
// ===========================================================================

// Supabase (PostgreSQL via REST API)
public configurable string supabaseUrl        = ?;
public configurable string supabaseAnonKey    = ?;
public configurable string supabaseServiceKey = ?;

// Google Gemini
public configurable string geminiApiKey       = ?;
public configurable string geminiBaseUrl      = "https://generativelanguage.googleapis.com/v1beta";

// HuggingFace
public configurable string hfToken            = ?;

// Cloudflare R2 (S3-compatible object storage)
public configurable string r2AccountId        = ?;
public configurable string r2BucketName       = ?;
public configurable string r2AccessKey        = ?;
public configurable string r2SecretKey        = ?;
public configurable string r2Region           = "auto";

// Frontend (for magic link generation)
public configurable string frontendUrl        = ?;

// SMTP (for invitation and decision emails)
public configurable string smtpHost           = ?;
public configurable int    smtpPort           = ?;
public configurable string smtpUsername       = ?;
public configurable string smtpPassword       = ?;
public configurable string smtpFromEmail      = ?;

// WSO2 Asgardeo (OIDC)
public configurable string asgardeoOrgUrl     = ?;
public configurable string asgardeoAudience   = ?;
public configurable string asgardeoJwksUrl    = ?;
