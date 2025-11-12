# Workflow Patterns

This document outlines common workflow patterns in FCIS architecture using railway-oriented programming with `pipe()`.

## CRUD Patterns

### Create Pattern

**Purpose**: Create a new resource with validation and uniqueness checks

```typescript
export function createUser(input: CreateUserInput): Result<CreateUserResult> {
  return pipe(
    validateUserInput(input),
    (validated) => checkEmailAvailability(validated.email),
    (email) => hashPassword(input.password),
    (hashedData) =>
      saveUser({
        email: input.email,
        password: hashedData.hashedPassword,
        name: input.name,
      }),
    (user) => generateAuthToken(user.id, user.email),
    (userWithToken) => formatUserResult(userWithToken),
  );
}
```

**Steps**:

1. Validate input
2. Check uniqueness constraints
3. Hash sensitive data
4. Save to database
5. Add additional data (tokens, timestamps)
6. Format response

### Read (Single) Pattern

**Purpose**: Fetch a single resource by ID with validation

```typescript
export function getUserById(id: string): Result<UserData> {
  return pipe(
    validateUserId(id),
    (validId) => fetchUserFromDatabase(validId),
    (user) => checkUserIsActive(user),
    (user) => formatUserData(user),
  );
}
```

**Steps**:

1. Validate ID
2. Fetch from database
3. Check resource state/permissions
4. Format response

### Read (List) Pattern

**Purpose**: Fetch multiple resources with pagination and filtering

```typescript
export function listUsers(input: ListUsersInput): Result<ListUsersResult> {
  return pipe(
    validateListInput(input),
    (validated) => buildQueryFilters(validated),
    (filters) => fetchUsersFromDatabase(filters),
    (users) => countTotalUsers(filters),
    (data) => formatListResult(data),
  );
}
```

**Steps**:

1. Validate input (pagination, filters)
2. Build query filters
3. Fetch data
4. Get total count (for pagination)
5. Format response with metadata

### Update Pattern

**Purpose**: Update an existing resource with validation and permissions

```typescript
export function updateUserProfile(
  userId: string,
  input: UpdateProfileInput,
): Result<UpdateProfileResult> {
  return pipe(
    validateUpdateInput(input),
    (validated) => fetchExistingUser(userId),
    (user) => checkUpdatePermissions(user, userId),
    (user) => mergeUpdatedFields(user, validated),
    (updatedData) => saveUpdatedUser(userId, updatedData),
    (user) => formatUserData(user),
  );
}
```

**Steps**:

1. Validate input
2. Fetch existing resource
3. Check permissions
4. Merge changes
5. Save to database
6. Format response

### Delete Pattern

**Purpose**: Delete a resource with validation and cascade handling

```typescript
export function deleteUser(userId: string): Result<DeleteResult> {
  return pipe(
    validateUserId(userId),
    (validId) => fetchExistingUser(validId),
    (user) => checkDeletePermissions(user, userId),
    (user) => deleteRelatedData(user.id),
    (userId) => deleteUserFromDatabase(userId),
    (result) => formatDeleteResult(result),
  );
}
```

**Steps**:

1. Validate ID
2. Fetch existing resource
3. Check permissions
4. Delete related data (cascade)
5. Delete resource
6. Format response

## Authentication Patterns

### Register Pattern

**Purpose**: Register a new user with email verification

```typescript
export function registerUser(input: RegisterInput): Result<RegisterResult> {
  return pipe(
    validateRegistrationInput(input),
    (validated) => checkEmailAvailability(validated.email),
    (email) => hashPassword(input.password),
    (hashedData) =>
      createUser({
        email: input.email,
        password: hashedData.hashedPassword,
        name: input.name,
      }),
    (user) => generateVerificationToken(user.id),
    (userData) => sendVerificationEmail(userData.user.email, userData.token),
    (userData) => formatRegistrationResult(userData),
  );
}
```

**Steps**:

1. Validate registration input
2. Check email availability
3. Hash password
4. Create user
5. Generate verification token
6. Send verification email
7. Format response

### Login Pattern

**Purpose**: Authenticate user and issue token

```typescript
export function loginUser(input: LoginInput): Result<LoginResult> {
  return pipe(
    validateLoginInput(input),
    (validated) => findUserByEmail(validated.email),
    (user) => checkUserIsActive(user),
    (user) => verifyPassword(input.password, user.password),
    (user) => generateAuthToken(user.id, user.email),
    (userWithToken) => updateLastLogin(userWithToken.user.id),
    (userData) => formatLoginResult(userData),
  );
}
```

**Steps**:

1. Validate login input
2. Find user by email
3. Check user is active
4. Verify password
5. Generate auth token
6. Update last login timestamp
7. Format response

### Password Reset Request Pattern

**Purpose**: Initiate password reset process

```typescript
export function requestPasswordReset(
  input: RequestResetInput,
): Result<ResetResult> {
  return pipe(
    validateResetRequest(input),
    (validated) => findUserByEmail(validated.email),
    (user) => generateResetToken(user.id),
    (tokenData) => saveResetToken(tokenData),
    (tokenData) => sendResetEmail(tokenData.user.email, tokenData.token),
    (result) => formatResetRequestResult(result),
  );
}
```

**Steps**:

1. Validate email
2. Find user
3. Generate reset token
4. Save token to database
5. Send reset email
6. Format response

