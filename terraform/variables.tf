variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "AWS Region to deploy resources"
}

variable "instance_type" {
  type        = string
  default     = "t2.micro"
  description = "EC2 Instance size"
}

variable "ami_id" {
  type        = string
  default     = "ami-0c7217cdde317cfec" # Amazon Linux 2023 AMI in us-east-1
  description = "AMI ID for EC2 instance"
}

variable "key_name" {
  type        = string
  default     = "deploy-key"
  description = "Key pair name for EC2 SSH access"
}

variable "s3_bucket_name" {
  type        = string
  default     = "skillbridge-resume-vault-992211"
  description = "S3 bucket for resume storage"
}
