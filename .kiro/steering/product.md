# Product Overview

NestJS Logging Decorators (`nestlogged`) is a TypeScript library that provides enhanced logging decorators for NestJS applications. The library simplifies logging by extending the standard NestJS Logger with additional features like scoped logging, enhanced formatting, and JSON output support.

## Key Features

- **Scoped Logging**: Track related log entries with unique scope IDs and hierarchical scopes
- **Enhanced Console Logger**: Extended NestJS ConsoleLogger with better formatting and inspection
- **Dual Platform Support**: Core package (`nestlogged`) and Fastify-compatible version (`nestlogged-fastify`)
- **JSON Logging**: Structured JSON output for production environments
- **TypeScript First**: Full TypeScript support with proper type definitions

## Architecture

This is a monorepo containing two packages:
- `nestlogged`: Core logging functionality for standard NestJS applications
- `nestlogged-fastify`: Patched version with Fastify platform compatibility

The project uses a sophisticated patching system to maintain code synchronization between the two packages while allowing platform-specific modifications.