# University ERP — Project Rules & Conventions

> These rules apply to all contributors. Follow them consistently across the entire codebase.

---

## 1. Git Workflow

### Branching Strategy
```
main          → production-ready, protected branch
              → only merged via PRs, never committed directly

feature/t{N}-{short-name}   → one branch per implementation task
fix/{short-description}     → bug fixes
chore/{short-description}   → config, deps, tooling changes
```

**Examples:**
```
feature/t4-dsa-engine
feature/t7-fees
fix/attendance-duplicate-check
chore/update-dependencies
```

### Commit Message Format (Conventional Commits)
```
<type>(<scope>): <short description>

Types:
  feat     → new feature
  fix      → bug fix
  chore    → tooling, deps, config
  test     → test files only
  refactor → code restructure without behavior change
  docs     → documentation changes
  style    → formatting, no logic change
  perf     → performance improvement
```

**Examples:**
```
feat(auth): add JWT refresh token rotation
fix(attendance): prevent duplicate mark submission (409)
test(dsa): add unit tests for MaxHeap operations
chore(docker): add health check to server Dockerfile
feat(fees): integrate Razorpay webhook with HMAC verification
```

### Pull Request Rules
- PR must pass all GitHub Actions checks before merge
- PR description must include: what changed, how to test, screenshots (for UI changes)
- No direct pushes to `main`
- Squash merge preferred for feature branches

---

## 2. Folder & File Naming

### General
- **Files:** `camelCase.ts` for TypeScript, `PascalCase.tsx` for React components
- **Folders:** `camelCase` (e.g., `controllers/`, `dsa/`, `components/`)
- **Mongoose models:** `PascalCase.ts` (e.g., `User.ts`, `FeeStructure.ts`)
- **React pages:** `PascalCase.tsx` in `pages/<role>/` (e.g., `pages/student/Fees.tsx`)
- **Shared components:** `PascalCase.tsx` in `components/` (e.g., `SummaryCard.tsx`)
- **Redux slices:** `camelCaseSlice.ts` (e.g., `authSlice.ts`)
- **RTK Query APIs:** `camelCaseApi.ts` (e.g., `feesApi.ts`)
- **Handlebars templates:** `camelCase.hbs` (e.g., `receipt.hbs`)

### Server Route Naming
- All routes lowercase, hyphen-separated: `/fees/pay/online`, `/timetable/generate`
- Resource IDs as path params: `/users/:userId`, `/exams/results/:studentId`
- Use plural nouns for collections: `/users`, `/departments`, `/subjects`
- Nested resources shallow where possible: `/attendance/student/:studentId/summary`

---

## 3. TypeScript Rules

- `strict: true` in all `tsconfig.json` files — no exceptions
- No `any` type — use `unknown` and narrow, or define proper interfaces
- All function parameters and return types explicitly typed
- All Mongoose document types defined with an interface extending `Document`
- Shared types between client and server go in `server/src/dsa/scheduler/types.ts` (DSA) or a `shared/` package (future)
- Use `enum`-like `as const` objects over TypeScript `enum` for runtime safety:
  ```typescript
  // Preferred
  export const ROLES = {
    SUPER_ADMIN: 'super_admin',
    HOD: 'hod',
    FACULTY: 'faculty',
    STUDENT: 'student',
    FINANCE_OFFICER: 'finance_officer'
  } as const;
  export type Role = typeof ROLES[keyof typeof ROLES];
  ```

---

## 4. API Design Rules

- All API routes prefixed: `/api/v1/`
- All responses follow this shape:
  ```json
  // Success
  { "status": "success", "data": { ... } }

  // Success (list)
  { "status": "success", "data": { "items": [...], "total": 100, "page": 1, "limit": 20 } }

  // Error
  { "status": "error", "statusCode": 400, "message": "Validation failed", "errors": [...] }
  ```
- HTTP status codes used correctly:
  - `200` — OK (GET, PUT success)
  - `201` — Created (POST success)
  - `204` — No Content (DELETE success)
  - `400` — Bad Request (validation error)
  - `401` — Unauthorized (no/invalid token)
  - `403` — Forbidden (wrong role)
  - `404` — Not Found
  - `409` — Conflict (duplicate)
  - `422` — Unprocessable Entity (business logic error)
  - `500` — Internal Server Error (unexpected)
- All controller functions wrapped with `catchAsync()` — no unhandled promise rejections
- All request bodies validated with Zod before reaching the controller

---

## 5. Database Rules

- All Mongoose models use `timestamps: true` — auto `createdAt` / `updatedAt`
- No raw MongoDB queries — always use Mongoose model methods
- Sensitive fields (passwords, tokens) use `select: false` in schema definition
- All `ObjectId` references declared with `ref` for population
- Indexes defined in schema, not as ad-hoc queries
- No storing plain-text passwords — always bcrypt with `saltRounds: 12`
- Monetary values stored as integers in smallest unit (paise, not rupees)
- All currency display formatting done on the frontend, not in DB

---

## 6. Security Rules

