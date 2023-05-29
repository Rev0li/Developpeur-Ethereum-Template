// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol";

contract Voting is Ownable {
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint votedProposalId;
    }
    struct Proposal {
        string description;
        uint voteCount;
    }

    enum WorkflowStatus {
        RegisteringVoters,
        ProposalsRegistrationStarted,
        ProposalsRegistrationEnded,
        VotingSessionStarted,
        VotingSessionEnded,
        VotesTallied
    }

    event VoterRegistered(address voterAddress);
    event WorkflowStatusChange(
        WorkflowStatus previousStatus,
        WorkflowStatus newStatus
    );
    event ProposalRegistered(uint proposalId);
    event Voted(address voter, uint proposalId);

    mapping(address => Voter) voters;

    Proposal[] proposals;

    WorkflowStatus public currentWorkflowStatus;
    uint public voterCount;
    uint public winnerProposalId;

    modifier checkRegistered(address _address) {
        require(voters[_address].isRegistered, "You are not whitelisted");
        _;
    }

    // Admin setWhitelist
    function whitelisted(address _address) public onlyOwner {
        require(!voters[_address].isRegistered, "deja whiteliste");

        voters[_address].isRegistered = true;
        voterCount++;

        emit VoterRegistered(_address);
    }

    // Admin opens proposals
    function startProposition() public onlyOwner {
        //Bonus (j'ai trouvé ca logique)
        require(voterCount >= 3, "Minimum of 3 registrations required");

        WorkflowStatus oldStatus = currentWorkflowStatus;
        currentWorkflowStatus = WorkflowStatus.ProposalsRegistrationStarted;

        emit WorkflowStatusChange(oldStatus, currentWorkflowStatus);
    }

    // Commit your proposal
    function addProposal(
        string memory _description
    ) public checkRegistered(msg.sender) {
        require(
            currentWorkflowStatus ==
                WorkflowStatus.ProposalsRegistrationStarted,
            "Registration proposal is not open"
        );
        uint proposalId = proposals.length;
        Proposal memory myProposal;
        myProposal.description = _description;
        myProposal.voteCount = 0;
        proposals.push(myProposal);
        emit ProposalRegistered(proposalId);
    }

    // Admin stop les propositions
    function endProposition() public onlyOwner {
        require(
            currentWorkflowStatus == WorkflowStatus.ProposalsRegistrationStarted
        );

        require(proposals.length > 0, "No proposal");

        WorkflowStatus oldStatus = currentWorkflowStatus;
        currentWorkflowStatus = WorkflowStatus.ProposalsRegistrationEnded;

        emit WorkflowStatusChange(oldStatus, currentWorkflowStatus);
    }

    // Admin start les Votes
    function startVote() public onlyOwner {
        require(
            currentWorkflowStatus == WorkflowStatus.ProposalsRegistrationEnded
        );

        WorkflowStatus oldStatus = currentWorkflowStatus;
        currentWorkflowStatus = WorkflowStatus.VotingSessionStarted;

        emit WorkflowStatusChange(oldStatus, currentWorkflowStatus);
    }

    // Recovery all proposals
    function getAllProposalDetails()
        public
        view
        returns (uint[] memory, string[] memory)
    {
        uint[] memory indices = new uint[](proposals.length);
        string[] memory descriptions = new string[](proposals.length);

        for (uint i = 0; i < proposals.length; i++) {
            indices[i] = i;
            descriptions[i] = proposals[i].description;
        }

        return (indices, descriptions);
    }

    // Voting for the best proposal
    function addVote(uint proposalId) public checkRegistered(msg.sender) {
        require(
            currentWorkflowStatus == WorkflowStatus.VotingSessionStarted,
            "Voting is not open"
        );
        require(!voters[msg.sender].hasVoted, "You have already voted");
        voters[msg.sender].hasVoted = true;
        voters[msg.sender].votedProposalId = proposalId;
        proposals[proposalId].voteCount++;

        emit Voted(msg.sender, proposalId);
    }

    // The Admin stop the Votes
    function endVote() public onlyOwner {
        WorkflowStatus oldStatus = currentWorkflowStatus;
        currentWorkflowStatus = WorkflowStatus.VotingSessionEnded;
        emit WorkflowStatusChange(oldStatus, currentWorkflowStatus);
    }

    // The Admin counts the votes
    function nbVote() public onlyOwner returns (uint) {
        require(
            currentWorkflowStatus == WorkflowStatus.VotingSessionEnded,
            "Vote is not close"
        );

        uint totalVoteCount = 0;
        for (uint i = 0; i < proposals.length; i++) {
            totalVoteCount += proposals[i].voteCount;
        }

        WorkflowStatus oldStatus = currentWorkflowStatus;
        currentWorkflowStatus = WorkflowStatus.VotesTallied;
        emit WorkflowStatusChange(oldStatus, currentWorkflowStatus);

        return totalVoteCount;
    }

    // Recovery of winner
    function getWinner() public returns (uint) {
        require(
            currentWorkflowStatus == WorkflowStatus.VotesTallied,
            "Vote is not tallied"
        );

        uint maxVoteCount = 0;

        for (uint i = 0; i < proposals.length; i++) {
            if (proposals[i].voteCount > maxVoteCount) {
                maxVoteCount = proposals[i].voteCount;
                winnerProposalId = i;
            }
        }
        return winnerProposalId;
    }

    // Recovery of winner's details
    function readDetailWinner(
        uint _winnerId
    ) public view checkRegistered(msg.sender) returns (Proposal memory) {
        _winnerId = winnerProposalId;
        return proposals[_winnerId];
    }
}

// 0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2
// 0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db
// 0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB
// 0x617F2E2fD72FD9D5503197092aC168c91465E7f2
// 0x17F6AD8Ef982297579C203069C1DbfFE4348c372
