import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useState } from 'react';
import { SCORE_NFT_CONTRACT_ADDRESS, SCORE_NFT_ABI } from '../lib/web3/wagmiConfig';

export function useMintScore() {
  const { address, isConnected } = useAccount();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  
  const { writeContract, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const mintScore = async (score: number, level: number) => {
    if (!address || !isConnected) {
      throw new Error('Wallet not connected');
    }
    
    if (SCORE_NFT_CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
      throw new Error('Contract not deployed yet');
    }

    try {
      writeContract({
        address: SCORE_NFT_CONTRACT_ADDRESS,
        abi: SCORE_NFT_ABI,
        functionName: 'mintScore',
        args: [address, BigInt(score), BigInt(level)],
      }, {
        onSuccess: (hash) => {
          setTxHash(hash);
        }
      });
    } catch (err) {
      console.error('Mint error:', err);
      throw err;
    }
  };

  return {
    mintScore,
    isPending,
    isConfirming,
    isSuccess,
    txHash,
    error,
    isConnected,
  };
}
