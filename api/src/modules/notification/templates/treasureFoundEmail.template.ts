export interface TreasureFoundEmailData {
  hunterName: string;
  finderName: string;
  huntTitle: string;
  claimedAtDate?: string;
  dashboardUrl?: string;
}

export const generateTreasureFoundEmailHtml = ({
  hunterName,
  finderName,
  huntTitle,
  claimedAtDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }),
}: TreasureFoundEmailData): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Treasure Found Notification</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0B1E1A;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #E2E8F0;
    }
    .wrapper {
      width: 100%;
      background-color: #0B1E1A;
      padding: 40px 10px;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #0D2823;
      border: 1px solid #C4A052;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    }
    .header {
      background: linear-gradient(135deg, #091D19 0%, #0D2823 100%);
      padding: 35px 20px 25px;
      text-align: center;
      border-bottom: 1px solid rgba(196, 160, 82, 0.3);
    }
    .logo-badge {
      display: inline-block;
      width: 52px;
      height: 52px;
      line-height: 52px;
      border-radius: 50%;
      background: linear-gradient(135deg, #F5D77F 0%, #C4A052 100%);
      color: #0D2823;
      font-weight: 800;
      font-size: 22px;
      margin-bottom: 12px;
      box-shadow: 0 4px 12px rgba(196, 160, 82, 0.4);
    }
    .brand-title {
      color: #FBF3D5;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin: 0;
    }
    .brand-subtitle {
      color: #C4A052;
      font-size: 11px;
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-top: 5px;
    }
    .content {
      padding: 35px 30px;
      line-height: 1.6;
    }
    .greeting {
      font-size: 17px;
      color: #FFFFFF;
      margin-top: 0;
      margin-bottom: 16px;
    }
    .announcement-box {
      background-color: rgba(196, 160, 82, 0.08);
      border-left: 4px solid #C4A052;
      border-radius: 6px;
      padding: 16px 20px;
      margin: 24px 0;
    }
    .hunt-title {
      font-size: 19px;
      font-weight: 700;
      color: #FBF3D5;
      margin: 0 0 6px 0;
    }
    .finder-text {
      font-size: 14px;
      color: #CBD5E1;
      margin: 0;
    }
    .finder-name {
      color: #F5D77F;
      font-weight: 700;
    }
    .body-text {
      font-size: 14.5px;
      color: #94A3B8;
      margin-bottom: 20px;
    }
    .sealed-badge {
      display: inline-block;
      padding: 6px 14px;
      background-color: rgba(220, 38, 38, 0.15);
      border: 1px solid #EF4444;
      border-radius: 20px;
      color: #F87171;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-top: 8px;
    }
    .footer {
      background-color: #071512;
      padding: 24px 20px;
      text-align: center;
      border-top: 1px solid rgba(196, 160, 82, 0.15);
    }
    .footer-text {
      font-size: 12px;
      color: #64748B;
      margin: 4px 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo-badge">⚔</div>
        <h1 class="brand-title">TREASURE BOX</h1>
        <div class="brand-subtitle">EXPEDITION DISPATCH</div>
      </div>
      <div class="content">
        <p class="greeting">Greetings, Explorer <strong>${hunterName}</strong>,</p>
        <p class="body-text">
          An official announcement from the Command Room: The treasure cache for your active expedition has officially been discovered and sealed!
        </p>

        <div class="announcement-box">
          <div class="hunt-title">Expedition: ${huntTitle}</div>
          <p class="finder-text">Discovered by: <span class="finder-name">${finderName}</span></p>
          <p class="finder-text" style="font-size: 12px; margin-top: 4px; color: #94A3B8;">Verified Date: ${claimedAtDate}</p>
          <div class="sealed-badge">STATUS: TREASURE FOUND & SEALED</div>
        </div>

        <p class="body-text">
          This expedition is now concluded and has been marked as found in your field index. Stay alert for new upcoming live expeditions and challenges arriving soon in your Treasure Box catalog!
        </p>
      </div>
      <div class="footer">
        <p class="footer-text">© ${new Date().getFullYear()} TreasureBox Expeditions. All rights reserved.</p>
        <p class="footer-text">Official notification sent to registered permit holders.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
};
