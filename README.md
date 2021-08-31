# pohles-backend

> An awesome project based on Ts.ED framework

See [Ts.ED](https://tsed.io) project for more information.

## Build setup

> **Important!** Ts.ED requires Node >= 10, Express >= 4 and TypeScript >= 3.

```batch
# install dependencies
$ npm install

# serve
$ npm run start

# build for production
$ npm run build
$ npm run start:prod
```

## Docker compose

```batch
# Copy docker compose file
cp docker-compose.sample.yml docker-compose.yml

# Edit docker-compose.yml
vim docker-compose.yml

# Copy mongo init file
cp mongo-init.sample.js mongo-init.js

# Edit database credentials
vim mongo-init.js

# Start containers
docker-compose up -d
```
