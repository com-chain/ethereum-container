FROM debian:stretch-slim

RUN apt update
RUN apt install -y -q gnupg2 curl git python apt-transport-https
RUN sh -c "curl -sL https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -"
RUN sh -c "echo \"deb https://dl.yarnpkg.com/debian/ stable main\" | tee /etc/apt/sources.list.d/yarn.list"
RUN sh -c "curl -sL https://deb.nodesource.com/setup_11.x | bash - "
RUN apt-get install -y nodejs yarn gcc g++ make

RUN echo "deb http://ppa.launchpad.net/ethereum/ethereum/ubuntu artful main" >> /etc/apt/sources.list
RUN apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 2A518C819BE37D2C2031944D1C52189C923F6CA9
RUN apt-get update
RUN apt-get install -y -q ethereum solc

RUN mkdir /app

VOLUME /data
COPY . /app

RUN chmod +x /app/entrypoint.sh

WORKDIR /app
ENTRYPOINT /app/entrypoint.sh
