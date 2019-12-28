const {spawn} = require('child_process')
const fs = require('fs')
const glob = require('glob-promise')
const solc = require('solc')
const Web3 = require('web3')

const ethDataDir = '/data/eth/' //process.env.ETH_DATADIR
const accountPath = '/data/.account.json'


let gethState = 'stopped'
function hasState (state) {
  const promisifiedHasState = (r) => {
    if (gethState !== state) {
      setTimeout(() => promisifiedHasState(r), 100)
    } else {
      r()
    }
  }
  return promisifiedHasState
}


async function getContracts () {
  return (await glob('./currency/*.sol'))
    .map((contractFile) => {
      const variablesFile = `${contractFile.substring(0, contractFile.length - 4)}.json`
      const variables = JSON.parse(fs.readFileSync(variablesFile, 'utf-8'))
      const contract = fs.readFileSync(contractFile, 'utf-8')
      return {contract, variables}
    })
}


async function main () {
  const geth = spawn('geth', ['--datadir', ethDataDir, '--rpc', '--rpcapi', 'eth,net,web3,personal', '--mine', '--minerthreads', '1', '--gasprice', '1'])
  geth.stderr.on('data', (data) => {
    // console.log(data.toString())
    // TODO: Replace this check with a proper HTTP check on api endpoint
    if (data.includes('HTTP endpoint opened')) {
      gethState = 'ready'
    }
  })
  geth.on('close', () => gethState = 'stopped')

  await new Promise(hasState('ready'))
  const web3 = new Web3('http://localhost:8545')

  // Compile and deploy contracts
  const contracts = (await getContracts())
    .map((contractsData) => {
      const {contract, variables} = contractsData
      const compiled = solc.compile(contract, 1)
      const ret = []
      for (const compiledContractName in compiled.contracts) {
        console.log('Debug cn:', compiledContractName)
        ret.push({
          abi: JSON.parse(compiled.contracts[compiledContractName].interface),
          bytecode: compiled.contracts[compiledContractName].bytecode,
          gas: compiled.contracts[compiledContractName].gasEstimates.creation[1],
          name: compiledContractName,
          variables: variables[compiledContractName],
        })
      }
      return ret
    })
    .reduce((acc, tab) => acc.concat(tab), [])

  // Lets get the account
  const accountFile = JSON.parse(fs.readFileSync(accountPath, 'utf-8'))
  const account = web3.eth.accounts.privateKeyToAccount(accountFile.privateKey)
  let accs = await web3.eth.personal.getAccounts()
  if (accs.indexOf(account.address) === -1) {
    await web3.eth.personal.importRawKey(account.privateKey.substr(2), '')
  }
  accs = await web3.eth.personal.getAccounts()
  await web3.eth.personal.unlockAccount(account.address, null, 300)

  // Only need to do the transactions now!
  for (const contractData of contracts) {
    console.log('Mining contract', contractData.name, 'with variables:', contractData.variables)
    const options = {
      arguments: Object.values(contractData.variables),
      from: account.address,
      gas: 20000000,
      gasPrice: 10000000000,
    }
    const contract = new web3.eth.Contract(contractData.abi, null, {data: `0x${contractData.bytecode}`})
    const instance = contract.deploy(options)
    const receipt = await instance.send(options)

    console.log('Successfully mined contract', contractData.name, 'at address:', receipt.options.address)
  }

  geth.kill('SIGINT')
  await new Promise(hasState('stopped'))
}

main()
