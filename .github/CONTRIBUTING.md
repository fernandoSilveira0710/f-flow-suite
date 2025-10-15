# Contributing to F-Flow Suite

Thank you for your interest in contributing to F-Flow Suite! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Process](#contributing-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

### Our Standards

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git
- Docker (for local development)
- PostgreSQL (for database development)

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/f-flow-suite.git
   cd f-flow-suite
   ```

2. **Install Dependencies**
   ```bash
   # Install Hub dependencies
   cd hub && npm install
   
   # Install Client Local dependencies
   cd ../client-local && npm install
   
   # Install Site dependencies
   cd ../site && npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment files
   cp hub/.env.example hub/.env
   cp client-local/.env.example client-local/.env
   ```

4. **Database Setup**
   ```bash
   # Start PostgreSQL with Docker
   docker-compose up postgres -d
   
   # Run migrations
   cd hub && npx prisma migrate dev
   ```

5. **Start Development Servers**
   ```bash
   # Terminal 1: Hub
   cd hub && npm run start:dev
   
   # Terminal 2: Client Local
   cd client-local && npm start
   
   # Terminal 3: Site
   cd site && npm run dev
   ```

## Contributing Process

1. **Check Existing Issues**
   - Look for existing issues or feature requests
   - Comment on issues you'd like to work on

2. **Create an Issue** (if needed)
   - Use the appropriate issue template
   - Provide detailed information
   - Wait for maintainer feedback

3. **Fork and Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

4. **Make Changes**
   - Follow coding standards
   - Write tests
   - Update documentation

5. **Test Your Changes**
   ```bash
   npm test
   npm run lint
   npm run format:check
   ```

6. **Commit and Push**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/your-feature-name
   ```

7. **Create Pull Request**
   - Use the PR template
   - Link related issues
   - Request review

## Coding Standards

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow ESLint and Prettier configurations
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### Code Style

```typescript
// Good
interface UserPreferences {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
}

class UserService {
  /**
   * Updates user preferences
   * @param userId - The user ID
   * @param preferences - The preferences to update
   * @returns Promise resolving to updated user
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<User> {
    // Implementation
  }
}
```

### File Organization

```
src/
├── modules/
│   ├── users/
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.module.ts
│   │   ├── dto/
│   │   ├── entities/
│   │   └── tests/
│   └── ...
├── common/
├── config/
└── main.ts
```

## Testing Guidelines

### Unit Tests

- Write tests for all business logic
- Use Jest and NestJS testing utilities
- Aim for >80% code coverage
- Mock external dependencies

```typescript
describe('UserService', () => {
  let service: UserService;
  let repository: Repository<User>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should create a user', async () => {
    // Test implementation
  });
});
```

### Integration Tests

- Test API endpoints
- Use test database
- Test error scenarios

### E2E Tests

- Test complete user workflows
- Use Postman collections
- Test across different environments

## Documentation

### Code Documentation

- Add JSDoc comments for public APIs
- Document complex algorithms
- Include usage examples

### API Documentation

- Use OpenAPI/Swagger annotations
- Document all endpoints
- Include request/response examples

### User Documentation

- Update README files
- Add setup instructions
- Include troubleshooting guides

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build/tooling changes

### Examples

```
feat(auth): add OAuth2 authentication
fix(api): resolve user creation validation error
docs(readme): update installation instructions
test(users): add unit tests for user service
```

## Pull Request Process

1. **Pre-submission Checklist**
   - [ ] Tests pass locally
   - [ ] Code follows style guidelines
   - [ ] Documentation updated
   - [ ] No merge conflicts

2. **PR Requirements**
   - Clear title and description
   - Link to related issues
   - Screenshots (if UI changes)
   - Test coverage maintained

3. **Review Process**
   - At least one maintainer review required
   - Address all feedback
   - Keep PR updated with main branch

4. **Merge Requirements**
   - All CI checks pass
   - Approved by maintainer
   - No conflicts with main branch

## Issue Reporting

### Bug Reports

Use the bug report template and include:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Screenshots/logs

### Feature Requests

Use the feature request template and include:
- Problem statement
- Proposed solution
- Use cases
- Acceptance criteria

### Security Issues

For security vulnerabilities:
- **DO NOT** create public issues
- Email security@2fsolutions.com.br
- Include detailed description
- Provide proof of concept (if safe)

## Development Workflow

### Branch Strategy

- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: New features
- `fix/*`: Bug fixes
- `hotfix/*`: Critical production fixes

### Release Process

1. Create release branch from `develop`
2. Update version numbers
3. Update CHANGELOG.md
4. Create release PR to `main`
5. Tag release after merge
6. Deploy to production

## Getting Help

- **Documentation**: Check README files and docs/
- **Issues**: Search existing issues
- **Discussions**: Use GitHub Discussions
- **Chat**: Join our Slack workspace
- **Email**: Contact maintainers directly

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project documentation
- Annual contributor highlights

Thank you for contributing to F-Flow Suite! 🚀