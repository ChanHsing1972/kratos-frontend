# CI/CD setup

This project verifies merge requests and deploys only from protected branches.

Required GitLab CI/CD variable:

- `SSH_PASSWORD`: server SSH password, or use `SSH_PRIVATE_KEY` instead.
- `DEPLOY_HOST`: deployment host.

Default deployment layout:

- Directory: `/var/www/se3/agent`

The pipeline runs typecheck, lint, and build for merge requests. It uses `registry.npmmirror.com`, caches the pnpm store, and builds the Vite app with `VITE_API_BASE_URL=/api/v1`.
