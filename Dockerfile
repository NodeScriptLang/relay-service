FROM node:20.18-slim as builder

WORKDIR /builder
COPY . ./

RUN npm ci && npm run build && rm -rf node_modules

##################################################

FROM node:20.18-slim

ENV NODE_ENV production

RUN mkdir /app && chown -R node:node /app
WORKDIR /app
USER node

COPY --from=builder /builder .
RUN npm ci --production

WORKDIR /app
CMD ["node", "out/bin/run.js"]
