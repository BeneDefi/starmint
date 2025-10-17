import { http, createConfig } from 'wagmi';
import { base } from 'wagmi/chains';
import { injected, coinbaseWallet } from 'wagmi/connectors';

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    injected(),
    coinbaseWallet({ appName: 'STARMINT' }),
  ],
  transports: {
    [base.id]: http('https://mainnet.base.org'),
  },
});

// Contract address - update this after deploying the contract
export const SCORE_NFT_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

export const SCORE_NFT_ABI = [
  {
    name: 'mintScore',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'score', type: 'uint256' },
      { name: 'level', type: 'uint256' },
    ],
    outputs: [{ name: 'tokenId', type: 'uint256' }],
  },
  {
    name: 'getScoreData',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'score', type: 'uint256' },
          { name: 'level', type: 'uint256' },
          { name: 'timestamp', type: 'uint256' },
          { name: 'player', type: 'address' },
        ],
      },
    ],
  },
] as const;
