import nodemailer from 'nodemailer';

const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
};

export const sendOtpEmail = async (toEmail: string, otpCode: string) => {
  const transporter = getTransporter();

  if (!transporter) {
    console.log(`[OTP DEV MODE] ${toEmail}: ${otpCode}`);
    return;
  }

  const from = process.env.MAIL_FROM || process.env.SMTP_USER;

  await transporter.sendMail({
    from,
    to: toEmail,
    subject: 'Ma OTP xac thuc tai khoan',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
        <h2>Xac thuc tai khoan</h2>
        <p>Ma OTP cua ban la:</p>
        <p style="font-size: 28px; letter-spacing: 6px; font-weight: bold; color: #1f5ca9;">${otpCode}</p>
        <p>Ma co hieu luc trong <strong>5 phut</strong>.</p>
        <p>Neu ban khong thuc hien yeu cau nay, vui long bo qua email.</p>
      </div>
    `,
  });
};
