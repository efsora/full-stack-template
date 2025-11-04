# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cypress E2E and API testing framework using the Page Object Model (POM) design pattern with TypeScript. This is a comprehensive testing template with Docker support and Qase.io integration.

## Project Structure

```
test/
├── cypress/
│   ├── e2e/                    # E2E test specs
│   │   └── api/                # API test specs
│   ├── pages/                  # Page Object classes
│   │   └── BasePage.ts         # Base page with common methods
│   ├── api/                    # API service classes
│   │   └── BaseApiService.ts   # Base API service
│   ├── support/                # Custom commands and configuration
│   │   ├── commands.ts         # Custom Cypress commands
│   │   └── e2e.ts              # E2E support file
│   ├── utils/                  # Utility functions
│   │   ├── uiHelpers.ts        # UI interaction helpers
│   │   ├── apiHelpers.ts       # API testing helpers
│   │   ├── dataGenerator.ts    # Test data generators
│   │   └── envConfig.ts        # Environment configuration
│   ├── fixtures/               # Test data files (JSON)
│   └── config/                 # Environment configs (dev/staging/prod)
├── cypress.config.ts           # Cypress configuration
├── docker-compose.yml          # Docker orchestration
└── package.json                # Dependencies and scripts
```

## Essential Commands

### Running Tests

```bash
# Open Cypress UI (interactive mode)
npm run cypress:open

# Run all tests headless
npm run cypress:run
npm test  # alias

# Run E2E tests only
npm run test:e2e

# Run API tests only
npm run test:api

# Run specific spec file
npm run test:spec -- "cypress/e2e/login.cy.ts"

# Run with headed browser
npm run cypress:run:headed
npm run test:headed
```

### Browser-Specific Tests

```bash
npm run test:chrome
npm run test:firefox
npm run test:edge
```

### Environment-Specific Tests

```bash
npm run test:dev       # Development environment
npm run test:staging   # Staging environment
npm run test:prod      # Production environment
```

### Docker Commands

```bash
# Build Docker image
npm run docker:build

# Run tests in Docker
npm run docker:run
npm run docker:test

# Run in background
npm run docker:run:detached

# Stop containers
npm run docker:down

# View logs
docker-compose logs -f
```

### Code Quality

```bash
# Lint TypeScript
npm run lint
npm run lint:fix    # Auto-fix issues

# Format code with Prettier
npm run format
npm run format:check

# Type check
npm run type-check
```

### CI/CD

```bash
# Run tests in parallel with recording (requires Cypress Dashboard)
npm run test:parallel -- <cypress-key>
```

## Architecture & Design Patterns

### Page Object Model (POM)

All page interactions are encapsulated in Page Object classes:

1. **Page Objects** extend `BasePage` class
2. Use private `selectors` object for all element selectors
3. Prefer `data-testid` attributes over CSS selectors
4. Return `this` for method chaining
5. Public methods represent user actions on the page

**Example:**
```typescript
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  private readonly selectors = {
    usernameInput: '[data-testid="username"]',
    passwordInput: '[data-testid="password"]',
    loginButton: '[data-testid="login-button"]',
  };

  constructor() {
    super('/login');  // URL path
  }

  enterUsername(username: string): this {
    this.type(this.selectors.usernameInput, username);
    return this;
  }

  clickLogin(): this {
    this.click(this.selectors.loginButton);
    return this;
  }
}
```

### API Service Pattern

API interactions are encapsulated in service classes:

1. **API Services** extend `BaseApiService` class
2. Use private `endpoints` object for endpoint definitions
3. Include verification methods for responses
4. Return `Cypress.Chainable<Cypress.Response<any>>`

**Example:**
```typescript
import { BaseApiService } from './BaseApiService';

export class UserService extends BaseApiService {
  private readonly endpoints = {
    users: '/users',
    user: (id: number) => `/users/${id}`,
  };

  getAllUsers(): Cypress.Chainable<Cypress.Response<any>> {
    return this.get(this.endpoints.users);
  }

  verifyUserResponse(response: Cypress.Response<any>): void {
    this.verifyStatus(response, 200);
    expect(response.body).to.have.property('id');
    expect(response.body).to.have.property('username');
  }
}
```

### Test Structure

Tests follow a consistent structure:

```typescript
describe('Feature Name', () => {
  let pageObject: PageObjectClass;

  beforeEach(() => {
    pageObject = new PageObjectClass();
    pageObject.visit();
  });

  it('should describe expected behavior', () => {
    // Arrange
    // Act
    pageObject.performAction();

    // Assert
    cy.url().should('include', '/expected-path');
  });
});
```

## Configuration

### Environment Variables

1. Copy example file: `cp cypress.env.json.example cypress.env.json`
2. Edit `cypress.env.json` with your configuration
3. Access in tests via `Cypress.env('variableName')`

**Note:** `cypress.env.json` is gitignored and should never be committed.

### Environment-Specific Configuration

