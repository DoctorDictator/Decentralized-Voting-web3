// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract Voting is Ownable, ReentrancyGuard, Pausable {
    constructor() Ownable(msg.sender) {}

    uint256 private nextVoteId;

    struct Vote {
        string uri;
        address owner;
        uint256 endTime;
        uint256 quorum;
        uint256[] voteCounts;
        mapping(address => bool) voted;
        uint256 options;
        bool cancelled;
        uint256 totalVotes;
    }

    mapping(uint256 => Vote) private votes;
    mapping(address => bool) public members;

    error NotMember();
    error AlreadyMember();
    error AlreadyVoted();
    error VoteExpired();
    error VoteAlreadyCancelled();
    error InvalidOption();
    error VoteNotFound();
    error InvalidEndTime();
    error InvalidOptionsCount();
    error NotVoteOwner();

    event MemberJoined(address indexed member, uint256 joinedAt);
    event VoteCreated(
        address indexed owner,
        uint256 indexed voteId,
        uint256 indexed createdAt,
        uint256 endTime,
        uint256 options,
        uint256 quorum
    );
    event Voted(
        address indexed voter,
        uint256 indexed voteId,
        uint256 indexed option,
        uint256 createdAt,
        uint256 totalVotes
    );
    event VoteCancelled(
        address indexed owner,
        uint256 indexed voteId,
        uint256 cancelledAt
    );

    modifier onlyMember() {
        if (!members[msg.sender]) revert NotMember();
        _;
    }

    modifier validVote(uint256 voteId) {
        if (voteId >= nextVoteId) revert VoteNotFound();
        _;
    }

    modifier voteActive(uint256 voteId) {
        Vote storage v = votes[voteId];
        if (block.timestamp > v.endTime) revert VoteExpired();
        if (v.cancelled) revert VoteAlreadyCancelled();
        _;
    }

    function join() external whenNotPaused nonReentrant {
        if (members[msg.sender]) revert AlreadyMember();
        members[msg.sender] = true;
        emit MemberJoined(msg.sender, block.timestamp);
    }

    function createVote(
        string calldata uri,
        uint256 endTime,
        uint256 options,
        uint256 quorum
    ) external whenNotPaused onlyMember {
        if (options < 2 || options > 8) revert InvalidOptionsCount();
        if (endTime <= block.timestamp) revert InvalidEndTime();

        uint256 voteId = nextVoteId;

        votes[voteId].uri = uri;
        votes[voteId].owner = msg.sender;
        votes[voteId].endTime = endTime;
        votes[voteId].options = options;
        votes[voteId].quorum = quorum;
        votes[voteId].voteCounts = new uint256[](options);

        emit VoteCreated(msg.sender, voteId, block.timestamp, endTime, options, quorum);
        nextVoteId++;
    }

    function vote(uint256 voteId, uint256 option)
        external
        whenNotPaused
        onlyMember
        validVote(voteId)
        voteActive(voteId)
        nonReentrant
    {
        Vote storage v = votes[voteId];
        if (option >= v.options) revert InvalidOption();
        if (v.voted[msg.sender]) revert AlreadyVoted();

        v.voteCounts[option]++;
        v.voted[msg.sender] = true;
        v.totalVotes++;

        emit Voted(msg.sender, voteId, option, block.timestamp, v.totalVotes);
    }

    function cancelVote(uint256 voteId)
        external
        onlyMember
        validVote(voteId)
    {
        Vote storage v = votes[voteId];
        if (v.owner != msg.sender) revert NotVoteOwner();
        if (block.timestamp > v.endTime) revert VoteExpired();
        if (v.cancelled) revert VoteAlreadyCancelled();

        v.cancelled = true;
        emit VoteCancelled(msg.sender, voteId, block.timestamp);
    }

    function getVote(uint256 voteId)
        external
        view
        validVote(voteId)
        returns (
            string memory uri,
            address owner,
            uint256[] memory voteCounts,
            uint256 endTime,
            uint256 quorum,
            bool cancelled,
            uint256 totalVotes
        )
    {
        Vote storage v = votes[voteId];
        return (v.uri, v.owner, v.voteCounts, v.endTime, v.quorum, v.cancelled, v.totalVotes);
    }

    function didVote(address member, uint256 voteId)
        external
        view
        validVote(voteId)
        returns (bool)
    {
        return votes[voteId].voted[member];
    }

    function getVoteCount() external view returns (uint256) {
        return nextVoteId;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
