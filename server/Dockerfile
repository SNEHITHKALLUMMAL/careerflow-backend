FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# uploads/ is a scratch dir for multer before files are streamed to Cloudinary — never
# meant to persist, but ensure it exists so the app doesn't fail on first upload.
RUN mkdir -p uploads

EXPOSE 5000

CMD ["node", "server.js"]
