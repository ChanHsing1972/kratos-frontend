# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Docker containerization with multi-stage builds (Node → Nginx)
- GitHub Actions CI/CD pipeline (verify → build → deploy)
- GitHub Container Registry (ghcr.io) image publishing
- Remote `.env` management via `DEPLOY_ENV_FILE` secret
- SSL/TLS support in nginx config
- Issue templates, PR template, CODEOWNERS, Code of Conduct

### Changed
- Migrated from GitLab CI to GitHub Actions
- Switched from systemd-based deployment to Docker Compose
- nginx config now uses `127.0.0.1:8000` for backend proxy (host network mode)

### Removed
- GitLab-specific CI/CD configuration
- Dependabot branch clutter on remote