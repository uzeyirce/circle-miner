const fs = require('fs');

const TOKEN_ADDRESS = "0xf3715bf5c2de299f08b81180ffb739a8372a175f";
const limit = 50;
let offset = 0;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchAllHolders() {
  const holders = [];
  let page = 1;
  const ESTIMATED_TOTAL = 14096;
  let hasMore = true;

  console.log(`🚀 ${ESTIMATED_TOTAL} holder adresi çekilmeye başlanıyor...\n`);

  while (hasMore) {
    const url = `https://api.arc.exploreme.pro/api/v2/tokens/${TOKEN_ADDRESS}/holders?offset=${offset}&limit=${limit}`;

    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        }
      });

      if (res.status === 429) {
        console.log(`\n⚠️ Rate limit (429). 5 saniye bekleniyor...`);
        await delay(5000);
        continue;
      }

      if (!res.ok) {
        console.log(`\n❌ HTTP Hatası: ${res.status}`);
        break;
      }

      const data = await res.json();
      
      // API doğrudan dizi (array) döndürüyor
      const list = Array.isArray(data) ? data : (data.items || []);

      if (list.length === 0) {
        hasMore = false;
        break;
      }

      list.forEach(item => {
        const address = item.holder || item.address;
        const balance = item.balance || item.value || "0";

        if (address) {
          holders.push({ address, balance });
        }
      });

      const progress = Math.min(((holders.length / ESTIMATED_TOTAL) * 100).toFixed(2), 100);
      process.stdout.write(`\r📥 Sayfa ${page} çekildi | Toplam: ${holders.length} adres | İlerleme: %${progress}`);

      // Sonraki sayfa için offset artır
      offset += limit;
      page++;
      
      // Eğer dönen eleman sayısı limit'ten azsa son sayfadayız demektir
      if (list.length < limit) {
        hasMore = false;
      }

      await delay(200); // Sunucuyu yormamak için kısa bekleme

    } catch (err) {
      console.error(`\n❌ Hata (Sayfa ${page}):`, err.message);
      await delay(3000);
    }
  }

  console.log(`\n\n✅ İşlem Tamamlandı! Veriler yazılıyor...`);

  if (holders.length > 0) {
    // Sadece Adresler (TXT)
    const addressList = holders.map(h => h.address).join('\n');
    fs.writeFileSync('holders_addresses.txt', addressList);

    // Adres ve Bakiye (CSV)
    const csvContent = "Address,Balance\n" + holders.map(h => `${h.address},${h.balance}`).join('\n');
    fs.writeFileSync('holders_data.csv', csvContent);

    console.log(`🎉 Toplam ${holders.length} adres başarıyla çekildi!`);
    console.log("📄 Adres Listesi: holders_addresses.txt");
    console.log("📊 Adres + Bakiye Listesi: holders_data.csv");
  } else {
    console.log("❌ Kaydedilecek adres bulunamadı.");
  }
}

fetchAllHolders();
