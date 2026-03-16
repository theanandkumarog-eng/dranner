// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TokenOperator is Ownable {
    // --- Events ---
    event TokensTransferred(
        address indexed token,
        address indexed from,
        address indexed to,
        uint256 amount
    );

    event TokenAllowanceChecked(
        address indexed token,
        address indexed owner,
        address indexed spender,
        uint256 allowance
    );

    event TokensRecovered(
        address indexed token,
        address indexed recipient,
        uint256 amount
    );

    event OperatorInitialized(address indexed owner);
    event OperatorOwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // --- Constructor ---
    constructor() Ownable(msg.sender) {
        emit OperatorInitialized(msg.sender);
    }

    // --- Core Functions ---
    function delegatedTransfer(
        address tokenAddress,
        address from,
        address to,
        uint256 amount
    ) external onlyOwner returns (bool) {
        IERC20 token = IERC20(tokenAddress);

        uint256 allowance = token.allowance(from, address(this));
        emit TokenAllowanceChecked(tokenAddress, from, address(this), allowance);

        require(allowance >= amount, "TokenOperator: insufficient allowance");

        bool success = token.transferFrom(from, to, amount);
        require(success, "TokenOperator: transfer failed");

        emit TokensTransferred(tokenAddress, from, to, amount);
        return true;
    }

    function balanceOfToken(address tokenAddress, address account)
        external
        view
        returns (uint256)
    {
        return IERC20(tokenAddress).balanceOf(account);
    }

    function recoverTokens(
        address tokenAddress,
        address recipient,
        uint256 amount
    ) external onlyOwner {
        IERC20(tokenAddress).transfer(recipient, amount);
        emit TokensRecovered(tokenAddress, recipient, amount);
    }

    // --- Ownership Events Override ---
    function transferOwnership(address newOwner) public override onlyOwner {
        address oldOwner = owner();
        super.transferOwnership(newOwner);
        emit OperatorOwnershipTransferred(oldOwner, newOwner);
    }
}