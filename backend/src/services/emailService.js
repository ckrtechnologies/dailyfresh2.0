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
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Thank you for your order!</h2>
      <p>Hello, your order <b>#${orderData.order_number}</b> has been received and is being prepared.</p>
      <p><b>Total Amount:</b> ₹${orderData.total_amount}</p>
      <p><b>Delivery Slot:</b> ${orderData.delivery_slot}</p>
      <hr />
      <p>We'll notify you once your fresh items are out for delivery.</p>
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
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Welcome ${userName}!</h2>
      <p>Thank you for joining Daily Fresh. We are committed to delivering the freshest meat and seafood to your doorstep.</p>
      <a href="https://dailyfresh.com" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Start Shopping</a>
    </div>
  `;
  return await sendEmail(userEmail, subject, html);
};
