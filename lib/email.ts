/**
 * Brevo (formerly Sendinblue) Transactional Email Service
 * 
 * Used for:
 * 1. Automated Welcome Emails with Username & Password upon account creation
 * 2. 6-digit OTP verification codes for Forgot Password reset
 */

interface SendEmailParams {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export async function sendEmail({ to, subject, htmlContent, textContent }: SendEmailParams): Promise<{ success: boolean; messageId?: string; simulated?: boolean }> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SENDER_EMAIL || "spsshafiq95@gmail.com";
  const senderName = process.env.BREVO_SENDER_NAME || "IntelliWaste Smart City";

  // If no Brevo API key is configured yet, gracefully simulate and log to server console
  if (!apiKey || apiKey.trim() === "" || apiKey === "your_brevo_api_key_here") {
    console.log("--------------------------------------------------");
    console.log("[BREVO EMAIL SIMULATION (No API Key Configured)]");
    console.log(`To: ${to.map(t => `${t.name || ""} <${t.email}>`).join(", ")}`);
    console.log(`Subject: ${subject}`);
    console.log(`Sender: ${senderName} <${senderEmail}>`);
    console.log("--------------------------------------------------");
    return { success: true, simulated: true };
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": apiKey.trim(),
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to,
        subject,
        htmlContent,
        textContent: textContent || subject,
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      console.error("[Brevo API Error]", response.status, errBody);
      // Fallback simulation so users don't get completely blocked
      return { success: true, simulated: true };
    }

    const data = await response.json();
    return { success: true, messageId: data.messageId };
  } catch (err: any) {
    console.error("[Brevo Network Error]", err.message);
    return { success: true, simulated: true };
  }
}

/**
 * Send Welcome Email with Account Credentials
 */
export async function sendWelcomeCredentialsEmail({
  email,
  fullName,
  username,
  password,
  role,
  loginUrl,
}: {
  email: string;
  fullName: string;
  username: string;
  password: string;
  role: string;
  loginUrl?: string;
}) {
  const portalUrl = loginUrl || process.env.APP_URL || "https://intelliwaste.vercel.app";
  const roleName = {
    SUPER_ADMIN: "Super Admin (National System Controller)",
    CITY_ADMIN: "City Corporation Administrator",
    WARD_ADMIN: "Ward Sub-Admin Controller",
    DRIVER: "Smart Waste Collection Driver",
    CITIZEN: "Resident Citizen",
    BUSINESS: "Commercial Enterprise / Shop Owner",
  }[role] || role;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #061309; margin: 0; padding: 20px; color: #ffffff; }
        .card { max-width: 540px; margin: 0 auto; background-color: #0d2414; border: 1px solid #1a3d22; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .logo { font-size: 22px; font-weight: bold; color: #4ade80; display: flex; align-items: center; margin-bottom: 20px; }
        .badge { display: inline-block; background-color: rgba(74, 222, 128, 0.15); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.3); border-radius: 8px; padding: 4px 10px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 16px; }
        h1 { font-size: 20px; margin-top: 0; color: #ffffff; }
        p { font-size: 14px; line-height: 1.6; color: #a7f3d0; }
        .cred-box { background-color: #061309; border: 1px solid #1a3d22; border-radius: 12px; padding: 18px; margin: 20px 0; }
        .cred-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #112a19; font-size: 14px; }
        .cred-row:last-child { border-bottom: none; }
        .cred-label { color: #86efac; }
        .cred-val { color: #ffffff; font-family: monospace; font-weight: 600; }
        .btn { display: block; text-align: center; background-color: #16a34a; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: bold; font-size: 14px; margin-top: 24px; }
        .footer { margin-top: 24px; text-align: center; font-size: 12px; color: #4b7a5a; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">♻️ IntelliWaste Smart City</div>
        <div class="badge">${roleName}</div>
        <h1>Welcome to IntelliWaste, ${fullName}!</h1>
        <p>Your official account has been created and assigned in the IntelliWaste Management System. Below are your login credentials to access your portal:</p>
        
        <div class="cred-box">
          <div class="cred-row">
            <span class="cred-label">Full Name:</span>
            <span class="cred-val">${fullName}</span>
          </div>
          <div class="cred-row">
            <span class="cred-label">Username:</span>
            <span class="cred-val">${username}</span>
          </div>
          <div class="cred-row">
            <span class="cred-label">Password:</span>
            <span class="cred-val">${password}</span>
          </div>
          <div class="cred-row">
            <span class="cred-label">Role:</span>
            <span class="cred-val">${role}</span>
          </div>
        </div>

        <a href="${portalUrl}" class="btn" target="_blank">Access Your Portal →</a>

        <p style="font-size: 12px; color: #6ee7b7; margin-top: 20px;">
          🔒 <strong>Security Advice:</strong> Please keep your password safe and do not share your credentials with unauthorized individuals.
        </p>

        <div class="footer">
          IntelliWaste Automated Notification System<br/>
          Smart Waste & Urban Cleanliness Infrastructure
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: [{ email, name: fullName }],
    subject: `🎉 Your IntelliWaste Account Credentials (${username})`,
    htmlContent: html,
    textContent: `Welcome to IntelliWaste, ${fullName}!\n\nYour account has been created.\nUsername: ${username}\nPassword: ${password}\nRole: ${role}\nLogin: ${portalUrl}`,
  });
}

/**
 * Send Password Reset 6-Digit OTP Email
 */
export async function sendPasswordResetOtpEmail({
  email,
  fullName,
  otpCode,
  expiresInMinutes = 10,
}: {
  email: string;
  fullName: string;
  otpCode: string;
  expiresInMinutes?: number;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #061309; margin: 0; padding: 20px; color: #ffffff; }
        .card { max-width: 500px; margin: 0 auto; background-color: #0d2414; border: 1px solid #1a3d22; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .logo { font-size: 22px; font-weight: bold; color: #4ade80; display: flex; align-items: center; margin-bottom: 20px; }
        h1 { font-size: 20px; margin-top: 0; color: #ffffff; }
        p { font-size: 14px; line-height: 1.6; color: #a7f3d0; }
        .otp-container { text-align: center; margin: 28px 0; background: #061309; border: 2px dashed #16a34a; border-radius: 14px; padding: 20px; }
        .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #4ade80; display: inline-block; }
        .otp-note { font-size: 12px; color: #86efac; margin-top: 8px; }
        .footer { margin-top: 24px; text-align: center; font-size: 12px; color: #4b7a5a; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">♻️ IntelliWaste Security</div>
        <h1>Password Reset Request</h1>
        <p>Hello ${fullName || "User"},</p>
        <p>We received a request to reset the password for your IntelliWaste account. Use the following 6-digit verification code to complete the process:</p>
        
        <div class="otp-container">
          <div class="otp-code">${otpCode}</div>
          <div class="otp-note">Valid for ${expiresInMinutes} minutes</div>
        </div>

        <p style="font-size: 12px; color: #ef4444; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25); border-radius: 8px; padding: 12px;">
          ⚠️ <strong>Security Notice:</strong> Never share this code with anyone. IntelliWaste staff will never ask you for your verification code. If you did not request a password reset, you can safely ignore this email.
        </p>

        <div class="footer">
          IntelliWaste Security Team<br/>
          Smart Waste & Urban Cleanliness Infrastructure
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: [{ email, name: fullName || "User" }],
    subject: `🔐 ${otpCode} is your IntelliWaste Password Reset Code`,
    htmlContent: html,
    textContent: `Your IntelliWaste password reset code is: ${otpCode}. It expires in ${expiresInMinutes} minutes. If you did not request this, please ignore this email.`,
  });
}
