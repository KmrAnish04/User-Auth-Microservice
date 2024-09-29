FROM node:16.14-alpine

WORKDIR /app

# Copy all files starts with 'package'
COPY package*.json . 

RUN npm ci

COPY . .

EXPOSE 3000

CMD [ "npm", "start" ]
