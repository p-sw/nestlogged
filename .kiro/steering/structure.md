# Project Structure

## Root Directory

```
├── packages/                 # Monorepo packages
├── scripts/                  # Build and patching scripts
├── .kiro/                    # Kiro AI assistant configuration
├── .github/                  # GitHub workflows and templates
├── node_modules/             # Root dependencies
├── package.json              # Root package configuration
├── pnpm-workspace.yaml       # pnpm workspace configuration
├── pnpm-lock.yaml           # Dependency lock file
└── README.md                # Project documentation
```

## Package Structure

### packages/nestlogged/ (Core Package)
```
├── src/                     # Source code (Git tracked)
│   ├── logger.ts           # Main ConsoleLogger and ScopedLogger classes
│   ├── utils/              # Utility functions and types
│   └── index.ts            # Package exports
├── lib/                    # Compiled output
├── e2e/                    # End-to-end tests
├── package.json            # Package configuration
├── tsconfig.json           # TypeScript configuration
├── tsconfig.build.json     # Build-specific TypeScript config
└── jest.config.js          # Jest test configuration
```

### packages/nestlogged-fastify/ (Fastify Package)
```
├── src/                    # Generated source (NOT Git tracked)
├── patch/                  # Patch files (Git tracked)
├── lib/                    # Compiled output
├── package.json            # Package configuration
├── tsconfig.json           # TypeScript configuration
└── tsconfig.build.json     # Build-specific TypeScript config
```

## Key Conventions

### File Organization
- **Source files**: All development happens in `packages/nestlogged/src/`
- **Patch files**: Fastify-specific changes stored as `.patch` files in `packages/nestlogged-fastify/patch/`
- **Generated code**: `packages/nestlogged-fastify/src/` is generated and not tracked in Git

### Naming Patterns
- **Classes**: PascalCase (e.g., `ConsoleLogger`, `ScopedLogger`)
- **Functions**: camelCase (e.g., `isLevelEnabled`, `formatScope`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_DEPTH`)
- **Types/Interfaces**: PascalCase with descriptive names

### Import Structure
- **External dependencies**: Import from `@nestjs/common`, `util`, etc.
- **Internal utilities**: Import from `./utils` with named imports
- **Type-only imports**: Use `import type` when importing only types

### Code Organization Principles
- **Single responsibility**: Each class/function has one clear purpose
- **Dependency injection**: Use NestJS patterns with `@Injectable()` and `@Optional()`
- **Method overloading**: Support multiple call signatures for flexibility
- **Error handling**: Graceful degradation with level checks and optional parameters

### Testing Structure
- **Unit tests**: Co-located with source files or in dedicated test directories
- **E2E tests**: In `packages/nestlogged/e2e/` directory
- **Test naming**: `*.spec.ts` or `*.test.ts` files