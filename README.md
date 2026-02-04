# TrustLock 🔒

**Milestone-based decentralized crowdfunding with on-chain accountability**

Built for **HackMoney 2026**

---

## What is TrustLock?

TrustLock solves the crowdfunding accountability problem. Instead of giving all funds upfront and hoping creators deliver, funds are released incrementally **only when contributors vote to approve milestones**.

**The Problem:**
- Traditional crowdfunding: creators get all money upfront, no accountability
- Contributors lose control after contributing
- No recourse if projects fail to deliver

**The Solution:**
- Funds locked in smart contract
- Released in stages (milestones) 
- Contributors vote on each milestone
- Automatic refunds if campaign fails

---

## How It Works

### Simple 4-Step Process

```
1. CREATE     →  2. FUND      →  3. BUILD & VOTE  →  4. RELEASE
Creator makes    Contributors     Creator submits     Funds released
campaign         donate funds    work, get votes     when approved
```

### Detailed Workflow

#### **Phase 1: Campaign Creation**
- Creator sets funding goal (e.g., 10 ETH)
- Sets project duration (e.g., 30 weeks)
- Chooses ETH or ERC20 token
- 4-week funding window starts

#### **Phase 2: Funding**
- Contributors donate (minimum 0.001 ETH or ERC20 token)
- Funds held in Treasury contract
- Once goal reached → Campaign becomes ACTIVE
- If deadline passes without goal → Refunds available

#### **Phase 3: Milestone Execution**
1. **Creator submits milestone** (5-25% of total funds)
   - First milestone max 10%
   - Must describe work completed
   
2. **Contributors vote** (7-day voting period)
   - One wallet = one vote
   - Need 25% participation minimum
   - Need 51% approval to pass

3. **Automatic outcome**
   - ✅ **Approved:** Funds released (minus 2% fee)
   - ❌ **Rejected:** Failure counter increases

#### **Phase 4: Completion or Failure**
- **Success:** All milestones approved, all funds released
- **Failure:** 3 consecutive failures OR 5 total failures → Refunds enabled

---

## System Architecture

```
┌─────────────────────┐
│   TrustLockCore     │  ← Main entry point (you interact here)
└──────────┬──────────┘
           │
     ┌─────┴─────┬─────────────┬──────────────┐
     ▼           ▼             ▼              ▼
┌─────────┐ ┌─────────┐ ┌──────────┐ ┌─────────────┐
│Campaign │ │ Voting  │ │ Treasury │ │ Token List  │
│ Manager │ │         │ │          │ │ Management  │
└─────────┘ └─────────┘ └──────────┘ └─────────────┘
```

### **TrustLockCore** (Main Contract)
- Single interface for all operations
- Manages accepted tokens
- Coordinates all sub-contracts
- Emergency pause controls

### **CampaignManager**
- Creates campaigns
- Tracks contributions
- Manages campaign states
- Maintains contributor lists

### **Voting**
- Handles milestone creation
- Manages voting process
- Calculates vote outcomes
- Enforces voting rules

### **Treasury**
- Holds all funds (ETH & tokens)
- Releases approved milestone payments
- Processes refunds
- Collects protocol fees (2%)

---

## Key Features

### ✅ **Fair Voting**
- One wallet = one vote (not weighted by money)
- Every contributor has equal say
- Can't vote twice

### 🔐 **Secure Escrow**
- Funds locked in contract
- Only released when voted
- No human intervention needed

### 🔄 **Automatic Refunds**
- Campaign didn't reach goal → Full refund
- Too many failed milestones → Proportional refund
- No manual claims needed (just call function)

### ⚡ **Multi-Token Support**
- Accept ETH
- Accept any ERC20 (USDC, USDT, DAI, etc.)
- Admin adds approved tokens

---

## Example Scenarios

### ✅ Successful Campaign

```
Day 1:  Creator makes campaign - 10 ETH goal
Day 5:  5 contributors each give 2 ETH
        → Goal reached! Campaign becomes ACTIVE

Week 2: Creator submits Milestone #1 (10%)
        "Completed smart contracts"
        → 7-day vote starts

Week 3: 4/5 contributors vote YES (80% approval)
        → Creator receives 1 ETH 

Week 6: Milestone #2 (20%) approved
        → Creator receives 2 ETH

Week 10: Final milestone (70%) approved
         → Creator receives remaining ETH except 2% fee
         → 2% fee collected 
         → Campaign COMPLETED
```

### ❌ Failed Campaign (No Funding)

```
Day 1:  Creator makes campaign - 10 ETH goal
Day 28: Only 3 ETH raised
        → Deadline passes
        → Campaign stuck in FUNDING state

Day 29: Contributors call claimRefund()
        → Each gets 100% back
```

