# Stash contributor guidance

This is a beginner's learning playground with a static portfolio and a disposable local Node authentication example.

## Required writing style

Always use an STE-informed plain-language version of ASD-STE100 Simplified Technical English for all written work. Apply this rule to code comments, documentation, user-facing text, commit messages, pull requests, reviews, explanations, and messages to the user.

- Use short sentences and common words. Use active voice when it makes the meaning clear.
- Give each sentence one main idea. Give each instruction one clear action.
- Use the same word for the same thing. Avoid idioms, vague words, and needless jargon.
- Define a technical term when the reader first needs it. Explain tasks for a beginner unless the user asks for more detail.
- Keep names, APIs, syntax, and technical facts correct. Do not change required code identifiers or exact quoted text to fit the writing style.
- Use clear examples, diagrams, and illustrations when they help explain a process.
- Treat this as STE-informed plain language. Do not claim full ASD-STE100 compliance or certification.

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
