FROM node:lts-alpine

RUN apk update && apk add build-base git curl

COPY . .

RUN npm install --location=global npm
RUN npm install
RUN npm run build

EXPOSE 8081
ENV PORT 8081
ENV NODE_ENV production

CMD npm run start:prod
