#!/bin/bash
# Configure Nginx Reverse Proxy to Node Server on port 5000
echo "Configuring Nginx reverse proxy configuration..."
cat << 'EOF' > /etc/nginx/conf.d/cloudpath.conf
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Restart Nginx service
echo "Restarting Nginx..."
systemctl restart nginx

# Start Express server via PM2
echo "Starting Node server via PM2..."
cd /var/www/cloudpath/backend
export HOME="/home/ec2-user"
pm2 start server.js --name "cloudpath-api"
pm2 save
