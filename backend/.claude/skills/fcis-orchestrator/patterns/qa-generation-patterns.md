# Q&A Generation Patterns

This document defines patterns for generating clarifying questions during the Q&A phase of FCIS orchestration.

## Purpose

The Q&A phase bridges Analysis and Design by resolving ambiguities, gaps, and implementation options through interactive questioning. This ensures Design phase has complete, unambiguous requirements.

## When to Generate Questions

**Always After Analysis Phase**: Once Analysis checkpoint is approved, evaluate if Q&A is needed.

**Skip Q&A If**:
- Task description is completely clear with all specifications
- No ambiguities or gaps detected
- Only one obvious implementation approach exists
- Show message: "No ambiguities detected, proceeding to Design"

**Conduct Q&A If**:
- Missing critical specifications (auth, validation, pagination)
- Ambiguous requirements ("secure", "fast", "user-friendly")
- Multiple valid implementation options exist
- Edge cases not addressed in task description

## Gap Analysis Methodology

### 1. Collect Context from Analysis

Review these items learned during Analysis phase:
- Existing domain patterns (naming, structure, common workflows)
- Error handling conventions
- Value object usage patterns
- Authentication patterns
- Pagination approaches
- External service integrations

### 2. Parse Task Description

Identify what the task explicitly mentions:
- Domain/entity names
- Required operations (create, update, delete)
- Mentioned technologies or approaches
- Stated requirements or constraints
- Edge cases or error scenarios mentioned

### 3. Identify Gaps (Missing Information)

Compare task description against checklist:

**Authentication & Authorization**:
- [ ] Authentication method specified? (JWT, session, OAuth)
- [ ] Token expiration time defined?
- [ ] Authorization rules clear? (public, authenticated, role-based)
- [ ] Token refresh strategy needed?

**Database & Schema**:
- [ ] Table relationships defined? (one-to-many, many-to-many)
- [ ] Foreign key cascades specified? (cascade delete, set null)
- [ ] Unique constraints identified?
- [ ] Indexes for performance needed?
- [ ] Transaction strategy clear? (optimistic, pessimistic)

**Validation & Error Handling**:
- [ ] Input validation rules specified? (length, format, range)
- [ ] Custom validation logic needed?
- [ ] Error codes and messages defined?
- [ ] Retry logic for failures?
- [ ] Fallback behavior specified?

**Pagination & Filtering**:
- [ ] Pagination approach defined? (cursor, offset, none)
- [ ] Default page size specified?
- [ ] Sorting options identified?
- [ ] Filter criteria defined?

**External Services**:
- [ ] Service provider specified? (email, payment, SMS)
- [ ] Timeout values defined?
- [ ] Fallback behavior on failure?
- [ ] Rate limiting needed?

**Performance & Optimization**:
- [ ] Caching strategy needed?
- [ ] Query optimization required?
- [ ] Scalability concerns addressed?

### 4. Identify Ambiguities (Vague Information)

Look for these ambiguous terms in task description:

**Security-related**:
- "secure" → What security measures? (auth, encryption, validation)
- "protected" → Who can access? (authenticated users, specific roles)
- "private" → Private to whom? (user-specific, admin-only)

**Performance-related**:
- "fast" → What's the performance target? (< 100ms, < 500ms)
- "efficient" → Memory efficient? Time efficient? Both?
- "optimized" → For what? (read speed, write speed, storage)

**Scope-related**:
- "user management" → Which operations? (CRUD, auth, profiles, roles)
- "notifications" → What types? (email, SMS, push, in-app)
- "reporting" → What metrics? (analytics, exports, dashboards)

**Behavior-related**:
- "handle errors" → Retry? Log? Fallback? Notify?
- "validate input" → How strict? (basic, strict, custom rules)
- "process data" → Synchronous? Asynchronous? Queued?

### 5. Identify Options (Multiple Valid Approaches)

Recognize when multiple valid implementations exist:

**Authentication Options**:
- JWT tokens vs. session-based vs. OAuth2
- Short-lived (1h) vs. medium (24h) vs. long-lived (7d) tokens
- Refresh token strategy vs. re-authentication

