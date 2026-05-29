# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-05-29

### Added
- Public landing page for unauthenticated users with rotating job portal animation, feature cards, and Google login CTA (phase 15)

### Fixed
- Force full page reload on logout to prevent stale JS bundle after deploy
- Disable `index.html` caching so browsers always fetch the latest version on deploy

### Changed
- Simplified landing page content and improved mobile layout: reduced feature cards on mobile, merged recruiter contacts with notes card, shortened section descriptions, increased section spacing

## [1.0.0] - 2026-05-28

### Added
- Job application tracker for Polish IT job seekers
- Google OAuth2 login
- Kanban board, list view, and CV link management
- Notes per application with categories
- Application statistics with badges
- GDPR compliance — consent, personal data export, account deletion
- Service notices system for admin announcements
- Polish / English language switcher
- Mobile-responsive UI with FAB and bottom sheets
- GitHub Actions CI pipeline
