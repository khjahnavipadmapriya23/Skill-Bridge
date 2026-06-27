output "ec2_public_ip" {
  value       = aws_instance.app_server.public_ip
  description = "The public IP of the application server"
}

output "ec2_public_dns" {
  value       = aws_instance.app_server.public_dns
  description = "The public DNS name of the application server"
}

output "s3_bucket_name" {
  value       = aws_s3_bucket.resume_bucket.id
  description = "The name of the S3 bucket created for resumes"
}