**Database Transaction Options**:
- Optimistic locking (better performance, conflict on commit)
- Pessimistic locking (prevents conflicts, lower throughput)
- Event sourcing (full audit trail, complex implementation)

**Pagination Options**:
- Cursor-based (real-time data, handles concurrent updates)
- Offset-based (simpler, familiar, may miss records)
- No pagination (small datasets, less complexity)

**API Design Options**:
- REST (simple, widely adopted, HTTP verbs)
- GraphQL (flexible queries, more setup, learning curve)
- RPC (direct method calls, less standard)

**Caching Options**:
- In-memory (Redis) - Fast, requires infrastructure
- Application cache - Simple, limited scalability
- No cache - Simplest, may impact performance

**External Service Providers**:
- Email: SendGrid vs. AWS SES vs. Mailgun
- Payment: Stripe vs. PayPal vs. Square
- SMS: Twilio vs. AWS SNS vs. Vonage

### 6. Categorize Questions by Concern

Group questions into logical categories:

**Database Design**:
- Schema structure questions
- Relationship and constraint questions
- Index and performance questions
- Transaction strategy questions

**Business Logic**:
- Validation rule questions
- Error handling approach questions
- State transition questions
- Business rule edge case questions

**API Design**:
- Endpoint structure questions
- Authentication method questions
- Pagination approach questions
- Rate limiting questions
- Versioning questions

**External Services**:
- Provider selection questions
- Timeout and retry questions
- Fallback behavior questions
- Configuration questions

**Testing**:
- Test coverage scope questions
- Edge case identification questions
- Test data strategy questions
- Integration vs unit test questions

**Performance**:
- Caching strategy questions
- Optimization priority questions
- Scalability requirement questions
- Index strategy questions

## Question Prioritization

**Priority 1 (Critical)**: Must be answered to proceed with Design
- Authentication method (affects entire architecture)
- Core business logic rules (defines domain behavior)
- Database relationships (affects schema design)

**Priority 2 (High)**: Significantly impacts implementation
- Pagination approach (affects API design)
- Error handling strategy (affects operation design)
- External service providers (affects integration design)

**Priority 3 (Medium)**: Affects specific components
- Validation strictness (affects value objects)
- Cache strategy (affects performance)
- Rate limiting approach (affects middleware)

**Priority 4 (Low)**: Nice-to-have clarifications
- Default page sizes (can use sensible defaults)
- Token expiration times (can use industry standards)
- Timeout values (can use common values)

## Question Format Guidelines

### Structure

Each question must have:
1. **Category header** (max 12 chars): "Auth", "Database", "API", "Business", "External", "Test", "Perf"
2. **Clear question text**: Specific, actionable question
3. **2-4 options**: Each with one-line educational context
4. **Automatic "Other"**: Provided by AskUserQuestion tool

### Educational Context Format

**Good Context** (one-line, informative):
- ✅ "JWT tokens - Stateless, scales horizontally, 7-day default expiration"
- ✅ "Optimistic locking - Better performance, handles conflicts on commit"
- ✅ "Cursor-based - Better for real-time data, handles concurrent updates"

**Bad Context** (too brief or too verbose):
- ❌ "JWT tokens - Uses tokens"
- ❌ "Optimistic locking - A database concurrency control method that assumes conflicts are rare and checks for them at commit time rather than acquiring locks upfront"

### Question Examples by Category

#### Database Design

**Q**: "How should we handle deleting a user with related records?"
- A) Cascade delete - Automatically delete all related records
- B) Set null - Keep records but remove user reference
- C) Prevent deletion - Block delete if related records exist

**Q**: "Which indexes should be added for query performance?"
- A) Email column - For user lookup by email
- B) Created_at column - For sorting and time-based queries
- C) Both email and created_at
- D) No indexes yet - Optimize later based on metrics

#### Business Logic

**Q**: "How strict should password validation be?"
- A) Basic - Min 8 chars, at least one number
- B) Strict - Min 12 chars, uppercase, lowercase, number, special char
- C) Moderate - Min 10 chars, mix of letters and numbers

