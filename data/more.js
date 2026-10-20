// Extended catalog: generated at load time from real model lines × common colorways.
// Prices (dewuCny) are ESTIMATES; availability of a colorway is confirmed by the operator after checkout (est: true).
(function () {
  const EU = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"];
  const AP = ["XS", "S", "M", "L", "XL", "XXL"];
  const ONE = ["One size"];
  const COLORS = [
    ["#1E1E1E", "Чёрный", "Black"], ["#F4F4EF", "Белый", "White"], ["#8A8D91", "Серый", "Grey"], ["#24304A", "Тёмно-синий", "Navy"],
    ["#CFC6B6", "Бежевый", "Beige"], ["#5B4636", "Коричневый", "Brown"], ["#4B5A3A", "Хаки", "Olive"], ["#8E1F2B", "Бордовый", "Burgundy"],
    ["#2E4A8A", "Синий", "Blue"], ["#C9302C", "Красный", "Red"], ["#2F6B4F", "Зелёный", "Green"], ["#E8DCC8", "Молочный", "Cream"],
    ["#B9C7D8", "Голубой", "Light blue"], ["#E7B9C6", "Розовый", "Pink"], ["#D9A441", "Горчичный", "Mustard"], ["#6B5B95", "Фиолетовый", "Purple"]
  ];
  // [name, category, dewuCny, gender]
  const S = (n, c, g) => [n, "shoes", c, g || "unisex"];
  const POOLS = {
    "Nike": [S("Air Force 1 Low", 699), S("Air Force 1 Mid", 799), S("Air Max 90", 899), S("Air Max 95", 1099), S("Air Max 97", 1099), S("Air Max 1", 899),
      S("Air Max Plus", 1099), S("Air Max 270", 899), S("Air Max Pulse", 899), S("Dunk Low", 749), S("Dunk High", 799), S("Blazer Mid '77", 599),
      S("Cortez", 549), S("Pegasus 41", 899), S("Vomero 5", 999), S("P-6000", 699), S("V2K Run", 699), S("Air Zoom Alphafly", 1599),
      S("Killshot 2", 549), S("Court Vision Low", 449), S("Air Huarache", 799), S("Shox TL", 1099), S("Air Max Dn", 1099), S("Calm Slide", 349),
      ["Tech Fleece Hoodie", "hoodies", 799], ["Tech Fleece Joggers", "pants", 699], ["Club Fleece Hoodie", "hoodies", 449], ["Club Fleece Joggers", "pants", 399],
      ["Sportswear Tee", "tshirts", 199], ["Windrunner Jacket", "jackets", 699], ["Heritage Backpack", "bags", 299], ["Club Cap", "caps", 199], ["Everyday Socks 3-Pack", "socks", 119]],
    "Jordan": [S("Air Jordan 1 Low", 899), S("Air Jordan 1 Mid", 999), S("Air Jordan 1 High OG", 1399), S("Air Jordan 3 Retro", 1399), S("Air Jordan 4 Retro", 1599),
      S("Air Jordan 5 Retro", 1399), S("Air Jordan 6 Retro", 1399), S("Air Jordan 11 Retro", 1499), S("Air Jordan 12 Retro", 1399), S("Air Jordan 13 Retro", 1399),
      S("Jordan Spizike Low", 1099), S("Jordan Max Aura 5", 899), ["Jumpman Hoodie", "hoodies", 499], ["Jumpman Tee", "tshirts", 249], ["Jumpman Cap", "caps", 199]],
    "Adidas": [S("Samba OG", 749), S("Gazelle", 699), S("Gazelle Indoor", 749), S("Spezial", 699), S("Campus 00s", 749), S("Superstar", 599), S("Stan Smith", 599),
      S("Forum Low", 649), S("Ultraboost 1.0", 1099), S("Ultraboost Light", 1199), S("NMD_R1", 899), S("Adizero SL", 699), S("Handball Spezial", 699),
      S("SL 72", 649), S("Taekwondo", 699), S("Adilette Slides", 249), S("Ozweego", 699), S("Response CL", 699),
      ["Trefoil Hoodie", "hoodies", 449], ["Adicolor Track Jacket", "jackets", 549], ["Firebird Track Pants", "pants", 449], ["Trefoil Tee", "tshirts", 199], ["Trefoil Cap", "caps", 179]],
    "New Balance": [S("530", 649), S("550", 749), S("574", 599), S("327", 649), S("2002R", 899), S("9060", 1099), S("990v6", 1399), S("991v2", 1599),
      S("992", 1399), S("1906R", 999), S("740", 749), S("480", 599), S("1000", 999), S("204L", 749), ["Essentials Hoodie", "hoodies", 449], ["Athletics Tee", "tshirts", 219]],
    "Asics": [S("Gel-Kayano 14", 899), S("Gel-1130", 649), S("Gel-NYC", 849), S("GT-2160", 849), S("Gel-Lyte III", 749), S("Gel-Nimbus 26", 1099),
      S("Gel-Kayano 31", 1099), S("Japan S", 449), S("Gel-Quantum 360", 999), S("Novablast 4", 899)],
    "Onitsuka Tiger": [S("Mexico 66", 699), S("Mexico 66 SD", 799), S("Tokuten", 699), S("Serrano", 599), S("Delegation EX", 799)],
    "Puma": [S("Suede Classic", 499), S("Speedcat OG", 649), S("Palermo", 599), S("Clyde", 549), S("RS-X", 649), S("Mayze", 599), S("Velophasis", 699),
      ["Essentials Hoodie", "hoodies", 349], ["Logo Tee", "tshirts", 179]],
    "Converse": [S("Chuck 70 Hi", 549), S("Chuck 70 Low", 499), S("Chuck Taylor All Star Hi", 399), S("Run Star Hike", 649), S("One Star Pro", 499), S("Weapon", 599)],
    "Vans": [S("Old Skool", 449), S("Sk8-Hi", 499), S("Authentic", 399), S("Era", 399), S("Slip-On", 399), S("Knu Skool", 549), S("Old Skool 36", 549)],
    "Salomon": [S("XT-6", 1199), S("XT-4 OG", 1199), S("ACS Pro", 1199), S("Speedcross 6", 999), S("XA Pro 3D", 999), S("XT-Whisper", 1099)],
    "On": [S("Cloud 6", 999), S("Cloudmonster", 1099), S("Cloudtilt", 1099), S("Cloudnova", 1099), S("Cloudsurfer", 1099), S("Cloud X 4", 999)],
    "Hoka": [S("Clifton 9", 999), S("Bondi 8", 1099), S("Mach 6", 999), S("Speedgoat 6", 1099), S("Transport", 899), S("Ora Recovery Slide", 449)],
    "Reebok": [S("Club C 85", 499), S("Classic Leather", 499), S("Club C Revenge", 549), S("Instapump Fury", 999), S("BB 4000 II", 549)],
    "UGG": [S("Classic Mini II", 1099), S("Classic Ultra Mini", 1099), S("Tasman", 899), S("Tazz", 999), S("Lowmel", 799), S("Classic Short II", 1199)],
    "Timberland": [S("6-Inch Premium Boot", 1199), S("Euro Hiker", 899), S("Authentic Chukka", 899), S("3-Eye Lug Boat Shoe", 899)],
    "Dr. Martens": [S("1460 Boot", 1099), S("1461 Shoe", 899), S("Jadon Boot", 1299), S("2976 Chelsea Boot", 1099), S("Adrian Loafer", 1099)],
    "Crocs": [S("Classic Clog", 349), S("Echo Clog", 449), S("Classic Crush Clog", 449), S("Mellow Recovery Slide", 299)],
    "Birkenstock": [S("Arizona", 699), S("Boston", 999), S("Milano", 799), S("Gizeh", 649), S("Zurich", 899)],
    "U.S. Polo Assn.": [["Classic Polo", "tshirts", 199, "men"], ["Slim Fit Polo", "tshirts", 219, "men"], ["Logo Tee", "tshirts", 149], ["Oxford Shirt", "tshirts", 279, "men"],
      ["Logo Hoodie", "hoodies", 349], ["Zip Hoodie", "hoodies", 379], ["Chino Pants", "pants", 299, "men"], ["Slim Jeans", "pants", 329], ["Sweatpants", "pants", 279],
      ["Chino Shorts", "shorts", 199], ["Puffer Jacket", "jackets", 699], ["Bomber Jacket", "jackets", 549], ["Logo Cap", "caps", 129], ["Leather Belt", "belts", 179],
      ["Crossbody Bag", "bags", 249], ["Backpack", "bags", 299], S("Low Sneakers", 399), S("Leather Sneakers", 449), S("Slides", 179)],
    "Lacoste": [["Classic Fit Polo L.12.12", "tshirts", 599], ["Slim Fit Polo", "tshirts", 599], ["Crocodile Tee", "tshirts", 299], ["Fleece Hoodie", "hoodies", 799],
      ["Track Pants", "pants", 699], S("Carnaby Set", 699), S("Powercourt", 599), ["Logo Cap", "caps", 279]],
    "Ralph Lauren": [["Custom Slim Polo", "tshirts", 599], ["Classic Oxford Shirt", "tshirts", 699], ["Cable-Knit Sweater", "hoodies", 999], ["Fleece Hoodie", "hoodies", 799],
      ["Logo Cap", "caps", 349], ["Chino Shorts", "shorts", 499]],
    "Tommy Hilfiger": [["Flag Logo Tee", "tshirts", 249], ["Regular Polo", "tshirts", 449], ["Logo Hoodie", "hoodies", 549], ["Denton Chinos", "pants", 549], S("Court Sneakers", 549), ["Logo Cap", "caps", 249]],
    "Calvin Klein": [["Monogram Tee", "tshirts", 249], ["Monogram Hoodie", "hoodies", 549], ["Boxer Briefs 3-Pack", "underwear", 299], ["Logo Bralette", "bras", 199, "women"], ["Slim Jeans", "pants", 599]],
    "The North Face": [["1996 Retro Nuptse Jacket", "jackets", 1799], ["Denali Fleece", "jackets", 999], ["Box Logo Hoodie", "hoodies", 549], ["Half Dome Tee", "tshirts", 219],
      ["Base Camp Duffel M", "bags", 899], ["Borealis Backpack", "bags", 699], ["Logo Beanie", "beanies", 199]],
    "Stone Island": [["Garment Dyed Crewneck", "hoodies", 1999], ["Hooded Sweatshirt", "hoodies", 2299], ["Cargo Pants", "pants", 2199], ["Logo Tee", "tshirts", 899], ["Overshirt", "jackets", 2799]],
    "Moncler": [["Maya Down Jacket", "jackets", 9999], ["Genius Hoodie", "hoodies", 3999], ["Logo Polo", "tshirts", 2499], ["Logo Beanie", "beanies", 1999]],
    "Carhartt WIP": [["Detroit Jacket", "jackets", 1499], ["Chase Hoodie", "hoodies", 699], ["Pocket Tee", "tshirts", 299], ["Single Knee Pant", "pants", 799], ["Acrylic Watch Hat", "beanies", 199]],
    "Stüssy": [["Basic Hoodie", "hoodies", 899], ["Basic Tee", "tshirts", 449], ["Stock Cap", "caps", 349], ["Big Ol' Jeans", "pants", 999]],
    "Essentials": [["Essentials Hoodie", "hoodies", 699], ["Essentials Sweatpants", "pants", 599], ["Essentials Tee", "tshirts", 349], ["Essentials Shorts", "shorts", 449]],
    "Supreme": [["Box Logo Hoodie", "hoodies", 2999], ["Box Logo Tee", "tshirts", 999], ["Camp Cap", "caps", 599], ["Shoulder Bag", "bags", 799]],
    "Champion": [["Reverse Weave Hoodie", "hoodies", 449], ["Script Logo Tee", "tshirts", 179], ["Reverse Weave Joggers", "pants", 399]],
    "Levi's": [["501 Original Jeans", "pants", 549], ["511 Slim Jeans", "pants", 549], ["Trucker Jacket", "jackets", 699], ["Batwing Logo Tee", "tshirts", 179]],
    "Under Armour": [S("Charged Assert 10", 449), ["Rival Fleece Hoodie", "hoodies", 349], ["Tech 2.0 Tee", "tshirts", 179], ["Unstoppable Joggers", "pants", 449]],
    "Columbia": [["Steens Mountain Fleece", "jackets", 449], ["Watertight II Jacket", "jackets", 549], S("Redmond III", 599)],
    "Arc'teryx": [["Beta LT Jacket", "jackets", 3499], ["Atom Hoody", "jackets", 2199], ["Mantis 2 Waist Pack", "bags", 399], ["Bird Word Cap", "caps", 349]],
    "Balenciaga": [S("Triple S", 6499), S("Track", 6499), S("3XL", 6999), ["Logo Hoodie", "hoodies", 5999], ["Cap", "caps", 2499]],
    "Gucci": [S("Ace Sneakers", 4999), S("Screener", 6499), ["GG Belt", "belts", 3299], ["Ophidia Shoulder Bag", "bags", 9999]],
    "Prada": [S("America's Cup", 6499), ["Re-Nylon Backpack", "bags", 9999], ["Triangle Logo Tee", "tshirts", 4999]],
    "Casio": [["G-Shock GA-2100", "watches", 699], ["G-Shock DW-5600", "watches", 599], ["Vintage A168", "watches", 299], ["Edifice Chronograph", "watches", 999]],
    "Anta": [S("KAI 1", 599), S("C202 GT", 449)], "Li-Ning": [S("Way of Wade 11", 999), S("Soft Go", 449)]
  };
  const GEN = {
    fashion: [["Logo Hoodie", "hoodies", 449], ["Zip Hoodie", "hoodies", 499], ["Logo Tee", "tshirts", 199], ["Oversized Tee", "tshirts", 229], ["Long Sleeve Tee", "tshirts", 249],
      ["Polo Shirt", "tshirts", 299], ["Sweatpants", "pants", 399], ["Cargo Pants", "pants", 449], ["Straight Jeans", "pants", 449], ["Sweat Shorts", "shorts", 279],
      ["Windbreaker", "jackets", 549], ["Puffer Jacket", "jackets", 899], ["Bomber Jacket", "jackets", 699], ["Logo Cap", "caps", 179], ["Logo Beanie", "beanies", 159],
      ["Tote Bag", "bags", 249], ["Crossbody Bag", "bags", 299], ["Backpack", "bags", 399], ["Leather Belt", "belts", 249], ["Socks 3-Pack", "socks", 99],
      S("Low Sneakers", 599), S("Leather Sneakers", 649), S("Slides", 249), S("Chelsea Boots", 899)],
    watches: [["Automatic 40mm", "watches", 2999], ["Chronograph 42mm", "watches", 3499], ["Quartz 38mm", "watches", 1499], ["Diver 41mm", "watches", 3299], ["Dress 36mm", "watches", 2499], ["GMT 40mm", "watches", 3999]]
  };
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const sizesFor = (cat, g) => cat === "shoes" ? (g === "women" ? ["35.5", "36", "36.5", "37.5", "38", "38.5", "39", "40", "40.5", "41"] : EU) : ["watches", "bags", "caps", "beanies", "belts"].includes(cat) ? ONE : cat === "socks" ? ["36-40", "41-45"] : AP;
  const out = [];
  const ids = new Set((window.GD_PRODUCTS || []).map(p => p.id));
  const seen = new Set((window.GD_PRODUCTS || []).map(p => (p.brand + "|" + p.name + "|" + p.color).toLowerCase()));
  function add(brand, m, color, mult) {
    const [name, cat, cny, g] = m;
    const key = (brand + "|" + name + "|" + color[0]).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    const h = hash(key);
    const price = Math.max(69, Math.round(cny * mult * (0.94 + (h % 13) / 100) / 10) * 10 - 1);
    let id = "m" + h.toString(36); while (ids.has(id)) id += "x"; ids.add(id);
    out.push({ id, brand, name, category: cat, gender: g || "unisex", color: color[0], colorName: { ru: color[1], en: color[2] },
      sizes: sizesFor(cat, g), dewuCny: price, est: true });
    return true;
  }
  const TARGET = 30000;
  // 1) real model lines of the top brands in up to 12 colorways each
  Object.keys(POOLS).forEach(brand => POOLS[brand].forEach(m => {
    const start = hash(brand + m[0]) % COLORS.length;
    for (let k = 0; k < 12; k++) add(brand, m, COLORS[(start + k * 5) % COLORS.length], 1);
  }));
  // 2) brand basics for every brand on the brands page, spread until the target is reached
  const brands = (window.GD_BRANDS || []).filter(b => !POOLS[b.name]);
  let round = 0;
  while (out.length < TARGET && round < 16) {
    for (let i = 0; i < brands.length && out.length < TARGET; i++) {
      const b = brands[i], tpl = b.group === "watches" ? GEN.watches : GEN.fashion;
      const mult = b.group === "watches" ? (b.premium ? 6 : 0.4) : (b.premium ? 4.5 : 1);
      tpl.forEach((m, j) => { if (out.length < TARGET) add(b.name, m, COLORS[(hash(b.name + m[0]) + round * 7 + j) % COLORS.length], mult); });
    }
    round++;
  }
  window.GD_PRODUCTS = (window.GD_PRODUCTS || []).concat(out);
})();
