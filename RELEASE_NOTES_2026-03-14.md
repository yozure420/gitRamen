# GitRamen Release Notes
Date: 2026-03-14
Scope: `backend/**/*`, `frontend/src/**/*`, `docker-compose*.yml`, `frontend/nginx.conf`, `frontend/vite.config.ts`, `frontend/package.json`, `backend/requirements.txt`, `backend/Dockerfile.*`, `frontend/Dockerfile.*`

## 1. Product Overview
GitRamen is a Git-learning typing/action game where players execute Git commands as ramen kitchen operations.
Main gameplay now uses pull-based order intake, branch/lane management, step workflows, and delivery evaluation with customer reactions.

## 2. Major Gameplay Features
1. Pull-based start flow: game starts without active ramen; `git pull` receives an order and starts one ramen run (`frontend/src/hooks/useGmScreen.ts`, `frontend/src/game/handleGameCommand.ts`).
2. Step workflow model per ramen: each ramen has `steps`, `currentStepIndex`, `expectedInputs`, and per-step metadata (`frontend/src/types/interface.ts`, `frontend/src/game/gameEngine.ts`).
3. Dynamic order generation: random ramen base/topping and lane-aware workflow generation (`frontend/src/game/commandLogic.ts`).
4. Random customer-arrival event: message `お客さんいらっしゃいました！！いらっしゃいませ～！` can appear and require `git branch <name>` (`frontend/src/game/commandLogic.ts`).
5. Lane-specific command variation by lane count/target lane: lane-dependent first step (`git status`, `git log --oneline`, or direct add flow) (`frontend/src/game/commandLogic.ts`).
6. Branch/lane creation and switching:
`git branch <name>` creates lane (up to max lanes), `git checkout <name>`/`git switch <name>` moves to existing lane, `git checkout -b <name>` creates and switches (`frontend/src/game/handleGameCommand.ts`).
7. Existing branch validation: checkout to existing branch is always allowed; unknown branch returns clear error with branch list (`frontend/src/game/handleGameCommand.ts`).
8. Push freedom and penalties: `git push origin main` allowed even out-of-order; can accelerate ramen early and still fail at delivery by state (`frontend/src/game/handleGameCommand.ts`, `frontend/src/game/gameEngine.ts`).
9. Wrong-target push complaint: pushing to `origin main` from non-main lane triggers dedicated complaint outcome (`frontend/src/game/handleGameCommand.ts`, `frontend/src/game/gameEngine.ts`, `frontend/src/types/interface.ts`).
10. Empty-push complaint: push without commit causes separate failure path and customer warning (`frontend/src/game/gameEngine.ts`).
11. Delivery outcome system with scores/messages/warnings: success, wrong lane, wrong push target, missing topping, workflow incomplete (`frontend/src/game/gameEngine.ts`).
12. Time-limit loop: 60-second session with pause behavior and retry dialog (`frontend/src/hooks/useGmScreen.ts`, `frontend/src/hooks/useGameEffects.ts`).
13. Score updates by command step and delivery outcome with course scaling (`frontend/src/game/handleGameCommand.ts`, `frontend/src/game/gameEngine.ts`).

## 3. Command Handling Details
1. Input normalization: whitespace/full-width space normalization and lowercase matching (`frontend/src/game/handleGameCommand.ts`).
2. Command history tracking with timestamp per input (`frontend/src/game/handleGameCommand.ts`, `frontend/src/types/interface.ts`).
3. Order acceptance command: `git pull` spawns new order only when no active ramen (`frontend/src/game/handleGameCommand.ts`, `frontend/src/hooks/useGmScreen.ts`).
4. Add handling: supports `git add <item>` and `git add .`, validates item existence/duplication (`frontend/src/game/handleGameCommand.ts`).
5. Commit handling: validates current step and advances workflow (`frontend/src/game/handleGameCommand.ts`).
6. Status handling: `git status` opens transient kitchen status window with item/commit/push state (`frontend/src/game/handleGameCommand.ts`).
7. Log handling: `git log` / `git log --oneline` opens receipt modal and does not pause movement (`frontend/src/game/handleGameCommand.ts`, `frontend/src/components/gm/GmCenterPanel.tsx`).
8. Help handling: `git help` toggles help panel and pause (`frontend/src/game/handleGameCommand.ts`, `frontend/src/components/gm/GmLeftPanel.tsx`).
9. Unknown/out-of-order feedback: explicit step guidance and command mismatch messages (`frontend/src/game/handleGameCommand.ts`).

