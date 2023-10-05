FROM node:lts-alpine

RUN apk update && apk add build-base git curl

WORKDIR /app
COPY . .

RUN npm install --location=global npm
RUN npm install
RUN npm run build

EXPOSE 8081
ENV PORT 8081
ENV NODE_ENV production

HEALTHCHECK --interval=10s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:${PORT}/ || exit 1

CMD npm run start:prod
