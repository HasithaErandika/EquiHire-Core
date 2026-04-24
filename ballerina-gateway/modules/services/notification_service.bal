// ===========================================================================
// modules/services/notification_service.bal — All email sending logic.
// ===========================================================================
import ballerina/email;
import ballerina/log;
import equihire/gateway.config;

final email:SmtpClient smtpClient = check new (
    host     = config:smtpHost,
    username = config:smtpUsername,
    password = config:smtpPassword,
    port     = config:smtpPort,
    security = email:START_TLS_AUTO
);

public function sendInvitationEmail(string toEmail, string candidateName,
                                    string jobTitle, string magicLink) returns error? {
    string htmlBody = buildInvitationHtml(candidateName, jobTitle, magicLink);
    check smtpClient->sendMessage({
        to: toEmail, subject: "Your Interview Invitation — " + jobTitle,
        htmlBody: htmlBody, 'from: config:smtpFromEmail
    });
    log:printInfo("Invitation email sent", toEmail = toEmail, jobTitle = jobTitle);
}

public function sendAcceptanceEmail(string toEmail, string candidateName,
                                    string jobTitle, string bodyContent) returns error? {
    string htmlBody = buildAcceptanceHtml(candidateName, jobTitle, bodyContent);
    check smtpClient->sendMessage({
        to: toEmail, subject: "Congratulations! Next Steps for " + jobTitle,
        htmlBody: htmlBody, 'from: config:smtpFromEmail
    });
    log:printInfo("Acceptance email sent", toEmail = toEmail, jobTitle = jobTitle);
}

public function sendRejectionEmail(string toEmail, string candidateName,
                                   string jobTitle, string aiGeneratedBody) returns error? {
    string htmlBody = buildRejectionHtml(candidateName, jobTitle, aiGeneratedBody);
    check smtpClient->sendMessage({
        to: toEmail, subject: "Update on your application: " + jobTitle,
        htmlBody: htmlBody, 'from: config:smtpFromEmail
    });
    log:printInfo("Rejection email sent", toEmail = toEmail, jobTitle = jobTitle);
}

// ---------------------------------------------------------------------------
// HTML Template Builders
// ---------------------------------------------------------------------------

function buildInvitationHtml(string candidateName, string jobTitle,
                             string magicLink) returns string {
    return string `<!DOCTYPE html><html><head><style>
body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;line-height:1.6;color:#333}
.container{max-width:600px;margin:0 auto;padding:20px}
.header{background:linear-gradient(135deg,#FF7300 0%,#E56700 100%);color:white;padding:30px;text-align:center;border-radius:8px 8px 0 0}
.content{background:#fff;padding:30px;border:1px solid #e0e0e0;border-top:none}
.button{display:inline-block;background:#FF7300;color:white;padding:14px 32px;text-decoration:none;border-radius:6px;font-weight:600;margin:20px 0}
.footer{text-align:center;padding:20px;color:#666;font-size:12px}
</style></head><body><div class="container">
<div class="header"><h1 style="margin:0;font-size:28px">🎯 EquiHire</h1>
<p style="margin:10px 0 0 0;opacity:.95">Blind Interview Platform</p></div>
<div class="content"><h2 style="color:#FF7300;margin-top:0">Hello ${candidateName},</h2>
<p>You have been invited to participate in a <strong>Blind Interview</strong> for: <strong>${jobTitle}</strong></p>
<p>EquiHire ensures a fair and unbiased process — your identity is protected.</p>
<div style="text-align:center"><a href="${magicLink}" class="button">Join Interview →</a></div>
<p style="font-size:13px;color:#666;margin-top:30px"><strong>Note:</strong> This link is valid for 7 days and can only be used once.</p>
<p style="font-size:12px;color:#999">If the button does not work, copy this link:<br>
<span style="color:#FF7300;word-break:break-all">${magicLink}</span></p></div>
<div class="footer"><p>Powered by <strong>EquiHire Core</strong> • Privacy Protected</p></div>
</div></body></html>`;
}

function buildAcceptanceHtml(string candidateName, string jobTitle, string bodyContent) returns string {
    return string `<!DOCTYPE html><html><head><style>
body{font-family:'Segoe UI',Tahoma,sans-serif;line-height:1.6;color:#333}
.container{max-width:600px;margin:0 auto;padding:20px}
.header{background:#10B981;color:white;padding:30px;text-align:center;border-radius:8px 8px 0 0}
.content{background:#fff;padding:30px;border:1px solid #e0e0e0;border-top:none}
</style></head><body><div class="container">
<div class="header"><h1 style="margin:0;font-size:28px">Congratulations! 🎉</h1></div>
<div class="content"><h2 style="color:#10B981;margin-top:0">Hello ${candidateName},</h2>
<p>We are thrilled to inform you that you have <strong>passed</strong> the technical evaluation for <strong>${jobTitle}</strong>.</p>
<div style="margin-top: 20px; margin-bottom: 20px;">${bodyContent}</div>
<p>Welcome to the next chapter!</p></div></div></body></html>`;
}

function buildRejectionHtml(string candidateName, string jobTitle, string aiGeneratedBody) returns string {
    return string `<!DOCTYPE html><html><head><style>
body{font-family:'Segoe UI',Tahoma,sans-serif;line-height:1.6;color:#333}
.container{max-width:600px;margin:0 auto;padding:20px;background:#fff}
.header{background:#f8f8f8;padding:30px;border-bottom:2px solid #f0f0f0;margin-bottom:20px;border-radius:8px 8px 0 0}
.content{padding:0 10px}
.ai-sig{margin-top:30px;font-size:.85em;color:#888;border-top:1px solid #eee;padding-top:10px}
</style></head><body><div class="container">
<div class="header"><h2 style="margin:0;color:#333">Update on your application for ${jobTitle}</h2></div>
<div class="content"><h3 style="color:#555;margin-bottom:16px">Hello ${candidateName},</h3>
${aiGeneratedBody}</div>
<div class="ai-sig"><p>This feedback was generated by our AI Evaluation System to provide actionable insights.</p></div>
</div></body></html>`;
}
