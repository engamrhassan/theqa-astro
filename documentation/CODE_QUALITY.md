# 🎯 Code Quality Guide

This document outlines the code quality standards and practices implemented in this project.

## 📋 Quality Standards

### **Code Style & Formatting**
- **ESLint**: TypeScript + Astro rules with strict configuration
- **Prettier**: Consistent code formatting across the project
- **Husky**: Pre-commit hooks to ensure quality
- **Lint-staged**: Only lint staged files for performance

### **Testing**
- **Vitest**: Fast unit testing with TypeScript support
- **Testing Library**: DOM testing utilities
- **Coverage**: 80% minimum coverage requirement
- **Test Organization**: Clear test structure and naming

### **Type Safety**
- **TypeScript**: Strict mode enabled
- **Zod**: Runtime validation for API data
- **Type Guards**: Proper type checking
- **Interface Definitions**: Clear type contracts

### **Security**
- **Input Validation**: All inputs validated and sanitized
- **Security Headers**: Comprehensive security headers
- **Rate Limiting**: Protection against abuse
- **CORS**: Proper cross-origin resource sharing

## 🚀 Quick Start

### **Install Dependencies**
```bash
npm install
```

### **Run Quality Checks**
```bash
# Run all quality checks
npm run quality

# Fix auto-fixable issues
npm run quality:fix

# Run individual checks
npm run lint          # ESLint
npm run format:check  # Prettier
npm run type-check    # TypeScript
npm run test          # Vitest
```

### **Development Workflow**
```bash
# Start development with quality checks
npm run dev

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Check test coverage
npm run test:coverage
```

## 📁 Project Structure

```
src/
├── schemas/           # Zod validation schemas
├── types/            # TypeScript type definitions
├── utils/
│   ├── validation/   # Validation utilities
│   └── security/     # Security utilities
├── test/             # Test files
└── components/       # Astro components
```

## 🧪 Testing Guidelines

### **Test Organization**
- Tests co-located with source files
- Clear test descriptions
- Arrange-Act-Assert pattern
- Mock external dependencies

### **Coverage Requirements**
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

### **Test Types**
- **Unit Tests**: Individual functions and components
- **Integration Tests**: Component interactions
- **Security Tests**: Validation and security features

## 🔒 Security Guidelines

### **Input Validation**
- All user inputs validated with Zod schemas
- Sanitization of string inputs
- URL validation for external links
- Country code validation

### **Security Headers**
- Content Security Policy (CSP)
- XSS Protection
- Clickjacking Protection
- HSTS for HTTPS enforcement

### **Rate Limiting**
- Public endpoints: 100 requests/minute
- Admin endpoints: 30 requests/minute
- Cache purge: 10 requests/hour

## 📝 Code Style Rules

### **TypeScript**
- Use strict mode
- Prefer `const` over `let`
- Use explicit return types for public functions
- Avoid `any` type
- Use proper error handling

### **Naming Conventions**
- **Variables**: camelCase
- **Functions**: camelCase
- **Classes**: PascalCase
- **Constants**: UPPER_SNAKE_CASE
- **Files**: kebab-case

### **Function Guidelines**
- Maximum 50 lines per function
- Maximum 4 parameters
- Maximum complexity of 10
- Maximum nesting depth of 4

## 🔧 Configuration Files

### **ESLint** (`.eslintrc.cjs`)
- TypeScript support
- Astro plugin integration
- Prettier integration
- Custom rules for code quality

### **Prettier** (`.prettierrc`)
- Consistent formatting
- Single quotes
- Semicolons required
- 80 character line limit

### **Vitest** (`vitest.config.ts`)
- TypeScript support
- JSDOM environment
- Coverage reporting
- Path aliases

### **Husky** (`.husky/pre-commit`)
- Pre-commit hooks
- Lint-staged integration
- Quality gate enforcement

## 🚨 Quality Gates

### **Pre-commit Checks**
- ESLint validation
- Prettier formatting
- TypeScript compilation
- Test execution

### **CI/CD Pipeline**
- Automated quality checks
- Test coverage reporting
- Security scanning
- Performance monitoring

## 📊 Quality Metrics

### **Current Status**
- **ESLint**: ✅ Configured
- **Prettier**: ✅ Configured
- **TypeScript**: ✅ Strict mode
- **Testing**: ✅ Vitest setup
- **Security**: ✅ Headers & validation
- **Coverage**: 🎯 80% target

### **Monitoring**
- Real-time quality feedback
- Coverage reports
- Performance metrics
- Security alerts

## 🛠️ Troubleshooting

### **Common Issues**

#### **ESLint Errors**
```bash
# Fix auto-fixable issues
npm run lint:fix

# Check specific file
npx eslint src/components/MyComponent.astro
```

#### **Prettier Issues**
```bash
# Format all files
npm run format

# Check formatting
npm run format:check
```

#### **Test Failures**
```bash
# Run specific test
npm run test src/test/broker.test.ts

# Run with verbose output
npm run test -- --reporter=verbose
```

#### **TypeScript Errors**
```bash
# Check types
npm run type-check

# Build with type checking
npm run build
```

## 📚 Resources

- [ESLint Documentation](https://eslint.org/)
- [Prettier Documentation](https://prettier.io/)
- [Vitest Documentation](https://vitest.dev/)
- [Zod Documentation](https://zod.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🤝 Contributing

1. Follow the code style guidelines
2. Write tests for new features
3. Ensure all quality checks pass
4. Update documentation as needed
5. Submit PR with quality gate approval

---

**Remember**: Quality is not an accident. It's the result of consistent effort and attention to detail. 🎯
