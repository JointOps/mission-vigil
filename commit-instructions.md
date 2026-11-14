# Team roles and commit instructions

This plan covers the five final Team JointOps members listed below. Responsibilities reflect the team owner’s description of each member’s strengths; they do not claim authorship of prior work. Space Apps handles and GitHub accounts are distinct.

| Team member | Space Apps handle | GitHub account | Responsibility |
|---|---|---|---|
| Shayan Hussain (Team Owner) | @rockstarsb | [ShayanHussainSB](https://github.com/ShayanHussainSB) | Backend architecture, simulation engine, integration, and deployment. |
| AbdulMoiz Yousuf | @moizyousuf | [MoizYousuf](https://github.com/MoizYousuf) | Frontend lead: interface architecture, controls, and accessibility. |
| Owais Iqbal | @owaistar | [owais-star](https://github.com/owais-star) | AI, project management, game design, and gameplay coordination. |
| Zoha Hasan | @zo._ha | **To be confirmed** | Documentation, research and source checks, and submission copy. |
| Maha Waris Khan | @mahawaris | [MahaWarisKhan](https://github.com/MahaWarisKhan) | Frontend support: interface components, responsive layout, and UI testing. |

The first three accounts are likely matches based on JointOps membership and profile names; the team should confirm them. Maha's account was supplied by the team owner and matches her public profile. Zoha's GitHub account remains unconfirmed. Do not guess her username or tag or assign team members on GitHub.

## Principles

- Credit the person who actually authored a change. Each member commits from their own GitHub account and uses a name and email associated with that account. Do not manufacture commits or attribute someone else's work to a teammate to change contribution statistics.
- For genuine collaboration, include a `Co-authored-by: Name <email>` trailer only with that person's agreement and an email they choose that GitHub can associate with their account. Do not publish private email addresses without consent.
- Keep commits small, coherent, and descriptive. Use `feat/` and `fix/` branches and small pull requests. A role is a coordination lead, not an exclusive claim on files.
- Never commit secrets or `.env` files. Keep all text in English, use only original or properly licensed assets, and retain the source and AI disclosures. No accounts, personal-data collection, or analytics.
- Run `npm run lint`, `npm test`, and `npm run build` on the final combined change before merging. Resolve dependencies between branches before claiming a feature works.

## Suggested sequence for future work

These are work packages, not preassigned authors or promises that a particular person did existing work. The contributor who performs each task owns its commit or commits.

1. **Restore the source whitepaper:** restore the original unchanged `docs/WHITEPAPER.md`, verify it against the source, and commit the restoration.
2. **Engine and validation:** resource simulation, constants and tests in `engine/`; group each independently working change in its own commit.
3. **3D and interactions:** base scene, accessible interactions, and performance in `components/three/`; separate scene work from interaction work when practical.
4. **Interface and guidance:** meters, panels, ARIA dialogue, keyboard/touch accessibility and responsive behavior in `components/ui/` and `app/`.
5. **Levels, scoring and learning:** playable level work, report cards, debriefs, and knowledge checks; split by working feature or level.
6. **Quality and release:** playtest fixes, source verification, demo assets, submission checklist, and deployment documentation. Commit each meaningful outcome under its actual author.

Example commit subjects: `feat: add power allocation controls`, `fix: preserve oxygen during level restart`, `docs: verify radiation sources`, `test: cover resource depletion`. These are examples, not claims that the work is done.

## Existing history and uncommitted changes

The repository currently has a pushed scaffold commit and substantial uncommitted work. Do not reset, clean, rebase, force-push, or reconstruct history while those changes are unprotected. The team should first inspect and preserve the working tree and agree on accurate authorship for any already-completed work. Existing work must not be split into artificial commits under other identities.

If the team still wants to rewrite public history, prepare and review a concrete migration separately, coordinate with everyone who has cloned or branched from the repository, and get explicit approval immediately before any force push. Rewriting changes commit IDs and can disrupt clones, branches, and references. A history rewrite is not needed for genuine future team contributions.
