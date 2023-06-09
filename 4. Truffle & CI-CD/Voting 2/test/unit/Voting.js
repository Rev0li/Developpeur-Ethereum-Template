const { expect } = require("chai");
const { expectEvent, ether } = require("@openzeppelin/test-helpers");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
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

  ////////////////////   FIXTURE   \\\\\\\\\\\\\\\\\\\
  async function addWhitelist() {
    await votingInstance.addVoter(alice.address);
    await votingInstance.addVoter(bob.address);
    await votingInstance.addVoter(patric.address);

    return { alice, bob, patric };
  }

  async function addProposition() {
    await votingInstance.addVoter(alice.address);
    await votingInstance.addVoter(bob.address);
    await votingInstance.addVoter(patric.address);

    await votingInstance.startProposalsRegistering();

    await providerAlice.addProposal("hello world");
    await providerBob.addProposal("My name is Bob");
    await providerPatric.addProposal("Moi c'est Pa pa patric");

    return { alice, bob, patric };
  }

  ////////////////////   REGISTRATION   \\\\\\\\\\\\\\\\\\\

  describe("function addVoter and getVoter", function () {
    it("require workflowStatus RegisteringVoters", async () => {
      // Définir l'état
      await votingInstance.startProposalsRegistering();

      // Utiliser expect avec revertedWith pour vérifier si require est declanché
      expect(votingInstance.addVoter(alice.address)).to.be.revertedWith(
        "Voters registration is not open yet"
      );
    });

    it("require isRegistered ", async () => {
      // Ajouter Alice en tant que votant
      await votingInstance.addVoter(alice.address);

      // Utiliser expect avec revertedWith pour vérifier si require est declanché
      expect(votingInstance.addVoter(alice.address)).to.be.revertedWith(
        "Already registered"
      );
    });

    it("should add a voter (alice)", async () => {
      await votingInstance.addVoter(alice.address);
      const voter = await providerAlice.getVoter(alice.address);
      expect(voter.isRegistered).to.be.true;
    });

    it("check getVoter", async () => {
      const { alice, bob } = await loadFixture(addWhitelist);

      const voter = await votingInstance.connect(bob).getVoter(alice.address);
      expect(voter.isRegistered).to.be.true; // Vérifier si le votant est enregistré
      expect(voter.hasVoted).to.be.oneOf([true, false]);
      expect(voter.votedProposalId).to.be.instanceOf(ethers.BigNumber);
    });

    it("emit voterRegistred", async () => {
      // Utiliser to.emit pour vérifier si l'événement est émis
      await expect(votingInstance.addVoter(alice.address))
        .to.emit(votingInstance, "VoterRegistered")
        .withArgs(alice.address);
    });
  });

  ////////////////////   PROPOSAL   \\\\\\\\\\\\\\\\\\\
  describe("function proposal and getOneProposal", function () {
    it("require ProposalsRegistrationStarted", async () => {
      // Ajouter Alice en tant que votant
      await votingInstance.addVoter(alice.address);

      // Utiliser expect avec revertedWith pour vérifier si require est declanché
      expect(
        votingInstance.connect(alice).addProposal("hello you")
      ).to.be.revertedWith("Proposals are not allowed yet");
    });

    it("require empty", async () => {
      // Ajouter Alice en tant que votant
      await votingInstance.addVoter(alice.address);
      await votingInstance.startProposalsRegistering();

      // Utiliser expect avec revertedWith pour vérifier si require est declanché
      await expect(
        votingInstance.connect(alice).addProposal("")
      ).to.be.revertedWith("Vous ne pouvez pas ne rien proposer");
    });

    it("should add and get a proposal ", async () => {
      await loadFixture(addProposition);

      const proposal1 = await providerAlice.getOneProposal(1);
      const proposal2 = await providerBob.getOneProposal(2);
      const proposal3 = await providerPatric.getOneProposal(3);
      console.log(proposal1);
      // Vérifier si les propositions sont égal
      expect(proposal1.description).to.equal("hello world");
      expect(proposal2.description).to.equal("My name is Bob");
      expect(proposal3.description).to.equal("Moi c'est Pa pa patric");
    });

    it("emit ProposalRegistered", async () => {
      await votingInstance.addVoter(alice.address);
      await votingInstance.startProposalsRegistering();

      await expect(votingInstance.connect(alice).addProposal("hello you"))
        .to.emit(votingInstance, "ProposalRegistered")
        .withArgs(1);
    });
  });

  ////////////////////   VOTE   \\\\\\\\\\\\\\\\\\\

  describe.only("function setVote", function () {
    it("require VotingSessionStarted", async () => {
      loadFixture(addProposition);
      await votingInstance.endProposalsRegistering();

      expect(votingInstance.connect(alice).setVote(1)).to.be.revertedWith(
        "Voting session havent started yet"
      );
    });
    //PROBLEME
    it("require already voted", async () => {
      await loadFixture(addProposition);
      await votingInstance.endProposalsRegistering();
      await votingInstance.startVotingSession();

      await providerBob.setVote(1);

      expect(providerBob.setVote(1)).to.be.revertedWith(
        "You have already voted"
      );
    });

    it("sould return votedProposalId", async () => {});
    //PROBLEME
    it("should voteCount++", async () => {
      await loadFixture(addProposition);

      await votingInstance.endProposalsRegistering();
      await votingInstance.startVotingSession();

      await providerBob.setVote(1);
      await providerAlice.setVote(1);
      await providerPatric.setVote(2);

      const recupProposal1 = await providerAlice.getOneProposal(1);
      const recupProposal2 = await providerAlice.getOneProposal(2);
      const recupProposal3 = await providerAlice.getOneProposal(3);

      expect(recupProposal1.voteCount).to.equal(ethers.BigNumber.from(2));
      expect(recupProposal2.voteCount).to.equal(ethers.BigNumber.from(1));
      expect(recupProposal3.voteCount).to.equal(ethers.BigNumber.from(0));
    });
    //PROBLEME
    it("should recup hasVoted true and votedProposalId", async () => {
      await loadFixture(addProposition);

      await votingInstance.endProposalsRegistering();
      await votingInstance.startVotingSession();

      await providerAlice.setVote(1);

      const voter = await providerAlice.getVoter(alice.address);
      console.log(voter);

      expect(voter.hasVoted).to.be.true;
      expect(voter.votedProposalId).to.equal(ethers.BigNumber.from(1));
    });
    //PROBLEME
    it("emit Voted", async () => {
      await loadFixture(addProposition);

      await votingInstance.endProposalsRegistering();
      await votingInstance.startVotingSession();

      await expect(votingInstance.connect(alice).setVote(1))
        .to.emit(votingInstance, "Voted")
        .withArgs(alice.address, 1);
    });
  });
  ////////////////////   MODIFIER   \\\\\\\\\\\\\\\\\\\

  describe("check onlyVoter and onlyOwner", function () {
    it("check in getVoter", async () => {
      const { alice } = await loadFixture(addWhitelist);

      expect(votingInstance.getVoter(alice.address)).to.be.rejectedWith(
        "You're not a voter"
      );
    });

    it("check in getOneProposal", async () => {
      await loadFixture(addProposition);

      expect(votingInstance.getOneProposal(1)).to.be.rejectedWith(
        "You're not a voter"
      );
    });
  });

  ////////////////////   GENESIS   \\\\\\\\\\\\\\\\\\\
  it("recup genesis", async () => {
    // Ajouter Alice en tant que votant
    await votingInstance.addVoter(alice.address);

    // Définir l'état pour permettre l'enregistrement des propositions
    await votingInstance.startProposalsRegistering();

    // Ajouter une instance et connect alice
    const providerAlice = votingInstance.connect(alice);
    //Ajouter une proposal
    await providerAlice.addProposal("hello world");

    //recupere la Proposal 0 (normalement GENESIS)
    const proposal = await providerAlice.getOneProposal(0);

    // Vérifier si la première proposition est égale à "hello world"
    expect(proposal.description).to.equal("GENESIS");
  });
});
