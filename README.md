# MagnetarSophia

MagnetarSophia is an Angular 21 academic progress dashboard for tracking exam progress, ECTS accumulation, projected completion pace, and editable JSON-backed timeline data.

Repository: `https://github.com/scherenhaenden/MagnetarSophia`
Branch: `master`

## Current Scope

The application currently includes:

- a typed academic progress domain model
- an OOP-oriented progress service for projections, mapping, and JSON parsing
- a standalone Angular dashboard component for rendering metrics and chart data
- unit tests for the component and service
- a dedicated coverage script with a required global threshold of `100%`

## Project Structure

- `src/app/models/academic-progress.models.ts`: typed domain contracts
- `src/app/services/academic-progress.service.ts`: academic progress logic
- `src/app/services/academic-progress.service.spec.ts`: service tests
- `src/app/app.ts`: standalone Angular dashboard component
- `src/app/app.spec.ts`: component tests
- `src/test-setup.ts`: Vitest Angular test bootstrap
- `RULES.md`: mandatory project rules
- `whole-example`: original source example kept as reference input

## Scripts

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm start
```

Build the project:

```bash
npm run build
```

Run the standard Angular test suite:

```bash
npm test -- --watch=false
```

Run coverage with enforced global thresholds:

```bash
npm run test:coverage
```

Run coverage in watch mode:

```bash
npm run test:coverage:watch
```

## Coverage Policy

Coverage thresholds are configured in `vitest.config.ts` and are currently set to:

- `lines: 100`
- `functions: 100`
- `branches: 100`
- `statements: 100`

If coverage drops below any threshold, the coverage command must fail.

## Rules

The authoritative coding rules are documented in `RULES.md`.

Current mandatory rules include:

1. Every method must be tested.
2. Every method must be documented.
3. Every method must declare a return type.
4. The codebase must stay strongly typed.
5. The codebase must stay extremely OOP-oriented.
6. Every class member must declare an access modifier.

## Current Status

The current dashboard build passes, the regular test run passes, and the enforced coverage run passes with a `100%` threshold on the authored business-logic coverage scope configured in `vitest.config.ts`.
