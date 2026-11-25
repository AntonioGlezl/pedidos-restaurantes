FROM node:24-alpine AS development

RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN mkdir -p .next generated && chown -R node:node /app

USER node
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]
