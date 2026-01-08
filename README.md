# How it works

> **ElysiaJS** is a web framework written in Bun so i'm using that as the runtime for this project as well

## Structure

Structure wise this is closer to something like NestJS, since Elysia is not really opinionated on naming/structure it a higher level. This is an MVC pattern based structure, where each resource(article,user,etc) will have its own folder.

### src/api

- `*.controller.ts` denotes a controller file, which is an Elysia plugin (separated for each resource as recommended by [the docs](https://elysiajs.com/essential/plugin.html#plugin))
- `*.service.ts` will hold any logic, to keep controllers lean
- `*.schema.ts` file will hold related schema objects and types either inferred or generated from them, will be used in both controller and service files
- `*.utils.ts` optionally for even more granular logic related to a resource

### src/test

A few integration tests, using an in-memory sqlite database

### Config files

- `*.env` files that will automatically be loaded by Bun when running either the server or the tests
- `drizzle.config.ts` used to cofigure drizzle/sqlite integration
- `bunfig.toml` used for the tests setup
- Good old `package.json` and `tsconfig.json`

# Getting started

- Install dependencies
  > bun install

- Setup
  > bun migration:run

- Start local server
  > bun dev 

  OR
  > bun start

## Credits

Scaffold from https://github.com/remuspoienar/bun-elysia-drizzle-sqlite.git