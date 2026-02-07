#!/bin/bash
set -e

echo "🚀 Syncing ABIs from Foundry to Frontend..."

OUT_DIR="out"
DEST_DIR="frontend/lib/contracts/abi/generated"

# Ensure destination exists
mkdir -p "$DEST_DIR"

# Copy only ABI JSONs
cp "$OUT_DIR/TrustLockCore.sol/TrustLockCore.json" "$DEST_DIR/"
cp "$OUT_DIR/TrustLockConfig.sol/TrustLockConfig.json" "$DEST_DIR/"
cp "$OUT_DIR/TrustLockCampaignManager.sol/TrustLockCampaignManager.json" "$DEST_DIR/"
cp "$OUT_DIR/TrustLockTreasury.sol/TrustLockTreasury.json" "$DEST_DIR/"
cp "$OUT_DIR/TrustLockVoting.sol/TrustLockVoting.json" "$DEST_DIR/"

echo "✅ ABIs synced successfully!"
echo "📁 Generated files in: $DEST_DIR"
ls -la "$DEST_DIR"
