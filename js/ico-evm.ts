import type { IIcoInfoWithKey, IPurchaseAmount } from "~/types/Ico";
import LaunchpadABI from '@/abis/Launchpad.json';
import Web3 from 'web3';
import { ethers } from 'ethers';

// Proxy address (where calls are delegated through)
export const proxyAddress = '0x206236eca2dF8FB37EF1d024e1F72f4313f413E4';

// Provider (Infura, Alchemy, or Metamask provider)
// Use with ethers.js v6
const provider = new ethers.BrowserProvider(getMetaMaskEthereum());

// Connect the proxy address using the implementation ABI
export const proxyAsLaunchpad = new ethers.Contract(proxyAddress, LaunchpadABI, provider);

export function getMetaMaskEthereum(): any {
  const providers = window?.ethereum?.providers;

  // If multiple providers exist (MetaMask, Phantom, Brave, etc.)
  if (providers?.length) {
    const metamaskProvider = providers.find((p: { isMetaMask: any; }) => p.isMetaMask);
    if (!metamaskProvider) throw new Error('MetaMask provider not found');
    return metamaskProvider;
  }

  // Fallback: window.ethereum is MetaMask
  if (window.ethereum?.isMetaMask) {
    return window.ethereum;
  }

  throw new Error('MetaMask not found');
}

function mapEvmIcoToIIcoInfo(index: number, params: any, state: any): IIcoInfoWithKey {
    return {
        key: params.token.toString(),
        data: {
            seed: index,
            owner: state.ICOOwner,
            icoMint: params.token,
            icoDecimals: 10 ** Number(state.icoTokenDecimals),
            amount: Number(params.amount),
            costMint: params.paymentToken,
            startPrice: BigInt(params.startPrice),
            endPrice: BigInt(params.endPrice),
            startDate: Number(params.startDate) * 1000,
            endDate: Number(params.endDate) * 1000,
            bonusReserve: Number(params.bonusReserve),
            bonusPercentage: Number(params.bonusPercentage),
            bonusActivator: Number(params.bonusActivator),
            isClosed: state.isClosed ? 1 : 0,
            totalSold: Number(state.totalSold),
            totalReceived: Number(state.totalReceived),
            unlockPercentage: Number(params.vestingParams.unlockPercentage),
            cliffPeriod: Number(params.vestingParams.cliffPeriod),
            vestingPercentage: Number(params.vestingParams.vestingPercentage),
            vestingInterval: Number(params.vestingParams.vestingInterval),
            purchaseSeqNum: 0 // Add logic if you need to track purchases per user
        }
    };
}

export async function fetchAllICOs(): Promise<IIcoInfoWithKey[]> {
    try {
      const total = await proxyAsLaunchpad.counter();
      const results: IIcoInfoWithKey[] = [];
  
      for (let i = 0; i < Number(total); i++) {
        const ico = await proxyAsLaunchpad.getICO(i);
        const { 0: params, 1: state } = ico;
        results.push(mapEvmIcoToIIcoInfo(i, params, state));
      }
  
      return results;
    } catch (err) {
      console.error('Failed to fetch ICOs:', err);
      return [];
    }
}

export async function fetchICO(index: string): Promise<IIcoInfoWithKey | null> {
  try {
    const ico = await proxyAsLaunchpad.getICO(index);
    const { 0: params, 1: state } = ico;
    return mapEvmIcoToIIcoInfo(Number(index), params, state);
  } catch (err) {
    console.error('Failed to fetch ICO:', err);
    return null;
  }
}

async function findClosestBlockByTimestamp(targetTimestamp: number): Promise<number> {
  let latestBlockNumber = await provider.getBlockNumber();
  let earliest = 0;
  let latest = latestBlockNumber;

  while (earliest <= latest) {
    const middle = Math.floor((earliest + latest) / 2);
    const block = await provider.getBlock(middle);

    if (!block) break;

    const blockTimestamp = block.timestamp;

    if (blockTimestamp < targetTimestamp) {
      earliest = middle + 1;
    } else if (blockTimestamp > targetTimestamp) {
      latest = middle - 1;
    } else {
      return middle; // Exact match
    }
  }

  // Return the closest block before the timestamp
  return latest;
}

async function queryLogsInChunks(
  fromBlock: number,
  toBlock: number,
  chunkSize = 1000
) {
  let logs: any[] = [];
  const buyEventFilter = proxyAsLaunchpad.filters.BuyToken();

  for (let start = fromBlock; start <= toBlock; start += chunkSize + 1) {
    const end = Math.min(start + chunkSize, toBlock);

    const chunkLogs = await proxyAsLaunchpad.queryFilter(buyEventFilter, start, end);
    logs = logs.concat(chunkLogs);
  }
  return logs;
}

export async function getBuyHistory(buyerAddress: string, icoId: number, vestUnlockPercentage: number) {
  const ico = await proxyAsLaunchpad.getICO(icoId);
  const { 0: params, 1: state } = ico;
  const startTimestamp = parseInt(params.startDate);
  const startBlock = await findClosestBlockByTimestamp(startTimestamp);
  const latestBlock = await provider.getBlockNumber();

  const logs = await queryLogsInChunks(startBlock, latestBlock);

  const filtered = logs.filter(
    (log) =>
      log.args.buyer.toLowerCase() == buyerAddress.toLowerCase() &&
      Number(log.args.ICO_id) == icoId
  );
  filtered.sort((a, b) => (a.blockNumber > b.blockNumber ? -1 : 1));

  return await Promise.all(filtered.map(async (e: any) => {
    const block = await provider.getBlock(e.blockNumber);
    if(!block) return
    return {
      seed: e.transactionHash,
      buyer: e.args.buyer,
      ico: Number(e.args.ICO_id),
      buyAmount: e.args.amountBought.toString(),
      buyDate: block.timestamp * 1000,
      bonus: e.args.bonus.toString(),
      lockedAmount: (Number(e.args.amountBought) * vestUnlockPercentage / 100).toString(),
      totalClaimed: 0,
    };
  }));
}


export async function getEvmCostInfo(id: number, amount: BigInt) : Promise<IPurchaseAmount | null>  {
  try {
    if(!id && id <0 ) return null;
    const ico = await proxyAsLaunchpad.getValue(id, amount);
    const { 0: availableAmount, 1: value } = ico;
    
    return {
      value,
      availableAmount
    };
  } catch (error) {
    console.error('Failed to get EVM Cost Info', error);
    return null;
  }
}

export async function getPurchaseAmount(index: number) {
  const ico = await proxyAsLaunchpad.getICO(index);
  const { 0: params, 1: state } = ico;
  
}

