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

    constructor() {
        currentWorkflowStatus = WorkflowStatus.RegisteringVoters;
    }

    modifier checkRegistered(address _address) {
        require(!voters[_address].isRegistered, "You are not whitelisted");
        _;
    }

    modifier registrationIsOpen() {
        require(
            (currentWorkflowStatus ==
                WorkflowStatus.ProposalsRegistrationStarted) &&
                (currentWorkflowStatus !=
                    WorkflowStatus.ProposalsRegistrationEnded),
            "Registration is not open"
        );
        _;
    }

    // L'administrateur du vote enregistre une liste blanche d'électeurs identifiés par leur adresse Ethereum.
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

    // Admin stop les propositions
    function endProposition() public onlyOwner {
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

    // Admin stop les Votes
    function endVote() public onlyOwner {
        WorkflowStatus oldStatus = currentWorkflowStatus;
        currentWorkflowStatus = WorkflowStatus.VotingSessionEnded;
        emit WorkflowStatusChange(oldStatus, currentWorkflowStatus);
    }

    // Emettre une proposition
    function emitProposition(
        string memory _description,
        uint _Id
    ) public checkRegistered(msg.sender) {
        Proposal memory newProposal = Proposal(_description, (0));
        proposals.push(newProposal);
        emit ProposalRegistered(_Id);
    }

    // Function pour comptaliser les votes et changer status VotingSessionEnded
    function comptabiliserVote() public {
        WorkflowStatus oldStatus = currentWorkflowStatus;
        currentWorkflowStatus = WorkflowStatus.VotingSessionEnded;
        emit WorkflowStatusChange(oldStatus, currentWorkflowStatus);
    }
}

// L'administrateur du vote commence la session de vote.
//"function onlyOwner qui change l'état de WorkflowStatus avec VotingSessionStarted  "

// Les électeurs inscrits votent pour leur proposition préférée.
//"function public qui demande l'id de leur proposition preferee "

// L'administrateur du vote met fin à la session de vote.
//"fonction onlyOwner qui change l'état de WorkflowStatus avec VotingSessionEnded"

// L'administrateur du vote comptabilise les votes.
//"fonction onlyOwner pour ajouter dans un tableau le nombre de votes => proposition"

//Votre smart contract doit définir un uint winningProposalId qui représente l’id du gagnant ou une fonction getWinner qui retourne le gagnant.
//"function getWinner public, qui retourne le gagnant (address,id proposition, nombre de vote, description), WorkflowStatus => VotesTallied "

// Tout le monde peut vérifier les derniers détails de la proposition gagnante.
//"fonction public qui permet de read la description de la proposition gragnant"

//     contract Admin is Ownable{

// 	mapping(address=> bool) whitelist;

// 	event Authorized(address _address);

// 	function authorized(address _addressW) public onlyOwner {
//         require(!whitelist[_addressW], "deja whiteliste");
//         whitelist[_addressW] = true;
// 	}

//     function isWhitelist(address _addr) public view returns(bool) {
//     return whitelist[_addr];
//     }

// }
