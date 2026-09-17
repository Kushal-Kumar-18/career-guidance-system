# Only three inbound rules, on purpose (section 12 of the master
# prompt): SSH from YOUR IP only, HTTP for the app, HTTPS reserved for
# if you later put a TLS cert on Nginx (not configured by this project
# — see docs/AWS_ARCHITECTURE.md "What's not included"). Ports 4000
# (backend), 8000 (ml-service), and 5432 (postgres) are deliberately
# NOT opened here — docker-compose.prod.yml only publishes Nginx's
# port 80 to the host, so there is nothing listening on those ports
# from outside the instance to begin with; this security group is a
# second, independent layer of that same guarantee.
resource "aws_security_group" "app" {
  name        = "${var.project_name}-app-sg"
  description = "Career Guidance System EC2 instance: SSH (restricted), HTTP, HTTPS"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "SSH from the operator's IP only"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  ingress {
    description = "HTTP — the app's public entry point (Nginx)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS — reserved for a future TLS cert on Nginx; harmless to leave open even if unused today"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound (package installs, Docker Hub/ECR pulls, external APIs like Adzuna)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-app-sg"
  }
}
