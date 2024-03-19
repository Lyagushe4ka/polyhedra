import fs from 'fs';
import { Contract, JsonRpcProvider, TransactionResponse, Wallet } from 'ethers';
import axios from 'axios';


const ETH_CONTRACT = '0x9234f83473C03be04358afC3497d6293B2203288';
const ABI = ['function claim(uint256 index, address account, uint256 amount, bytes32[] merkleProof)', 'function isClaimed(uint256 index) public view returns (bool)']

const provider = new JsonRpcProvider('https://eth-pokt.nodies.app');

const keys = fs.readFileSync('keys.txt', 'utf-8').replaceAll('\r', '').split('\n').map(x => x.trim()).filter(x => x.length > 0);

async function main() {

  const response = await axios.get('https://pub-88646eee386a4ddb840cfb05e7a8d8a5.r2.dev/eth_data/570.json');

  const data = response.data;

  for (const key of keys) {
    const wallet = new Wallet(key, provider);
    const contract = new Contract(ETH_CONTRACT, ABI, wallet);

    if (!data[wallet.address]) {
      console.log('Missing', wallet.address);
      continue;
    }

    const index = data[wallet.address].index;
    const isClaimed = await contract.isClaimed(index);

    if (isClaimed) {
      console.log('Already claimed', wallet.address);
      continue;
    }

    console.log('Claiming', wallet.address);

    const tx: TransactionResponse = await contract.claim(data[wallet.address].index, wallet.address, data[wallet.address].amount, data[wallet.address].proof);

    const receipt = await tx.wait();

    if (!receipt) {
      console.log('Failed to claim', wallet.address);
      continue;
    }

    console.log('Claimed, tx:', receipt.hash);

    await new Promise(resolve => setTimeout(resolve, 2_000)); // wait 2 seconds

  }

}

main()