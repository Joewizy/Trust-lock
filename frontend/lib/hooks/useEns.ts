import { useAccount, useEnsName, useEnsAvatar, useChainId } from "wagmi"
import { sepolia } from "wagmi/chains"

/**
 * useENS
 * - Resolves ENS name
 * - Resolves ENS avatar
 * - Provides clean UX states
 */
export function useENS() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  
  const isOnSepolia = chainId === sepolia.id

  // ENS name (reverse resolution)
  const {data: ensName, isLoading: isEnsNameLoading,isError: isEnsNameError,} = useEnsName({
    address,
    chainId: sepolia.id, 
  })

  // ENS avatar
  const {data: ensAvatar, isLoading: isEnsAvatarLoading,} = useEnsAvatar({
    name: ensName ?? undefined,
    chainId: sepolia.id,
  })

  const hasENS = Boolean(ensName)

  return {
    // wallet
    address,
    isConnected,
    chainId,

    // network
    isOnSepolia,

    // ENS
    ensName,
    ensAvatar,
    hasENS,

    // loading states
    isLoading: isEnsNameLoading || isEnsAvatarLoading,
    isEnsNameLoading,
    isEnsAvatarLoading,

    // errors
    isEnsNameError,

    // UX helpers
    status: !isConnected
      ? "disconnected"
      : !isOnSepolia
      ? "wrong-network"
      : isEnsNameLoading
      ? "loading"
      : hasENS
      ? "verified"
      : "no-ens",
  } as const
}
