FROM node:12
# 1. Make workdir as user `node`
RUN mkdir -p /home/node/app && chown -R node:node /home/node/app
WORKDIR /home/node/app
# 2. A wildcard is used to ensure both package.json 
# AND package-lock.json are copied where available (npm@5+)
COPY package*.json ./
# 3. Bundle app source into docker image.  
# Avoid mounting host directories within containers.
#COPY . .
# NOTE: Here we are NOT copying API creds over.  They will be handled separately
# NOTE also that you can only copy files in docker context
# https://www.jamestharpe.com/include-files-outside-docker-build-context/
COPY --chown=node:node expressTrainsServer.js .
COPY --chown=node:node trainsAsyncAwaitClient.js .
COPY --chown=node:node stationNames.js .
COPY --chown=node:node station_codes.csv .
# 4. expressTrains binds to port 8001 so use the EXPOSE instruction to have it 
# mapped by the docker daemon
EXPOSE 8001
# 5. Avoid running container processes as root and switch to user `node` here
# https://github.com/nodejs/docker-node/issues/740
USER node
# 6. Install package and its dependencies using either package.json if present 
# or package-lock.json.  Note that an updated package.json 
# can trump package-lock.json whenever a newer version is found for a 
# dependency in package.json. If you are building your code for production
# RUN npm ci --only=production
RUN npm install
# Define the command to run your app using CMD which defines your runtime
CMD [ "node", "expressTrainsServer.js" ]