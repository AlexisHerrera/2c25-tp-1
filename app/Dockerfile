FROM node:22
RUN mkdir /opt/app
WORKDIR /opt/app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]