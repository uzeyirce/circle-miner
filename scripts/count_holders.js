const hre = require("hardhat");

async function main() {
  const tokenAddress = process.env.CPLAY_TOKEN_ADDRESS || "0x8613155fF713c13F6C177275Af9bF195e69dEd34";
  const provider = hre.ethers.provider;

  console.log(" Holder sayısı taranıyor, lütfen bekleyin...");

  // Transfer event signature: Transfer(address,address,uint256)
  const filter = {
    address: tokenAddress,
    topics: [hre.ethers.id("Transfer(address,address,uint256)")],
    fromBlock: 0,
    toBlock: "latest"
  };

  try {
    const logs = await provider.getLogs(filter);
    const holders = new Set();

    for (const log of logs) {
      // Event içindeki 'to' adresini (alıcıyı) alıp kümesine ekliyoruz
      const to = hre.ethers.dataSlice(log.topics[2], 12);
      if (to !== hre.ethers.ZeroAddress) {
        holders.add(to.toLowerCase());
      }
    }

    console.log(` Toplam Benzersiz CPLAY Alıcısı / Holder Sayısı: ${holders.size}`);
  } catch (err) {
    console.log(" RPC bu sorguyu desteklemiyor:", err.message);
  }
}

main().catch(console.error);
