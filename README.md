# Ryzels Task Management & Operations Workspace

Comprehensive Enterprise Task Management, Operations Sheet, and WhatsApp Multi-Device Automation platform built with Next.js 15, React 19, TypeScript, Tailwind CSS, and Baileys.

---

## 🌟 Key Features

1. **Operations Sheet (Excel-Like Grid)**:
   - Live editable table for all tasks across all departments.
   - Real-time WhatsApp employee replies & remarks history capture.
   - Quick status dropdowns (`Assigned`, `In Progress`, `Under Review`, `Completed`, `Blocked`).
   - One-click **Download Excel / CSV** export.
   - Interactive WhatsApp Reminder triggers with status updates.

2. **Task Engine**:
   - Single-space streamlined task assignment form.
   - Image attachment support (file upload or URL) dispatched directly to employee WhatsApp.
   - Priority levels, estimated hours, and customizable deadlines.

3. **Employee Portal**:
   - Complete directory of team members with phone numbers, department links, and workloads.
   - Send custom WhatsApp alerts directly from employee cards.

4. **Department Management**:
   - Dynamic departments (`Website Development`, `Designers`, `SEO`, `Google Ads`, `Meta Ads`, `BING ADS`, `CEO`, `TASK MANAGER`).

5. **WhatsApp Multi-Device Engine (Baileys)**:
   - Direct connection via QR code without third-party paid APIs.
   - Multi-device privacy LID resolution to prevent message cross-contamination.
   - Master Switch to enable/disable automated WhatsApp listening at any time.

---

## 🚀 Deployment Guide on Hostinger

### Option 1: Hostinger VPS (Recommended - Ubuntu 22.04 / 24.04)

1. **Connect to your Hostinger VPS via SSH**:
   ```bash
   ssh root@your-server-ip
   ```

2. **Install Node.js 20 LTS & PM2**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs git
   sudo npm install -g pm2
   ```

3. **Clone the Repository**:
   ```bash
   git clone https://github.com/ryzelsdigital-wq/Task-Management-Ryzels.git
   cd Task-Management-Ryzels
   ```

4. **Install Dependencies & Build**:
   ```bash
   npm install
   npm run build
   ```

5. **Start with PM2 (Background Daemon)**:
   ```bash
   pm2 start npm --name "ryzels-task-manager" -- start
   pm2 save
   pm2 startup
   ```

6. **Configure Nginx Reverse Proxy (Optional / Port 80/443)**:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

### Option 2: Hostinger Cloud / Node.js Web Hosting (hPanel)

1. Go to **hPanel** -> **Websites** -> Select your website.
2. In the sidebar, navigate to **Advanced** -> **Node.js**:
   - **Node.js Version**: Select `20.x` or latest LTS.
   - **Application Mode**: `Production`
   - **Application Root**: `/public_html` (or subfolder where code is deployed)
   - **Application Startup File**: `node_modules/next/dist/bin/next` with argument `start` (or create a `server.js`).
3. Deploy via Git in hPanel:
   - Go to **Git** in hPanel.
   - Add Repository: `https://github.com/ryzelsdigital-wq/Task-Management-Ryzels.git`
   - Branch: `main`
4. In terminal / SSH on Hostinger:
   ```bash
   npm install
   npm run build
   npm run start
   ```

---

## ⚙️ Environment Variables (Optional)

Create a `.env` file if you wish to configure optional AI integrations:

```env
PORT=3000
NODE_ENV=production
# Optional OpenAI Key for AI-assisted task breakdown & voice
OPENAI_API_KEY=
```

---

## 📱 WhatsApp Connection on Hostinger
Once deployed on Hostinger, visit:
`http://your-domain.com/inbox`
Scan the pairing QR code with your phone's WhatsApp once, and the live WhatsApp engine will run autonomously on the server.
