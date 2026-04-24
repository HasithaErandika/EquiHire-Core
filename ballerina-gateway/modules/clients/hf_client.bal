// ===========================================================================
// modules/clients/hf_client.bal — HuggingFace connector initialization.
// ===========================================================================
import avi0ra/huggingface;
import equihire/gateway.config;

public final huggingface:Client hfClient = check new ({
    auth: {token: config:hfToken}
});