## 4. UI/UX Features
1. Four-panel game screen: left status, center lanes, right toppings, bottom command input (`frontend/src/pages/GmScreen.tsx`).
2. Left panel features: score/time/course, active ramen cards, branch-name lane status, workflow progress, staged toppings (`frontend/src/components/gm/GmLeftPanel.tsx`).
3. Center panel features: lane rendering, moving ramen sprites, topping overlays, push-ready badge, random customer avatars (`frontend/src/components/gm/GmCenterPanel.tsx`).
4. Branch-name lane labels: lane numbers replaced by branch-based names, fallback to `Lane N` if branch not present (`frontend/src/components/gm/GmLeftPanel.tsx`, `frontend/src/components/gm/GmCenterPanel.tsx`).
5. Customer complaint bubble: wrong deliveries and push mistakes display lane-targeted warning bubble (`frontend/src/components/gm/GmCenterPanel.tsx`, `frontend/src/hooks/useGameEffects.ts`).
6. Status overlay window: transient center overlay for kitchen/event notices (`frontend/src/components/gm/GmCenterPanel.tsx`).
7. Receipt-style log modal: history shown as receipt, includes compact/full modes (`frontend/src/components/gm/GmCenterPanel.tsx`).
8. Keyboard UX: log modal closes on `Enter` key (`frontend/src/components/gm/GmCenterPanel.tsx`).
9. Input UX: command box auto-focus/blur refocus and message color coding (`frontend/src/components/gm/GmBottomPanel.tsx`).

## 5. Start Flow and Navigation
1. Title/menu routing by local screen state (`frontend/src/App.tsx`, `frontend/src/pages/TitlePage.tsx`).
2. Command-based difficulty selection in start screen:
`git clone easy`, `git clone normal`, `git init` then `git remote add high|god` (`frontend/src/pages/GmStart.tsx`).
3. Course propagates to game screen and affects scoring/command pool (`frontend/src/App.tsx`, `frontend/src/hooks/useGmScreen.ts`).
4. Auxiliary pages: HowToPlay, Settings, MyPage, Login, Registration (`frontend/src/pages/HowToPlay.tsx`, `frontend/src/pages/Settings.tsx`, `frontend/src/pages/MyPage.tsx`, `frontend/src/pages/Login.tsx`, `frontend/src/pages/Registration.tsx`).

## 6. Audio and Visual Assets
1. SFX playback for type/miss/correct with toggle-aware playback (`frontend/src/lib/Sounds.ts`, `frontend/src/pages/Settings.tsx`).
2. BGM playback from `/public/sounds/game-bgm.mp3` with start/stop lifecycle (`frontend/src/lib/Sounds.ts`, `frontend/src/pages/GmScreen.tsx`).
3. Dynamic image resolution by ramen keyword and topping item (`frontend/src/components/gm/GmCenterPanel.tsx`).
4. Asset categories in source:
`frontend/src/assets/ramen/*`, `frontend/src/assets/topping/*`, `frontend/src/assets/human/*`, `frontend/src/assets/sounds/*`.

## 7. Frontend API Integration
1. Command API client: random commands + course catalog with excluded IDs for gameplay (`frontend/src/api/cmdFetch_1.ts`).
2. Auth API client: register/login/me, token save/get/remove via localStorage (`frontend/src/api/auth.ts`).

