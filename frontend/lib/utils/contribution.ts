import { formatEther } from 'viem';

/**
 * Calculate the maximum contribution a user can make to a campaign
 * based on the 2% rule (max 2% of funding goal)
 */
export function calculateMaxContribution(
  fundingGoal: bigint | string,
  userCurrentContribution: bigint | string = '0',
  maxContributionPercent: number = 2
): {
  maxContribution: string;
  maxContributionWei: bigint;
  remainingContribution: string;
  remainingContributionWei: bigint;
  canContribute: boolean;
  isAtLimit: boolean;
} {
  // Convert to BigInt for calculations
  const fundingGoalWei = typeof fundingGoal === 'bigint' ? fundingGoal : BigInt(fundingGoal);
  const userContributionWei = typeof userCurrentContribution === 'bigint' ? userCurrentContribution : BigInt(userCurrentContribution);

  // Calculate max contribution (2% of funding goal)
  const maxContributionWei = (fundingGoalWei * BigInt(maxContributionPercent)) / BigInt(100);
  
  // Calculate remaining contribution (max - current)
  const remainingContributionWei = maxContributionWei - userContributionWei;

  // Convert to ether for display
  const maxContribution = formatEther(maxContributionWei);
  const remainingContribution = formatEther(remainingContributionWei);

  // Determine contribution status
  const isAtLimit = userContributionWei >= maxContributionWei;
  const canContribute = !isAtLimit && remainingContributionWei > BigInt(0);

  return {
    maxContribution,
    maxContributionWei,
    remainingContribution,
    remainingContributionWei,
    canContribute,
    isAtLimit
  };
}

/**
 * Validate a contribution amount against the 2% rule
 */
export function validateContribution(
  amount: string,
  fundingGoal: bigint | string,
  userCurrentContribution: bigint | string = '0',
  maxContributionPercent: number = 2
): {
  isValid: boolean;
  error?: string;
  remainingContribution: string;
} {
  const { remainingContribution, canContribute } = calculateMaxContribution(
    fundingGoal,
    userCurrentContribution,
    maxContributionPercent
  );

  if (!canContribute) {
    return {
      isValid: false,
      error: 'You have reached your maximum contribution limit for this campaign.',
      remainingContribution
    };
  }

  const amountNum = parseFloat(amount || '0');
  const remainingNum = parseFloat(remainingContribution);

  if (amountNum > remainingNum) {
    return {
      isValid: false,
      error: `Maximum contribution is ${remainingContribution} ETH (2% of funding goal). You can only contribute ${remainingContribution} ETH more.`,
      remainingContribution
    };
  }

  if (amountNum <= 0) {
    return {
      isValid: false,
      error: 'Contribution amount must be greater than 0.',
      remainingContribution
    };
  }

  return {
    isValid: true,
    remainingContribution
  };
}

/**
 * Format contribution amount with proper decimal places
 */
export function formatContributionAmount(value: bigint | string | undefined): string {
  try {
    if (value == null) return '0.00';
    const wei = typeof value === 'bigint' ? value : BigInt(String(value));
    const amount = parseFloat(formatEther(wei));
    return amount.toFixed(2);
  } catch {
    return '0.00';
  }
}
