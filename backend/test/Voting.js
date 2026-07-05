const { expect } = require("chai");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Voting", function () {
  let owner;
  let addr1;
  let addr2;
  let voting;

  before(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();

    const Voting = await ethers.getContractFactory("Voting");
    voting = await Voting.deploy();
  });

  describe("Access Control", () => {
    it("should set deployer as owner", async () => {
      expect(await voting.owner()).to.equal(owner.address);
    });

    it("should allow anyone to join", async () => {
      await expect(voting.join())
        .to.emit(voting, "MemberJoined")
        .withArgs(owner.address, await time.latest());
    });

    it("should prevent double join", async () => {
      await expect(voting.join()).to.be.revertedWithCustomError(
        voting,
        "AlreadyMember"
      );
    });

    it("should let addr1 join", async () => {
      await expect(voting.connect(addr1).join()).to.emit(
        voting,
        "MemberJoined"
      );
    });

    it("should return correct member status", async () => {
      expect(await voting.members(owner.address)).to.be.true;
      expect(await voting.members(addr1.address)).to.be.true;
      expect(await voting.members(addr2.address)).to.be.false;
    });

    it("should pause and unpause from owner", async () => {
      await voting.pause();
      expect(await voting.paused()).to.be.true;

      await expect(voting.join()).to.be.revertedWithCustomError(
        voting,
        "EnforcedPause"
      );

      await voting.unpause();
      expect(await voting.paused()).to.be.false;
    });

    it("should prevent non-owner from pausing", async () => {
      await expect(voting.connect(addr1).pause()).to.be.revertedWithCustomError(
        voting,
        "OwnableUnauthorizedAccount"
      );
    });
  });

  describe("Create Vote", () => {
    let latestTime;

    beforeEach(async () => {
      latestTime = await time.latest();
    });

    it("should revert if non-member tries to create", async () => {
      await expect(
        voting.connect(addr2).createVote("uri", latestTime + 3600, 2, 0)
      ).to.be.revertedWithCustomError(voting, "NotMember");
    });

    it("should revert with 1 option", async () => {
      await expect(
        voting.createVote("uri", latestTime + 3600, 1, 0)
      ).to.be.revertedWithCustomError(voting, "InvalidOptionsCount");
    });

    it("should revert with 9 options", async () => {
      await expect(
        voting.createVote("uri", latestTime + 3600, 9, 0)
      ).to.be.revertedWithCustomError(voting, "InvalidOptionsCount");
    });

    it("should revert with past end time", async () => {
      await expect(
        voting.createVote("uri", latestTime - 60, 2, 0)
      ).to.be.revertedWithCustomError(voting, "InvalidEndTime");
    });

    it("should revert with current end time", async () => {
      await expect(
        voting.createVote("uri", latestTime, 2, 0)
      ).to.be.revertedWithCustomError(voting, "InvalidEndTime");
    });

    it("should create vote with 2 options, no quorum", async () => {
      const endTime = latestTime + 3600;
      await expect(voting.createVote("uri1", endTime, 2, 0))
        .to.emit(voting, "VoteCreated");

      expect(await voting.getVoteCount()).to.equal(1);
    });

    it("should create vote with 8 options and quorum", async () => {
      const endTime = (await time.latest()) + 3600;
      await expect(voting.createVote("uri2", endTime, 8, 5))
        .to.emit(voting, "VoteCreated");

      expect(await voting.getVoteCount()).to.equal(2);
    });

    it("should create vote with data URI", async () => {
      const endTime = (await time.latest()) + 3600;
      const dataUri =
        "data:application/json;base64,eyJkZXNjcmlwdGlvbiI6IlRlc3QiLCJvcHRpb25zIjpbIlllcyIsIk5vIl19";
      await expect(voting.createVote(dataUri, endTime, 2, 1))
        .to.emit(voting, "VoteCreated");
    });

    it("should revert when paused", async () => {
      await voting.pause();
      await expect(
        voting.createVote("uri", (await time.latest()) + 3600, 2, 0)
      ).to.be.revertedWithCustomError(voting, "EnforcedPause");
      await voting.unpause();
    });
  });

  describe("Vote", () => {
    it("should revert if non-member votes", async () => {
      await expect(
        voting.connect(addr2).vote(0, 0)
      ).to.be.revertedWithCustomError(voting, "NotMember");
    });

    it("should revert if vote does not exist", async () => {
      await expect(voting.vote(99, 0)).to.be.revertedWithCustomError(
        voting,
        "VoteNotFound"
      );
    });

    it("should revert on invalid option", async () => {
      await expect(voting.vote(0, 5)).to.be.revertedWithCustomError(
        voting,
        "InvalidOption"
      );
    });

    it("should vote successfully", async () => {
      await expect(voting.vote(0, 0))
        .to.emit(voting, "Voted");
    });

    it("should prevent double vote", async () => {
      await expect(voting.vote(0, 1)).to.be.revertedWithCustomError(
        voting,
        "AlreadyVoted"
      );
    });

    it("should let addr1 vote on vote 1", async () => {
      await expect(voting.connect(addr1).vote(1, 3))
        .to.emit(voting, "Voted");
    });

    it("should revert when paused", async () => {
      await voting.pause();
      await expect(voting.vote(1, 0)).to.be.revertedWithCustomError(
        voting,
        "EnforcedPause"
      );
      await voting.unpause();
    });

    it("should revert on expired vote", async () => {
      await time.increaseTo((await time.latest()) + 7200);
      await expect(voting.vote(0, 0)).to.be.revertedWithCustomError(
        voting,
        "VoteExpired"
      );
    });

    it("should revert on cancelled vote", async () => {
      const endTime = (await time.latest()) + 3600;
      await voting.createVote("cancel-test", endTime, 3, 0);
      await voting.cancelVote(3);

      await expect(voting.vote(3, 0)).to.be.revertedWithCustomError(
        voting,
        "VoteAlreadyCancelled"
      );
    });
  });

  describe("Cancel Vote", () => {
    let voteId;

    beforeEach(async () => {
      voteId = await voting.getVoteCount();
      const endTime = (await time.latest()) + 3600;
      await voting.createVote("cancel-me", endTime, 2, 0);
    });

    it("should let owner cancel own vote", async () => {
      await expect(voting.cancelVote(voteId))
        .to.emit(voting, "VoteCancelled");
    });

    it("should prevent non-owner from cancelling", async () => {
      await expect(
        voting.connect(addr1).cancelVote(voteId)
      ).to.be.revertedWithCustomError(voting, "NotVoteOwner");
    });

    it("should prevent cancelling already cancelled vote", async () => {
      await voting.cancelVote(voteId);
      await expect(voting.cancelVote(voteId)).to.be.revertedWithCustomError(
        voting,
        "VoteAlreadyCancelled"
      );
    });

    it("should prevent cancelling expired vote", async () => {
      await time.increaseTo((await time.latest()) + 7200);
      await expect(voting.cancelVote(voteId)).to.be.revertedWithCustomError(
        voting,
        "VoteExpired"
      );
    });

    it("should prevent non-member from cancelling", async () => {
      await expect(
        voting.connect(addr2).cancelVote(voteId)
      ).to.be.revertedWithCustomError(voting, "NotMember");
    });
  });

  describe("getVote", () => {
    let getVoteId;

    beforeEach(async () => {
      getVoteId = await voting.getVoteCount();
      const endTime = (await time.latest()) + 3600;
      await voting.createVote("get-vote-test", endTime, 3, 2);
    });

    it("should return correct vote data", async () => {
      const vote = await voting.getVote(getVoteId);
      expect(vote.uri).to.equal("get-vote-test");
      expect(vote.owner).to.equal(owner.address);
      expect(vote.voteCounts).to.deep.equal([0, 0, 0]);
      expect(vote.quorum).to.equal(2);
      expect(vote.cancelled).to.be.false;
      expect(vote.totalVotes).to.equal(0);
      expect(vote.endTime).to.be.gt(0);
    });

    it("should revert for non-existent vote", async () => {
      await expect(voting.getVote(99)).to.be.revertedWithCustomError(
        voting,
        "VoteNotFound"
      );
    });
  });

  describe("didVote", () => {
    it("should return true after voting", async () => {
      expect(await voting.didVote(owner.address, 0)).to.be.true;
      expect(await voting.didVote(addr1.address, 0)).to.be.false;
    });

    it("should revert for non-existent vote", async () => {
      await expect(voting.didVote(owner.address, 99)).to.be.revertedWithCustomError(
        voting,
        "VoteNotFound"
      );
    });
  });

  describe("getVoteCount", () => {
    it("should return total number of votes", async () => {
      const count = await voting.getVoteCount();
      expect(count.toNumber()).to.be.gt(4);
    });
  });

  describe("Pausable", () => {
    it("should prevent non-owner from unpausing", async () => {
      await voting.pause();
      await expect(voting.connect(addr1).unpause()).to.be.revertedWithCustomError(
        voting,
        "OwnableUnauthorizedAccount"
      );
      await voting.unpause();
    });

    it("should prevent all state mutations while paused", async () => {
      await voting.pause();

      await expect(voting.join()).to.be.revertedWithCustomError(
        voting,
        "EnforcedPause"
      );
      await expect(
        voting.createVote("uri", (await time.latest()) + 3600, 2, 0)
      ).to.be.revertedWithCustomError(voting, "EnforcedPause");
      await expect(voting.vote(0, 0)).to.be.revertedWithCustomError(
        voting,
        "EnforcedPause"
      );

      await voting.unpause();
    });
  });
});