### ❌ Failed Campaign (Bad Milestones)

```
Week 1: Campaign funded (10 ETH)
Week 2: Milestone #1 rejected (work was bad)
Week 4: Milestone #2 rejected
Week 6: Milestone #3 rejected
        → 3 consecutive failures
        → Campaign enters FAILED state

Week 7: Contributors claim refunds
        → Get proportional amount back
          (all 10 ETH since nothing released)
```

---

## Campaign States

```
┌─────────────┐
│   FUNDING   │ ──── Goal NOT reached ───→ ❌ FAILED (refunds)
│ (4 weeks)   │
└──────┬──────┘
       │ Goal reached
       ▼
┌─────────────┐
│   ACTIVE    │ ──── Creator creates milestone ───→ ┌─────────────┐
│  (Ready)    │                                    │   VOTING    │
└──────┬──────┘                                    │ (7 days)    │
       │ Milestone approved                        └──────┬──────┘
       ▼                                            │ Approved
┌─────────────┐                                    ▼
│   ACTIVE    │ ──── More milestones? ────YES──→ ┌─────────────┐
│ (Continue)  │                              │   ACTIVE    │
└──────┬──────┘                              │ (Continue)  │
       │ NO more milestones                    └──────┬──────┘
       ▼                                            │
┌─────────────┐                                    ▼
│ COMPLETED   │                              ┌─────────────┐
│ (Success!)  │                              │   ACTIVE    │
└─────────────┘                              │ (Continue)  │
                                              └──────┬──────┘
                                                     │
                                                     ▼
                                              ┌─────────────┐
                                              │   VOTING    │
                                              │ (7 days)    │
                                              └──────┬──────┘
                                                     │ Rejected
                                                     ▼
                                              ┌─────────────┐
                                              │   ACTIVE    │
                                              │ (Failure+1) │
                                              └──────┬──────┘
                                                     │
                                                     ▼
                                              3 consecutive OR
                                              5 total failures?
                                                     │ YES
                                                     ▼
                                              ┌─────────────┐
                                              │   FAILED    │
                                              │ (refunds)   │
                                              └─────────────┘
```

### 🎯 **Simple Flow Summary:**

1. **FUNDING** → Try to raise money (4 weeks)
2. **ACTIVE** → Goal reached, ready for milestones  
3. **VOTING** → Contributors vote on milestone (7 days)
4. **Loop**: ACTIVE → VOTING → ACTIVE (repeat until done)
5. **End States:**
   - ✅ **COMPLETED** = All milestones approved
   - ❌ **FAILED** = Too many rejected milestones

---

## Important Rules

### Campaign Creation
- ✅ Minimum goal: 0.001 ETH
- ✅ Max duration: 52 weeks (1 year)
- ✅ Funding period: 4 weeks
- ✅ Must specify ETH or token

### Contributing
- ✅ Minimum: 0.01 ETH
- ✅ Maximum: 20% of goal contribution per contributor
- ❌ Creator cannot contribute to own campaign
- ❌ Cannot exceed funding goal

### Milestones
- ✅ First milestone: Max 10%
- ✅ Other milestones: 5-25%
- ✅ Must be multiples of 5% (5, 10, 15, 20, 25)
- ✅ Creator must own campaign to create milestone

### Voting
- ✅ Voting period: 7 days
- ✅ Minimum participation: 25% of contributors
- ✅ Approval threshold: 51% of votes
- ✅ Can only vote once per milestone
- ✅ Must be a contributor to vote

### Failure Conditions
- ✅ 3 **consecutive** failed milestones → FAILED
- ✅ 5 **total** failed milestones → FAILED
- ✅ Successful milestone resets consecutive counter

---

## For Developers

### Build & Test

```bash
# Install dependencies
forge install

# Build contracts
forge build

# Run tests
forge test

# Run tests with details
forge test -vvv

# Check gas usage
forge test --gas-report

# Check coverage
forge coverage
```

### Deploy

```bash
# Setup environment
cp .env.example .env
# Edit .env with your PRIVATE_KEY and RPC_URL

# Deploy to testnet
forge script script/DeployTrustLock.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --verify
```

---

## Contract Addresses

**Testnet (Sepolia):**
- TrustLockCore: `[Coming Soon]`
- CampaignManager: `[Coming Soon]`
- Voting: `[Coming Soon]`
- Treasury: `[Coming Soon]`

---


## Team

[Daniel Ochoja](https://github.com/Ochoja) for **ETHGlobal HackMoney 2026**

---

## License

MIT License - see LICENSE file
