
# Represents a request to register a new organization and admin.
#
# + name - Name of the organization
# + industry - Industry sector
# + size - Organization size (e.g., "1-10", "11-50")
# + userEmail - Email of the admin user
# + userId - User ID from the identity provider
public type OrganizationRequest record {
    string name;
    string industry;
    string size;
    string userEmail;
    string userId;
};

# Represents an organization response.
#
# + id - Organization ID
# + name - Organization name
# + industry - Industry sector
# + size - Organization size
public type OrganizationResponse record {
    string id;
    string name;
    string industry;
    string size;
};

# Represents an invitation request.
#
# + candidateEmail - Email of the candidate
# + candidateName - Name of the candidate
# + jobTitle - Job title for the interview
# + interviewDate - Optional interview date (ISO 8601)
# + organizationId - Organization ID
# + recruiterId - Recruiter's User ID
public type InvitationRequest record {
    string candidateEmail;
    string candidateName;
    string jobTitle;
    string? interviewDate;
    string organizationId;
    string recruiterId;
};

# Represents an invitation response.
#
# + id - Invitation ID
# + token - Unique token for the link
# + magicLink - Full magic link URL
# + candidateEmail - Candidate's email
# + expiresAt - Expiration timestamp
public type InvitationResponse record {
    string id;
    string token;
    string magicLink;
    string candidateEmail;
    string expiresAt;
};

# Represents the token validation result.
#
# + valid - Whether the token is valid
# + candidateEmail - Candidate's email (if valid)
# + candidateName - Candidate's name (if valid)
# + jobTitle - Job title (if valid)
# + organizationId - Organization ID (if valid)
# + message - Error message (if invalid)
public type TokenValidationResponse record {
    boolean valid;
    string? candidateEmail?;
    string? candidateName?;
    string? jobTitle?;
    string? organizationId?;
    string? message?;
};

# Supabase connection configuration.
#
# + url - Supabase URL
# + key - Supabase API Key (Anon or Service Role)
public type SupabaseConfig record {
    string url;
    string key;
};

# R2 (S3) connection configuration.
#
# + accessKeyId - R2 Access Key ID
# + secretAccessKey - R2 Secret Access Key
# + accountId - Cloudflare Account ID
# + bucketName - Bucket Name
# + region - Region (auto)
public type R2Config record {
    string accessKeyId;
    string secretAccessKey;
    string accountId;
    string bucketName;
    string region;
};

# Response for Upload URL request.
#
# + uploadUrl - The presigned URL for PUT request
# + candidateId - The UUID generated for the candidate
# + objectKey - The storage key in R2
public type UploadUrlResponse record {
    string uploadUrl;
    string candidateId;
    string objectKey;
};

# Request to complete upload and trigger parsing.
#
# + candidateId - The candidate UUID
# + objectKey - The R2 object key
# + jobId - The Job ID
public type CompleteUploadRequest record {
    string candidateId;
    string objectKey;
    string jobId;
};

# Response for Reveal request.
#
# + url - The secure URL
# + status - Status of generation
public type RevealResponse record {
    string? url;
    string status;
};

# Request to create a new Job.
#
# + title - Job title
# + description - Job description
# + requiredSkills - List of required skills
# + screeningQuestions - List of screening questions
# + organizationId - Organization ID
# + recruiterId - Recruiter ID
public type JobRequest record {
    string title;
    string description;
    string[] requiredSkills;
    string[] screeningQuestions;
    string organizationId;
    string recruiterId;
};

# Response for Job creation.
#
# + id - Job ID
public type JobResponse record {
    string id;
};

