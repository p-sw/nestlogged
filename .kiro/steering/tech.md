# Technology Stack

## Build System & Package Management

- **Package Manager**: pnpm (v10.13.1+) - Required for workspace management
- **Monorepo**: pnpm workspaces with packages in `packages/*`
- **TypeScript**: v5.2.2+ for compilation and type checking
- **Build Tool**: TypeScript compiler (tsc) via tsconfig files

## Core Dependencies

- **@nestjs/common**: v11.1.0+ - Core NestJS framework dependency
- **hyperid**: Fixed-length unique ID generation for scope tracking
- **Node.js util.inspect**: For object inspection and formatting

## Development Tools

- **Prettier**: v3.5.3 for code formatting
- **Jest**: Testing framework (configured in individual packages)
- **ts-node**: v10.9.1 for TypeScript execution
- **rimraf**: v5.0.5 for cross-platform file cleanup

## Common Commands

### Package-Specific Operations
```bash
# Work with main package
pnpm run main <command>

# Work with fastify package  
pnpm run fastify <command>
```

### Building
```bash
# Build main package
pnpm run build:main

# Build fastify package (includes patching)
pnpm run build:fastify
```

### Testing
```bash
# Test main package
pnpm run test:main
```

### Publishing
```bash
# Publish main package
pnpm run publish:main

# Publish fastify package
pnpm run publish:fastify
```

### Code Quality
```bash
# Format all TypeScript files
pnpm run format
```

### Patching System
```bash
# Import patches to fastify package
pnpm run patch:import

# Export changes as patches
pnpm run patch:export

# Sync specific file changes
pnpm run patch:sync <relative/path/from/src>
```

## Platform Requirements

- Node.js with ES modules support
- Windows/Linux/macOS compatibility
- TypeScript compilation target: ES2020+