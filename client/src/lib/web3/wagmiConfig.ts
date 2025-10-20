import { http, createConfig } from 'wagmi';
import { base } from 'viem/chains';
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

// ⚠️ DEPLOYMENT REQUIRED: Update this address after deploying ScoreNFT contract
// 
// Steps to deploy:
// 1. Follow instructions in DEPLOYMENT.md
// 2. Deploy using Foundry or Hardhat (see scripts/deploy.js)
// 3. Copy the deployed contract address from the deployment output
// 4. Replace the address below with your deployed contract address
// 5. Restart the development server
//
// Example: export const SCORE_NFT_CONTRACT_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678' as const;
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
