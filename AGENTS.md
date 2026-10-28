# IntelliWaste

React + Vite + Tailwind CSS + Prisma + PostgreSQL smart waste management application.

## Development Server

- Run `npm run dev` to start the Vite development server.
- Hot reload: Changes to source files are reflected immediately.

## Project Structure

- `src/main.tsx` - React entrypoint; imports `src/index.css` and mounts `src/App.tsx` into the `#root` element
- `src/App.tsx` - Primary application component and portal routing
- `src/index.css` - Global CSS entrypoint and Tailwind CSS v4 import
- `index.html` - Vite HTML shell containing the `#root` element and loading `src/main.tsx`
- `package.json` - Project dependencies and scripts
- `vite.config.ts` - Vite configuration with React, Tailwind CSS v4, and `@` alias for `src`
- `prisma/schema.prisma` - Database schema for users, smart bins, pickups, vehicles, IoT telemetry
- `api-src/` - Serverless REST API endpoints

## Dependencies

- Runtime: React 19 and React DOM 19
- Styling: Tailwind CSS v4 with `@tailwindcss/vite` plugin
- Database: Prisma ORM with PostgreSQL (Neon)
- Build tooling: Vite 8, TypeScript 5.7, esbuild

## Code quality

- Use double quotes for strings containing apostrophes (`"We're here to help"`), or escape them in single-quoted strings.
- Ensure JSX tags are closed and braces are balanced.
- Export components as default exports.
