FROM node:20-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci || (npm i -g @angular/cli && npm i)
COPY . .
EXPOSE 4200
CMD ["npx", "ng", "serve", "--host", "0.0.0.0", "--port", "4200"]
