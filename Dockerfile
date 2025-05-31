FROM node:20

WORKDIR /app

COPY package*.json ./
COPY . .

RUN npm install
# Dont need to run build, we have postinstall script

CMD ["npm", "run", "start:prod"]