### Password Reset Pattern

**Purpose**: Complete password reset with token validation

```typescript
export function resetPassword(input: ResetPasswordInput): Result<ResetResult> {
  return pipe(
    validateResetPasswordInput(input),
    (validated) => validateResetToken(validated.token),
    (tokenData) => checkTokenNotExpired(tokenData),
    (tokenData) => hashPassword(input.newPassword),
    (hashedData) =>
      updateUserPassword(tokenData.userId, hashedData.hashedPassword),
    (result) => invalidateResetToken(input.token),
    (result) => formatResetResult(result),
  );
}
```

**Steps**:

1. Validate input
2. Validate reset token
3. Check token not expired
4. Hash new password
5. Update user password
6. Invalidate reset token
7. Format response

## Advanced Patterns

### Conditional Logic Pattern

**Purpose**: Execute different paths based on conditions

```typescript
export function processOrder(orderId: string): Result<ProcessOrderResult> {
  return pipe(
    fetchOrder(orderId),
    (order) => {
      if (order.status === "paid") {
        return pipe(fulfillOrder(order), (fulfilled) =>
          sendShippingNotification(fulfilled),
        );
      }
      return pipe(processPendingPayment(order), (processed) =>
        sendPaymentReminder(processed),
      );
    },
    (result) => formatProcessResult(result),
  );
}
```

### Parallel Operations Pattern

**Purpose**: Execute multiple independent operations concurrently

```typescript
import { allNamed } from "#lib/result";

export function getUserDashboard(userId: string): Result<DashboardData> {
  return pipe(
    validateUserId(userId),
    (validId) =>
      allNamed({
        user: fetchUserData(validId),
        orders: fetchUserOrders(validId),
        notifications: fetchUserNotifications(validId),
        stats: fetchUserStats(validId),
      }),
    (data) => formatDashboardData(data),
  );
}
```

### Transformation Pattern

**Purpose**: Transform data without side effects

```typescript
import { map } from "#lib/result";

export function getUserProfile(userId: string): Result<PublicProfile> {
  return pipe(
    fetchUserFromDatabase(userId),
    map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      // Exclude sensitive fields
    })),
    (publicProfile) => addPublicMetadata(publicProfile),
  );
}
```

### Filtering Pattern

**Purpose**: Apply conditional logic with early exit

```typescript
import { filter } from "#lib/result";

export function getActiveUser(userId: string): Result<User> {
  return pipe(
    fetchUserFromDatabase(userId),
    filter(
      (user) => user.isActive,
      (user) =>
        fail({
          code: "USER_INACTIVE",
          message: `User ${user.id} is inactive`,
          resourceType: "user",
          resourceId: user.id,
        }),
    ),
    (user) => formatUserData(user),
  );
}
```

### Tap Pattern (Side Effects Without Transformation)

**Purpose**: Execute side effects without modifying data flow

```typescript
import { tap } from "#lib/result";

export function createUser(input: CreateUserInput): Result<CreateUserResult> {
  return pipe(
    validateUserInput(input),
    (validated) => createUserInDatabase(validated),
    tap((user) => logger.info({ userId: user.id }, "User created")),
    tap((user) => trackUserCreationEvent(user)),
    (user) => generateAuthToken(user.id, user.email),
    (userWithToken) => formatUserResult(userWithToken),
  );
}
```

### Error Recovery Pattern

**Purpose**: Handle errors and provide fallback

```typescript
export function getUserWithFallback(userId: string): Result<UserData> {
  return pipe(
    fetchUserFromDatabase(userId),
    (user) => (user ? success(user) : fetchUserFromCache(userId)),
    (user) => (user ? success(user) : fetchDefaultUser()),
    (user) => formatUserData(user),
  );
}
```

### Transaction Pattern

**Purpose**: Execute multiple operations in a database transaction

```typescript
export function transferFunds(
  fromUserId: string,
  toUserId: string,
  amount: number,
): Result<TransferResult> {
  return command(
    async () => {
      return await db.transaction(async (tx) => {
        const userRepo = userRepository.withTransaction(tx);
        const accountRepo = accountRepository.withTransaction(tx);

        const fromAccount = await accountRepo.findByUserId(fromUserId);
        const toAccount = await accountRepo.findByUserId(toUserId);

        if (fromAccount.balance < amount) {
          throw new Error("Insufficient funds");
        }

        await accountRepo.debit(fromAccount.id, amount);
        await accountRepo.credit(toAccount.id, amount);

        return { fromAccount, toAccount, amount };
      });
    },
    (result) =>
      success({
        success: true,
        message: `Transferred ${amount} from ${result.fromAccount.id} to ${result.toAccount.id}`,
      }),
    {
      operation: "transferFunds",
      tags: { domain: "payments", action: "transfer" },
    },
  );
}
```

## Best Practices

1. **Single Responsibility**: Each step should do one thing
2. **Type Safety**: Ensure proper type flow between steps
3. **Early Validation**: Validate inputs first
4. **Clear Naming**: Function names should describe what they do
5. **Error Handling**: Let `pipe()` handle error propagation
6. **Pure Functions**: Prefer pure functions, wrap side effects in `command()`
7. **Composability**: Break complex workflows into smaller, reusable operations
8. **Documentation**: Document workflow steps and purpose
9. **Testing**: Test each operation independently
10. **Observability**: Use `command()` metadata for tracing and metrics
