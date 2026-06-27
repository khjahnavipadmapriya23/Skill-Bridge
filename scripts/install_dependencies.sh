#!/bin/bash
# Install backend production node modules on EC2
echo "Installing production node dependencies..."
cd /var/www/skillbridge/backend
npm install --production

# Fix folder permissions
chown -R ec2-user:ec2-user /var/www/skillbridge
