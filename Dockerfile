FROM node
MAINTAINER István Rábel "thraex.aquator@gmail.com"

WORKDIR /opt/jemexx-data
ADD . /opt/jemexx-data
RUN npm install
RUN npm link

VOLUME /config

ENV NODE_ENV=production
ENV NODE_CONFIG_DIR=/config

ENTRYPOINT [ "jemeco" ]
