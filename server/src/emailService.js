const nodemailer = require('nodemailer');

const gmailUser = process.env.GMAIL_USER;
const gmailPass = process.env.GMAIL_APP_PASSWORD;
const gmailFromName = process.env.GMAIL_FROM_NAME || 'Refer & Earn';

// Only create transporter if creds are present; otherwise sendOtpEmail will throw.
const mailTransporter =
  gmailUser && gmailPass
    ? nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      })
    : null;

async function sendOtpEmail({ to, code }) {
  console.log({
    gmailUser: process.env.GMAIL_USER,
    hasPassword: Boolean(process.env.GMAIL_APP_PASSWORD),
  });
  
  if (!gmailUser || !gmailPass) {
    throw new Error('Gmail credentials not configured');
  }
  if (!mailTransporter) {
    throw new Error('Mail transporter not initialized');
  }

  const from = `"${gmailFromName}" <${gmailUser}>`;
  const subject = 'Your Verification Code';
  const text = `Your verification code is: ${code}

This code will expire in 5 minutes.

If you did not request this, you can ignore this email.`;

  const html = `
    <p>Hi,</p>
    <p>Your verification code is:</p>
    <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${code}</p>
    <p>This code will expire in <strong>5 minutes</strong>.</p>
    <p>If you did not request this, you can safely ignore this email.</p>
  `;

  await mailTransporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
}

async function sendReferralRequestEmailToRequester({ to, requesterName, jobId, jobTitle, companyName }) {
  if (!gmailUser || !gmailPass || !mailTransporter) {
    console.warn('Email not configured, skipping requester notification');
    return;
  }

  const from = `"${gmailFromName}" <${gmailUser}>`;
  const subject = 'Referral Request Submitted – Pending';
  const text = `Hi ${requesterName},

Your referral request has been successfully submitted and is now pending.

Details:
- Job ID: ${jobId || 'N/A'}
- Job Title: ${jobTitle || 'N/A'}
- Provider Company: ${companyName || 'N/A'}
- Status: Pending

The referral provider will review your request and update the status accordingly.

Best regards,
Refer & Earn Platform`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">Referral Request Submitted</h2>
      <p>Hi ${requesterName},</p>
      <p>Your referral request has been successfully submitted and is now <strong>pending</strong>.</p>
      <div style="background-color: #F3F4F6; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Job ID:</strong> ${jobId || 'N/A'}</p>
        <p><strong>Job Title:</strong> ${jobTitle || 'N/A'}</p>
        <p><strong>Provider Company:</strong> ${companyName || 'N/A'}</p>
        <p><strong>Status:</strong> <span style="color: #F59E0B; font-weight: bold;">Pending</span></p>
      </div>
      <p>The referral provider will review your request and update the status accordingly.</p>
      <p>Best regards,<br>Refer & Earn Platform</p>
    </div>
  `;

  try {
    await mailTransporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
  } catch (error) {
    console.error('Failed to send requester email:', error);
    throw error;
  }
}

async function sendReferralRequestEmailToProvider({ to, providerName, requesterName, requesterEmail, requesterPhone, jobId, jobTitle, resumeLink, referralSummary }) {
  if (!gmailUser || !gmailPass || !mailTransporter) {
    console.warn('Email not configured, skipping provider notification');
    return;
  }

  const from = `"${gmailFromName}" <${gmailUser}>`;
  const subject = 'New Referral Request for Your Company';
  const text = `Hi ${providerName},

You have received a new referral request for your company.

Requester Details:
- Name: ${requesterName}
- Email: ${requesterEmail}
- Phone: ${requesterPhone || 'N/A'}

Job Details:
- Job ID: ${jobId || 'N/A'}
- Job Title: ${jobTitle || 'N/A'}

Resume Link: ${resumeLink || 'N/A'}

Referral Summary (${referralSummary ? referralSummary.split(/\s+/).length : 0} words):
${referralSummary || 'N/A'}

Please review the request and mark it as completed once you have provided the referral.

Best regards,
Refer & Earn Platform`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">New Referral Request</h2>
      <p>Hi ${providerName},</p>
      <p>You have received a new referral request for your company.</p>
      
      <div style="background-color: #F3F4F6; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1F2937;">Requester Details</h3>
        <p><strong>Name:</strong> ${requesterName}</p>
        <p><strong>Email:</strong> <a href="mailto:${requesterEmail}">${requesterEmail}</a></p>
        <p><strong>Phone:</strong> ${requesterPhone || 'N/A'}</p>
      </div>

      <div style="background-color: #F3F4F6; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1F2937;">Job Details</h3>
        <p><strong>Job ID:</strong> ${jobId || 'N/A'}</p>
        <p><strong>Job Title:</strong> ${jobTitle || 'N/A'}</p>
      </div>

      <div style="margin: 20px 0;">
        <p><strong>Resume Link:</strong> <a href="${resumeLink || '#'}" target="_blank">${resumeLink || 'N/A'}</a></p>
      </div>

      <div style="background-color: #EFF6FF; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4F46E5;">
        <h3 style="margin-top: 0; color: #1F2937;">Referral Summary</h3>
        <p style="white-space: pre-wrap; line-height: 1.6;">${referralSummary || 'N/A'}</p>
        <p style="font-size: 12px; color: #6B7280; margin-top: 8px;">
          (${referralSummary ? referralSummary.split(/\s+/).length : 0} words)
        </p>
      </div>

      <p>Please review the request and mark it as completed once you have provided the referral.</p>
      <p>Best regards,<br>Refer & Earn Platform</p>
    </div>
  `;

  try {
    await mailTransporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
  } catch (error) {
    console.error('Failed to send provider email:', error);
    throw error;
  }
}

module.exports = {
  sendOtpEmail,
  sendReferralRequestEmailToRequester,
  sendReferralRequestEmailToProvider,
};
