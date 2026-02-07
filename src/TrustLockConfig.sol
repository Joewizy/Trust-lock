// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TrustLockConfig
 * @notice Central configuration contract for all tunable parameters in the TrustLock protocol.
 * @dev Owned by the protocol. All values are readable by other contracts.
 *      Setters include validation to maintain invariants.
 */
contract TrustLockConfig is Ownable {
    // CampaignManager params
    uint256 public minimumContribution;          // e.g., 0.001 ether
    uint256 public maxContributionPercentage;    // Basis points, e.g., 200 = 2%
    uint256 public fundingDuration;              // Seconds, e.g., 4 weeks
    uint256 public projectMaxDuration;           // Seconds, e.g., 52 weeks
    uint256 public protocolFeePercent;           // Percentage, e.g., 2

    // Voting params
    uint256 public votingDuration;               // Seconds, e.g., 7 days
    uint256 public minMilestonePercent;          // Percentage, e.g., 5
    uint256 public maxMilestonePercent;          // Percentage, e.g., 25
    uint256 public firstMilestoneMax;            // Percentage, e.g., 10
    uint256 public majorityThreshold;            // Percentage, e.g., 51
    uint256 public maxConsecutiveFailures;       // Count, e.g., 3
    uint256 public maxTotalFailures;             // Count, e.g., 5

    // String validation params
    uint256 public minTitleLength;               // e.g., 3
    uint256 public maxTitleLength;               // e.g., 100
    uint256 public minDescriptionLength;         // e.g., 10
    uint256 public maxDescriptionLength;         // e.g., 1000

    // Events for updates
    event ParamUpdated(string paramName, uint256 oldValue, uint256 newValue);

    // Errors
    error InvalidParamValue();
    error InvalidRange();

    constructor(address _owner) Ownable(_owner) {
        // Set initial values for the protocol
        minimumContribution = 0.001 ether;
        maxContributionPercentage = 200;
        fundingDuration = 4 weeks;
        projectMaxDuration = 52 weeks;
        protocolFeePercent = 2;

        votingDuration = 7 days;
        minMilestonePercent = 5;
        maxMilestonePercent = 25;
        firstMilestoneMax = 10;
        majorityThreshold = 51;
        maxConsecutiveFailures = 3;
        maxTotalFailures = 5;

        minTitleLength = 3;
        maxTitleLength = 100;
        minDescriptionLength = 10;
        maxDescriptionLength = 1000;
    }

    // Setters with validation (onlyOwner)
    function setMinimumContribution(uint256 _value) external onlyOwner {
        if (_value == 0) revert InvalidParamValue();
        uint256 oldValue = minimumContribution;
        minimumContribution = _value;
        emit ParamUpdated("minimumContribution", oldValue, _value);
    }

    function setMaxContributionPercentage(uint256 _value) external onlyOwner {
        if (_value == 0 || _value > 10000) revert InvalidParamValue();
        uint256 oldValue = maxContributionPercentage;
        maxContributionPercentage = _value;
        emit ParamUpdated("maxContributionPercentage", oldValue, _value);
    }

    function setFundingDuration(uint256 _value) external onlyOwner {
        if (_value == 0) revert InvalidParamValue();
        uint256 oldValue = fundingDuration;
        fundingDuration = _value;
        emit ParamUpdated("fundingDuration", oldValue, _value);
    }

    function setProjectMaxDuration(uint256 _value) external onlyOwner {
        if (_value == 0) revert InvalidParamValue();
        uint256 oldValue = projectMaxDuration;
        projectMaxDuration = _value;
        emit ParamUpdated("projectMaxDuration", oldValue, _value);
    }

    function setProtocolFeePercent(uint256 _value) external onlyOwner {
        if (_value > 100) revert InvalidParamValue();
        uint256 oldValue = protocolFeePercent;
        protocolFeePercent = _value;
        emit ParamUpdated("protocolFeePercent", oldValue, _value);
    }

    function setVotingDuration(uint256 _value) external onlyOwner {
        if (_value == 0) revert InvalidParamValue();
        uint256 oldValue = votingDuration;
        votingDuration = _value;
        emit ParamUpdated("votingDuration", oldValue, _value);
    }

    function setMinMilestonePercent(uint256 _value) external onlyOwner {
        if (_value == 0 || _value >= maxMilestonePercent) revert InvalidRange();
        uint256 oldValue = minMilestonePercent;
        minMilestonePercent = _value;
        emit ParamUpdated("minMilestonePercent", oldValue, _value);
    }

    function setMaxMilestonePercent(uint256 _value) external onlyOwner {
        if (_value <= minMilestonePercent || _value > 100) revert InvalidRange();
        uint256 oldValue = maxMilestonePercent;
        maxMilestonePercent = _value;
        emit ParamUpdated("maxMilestonePercent", oldValue, _value);
    }

    function setFirstMilestoneMax(uint256 _value) external onlyOwner {
        if (_value == 0 || _value > maxMilestonePercent) revert InvalidRange();
        uint256 oldValue = firstMilestoneMax;
        firstMilestoneMax = _value;
        emit ParamUpdated("firstMilestoneMax", oldValue, _value);
    }

    function setMajorityThreshold(uint256 _value) external onlyOwner {
        if (_value <= 50 || _value > 100) revert InvalidRange();
        uint256 oldValue = majorityThreshold;
        majorityThreshold = _value;
        emit ParamUpdated("majorityThreshold", oldValue, _value);
    }

    function setMaxConsecutiveFailures(uint256 _value) external onlyOwner {
        if (_value == 0) revert InvalidParamValue();
        uint256 oldValue = maxConsecutiveFailures;
        maxConsecutiveFailures = _value;
        emit ParamUpdated("maxConsecutiveFailures", oldValue, _value);
    }

    function setMaxTotalFailures(uint256 _value) external onlyOwner {
        if (_value == 0) revert InvalidParamValue();
        uint256 oldValue = maxTotalFailures;
        maxTotalFailures = _value;
        emit ParamUpdated("maxTotalFailures", oldValue, _value);
    }

    function setMinTitleLength(uint256 _value) external onlyOwner {
        if (_value == 0 || _value >= maxTitleLength) revert InvalidRange();
        uint256 oldValue = minTitleLength;
        minTitleLength = _value;
        emit ParamUpdated("minTitleLength", oldValue, _value);
    }

    function setMaxTitleLength(uint256 _value) external onlyOwner {
        if (_value <= minTitleLength) revert InvalidRange();
        uint256 oldValue = maxTitleLength;
        maxTitleLength = _value;
        emit ParamUpdated("maxTitleLength", oldValue, _value);
    }

    function setMinDescriptionLength(uint256 _value) external onlyOwner {
        if (_value == 0 || _value >= maxDescriptionLength) revert InvalidRange();
        uint256 oldValue = minDescriptionLength;
        minDescriptionLength = _value;
        emit ParamUpdated("minDescriptionLength", oldValue, _value);
    }

    function setMaxDescriptionLength(uint256 _value) external onlyOwner {
        if (_value <= minDescriptionLength) revert InvalidRange();
        uint256 oldValue = maxDescriptionLength;
        maxDescriptionLength = _value;
        emit ParamUpdated("maxDescriptionLength", oldValue, _value);
    }

    // Batch update for efficiency
    function updateMultipleParams(
        uint256 _minimumContribution,
        uint256 _maxContributionPercentage,
        uint256 _fundingDuration,
        uint256 _projectMaxDuration,
        uint256 _protocolFeePercent,
        uint256 _votingDuration,
        uint256 _minMilestonePercent,
        uint256 _maxMilestonePercent,
        uint256 _firstMilestoneMax,
        uint256 _majorityThreshold,
        uint256 _maxConsecutiveFailures,
        uint256 _maxTotalFailures
    ) external onlyOwner {
        // Validate all values before updating
        if (_minimumContribution == 0) revert InvalidParamValue();
        if (_maxContributionPercentage == 0 || _maxContributionPercentage > 10000) revert InvalidParamValue();
        if (_fundingDuration == 0) revert InvalidParamValue();
        if (_projectMaxDuration == 0) revert InvalidParamValue();
        if (_protocolFeePercent > 100) revert InvalidParamValue();
        if (_votingDuration == 0) revert InvalidParamValue();
        if (_minMilestonePercent == 0 || _minMilestonePercent >= _maxMilestonePercent) revert InvalidRange();
        if (_maxMilestonePercent <= _minMilestonePercent || _maxMilestonePercent > 100) revert InvalidRange();
        if (_firstMilestoneMax == 0 || _firstMilestoneMax > _maxMilestonePercent) revert InvalidRange();
        if (_majorityThreshold <= 50 || _majorityThreshold > 100) revert InvalidRange();
        if (_maxConsecutiveFailures == 0) revert InvalidParamValue();
        if (_maxTotalFailures == 0) revert InvalidParamValue();

        // Update all values
        minimumContribution = _minimumContribution;
        maxContributionPercentage = _maxContributionPercentage;
        fundingDuration = _fundingDuration;
        projectMaxDuration = _projectMaxDuration;
        protocolFeePercent = _protocolFeePercent;
        votingDuration = _votingDuration;
        minMilestonePercent = _minMilestonePercent;
        maxMilestonePercent = _maxMilestonePercent;
        firstMilestoneMax = _firstMilestoneMax;
        majorityThreshold = _majorityThreshold;
        maxConsecutiveFailures = _maxConsecutiveFailures;
        maxTotalFailures = _maxTotalFailures;

        emit ParamUpdated("batchUpdate", 0, block.timestamp);
    }

    // ============ BATCH VIEW FUNCTIONS ============
    
    function getCampaignConfig() external view returns (
        uint256 _minimumContribution,
        uint256 _maxContributionPercentage,
        uint256 _fundingDuration,
        uint256 _projectMaxDuration,
        uint256 _protocolFeePercent,
        uint256 _minTitleLength,
        uint256 _maxTitleLength,
        uint256 _minDescriptionLength,
        uint256 _maxDescriptionLength
    ) {
        return (
            minimumContribution,
            maxContributionPercentage,
            fundingDuration,
            projectMaxDuration,
            protocolFeePercent,
            minTitleLength,
            maxTitleLength,
            minDescriptionLength,
            maxDescriptionLength
        );
    }

    function getVotingConfig() external view returns (
        uint256 _votingDuration,
        uint256 _minMilestonePercent,
        uint256 _maxMilestonePercent,
        uint256 _firstMilestoneMax,
        uint256 _majorityThreshold,
        uint256 _maxConsecutiveFailures,
        uint256 _maxTotalFailures
    ) {
        return (
            votingDuration,
            minMilestonePercent,
            maxMilestonePercent,
            firstMilestoneMax,
            majorityThreshold,
            maxConsecutiveFailures,
            maxTotalFailures
        );
    }

    function getCoreConfig() external view returns (
        uint256 _minimumContribution,
        uint256 _maxContributionPercentage,
        uint256 _protocolFeePercent,
        uint256 _votingDuration,
        uint256 _minMilestonePercent,
        uint256 _maxMilestonePercent
    ) {
        return (
            minimumContribution,
            maxContributionPercentage,
            protocolFeePercent,
            votingDuration,
            minMilestonePercent,
            maxMilestonePercent
        );
    }
}
