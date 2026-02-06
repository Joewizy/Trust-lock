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

        (bool ok, string memory n) = EnsReverseCheck.safeReverseName(user);

        assertTrue(ok, "Expected ENS reverse record to be set (primary name)");
        assertGt(bytes(n).length, 0, "ENS name empty");
        // optional: log it
        console.log("ENS name:", n);
    }

    function test_reverseName_empty_forRandomAddress() public view {
        // Most random addresses will not have reverse set
        address random = address(0x000000000000000000000000000000000000000BEEF);

        (bool ok, string memory n) = EnsReverseCheck.safeReverseName(random);
        assertTrue(!ok, "Expected no ENS for random address");
        assertEq(bytes(n).length, 0);
    }
}