**Q**: "What should happen when email sending fails?"
- A) Retry 3 times with exponential backoff
- B) Log error and continue (non-critical)
- C) Fail the entire operation and rollback

#### API Design

**Q**: "Should this endpoint require authentication?"
- A) Public - No authentication needed
- B) Authenticated - Valid JWT token required
- C) Admin only - Requires admin role

**Q**: "How should API versioning work?"
- A) URL path versioning - /api/v1/resource
- B) Header versioning - Accept: application/vnd.api+json;version=1
- C) No versioning - Not needed for MVP

#### External Services

**Q**: "Which email service provider should we use?"
- A) SendGrid - Reliable, good free tier, easy setup
- B) AWS SES - Cost-effective at scale, requires AWS account
- C) Mailgun - Developer-friendly API, good documentation

**Q**: "What timeout for external API calls?"
- A) 5 seconds - Fast fail for better UX
- B) 30 seconds - Allow for slower services
- C) 60 seconds - Maximum patience for complex operations

#### Testing

**Q**: "What level of test coverage is needed?"
- A) Value objects only - Quick wins, core logic
- B) Value objects + operations - Comprehensive business logic
- C) Full coverage including workflows - Thorough but time-intensive

**Q**: "Should we create integration tests?"
- A) Yes - Test with real database (testcontainers)
- B) No - Unit tests sufficient for now
- C) Later - Start with unit tests, add integration tests after MVP

#### Performance

**Q**: "Should we implement caching?"
- A) Yes, Redis cache - For frequently accessed data
- B) Yes, in-memory cache - Simple, no infrastructure
- C) No caching initially - Premature optimization

**Q**: "What's the priority for optimization?"
- A) Read performance - Most queries are reads
- B) Write performance - High-volume writes expected
- C) Balanced - Optimize both equally

## Dynamic Question Generation

### Based on Previous Answers

**Example 1**: If user selects "Authenticated" for endpoint
→ Generate follow-up: "What authentication method?" (JWT vs Session)

**Example 2**: If user selects "External email service"
→ Generate follow-up: "Which email provider?" (SendGrid vs SES)

**Example 3**: If user selects "Pagination needed"
→ Generate follow-up: "Which pagination approach?" (Cursor vs Offset)

### Based on Task Complexity

**Simple Task** (1 CRUD operation):
- 0-4 questions total
- Focus on: Auth, validation, error handling

**Medium Task** (Multiple operations, relationships):
- 4-8 questions total
- Focus on: Auth, relationships, validation, error handling, pagination

**Complex Task** (External services, complex business logic):
- 8-12+ questions total
- Focus on: Auth, relationships, validation, external services, error handling, pagination, caching, transactions

## Contradiction Detection

### Common Contradiction Patterns

**Security vs. Simplicity**:
- Batch 1: "High security required" selected
- Batch 3: "Skip authentication for MVP" selected
- **Clarification**: "You mentioned high security but want to skip auth. Should we implement basic auth for MVP or delay feature?"

**Performance vs. Features**:
- Batch 1: "Fast performance critical" selected
- Batch 2: "Complex real-time features" selected
- **Clarification**: "Fast performance and complex real-time features can conflict. What's the priority?"

**Scope vs. Timeline**:
- Batch 1: "Full featured user management" selected
- Batch 4: "Quick MVP, minimal features" selected
- **Clarification**: "Full user management takes time. Which features are must-haves for MVP?"

### Contradiction Resolution

1. **Detect**: Compare answers across all batches after each submission
2. **Generate**: Create clarification question explaining the conflict
3. **Insert**: Add clarification batch before proceeding
4. **Resolve**: Update answer summary with final decision

## Uncertainty Handling

### Detecting Uncertainty

**Indicators**:
- User selects "Other" and provides vague text: "maybe", "not sure", "depends"
- User writes questions instead of answers: "What would you recommend?"
- User provides incomplete information: "Something secure"

### Handling Uncertainty

**First Attempt**: Re-ask with more educational context
- Add pros/cons for each option
- Provide examples or scenarios
- Reference industry standards

**Second Attempt**: Offer recommendation based on patterns
- "Based on similar projects, JWT tokens are commonly used"
- "For MVPs, cursor pagination is often overkill - offset is simpler"

