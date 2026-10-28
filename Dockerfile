# Use Node.js as build stage
FROM node:18 AS build

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy all files into the container
COPY . .

# ✅ Set API version using build argument
ARG REACT_APP_API_VERSION=v1
ENV REACT_APP_API_VERSION=$REACT_APP_API_VERSION

# ✅ Ensure React sees the environment variable during build
RUN REACT_APP_API_VERSION=$REACT_APP_API_VERSION npm run build

# Serve the built frontend with Nginx
FROM nginx:latest AS production
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
