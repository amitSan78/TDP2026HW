# AI Interaction Documentation – IssueFlow

## Model Used
**Claude Sonnet 4.6** (via Claude.ai chat interface)

## Approach
I worked with Claude in a step-by-step pair-programming style. Rather than asking Claude to write the entire app at once, I broke the assignment into 12 incremental steps following the `plan.md` we created together. For each step:

1. Claude explained the concept before writing code
2. Claude provided all files with inline comments explaining the logic
3. I copied the code into VS Code and ran tests
4. We debugged compilation and runtime errors together
5. I tested every endpoint manually via Postman before moving to the next step

This approach helped me understand every line of code I submitted, not just copy-paste blindly.

---

## Skills Used

### 1. `nestjs-unit-testing`
A custom skill I created with Claude defining consistent patterns for unit testing NestJS services using Jest. Located in `skills/nestjs-unit-testing/SKILL.md`. The skill enforces:
- Co-located `*.spec.ts` files alongside services
- Mocking TypeORM repositories with `getRepositoryToken`
- Standard arrange-act-assert pattern
- Coverage of happy path + error cases (NotFoundException, ConflictException, BadRequestException)

---

## Key Prompts Used

### Initial Planning
> "I want to build this incrementally — module by module, with full understanding of each layer before moving to the next. TypeScript + NestJS stack."

I deliberately chose a structured, incremental approach over asking Claude to generate the full application at once. Each module was reviewed, tested, and validated before proceeding — ensuring full understanding and accountability over every line of code.

### Architecture Planning
> "Before writing any code, let's produce a full architectural plan covering all modules, endpoints, business rules, and technical decisions."

I drove the architecture planning phase — defining the module structure, build order, entity relationships, and key technical decisions (optimistic locking strategy, soft delete approach, JWT logout mechanism) before a single line of code was written. The resulting `plan.md` became the contract we followed throughout development.

### Unit Testing Skill Creation
> "Tests should be written in parallel with the code, not after. Let's define a consistent testing skill to enforce patterns across all modules."

I created a custom `nestjs-unit-testing` skill before writing any tests, ensuring every module followed the same patterns: co-located spec files, mocked repositories, arrange-act-assert structure, and coverage of both happy path and error cases.

### Step-by-Step Implementation
For each module (Users, Auth, Projects, Tickets, Comments, Audit, Attachments, Scheduler), I reviewed the requirements, defined what needed to be built, and directed Claude to implement it. I validated each module before moving to the next:

- Reviewed the full file list before accepting it
- Read every file and its inline comments to understand the logic
- Ran the matching spec file to confirm tests passed
- Tested every endpoint manually via Postman
- Only moved to the next module after full verification

### Debugging
When compilation errors appeared, I pasted the exact terminal output and Claude pinpointed the fix:
> "src/tickets/tickets.service.ts:34:7 - error TS2322: Type 'string | null' is not assignable to type 'string | undefined'"

Claude diagnosed nullable column type mismatches, missing imports, duplicated method bodies, and TypeORM version-specific API differences (e.g. `relations: ['x']` → `relations: { x: true }`).

### Validation
After each step, I asked Claude to verify nothing was missed:
> "Please check that you didn't miss anything else previously"

This caught a missing `attachments.service.spec.ts` and a missing test case in `comments.service.spec.ts`.

### Requirements Audit
> "Show me in the instructions files that only admin can access"

Claude cited the exact section from the requirements document (3.5 Soft Delete) confirming the ADMIN-only constraint and clarified which endpoints we added ourselves as good design (like the manual scheduler trigger).

---

## My Contributions Beyond AI Output
- **Caught missing spec files** — I noticed when Claude provided service code without the matching test file and explicitly requested it every time
- **Validated business logic independently** — I cross-referenced every constraint against the requirements document (status transitions, ADMIN-only endpoints, dependency rules) to ensure nothing was missed
- **Added self-blocking prevention** — I identified that a ticket could accidentally block itself and requested the additional validation before it became a bug
- **Enforced consistency** — I noticed the `LoginDto` was defined inline in the controller rather than in its own file like every other module, and refactored it
- **Tracked the plan** — when implementation drifted from `plan.md` I caught it and corrected the sequence
- **Handled corrupted files** — when incremental edits caused cascading TypeScript errors, I diagnosed the root cause and requested complete clean file rewrites rather than patches

## What Claude Assisted With
- Generated boilerplate code for entities, DTOs, services, and controllers
- Explained complex concepts (JWT, optimistic locking, TypeORM relations) with clear examples
- Diagnosed TypeScript compilation errors from terminal output
- Produced consistent unit test patterns following the skill we defined together
- Audited the full requirements document against the implementation when asked

---

## Final Result
- 16 test suites
- 118 tests passing
- All required endpoints implemented
- All extended features implemented (3.1 – 3.8)
- Role-based access for admin-only endpoints
- Soft delete + restore for tickets and projects
- @mention parsing with case-insensitive lookup
- Auto-assignment by workload with deterministic tie-breaking
- Auto-escalation scheduler (hourly cron + manual ADMIN trigger)
- Swagger documentation at /api/docs

---

## Files Submitted from AI Collaboration
- `plan.md` — full build plan
- `prompts.md` — this file
- `run.md` — setup and run instructions
- `skills/nestjs-unit-testing/SKILL.md` — custom testing skill
