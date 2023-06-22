const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");

describe("Contract Voting", function () {
  let votingInstance;
  let owner, alice, bob, patric;

  beforeEach(async function () {
    const Voting = await ethers.getContractFactory("Voting");
    votingInstance = await Voting.deploy();
    await votingInstance.deployed();

    [owner, alice, bob, patric] = await ethers.getSigners();

    providerAlice = votingInstance.connect(alice);
    providerBob = votingInstance.connect(bob);
    providerPatric = votingInstance.connect(patric);
  });

  ////////////////////   REGISTRATION   \\\\\\\\\\\\\\\\\\\

  describe("function addVoter and getVoter", function () {
    it("should return Caller is not the owner", async () => {
      await expect(providerAlice.addVoter(alice.address)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("should return Voters registration is not open yet", async () => {
      await votingInstance.startProposalsRegistering();

      await expect(votingInstance.addVoter(alice.address)).to.be.revertedWith(
        "Voters registration is not open yet"
      );
    });

    it("should return Already registered ", async () => {
      await votingInstance.addVoter(alice.address);

      await expect(votingInstance.addVoter(alice.address)).to.be.revertedWith(
        "Already registered"
      );
    });

    it("should emit a new struc in a mapping with address Voters", async () => {
      await expect(votingInstance.addVoter(alice.address))
        .to.emit(votingInstance, "VoterRegistered")
        .withArgs(alice.address);
    });

    it("should return struc of Voter with getVoters", async () => {
      await votingInstance.addVoter(alice.address);
      await votingInstance.addVoter(bob.address);

      const voter = await votingInstance.connect(bob).getVoter(alice.address);
      expect(await voter.isRegistered).to.be.true;
      expect(await voter.hasVoted).to.be.false;
      expect(await voter.votedProposalId).to.be.instanceOf(ethers.BigNumber);
    });

    it("should return You're not a voter", async () => {
      await votingInstance.addVoter(alice.address);

      await expect(votingInstance.getVoter(alice.address)).to.be.rejectedWith(
        "You're not a voter"
      );
    });
  });

  ////////////////////   PROPOSAL   \\\\\\\\\\\\\\\\\\\
  describe("function proposal and getOneProposal", function () {
    it("should return You're not a voter", async () => {
      await votingInstance.startProposalsRegistering();
      await expect(
        votingInstance.addProposal("hello world")
      ).to.be.revertedWith("You're not a voter");
    });

    it("should return Proposals are not allowed yet", async () => {
      await votingInstance.addVoter(alice.address);

      await expect(providerAlice.addProposal("hello you")).to.be.revertedWith(
        "Proposals are not allowed yet"
      );
    });

    it("should return Vous ne pouvez pas ne rien proposer", async () => {
      await votingInstance.addVoter(alice.address);
      await votingInstance.startProposalsRegistering();

      await expect(providerAlice.addProposal("")).to.be.revertedWith(
        "Vous ne pouvez pas ne rien proposer"
      );
    });

    it("should add and get a proposal equal ", async () => {
      await votingInstance.addVoter(alice.address);
      await votingInstance.addVoter(bob.address);
      await votingInstance.addVoter(patric.address);

      await votingInstance.startProposalsRegistering();

      await providerAlice.addProposal("hello world");
      await providerBob.addProposal("My name is Bob");
      await providerPatric.addProposal("Moi c'est Pa pa patric");

      const proposal1 = await providerAlice.getOneProposal(1);
      const proposal2 = await providerBob.getOneProposal(2);
      const proposal3 = await providerPatric.getOneProposal(3);

      expect(await proposal1.description).to.equal("hello world");
      expect(await proposal2.description).to.equal("My name is Bob");
      expect(await proposal3.description).to.equal("Moi c'est Pa pa patric");
    });

    it("should emit in proposalsArray a voter proposal ", async () => {
      await votingInstance.addVoter(alice.address);
      await votingInstance.startProposalsRegistering();

      await expect(providerAlice.addProposal("hello you"))
        .to.emit(votingInstance, "ProposalRegistered")
        .withArgs(1);
    });

    it("should return You're not a voter", async () => {
      await votingInstance.addVoter(alice.address);
      await votingInstance.startProposalsRegistering();
      await providerAlice.addProposal("hello world");

      await expect(
        votingInstance.getOneProposal(alice.address)
      ).to.be.rejectedWith("You're not a voter");
    });
  });

  ////////////////////   VOTE   \\\\\\\\\\\\\\\\\\\

  describe("function setVote", function () {
    beforeEach(async function () {
      await votingInstance.addVoter(alice.address);
      await votingInstance.addVoter(bob.address);
      await votingInstance.addVoter(patric.address);

      await votingInstance.startProposalsRegistering();

      await providerAlice.addProposal("hello world");
      await providerBob.addProposal("My name is Bob");
      await providerPatric.addProposal("Moi c'est Pa pa patric");
    });

    it("should return You're not a voter", async () => {
      await expect(votingInstance.setVote(2)).to.be.revertedWith(
        "You're not a voter"
      );
    });

    it("should return Voting session havent started yet", async () => {
      await votingInstance.endProposalsRegistering();

      await expect(providerAlice.setVote(2)).to.be.revertedWith(
        "Voting session havent started yet"
      );
    });

    it("should return You have already voted", async () => {
      await votingInstance.endProposalsRegistering();
      await votingInstance.startVotingSession();

      await providerBob.setVote(1);

      await expect(providerBob.setVote(1)).to.be.revertedWith(
        "You have already voted"
      );
    });

    it("should return Proposal not found", async () => {
      await votingInstance.endProposalsRegistering();
      await votingInstance.startVotingSession();
      await expect(providerAlice.setVote(5)).to.be.revertedWith(
        "Proposal not found"
      );
    });

    it("should voteCount", async () => {
      await votingInstance.endProposalsRegistering();
      await votingInstance.startVotingSession();

      await providerBob.setVote(1);
      await providerAlice.setVote(1);
      await providerPatric.setVote(2);

      const recupProposal1 = await providerBob.getOneProposal(1);
      const recupProposal2 = await providerBob.getOneProposal(2);
      const recupProposal3 = await providerBob.getOneProposal(3);

      expect(await recupProposal1.voteCount).to.equal(ethers.BigNumber.from(2));
      expect(await recupProposal2.voteCount).to.equal(ethers.BigNumber.from(1));
      expect(await recupProposal3.voteCount).to.equal(ethers.BigNumber.from(0));
    });

    it("should recup hasVoted true and votedProposal Id and voteCount", async () => {
      await votingInstance.endProposalsRegistering();
      await votingInstance.startVotingSession();

      await providerAlice.setVote(1);

      const voter = await providerAlice.getVoter(alice.address);

      await expect(voter.hasVoted).to.be.true;
      await expect(voter.votedProposalId).to.equal(ethers.BigNumber.from(1));
    });

    it("should emit address and voterProposalId in proposalsArray and in mapping", async () => {
      await votingInstance.endProposalsRegistering();
      await votingInstance.startVotingSession();

      await expect(providerAlice.setVote(1))
        .to.emit(votingInstance, "Voted")
        .withArgs(alice.address, 1);
    });
  });

  ////////////////////   TALLYVOTES   \\\\\\\\\\\\\\\\\\\

  describe("tallyVotes", async () => {
    beforeEach(async function () {
      await votingInstance.addVoter(alice.address);
      await votingInstance.addVoter(bob.address);
      await votingInstance.addVoter(patric.address);

      await votingInstance.startProposalsRegistering();

      await providerAlice.addProposal("hello world");
      await providerBob.addProposal("My name is Bob");
      await providerPatric.addProposal("Moi c'est Pa pa patric");

      await votingInstance.endProposalsRegistering();
      await votingInstance.startVotingSession();

      await providerBob.setVote(1);
      await providerAlice.setVote(1);
      await providerPatric.setVote(2);
    });

    it("should return Ownable: caller is not the owner", async () => {
      await votingInstance.endVotingSession();
      await expect(providerAlice.tallyVotes()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("require Voting session ended", async () => {
      await expect(votingInstance.tallyVotes()).to.be.revertedWith(
        "Current status is not voting session ended"
      );
    });

    it("emit WorkflowStatusChange", async () => {
      await votingInstance.endVotingSession();

      await expect(await votingInstance.tallyVotes())
        .to.emit(votingInstance, "WorkflowStatusChange")
        .withArgs(4, 5);
    });
  });

  ////////////////////   STATE   \\\\\\\\\\\\\\\\\\\

  describe("startProposalsRegistering", async () => {
    it("should return Ownable: caller is not the owner", async () => {
      await expect(
        providerAlice.startProposalsRegistering()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should return Registering proposals cant be started now", async () => {
      await votingInstance.startProposalsRegistering();
      await votingInstance.endProposalsRegistering();
      await expect(
        votingInstance.startProposalsRegistering()
      ).to.be.revertedWith("Registering proposals cant be started now");
    });

    it("should emit WorkflowStatusChange 0 to 1", async () => {
      await expect(await votingInstance.startProposalsRegistering())
        .to.emit(votingInstance, "WorkflowStatusChange")
        .withArgs(0, 1);
    });
  });

  describe("endProposalsRegistering", async () => {
    it("should return Ownable: caller is not the owner", async () => {
      await expect(providerAlice.endProposalsRegistering()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("should return Registering proposals havent started yet", async () => {
      await expect(votingInstance.endProposalsRegistering()).to.be.revertedWith(
        "Registering proposals havent started yet"
      );
    });

    it("should emit WorkflowStatusChange 1 to 2", async () => {
      await votingInstance.startProposalsRegistering();

      await expect(await votingInstance.endProposalsRegistering())
        .to.emit(votingInstance, "WorkflowStatusChange")
        .withArgs(1, 2);
    });
  });

  describe("startVotingSession", async () => {
    it("should return Ownable: caller is not the owner", async () => {
      await expect(providerAlice.startVotingSession()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("should return Registering proposals phase is not finished", async () => {
      await expect(votingInstance.startVotingSession()).to.be.revertedWith(
        "Registering proposals phase is not finished"
      );
    });

    it("should emit WorkflowStatusChange 2 to 3", async () => {
      await votingInstance.startProposalsRegistering();
      await votingInstance.endProposalsRegistering();

      await expect(await votingInstance.startVotingSession())
        .to.emit(votingInstance, "WorkflowStatusChange")
        .withArgs(2, 3);
    });
  });

  describe("endVotingSession", async () => {
    it("should return Ownable: caller is not the owner", async () => {
      await expect(providerAlice.endVotingSession()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("should return Voting session havent started yet", async () => {
      await expect(votingInstance.endVotingSession()).to.be.revertedWith(
        "Voting session havent started yet"
      );
    });

    it("should emit WorkflowStatusChange 3 to 4", async () => {
      await votingInstance.startProposalsRegistering();
      await votingInstance.endProposalsRegistering();
      await votingInstance.startVotingSession();

      await expect(await votingInstance.endVotingSession())
        .to.emit(votingInstance, "WorkflowStatusChange")
        .withArgs(3, 4);
    });
  });

  ////////////////////   GENESIS   \\\\\\\\\\\\\\\\\\\
  it("recup genesis", async () => {
    await votingInstance.addVoter(alice.address);
    // change de status et ajoute le genesis (0)
    await votingInstance.startProposalsRegistering();

    const providerAlice = votingInstance.connect(alice);

    const proposal = await providerAlice.getOneProposal(0);

    //recupere la Proposal 0 (normalement GENESIS)
    expect(await proposal.description).to.equal("GENESIS");
  });
});