- **`cypress/config/dev.json`** - Development environment
- **`cypress/config/staging.json`** - Staging environment
- **`cypress/config/prod.json`** - Production environment

Switch environments using: `npm run test:dev`, `npm run test:staging`, `npm run test:prod`

### Cypress Configuration

Main configuration in `cypress.config.ts`:
- Base URL configuration
- Viewport settings
- Timeouts
- Video/screenshot settings
- Reporter configuration (including Qase.io if enabled)

## Best Practices

### Selectors
- **Always prefer** `data-testid` attributes: `[data-testid="element-name"]`
- Avoid fragile CSS selectors that depend on styling
- Keep selectors in the private `selectors` object of page classes

### Waits
- **Never use hard-coded waits** like `cy.wait(5000)`
- Use assertions with built-in retries: `.should('be.visible')`
- Wait for network requests when necessary: `cy.wait('@aliasName')`

### Test Independence
- Tests should be independent and runnable in any order
- Use `beforeEach` for test setup, not shared state
- Clean up test data in `afterEach` if necessary

### Chainability
- Return `this` from Page Object methods for chainability
- Use Cypress chaining: `cy.get().should().click()`

### Custom Commands
Custom Cypress commands are defined in `cypress/support/commands.ts`:
- Use `cy.login()` for common authentication
- Add new commands here for frequently repeated actions
- Type definitions go in `cypress/support/commands.ts` (ambient declarations)

## Utilities

### UI Helpers (`cypress/utils/uiHelpers.ts`)
Functions for common UI interactions and assertions.

### API Helpers (`cypress/utils/apiHelpers.ts`)
Functions for API testing, response validation, and data verification.

### Data Generator (`cypress/utils/dataGenerator.ts`)
Generate test data like fake users, emails, etc.

### Env Config (`cypress/utils/envConfig.ts`)
Environment-specific configuration loading.

## Qase.io Integration

For test management and reporting with Qase.io:

1. Install reporter: Already included in `package.json`
2. Set environment variables:
   ```bash
   export QASE_API_TOKEN=your_token
   export QASE_PROJECT_CODE=your_project
   export QASE_RUN_ID=optional_run_id
   ```
3. Uncomment Qase configuration in `cypress.config.ts`
4. Tag tests with Qase test case IDs in test titles or metadata

See `QASE_SETUP.md` for detailed setup instructions.

## Docker Usage

The project includes Docker support for consistent test execution:

- **Dockerfile**: Defines the Cypress test container
- **docker-compose.yml**: Orchestrates container execution

Benefits:
- Consistent environment across different machines
- No need to install Cypress locally
- Easy CI/CD integration

See `DOCKER_GUIDE.md` for detailed Docker instructions.

## Coding Standards

### TypeScript
- Use TypeScript for all test code
- Avoid `any` types; use proper type definitions
- Export reusable types/interfaces

### Naming Conventions
- **Files**: PascalCase for classes (`LoginPage.ts`), camelCase for utilities (`apiHelpers.ts`)
- **Test files**: Must end with `.cy.ts`
- **Classes**: PascalCase (`LoginPage`, `UserService`)
- **Methods**: camelCase (`enterUsername`, `clickButton`)
- **Constants**: UPPER_SNAKE_CASE

### Comments
- Use JSDoc comments for public methods in Page Objects and API Services
- Explain "why" not "what"
- Keep comments up-to-date with code

## Common Workflows

### Creating a New Page Object

1. Create file in `cypress/pages/` (e.g., `MyPage.ts`)
2. Extend `BasePage`
3. Define private `selectors` object
4. Implement methods for user actions
5. Return `this` for chainability
6. Add JSDoc comments

### Creating a New API Service

1. Create file in `cypress/api/` (e.g., `MyService.ts`)
2. Extend `BaseApiService`
3. Define private `endpoints` object
4. Implement methods for API calls
5. Add verification methods
6. Add JSDoc comments

### Writing a New Test

1. Create file in `cypress/e2e/` (for E2E) or `cypress/e2e/api/` (for API)
2. Import required Page Objects or API Services
3. Use `describe` for grouping
4. Initialize objects in `beforeEach`
5. Write focused, independent test cases
6. Use descriptive test names

### Adding Test Data

1. Create JSON file in `cypress/fixtures/`
2. Load in tests with `cy.fixture('filename')`
3. Use for consistent test data

## Troubleshooting

### Tests Failing in CI but Passing Locally
- Run tests in Docker locally to match CI environment
- Check environment variables
- Verify browser versions

### Flaky Tests
- Avoid hard-coded waits
- Use proper assertions with retries
- Check for race conditions
- Ensure test independence

### Element Not Found
- Verify selector is correct
- Check if element is in viewport
- Wait for element to be visible before interacting
- Use Cypress UI to debug selector

## Additional Documentation

- **README.md**: Complete project documentation
- **CONTRIBUTING.md**: Contribution guidelines and coding standards
- **DOCKER_GUIDE.md**: Detailed Docker setup and usage
- **QASE_SETUP.md**: Qase.io test management integration
