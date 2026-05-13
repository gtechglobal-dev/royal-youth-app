import nodemailer from "nodemailer";

const hasEmailConfig = process.env.GMAIL_USER && process.env.GMAIL_APP_PASS;

if (!hasEmailConfig) {
  console.warn("EMAIL WARNING: GMAIL_USER or GMAIL_APP_PASS not configured. Emails will not be sent.");
}

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER || "",
    pass: process.env.GMAIL_APP_PASS || "",
  },
});

// Base email template for Royal Youth
const getBaseTemplate = (content) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #7c3aed, #a855f7); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
      <h1 style="color: white; margin: 0; font-size: 28px;">Royal Youth Hub</h1>
      <p style="color: #e0e7ff; margin-top: 10px; font-size: 14px;">Impact Your World</p>
    </div>
    <div style="background: #faf5ff; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9d5ff;">
      ${content}
    </div>
    <div style="text-align: center; padding: 20px; color: #64748b; font-size: 12px;">
      <p>© Royal Youth Hub ${new Date().getFullYear()}. All rights reserved.</p>
    </div>
  </div>
`;

export const sendApprovalEmail = async (email, name) => {
  try {
    const content = `
      <p style="font-size: 18px; color: #1e293b; font-weight: bold;">Dear ${name},</p>
      <p style="color: #475569; line-height: 1.6;">Congratulations! Welcome to the Royal Youth Community.</p>
      <p style="color: #475569; line-height: 1.6;">Your registration has been approved successfully.</p>
      <p style="color: #475569; line-height: 1.6;">You can now login to your Royal Youth Account and remain active to all events and fellowship with other youth members.</p>
      <p style="color: #475569; line-height: 1.6; margin-top: 20px;">We look forward to having you as part of our community!</p>
    `;

    if (!hasEmailConfig) throw new Error("GMAIL_USER/GMAIL_APP_PASS not configured");
    await transporter.sendMail({
      from: `"Royal Youth Hub" <${process.env.GMAIL_USER}>`,
      to: email,
      bcc: "royalyouthsc4c5@gmail.com",
      subject: "Congratulations! Welcome to Royal Youth Hub",
      html: getBaseTemplate(content),
    });
    console.log("Approval email sent");
  } catch (error) {
    console.error("Email error:", error);
  }
};

export const sendRejectionEmail = async (email, name, reason) => {
  try {
    const content = `
      <p style="font-size: 18px; color: #1e293b; font-weight: bold;">Dear ${name},</p>
      <p style="color: #475569; line-height: 1.6;">Thank you for your interest in the Royal Youth Community.</p>
      <p style="color: #475569; line-height: 1.6;">After careful consideration, we regret to inform you that your application was not approved at this time.</p>
      <p style="color: #475569; line-height: 1.6;">Reason: ${reason || "Not specified"}</p>
      <p style="color: #475569; line-height: 1.6; margin-top: 20px;">We encourage you to reapply in the future.</p>
    `;

    if (!hasEmailConfig) throw new Error("GMAIL_USER/GMAIL_APP_PASS not configured");
    await transporter.sendMail({
      from: `"Royal Youth Hub" <${process.env.GMAIL_USER}>`,
      to: email,
      bcc: "royalyouthsc4c5@gmail.com",
      subject: "Update on Your Royal Youth Hub Registration",
      html: getBaseTemplate(content),
    });
    console.log("Rejection email sent");
  } catch (error) {
    console.error("Email error:", error);
  }
};

export const sendOTPEmail = async (email, name, otp) => {
  try {
    const content = `
      <p style="font-size: 18px; color: #1e293b; font-weight: bold;">Dear ${name},</p>
      <p style="color: #475569; line-height: 1.6;">We received a request to recover your password.</p>
      <p style="color: #475569; line-height: 1.6;">Use the OTP below to reset your password:</p>
      <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; color: #7c3aed;">
        ${otp}
      </div>
      <p style="color: #475569; line-height: 1.6;">This OTP will expire in 10 minutes.</p>
      <p style="color: #475569; line-height: 1.6;">If you did not request this, please ignore this email.</p>
    `;

    if (!hasEmailConfig) throw new Error("GMAIL_USER/GMAIL_APP_PASS not configured");
    await transporter.sendMail({
      from: `"Royal Youth Hub" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Password Recovery - Royal Youth Hub",
      html: getBaseTemplate(content),
    });
    console.log("OTP email sent");
  } catch (error) {
    console.error("Email error:", error);
  }
};