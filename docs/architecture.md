# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

These decisions keep the service aligned to the three-tier architecture and the contract in this repository.

- Presentation tier decision: Build the UI as a React 19 single-page app using Vite, React Router, and Bootstrap. The browser should interact only through the shared API client in `octofit-tracker/frontend/src/api/client.ts`, with page-level components responsible for rendering loading, empty, success, and error states without embedding business logic in the UI.
- Logic tier decision: Keep route handlers thin and delegate all behavior to explicit Express services. Validation and error handling stay in the API layer so routes return deliberate 4xx errors for invalid IDs, missing fields, or unmatched resources instead of leaking raw Mongo/Mongoose cast exceptions.
- Data tier decision: Use MongoDB with Mongoose models for users, teams, activities, and seed data. Fixtures are managed with stable upserts so the demo environment remains reproducible while preserving any prior user data; schema validation handles required fields and reference integrity, while services compute derived values such as leaderboard totals and activity points.
- Activity tracking approach: Store each activity as a persisted record with `user`, `team`, `type`, `minutes`, computed `points`, and `occurredAt`. A POST request validates both referenced IDs and records a single deliberate 4xx when either ID is invalid, then creates the activity with normalized fields that match the API contract.
- Team management approach: Teams are created and listed with a required `name` and optional `mascot`, and team membership is tracked via the associated user/team references. Team creation rejects missing names with `400`, while list and create endpoints keep the submitted values exactly as they are provided to the database.
- Leaderboard approach: Aggregate activity points by team, sum the points for each team, sort the totals descending, and assign a 1-based rank to each result. This keeps the leaderboard resilient to new activity rows while ensuring the contract remains consistent for UI display and API consumers.
- Workout suggestions approach: Match a user by email from the seeded dataset, inspect their recent activity pattern or goal, and recommend a workout whose `focus` aligns with that pattern. When no user matches the email, the API returns a deliberate 4xx (for example `404`) so the frontend can show a clear not-found state.

## Test plan

Use the following commands as the contract-level validation loop. Failure signals are intentionally specific so they point to the layer that regressed.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` — validates seed data, Mongoose schema behavior, and data integrity rules. A failure here usually means the demo records or model validation are wrong, or the team/user relationship setup is inconsistent.
- API command: `npm run test:api --prefix octofit-tracker/backend` — verifies the public `/api/*` contract, including 4xx handling, team validation, leaderboard sorting, and workout suggestion logic. A failure here points to route/service behavior rather than a frontend or build issue.
- Frontend command: `npm test --prefix octofit-tracker/frontend` — checks component rendering and user interactions in the Vite React app. A failure usually indicates a UI contract problem, broken state handling, or a mismatch between the frontend and the API response shape.
- Backend build command: `npm run build --prefix octofit-tracker/backend` — catches TypeScript and Express integration issues across the server implementation. A failure indicates a compile-time or type-safety regression in the backend, even if runtime tests are passing.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` — ensures the React app bundles correctly in production mode. A failure usually signals mismatched imports, missing types, or invalid production configuration in the frontend layer.

The expected delivery flow is: pass the data contract tests, then the API tests, then the frontend tests, and finally both build commands. Any failure should be corrected in the corresponding tier before moving on to the next layer.
