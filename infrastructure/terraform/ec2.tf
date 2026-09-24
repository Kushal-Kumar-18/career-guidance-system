# Single EC2 instance running the entire application stack via Docker
# Compose (docker-compose.prod.yml, deployed manually per
# docs/AWS_SETUP_GUIDE.md — Terraform provisions the instance and its
# permissions, it does not deploy application code or run compose for
# you; keeping those concerns separate is what makes `terraform destroy`
# safe to reason about independently of your app deployment).

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_instance" "app" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.public.id
  vpc_security_group_ids      = [aws_security_group.app.id]
  iam_instance_profile        = aws_iam_instance_profile.ec2.name
  key_name                    = var.key_pair_name
  associate_public_ip_address = true

  root_block_device {
    volume_size = var.root_volume_size_gb
    volume_type = "gp3"
    encrypted   = true
  }

  # Bootstraps the OS only (Docker, Compose plugin, CloudWatch agent) —
  # it does NOT clone the app repo or start containers. That's a
  # deliberate line: user_data changes require replacing the instance to
  # re-apply, but your application deploy (git pull + docker compose up)
  # should be something you can re-run anytime over SSH without
  # Terraform being involved at all.
  user_data = templatefile("${path.module}/user_data.sh.tftpl", {
    log_group_name = aws_cloudwatch_log_group.app.name
    aws_region     = var.aws_region
  })
  user_data_replace_on_change = false

  tags = {
    Name = "${var.project_name}-app"
  }
}
