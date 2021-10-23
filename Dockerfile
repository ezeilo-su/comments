# Specify a base image
FROM node:alpine

# Set default working directory

WORKDIR /usr/app

# Copy everything from the current working directory of the app to
# the current working directory inside the container
# If not, pachage.json will not be found during npm install
COPY ./package.json ./

# Install some dependencies
RUN npm install

COPY ./ ./

# Default command
CMD ["npm", "start"]