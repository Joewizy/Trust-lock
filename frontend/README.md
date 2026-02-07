# TRUSTLOCK 🔒

**Milestone-based decentralized crowdfunding with on-chain accountability**

Built for **HackMoney 2026**

---

## What is TRUSTLOCK?

TRUSTLOCK solves the crowdfunding accountability problem. Instead of giving all funds upfront and hoping creators deliver, funds are released incrementally **only when contributors vote to approve milestones**.

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

## 🚀 How TRUSTLOCK Works: 4 Simple Steps

### **1️⃣ CREATE**
As a creator, you **host a funding raise** by:
- Setting your funding goal and timeline
- Defining your project and milestones
- Choosing accepted tokens (ETH or ERC20)

### **2️⃣ FUND**  
Contributors **discover your raise** and:
- Review your project details
- Contribute using accepted tokens
- Become voting stakeholders

### **3️⃣ BUILD & VOTE**
You **build and submit milestones**:
- Complete work and submit milestone claims
- Contributors vote after verification
- Democratic approval of progress

### **4️⃣ RELEASE or REFUND**
Two possible outcomes:
- ✅ **Vote Passes**: Percentage of funds released to you
- ❌ **Vote Fails**: Failure counter increments
  - **3 consecutive failures OR 5 total failures** = Campaign failed
  - **Automatic refunds enabled** for all contributors

---

## 📋 Detailed Mechanics

### **Milestone Voting Rules**
- **Creator submits milestone** (5-25% of total funds)
  - First milestone max 10%
  - Must describe work completed
  
- **Contributors vote** (7-day voting period)
  - One wallet = one vote
  - Need 25% participation minimum
  - Need 51% approval to pass

- **Automatic outcome**
  - ✅ **Approved:** Funds released (minus 2% protocol fee)
  - ❌ **Rejected:** Failure counter increases

### **Campaign States**
```
FUNDING → ACTIVE → VOTING → ACTIVE/COMPLETED/FAILED
```

- **FUNDING**: 4-week window to reach goal
- **ACTIVE**: Goal reached, milestones can be created
- **VOTING**: Milestone voting in progress
- **COMPLETED**: All milestones approved
- **FAILED**: Too many failed milestones

---

## 🏗️ System Architecture

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

## Frontend Development

### Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### ABI Synchronization

After building contracts (forge build), sync the ABIs to the frontend:

```bash
# From frontend directory
npm run sync-abi

# Or from root directory
./scripts/sync-abi.sh
```

This script:
- Copies compiled contract ABIs from `out/` to `frontend/lib/contracts/abi/generated/`
- Makes them available for frontend integration
- Should be run after any contract changes

### Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Web3**: Wagmi + Viem
- **UI Components**: shadcn/ui
- **TypeScript**: Full type safety

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
