const convert = (amount, decimals) => ethers.utils.parseUnits(amount, decimals);
const divDec = (amount, decimals = 18) => amount / 10 ** decimals;
const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { execPath } = require("process");

const normalizeUri = (str) => {
  if (!str) return "#000000";
  let s = String(str).trim();
  if (s.startsWith("0x") || s.startsWith("0X")) s = s.slice(2);
  if (s.startsWith("#")) s = s.slice(1);
  if (!/^[0-9a-fA-F]{6}$/.test(s)) return "#000000";
  return "#" + s.toLowerCase();
};

const AddressZero = "0x0000000000000000000000000000000000000000";
const AddressDead = "0x000000000000000000000000000000000000dEaD";

let owner,
  multisig,
  treasury,
  user0,
  user1,
  user2,
  user3,
  provider0,
  provider1,
  entropyProvider;
let weth, unit, miner, multicall, entropy;
let auction0, auction1;

describe("local: test0", function () {
  before("Initial set up", async function () {
    console.log("Begin Initialization");

    [
      owner,
      multisig,
      treasury,
      user0,
      user1,
      user2,
      user3,
      provider0,
      provider1,
      entropyProvider,
    ] = await ethers.getSigners();

    const wethArtifact = await ethers.getContractFactory("Base");
    weth = await wethArtifact.deploy();
    console.log("- WETH Initialized");

    const entropyArtifact = await ethers.getContractFactory("TestMockEntropy");
    entropy = await entropyArtifact.deploy(entropyProvider.address);
    console.log("- Entropy Initialized");

    const minerArtifact = await ethers.getContractFactory("Miner");
    miner = await minerArtifact.deploy(
      weth.address,
      entropy.address,
      treasury.address
    );
    console.log("- Miner Initialized");

    unit = await ethers.getContractAt(
      "contracts/Miner.sol:Unit",
      await miner.unit()
    );
    console.log("- Unit Initialized");

    const auctionArtifact = await ethers.getContractFactory("Auction");
    auction0 = await auctionArtifact.deploy(
      convert("0.001", 18),
      unit.address,
      AddressZero,
      604800,
      convert("1.2", 18),
      convert("0.001", 18)
    );
    console.log("- Auction0 Initialized");
    auction1 = await auctionArtifact.deploy(
      convert("0.001", 18),
      unit.address,
      AddressDead,
      604800,
      convert("1.2", 18),
      convert("0.001", 18)
    );
    console.log("- Auction1 Initialized");

    const multicallArtifact = await ethers.getContractFactory("Multicall");
    multicall = await multicallArtifact.deploy(miner.address);
    console.log("- Multicall Initialized");

    await miner.transferOwnership(multisig.address);
    await multicall.transferOwnership(multisig.address);
    console.log("- ownership transferred to multisig");

    await miner.connect(multisig).setTreasury(auction0.address);
    console.log("- treasury set to auction0");

    await multicall.connect(multisig).setAuction(auction0.address);
    console.log("- auction0 set to multicall");

    console.log("Initialization Complete");
    console.log();
  });

  it("Miner State", async function () {
    console.log("******************************************************");
    let res = await multicall.getMiner(user0.address);
    console.log("UPS: ", divDec(res.ups));
    console.log("Unit Price: ", divDec(res.unitPrice));
    console.log("Unit Balance: ", divDec(res.unitBalance));
    console.log("ETH Balance: ", divDec(res.ethBalance));
    console.log("WETH Balance: ", divDec(res.wethBalance));
  });

  it("Slot 0 State", async function () {
    console.log("******************************************************");
    let res = await multicall.getSlot(0);
    console.log("Epoch ID: ", res.epochId);
    console.log("Init Price: ", divDec(res.initPrice));
    console.log("Start Time: ", res.startTime);
    console.log("Price: ", divDec(res.price));
    console.log("UPS: ", divDec(res.ups));
    console.log("Mined: ", divDec(res.mined));
    console.log("Miner: ", res.miner);
    console.log("URI: ", res.uri);
  });

  it("Slot 1 State", async function () {
    console.log("******************************************************");
    let res = await multicall.getSlot(1);
    console.log("Epoch ID: ", res.epochId);
    console.log("Init Price: ", divDec(res.initPrice));
    console.log("Start Time: ", res.startTime);
    console.log("Price: ", divDec(res.price));
    console.log("UPS: ", divDec(res.ups));
    console.log("Mined: ", divDec(res.mined));
    console.log("Miner: ", res.miner);
    console.log("URI: ", res.uri);
  });

  it("Print URIs", async function () {
    console.log("******************************************************");
    const capacity = (await miner.capacity()).toNumber();
    const slots = await multicall.getSlots(0, capacity - 1);
    const uris = [];
    for (let i = 0; i < capacity; i++) {
      const uri = normalizeUri(slots[i].uri);
      uris.push(uri);
    }
    console.log(uris.join(" "));
  });

  it("User0 mines index 0", async function () {
    console.log("******************************************************");
    let res = await multicall.getSlot(0);
    await multicall
      .connect(user0)
      .mine(AddressZero, 0, res.epochId, 1863597344, res.price, "#FF00FF", {
        value: res.price,
      });
  });

  it("User0 mines index 0", async function () {
    console.log("******************************************************");
    let res = await multicall.getSlot(0);
    await multicall
      .connect(user0)
      .mine(AddressZero, 0, res.epochId, 1863597344, res.price, "#FF00FF", {
        value: res.price,
      });
  });

  it("Slot 0 State", async function () {
    console.log("******************************************************");
    let res = await multicall.getSlot(0);
    console.log("Epoch ID: ", res.epochId);
    console.log("Init Price: ", divDec(res.initPrice));
    console.log("Start Time: ", res.startTime);
    console.log("Price: ", divDec(res.price));
    console.log("UPS: ", divDec(res.ups));
    console.log("Mined: ", divDec(res.mined));
    console.log("Miner: ", res.miner);
    console.log("URI: ", res.uri);
  });

  it("User0 mines randomly", async function () {
    console.log("******************************************************");
    const iterations = 100;
    const capacity = (await miner.capacity()).toNumber();
    for (let i = 0; i < iterations; i++) {
      const index = Math.floor(Math.random() * capacity);
      const slot = await multicall.getSlot(index);
      const price = slot.price;
      const epochId = slot.epochId;
      const uri =
        "#" +
        Math.floor(Math.random() * 0xffffff)
          .toString(16)
          .padStart(6, "0");
      const latest = await ethers.provider.getBlock("latest");
      const deadline = latest.timestamp + 3600; // +1 hour
      await multicall
        .connect(user0)
        .mine(AddressZero, index, epochId, deadline, price, uri, {
          value: price,
        });
    }
  });

  it("Print URIs", async function () {
    console.log("******************************************************");
    const capacity = (await miner.capacity()).toNumber();
    const slots = await multicall.getSlots(0, capacity - 1);
    const uris = [];
    for (let i = 0; i < capacity; i++) {
      const uri = normalizeUri(slots[i].uri);
      uris.push(uri);
    }
    console.log(uris.join(" "));
  });

  it("User1 mines randomly", async function () {
    console.log("******************************************************");
    const iterations = 100;
    const capacity = (await miner.capacity()).toNumber();
    for (let i = 0; i < iterations; i++) {
      const index = Math.floor(Math.random() * capacity);
      const slot = await multicall.getSlot(index);
      const price = slot.price;
      const epochId = slot.epochId;
      const uri =
        "#" +
        Math.floor(Math.random() * 0xffffff)
          .toString(16)
          .padStart(6, "0");
      const latest = await ethers.provider.getBlock("latest");
      const deadline = latest.timestamp + 3600; // +1 hour
      await multicall
        .connect(user1)
        .mine(provider0.address, index, epochId, deadline, price, uri, {
          value: price,
        });
    }
  });

  it("Print URIs", async function () {
    console.log("******************************************************");
    const capacity = (await miner.capacity()).toNumber();
    const slots = await multicall.getSlots(0, capacity - 1);
    const uris = [];
    for (let i = 0; i < capacity; i++) {
      const uri = normalizeUri(slots[i].uri);
      uris.push(uri);
    }
    console.log(uris.join(" "));
  });

  it("User2 mines randomly", async function () {
    console.log("******************************************************");
    const iterations = 100;
    const capacity = (await miner.capacity()).toNumber();
    for (let i = 0; i < iterations; i++) {
      const index = Math.floor(Math.random() * capacity);
      const slot = await multicall.getSlot(index);
      const price = slot.price;
      const epochId = slot.epochId;
      const uri =
        "#" +
        Math.floor(Math.random() * 0xffffff)
          .toString(16)
          .padStart(6, "0");
      const latest = await ethers.provider.getBlock("latest");
      const deadline = latest.timestamp + 3600; // +1 hour
      await multicall
        .connect(user2)
        .mine(provider0.address, index, epochId, deadline, price, uri, {
          value: price,
        });
    }
  });

  it("Print URIs", async function () {
    console.log("******************************************************");
    const capacity = (await miner.capacity()).toNumber();
    const slots = await multicall.getSlots(0, capacity - 1);
    const uris = [];
    for (let i = 0; i < capacity; i++) {
      const uri = normalizeUri(slots[i].uri);
      uris.push(uri);
    }
    console.log(uris.join(" "));
  });

  it("User3 mines randomly", async function () {
    console.log("******************************************************");
    const iterations = 100;
    const capacity = (await miner.capacity()).toNumber();
    for (let i = 0; i < iterations; i++) {
      const index = Math.floor(Math.random() * capacity);
      const slot = await multicall.getSlot(index);
      const price = slot.price;
      const epochId = slot.epochId;
      const uri =
        "#" +
        Math.floor(Math.random() * 0xffffff)
          .toString(16)
          .padStart(6, "0");
      const latest = await ethers.provider.getBlock("latest");
      const deadline = latest.timestamp + 3600; // +1 hour
      await multicall
        .connect(user3)
        .mine(provider1.address, index, epochId, deadline, price, uri, {
          value: price,
        });
    }
  });

  it("Print URIs", async function () {
    console.log("******************************************************");
    const capacity = (await miner.capacity()).toNumber();
    const slots = await multicall.getSlots(0, capacity - 1);
    const uris = [];
    for (let i = 0; i < capacity; i++) {
      const uri = normalizeUri(slots[i].uri);
      uris.push(uri);
    }
    console.log(uris.join(" "));
  });

  it("Miner State, user0", async function () {
    console.log("******************************************************");
    let res = await multicall.getMiner(user0.address);
    console.log("UPS: ", divDec(res.ups));
    console.log("Unit Price: ", divDec(res.unitPrice));
    console.log("Unit Balance: ", divDec(res.unitBalance));
    console.log("ETH Balance: ", divDec(res.ethBalance));
    console.log("WETH Balance: ", divDec(res.wethBalance));
  });

  it("Miner State, user1", async function () {
    console.log("******************************************************");
    let res = await multicall.getMiner(user1.address);
    console.log("UPS: ", divDec(res.ups));
    console.log("Unit Price: ", divDec(res.unitPrice));
    console.log("Unit Balance: ", divDec(res.unitBalance));
    console.log("ETH Balance: ", divDec(res.ethBalance));
    console.log("WETH Balance: ", divDec(res.wethBalance));
  });

  it("Miner State, user2", async function () {
    console.log("******************************************************");
    let res = await multicall.getMiner(user2.address);
    console.log("UPS: ", divDec(res.ups));
    console.log("Unit Price: ", divDec(res.unitPrice));
    console.log("Unit Balance: ", divDec(res.unitBalance));
    console.log("ETH Balance: ", divDec(res.ethBalance));
    console.log("WETH Balance: ", divDec(res.wethBalance));
  });

  it("Miner State, user3", async function () {
    console.log("******************************************************");
    let res = await multicall.getMiner(user3.address);
    console.log("UPS: ", divDec(res.ups));
    console.log("Unit Price: ", divDec(res.unitPrice));
    console.log("Unit Balance: ", divDec(res.unitBalance));
    console.log("ETH Balance: ", divDec(res.ethBalance));
    console.log("WETH Balance: ", divDec(res.wethBalance));
  });

  it("Forward time", async function () {
    console.log("******************************************************");
    await ethers.provider.send("evm_increaseTime", [3600 * 24 * 30]);
    await ethers.provider.send("evm_mine", []);
  });

  it("User0 mines randomly", async function () {
    console.log("******************************************************");
    const iterations = 100;
    const capacity = (await miner.capacity()).toNumber();
    for (let i = 0; i < iterations; i++) {
      const index = Math.floor(Math.random() * capacity);
      const slot = await multicall.getSlot(index);
      const price = slot.price;
      const epochId = slot.epochId;
      const uri =
        "#" +
        Math.floor(Math.random() * 0xffffff)
          .toString(16)
          .padStart(6, "0");
      const latest = await ethers.provider.getBlock("latest");
      const deadline = latest.timestamp + 3600; // +1 hour
      await multicall
        .connect(user0)
        .mine(provider0.address, index, epochId, deadline, price, uri, {
          value: price,
        });
    }
  });

  it("Print URIs", async function () {
    console.log("******************************************************");
    const capacity = (await miner.capacity()).toNumber();
    const slots = await multicall.getSlots(0, capacity - 1);
    const uris = [];
    for (let i = 0; i < capacity; i++) {
      const uri = normalizeUri(slots[i].uri);
      uris.push(uri);
    }
    console.log(uris.join(" "));
  });

  it("Miner State, user0", async function () {
    console.log("******************************************************");
    let res = await multicall.getMiner(user0.address);
    console.log("UPS: ", divDec(res.ups));
    console.log("Unit Price: ", divDec(res.unitPrice));
    console.log("Unit Balance: ", divDec(res.unitBalance));
    console.log("ETH Balance: ", divDec(res.ethBalance));
    console.log("WETH Balance: ", divDec(res.wethBalance));
  });

  it("User1 mines randomly", async function () {
    console.log("******************************************************");
    const iterations = 100;
    const capacity = (await miner.capacity()).toNumber();
    for (let i = 0; i < iterations; i++) {
      const index = Math.floor(Math.random() * capacity);
      const slot = await multicall.getSlot(index);
      const price = slot.price;
      const epochId = slot.epochId;
      const uri =
        "#" +
        Math.floor(Math.random() * 0xffffff)
          .toString(16)
          .padStart(6, "0");
      const latest = await ethers.provider.getBlock("latest");
      const deadline = latest.timestamp + 3600; // +1 hour
      await multicall
        .connect(user1)
        .mine(provider0.address, index, epochId, deadline, price, uri, {
          value: price,
        });
    }
  });

  it("Print URIs", async function () {
    console.log("******************************************************");
    const capacity = (await miner.capacity()).toNumber();
    const slots = await multicall.getSlots(0, capacity - 1);
    const uris = [];
    for (let i = 0; i < capacity; i++) {
      const uri = normalizeUri(slots[i].uri);
      uris.push(uri);
    }
    console.log(uris.join(" "));
  });

  it("Miner State, user1", async function () {
    console.log("******************************************************");
    let res = await multicall.getMiner(user1.address);
    console.log("UPS: ", divDec(res.ups));
    console.log("Unit Price: ", divDec(res.unitPrice));
    console.log("Unit Balance: ", divDec(res.unitBalance));
    console.log("ETH Balance: ", divDec(res.ethBalance));
    console.log("WETH Balance: ", divDec(res.wethBalance));
  });

  it("Miner State, user0", async function () {
    console.log("******************************************************");
    let res = await multicall.getMiner(user0.address);
    console.log("UPS: ", divDec(res.ups));
    console.log("Unit Price: ", divDec(res.unitPrice));
    console.log("Unit Balance: ", divDec(res.unitBalance));
    console.log("ETH Balance: ", divDec(res.ethBalance));
    console.log("WETH Balance: ", divDec(res.wethBalance));
  });

  it("User2 mines randomly", async function () {
    console.log("******************************************************");
    const iterations = 42;
    const capacity = (await miner.capacity()).toNumber();
    for (let i = 0; i < iterations; i++) {
      const index = Math.floor(Math.random() * capacity);
      const slot = await multicall.getSlot(index);
      const price = slot.price;
      const epochId = slot.epochId;
      const uri =
        "#" +
        Math.floor(Math.random() * 0xffffff)
          .toString(16)
          .padStart(6, "0");
      const latest = await ethers.provider.getBlock("latest");
      const deadline = latest.timestamp + 3600; // +1 hour
      await multicall
        .connect(user2)
        .mine(provider0.address, index, epochId, deadline, price, uri, {
          value: price,
        });
    }
  });

  it("Print URIs", async function () {
    console.log("******************************************************");
    const capacity = (await miner.capacity()).toNumber();
    const slots = await multicall.getSlots(0, capacity - 1);
    const uris = [];
    for (let i = 0; i < capacity; i++) {
      const uri = normalizeUri(slots[i].uri);
      uris.push(uri);
    }
    console.log(uris.join(" "));
  });

  it("Miner State, user2", async function () {
    console.log("******************************************************");
    let res = await multicall.getMiner(user2.address);
    console.log("UPS: ", divDec(res.ups));
    console.log("Unit Price: ", divDec(res.unitPrice));
    console.log("Unit Balance: ", divDec(res.unitBalance));
    console.log("ETH Balance: ", divDec(res.ethBalance));
    console.log("WETH Balance: ", divDec(res.wethBalance));
  });

  it("Forward time", async function () {
    console.log("******************************************************");
    await ethers.provider.send("evm_increaseTime", [3600 * 24 * 30 * 365]);
    await ethers.provider.send("evm_mine", []);
  });

  it("User0 mines randomly", async function () {
    console.log("******************************************************");
    const iterations = 42;
    const capacity = (await miner.capacity()).toNumber();
    for (let i = 0; i < iterations; i++) {
      const index = Math.floor(Math.random() * capacity);
      const slot = await multicall.getSlot(index);
      const price = slot.price;
      const epochId = slot.epochId;
      const uri =
        "#" +
        Math.floor(Math.random() * 0xffffff)
          .toString(16)
          .padStart(6, "0");
      const latest = await ethers.provider.getBlock("latest");
      const deadline = latest.timestamp + 3600; // +1 hour
      await multicall
        .connect(user0)
        .mine(provider0.address, index, epochId, deadline, price, uri, {
          value: price,
        });
    }
  });

  it("User1 mines randomly", async function () {
    console.log("******************************************************");
    const iterations = 42;
    const capacity = (await miner.capacity()).toNumber();
    for (let i = 0; i < iterations; i++) {
      const index = Math.floor(Math.random() * capacity);
      const slot = await multicall.getSlot(index);
      const price = slot.price;
      const epochId = slot.epochId;
      const uri =
        "#" +
        Math.floor(Math.random() * 0xffffff)
          .toString(16)
          .padStart(6, "0");
      const latest = await ethers.provider.getBlock("latest");
      const deadline = latest.timestamp + 3600; // +1 hour
      await multicall
        .connect(user1)
        .mine(provider0.address, index, epochId, deadline, price, uri, {
          value: price,
        });
    }
  });

  it("User2 mines randomly", async function () {
    console.log("******************************************************");
    const iterations = 42;
    const capacity = (await miner.capacity()).toNumber();
    for (let i = 0; i < iterations; i++) {
      const index = Math.floor(Math.random() * capacity);
      const slot = await multicall.getSlot(index);
      const price = slot.price;
      const epochId = slot.epochId;
      const uri =
        "#" +
        Math.floor(Math.random() * 0xffffff)
          .toString(16)
          .padStart(6, "0");
      const latest = await ethers.provider.getBlock("latest");
      const deadline = latest.timestamp + 3600; // +1 hour
      await multicall
        .connect(user2)
        .mine(provider0.address, index, epochId, deadline, price, uri, {
          value: price,
        });
    }
  });

  it("User3 mines randomly", async function () {
    console.log("******************************************************");
    const iterations = 42;
    const capacity = (await miner.capacity()).toNumber();
    for (let i = 0; i < iterations; i++) {
      const index = Math.floor(Math.random() * capacity);
      const slot = await multicall.getSlot(index);
      const price = slot.price;
      const epochId = slot.epochId;
      const uri =
        "#" +
        Math.floor(Math.random() * 0xffffff)
          .toString(16)
          .padStart(6, "0");
      const latest = await ethers.provider.getBlock("latest");
      const deadline = latest.timestamp + 3600; // +1 hour
      await multicall
        .connect(user3)
        .mine(provider0.address, index, epochId, deadline, price, uri, {
          value: price,
        });
    }
  });

  it("Print URIs", async function () {
    console.log("******************************************************");
    const capacity = (await miner.capacity()).toNumber();
    const slots = await multicall.getSlots(0, capacity - 1);
    const uris = [];
    for (let i = 0; i < capacity; i++) {
      const uri = normalizeUri(slots[i].uri);
      uris.push(uri);
    }
    console.log(uris.join(" "));
  });

  it("Miner State, user0", async function () {
    console.log("******************************************************");
    let res = await multicall.getMiner(user0.address);
    console.log("UPS: ", divDec(res.ups));
    console.log("Unit Price: ", divDec(res.unitPrice));
    console.log("Unit Balance: ", divDec(res.unitBalance));
    console.log("ETH Balance: ", divDec(res.ethBalance));
    console.log("WETH Balance: ", divDec(res.wethBalance));
  });

  it("Miner State, user1", async function () {
    console.log("******************************************************");
    let res = await multicall.getMiner(user0.address);
    console.log("UPS: ", divDec(res.ups));
    console.log("Unit Price: ", divDec(res.unitPrice));
    console.log("Unit Balance: ", divDec(res.unitBalance));
    console.log("ETH Balance: ", divDec(res.ethBalance));
    console.log("WETH Balance: ", divDec(res.wethBalance));
  });

  it("Miner State, user2", async function () {
    console.log("******************************************************");
    let res = await multicall.getMiner(user0.address);
    console.log("UPS: ", divDec(res.ups));
    console.log("Unit Price: ", divDec(res.unitPrice));
    console.log("Unit Balance: ", divDec(res.unitBalance));
    console.log("ETH Balance: ", divDec(res.ethBalance));
    console.log("WETH Balance: ", divDec(res.wethBalance));
  });

  it("Miner State, user3", async function () {
    console.log("******************************************************");
    let res = await multicall.getMiner(user0.address);
    console.log("UPS: ", divDec(res.ups));
    console.log("Unit Price: ", divDec(res.unitPrice));
    console.log("Unit Balance: ", divDec(res.unitBalance));
    console.log("ETH Balance: ", divDec(res.ethBalance));
    console.log("WETH Balance: ", divDec(res.wethBalance));
  });

  it("Set Multipliers", async function () {
    console.log("******************************************************");
    console.log("- current multipliers: ", await multicall.getMultipliers());
    const multipliers = [
      convert("1.0", 18),
      convert("1.0", 18),
      convert("1.0", 18),
      convert("1.0", 18),
      convert("1.0", 18),
      convert("1.0", 18),
      convert("1.0", 18),
      convert("1.0", 18),
      convert("1.0", 18),
      convert("1.0", 18),
      convert("1.0", 18),
      convert("2.0", 18),
      convert("3.0", 18),
      convert("4.0", 18),
      convert("5.0", 18),
      convert("10.0", 18),
    ];
    await miner.connect(multisig).setMultipliers(multipliers);
    console.log("- multipliers set to ", await multicall.getMultipliers());
  });

  it("User0 mines randomly", async function () {
    console.log("******************************************************");
    const iterations = 42;
    const capacity = (await miner.capacity()).toNumber();
    for (let i = 0; i < iterations; i++) {
      const index = Math.floor(Math.random() * capacity);
      const slot = await multicall.getSlot(index);
      const price = slot.price;
      const epochId = slot.epochId;
      const uri =
        "#" +
        Math.floor(Math.random() * 0xffffff)
          .toString(16)
          .padStart(6, "0");
      const latest = await ethers.provider.getBlock("latest");
      const deadline = latest.timestamp + 3600; // +1 hour
      await multicall
        .connect(user0)
        .mine(provider0.address, index, epochId, deadline, price, uri, {
          value: price,
        });
    }
  });

  it("User1 mines randomly", async function () {
    console.log("******************************************************");
    const iterations = 42;
    const capacity = (await miner.capacity()).toNumber();
    for (let i = 0; i < iterations; i++) {
      const index = Math.floor(Math.random() * capacity);
      const slot = await multicall.getSlot(index);
      const price = slot.price;
      const epochId = slot.epochId;
      const uri =
        "#" +
        Math.floor(Math.random() * 0xffffff)
          .toString(16)
          .padStart(6, "0");
      const latest = await ethers.provider.getBlock("latest");
      const deadline = latest.timestamp + 3600; // +1 hour
      await multicall
        .connect(user1)
        .mine(provider0.address, index, epochId, deadline, price, uri, {
          value: price,
        });
    }
  });

  it("User2 mines randomly", async function () {
    console.log("******************************************************");
    const iterations = 42;
    const capacity = (await miner.capacity()).toNumber();
    for (let i = 0; i < iterations; i++) {
      const index = Math.floor(Math.random() * capacity);
      const slot = await multicall.getSlot(index);
      const price = slot.price;
      const epochId = slot.epochId;
      const uri =
        "#" +
        Math.floor(Math.random() * 0xffffff)
          .toString(16)
          .padStart(6, "0");
      const latest = await ethers.provider.getBlock("latest");
      const deadline = latest.timestamp + 3600; // +1 hour
      await multicall
        .connect(user2)
        .mine(provider0.address, index, epochId, deadline, price, uri, {
          value: price,
        });
    }
  });

  it("User3 mines randomly", async function () {
    console.log("******************************************************");
    const iterations = 42;
    const capacity = (await miner.capacity()).toNumber();
    for (let i = 0; i < iterations; i++) {
      const index = Math.floor(Math.random() * capacity);
      const slot = await multicall.getSlot(index);
      const price = slot.price;
      const epochId = slot.epochId;
      const uri =
        "#" +
        Math.floor(Math.random() * 0xffffff)
          .toString(16)
          .padStart(6, "0");
      const latest = await ethers.provider.getBlock("latest");
      const deadline = latest.timestamp + 3600; // +1 hour
      await multicall
        .connect(user3)
        .mine(provider0.address, index, epochId, deadline, price, uri, {
          value: price,
        });
    }
  });

  it("Miner State, user0", async function () {
    console.log("******************************************************");
    let res = await multicall.getMiner(user0.address);
    console.log("UPS: ", divDec(res.ups));
    console.log("Unit Price: ", divDec(res.unitPrice));
    console.log("Unit Balance: ", divDec(res.unitBalance));
    console.log("ETH Balance: ", divDec(res.ethBalance));
    console.log("WETH Balance: ", divDec(res.wethBalance));
  });

  it("Miner State, user1", async function () {
    console.log("******************************************************");
    let res = await multicall.getMiner(user0.address);
    console.log("UPS: ", divDec(res.ups));
    console.log("Unit Price: ", divDec(res.unitPrice));
    console.log("Unit Balance: ", divDec(res.unitBalance));
    console.log("ETH Balance: ", divDec(res.ethBalance));
    console.log("WETH Balance: ", divDec(res.wethBalance));
  });

  it("Miner State, user2", async function () {
    console.log("******************************************************");
    let res = await multicall.getMiner(user0.address);
    console.log("UPS: ", divDec(res.ups));
    console.log("Unit Price: ", divDec(res.unitPrice));
    console.log("Unit Balance: ", divDec(res.unitBalance));
    console.log("ETH Balance: ", divDec(res.ethBalance));
    console.log("WETH Balance: ", divDec(res.wethBalance));
  });

  it("Miner State, user3", async function () {
    console.log("******************************************************");
    let res = await multicall.getMiner(user0.address);
    console.log("UPS: ", divDec(res.ups));
    console.log("Unit Price: ", divDec(res.unitPrice));
    console.log("Unit Balance: ", divDec(res.unitBalance));
    console.log("ETH Balance: ", divDec(res.ethBalance));
    console.log("WETH Balance: ", divDec(res.wethBalance));
  });

  it("Set Multipliers", async function () {
    console.log("******************************************************");
    console.log("- current multipliers: ", await multicall.getMultipliers());
    const multipliers = [
      ...Array(900).fill(convert("1.0", 18)),
      ...Array(49).fill(convert("1.5", 18)),
      ...Array(30).fill(convert("2.0", 18)),
      ...Array(15).fill(convert("3.0", 18)),
      ...Array(5).fill(convert("5.0", 18)),
      ...Array(1).fill(convert("10.0", 18)),
    ];
    await miner.connect(multisig).setMultipliers(multipliers);
    console.log("- multipliers set to ", await multicall.getMultipliers());
  });

  it("User0 mines randomly", async function () {
    console.log("******************************************************");
    const iterations = 42;
    const capacity = (await miner.capacity()).toNumber();
    for (let i = 0; i < iterations; i++) {
      const index = Math.floor(Math.random() * capacity);
      const slot = await multicall.getSlot(index);
      const price = slot.price;
      const epochId = slot.epochId;
      const uri =
        "#" +
        Math.floor(Math.random() * 0xffffff)
          .toString(16)
          .padStart(6, "0");
      const latest = await ethers.provider.getBlock("latest");
      const deadline = latest.timestamp + 3600; // +1 hour
      await multicall
        .connect(user0)
        .mine(provider0.address, index, epochId, deadline, price, uri, {
          value: price,
        });
    }
  });

  it("Forward time", async function () {
    console.log("******************************************************");
    await ethers.provider.send("evm_increaseTime", [3600 * 24 * 30]);
    await ethers.provider.send("evm_mine", []);
  });

  it("User1 mines randomly", async function () {
    console.log("******************************************************");
    const iterations = 42;
    const capacity = (await miner.capacity()).toNumber();
    for (let i = 0; i < iterations; i++) {
      const index = Math.floor(Math.random() * capacity);
      const slot = await multicall.getSlot(index);
      const price = slot.price;
      const epochId = slot.epochId;
      const uri =
        "#" +
        Math.floor(Math.random() * 0xffffff)
          .toString(16)
          .padStart(6, "0");
      const latest = await ethers.provider.getBlock("latest");
      const deadline = latest.timestamp + 3600; // +1 hour
      await multicall
        .connect(user1)
        .mine(provider0.address, index, epochId, deadline, price, uri, {
          value: price,
        });
    }
  });

  it("Forward time", async function () {
    console.log("******************************************************");
    await ethers.provider.send("evm_increaseTime", [3600 * 24 * 30]);
    await ethers.provider.send("evm_mine", []);
  });

  it("User2 mines randomly", async function () {
    console.log("******************************************************");
    const iterations = 42;
    const capacity = (await miner.capacity()).toNumber();
    for (let i = 0; i < iterations; i++) {
      const index = Math.floor(Math.random() * capacity);
      const slot = await multicall.getSlot(index);
      const price = slot.price;
      const epochId = slot.epochId;
      const uri =
        "#" +
        Math.floor(Math.random() * 0xffffff)
          .toString(16)
          .padStart(6, "0");
      const latest = await ethers.provider.getBlock("latest");
      const deadline = latest.timestamp + 3600; // +1 hour
      await multicall
        .connect(user2)
        .mine(provider0.address, index, epochId, deadline, price, uri, {
          value: price,
        });
    }
  });

  it("Forward time", async function () {
    console.log("******************************************************");
    await ethers.provider.send("evm_increaseTime", [3600 * 24 * 30]);
    await ethers.provider.send("evm_mine", []);
  });

  it("User3 mines randomly", async function () {
    console.log("******************************************************");
    const iterations = 42;
    const capacity = (await miner.capacity()).toNumber();
    for (let i = 0; i < iterations; i++) {
      const index = Math.floor(Math.random() * capacity);
      const slot = await multicall.getSlot(index);
      const price = slot.price;
      const epochId = slot.epochId;
      const uri =
        "#" +
        Math.floor(Math.random() * 0xffffff)
          .toString(16)
          .padStart(6, "0");
      const latest = await ethers.provider.getBlock("latest");
      const deadline = latest.timestamp + 3600; // +1 hour
      await multicall
        .connect(user3)
        .mine(provider0.address, index, epochId, deadline, price, uri, {
          value: price,
        });
    }
  });
});
