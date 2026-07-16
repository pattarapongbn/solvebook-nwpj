# ---------------------------------------------------------------------
# LumpuFarm Publisher
#
# Based on the official Playwright image so Chromium and every system
# dependency (incl. font rendering libs) is preinstalled. The image tag
# MUST match the playwright version pinned in package.json.
# ---------------------------------------------------------------------
FROM mcr.microsoft.com/playwright:v1.49.1-noble

WORKDIR /app

ENV NODE_ENV=production \
    TZ=Asia/Bangkok

# Install dependencies first for better layer caching.
COPY package.json package-lock.json* ./
RUN npm install --omit=dev && npm cache clean --force

# Application source, templates, styles and assets.
COPY src ./src
COPY templates ./templates
COPY styles ./styles
COPY assets ./assets

# Storage directories (also mounted as a volume by docker-compose).
RUN mkdir -p storage/images storage/logs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
