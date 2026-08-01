const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// ==== AYARLAR ====
const CSV_PATH = path.join(__dirname, "..", "holders_data.csv");
const CPLAY_TOKEN_ADDRESS = process.env.CPLAY_TOKEN_ADDRESS || "0x8613155fF713c13F6C177275Af9bF195e69dEd34";
const AMOUNT_PER_WALLET = "10";
const DELAY_MS = 5000; // Her işlem arası 5 saniye bekleme

function parseCsv(filePath) {
  const content = fs.readFileSync(filePath, "utf8").trim();
  const lines = content.split("\n").slice(1);
  return lines
    .map(line => line.split(",")[0].trim())
    .filter(addr => addr && addr.startsWith("0x"));
}

async function main() {
  const addresses = parseCsv(CSV_PATH);
  console.log(`${addresses.length} adres bulundu. Her birine ${AMOUNT_PER_WALLET} CPLAY gönderilecek.\n`);

  // 1. Private key ile doğrudan Wallet oluşturuluyor (getSigners kullanılmadığı için eth_chainId sorgusu atlamış oluyoruz)
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error(".env dosyasında PRIVATE_KEY bulunamadı!");
  }

  // Hardhat provider'ı doğrudan bağlanıyor
  const wallet = new hre.ethers.Wallet(privateKey, hre.ethers.provider);
  console.log("Gönderen cüzdan:", wallet.address);

  // 2. Kontrat doğrudan nesne olarak kuruluyor
  const abi = ["function transfer(address to, uint256 amount) returns (bool)"];
  const token = new hre.ethers.Contract(CPLAY_TOKEN_ADDRESS, abi, wallet);

  const results = { success: [], failed: [] };

  for (let i = 0; i < addresses.length; i++) {
    const addr = addresses[i];
    try {
      // Doğrudan raw tx imzalayıp gönderir
      const tx = await token.transfer(addr, hre.ethers.parseEther(AMOUNT_PER_WALLET));
      console.log(`[${i + 1}/${addresses.length}] ✅ ${addr} — tx: ${tx.hash}`);
      results.success.push(addr);
    } catch (err) {
      console.log(`[${i + 1}/${addresses.length}] ❌ ${addr} — HATA: ${err.reason || err.message}`);
      results.failed.push({ address: addr, error: err.reason || err.message });
    }

    if (i < addresses.length - 1) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  console.log("\n------------------------------------------------");
  console.log(`Tamamlandı: ${results.success.length} başarılı, ${results.failed.length} başarısız`);
  console.log("------------------------------------------------");

  if (results.failed.length > 0) {
    fs.writeFileSync(
      path.join(__dirname, "..", "airdrop_failed.json"),
      JSON.stringify(results.failed, null, 2)
    );
    console.log("Başarısız olanlar airdrop_failed.json dosyasına yazıldı.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
