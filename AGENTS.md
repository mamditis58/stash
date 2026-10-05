# Stash contributor guidance

This is a beginner's learning playground with a static portfolio and a disposable local Node authentication example.

- Keep changes small and explain the reason in plain language.
- Keep the public portfolio in `docs/`; the local experiment UI belongs in `public/`.
- Do not add real credentials, personal data, or account/session dumps to files, logs, tests or screenshots.
- Keep the server bound to loopback and clearly document its educational limitations.
- Run `npm run check` and `npm test` for JavaScript changes. No dependency installation is needed.
- Preserve keyboard accessibility, mobile layout, text alternatives, and reduced-motion behavior.
- Update explanatory diagrams when the behavior they describe changes.
- Label proposed projects as planned until they actually work.

## Code Review Rules

### Authentication

Check password hashing, random salt generation, constant-time comparisons, session entropy, server-side expiry, logout invalidation, and session replacement. Flag changes that expose plaintext credentials or session tokens. Check Origin and CSRF validation on authenticated state-changing routes.

### CI and publishing

Check that pull requests run tests without deploying, all required test jobs pass before deployment, and only `docs/` is uploaded to Pages. Keep workflow permissions minimal and never introduce secrets for this dependency-free project without a documented need.

### Learning and portfolio

Check that README commands match package scripts, diagrams match the implementation, planned work is not presented as complete, and the portfolio does not suggest GitHub Pages runs the Node server.
