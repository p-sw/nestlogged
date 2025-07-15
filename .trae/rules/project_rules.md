# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript monorepo for **nestlogged**, a NestJS logging decorator library. The project consists of two packages:

- **`nestlogged`**: Base package with core logging decorators for NestJS
- **`nestlogged-fastify`**: Patched version with Fastify platform compatibility

## Development Commands

### Package Management

- `pnpm install` - Install dependencies
- `pnpm run main` - Run commands in the main nestlogged package
- `pnpm run fastify` - Run commands in the nestlogged-fastify package

### Build Commands

- `pnpm run build:main` - Build the main nestlogged package
- `pnpm run build:fastify` - Build the fastify package (includes patching)

### Testing

- `pnpm run test:main` - Run Jest tests for the main package
- Test files: `src/**/*.test.ts` and `src/**/*.spec.ts`

### Formatting

- `pnpm run format` - Format all TypeScript files with Prettier

### Publishing

- `pnpm run publish:main` - Build and publish nestlogged package
- `pnpm run publish:fastify` - Build and publish nestlogged-fastify package

## Patch System Architecture

The project uses a sophisticated patch system to maintain two versions from a single codebase:

### Key Directories

- `packages/nestlogged/src/` - Original source code (primary development location)
- `packages/nestlogged-fastify/src/` - Generated patched code (not tracked in git)
- `packages/nestlogged-fastify/patch/` - Contains `.patch` files (tracked in git)

### Patch Commands

- `pnpm run patch:import` - Apply patches to create nestlogged-fastify/src from nestlogged
- `pnpm run patch:export` - Generate patch files from modified fastify code
- `pnpm run patch:sync <file>` - Sync changes from nestlogged to fastify (handles conflicts)

### Workflow Rules

1. **Primary development**: Make changes in `packages/nestlogged/src/`
2. **Syncing changes**: Use `patch:sync` to propagate changes to fastify version
3. **Fastify-specific changes**: Modify `packages/nestlogged-fastify/src/` then run `patch:export`
4. **Development setup**: Run `patch:import` when first working with fastify package

## Core Architecture

### Logging Decorators

The library provides decorators for different NestJS components:

- `@LoggedRoute` - HTTP route methods
- `@LoggedController` - Controller classes
- `@LoggedInjectable` - Injectable services
- `@LoggedGuard`, `@LoggedInterceptor`, `@LoggedMiddleware` - Guards, interceptors, middleware
- `@LoggedExceptionFilter` - Exception filters

### Logging Infrastructure

- `ScopedLogger` - Logger with hierarchical scoping and unique IDs
- `ConsoleLogger` - Enhanced console logger with scope support and JSON output
- Metadata system for parameter logging (`@LoggedParam`, `@LoggedBody`, etc.)

### Key Files

- `src/index.ts` - Main exports
- `src/logged/class.ts` - Class-level decorators (Controller, Injectable)
- `src/logged/methods/` - Method-level decorators
- `src/logged/override.ts` - Core function wrapping logic
- `src/logger.ts` - Logging infrastructure
- `src/reflected.ts` - Reflection-based parameter decorators

## TypeScript Configuration

- Target: ES2021
- Module: CommonJS
- Decorators: Experimental decorators enabled
- Output: `lib/` directory with declaration files
- Build excludes test files

## Dependencies

### Runtime Dependencies

- `@nestjs/common` - NestJS framework
- `hyperid` - Unique ID generation
- `reflect-metadata` - Metadata reflection
- `rxjs` - Reactive programming

### Development Dependencies

- `jest` with `ts-jest` for testing
- TypeScript compiler
- Prettier for formatting

## Development Notes

- Use `pnpm` as the package manager
- Follow the patch system workflows when making changes
- Test changes in both packages when modifying core functionality
- The project maintains compatibility with NestJS versions 9-11
