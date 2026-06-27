#!/bin/bash
# Stop running instance under PM2 control
echo "Stopping existing Express API application..."
export HOME="/home/ec2-user"
pm2 stop cloudpath-api || true
pm2 delete cloudpath-api || true
