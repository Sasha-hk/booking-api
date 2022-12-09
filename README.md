# Booking API

## Run locally

Requirements:

- Node.js v16
- Docker (I was using v20.10.21)
- Docker-compose (I was using v2.12.2)

if you don't have Docker installed, you can use your own remote MongoDB, just replace `MONGODB_URL` variable value in [.env](.env) file to your database connection URL. And remove the part `yarn docker &&` in package.json scripts.

Install packages:

```sh
npm i
```

Run server:

```sh
npm run dev
```

Run tests:

```sh
npm run test
```
