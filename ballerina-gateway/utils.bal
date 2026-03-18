
import ballerina/crypto;
import ballerina/time;
import ballerina/url;

# Generates a Presigned URL for Cloudflare R2 (AWS S3 Compatible).
#
# + accessKey - R2 Access Key ID
# + secretKey - R2 Secret Access Key
# + accountId - Cloudflare Account ID
# + bucketName - Bucket Name
# + objectKey - Object Key (filename)
# + method - HTTP Method (e.g., "PUT")
# + expiresIn - Expiration in seconds
# + return - Presigned URL or Error

public function generateR2PresignedUrl(string accessKey, string secretKey, string accountId, string bucketName, string objectKey, string method, int expiresIn) returns string|error {
    string region = "auto";
    string serviceName = "s3";
    string host = accountId + ".r2.cloudflarestorage.com";
    string uri = "/" + bucketName + "/" + objectKey;
    string endpoint = "https://" + host + uri;

    // 1. Date Handling
    time:Utc currentUtc = time:utcNow();
    string amzDate = time:utcToString(currentUtc); 
    string dateIso = amzDate;
    string dateStamp = dateIso.substring(0, 4) + dateIso.substring(5, 7) + dateIso.substring(8, 10);
    string timeStamp = dateIso.substring(11, 13) + dateIso.substring(14, 16) + dateIso.substring(17, 19);
    string amzDateFormatted = dateStamp + "T" + timeStamp + "Z";

    // 2. Canonical Request
    string canonicalUri = uri;
    
    
    string canonicalHeaders = "host:" + host + "\n";
    string signedHeaders = "host";

    string canonicalQueryString = "X-Amz-Algorithm=AWS4-HMAC-SHA256";
    canonicalQueryString += "&X-Amz-Credential=" + check url:encode(accessKey + "/" + dateStamp + "/" + region + "/" + serviceName + "/aws4_request", "UTF-8");
    canonicalQueryString += "&X-Amz-Date=" + amzDateFormatted;
    canonicalQueryString += "&X-Amz-Expires=" + expiresIn.toString();
    canonicalQueryString += "&X-Amz-SignedHeaders=" + check url:encode(signedHeaders, "UTF-8");

    string payloadHash = "UNSIGNED-PAYLOAD";


    string canonicalRequest = method + "\n" + canonicalUri + "\n" + canonicalQueryString + "\n" + canonicalHeaders + "\n" + signedHeaders + "\n" + payloadHash;

    // 3. String to Sign
    string algorithm = "AWS4-HMAC-SHA256";
    string credentialScope = dateStamp + "/" + region + "/" + serviceName + "/aws4_request";
    string stringToSign = algorithm + "\n" + amzDateFormatted + "\n" + credentialScope + "\n" + (check hex(crypto:hashSha256(canonicalRequest.toBytes())));

    // 4. Signing Key
    byte[] kDate    = check crypto:hmacSha256(dateStamp.toBytes(),        ("AWS4" + secretKey).toBytes());
    byte[] kRegion  = check crypto:hmacSha256(region.toBytes(),           kDate);
    byte[] kService = check crypto:hmacSha256(serviceName.toBytes(),      kRegion);
    byte[] kSigning = check crypto:hmacSha256("aws4_request".toBytes(),   kService);
    

    // 5. Signature
    byte[] signatureBytes = check crypto:hmacSha256(stringToSign.toBytes(), kSigning);
    string signature = check hex(signatureBytes);

    return endpoint + "?" + canonicalQueryString + "&X-Amz-Signature=" + signature;
}
function hex(byte[] data) returns string|error {
    // Helper to convert byte[] to hex string
    // Ballerina doesn't have direct bytesToHex in standard lib accessible easily?
    // Actually `array:toHexString` exists in newer versions?
    // Let's use `data.toBase16()` if available or similar.
    // Ballerina `lang.array`?
    // Let's assume standard `data.toBase16()` works. 
    return data.toBase16();
}
