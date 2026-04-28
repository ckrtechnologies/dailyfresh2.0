import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Initialize Transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const LOGO_URL = 'https://api.dailyfreshkolkata.in/static/logo.jpg';

/**
 * Generic email sending function
 */
export const sendEmail = async (to, subject, html, attachments = []) => {
  try {
    const info = await transporter.sendMail({
      from: `Daily Fresh <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
      attachments,
    });
    console.log(`[Email] Message sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Error] ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Order Confirmation Email
 */
export const sendOrderConfirmation = async (userEmail, orderData) => {
  const subject = `Order Confirmed - #${orderData.order_number}`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="${LOGO_URL}" alt="Daily Fresh" style="width: 150px;" />
      </div>
      <h2 style="color: #7A0C0E; text-align: center;">Thank you for your order!</h2>
      <p>Hello, your order <b>#${orderData.order_number}</b> has been received and is being prepared.</p>
      <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><b>Total Amount:</b> ₹${orderData.total_amount}</p>
        <p style="margin: 5px 0;"><b>Delivery Slot:</b> ${orderData.delivery_slot}</p>
      </div>
      <hr style="border: 0; border-top: 1px solid #eee;" />
      <p style="text-align: center; font-size: 12px; color: #666;">We'll notify you once your fresh items are out for delivery.</p>
    </div>
  `;
  return await sendEmail(userEmail, subject, html);
};

/**
 * Welcome Email
 */
export const sendWelcomeEmail = async (userEmail, userName) => {
  const subject = 'Welcome to Daily Fresh!';
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="${LOGO_URL}" alt="Daily Fresh" style="width: 150px;" />
      </div>
      <h2 style="color: #7A0C0E; text-align: center;">Welcome ${userName}!</h2>
      <p>Thank you for joining <b>Daily Fresh</b>. We are committed to delivering the freshest meat and seafood to your doorstep.</p>
      <div style="text-align: center; margin-top: 30px;">
        <a href="https://dailyfreshkolkata.in" style="background: #7A0C0E; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Start Shopping</a>
      </div>
      <p style="margin-top: 40px; font-size: 12px; color: #999; text-align: center;">© 2024 Daily Fresh. All rights reserved.</p>
    </div>
  `;
  return await sendEmail(userEmail, subject, html);
};
