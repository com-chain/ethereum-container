const Web3 = require('web3')
const fs = require('fs')


const genesisPath = '/data/genesis.json'
const accountPath = '/data/.account.json'

const web3 = new Web3()
const account = web3.eth.accounts.create()
console.log('New account created!')
console.log('Address:', account.address)
console.log('Private Key:', account.privateKey)

const alloc = {}
alloc[account.address] = {
  "balance": "20000000000000000000"
}
const genesis = {
  config: {
    chainId: 211516,
    homesteadBlock: 0,
    eip155Block: 0,
    eip158Block: 0,
  },
  nonce: "0xD3E47BF55A27037A",
  timestamp: "0x0",
  parentHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
  extraData: "0x52425845",
  gasLimit: "0x8000000",
  difficulty: "0x10",
  mixhash: "0x0000000000000000000000000000000000000000000000000000000000000000",
  coinbase: "0x3333333333333333333333333333333333333333",
  alloc,
}

fs.writeFileSync(accountPath, JSON.stringify(account))
fs.writeFileSync(genesisPath, JSON.stringify(genesis))

// We should then create the genesis file
// Start geth
// Then add the contracts with their variables
// And ready to go (find a way to say that the network is ready, maybe a flag to init?)