- Never log or return `passwordHash`, JWT secrets, or payment credentials
- All payment webhook endpoints verify signature before processing
- Rate limiting on auth endpoints: `express-rate-limit` (max 10 requests / 15 min on `/auth/login`)
- CORS configured to allow only `CLIENT_URL` origin
- `helmet()` middleware on all Express routes
- HTTP-only + Secure cookies for refresh tokens
- `MONGO_URI` never hardcoded — always from `process.env`
- Input sanitization: `mongo-sanitize` middleware to prevent NoSQL injection
- File uploads: validate MIME type and file size (Multer config)
- All S3 / storage URLs use signed URLs for private documents (hall tickets, transcripts)

---

## 7. Frontend Rules

### Component Structure
```
components/
  SummaryCard/
    index.tsx       ← component export
    SummaryCard.tsx ← implementation
    types.ts        ← prop types
```

### State Management Rules
- Global auth state, user data, and notifications → Redux
- Server data (API responses) → RTK Query (not manual fetch + useState)
- Local UI state (modals open/close, form values) → `useState` / `useReducer`
- Never store access tokens in `localStorage` or `sessionStorage`

### Form Rules
- All forms use `react-hook-form` + `zodResolver`
- Define Zod schema first, infer TypeScript type from it:
  ```typescript
  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8)
  });
  type LoginForm = z.infer<typeof loginSchema>;
  ```
- Show inline validation errors below each field on blur
- Disable submit button while form is submitting

### UI Rules
- Use shadcn/ui components as base — do not write raw HTML buttons/inputs
- All pages must have a `<title>` set via React Helmet or equivalent
- Loading states: skeleton loaders (not spinners) for data-fetching
- Empty states: always show helpful message + CTA, never blank white space
- Error states: toast for server errors, inline text for validation errors
- All currency values formatted as: `₹1,23,456.00` (Indian number format)
- All dates formatted as: `DD MMM YYYY` (e.g., `15 Jan 2025`)

---

## 8. DSA Engine Rules

- DSA modules are pure functions — no Mongoose queries inside `dsa/` folder
- All data is passed as plain objects matching interfaces in `types.ts`
- `generateTimetable()` must complete or throw within 30 seconds (timeout guard)
- Backtracking depth cap: `MAX_BACKTRACK_DEPTH = 500` (configurable via constant)
- DSA modules must have 100% unit test coverage (Jest)
- No external algorithm libraries — implement from scratch (educational purpose)
- Each module exports only its public API — internal helpers are not exported

---

## 9. Testing Rules

- Test file location mirrors source: `src/dsa/heap.ts` → `src/dsa/heap.test.ts`
- Test naming: `describe('ModuleName') > it('should <expected behavior>')`
- All new API endpoints must have at least:
  - One happy-path test (correct input → expected response)
  - One auth guard test (no token → 401, wrong role → 403)
  - One validation test (bad input → 400 with error message)
- DSA modules: unit test each function in isolation with mock data
- Never test implementation details — test observable behavior
- Test the 75% attendance threshold precisely (74% → warning, 75% → no warning)

---

## 10. DevOps Rules

- Never commit `.env` files — `.gitignore` must include `.env` always
- Docker images must be built for `linux/amd64` platform (EC2 compatibility)
- All secrets go in GitHub Secrets — never hardcoded in `ci-cd.yml`
- Production images always tagged with both `:latest` and `:<git-sha>`
- `docker-compose.prod.yml` must have `restart: always` on all services
- Health check endpoint (`GET /api/v1/health`) must return `200` for deploy to succeed
- Never run `docker-compose down -v` on production (deletes MongoDB volume)
- Nginx logs should be accessible: `docker logs <nginx-container>`

---

## 11. PDF Generation Rules

- All PDF templates stored in `server/src/templates/` as `.hbs` files
- PDFs streamed directly to client (`res.setHeader('Content-Type', 'application/pdf')`)
- Never store PDFs permanently on server filesystem (use `/tmp`, stream, or S3)
- Puppeteer launched with:
  ```typescript
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  ```
- PDF generation wrapped in try/catch — if it fails, return 500 with clear error message
- All PDFs must include: university name, generation timestamp, and page numbers

---

## 12. Email Rules

- All emails sent asynchronously — never block the API response waiting for email
- Email failures are logged but do not fail the main operation (payment still recorded if email fails)
- Email templates stored in `server/src/templates/` as `.hbs` files (separate from PDF templates)
- Always include plain-text fallback in email (not HTML-only)
- Subject lines follow format: `[University ERP] <action description>`
  - e.g., `[University ERP] Fee Receipt - ₹14,050 - 15 Jan 2025`
  - e.g., `[University ERP] Attendance Warning - Data Structures (68%)`
- All emails must include unsubscribe footer (legal compliance)
- Never include sensitive data (passwords, full card numbers) in email body

---

## 13. Code Review Checklist

Before marking a PR ready for review, verify:
- [ ] TypeScript strict mode passes (`tsc --noEmit` exits 0)
- [ ] ESLint passes with zero errors
- [ ] All tests pass (`npm test` exits 0)
- [ ] No hardcoded secrets or credentials
- [ ] New endpoints have role guards applied
- [ ] New Mongoose queries have appropriate indexes
- [ ] UI changes tested on mobile viewport
- [ ] No `console.log` left in production code (use a logger)
- [ ] API response shape follows the standard format
- [ ] Error cases handled (not just happy path)
