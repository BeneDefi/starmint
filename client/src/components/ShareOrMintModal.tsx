import { useState } from 'react';
import { X, Share2, Coins } from 'lucide-react';
import { useMiniKit } from '../lib/miniapp/minikit';
import { useMintScore } from '../hooks/useMintScore';
import { useAccount, useConnect } from 'wagmi';

interface ShareOrMintModalProps {
  isOpen: boolean;
  onClose: () => void;
  score: number;
  level: number;
}

export function ShareOrMintModal({ isOpen, onClose, score, level }: ShareOrMintModalProps) {
  const { shareScore } = useMiniKit();
  const { mintScore, isPending, isConfirming, isSuccess, txHash } = useMintScore();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const [mintError, setMintError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleShare = async () => {
    try {
      await shareScore(score);
      onClose();
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  const handleMint = async () => {
    if (!isConnected) {
      // Try to connect wallet
      const coinbaseConnector = connectors.find(c => c.name.toLowerCase().includes('coinbase'));
      if (coinbaseConnector) {
        connect({ connector: coinbaseConnector });
      }
      return;
    }

    try {
      setMintError(null);
      await mintScore(score, level);
    } catch (error: any) {
      setMintError(error.message || 'Failed to mint NFT');
      console.error('Mint failed:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-gradient-to-br from-purple-900/90 to-cyan-900/90 rounded-2xl p-6 shadow-2xl border border-purple-500/30">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">🎉 Great Score!</h2>
          <p className="text-2xl font-bold text-cyan-400">{score.toLocaleString()} Points</p>
          <p className="text-lg text-purple-300">Level {level}</p>
        </div>

        {isSuccess ? (
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-4">
            <p className="text-green-300 text-center mb-2">✅ NFT Minted Successfully!</p>
            {txHash && (
              <a
                href={`https://basescan.org/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-cyan-400 hover:text-cyan-300 block text-center underline"
              >
                View on BaseScan
              </a>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-4">
              <button
                onClick={handleShare}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center gap-3"
              >
                <Share2 size={24} />
                Share on Farcaster
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-purple-500/30"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-purple-900/90 text-purple-300">or</span>
                </div>
              </div>

              <button
                onClick={handleMint}
                disabled={isPending || isConfirming}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 disabled:transform-none flex items-center justify-center gap-3"
              >
                <Coins size={24} />
                {!isConnected
                  ? 'Connect Wallet & Mint on Base'
                  : isPending
                  ? 'Confirm in Wallet...'
                  : isConfirming
                  ? 'Minting NFT...'
                  : 'Mint Score as NFT on Base'}
              </button>
            </div>

            {mintError && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
                <p className="text-red-300 text-sm text-center">{mintError}</p>
              </div>
            )}

            <p className="text-xs text-purple-300/60 text-center">
              {isConnected ? (
                <>Minting costs ~$0.01-0.05 in gas fees on Base</>
              ) : (
                <>Connect your wallet to mint your score as an NFT on Base mainnet</>
              )}
            </p>
          </>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full text-purple-300 hover:text-white transition-colors py-2"
        >
          Close
        </button>
      </div>
    </div>
  );
}
