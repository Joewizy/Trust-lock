// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console} from "forge-std/Test.sol";
import {EnsReverseCheck} from "../src/interfaces/ens/EnsReverseCheck.sol";

contract EnsSepoliaForkTest is Test {
    function setUp() public {
        string memory rpc = vm.envString("SEPOLIA_RPC_URL");
        vm.createSelectFork(rpc);
    }

    function test_reverseName_nonEmpty_forKnownENSUser() public view {
        address user = vm.envAddress("ENS_OWNER");
        address user2 = vm.envAddress("ENS_OWNER2");

        (bool ok, string memory n) = EnsReverseCheck.safeReverseName(user);
        (bool ok2, string memory n2) = EnsReverseCheck.safeReverseName(user2);

        assertTrue(ok, "Expected ENS reverse record to be set (primary name)");
        assertGt(bytes(n).length, 0, "ENS name empty");
        // optional: log it
        console.log("ENS name:", n);
        console.log("ENS name:", n2);
    }

    function test_reverseName_empty_forRandomAddress() public view {
        // Most random addresses will not have reverse set
        address random = address(0x000000000000000000000000000000000000000BEEF);

        (bool ok, string memory n) = EnsReverseCheck.safeReverseName(random);
        assertTrue(!ok, "Expected no ENS for random address");
        assertEq(bytes(n).length, 0);
    }

    // function test_reverseName_directENSQuery() public view {
    //     // Test with a sample address (this will likely have no reverse on Sepolia)
    //     address sample = 0xd8dA6F2699aF8016494bA01B3c4c796A2A9D641;
        
    //     (bool ok, string memory n) = EnsReverseCheck.safeReverseName(sample);
    //     // On Sepolia, this likely won't have reverse record
    //     if (ok) {
    //         console.log("Found ENS for sample address on Sepolia:", n);
    //     } else {
    //         console.log("No ENS for sample address on Sepolia (expected)");
    //     }
    // }

    // function test_ensLibraryFunctions() public view {
    //     // Test with address that won't have resolver
    //     address testAddr = address(0x000000000000000000000000000000000000000123456789);
        
    //     // Test safeReverseName (never reverts)
    //     (bool hasEns, string memory safeName) = EnsReverseCheck.safeReverseName(testAddr);
    //     assertFalse(hasEns, "Random address should not have ENS");
    //     assertEq(bytes(safeName).length, 0, "Safe name should be empty");
    // }
}
