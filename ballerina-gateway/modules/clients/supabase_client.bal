// ===========================================================================
// modules/clients/supabase_client.bal — Supabase HTTP client and header builders.
// ===========================================================================
import ballerina/http;
import equihire/gateway.config;

public final http:Client supabaseHttpClient = check new (config:supabaseUrl, {
    timeout: 30
});

public function getSupabaseHeaders() returns map<string|string[]> {
    return {
        "apikey": config:supabaseAnonKey,
        "Authorization": "Bearer " + config:supabaseAnonKey,
        "Content-Type": "application/json"
    };
}

public function getSupabaseServiceHeaders() returns map<string|string[]> {
    return {
        "apikey": config:supabaseServiceKey,
        "Authorization": "Bearer " + config:supabaseServiceKey,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    };
}

public function getSupabaseUpsertHeaders() returns map<string|string[]> {
    return {
        "apikey": config:supabaseServiceKey,
        "Authorization": "Bearer " + config:supabaseServiceKey,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=representation"
    };
}
