# Estágio 1: Build do Frontend React / Vite
FROM node:20-alpine AS build-web
WORKDIR /app/web
COPY apps/web/package*.json ./
RUN npm install
COPY apps/web ./
RUN npm run build

# Estágio 2: Imagem Final de Execução Python
FROM python:3.11-slim
WORKDIR /app

# Instala dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia código do backend e os arquivos estáticos compilados pelo Vite
COPY apps /app/apps
COPY --from=build-web /app/web/dist /app/apps/web/dist

ENV PORT=8000
EXPOSE 8000

CMD ["sh", "-c", "python -m uvicorn apps.api.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
