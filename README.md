# To-Do List: weekly task planner (MERN)

A mobile-first to-do app. You create tasks with a date and time, and the home screen groups them by
week (Monday to Sunday), with open and completed counts for each week.

- **Live app:** _add your Netlify URL_
- **Stack:** React 18 + Vite + Tailwind CSS · Node.js + Express · MongoDB (Mongoose) · Netlify (static site + Functions)

## Design

The UI follows the assignment's Figma file (Poppins, royal blue `#4566EC`, square corners):
**Onboarding** (first visit only) → **Home** (search bar, Monday–Sunday day strip, Task Complete / Task
Pending cards, Weekly Progress, Tasks Today) → **Add New Task** sheet (title, Start / Ends time, date,
description) → **Search**. Where the PDF asks for more than the Figma shows (priority, status, a card per
week), those parts use the same visual style.

## Features

| Requirement | How it works |
|---|---|
| Create task | Round **+** button (adds to the day selected in the strip), or **Add task to this week** inside a week card. Title, date and start time are required; end time, description and priority (Low / Medium / High) are optional. |
| Edit task | Tap a task, or its edit icon, to open it; change any field and **Save changes**. |
| Delete task | Swipe a task left and tap **Delete** (touch or mouse drag), or tap its bin icon. |
| Search | Tap the search bar → type a keyword. Matches title and description, case-insensitive, as you type. Results can be opened, edited, ticked or deleted. |
| Weekly organisation | Weeks run Monday 00:00 to Sunday 23:59 in your time zone. The day strip moves week by week; its cards show completed and pending counts for that week. **All Weeks** lists one card per week with **Open** and **Completed** counts; tap a card to expand its tasks. |
| Status | Tick the box to mark a task **Completed**; set **To do / In progress / Completed** in the task sheet. Counts and the progress bar update immediately. "Open" means any task not completed. |
| Responsive | Phone layout first (tested from 320 px). Laptops show the home column and All Weeks side by side; the task sheet becomes a centred dialog. |

## Project structure

```
todo-app/
├── client/                 React app (Vite + Tailwind)
│   └── src/
│       ├── api/tasks.js        fetch wrapper for the API
│       ├── components/         Onboarding, HomeView, WeekStrip, WeekCard, TaskItem (swipe), TaskForm, SearchView
│       └── utils/              date and week helpers, task labels
├── server/                 Express API
│   ├── src/
│   │   ├── app.js              Express app (shared by local server and Netlify Function)
│   │   ├── index.js            local server entry
│   │   ├── db.js               cached MongoDB connection
│   │   ├── models/Task.js      Mongoose schema
│   │   ├── controllers/        request handlers
│   │   ├── routes/             /api/tasks routes
│   │   └── validation.js       input validation
│   └── tests/                  API tests (node:test + supertest + in-memory MongoDB)
├── netlify/functions/api.js    Express wrapped with serverless-http
└── netlify.toml                build, function and /api/* rewrite
```

## API

Base URL: `/api`. All bodies are JSON.

| Method | Path | Description |
|---|---|---|
| GET | `/tasks` | List tasks, sorted by due date. Query: `search`, `from`, `to` (ISO dates, `from` ≤ dueAt < `to`), `status`, `limit` (max 500). |
| GET | `/tasks/weeks?tz=Asia/Kolkata` | Week summaries: `{ weekStart, weekEnd, total, open, completed }`, weeks starting Monday in the given time zone. |
| GET | `/tasks/:id` | One task. |
| POST | `/tasks` | Create. `{ title, dueAt, endAt?, description?, priority?, status? }` |
| PATCH | `/tasks/:id` | Update any of `title`, `description`, `dueAt`, `endAt`, `priority`, `status`. |
| DELETE | `/tasks/:id` | Delete. Returns `204`. |
| GET | `/health` | Liveness check. |

Task fields: `id`, `title`, `description`, `dueAt` (start), `endAt` (optional, after `dueAt`), `priority` (`low` / `medium` / `high` / `null`),
`status` (`pending` / `in_progress` / `completed`), `completedAt`, `createdAt`, `updatedAt`.
Validation errors return `400` with `{ error, details: { field: message } }`.

Week grouping happens in MongoDB with `$dateTrunc` (`unit: "week"`, `startOfWeek: "monday"`) in the
browser's time zone, so a task at 23:30 on Sunday in India counts in that week, not the next one.

## Run locally

Requires Node.js 20+.

```bash
npm install
```

**Without a database account** (in-memory MongoDB; data is lost when you stop it):

```bash
npm run dev:memory
```

**With MongoDB Atlas:** copy `server/.env.example` to `server/.env`, set `MONGODB_URI`, then:

```bash
npm run dev
```

The app opens at http://localhost:5173, and the API runs at http://localhost:5000/api.

Tests:

```bash
npm test
```

## Deploy to Netlify

1. Create a free MongoDB Atlas cluster. Add a database user, and under **Network Access** allow
   `0.0.0.0/0` (Netlify Functions have no fixed IP). Copy the connection string.
2. Push this repo to GitHub, then in Netlify choose **Add new site → Import an existing project**.
   `netlify.toml` already sets the build command, the publish folder and the functions folder.
3. Under **Site configuration → Environment variables**, add `MONGODB_URI`.
4. Deploy. The React app and the API share one domain: `/api/*` is rewritten to the function.