**Final Fallback**: Mark as "needs clarification in Design phase"
- Record the uncertainty in Q&A summary
- Note it will be addressed during Design checkpoint
- Provide sensible default for now

## Batch Management

### Batch Size

- **Maximum 4 questions per batch**: Optimal for user experience
- **Minimum 1 question per batch**: When only one follow-up needed

### Batch Progression

**After Each Batch**:
1. Collect answers from AskUserQuestion tool
2. Analyze for contradictions and uncertainty
3. Determine remaining categories that need questions
4. Count estimated remaining questions
5. Show progress: "Analyzing your answers... [X more questions needed]"
6. Generate next batch (max 4, prioritized)

**Example Progression**:
- Batch 1 (4 questions): Auth + Database + API + Business
- After analysis: User chose JWT → No auth follow-ups needed
- After analysis: User chose pagination → Need pagination follow-up
- After analysis: User wants caching → Need performance questions
- Batch 2 (3 questions): Pagination details + Performance + External services
- After analysis: All clear
- Show: "All ambiguities resolved, proceeding to Design"

### Progress Communication

**After Each Batch**:
- "Analyzing your answers..."
- Count remaining question categories
- "4 more questions needed" or "1 more question needed"
- If no more: "All ambiguities resolved"

**Don't Show**:
- "Batch 1 of ?" (unknown total)
- "75% complete" (can't calculate with dynamic generation)

## Recording in Design Document

### Format

```markdown
## Q&A Session

### Question Generation Reasoning

Based on gap analysis of the task description:
- Missing: Authentication method, pagination approach, error handling strategy
- Ambiguous: "secure" (what security measures?), "fast" (performance target?)
- Options: Multiple valid email providers, transaction strategies

Generated 8 questions across 2 batches.

### Batch 1: Core Requirements

**Q1** (Auth): "What authentication method?"
- A) JWT tokens - Stateless, scales horizontally, 7-day default expiration
- B) Session-based - Server-side state, easier to revoke, requires sticky sessions
- **Answer**: A) JWT tokens

**Q2** (Database): "How should we handle deleting a user with related records?"
- A) Cascade delete - Automatically delete all related records
- B) Set null - Keep records but remove user reference
- **Answer**: A) Cascade delete

**Q3** (API): "Should this endpoint require authentication?"
- A) Public - No authentication needed
- B) Authenticated - Valid JWT token required
- **Answer**: B) Authenticated

**Q4** (Business): "How strict should password validation be?"
- A) Basic - Min 8 chars, at least one number
- B) Strict - Min 12 chars, uppercase, lowercase, number, special char
- **Answer**: B) Strict

Progress: Analyzing your answers... 4 more questions needed

### Batch 2: Implementation Details

**Q5** (API): "Which pagination approach?"
- A) Cursor-based - Better for real-time data
- B) Offset-based - Simpler, familiar
- **Answer**: B) Offset-based

[Continue for remaining questions...]

### Answer Summary

Key decisions from Q&A:
- **Authentication**: JWT tokens with 7-day expiration
- **Authorization**: All endpoints require authentication
- **Password Validation**: Strict rules (12+ chars, mixed case, numbers, special)
- **Cascade Deletes**: User deletion cascades to related records
- **Pagination**: Offset-based with default page size 20
- **Email Provider**: SendGrid
- **Caching**: Redis for frequently accessed user data
- **Error Handling**: Retry 3 times with exponential backoff for external services

**Status**: ✅ Completed
```

## Best Practices

1. **Prioritize by Impact**: Ask critical architecture questions first
2. **Keep Context Brief**: One-line educational context per option
3. **Use Industry Standards**: Reference common patterns and defaults
4. **Be Specific**: "JWT token expiration?" not "Auth config?"
5. **Group Related**: Batch related questions together (all auth, all DB)
6. **Detect Conflicts**: Check for contradictions across batches
7. **Handle Uncertainty**: Re-ask with more context, provide recommendations
8. **Dynamic Generation**: Let answers guide next questions
9. **Show Progress**: Keep user informed of remaining questions
10. **Record Everything**: Full traceability in design document
