import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASS,
  },
});

// Base email template for Royal Youth
const getBaseTemplate = (content) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #0ea5e9, #3b82f6); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
      <h1 style="color: white; margin: 0;">Royal Youth Hub</h1>
      <p style="color: #e0f2fe; margin-top: 10px;">Impact Your World</p>
    </div>
    <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
      ${content}
    </div>
    <div style="text-align: center; padding: 20px; color: #64748b; font-size: 12px;">
      <p>© Royal Youth Hub ${new Date().getFullYear()}. All rights reserved.</p>
    </div>
  </div>
`;

export const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify/${token}`;

  const content = `
    <p style="font-size: 18px; color: #1e293b; font-weight: bold;">Dear User,</p>
    <p style="color: #475569; line-height: 1.6;">Welcome to the Royal Youth Community!</p>
    <p style="color: #475569; line-height: 1.6;">Please verify your email address by clicking the button below:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" style="background-color: #0ea5e9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Verify Email</a>
    </div>
    <p style="color: #475569; line-height: 1.6;">Or copy this link: <span style="color: #0ea5e9;">${verificationUrl}</span></p>
    <p style="color: #64748b; font-size: 14px;">This link will expire in 24 hours.</p>
  `;

  const mailOptions = {
    from: `"Royal Youth Hub" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Email Verification - Royal Youth Hub",
    html: getBaseTemplate(content),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Verification email sent");
  } catch (error) {
    console.error("Error sending verification email:", error);
  }
};