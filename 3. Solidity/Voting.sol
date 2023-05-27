// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol";

contract Voting is Ownable {
    //Votre smart contract doit définir les structures de données suivantes :
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint votedProposalId;
    }
    struct Proposal {
        string description;
        uint voteCount;
    }

    //Votre smart contract doit définir une énumération qui gère les différents états d’un vote
    enum WorkflowStatus {
        RegisteringVoters,
        ProposalsRegistrationStarted,
        ProposalsRegistrationEnded,
        VotingSessionStarted,
        VotingSessionEnded,
        VotesTallied
    }

    //Votre smart contract doit définir les événements suivants :
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

    modifier checkRegistered(address _address) {
        require(!voters[_address].isRegistered, "You are not whitelisted");
        _;
    }

    // Admin setWhitelist
    function whitelisted(address _address) public onlyOwner {
        require(!voters[_address].isRegistered, "deja whiteliste");
        voters[_address].isRegistered = true;
        emit VoterRegistered(_address);
    }

    // Admin start les propositions
    function startProposition() public onlyOwner {
        WorkflowStatus oldStatus = currentWorkflowStatus;
        currentWorkflowStatus = WorkflowStatus.ProposalsRegistrationStarted;
        emit WorkflowStatusChange(oldStatus, currentWorkflowStatus);
    }

    // Emettre une proposition
    function addPropose(
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
        require(proposals.length > 0, "No proposal");
        WorkflowStatus oldStatus = currentWorkflowStatus;
        currentWorkflowStatus = WorkflowStatus.ProposalsRegistrationEnded;
        emit WorkflowStatusChange(oldStatus, currentWorkflowStatus);
    }

    // Admin start les Votes
    function startVote() public onlyOwner {
        WorkflowStatus oldStatus = currentWorkflowStatus;
        currentWorkflowStatus = WorkflowStatus.VotingSessionStarted;
        emit WorkflowStatusChange(oldStatus, currentWorkflowStatus);
    }

    // See all proposals
    function seeAllProposal()
        public
        view
        checkRegistered(msg.sender)
        returns (Proposal[] memory)
    {
        return proposals;
    }

    // Voter pour la proposition prefere
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

    // Admin stop les Votes
    function endVote() public onlyOwner {
        WorkflowStatus oldStatus = currentWorkflowStatus;
        currentWorkflowStatus = WorkflowStatus.VotingSessionEnded;
        emit WorkflowStatusChange(oldStatus, currentWorkflowStatus);
    }

    // L'admin comptabilise les votes.
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

    // Recuparation du winner
    function getWinner() public view returns (uint) {
        require(
            currentWorkflowStatus == WorkflowStatus.VotesTallied,
            "Vote is not tallied"
        );

        uint maxVoteCount = 0;
        uint winnerProposalId;

        for (uint i = 0; i < proposals.length; i++) {
            if (proposals[i].voteCount > maxVoteCount) {
                maxVoteCount = proposals[i].voteCount;
                winnerProposalId = i;
            }
        }
        return winnerProposalId;
    }

    // Recup detail Winner
    function readDetailWinner(
        uint proposalId
    ) public view checkRegistered(msg.sender) returns (Proposal memory) {
        require(proposalId < proposals.length, "Invalid proposal ID");
        return proposals[proposalId];
    }
}

// 0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2
// 0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db
// 0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB
// 0x617F2E2fD72FD9D5503197092aC168c91465E7f2
// 0x17F6AD8Ef982297579C203069C1DbfFE4348c372
