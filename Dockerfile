# Version of node
FROM node:12
# Create working directory to hold the application code inside the image.
WORKDIR /usr/src/app
# This image comes with Node.js and NPM already installed so we only need to
# install app dependencies. A wildcard is used to ensure both package.json 
# AND package-lock.json are copied where available (npm@5+)
COPY package*.json ./
# Install package and its dependencies.  Note that an updated package.json 
# can trump package-lock.json whenever a newer version is found for a 
# dependency in package.json.
# If you are building your code for production
# RUN npm ci --only=production
RUN npm install
# Bundle app source into docker image 
# WARNING: This would result in API creds being copied over!
#COPY . .
# expressTrains binds to port 8001 so use the EXPOSE instruction to have it 
# mapped by the docker daemon
# WARNING: This exposes a port!
#EXPOSE 8001
# Define the command to run your app using CMD which defines your runtime
CMD [ "node", "expressTrains.js" ]