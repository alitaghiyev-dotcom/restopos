import db from './db.js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function seed() {
  console.log('🌱 Veritabanı tabloları oluşturuluyor...\n');
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
  await db.exec(schema);

  console.log('🌱 Veritabanı örnek verilerle dolduruluyor...\n');

  // Check if data already exists
  const staffCount = await db.get('SELECT COUNT(*) as count FROM staff');
  if (staffCount && staffCount.count > 0) {
    console.log('⚠️  Veriler zaten mevcut. Seed işlemi atlandı.');
    return;
  }

  await db.transaction(async (txDb) => {
    // ===== PERSONEL =====
    const staffData = [
      ['Ahmet Yılmaz', '1234', 'admin'],
      ['Mehmet Demir', '5678', 'cashier'],
      ['Ayşe Kaya', '1111', 'waiter'],
      ['Fatma Çelik', '2222', 'waiter'],
      ['Mutfak Ekibi 1', '4444', 'kitchen']
    ];
    for (const s of staffData) {
      await txDb.run('INSERT INTO staff (name, pin, role) VALUES (?,?,?)', s);
    }
    
    // ===== BÖLGELER =====
    const zoneData = [
      ['Bahçe', '1. Kat Bahçe Alanı'],
      ['Teras', '2. Kat Teras'],
      ['Salon', 'Ana Salon']
    ];
    for (const z of zoneData) {
      await txDb.run('INSERT INTO zones (name, description) VALUES (?,?)', z);
    }
    
    // ===== MASALAR =====
    ];
    for (const [num, zone, cap, status, px, py] of tables) {
      await txDb.run('INSERT INTO tables (number, zone_id, capacity, status, position_x, position_y) VALUES (?,?,?,?,?,?)',
        [num, zone, cap, status, px, py]);
    }
    console.log('✅ 20 masa eklendi');

    // ===== KATEGORİLER =====
    const categories = [
      ['Başlangıçlar','🥗','#10b981',1], ['Ana Yemekler','🥩','#ef4444',2],
      ['Pizzalar','🍕','#f59e0b',3], ['Burgerler','🍔','#f97316',4],
      ['Makarnalar','🍝','#8b5cf6',5], ['Salatalar','🥬','#22c55e',6],
      ['Tatlılar','🍰','#ec4899',7], ['Sıcak İçecekler','☕','#92400e',8],
      ['Soğuk İçecekler','🥤','#06b6d4',9], ['Alkollü İçecekler','🍷','#7c3aed',10],
    ];
    for (const [name, icon, color, order] of categories) {
      await txDb.run('INSERT INTO categories (name, icon, color, sort_order) VALUES (?,?,?,?)', [name, icon, color, order]);
    }
    console.log('✅ 10 kategori eklendi');

    // ===== ÜRÜNLER =====
    const products = [
      [1,'Mercimek Çorbası',75,'Geleneksel Türk mercimek çorbası',1],
      [1,'Humus',85,'Nohut ezmesi, zeytinyağı, sumak',2],
      [1,'Sigara Böreği',90,'4 adet, peynirli',3],
      [1,'Patates Kızartması',70,'Çıtır patates, özel sos',4],
      [1,'Halloumi Tava',110,'Izgara hellim peyniri',5],
      [2,'Adana Kebap',280,'Acılı kıyma kebabı, lavaş, közlenmiş domates',1],
      [2,'Urfa Kebap',280,'Acısız kıyma kebabı, lavaş',2],
      [2,'Tavuk Şiş',220,'Marine edilmiş tavuk göğsü, pilav',3],
      [2,'Kuzu Pirzola',380,'4 adet kuzu pirzola, sebze garnitür',4],
      [2,'Karışık Izgara',420,'Adana, tavuk, kanat, köfte',5],
      [2,'Levrek Tava',320,'Günlük taze levrek, roka salata',6],
      [3,'Margarita',180,'Domates sos, mozzarella, fesleğen',1],
      [3,'Karışık Pizza',240,'Sucuk, mantar, biber, mısır, zeytin',2],
      [3,'Pepperoni',220,'Pepperoni, mozzarella',3],
      [3,'Dört Peynirli',250,'Mozzarella, cheddar, parmesan, rokfor',4],
      [4,'Klasik Burger',200,'150gr dana köfte, marul, domates, turşu',1],
      [4,'Cheese Burger',220,'Çift cheddar, karamelize soğan',2],
      [4,'Tavuk Burger',190,'Çıtır tavuk, ranch sos',3],
      [4,'Double Burger',280,'Çift köfte, çift cheddar, özel sos',4],
      [5,'Bolonez',190,'Kıymalı domates soslu spagetti',1],
      [5,'Alfredo',200,'Kremalı tavuklu fettuccine',2],
      [5,'Arabiata',170,'Acılı domates soslu penne',3],
      [5,'Carbonara',210,'Pastırmalı, yumurtalı, parmesanlı',4],
      [6,'Sezar Salata',160,'Marul, parmesan, kruton, sezar sos',1],
      [6,'Çoban Salata',70,'Domates, salatalık, soğan, biber',2],
      [6,'Ton Balıklı Salata',180,'Ton balığı, mısır, yeşillikler',3],
      [7,'Künefe',160,'Sıcak servis, antep fıstıklı',1],
      [7,'Sütlaç',90,'Fırın sütlaç, tarçınlı',2],
      [7,'Cheesecake',130,'New York usulü, meyveli sos',3],
      [7,'Brownie',120,'Sıcak çikolatalı brownie, dondurma',4],
      [7,'Baklava',140,'Antep fıstıklı, 4 dilim',5],
      [8,'Türk Kahvesi',50,'Geleneksel Türk kahvesi',1],
      [8,'Espresso',60,'Çift shot espresso',2],
      [8,'Latte',80,'Sütlü espresso',3],
      [8,'Cappuccino',80,'Köpüklü sütlü espresso',4],
      [8,'Çay',25,'Demlik çay',5],
      [8,'Bitki Çayı',55,'Ihlamur / Papatya / Adaçayı',6],
      [9,'Ayran',30,'Ev yapımı ayran',1],
      [9,'Kola',45,'330ml kutu',2],
      [9,'Fanta',45,'330ml kutu',3],
      [9,'Sprite',45,'330ml kutu',4],
      [9,'Soda',30,'Sade / Meyveli',5],
      [9,'Limonata',60,'Taze sıkılmış limonata',6],
      [9,'Ice Tea',50,'Şeftali / Limon',7],
      [9,'Taze Meyve Suyu',70,'Portakal / Nar / Karışık',8],
      [9,'Su (Küçük)',15,'0.5L',9],
      [9,'Su (Büyük)',25,'1L',10],
      [10,'Bira (Barel)',90,'500ml',1],
      [10,'Bira (Şişe)',80,'330ml',2],
      [10,'Rakı',120,'Tek (5cl)',3],
      [10,'Kırmızı Şarap',110,'Kadeh',4],
      [10,'Beyaz Şarap',110,'Kadeh',5],
    ];
    for (const [cat, name, price, desc, order] of products) {
      await txDb.run('INSERT INTO products (category_id, name, price, description, sort_order) VALUES (?,?,?,?,?)',
        [cat, name, price, desc, order]);
    }
    console.log('✅ ' + products.length + ' ürün eklendi');

    // ===== AYARLAR =====
    const settings = [
      ['restaurant_name', 'RestoPos Demo Restoran'],
      ['restaurant_address', 'İstanbul, Türkiye'],
      ['tax_rate', '10'],
      ['currency', 'TL'],
      ['currency_symbol', '₺'],
    ];
    for (const [key, value] of settings) {
      await txDb.run('INSERT INTO settings (key, value) VALUES (?, ?)', [key, value]);
    }
    console.log('✅ Ayarlar eklendi');
  });

  await runSeed();

  console.log('\n🎉 Seed işlemi tamamlandı!\n');
  console.log('📌 Giriş bilgileri:');
  console.log('   Admin:   PIN 1234 (Ahmet Yılmaz)');
  console.log('   Kasiyer: PIN 5678 (Mehmet Demir)');
  console.log('   Garson:  PIN 1111 (Ayşe Kaya)');
  console.log('   Mutfak:  PIN 4444 (Mustafa Aydın)');
}

seed();
