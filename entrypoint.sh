#!/bin/bash

if [ ! -f /data/.account.json ]; then
  yarn

  # Generate the genesis.json file
  node generate-genesis.js

  # Initialise the network with the genesis file
  geth init --datadir /data/eth /data/genesis.json
fi

# Deploy the contracts
node deploy-contracts.js

geth --datadir /data/eth
