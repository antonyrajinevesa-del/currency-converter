# Currency Converter (React + Vite + Docker)

Live exchange rates from [frankfurter.dev](https://frankfurter.dev) (ECB data, no API key needed).

## Run with Docker

```bash
docker build -t currency-converter .
docker run -d -p 8080:80 --name currency-converter currency-converter
```

Open http://localhost:8080

Or with Compose:

```bash
docker compose up --build -d
```

## Run locally (no Docker)

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Stop / clean up

```bash
docker stop currency-converter && docker rm currency-converter
```
