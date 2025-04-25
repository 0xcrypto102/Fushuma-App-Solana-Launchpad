import type { IIcoInfoWithKey } from "~/types/Ico";
import LaunchpadABI from '@/abis/Launchpad.json';
import Web3 from 'web3';

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

export async function fetchAllICOs(launchpadContract: any): Promise<IIcoInfoWithKey[]> {
    try {
      const total = await launchpadContract.methods.counter().call();
      const results: IIcoInfoWithKey[] = [];
  
      for (let i = 0; i < Number(total); i++) {
        const ico = await launchpadContract.methods.getICO(i).call();
        const { 0: params, 1: state } = ico;
        results.push(mapEvmIcoToIIcoInfo(i, params, state));
      }
  
      return results;
    } catch (err) {
      console.error('Failed to fetch ICOs:', err);
      return [];
    }
}

export async function fetchICO(launchpadContract: any, index: string): Promise<IIcoInfoWithKey | null> {
  try {
    const ico = await launchpadContract.methods.getICO(index).call();
    const { 0: params, 1: state } = ico;
    return mapEvmIcoToIIcoInfo(Number(index), params, state);
  } catch (err) {
    console.error('Failed to fetch ICO:', err);
    return null;
  }
}

const web3 = new Web3(window.ethereum);
export const launchpadAddress = '0x6Dd2CD52042439629ccC58dA3BCdBA1B9A24840B';
export const launchpad = new web3.eth.Contract(LaunchpadABI, launchpadAddress);

