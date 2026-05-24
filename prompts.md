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
> "Home assignment we need to do together — I'm using VS Code with TypeScript. Let's go step by step, I want to be part of it and you will explain me what you are doing."

This set the tone for a learning-focused collaboration rather than full autonomous code generation.

### Architecture Planning
> "Now that you have all the details, make me a plan.md and make it downloadable"

Claude produced a complete 12-step build plan covering all modules, endpoints, business rules, and technical decisions. The plan became our contract.

### Unit Testing Skill Creation
> "Don't we need to make unit test parallel? I also need validation to pipes. And let's maybe do skill of unit test"

Claude created the `nestjs-unit-testing` skill file that we referenced throughout the project for consistent test patterns.

### Step-by-Step Implementation
For each module (Users, Auth, Projects, Tickets, Comments, Audit, Attachments, Scheduler), the prompt pattern was:
> "GO"

Claude then provided:
- The full file list for the step
- Each file with explanatory comments
- The matching spec file with realistic test cases
- Instructions for updating `app.module.ts`
- A manual Postman test to verify the feature works

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

## What Claude Did Well
- **Caught missing pieces** when I asked it to audit (missing specs, missing test cases)
- **Explained concepts clearly** — JWT, optimistic locking, soft delete, mentions parsing
- **Adapted to my pace** — when I asked to slow down or restart a section, it did
- **Held me accountable** to the plan ("you said we'd be at Projects, you skipped to Tickets")

## What I Had to Watch For
- Sometimes Claude provided code with the right structure but missed the spec file — I learned to ask for it explicitly
- Cascading errors from one corrupted file meant scrapping and re-pasting entire files rather than incremental edits
- When in doubt I asked Claude to give me the complete clean file rather than patches

---

## Final Result
- 10 test suites
- 60 tests passing
- All required endpoints implemented
- All extended features implemented (3.1 – 3.8)
- Role-based access for admin-only endpoints
- Soft delete + restore for tickets and projects
- @mention parsing with case-insensitive lookup
- Auto-assignment by workload with deterministic tie-breaking
- Auto-escalation scheduler (hourly cron + manual ADMIN trigger)

---

## Files Submitted from AI Collaboration
- `plan.md` — full build plan
- `prompts.md` — this file
- `run.md` — setup and run instructions
- `skills/nestjs-unit-testing/SKILL.md` — custom testing skill
