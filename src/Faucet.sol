// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract TrustLockFaucetToken is ERC20, Ownable {
    uint256 public faucetAmount;
    uint256 public cooldown;

    error FaucetCooldownActive();

    mapping(address => uint256) public lastClaimed;

    event FaucetClaimed(address indexed user, uint256 amount);

    constructor(uint256 faucetAmount_, uint256 cooldown_) ERC20("TrustLock Faucet", "TLT") Ownable(msg.sender) {
        _mint(msg.sender, 100_000 * 10**18);
        faucetAmount = faucetAmount_;
        cooldown = cooldown_;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function claim() external {
        if (block.timestamp < lastClaimed[msg.sender] + cooldown) {
            revert FaucetCooldownActive();
        }

        lastClaimed[msg.sender] = block.timestamp;
        _mint(msg.sender, faucetAmount);

        emit FaucetClaimed(msg.sender, faucetAmount);
    }

    function setFaucetAmount(uint256 newAmount) external onlyOwner {
        faucetAmount = newAmount;
    }

    function setCooldown(uint256 newCooldown) external onlyOwner {
        cooldown = newCooldown;
    }
}
