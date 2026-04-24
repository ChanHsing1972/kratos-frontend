# CI/CD setup

This project deploys automatically when `dev` or `master` is pushed.

Required GitLab CI/CD variable:

- `SSH_PASSWORD`: server SSH password, or use `SSH_PRIVATE_KEY` instead.

Default deployment target:

- Host: `192.0.2.1`
- Directory: `/var/www/se3/agent`
- Public URL: `http://192.0.2.1/`

The pipeline uses `registry.npmmirror.com`, caches the pnpm store, and builds the Vite app with `VITE_API_BASE_URL=/api/v1`.
