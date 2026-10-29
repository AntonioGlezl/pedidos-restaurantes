FROM node:24-alpine
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app