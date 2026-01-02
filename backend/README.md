# Otomohan Backend (Fastify)

This directory hosts a Fastify + TypeScript backend that will gradually replace the mock server. It currently covers:

- `USER-01 GET /user/me` (extended profile fetch)
- `USER-02 PUT /user/profile` (basic profile update)
- `USER-03 PUT /user/avatar` (multipart avatar upload)
- `USER-04 PUT /user/password` (change password)
- `USER-05 DELETE /user/delete` (account soft delete)
- `OTOMO-01 GET /otomo/list` (fetch otomo directory)
- `OTOMO-02 GET /otomo/{id}` (fetch otomo detail)
- `OTOMO-03 GET /otomo/{id}/reviews` (paginated reviews)
- `OTOMO-04 PUT /otomo/status` (update otomo availability)
- `SET-01 GET /settings` (fetch consolidated app settings)
- `SET-02 PUT /settings/notifications` (update notification toggles)
- `AUTH-01 POST /auth/signup` (create a new user session)
- `AUTH-02 POST /auth/login` (authenticate an existing user)
- `AUTH-03 POST /auth/logout` (terminate client session)
- `AUTH-04 POST /auth/refresh` (issue a new access token)
- `AUTH-05 GET /auth/me` (fetch authenticated user profile)
- `WAL-01 GET /wallet/balance` (fetch wallet balance)
- `WAL-02 GET /wallet/plans` (list wallet charge plans)
- `WAL-03 POST /wallet/charge` (apply a purchased plan to wallet)
- `WAL-04 GET /wallet/purchase-history` (list wallet charge history)
- `WAL-05 GET /wallet/usage` (list wallet usage history)
- `CALL-01 GET /calls` (list call history for the authenticated account)
- `CALL-02 GET /calls/{id}` (fetch call detail with billing units)
- `CALL-03 GET /calls/{id}/billing` (fetch per-minute billing units only)
- `CALL-04 POST /calls/debug/end` (force-end a call for local debugging)
- `WS-C01 call_request` (WebSocket event for initiating a call request)
- `WS-S02 call_accepted` (WebSocket push informing the caller that an otomo accepted)
- `WS-S03 call_rejected` (WebSocket push informing the caller that an otomo rejected)

## Scripts

```bash
npm install      # install dependencies
npm run dev      # start Fastify with ts-node-dev
npm run build    # emit compiled JS to dist/
npm start        # run compiled server
npm run lint     # eslint over src
```

## Environment

Copy `.env.example` to `.env` and edit as needed.

| Variable       | Description                             |
| -------------- | --------------------------------------- |
| `PORT`         | Port Fastify should bind to             |
| `DATABASE_URL` | Placeholder DSN for future DB wiring    |
| `JWT_SECRET`   | Secret used by auth plugin (mocked now) |

## Project layout

```
src/
  app.ts              # builds Fastify instance
  index.ts            # bootstraps server
  plugins/auth.ts     # mock auth plugin injecting req.user
  routes/user/me.ts   # USER-01 route declaration
  routes/user/profile.ts # USER-02 route declaration
  controllers/        # request handlers
  services/           # domain logic
  repositories/       # persistence access (mocked)
  db/                 # placeholder database client
  types/fastify.d.ts  # custom Fastify typings
```

## Next steps

- Swap the in-memory repositories with real DB accessors.
- Replace the auth mock with JWT verification.
- Add integration tests once persistence is wired up.
