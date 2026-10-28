docker stop nbank-ui
docker rm nbank-ui
docker build --no-cache --build-arg REACT_APP_API_VERSION=v1 -t nbank-ui .
docker run -d -p 3000:80 -e REACT_APP_API_VERSION=v1 --name nbank-ui --network=nbank-network nbank-ui

