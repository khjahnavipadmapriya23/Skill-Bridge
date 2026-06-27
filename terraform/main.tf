provider "aws" {
  region = var.aws_region
}

# 1. Networking Components (VPC, Subnet, IGW, Route Table)
resource "aws_vpc" "main_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = {
    Name = "skillbridge-vpc"
  }
}

resource "aws_subnet" "public_subnet" {
  vpc_id                  = aws_vpc.main_vpc.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true
  availability_zone       = "${var.aws_region}a"
  tags = {
    Name = "skillbridge-public-subnet"
  }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main_vpc.id
  tags = {
    Name = "skillbridge-igw"
  }
}

resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.main_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "skillbridge-public-route-table"
  }
}

resource "aws_route_table_association" "public_rt_assoc" {
  subnet_id      = aws_subnet.public_subnet.id
  route_table_id = aws_route_table.public_rt.id
}

# 2. Security Group (Web & SSH access)
resource "aws_security_group" "web_sg" {
  name        = "skillbridge-web-security-group"
  description = "Enable inbound HTTP, SSH, and Node API traffic"
  vpc_id      = aws_vpc.main_vpc.id

  # SSH
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTP
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Express Backend API Port
  ingress {
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Outbound All Traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "skillbridge-security-group"
  }
}

# 3. S3 Bucket for resume documents
resource "aws_s3_bucket" "resume_bucket" {
  bucket        = var.s3_bucket_name
  force_destroy = true
  tags = {
    Name        = "skillbridge-resume-bucket"
    Environment = "Production"
  }
}

# 4. IAM Role for S3 access from EC2
resource "aws_iam_role" "ec2_s3_role" {
  name = "skillbridge-ec2-s3-access-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

# IAM Policy for S3 read/write actions
resource "aws_iam_role_policy" "s3_access_policy" {
  name = "skillbridge-s3-policy"
  role = aws_iam_role.ec2_s3_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket",
          "s3:DeleteObject"
        ]
        Resource = [
          aws_s3_bucket.resume_bucket.arn,
          "${aws_s3_bucket.resume_bucket.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "skillbridge-ec2-profile"
  role = aws_iam_role.ec2_s3_role.name
}

# 5. EC2 Instance
resource "aws_instance" "app_server" {
  ami                  = var.ami_id
  instance_type        = var.instance_type
  subnet_id            = aws_subnet.public_subnet.id
  vpc_security_group_ids = [aws_security_group.web_sg.id]
  iam_instance_profile = aws_iam_instance_profile.ec2_profile.id
  key_name             = var.key_name

  user_data = <<-EOF
              #!/bin/bash
              # Update yum packages
              sudo yum update -y
              
              # Install Node.js 18
              curl -sL https://rpm.nodesource.com/setup_18.x | sudo bash -
              sudo yum install -y nodejs git nginx
              
              # Start Nginx
              sudo systemctl start nginx
              sudo systemctl enable nginx
              
              # Install PM2 globally
              sudo npm install -g pm2
              
              # Create app path
              sudo mkdir -p /var/www/skillbridge
              sudo chown -R ec2-user:ec2-user /var/www/skillbridge
              
              echo "Server Setup Completed" > /var/log/user_data_complete.log
              EOF

  tags = {
    Name = "skillbridge-app-server"
  }
}
