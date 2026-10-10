export const getPasswordResetTemplate = (resetUrl: string, name: string): string => {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Service Platform Password</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background-color: #f4f6fa;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      padding: 40px 20px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 1px;
    }
    .content {
      padding: 40px 30px;
      color: #333333;
      line-height: 1.6;
    }
    .content h2 {
      font-size: 20px;
      margin-top: 0;
      color: #1e3c72;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .btn {
      background: #1e3c72;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 30px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 6px;
      display: inline-block;
    }
    .footer {
      background-color: #f8fafc;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
    }
    .warning-text {
      font-size: 13px;
      color: #64748b;
      margin-top: 20px;
      border-top: 1px dashed #cbd5e1;
      padding-top: 15px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Service Platform</h1>
    </div>
    <div class="content">
      <h2>Hello ${name},</h2>
      <p>We received a request to reset the password for your service platform account. You can reset your password by clicking the button below:</p>
      <div class="button-container">
        <a href="${resetUrl}" class="btn" target="_blank">Reset Password</a>
      </div>
      <p>If the button doesn't work, you can copy and paste the following link into your web browser:</p>
      <p style="word-break: break-all; color: #2563eb;"><a href="${resetUrl}">${resetUrl}</a></p>
      <div class="warning-text">
        <p><strong>Note:</strong> This link is valid for 1 hour. If you did not request a password reset, please ignore this email or contact support if you have questions.</p>
      </div>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Service Platform. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
};

export const getRegistrationOtpTemplate = (
  otp: string,
  name: string,
  validityMinutes: number = 5
): string => {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your TreasureBox Verification Code</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background-color: #f7f5f0;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 540px;
      margin: 30px auto;
      background-color: #ffffff;
      border-radius: 16px;
      box-shadow: 0 10px 25px rgba(13, 40, 35, 0.08);
      overflow: hidden;
      border: 1px solid #e8e4dc;
    }
    .header {
      background: linear-gradient(135deg, #0D2823 0%, #17423B 100%);
      padding: 36px 24px;
      text-align: center;
      border-bottom: 3px solid #D4AF37;
    }
    .header h1 {
      margin: 0;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: 2px;
      color: #FDFBF7;
      text-transform: uppercase;
    }
    .header p {
      margin: 6px 0 0;
      font-size: 12px;
      color: #D4AF37;
      letter-spacing: 1px;
      text-transform: uppercase;
      font-family: monospace;
    }
    .content {
      padding: 36px 32px;
      color: #1a2e2b;
      line-height: 1.6;
    }
    .content h2 {
      font-size: 20px;
      margin-top: 0;
      color: #0D2823;
      font-weight: 700;
    }
    .otp-card {
      text-align: center;
      margin: 28px 0;
      padding: 24px;
      background: #FDFBF7;
      border: 2px dashed #D4AF37;
      border-radius: 12px;
    }
    .otp-label {
      font-size: 11px;
      font-weight: 700;
      color: #8C7335;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 8px;
    }
    .otp-code {
      font-size: 38px;
      font-weight: 900;
      letter-spacing: 12px;
      color: #0D2823;
      font-family: 'Courier New', monospace;
      padding-left: 12px;
    }
    .otp-validity {
      font-size: 12px;
      color: #64748b;
      margin-top: 8px;
    }
    .footer {
      background-color: #faf9f6;
      padding: 20px;
      text-align: center;
      font-size: 11px;
      color: #64748b;
      border-top: 1px solid #eef0eb;
    }
    .warning-box {
      font-size: 12px;
      color: #64748b;
      margin-top: 24px;
      padding: 12px 16px;
      background-color: #f8f9fa;
      border-radius: 8px;
      border-left: 3px solid #D4AF37;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>TREASURE BOX</h1>
      <p>Ciphertex Expedition Network</p>
    </div>
    <div class="content">
      <h2>Welcome, Explorer ${name}!</h2>
      <p>Thank you for initiating your Hunter account. To confirm your identity and commence expeditions, enter this 4-digit verification code in the mobile application:</p>
      
      <div class="otp-card">
        <div class="otp-label">Your Verification Code</div>
        <div class="otp-code">${otp}</div>
        <div class="otp-validity">Code expires in ${validityMinutes} minutes</div>
      </div>

      <div class="warning-box">
        <strong>Security Notice:</strong> Never share this code with anyone. TreasureBox personnel will never ask for your verification code.
      </div>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} TreasureBox Expeditions. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
};

export const getPasswordResetOtpTemplate = (
  otp: string,
  name: string = "Operator",
  validityMinutes: number = 10
): string => {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your TreasureBox Password Reset Code</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f7f5f0;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 540px;
      margin: 30px auto;
      background-color: #ffffff;
      border-radius: 16px;
      box-shadow: 0 10px 25px rgba(13, 40, 35, 0.08);
      overflow: hidden;
      border: 1px solid #e8e4dc;
    }
    .header {
      background: linear-gradient(135deg, #0D2823 0%, #17423B 100%);
      padding: 36px 24px;
      text-align: center;
      border-bottom: 3px solid #D4AF37;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 2px;
      color: #FDFBF7;
      text-transform: uppercase;
    }
    .header p {
      margin: 6px 0 0;
      font-size: 11px;
      color: #D4AF37;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      font-family: monospace;
    }
    .content {
      padding: 36px 32px;
      color: #1a2e2b;
      line-height: 1.6;
    }
    .content h2 {
      font-size: 19px;
      margin-top: 0;
      color: #0D2823;
      font-weight: 700;
    }
    .otp-card {
      text-align: center;
      margin: 28px 0;
      padding: 24px;
      background: #FDFBF7;
      border: 2px dashed #D4AF37;
      border-radius: 12px;
    }
    .otp-label {
      font-size: 11px;
      font-weight: 700;
      color: #8C7335;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 8px;
    }
    .otp-code {
      font-size: 36px;
      font-weight: 900;
      letter-spacing: 10px;
      color: #0D2823;
      font-family: 'Courier New', monospace;
      padding-left: 10px;
    }
    .otp-validity {
      font-size: 12px;
      color: #64748b;
      margin-top: 8px;
    }
    .warning-box {
      font-size: 12px;
      color: #64748b;
      margin-top: 24px;
      padding: 14px 18px;
      background-color: #fbfbf9;
      border-radius: 8px;
      border-left: 3px solid #D4AF37;
    }
    .footer {
      background-color: #faf9f6;
      padding: 22px;
      text-align: center;
      font-size: 11px;
      color: #64748b;
      border-top: 1px solid #eef0eb;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>TREASURE BOX</h1>
      <p>Security & Operator Command</p>
    </div>
    <div class="content">
      <h2>Password Reset Request</h2>
      <p>Hello ${name},</p>
      <p>We received a request to recover operator access for your TreasureBox account. Use the following 6-digit verification code to complete your password reset:</p>
      
      <div class="otp-card">
        <div class="otp-label">Password Reset Code</div>
        <div class="otp-code">${otp}</div>
        <div class="otp-validity">This code is valid for ${validityMinutes} minutes</div>
      </div>

      <div class="warning-box">
        <strong>Security Notice:</strong> If you did not request this password reset, please ignore this email or notify your system administrator immediately. No changes will be made without this code.
      </div>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} TreasureBox Platform. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
};
