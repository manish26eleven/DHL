# Hostinger Deployment Guide

## Prerequisites

You need **Hostinger VPS or Cloud Hosting** (shared hosting won't work for Node.js apps).

## Deployment Architecture

```
Client (React) → Build → Static Files → Served by Express
Server (Node.js) → Running on VPS with PM2
```

## Steps to Deploy

### 1️⃣ Prepare Your Project

#### A. Update Server to Serve React Build

Add this to your `server/index.js` (after all API routes):

```javascript
// Serve React static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}
```

#### B. Create Production Build Script

Add to `package.json` in root directory:

```json
{
  "name": "dhl-rate-calculator",
  "scripts": {
    "build": "cd client && npm run build",
    "start:server": "cd server && node index.js",
    "install:all": "cd client && npm install && cd ../server && npm install"
  }
}
```

#### C. Create `.gitignore`

```
node_modules/
.env
client/build/
*.log
uploads/
.DS_Store
```

### 2️⃣ Server Setup (Hostinger VPS)

#### A. Connect via SSH

```bash
ssh root@your-vps-ip
```

#### B. Install Node.js & PM2

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PM2 globally
npm install -g pm2

# Verify installation
node -v
npm -v
pm2 -v
```

#### C. Install Git

```bash
apt install -y git
```

### 3️⃣ Deploy Your Code

#### A. Clone Repository (or upload files)

**Option 1: Using Git**
```bash
cd /var/www
git clone <your-repo-url> dhl-calculator
cd dhl-calculator
```

**Option 2: Upload via SFTP**
- Use FileZilla or similar
- Upload to `/var/www/dhl-calculator`

#### B. Install Dependencies

```bash
cd /var/www/dhl-calculator
npm run install:all
```

#### C. Build React App

```bash
npm run build
```

#### D. Create Production `.env`

```bash
cd server
nano .env
```

Paste your credentials:
```env
JWT_SECRET=your-secret-here

FEDEX_CLIENT_ID_1=your-fedex-id-1
FEDEX_CLIENT_SECRET_1=your-fedex-secret-1
# ... all other credentials

DHL_API_KEY_1=v62_LSqKQdDz2S
DHL_API_SECRET_1=HtOuUf9FzP
DHL_ACCOUNT_NUMBER_1=136171263
# ... all DHL accounts

PORT=3001
NODE_ENV=production
```

Save with `Ctrl+O`, exit with `Ctrl+X`.

### 4️⃣ Start Application with PM2

```bash
cd /var/www/dhl-calculator/server
pm2 start index.js --name "dhl-calculator"
pm2 save
pm2 startup
```

### 5️⃣ Configure Nginx (Reverse Proxy)

#### A. Install Nginx

```bash
apt install -y nginx
```

#### B. Create Nginx Configuration

```bash
nano /etc/nginx/sites-available/dhl-calculator
```

Paste:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Handle large file uploads
        client_max_body_size 10M;
    }
}
```

#### C. Enable Site

```bash
ln -s /etc/nginx/sites-available/dhl-calculator /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### 6️⃣ Configure Domain (Hostinger Panel)

1. Go to Hostinger control panel
2. Navigate to **DNS/Nameservers**
3. Add **A Record**:
   - Type: `A`
   - Name: `@` (or subdomain)
   - Points to: Your VPS IP address
   - TTL: 14400

### 7️⃣ Install SSL (HTTPS)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

Follow prompts to enable automatic SSL.

### 8️⃣ Verify Deployment

Visit: `https://your-domain.com`

You should see the login page!

## Useful PM2 Commands

```bash
pm2 status                 # Check status
pm2 logs dhl-calculator   # View logs
pm2 restart dhl-calculator # Restart app
pm2 stop dhl-calculator   # Stop app
pm2 delete dhl-calculator # Remove from PM2
```

## Updating Your App

```bash
cd /var/www/dhl-calculator
git pull                  # If using Git
npm run install:all       # Update dependencies
npm run build            # Rebuild React
pm2 restart dhl-calculator # Restart server
```

## Troubleshooting

### App won't start
```bash
pm2 logs dhl-calculator  # Check logs
```

### Port already in use
```bash
lsof -i :3001           # Find process
kill -9 <PID>           # Kill process
```

### Nginx errors
```bash
nginx -t                # Test config
systemctl status nginx  # Check status
```

## Security Checklist

- ✅ Change default SSH port
- ✅ Use SSH keys instead of password
- ✅ Enable UFW firewall
- ✅ Keep `.env` file secure (never commit to Git)
- ✅ Regular system updates

## Cost Estimate

**Hostinger VPS:**
- Basic: ~$4-8/month
- Recommended: Premium VPS (~$12/month)

**Domain:**
- ~$10-15/year

---

**Need help?** Contact Hostinger support or check their VPS documentation.
