// ===========================================================================
// modules/utils/r2_util.bal — AWS SigV4 upload and presigned URL generation
// for Cloudflare R2 (S3-compatible).
// ===========================================================================
import ballerina/crypto;
import ballerina/http;
import ballerina/log;
import ballerina/time;
import equihire/gateway.types;

// Uploads bytes to R2 using AWS Signature V4.
public function uploadBytesToR2(types:R2Config cfg, byte[] content, string objectKey,
                                http:Client r2Client) returns error? {
    string host = string `${cfg.accountId}.r2.cloudflarestorage.com`;
    string amzDate = getAmzDateNow();
    string dateStamp = amzDate.substring(0, 8);

    byte[] contentHash = crypto:hashSha256(content);
    string payloadHash = contentHash.toBase16();

    string canonicalUri = "/" + cfg.bucketName + "/" + objectKey;
    string canonicalQueryString = "";
    string canonicalHeaders = "content-length:" + content.length().toString() + 
        "\ncontent-type:application/octet-stream\nhost:" + host +
        "\nx-amz-content-sha256:" + payloadHash + "\nx-amz-date:" + amzDate + "\n";
    string signedHeaders = "content-length;content-type;host;x-amz-content-sha256;x-amz-date";

    string canonicalRequest = "PUT\n" + canonicalUri + "\n" + canonicalQueryString + "\n" +
        canonicalHeaders + "\n" + signedHeaders + "\n" + payloadHash;

    string credentialScope = dateStamp + "/" + cfg.region + "/s3/aws4_request";
    byte[] crHash = crypto:hashSha256(canonicalRequest.toBytes());
    string stringToSign = "AWS4-HMAC-SHA256\n" + amzDate + "\n" + credentialScope + "\n" +
        crHash.toBase16();

    byte[] signingKey = check deriveSigningKey(cfg.secretAccessKey, dateStamp, cfg.region);
    byte[] sigBytes = check crypto:hmacSha256(stringToSign.toBytes(), signingKey);
    string signature = sigBytes.toBase16();

    string authHeader = "AWS4-HMAC-SHA256 Credential=" + cfg.accessKeyId + "/" +
        credentialScope + ", SignedHeaders=" + signedHeaders + ", Signature=" + signature;

    map<string|string[]> headers = {
        "Authorization": authHeader,
        "x-amz-date": amzDate,
        "x-amz-content-sha256": payloadHash,
        "Content-Type": "application/octet-stream",
        "Content-Length": content.length().toString(),
        "Host": host
    };

    string path = "/" + cfg.bucketName + "/" + objectKey;
    http:Response response = check r2Client->put(path, content, headers);
    if response.statusCode >= 300 {
        string|error body = response.getTextPayload();
        string errMsg = body is string ? body : "unknown error";
        log:printError("R2 upload failed", statusCode = response.statusCode,
                       objectKey = objectKey, detail = errMsg);
        return error("R2 upload failed with status " + response.statusCode.toString());
    }
    log:printInfo("R2 upload succeeded", objectKey = objectKey);
}

// Generates a presigned URL for GET/PUT operations on R2.
public function generateR2PresignedUrl(string accessKey, string secretKey,
                                        string accountId, string bucketName,
                                        string objectKey, string httpMethod,
                                        int expiresInSeconds) returns string|error {
    string host = string `${accountId}.r2.cloudflarestorage.com`;
    string region = "auto";
    string amzDate = getAmzDateNow();
    string dateStamp = amzDate.substring(0, 8);
    string credentialScope = dateStamp + "/" + region + "/s3/aws4_request";
    string credential = accessKey + "/" + credentialScope;

    // AWS SigV4 spec: the credential value MUST be percent-encoded in the
    // canonical query string (slashes → %2F). The URL uses the same encoded form,
    // so signature computation and the final URL stay consistent.
    string encodedCredential = re`/`.replaceAll(credential, "%2F");

    string signedHeaders = "host";

    string canonicalUri = "/" + bucketName + "/" + objectKey;

    // Build canonical query string using the ENCODED credential (required by SigV4)
    string canonicalQueryString = "X-Amz-Algorithm=AWS4-HMAC-SHA256"
        + "&X-Amz-Credential=" + encodedCredential
        + "&X-Amz-Date=" + amzDate
        + "&X-Amz-Expires=" + expiresInSeconds.toString()
        + "&X-Amz-SignedHeaders=" + signedHeaders;

    string canonicalHeaders = "host:" + host + "\n";

    string canonicalRequest = httpMethod + "\n" + canonicalUri + "\n" +
        canonicalQueryString + "\n" + canonicalHeaders + "\n" + signedHeaders + "\nUNSIGNED-PAYLOAD";

    byte[] crHash = crypto:hashSha256(canonicalRequest.toBytes());
    string stringToSign = "AWS4-HMAC-SHA256\n" + amzDate + "\n" + credentialScope + "\n" +
        crHash.toBase16();

    byte[] signingKey = check deriveSigningKey(secretKey, dateStamp, region);
    byte[] sigBytes = check crypto:hmacSha256(stringToSign.toBytes(), signingKey);
    string signature = sigBytes.toBase16();

    // Final URL uses the encoded credential (same as canonical query string)
    return "https://" + host + canonicalUri + "?" + canonicalQueryString +
        "&X-Amz-Signature=" + signature;
}


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getAmzDateNow() returns string {
    time:Utc now = time:utcNow();
    string iso = time:utcToString(now);
    // Format: YYYYMMDDTHHMMSSZ
    string cleaned = iso.substring(0, 4) + iso.substring(5, 7) + iso.substring(8, 10)
        + "T" + iso.substring(11, 13) + iso.substring(14, 16) + iso.substring(17, 19) + "Z";
    return cleaned;
}

function deriveSigningKey(string secretKey, string dateStamp,
                          string region) returns byte[]|error {
    byte[] kDate    = check crypto:hmacSha256(dateStamp.toBytes(), ("AWS4" + secretKey).toBytes());
    byte[] kRegion  = check crypto:hmacSha256(region.toBytes(), kDate);
    byte[] kService = check crypto:hmacSha256("s3".toBytes(), kRegion);
    byte[] kSigning = check crypto:hmacSha256("aws4_request".toBytes(), kService);
    return kSigning;
}
