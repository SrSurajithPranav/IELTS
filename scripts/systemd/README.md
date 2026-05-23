# Scheduling review quiz generation with systemd

This folder contains example `systemd` unit and timer files to run the bulk review generator on a schedule.

Files:

- `run_generate_review_quizzes.service` — runs the script as a one-shot service.
- `run_generate_review_quizzes.timer` — runs the service on a schedule (daily at 03:00).

Installation (server):

1. Copy `run_generate_review_quizzes.service` and `run_generate_review_quizzes.timer` to `/etc/systemd/system/`.
2. Ensure `scripts/run_generate_review_quizzes.sh` is executable and reachable by the service's `ExecStart` path.
3. Set environment variables (for example in `/etc/systemd/system/run_generate_review_quizzes.service.d/override.conf`):

   ```ini
   [Service]
   Environment="ADMIN_JWT=eyJhbGci..."
   Environment="API_URL=https://your.backend.url/api"
   ```

4. Enable and start the timer:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now run_generate_review_quizzes.timer
```

Customization
- Edit the timer file `OnCalendar` field to change schedule (e.g., weekly, hourly).
- Use a secrets manager to store `ADMIN_JWT` securely instead of embedding in unit files.

Security note
- Embedding long-lived admin JWTs in unit files is convenient but insecure. Prefer a short-lived token rotated via CI, or use a server-side cron job that fetches credentials from a secrets store.
