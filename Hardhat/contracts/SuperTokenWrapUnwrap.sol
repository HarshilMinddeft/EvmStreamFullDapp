// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Erc20Super is ERC20 ,ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable underlyingToken; // Native token address
    uint256 public totalNativeReserves;
    address private SuperOwner;
    mapping(address => int256) public netFlowRates;  // Flow rate for each account
    mapping(address => uint256) public lastUpdated;  // Last update time for each account

    event TokenUpgraded(address indexed account, uint256 amount);
    event TokenDowngraded(address indexed account, uint256 amount);

    constructor(
        string memory name,
        string memory symbol,
        address _underlyingToken
    ) ERC20(name, symbol) {
        require(_underlyingToken != address(0), "Underlying token is required");
        underlyingToken = IERC20(_underlyingToken);
        SuperOwner = msg.sender;
    }

    // Override balanceOf to include the dynamic streaming balance
    function balanceOf(address account) public view override returns (uint256) {
        uint256 staticBalance = super.balanceOf(account);
        int256 dynamicBalance = _calculateDynamicBalance(account);
        require(int256(staticBalance) + dynamicBalance >= 0, "Balance underflow");
        return uint256(int256(staticBalance) + dynamicBalance);
    }

    // Internal function to calculate the dynamic balance based on the flow rate and elapsed time
    function _calculateDynamicBalance(address account) internal view returns (int256) {
        int256 flowRate = netFlowRates[account];
        uint256 elapsedTime = block.timestamp - lastUpdated[account];
        return flowRate * int256(elapsedTime);
    }

    // Update the flow rate for a user (called by StreamManager contract)
    // Function will be changed to internal once testing completes
    function updateFlow(address account, int256 flowRate) external   {
        _updateBalance(account);
        netFlowRates[account] += flowRate;
        lastUpdated[account] = block.timestamp;
    }

    // Internal function to update the balance for a user
    function _updateBalance(address account) internal {
        int256 dynamicBalance = _calculateDynamicBalance(account);
        if (dynamicBalance > 0) {
            _mint(account, uint256(dynamicBalance));
        } else if (dynamicBalance < 0) {
            _burn(account, uint256(-dynamicBalance));
        }
    }

    function transfer(address recipient, uint256 amount) public override returns (bool) {
       _ensureSufficientBalance(msg.sender, amount);
        return super.transfer(recipient, amount);
    }

    function transferFrom(address sender,address recipient,uint256 amount) public override returns (bool) {
        _ensureSufficientBalance(sender, amount);
        return super.transferFrom(sender, recipient, amount);
    }

    function _ensureSufficientBalance(address account, uint256 amount) internal view {
      uint256 availableBalance = balanceOf(account); // Includes dynamic balance
       require(availableBalance >= amount, "Transfer amount exceeds available balance");
    }

    // Upgrade (wrap) function 
    function upgrade(uint256 amount) external nonReentrant{
        _upgrade(msg.sender, msg.sender, amount);
        totalNativeReserves += amount;
    }

    function upgradeTo(address to, uint256 amount) external nonReentrant{
        _upgrade(msg.sender, to, amount);
        totalNativeReserves += amount;
    }

    // Downgrade (unwrap) function
    function downgrade(uint256 amount) external nonReentrant{
        _downgrade(msg.sender, msg.sender, amount);
        totalNativeReserves -= amount;
    }

    function downgradeTo(address to, uint256 amount) external nonReentrant{
        _downgrade(msg.sender, to, amount);
        totalNativeReserves -= amount;
    }

    // Internal upgrade function 
    // Deducts user native tokens and mints exact amount 
    function _upgrade(
        address account,
        address to,
        uint256 amount
    ) private {
        uint256 amountBefore = underlyingToken.balanceOf(address(this));
        underlyingToken.safeTransferFrom(account, address(this), amount);
        uint256 amountAfter = underlyingToken.balanceOf(address(this));
        uint256 actualUpgradedAmount = amountAfter - amountBefore;

        require(amount == actualUpgradedAmount, "Inflationary/Deflationary tokens not supported");

        _mint(to, amount);
        emit TokenUpgraded(to, amount);
    }

    // Internal downgrade function
    function _downgrade(
        address account,
        address to,
        uint256 amount
    ) private {
        _burn(account, amount);

        uint256 amountBefore = underlyingToken.balanceOf(address(this));
        underlyingToken.safeTransfer(to, amount);
        uint256 amountAfter = underlyingToken.balanceOf(address(this));
        uint256 actualDowngradedAmount = amountBefore - amountAfter;

        require(amount == actualDowngradedAmount, "Inflationary/Deflationary tokens not supported");

        emit TokenDowngraded(account, amount);
    }


    // // Mint tokens to an account (onlyOwner)
    // function mint(address recipient, uint256 amount) external {
    //     _mint(recipient, amount);
    // }

// function used for stableCoin to set default decimals to 6 from 18
//     function decimals() public pure override returns (uint8) {
//     return 6;
// }

    function emergencyWithdraw() external {
        require(msg.sender == SuperOwner,"You are not Authorised");
            transferFrom(address(this), SuperOwner, totalNativeReserves);
    }

}
