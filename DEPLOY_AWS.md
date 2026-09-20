# Deploying SeatRelay on the AWS Free Tier

The whole stack (React frontend + Node/SQLite backend) runs on **one EC2 instance**
with Docker Compose. Nginx serves the built frontend on port 80 and reverse-proxies
`/api`, `/mock-operator`, `/demo` and `/health` to the backend, so only port 80 is
ever exposed.

## What this costs

| Resource | Free Tier allowance | What we use |
|---|---|---|
| EC2 `t3.micro` (or `t2.micro` in older accounts) | 750 hours/month for 12 months | 1 instance, always on = ~730 h |
| EBS gp3 storage | 30 GB/month | 8-10 GB root volume |
| Data transfer out | 100 GB/month | Far below for a demo |
| Elastic IP | Free **while attached** to a running instance | 1, attached |

Staying inside these numbers means **$0/month**. An Elastic IP that is allocated but
*not* attached to a running instance is billed hourly — release it when you tear down.

> Free Tier accounts opened after mid-2025 get a $100 credit pool instead of the
> classic 12-month allowances. The same instance size still fits comfortably.

## 1. Launch the instance

EC2 → **Launch instance**:

- **AMI**: Amazon Linux 2023 (x86_64)
- **Instance type**: `t3.micro` (marked *Free tier eligible*)
- **Key pair**: create one and download the `.pem` — you need it for SSH
- **Network settings** → security group inbound rules:
  - `HTTP` TCP 80 from `0.0.0.0/0`
  - `SSH` TCP 22 from **My IP** (not from anywhere)
  - Leave port 4000 closed — the backend is only reachable inside the Docker network
- **Storage**: 8 GB gp3 (default is fine)
- **Advanced details → User data**: paste the contents of [`deploy/ec2-user-data.sh`](deploy/ec2-user-data.sh)

The user-data script installs Docker and Compose, clones this repo to `/opt/seatrelay`,
builds both images, starts them, and registers a `seatrelay.service` unit so the stack
comes back automatically after an instance stop/start.

First boot takes roughly 3-5 minutes. Then open `http://<public-ip>/`.

## 2. If you prefer to do it by hand

```bash
ssh -i seatrelay.pem ec2-user@<public-ip>

sudo dnf update -y && sudo dnf install -y docker git
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user && exit   # log back in for the group to apply

ssh -i seatrelay.pem ec2-user@<public-ip>
sudo mkdir -p /usr/libexec/docker/cli-plugins
sudo curl -sSL "https://github.com/docker/compose/releases/download/v2.29.7/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/libexec/docker/cli-plugins/docker-compose
sudo chmod +x /usr/libexec/docker/cli-plugins/docker-compose

git clone https://github.com/HirthikBalaji/Bharath-Build-2026-First-Commit.git /opt/seatrelay
cd /opt/seatrelay
docker compose up -d --build
```

## 3. Verify

```bash
curl http://<public-ip>/health                                  # {"status":"ok",...}
curl "http://<public-ip>/api/buses/search?from=Bangalore&to=Chennai"
docker compose ps
docker compose logs -f backend
```

## 4. Ship an update

```bash
ssh -i seatrelay.pem ec2-user@<public-ip>
cd /opt/seatrelay && ./deploy/update.sh
```

`update.sh` pulls, rebuilds, restarts and prunes dangling images (important — the
8 GB root volume fills up after a handful of rebuilds otherwise).

## Data persistence

The SQLite database lives in the named volume `seatrelay_data`, mounted at
`/app/data` inside the backend container. The entrypoint seeds the database **only
when the file does not exist**, so rebuilds and restarts keep your data. To reset the
demo to a clean seeded state:

```bash
docker compose down -v && docker compose up -d --build
```

Back it up with:

```bash
docker compose cp backend:/app/data/seatrelay.db ./seatrelay-backup.db
```

## Low-memory builds

`t3.micro` has 1 GB of RAM and the Vite build can run out of it. If
`docker compose up --build` dies with `Killed` or a JS heap error, add swap once:

```bash
sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## Optional: a domain and HTTPS

Point an A record at the instance's Elastic IP, then terminate TLS with Certbot on the
host (`sudo dnf install -y certbot`) in front of port 80, or put CloudFront before the
instance. An Application Load Balancer also works but is **not** Free Tier eligible —
it bills ~$16/month.

## Tear down

```bash
docker compose down -v          # on the instance
```

Then in the console: terminate the instance, delete the EBS volume if it survived, and
**release the Elastic IP** — an unattached one is the most common surprise charge.
