# Created by IntelliJ IDEA
FROM node:lts
WORKDIR /tmp/project_modules
COPY package.json /tmp/project_modules/package.json
RUN npm install
COPY . /tmp/project_modules
CMD ["npm", "start"]

#COPY start.sh /tmp/project_modules/start.sh