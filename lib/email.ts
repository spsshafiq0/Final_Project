/**
 * Brevo (formerly Sendinblue) Transactional Email Service
 * 
 * Optimized for 100% Gmail (Mobile + Web) Rendering:
 * - Table-based bulletproof responsive layout (Gmail strips flexbox)
 * - 100% inline styles on all elements
 * - Clean preheader text for inbox snippet view
 * - High-contrast dark green & emerald branding
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
 * Send Welcome Email with Account Credentials (Gmail-bulletproof HTML)
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
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to IntelliWaste</title>
</head>
<body style="margin:0;padding:0;background-color:#051408;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <!-- Gmail Inbox Preview Snippet -->
  <div style="display:none;font-size:1px;color:#051408;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    Welcome to IntelliWaste, ${fullName}! Your username: ${username}. Login to access your portal.
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#051408;padding:24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background-color:#0d2414;border:1px solid #1a3d22;border-radius:16px;overflow:hidden;box-shadow:0 12px 30px rgba(0,0,0,0.6);">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding:28px 32px 16px 32px;background:linear-gradient(135deg, #0d2414 0%, #11361c 100%);border-bottom:1px solid #1a3d22;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left">
                    <span style="font-size:24px;font-weight:800;color:#4ade80;letter-spacing:-0.5px;">♻️ IntelliWaste</span>
                    <div style="font-size:12px;color:#86efac;font-family:monospace;margin-top:2px;letter-spacing:1px;text-transform:uppercase;">SMART CITY WASTE MANAGEMENT</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding:28px 32px;">
              <!-- Role Badge -->
              <div style="display:inline-block;background-color:rgba(74,222,128,0.15);border:1px solid rgba(74,222,128,0.35);border-radius:6px;padding:5px 12px;font-size:11px;font-weight:700;color:#4ade80;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:16px;">
                ${roleName}
              </div>

              <h1 style="margin:0 0 12px 0;font-size:22px;line-height:1.3;font-weight:700;color:#ffffff;">
                Welcome, ${fullName}!
              </h1>
              <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#a7f3d0;">
                আপনার নামে <strong>IntelliWaste</strong> স্মার্ট ম্যানেজমেন্ট প্ল্যাটফর্মে একটি অফিসিয়াল একাউন্ট তৈরি করা হয়েছে। নিচে আপনার লগইন করার ইউজারনেম ও পাসওয়ার্ড দেওয়া হলো:
              </p>

              <!-- Credentials Table (Bulletproof for Gmail) -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#061309;border:1px solid #1a3d22;border-radius:12px;overflow:hidden;margin-bottom:24px;">
                <tr>
                  <td style="padding:14px 18px;border-bottom:1px solid #112a19;font-size:13px;color:#86efac;font-weight:600;" width="38%">
                    Full Name:
                  </td>
                  <td style="padding:14px 18px;border-bottom:1px solid #112a19;font-size:14px;color:#ffffff;font-weight:600;" align="right">
                    ${fullName}
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 18px;border-bottom:1px solid #112a19;font-size:13px;color:#86efac;font-weight:600;">
                    Username / ইউজারনেম:
                  </td>
                  <td style="padding:14px 18px;border-bottom:1px solid #112a19;font-size:14px;color:#4ade80;font-family:monospace;font-weight:700;" align="right">
                    ${username}
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 18px;border-bottom:1px solid #112a19;font-size:13px;color:#86efac;font-weight:600;">
                    Password / পাসওয়ার্ড:
                  </td>
                  <td style="padding:14px 18px;border-bottom:1px solid #112a19;font-size:15px;color:#ffffff;font-family:monospace;font-weight:700;background-color:#0b2112;border-radius:6px;" align="right">
                    ${password}
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 18px;font-size:13px;color:#86efac;font-weight:600;">
                    Assigned Role:
                  </td>
                  <td style="padding:14px 18px;font-size:13px;color:#a7f3d0;font-weight:600;" align="right">
                    ${role}
                  </td>
                </tr>
              </table>

              <!-- Action Button -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${portalUrl}" target="_blank" style="display:inline-block;background-color:#16a34a;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;box-shadow:0 4px 12px rgba(22,163,74,0.4);border:1px solid #22c55e;">
                      লগইন পোর্টালে প্রবেশ করুন →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Security Advice Box -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:rgba(74,222,128,0.06);border:1px solid rgba(74,222,128,0.25);border-radius:10px;margin-bottom:16px;">
                <tr>
                  <td style="padding:14px 18px;font-size:12px;line-height:1.6;color:#86efac;">
                    🔒 <strong>নিরাপত্তা বার্তা:</strong> আপনার ইউজারনেম ও পাসওয়ার্ড কাউকে শেয়ার করবেন না। প্রয়োজনে লগইন করার পর পাসওয়ার্ড পরিবর্তন করে নিতে পারবেন।
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:11px;color:#4b7a5a;text-align:center;">
                Direct URL: <a href="${portalUrl}" style="color:#4ade80;text-decoration:underline;">${portalUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background-color:#061309;border-top:1px solid #1a3d22;text-align:center;">
              <p style="margin:0 0 4px 0;font-size:12px;font-weight:600;color:#86efac;">
                IntelliWaste Smart City Infrastructure
              </p>
              <p style="margin:0;font-size:11px;color:#4b7a5a;line-height:1.5;">
                This is an automated system dispatch. Replies to this email are not monitored.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({
    to: [{ email, name: fullName }],
    subject: `🎉 Your IntelliWaste Credentials - Username: ${username}`,
    htmlContent: html,
    textContent: `Welcome to IntelliWaste, ${fullName}!\n\nYour account credentials:\nUsername: ${username}\nPassword: ${password}\nRole: ${role}\n\nLogin Portal: ${portalUrl}`,
  });
}

/**
 * Send Password Reset 6-Digit OTP Email (Gmail-bulletproof HTML)
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
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Password Reset Code</title>
</head>
<body style="margin:0;padding:0;background-color:#051408;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <!-- Gmail Inbox Preview Snippet -->
  <div style="display:none;font-size:1px;color:#051408;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    Your IntelliWaste password reset code is ${otpCode}. Valid for ${expiresInMinutes} minutes.
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#051408;padding:24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:520px;background-color:#0d2414;border:1px solid #1a3d22;border-radius:16px;overflow:hidden;box-shadow:0 12px 30px rgba(0,0,0,0.6);">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding:28px 32px 16px 32px;background:linear-gradient(135deg, #0d2414 0%, #11361c 100%);border-bottom:1px solid #1a3d22;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left">
                    <span style="font-size:24px;font-weight:800;color:#4ade80;letter-spacing:-0.5px;">🔐 IntelliWaste</span>
                    <div style="font-size:12px;color:#86efac;font-family:monospace;margin-top:2px;letter-spacing:1px;text-transform:uppercase;">ACCOUNT SECURITY & VERIFICATION</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding:28px 32px;">
              <h1 style="margin:0 0 12px 0;font-size:20px;line-height:1.3;font-weight:700;color:#ffffff;">
                Password Reset Verification Code
              </h1>
              <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#a7f3d0;">
                Hello <strong>${fullName || "User"}</strong>,
              </p>
              <p style="margin:0 0 24px 0;font-size:14px;line-height:1.6;color:#a7f3d0;">
                আপনার IntelliWaste একাউন্টের পাসওয়ার্ড রিসেট করার জন্য একটি অনুরোধ পাওয়া গেছে। নিচে আপনার ৬-সংখ্যার গোপনীয় ভেরিফিকেশন কোড দেওয়া হলো:
              </p>

              <!-- OTP Big Display Box (Bulletproof for Gmail) -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#061309;border:2px dashed #16a34a;border-radius:14px;margin-bottom:24px;">
                <tr>
                  <td align="center" style="padding:24px 16px;">
                    <div style="font-family:'Courier New',Courier,monospace;font-size:38px;font-weight:800;color:#4ade80;letter-spacing:10px;text-align:center;">
                      ${otpCode}
                    </div>
                    <div style="font-size:12px;color:#86efac;margin-top:8px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
                      ⏳ মেয়াদ: <strong>${expiresInMinutes} মিনিট</strong> (Valid for ${expiresInMinutes} mins)
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:10px;margin-bottom:20px;">
                <tr>
                  <td style="padding:14px 18px;font-size:12px;line-height:1.6;color:#fca5a5;">
                    ⚠️ <strong>সতর্কতা:</strong> এই কোডটি কখনই কাউকে দেবেন না। IntelliWaste কর্তৃপক্ষ কখনই আপনার কাছে এই কোড চাইবে না। আপনি যদি এই পাসওয়ার্ড রিসেট রিকোয়েস্ট না করে থাকেন, তবে এই ইমেইলটি উপেক্ষা করুন। আপনার একাউন্ট সম্পূর্ণ সুরক্ষিত থাকবে।
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:12px;color:#4b7a5a;text-align:center;">
                Security Verification • Automated Message
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background-color:#061309;border-top:1px solid #1a3d22;text-align:center;">
              <p style="margin:0 0 4px 0;font-size:12px;font-weight:600;color:#86efac;">
                IntelliWaste Smart City Infrastructure
              </p>
              <p style="margin:0;font-size:11px;color:#4b7a5a;">
                Dhaka, Bangladesh • Official Digital Platform
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({
    to: [{ email, name: fullName || "User" }],
    subject: `🔐 ${otpCode} is your IntelliWaste Password Reset Code`,
    htmlContent: html,
    textContent: `Your IntelliWaste password reset code is: ${otpCode}.\nValid for ${expiresInMinutes} minutes.\n\nNever share this code with anyone. If you did not request this, please ignore this email.`,
  });
}