## 8. Backend Features
1. FastAPI application with CORS, health/root endpoints, and auth router mount (`backend/app.py`).
2. Command endpoints:
`GET /api/commands/random`, `GET /api/commands/course`, `GET /api/commands/{id}`, `POST /api/commands/check` (`backend/app.py`).
3. Auth endpoints:
`POST /auth/register`, `POST /auth/login`, `GET /auth/me` with Bearer token validation (`backend/routers/auth.py`).
4. JWT auth implementation with configurable algorithm/expiry and env-based settings (`backend/auth/jwt.py`, `backend/auth/config.py`).
5. Password hashing/verification via bcrypt (`backend/auth/password.py`).
6. SQLAlchemy models:
users, command, history, miss and relationships (`backend/models/user.py`, `backend/models/cmd.py`, `backend/models/history.py`, `backend/models/miss.py`, `backend/models/__init__.py`).
7. Pydantic schemas for auth and command objects (`backend/schemas/auth.py`, `backend/schemas/cmd.py`, `backend/schemas/__init__.py`).
8. Command CRUD helper functions including random/course query and bulk create (`backend/crud/cmd.py`).
9. Lightweight schema migration on startup/seed to ensure `command.game_note` exists (`backend/app.py`, `backend/seed.py`).
10. Seed script with course-based command master data population (`backend/seed.py`).
11. SQLite session/engine dependency management (`backend/database.py`).

## 9. Infrastructure and Runtime
1. Dev compose stack:
backend uvicorn reload + frontend bun vite dev + sqlite volume (`docker-compose.dev.yml`).
2. Prod compose stack:
backend gunicorn + frontend nginx static hosting (`docker-compose.yml`).
3. Backend containers:
Python 3.12 slim, dev/prod Dockerfiles (`backend/Dockerfile.dev`, `backend/Dockerfile.prod`).
4. Frontend containers:
Bun dev image and Bun-build + Nginx prod image (`frontend/Dockerfile.dev`, `frontend/Dockerfile.prod`).
5. Frontend dev server config:
0.0.0.0 host, Docker polling watch, `/api` proxy to backend (`frontend/vite.config.ts`).
6. Nginx config:
SPA fallback and `/api/` reverse proxy (`frontend/nginx.conf`).
7. Dependency manifests:
frontend scripts/deps (`frontend/package.json`), backend deps (`backend/requirements.txt`).

## 10. Data Types and Game State Structures
1. Core interfaces: `Command`, `Ramen`, `CommandStep`, `OrderLog`, `CustomerAlert`, `StatusWindowData`, `SoundSettings` (`frontend/src/types/interface.ts`).
2. `Ramen` includes explicit branch/push-related flags:
`currentLane`, `targetLane`, `isCommitted`, `isPushed`, `pushedToMainFromOtherLane`, `isPushReady`, `speed` (`frontend/src/types/interface.ts`).

## 11. Notable Behavioral Changes Included in This Build
1. StrictMode-free render entry (single render behavior) (`frontend/src/main.tsx`).
2. Pull-to-start order lifecycle replaces auto-spawn loop (`frontend/src/hooks/useGmScreen.ts`).
3. Branch-name lane display in both lane labels and status lines (`frontend/src/components/gm/GmCenterPanel.tsx`, `frontend/src/components/gm/GmLeftPanel.tsx`).
4. Enter-key close behavior for git log modal (`frontend/src/components/gm/GmCenterPanel.tsx`).
5. Wrong push target complaint path for `git push origin main` from non-main lane (`frontend/src/game/handleGameCommand.ts`, `frontend/src/game/gameEngine.ts`).
6. Random customer-arrival branch-creation order event with explicit status notice (`frontend/src/game/commandLogic.ts`, `frontend/src/hooks/useGmScreen.ts`).

## 12. Known Constraints (Current Implementation)
1. Branch max count is fixed at 3 (`frontend/src/hooks/useGmScreen.ts`, `frontend/src/game/handleGameCommand.ts`).
2. `git push origin main` is the only recognized push command (`frontend/src/game/handleGameCommand.ts`, `frontend/src/game/commandLogic.ts`).
3. `useRamenSpawner` remains in code but current pull-flow does not use it (`frontend/src/hooks/useGameEffects.ts`).
4. MyPage currently uses mock data and is not wired to backend history/miss tables (`frontend/src/pages/MyPage.tsx`).
5. Title page has a registration button with no wired action callback (`frontend/src/pages/TitlePage.tsx`).
6. Frontend API base in `cmdFetch_1.ts` is hardcoded to `http://localhost:8000` (`frontend/src/api/cmdFetch_1.ts`).

## 13. File-by-File Coverage Note
This release note was generated after direct inspection of all source/config files under:
`backend/**/*` and `frontend/src/**/*`, plus deployment/runtime files at repository root and frontend/backend Docker/proxy/build configs.
Binary asset files are covered functionally by category and usage mapping.
