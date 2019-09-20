FROM mongo:latest
COPY ./mongoscripts/* /docker-entrypoint-initdb.d/

