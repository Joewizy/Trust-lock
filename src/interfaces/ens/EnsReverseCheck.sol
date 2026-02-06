// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @notice ENS Registry interface (EIP-137 registry)
interface IENSRegistry {
    function resolver(bytes32 node) external view returns (address);
}

/// @notice Reverse registrar has node(address) -> bytes32 for addr.reverse
interface IReverseRegistrar {
    function node(address addr) external pure returns (bytes32);
}

/// @notice Reverse resolver interface (PublicResolver implements name(bytes32))
interface INameResolver {
    function name(bytes32 node) external view returns (string memory);
}

/// @notice Minimal reverse ENS checker (Sepolia)
library EnsReverseCheck {
    // Sepolia ENS Registry + ReverseRegistrar
    address internal constant ENS_REGISTRY = 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e;

    address internal constant REVERSE_REGISTRAR = 0xA0a1AbcDAe1a2a4A2EF8e9113Ff0e02DD81DC0C6;

    /// @notice Returns primary ENS name if reverse record exists, else empty string
    function reverseName(address user) internal view returns (string memory) {
        bytes32 reverseNode = IReverseRegistrar(REVERSE_REGISTRAR).node(user);
        address resolver = IENSRegistry(ENS_REGISTRY).resolver(reverseNode);
        if (resolver == address(0)) return "";
        // If resolver doesn't implement name(), this will revert. That's fine for our use via try/catch.
        return INameResolver(resolver).name(reverseNode);
    }

    /// @notice Safe version that never reverts; returns (hasENS, name)
    function safeReverseName(address user) internal view returns (bool, string memory) {
        bytes32 reverseNode = IReverseRegistrar(REVERSE_REGISTRAR).node(user);
        address resolver = IENSRegistry(ENS_REGISTRY).resolver(reverseNode);
        if (resolver == address(0)) return (false, "");

        try INameResolver(resolver).name(reverseNode) returns (string memory n) {
            if (bytes(n).length == 0) return (false, "");
            return (true, n);
        } catch {
            return (false, "");
        }
    }
}
