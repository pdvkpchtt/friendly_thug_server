# Используем Ubuntu-based образ
FROM node:18

# Устанавливаем зависимости для запуска браузеров
RUN apt-get update && apt-get install -y \
    curl \
    libwoff1 \
    libopus0 \
    libwebp7 \
    libwebpdemux2 \
    libenchant-2-2 \
    libgudev-1.0-0 \
    libsecret-1-0 \
    libhyphen0 \
    libgdk-pixbuf2.0-0 \
    libegl1 \
    libnotify4 \
    libxslt1.1 \
    libevent-2.1-7 \
    libgles2 \
    libvpx7 \
    libxcomposite1 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libepoxy0 \
    libgtk-3-0 \
    libharfbuzz-icu0 \
    libgstreamer-gl1.0-0 \
    libgstreamer-plugins-bad1.0-0 \
    gstreamer1.0-plugins-good \
    gstreamer1.0-plugins-bad \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

# Создаем директорию для приложения
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Устанавливаем Playwright и браузеры с системными зависимостями
RUN npx playwright install-deps
RUN npx playwright install chromium firefox webkit

# Копируем остальные файлы приложения
COPY . .

# Генерация Prisma клиентов
RUN npx prisma generate

# Экспонируем порт приложения
EXPOSE 3000

# Добавляем xvfb-run в команду запуска
CMD ["xvfb-run", "--auto-servernum", "node", "server.js"]