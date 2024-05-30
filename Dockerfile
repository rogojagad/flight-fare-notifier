FROM denoland/deno:1.44.0

EXPOSE 8080

WORKDIR /app

ADD . /app/

RUN deno cache main.ts

RUN deno task browser:cache

CMD ["run", "-A", "--unstable", "main.ts"]