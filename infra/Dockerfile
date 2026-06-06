FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/server/package.json ./apps/server/

RUN npm install --workspace=@odoggle/shared --workspace=@odoggle/server

COPY packages/shared ./packages/shared
COPY apps/server ./apps/server

RUN npm run build -w @odoggle/shared && npm run build -w @odoggle/server

WORKDIR /app/apps/server
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "dist/index.js"]
