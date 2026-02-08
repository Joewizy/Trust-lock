'use client';

import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useConfig } from 'wagmi'
import { waitForTransactionReceipt } from 'wagmi/actions'
import { formatEther, parseEther } from 'viem'
import { FaucetTokenAddress, FaucetTokenABI } from '@/lib/contracts/abi/faucet'
import { readContract } from 'wagmi/actions'
import { TreasuryAddress } from '../contracts/abi';

export function useFaucet() {
  const { address, isConnected } = useAccount()
  const [status, setStatus] = useState('')
  const config = useConfig();

  // Read user's faucet token balance
  const {data: balance, isLoading: isBalanceLoading,refetch: refetchBalance} = useReadContract({
    address: FaucetTokenAddress,
    abi: FaucetTokenABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && isConnected }
  })

  // Read faucet amount per claim
  const { data: faucetAmount } = useReadContract({
    address: FaucetTokenAddress,
    abi: FaucetTokenABI,
    functionName: 'faucetAmount'
  })

  // Read cooldown period
  const { data: cooldown } = useReadContract({
    address: FaucetTokenAddress,
    abi: FaucetTokenABI,
    functionName: 'cooldown'
  })

  // Read user's last claim timestamp
  const { data: lastClaimed } = useReadContract({
    address: FaucetTokenAddress,
    abi: FaucetTokenABI,
    functionName: 'lastClaimed',
    args: address ? [address] : undefined,
    query: { enabled: !!address && isConnected }
  })

  // Read allowance for specific spender
  const checkAllowance = async (spenderAddress: `0x${string}`, amount?: string) => {
    if (!address || !isConnected) {
      return { allowance: BigInt(0), formatted: '0', isSufficient: false }
    }

    try {
      const allowance = await readContract(config, {
        address: FaucetTokenAddress,
        abi: FaucetTokenABI,
        functionName: 'allowance',
        args: [address, spenderAddress]
      }) as bigint

      const formatted = formatEther(allowance || BigInt(0))
      const isSufficient = amount ? allowance >= parseEther(amount) : allowance > 0

      return {
        allowance,
        formatted,
        isSufficient
      }
    } catch (error) {
      console.error('Error checking allowance:', error)
      return { allowance: BigInt(0), formatted: '0', isSufficient: false }
    }
  }

  // Write contract operations
  const { 
    writeContractAsync, 
    data: hash, 
    isPending: isWritePending,
    reset: resetWrite 
  } = useWriteContract()

  // Calculate cooldown status
  const getCooldownStatus = () => {
    if (!lastClaimed || !cooldown) {
      return { canClaim: true, timeRemaining: 0 }
    }
    
    const now = Math.floor(Date.now() / 1000)
    const nextClaimTime = Number(lastClaimed) + Number(cooldown)
    const timeRemaining = Math.max(0, nextClaimTime - now)
    
    return {
      canClaim: timeRemaining === 0,
      timeRemaining
    }
  }

  const { canClaim, timeRemaining } = getCooldownStatus()

  // Format time remaining for display
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds === 0) return 'Available now'
    
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 24) {
      const days = Math.floor(hours / 24)
      const remainingHours = hours % 24
      return `${days} day${days > 1 ? 's' : ''}${remainingHours > 0 ? ` ${remainingHours}h` : ''}`
    }
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    
    return `${minutes}m ${seconds % 60}s`
  }

  // Claim faucet tokens
  const claimTokens = async () => {
    if (!address || !isConnected) {
      setStatus('❌ Connect wallet first')
      return false
    }

    if (!canClaim) {
      setStatus(`⏰ Cooldown active. Try again in ${formatTimeRemaining(timeRemaining)}`)
      return false
    }

    try {
      setStatus('⏳ Claiming tokens...')
      await writeContractAsync({
        address: FaucetTokenAddress,
        abi: FaucetTokenABI,
        functionName: 'claim'
      })
      return true
    } catch (error) {
      console.error('Claim error:', error)
      setStatus('❌ Failed to claim tokens')
      return false
    }
  }

  // Approve faucet tokens for spending
  const approveTokens = async (amount?: string) => {
    if (!address || !isConnected) {
      setStatus('❌ Connect wallet first')
      return false
    }

    if (!amount || parseFloat(amount) <= 0) {
      setStatus('❌ Invalid amount')
      return false
    }

    try {
      setStatus('⏳ Approving tokens...')
      
      // Validate amount is a number
      const amountNum = parseFloat(amount)
      if (isNaN(amountNum) || amountNum <= 0) {
        setStatus('❌ Invalid amount')
        return false
      }
      
      // If no amount specified, approve max uint256
      const amountToApprove = amount 
        ? parseEther(amountNum.toString())
        : BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffff')

      const result = await writeContractAsync({
        address: FaucetTokenAddress,
        abi: FaucetTokenABI as any,
        functionName: 'approve',
        args: [TreasuryAddress, amountToApprove]
      })
      
      setStatus('✅ Approval submitted! Waiting for confirmation...')
      
      // Wait for transaction receipt
      const hash = (result as any).hash;
      if (!hash) {
        setStatus('❌ Transaction failed');
        return false;
      }
      const receipt = await waitForTransactionReceipt(config, { hash: hash as `0x${string}` })
      
      console.log('Transaction receipt:', receipt)
      
      if (receipt && receipt.status === 'success') {
        setStatus('✅ Tokens approved successfully!')
        return true
      } else {
        setStatus('❌ Approval failed')
        console.error('Receipt status:', receipt?.status)
        return false
      }
    } catch (error) {
      console.error('Approve error:', error)
      setStatus('❌ Failed to approve tokens')
      return false
    }
  }

  // Handle transaction states
  useEffect(() => {
    if (isWritePending) {
      setStatus('⏳ Waiting for confirmation...')
    } else {
      setStatus('')
    }

    // Auto-clear status after success
    if (hash) {
      const timer = setTimeout(() => {
        setStatus('')
        resetWrite()
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [isWritePending, hash, resetWrite])

  return {
    // Data
    balance: balance && typeof balance === 'bigint' ? formatEther(balance) : '0',
    faucetAmount: faucetAmount && typeof faucetAmount === 'bigint' ? formatEther(faucetAmount) : '0',
    cooldown: cooldown ? Number(cooldown) : 0,
    lastClaimed: lastClaimed ? Number(lastClaimed) : null,

    // Statu
    canClaim,
    timeRemaining,
    formattedTimeRemaining: formatTimeRemaining(timeRemaining),

    // Loading states
    isLoading: isBalanceLoading,
    isTransactionPending: isWritePending,

    // Actions
    claimTokens,
    approveTokens,
    checkAllowance,
    refetchBalance,

    // UI State
    status,
    isConnected
  }
}