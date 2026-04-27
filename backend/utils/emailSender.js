import nodemailer from "nodemailer";
import "dotenv/config";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendApprovalEmail = async (email, name) => {
  try {
    await transporter.sendMail({
      from: `"Royal Youth Portal" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Congratulations! Welcome to the Royal Youth Community",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0ea5e9, #3b82f6); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Royal Youth Community</h1>
          </div>
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
            <p style="font-size: 18px; color: #1e293b;">Dear ${name},</p>
            <p style="color: #475569; line-height: 1.6;">Congratulations! Welcome to the Royal Youth Community.</p>
            <p style="color: #475569; line-height: 1.6;">Your registration has been approved successfully.</p>
            <p style="color: #475569; line-height: 1.6;">You can now login to your Royal Youth Account and remain active to all events and fellowship with other youth members.</p>
            <p style="color: #475569; line-height: 1.6; margin-top: 20px;">We look forward to having you as part of our community!</p>
            <p style="color: #1e293b; font-weight: bold; margin-top: 20px;">Remain Active!</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="color: #64748b; font-size: 12px; text-align: center;">Royal Youth Community</p>
          </div>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error("Email error:", err);
    return false;
  }
};

export const sendRejectionEmail = async (email, name) => {
  try {
    await transporter.sendMail({
      from: `"Royal Youth Portal" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Registration Update - Royal Youth Community",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Royal Youth Community</h1>
          </div>
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
            <p style="font-size: 18px; color: #1e293b;">Dear ${name},</p>
            <p style="color: #475569; line-height: 1.6;">We regret to inform you that your registration submission was not approved at this time.</p>
            <p style="color: #475569; line-height: 1.6; margin-top: 20px;">Please contact the Youth President for further guidance and clarification.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="color: #64748b; font-size: 12px; text-align: center;">Royal Youth Community</p>
          </div>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error("Email error:", err);
    return false;
  }
};