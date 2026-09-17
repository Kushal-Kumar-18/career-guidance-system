# Deliberately minimal: one log group (application/Docker logs, shipped
# by the CloudWatch agent installed via user_data in ec2.tf) and one
# optional alarm. EC2's own basic monitoring (5-minute CPU/network/disk
# metrics) is included at no extra charge and needs no Terraform
# resource — this file only adds what genuinely isn't free by default.

# Deliberately minimal: one log group (application/Docker logs, shipped
# by the CloudWatch agent installed via user_data in ec2.tf) and one
# optional alarm. EC2's own basic monitoring (5-minute CPU/network/disk
# metrics) is included at no extra charge and needs no Terraform
# resource — this file only adds what genuinely isn't free by default.
# No SNS topic — SNS wasn't a genuine requirement for this project (see
# docs/AWS_ARCHITECTURE.md's "what's deliberately not included" table),
# so the alarm below has no notification action attached. It's still
# fully visible/useful in the CloudWatch console (Alarms → In alarm /
# OK state) without needing anywhere to notify.

resource "aws_cloudwatch_log_group" "app" {
  name              = "/${var.project_name}/app"
  retention_in_days = var.log_retention_days
}

resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  count               = var.enable_cpu_alarm ? 1 : 0
  alarm_name          = "${var.project_name}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "EC2 CPU above 80% for 10 minutes — the free-tier instance is small, so sustained high CPU usually means the ML service or Postgres is under real load, or a container is stuck restart-looping. Check the CloudWatch console's Alarms page for state; no notification is configured (no SNS topic — add one yourself here if you want an email/SMS alert)."
  dimensions = {
    InstanceId = aws_instance.app.id
  }
}

