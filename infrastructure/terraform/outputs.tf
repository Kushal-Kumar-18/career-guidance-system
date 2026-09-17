output "instance_public_ip" {
  description = "Public IP of the EC2 instance. This becomes your application's URL: http://<this-ip>/"
  value       = aws_instance.app.public_ip
}

output "ssh_command" {
  description = "Ready-to-use SSH command, assuming your private key is named after key_pair_name in your current directory."
  value       = "ssh -i ${var.key_pair_name}.pem ubuntu@${aws_instance.app.public_ip}"
}

output "application_url" {
  description = "URL to open in a browser once the app is deployed and running."
  value       = "http://${aws_instance.app.public_ip}/"
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket for file storage, if enable_s3 = true."
  value       = var.enable_s3 ? aws_s3_bucket.files[0].bucket : null
}

output "cloudwatch_log_group" {
  description = "CloudWatch Logs group name where the CloudWatch agent ships Docker container logs."
  value       = aws_cloudwatch_log_group.app.name
}

output "security_group_id" {
  description = "ID of the EC2 instance's security group, useful for double-checking inbound rules in the AWS console."
  value       = aws_security_group.app.id
}

# Deliberately not output: any database password, AUTH_SECRET, or other
# secret. None of those are Terraform-managed resources in this
# architecture — they live in backend/.env / ml-service/.env / the root
# .env on the EC2 instance itself (see docs/AWS_SETUP_GUIDE.md), never
# in Terraform state or outputs.
