# Pull Request Title
<!--
Use a clear, descriptive title. Example: "feat(auth): add refresh token endpoint"
-->

## Summary
- Brief description of what this PR does and why.
- Context / motivation: link any relevant issues (e.g. Fixes #123).

## Type of change
- [ ] Bugfix
- [ ] New feature
- [ ] Breaking change
- [ ] Refactor
- [ ] Documentation
- [ ] Tests
- [ ] CI / infra

## Checklist
- [ ] I have read the contributing guidelines.
- [ ] Linked any related issue(s) (e.g., `Fixes #123`).
- [ ] Code builds locally and passes linting.
- [ ] All new and existing tests pass.
- [ ] I added tests that cover my changes (if applicable).
- [ ] I updated relevant documentation (README, docs, inline comments).
- [ ] No sensitive data, passwords, or keys are included.

## What changed
Describe the changes at a high level. For each change, note which files or modules were affected and why.

Example:
- Added `auth/refresh.ts` to support refresh tokens
- Updated `User` model with `refreshTokenVersion` field

## How to verify / QA steps
Provide step-by-step instructions a reviewer or QA engineer can use to test the change:
1. Checkout the branch
2. Run command(s): `npm ci && npm test` or `docker-compose up --build`
3. Example requests (curl / payloads) and expected responses
4. Any environment variables/migration steps required

## Screenshots / Recordings
If this is a UI change, include screenshots, animated GIFs, or short recordings showing the change.

## Rollout / Migration plan
- Will this require a DB migration? [ ] Yes [ ] No
- If yes, include migration commands, downtime requirements, and rollback steps.

## Backwards compatibility & Breaking changes
- Does this change break existing behavior? [ ] Yes [ ] No  
If Yes — describe the breaking changes and how to migrate existing users/data.

## Security considerations
- Any security impact? (e.g., new token storage, CORS changes)
- Steps taken to mitigate security issues or pointer to a security review.

## Release notes (one-liner)
A short sentence suitable for CHANGELOG or release notes.

## Related PRs / References
- Link any design docs, RFCs, or other PRs.

## Suggested reviewers
- @team/member1, @team/member2 or tag a review team: @org/team
