FROM node:24 AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS base-app
WORKDIR /app
COPY . /app
RUN corepack install

FROM base-app AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base-app AS build
# git needed for sveltekit version
# TODO this is not getting cached, probably due to the copy above changing
RUN rm -f /etc/apt/apt.conf.d/docker-clean; echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' > /etc/apt/apt.conf.d/keep-cache
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y --no-install-recommends git

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

FROM node:24-slim
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app
ADD package.json /app/
ADD drizzle /app/drizzle
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/build /app/build
EXPOSE 3000
VOLUME [ "/var/data" ]
ENV DATABASE_URL=/var/data/local.db
ENV NODE_ENV=production
ENTRYPOINT [ "pnpm", "start" ]

