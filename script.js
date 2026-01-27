/* script.js
   Data-first viewer (scroll-synced) using the NEW tablet renderer.

   CHANGES (requested):
   ✅ Uses tablet drawing pipeline (CreateTabletTierX) instead of old portrait cards
   ✅ Uses new office format:
        stint.office = "Ruler of Wu"
        stint.state  = "Wu" | null
   ✅ Implements STATE COLORS (hash(state) -> stable palette), with sensible tier defaults when state is null
   ✅ Updates OFFICE_SORT_ORDER to your NEW title list (as-provided)
   ✅ Keeps performance:
        - same-year guard
        - per-year DOM cache (LRU)
        - placeholder (monogram) cache

   Assumptions:
   - You include people.js before this script, and it defines: const PEOPLE = [...]
   - Your generator now emits: offices: [{ office, state, from, to }]
*/

document.addEventListener("DOMContentLoaded", () => {
  // ---- CONFIG -------------------------------------------------------------

  const IMAGE_DIR = "images/";
  const IMAGE_EXT = ".jpg"; // change to ".png" if you prefer

  const MAP_DIR = "maps/";
  const MAP_EXT = ".png";
  const MAP_WIDTH_PX = 400;

  // If a year’s map file is missing, fall back to this year:
  const MAP_DEFAULT_YEAR = -1046; // maps/y--1046.png

  // New title list (order defines ranking). Keep *exact spelling/casing* as your data emits.
  const OFFICE_SORT_ORDER = [
    "Emperor",
    "Crown Prince",
    "Imperial Prince",
    "Duke of Lu",
    "Duke of Jin",
    "Marquis of Jin",
    "Duke of Qi",
    "King",
    "Marquess of Wei",
    "Monarch",
    "Empress Consort",
    "Q1051272",
    "Chancellor",
    "Duke of Song",
    "Q209726",
    "Duke of Qin",
    "Wang",
    "Chinese Sovereign",
    "Gonghe Regency",
    "Duke of Zheng",
    "Grand Chancellor",
    "Taishang Huang",
    "Heshuo Qinwang",
    "Q13218121",
    "Prime Minister of the Imperial Cabinet",
    "Great President of the Republic of China",
    "Viceroy of Zhili",
    "Marquis of Jin (Marquis of Jin)",
    "Proto-Ruler of Chu",
    "Viscount of Chu",
    "Marquess of Han",
    "Zu Geng",
    "Khan",
    "Empress Dowager",
    "Regent",
    "Mayor of Kaifeng Fu",
    "Marquess of Zhao",
    "Q111272723",
    "Wu Ding",
    "Marquis of Tian (Ruler of Qi)",
    "Duke",
    "Zhuguo",
    "Chancellor of the Tang Dynasty",
    "Ruler of Qi",
    "List of Consorts of Rulers of China",
    "Marquis of Qin",
    "Gongbo of Qin",
    "Ruler of Qin",
    "Ruler of Wu",
    "Q1934938",
    "Qin Shi Huang (Shi Huangdi)",
    "Qin Er Shi",
    "Khagan of the Mongol Empire",
    // The following lines were truncated in your message ("(Han" / "(Han"), so we keep them as-is
    // to avoid guessing. If your data includes the full strings, add the complete ones here.
    "Marquis of Haihun (Liu He Contested) (Han",
    "Ruzi Ying (Contested) (Han",
    "Wang Mang",
    "Marquess of Beixiang (Contested) (Han",
    "Prince of Hongnong (Liu Bian Contested) (Han",
    "Di Yi",
    "Prince",
    "Khagan",
    "Lin Xin",
    "Wen Ding (Wen Wu Ding)",
    "Zu Jia",
    "Geng Ding (Kang Ding)",
    "Wu Yi",
    "Khan of Heaven",
    "Q7217722",
    "Noble",
  ];
  
  
  const PEOPLE = [
  {
    uid: "Q1193345",
    name: "Suiren",
    cjkName: "燧人",
    cjkNames: ["燧人", "燧人氏", "燧皇", "風允婼", "风允婼"],
    aliases: ["Prometheus", "Soui gine", "Soui-gin", "Soui-gine", "Sui Jen", "Sui Ren", "Sui-gin", "Sui-jen", "Suy-jin", "Suy-jin-shi", "the Chinese Prometheus", "Soui-gin-chi", "Soui-gine-chi", "Soüi-gine", "Sui-ren", "Suiren", "燧人", "燧皇", "風允婼", "수인씨"],
    desc: "legendary Chinese leader and culture hero responsible for harnessing fire",
    born: null,
    died: null,
    offices: [
      { office: "Emperor", state: null, from: -3201, to: -3101 }
    ]
  },
  {
    uid: "Q29201",
    name: "Yellow Emperor",
    cjkName: "黃帝",
    cjkNames: ["黃帝", "黄帝", "公孙轩辕", "公孫軒轅", "姬軒轅", "帝軒", "帝轩", "有熊氏", "軒轅", "軒轅氏", "軒轅黃帝", "轩辕", "轩辕氏", "轩辕黄帝", "黃帝氏", "黃帝軒轅氏", "黄帝氏"],
    aliases: ["Chi Hsuan-yuan", "Chi Hsüan-yüan", "Di Xuan", "Dixuan", "Emperor Xuan", "Gongsun Xuanyuan", "Hien Yuen", "Hien-yuen", "Hiene Yuene", "Hiene-yuene", "Hin Yuen", "Hoang Ti", "Hoang-ti", "Hsuan Yuan", "Hsuan-yuan", "Hsuanyuan", "Hsüan Yüan", "Hsüan-yüan", "Huang Di", "Huang Ti"],
    desc: "Legendary Chinese ruler, one of the Five Emperors, later worshipped as a god",
    born: -2718,
    died: -2598,
    offices: [
    ]
  },
  {
    uid: "Q198180",
    name: "Zhuanxu",
    cjkName: "顓頊",
    cjkNames: ["顓頊", "颛顼", "帝顓頊", "高阳", "高阳氏", "高陽", "高陽氏", "玄帝"],
    aliases: ["Choen-hio", "Chuan Hsu", "Chuan Hsü", "Chuan-hsu", "Chuan-hsü", "Chuen-hyo", "Chwen-hyo", "Emperor Hsüen", "Emperor Xuan", "Emperor Zhuan Xu", "Gaoyang", "Gaoyang Shi", "Goyang", "Hsüen Ti", "Hsüen-ti", "Kao-yang", "King Xuan", "Tchouene hio", "Tchouene-hio", "Xuan Di"],
    desc: "Legendary ancient Chinese emperor",
    born: null,
    died: null,
    offices: [
      { office: "Emperor", state: null, from: -2514, to: -2437 }
    ]
  },
  {
    uid: "Q721756",
    name: "Emperor Ku",
    cjkName: "嚳",
    cjkNames: ["嚳", "喾", "帝嚳", "喾帝", "夋", "夒", "姬夋", "帝喾", "帝喾高辛氏", "帝嚳高辛氏", "高辛氏"],
    aliases: ["Cao sine", "Cao-sine", "Di Ku", "Diku", "Gaoxin", "King Ku", "Ku", "Ti-ko", "Ti-kuh", "Tico", "Tio", "Ty-ho", "Imperiestro Ku", "امپراتور کو", "گوان", "Coa-sine", "Ti-co", "高辛", "高辛氏", "Imperators Kù"],
    desc: "The legendary ruler of China, one of the five emperors",
    born: null,
    died: null,
    offices: [
      { office: "Emperor", state: null, from: -2436, to: -2366 }
    ]
  },
  {
    uid: "Q819556",
    name: "Yao",
    cjkName: "尧",
    cjkNames: ["尧", "堯", "帝堯", "上元天官之神", "伊祁放勳", "伊耆放勳", "唐尧", "天官", "天官大帝", "尧帝", "尧的传说", "帝尧", "放勋", "陶唐", "陶唐氏", "唐堯", "祁放勳"],
    aliases: ["Di Yao", "Emperor Yao", "T'ang Yao", "T'ang-yao", "T'ao-t'ang", "Tang Yao", "Tao Tang Shi", "Tao-tang", "Tao-tang Shi", "Taotang", "Ti Yao", "Ti-yao", "Y Ky", "Y-ky", "Yaou", "Kaiser Yao", "Urkaiser Yao", "Imperiestro Jaŭ", "Jaŭ", "Cesar Jao"],
    desc: "legendary Chinese ruler, one of the Five Emperors",
    born: -2325,
    died: -2207,
    offices: [
    ]
  },
  {
    uid: "Q313342",
    name: "Shun",
    cjkName: "舜",
    cjkNames: ["舜", "帝舜", "中元地官之神", "地官", "地官大帝", "大舜", "姚重華", "舜帝", "虞", "虞帝", "虞朝", "虞舜"],
    aliases: ["Chun", "Chune", "Dishun", "Emperor Chune", "Emperor Shun", "Emperor Yu", "King Chune", "King Shun", "King Yu", "Shun Di", "Shun Ti", "Shun the Great", "Shun-ti", "Shundi", "Tiene-Chune", "Yu", "Yu Di", "Yu Shun", "Yu Ti", "Yu-shun"],
    desc: "legendary ruler of ancient China, one of the Five Emperors",
    born: -2295,
    died: -2185,
    offices: [
    ]
  },
  {
    uid: "Q1195072",
    name: "Shaokang",
    cjkName: "少康",
    cjkNames: ["少康"],
    aliases: ["Shao Kang", "Shǎo Kāng", "Shao Kāng", "Shǎo Kang", "Xia Shao Kang", "Hsia Shao-k'ang", "Hsia Shao-k’ang", "Xia Shaokang", "Kralj Šao Kang iz dinastije Sja", "Vua Thiếu Khang nhà Hạ"],
    desc: "6th king of the Xia dynasty of ancient China",
    born: null,
    died: -2101,
    offices: [
      { office: "King", state: null, from: -2119, to: -2098 }
    ]
  },
  {
    uid: "Q428030",
    name: "Zhu of Xia",
    cjkName: "杼",
    cjkNames: ["杼", "帝杼"],
    aliases: ["Xia Zhu", "Zhu de Xia", "Zhu", "杼"],
    desc: "Xia Dynasty Chinese king",
    born: null,
    died: -2101,
    offices: [
      { office: "King", state: null, from: -2098, to: -2041 }
    ]
  },
  {
    uid: "Q627784",
    name: "Yu the Great",
    cjkName: "禹",
    cjkNames: ["禹", "夏禹", "下元水官之神", "伯禹", "夏禹王", "大禹", "姒文命", "帝禹", "戎禹", "文命", "水官", "水官大帝", "夏伯禹", "姒禹", "崇伯禹"],
    aliases: ["Da Yu", "Si Yu", "Si, Wen Ming", "Xia Bo", "Xia Yu", "Yu el gran", "Si Wen Ming", "Yü Huang", "Dà-Yǔ", "Sì Wénmìng", "大禹", "姒文命", "禹", "Grande Yu", "Yu il grande", "夏伯", "夏禹", "戎禹", "文命", "禹王"],
    desc: "Xia Dynasty king and founder",
    born: -2298,
    died: -2198,
    offices: [
      { office: "Wang", state: null, from: -2071, to: -2026 }
    ]
  },
  {
    uid: "Q1204202",
    name: "Huai of Xia",
    cjkName: "槐",
    cjkNames: ["槐", "帝槐", "帝芬", "芬發"],
    aliases: ["Di Fen", "Di Huai", "Fen Fa", "Huai", "Huai (Xia-König)", "Xia Fen", "Kralj Huai iz dinastije Sja", "Vua Hòe nhà Hạ", "帝槐", "帝芬", "芬發"],
    desc: "Chinese king of Xia Dynasty",
    born: null,
    died: -2101,
    offices: [
      { office: "King", state: null, from: -2041, to: -2015 }
    ]
  },
  {
    uid: "Q1193745",
    name: "Mang of Xia",
    cjkName: "芒",
    cjkNames: ["芒", "帝芒"],
    aliases: ["Mang", "Kralj Mang iz dinastije Sja", "Vua Mang nhà Hạ"],
    desc: "9th Chinese king of Xia Dynasty",
    born: null,
    died: -2001,
    offices: [
      { office: "King", state: null, from: -2015, to: -1997 }
    ]
  },
  {
    uid: "Q1193799",
    name: "Xie of Xia",
    cjkName: "泄",
    cjkNames: ["泄", "帝泄"],
    aliases: ["Xia Xie", "Xie (Xia-König)", "Xie", "شیهٔ شیا", "泄", "Hsia Hsieh", "Kralj Sje iz dinastije Sja", "Vua Tiết nhà Hạ"],
    desc: "10th Chinese king of Xia Dynasty",
    born: null,
    died: -2001,
    offices: [
      { office: "King", state: null, from: -1997, to: -1981 }
    ]
  },
  {
    uid: "Q1204198",
    name: "Bu Jiang",
    cjkName: "不降",
    cjkNames: ["不降", "帝不降"],
    aliases: ["Bu Jiang", "Bu Jiàng", "Bù Jiang", "Bù Jiàng", "Xia Bu Jiang", "降", "Hsia Pu-chiang", "Hsia Pu-hsiang", "Xia Bu Xiang", "Kralj Bu Đijang iz dinastije Sja", "Vua Bất Giáng nhà Hạ"],
    desc: "11th Chinese king of Xia Dynasty",
    born: null,
    died: -2001,
    offices: [
      { office: "King", state: null, from: -1981, to: -1921 }
    ]
  },
  {
    uid: "Q186544",
    name: "Qi of Xia",
    cjkName: "启",
    cjkNames: ["启", "啓", "啓王夏", "夏王啟", "姒啟"],
    aliases: ["King Qi of Xia", "Qi Wang Xia", "Si Qi", "ᡥᡳᠶᠠ ᡤᡠᡵᡠᠨ ᡳ ᡴᡳ ᠸᠠᠩ", "啓王夏", "夏王啟", "姒啟"],
    desc: "son of Yu the Great ; second Xia Dynasty king (r. 1978 BCE-1963 BCE)",
    born: -2201,
    died: -2201,
    offices: [
      { office: "Wang", state: null, from: -1979, to: -1964 }
    ]
  },
  {
    uid: "Q1155744",
    name: "Tai Kang",
    cjkName: "太康",
    cjkNames: ["太康", "姒太康"],
    aliases: ["Si Tai Kang", "Xia Tai Kang", "Tai Kang", "Tài Kāng", "Hsia T'ai-k'ang", "Hsia T’ai-k’ang", "Xia Taikang", "Kralj Tai Kang iz dinastije Sja", "姒太康"],
    desc: "Chinese king of Xia Dynasty",
    born: null,
    died: -2201,
    offices: [
      { office: "Wang", state: null, from: -1959, to: -1956 }
    ]
  },
  {
    uid: "Q1195050",
    name: "Zhong Kang",
    cjkName: "中康",
    cjkNames: ["中康", "仲康", "仲盧"],
    aliases: ["Zhong Kang", "Zhong Kāng", "Zhòng Kang", "Zhòng Kāng", "仲康", "Hsia Chung-k'ang", "Hsia Chung-k’ang", "Xia Zhongkang", "Kralj Džung Kang iz dinastije Sja", "Zhong Kang od Xie", "Vua Trọng Khang nhà Hạ", "仲盧"],
    desc: "fourth king of Xia Dynasty, Si Qi's son, Tai Kang's younger brother",
    born: -2201,
    died: -2201,
    offices: [
      { office: "Wang", state: null, from: -1953, to: -1947 }
    ]
  },
  {
    uid: "Q1195067",
    name: "Xiang of Xia",
    cjkName: "相",
    cjkNames: ["相", "帝相", "相安"],
    aliases: ["Xian (Xia-König)", "Xiang (Xia-König)", "Xia Xiang", "Xiang An", "Hsia Hsiang", "Kralj Sjang iz dinastije Sja", "Kralj Xiang od Xia", "Kung Xiang", "Hạ Tướng", "Vua Tướng nhà Hạ", "相安"],
    desc: "Xia Dynasty king",
    born: null,
    died: null,
    offices: [
      { office: "Wang", state: null, from: -1944, to: -1917 }
    ]
  },
  {
    uid: "Q780446",
    name: "Jiong of Xia",
    cjkName: "扃",
    cjkNames: ["扃", "帝扃"],
    aliases: ["Xia Jiong"],
    desc: "12th Chinese king of Xia Dynasty",
    born: null,
    died: -2001,
    offices: [
      { office: "King", state: null, from: -1922, to: -1901 }
    ]
  },
  {
    uid: "Q1151674",
    name: "Jin of Xia",
    cjkName: "廑",
    cjkNames: ["廑", "帝廑", "胤甲"],
    aliases: ["Hsia Chin", "Jin", "Xia Jin", "Yin Jia", "Jin (Xia-König)", "胤甲", "Di Jin", "Jin of Xia", "Kralj Đin iz dinastije Sja", "Vua Cần nhà Hạ"],
    desc: "13th Chinese king of Xia Dynasty",
    born: null,
    died: -1901,
    offices: [
      { office: "King", state: null, from: -1901, to: -1880 }
    ]
  },
  {
    uid: "Q1193337",
    name: "Kong Jia",
    cjkName: "孔甲",
    cjkNames: ["孔甲", "帝孔甲"],
    aliases: ["Kong Jia", "Kong Jiǎ", "Kǒng Jia", "Hsia K'ung-chia", "Hsia K’ung-chia", "Kralj Kung Đija iz dinastije Sja", "Vua Khổng Giáp nhà Hạ"],
    desc: "14th Chinese king of Xia Dynasty",
    born: null,
    died: -1901,
    offices: [
      { office: "King", state: null, from: -1880, to: -1849 }
    ]
  },
  {
    uid: "Q1202982",
    name: "Gao of Xia",
    cjkName: "皋",
    cjkNames: ["皋", "帝皋", "姒孔皋"],
    aliases: ["Hsia Kao", "Xia Gao", "Si Konggao", "Gao (Xia-König)", "Di Gao", "Kralj Gao iz dinastije Sja", "Vua Cao nhà Hạ", "姒孔皋"],
    desc: "15th Chinese king of Xia Dynasty",
    born: null,
    died: -1901,
    offices: [
      { office: "King", state: null, from: -1849, to: -1838 }
    ]
  },
  {
    uid: "Q197821",
    name: "Zhong Ren",
    cjkName: "仲壬",
    cjkNames: ["仲壬"],
    aliases: [],
    desc: "king of Shang dynasty",
    born: -1801,
    died: -1731,
    offices: [
    ]
  },
  {
    uid: "Q536732",
    name: "Bu Bing",
    cjkName: "外丙",
    cjkNames: ["外丙", "卜丙"],
    aliases: ["Wai Bing", "卜丙", "Kralj Bu Bing od Shanga u Kini", "Kralj Vai Bing iz dinastije Šang"],
    desc: "2nd king of the Shang dynasty in Chinese history",
    born: -1801,
    died: -1735,
    offices: [
      { office: "King", state: null, from: -1737, to: -1735 }
    ]
  },
  {
    uid: "Q665910",
    name: "Yong Ji",
    cjkName: "雍己",
    cjkNames: ["雍己"],
    aliases: [],
    desc: "Shang dynasty king",
    born: -1701,
    died: -1701,
    offices: [
    ]
  },
  {
    uid: "Q981363",
    name: "Yi Yin",
    cjkName: "伊尹",
    cjkNames: ["伊尹", "阿衡"],
    aliases: ["Yi Yin", "A Heng", "Yi Zhi", "阿衡"],
    desc: "Chinese chancellor",
    born: -1649,
    died: -1550,
    offices: [
    ]
  },
  {
    uid: "Q471820",
    name: "Tang",
    cjkName: "商汤",
    cjkNames: ["商汤", "商湯", "商太祖", "商武王", "商汤王", "啺", "大乙汤", "天乙", "子履", "成唐", "成汤", "成湯", "武汤", "殷汤", "汤", "汤武王", "汤王", "高祖乙", "太乙", "武湯"],
    aliases: ["Ch'eng T'ang", "Cheng Tang", "Chengtang", "King Ch'eng T'ang", "King T'ang", "King T'ang of Shang", "King T'ang of Yin", "King Tang", "King Tang of Shang", "King Tang of Yin", "King Tching Thang", "King Thang", "King Thang of Shang", "King Thang of Yin", "Martial King of Shang", "Martial King of Yin", "Shang T'ai-tsu", "Shang T'ang", "Shang Tai-tsu", "Shang Taizu"],
    desc: "Legendary first king of the Shang dynasty in ancient China",
    born: -1676,
    died: -1647,
    offices: [
      { office: "King", state: null, from: -1600, to: -1588 }
    ]
  },
  {
    uid: "Q1151706",
    name: "Fa of Xia",
    cjkName: "發",
    cjkNames: ["發", "发", "帝發"],
    aliases: ["Di Fa", "Xia Fa", "Fā", "Fa (Xia-König)", "発惠", "發", "Fa", "Fa Hui", "Hou Jing", "Kralj Fa iz dinastije Sja", "Vua Phát nhà Hạ", "帝發"],
    desc: "16th Chinese king of Xia Dynasty",
    born: null,
    died: null,
    offices: [
      { office: "Wang", state: null, from: -1597, to: -1591 }
    ]
  },
  {
    uid: "Q465081",
    name: "Jie of Xia",
    cjkName: "桀",
    cjkNames: ["桀", "夏帝履癸", "夏桀", "履癸"],
    aliases: ["Lü Gui", "Xia Jie Gui", "Xia Jie", "von Xia", "Jie", "桀", "履癸", "桀王", "肉山脯林", "걸왕", "하 걸왕", "Chieh", "Jie Gui", "Kralj Jie od Xie u Kini", "Kralj Đije iz dinastije Sja", "Kiệt", "Vua Kiệt nhà Hạ", "夏桀"],
    desc: "17th and last Xia Dynasty king",
    born: -1729,
    died: null,
    offices: [
      { office: "Wang", state: null, from: -1590, to: -1560 }
    ]
  },
  {
    uid: "Q878414",
    name: "He Dan Jia",
    cjkName: "河亶甲",
    cjkNames: ["河亶甲", "戔甲"],
    aliases: ["Zi Zheng", "ههٔ دان جیا", "Jian Jia", "Kralj H' Dan Đija iz dinastije Šang", "戔甲"],
    desc: "Shang Dynasty King of China",
    born: -1601,
    died: -1536,
    offices: [
      { office: "King", state: null, from: -1534, to: -1525 }
    ]
  },
  {
    uid: "Q878422",
    name: "Yang Jia",
    cjkName: "阳甲",
    cjkNames: ["阳甲", "陽甲"],
    aliases: ["Xiang Jia", "象甲", "Kralj Jang Đija iz dinastije Šang"],
    desc: "Shang Dynasty king",
    born: -1501,
    died: -1403,
    offices: [
      { office: "King", state: null, from: -1524, to: -1513 }
    ]
  },
  {
    uid: "Q887633",
    name: "Wo Jia",
    cjkName: "沃甲",
    cjkNames: ["沃甲", "羌甲"],
    aliases: ["Wo Jia", "Qiang Jia", "Kralj Vo Đija iz dinastije Šang", "羌甲"],
    desc: "king of Shang dynasty",
    born: -1601,
    died: -1467,
    offices: [
      { office: "King", state: null, from: -1512, to: -1503 }
    ]
  },
  {
    uid: "Q878459",
    name: "Xiao Jia",
    cjkName: "小甲",
    cjkNames: ["小甲", "子高"],
    aliases: ["Kralj Sjao Đija iz dinastije Šang", "子高"],
    desc: "king of Shang dynasty",
    born: null,
    died: -1501,
    offices: [
      { office: "King", state: null, from: -1511, to: -1501 }
    ]
  },
  {
    uid: "Q888231",
    name: "Da Ding of Shang",
    cjkName: "太丁",
    cjkNames: ["太丁", "大丁"],
    aliases: ["Da Ding", "Tai Ding", "Dà Dīng", "Tài Dīng", "Shang Tai Ding", "Kralj Tai Ding iz dinastije Šang", "大丁"],
    desc: "king of Shang dynasty",
    born: -1901,
    died: -1742,
    offices: [
      { office: "King", state: null, from: -1502, to: -1493 }
    ]
  },
  {
    uid: "Q888017",
    name: "Wo Ding",
    cjkName: "沃丁",
    cjkNames: ["沃丁", "羌丁"],
    aliases: ["Wo Ding", "Wò Dīng", "Kralj Vo Ding iz dinastije Šang", "羌丁"],
    desc: "traditionally believed to be a king of the Shang Dynasty",
    born: -1801,
    died: -1593,
    offices: [
      { office: "King", state: null, from: -1502, to: -1493 }
    ]
  },
  {
    uid: "Q887641",
    name: "Xiao Xin",
    cjkName: "小辛",
    cjkNames: ["小辛"],
    aliases: ["Kralj Sjao Sjin iz dinastije Šang", "Xiao Xin"],
    desc: "king of Shang dynasty",
    born: -1501,
    died: -1354,
    offices: [
    ]
  },
  {
    uid: "Q197807",
    name: "Zhong Ding",
    cjkName: "中丁",
    cjkNames: ["中丁", "仲丁"],
    aliases: [],
    desc: "King of Shang dynasty in Chinese history",
    born: -1701,
    died: -1601,
    offices: [
      { office: "King", state: null, from: -1492, to: -1480 }
    ]
  },
  {
    uid: "Q888264",
    name: "Wai Ren",
    cjkName: "外壬",
    cjkNames: ["外壬", "卜壬"],
    aliases: ["Wai Ren", "Bu Ren", "Kralj Vai Žen iz dinastije Šang", "卜壬"],
    desc: "king of Shang dynasty",
    born: -1601,
    died: -1535,
    offices: [
      { office: "King", state: null, from: -1479, to: -1472 }
    ]
  },
  {
    uid: "Q878463",
    name: "Xiao Yi of Shang",
    cjkName: "小乙",
    cjkNames: ["小乙"],
    aliases: ["Kralj Sjao Ji iz dinastije Šang", "Xiao Yi od Shanga"],
    desc: "King of Shang Dynasty",
    born: -1401,
    died: -1326,
    offices: [
      { office: "King", state: null, from: -1471, to: -1465 }
    ]
  },
  {
    uid: "Q878465",
    name: "Tai Jia",
    cjkName: "太甲",
    cjkNames: ["太甲", "商太宗", "子至"],
    aliases: ["Da Jia", "Tài Jiǎ", "ᡧᠠᠩ ᡤᡠᡵᡠᠨ ᡳ ᡨᠠᡳ ᡤᡳᠶᠠ ᠸᠠᠩ", "ᡨᠠᡳ ᡤᡳᠶᠠ ᠸᠠᠩ (ᡧᠠᠩ ᡤᡠᡵᡠᠨ)", "Kralj Tai Đija iz dinastije Šang", "商太宗", "子至"],
    desc: "King of China during the Shang dynasty",
    born: -1551,
    died: -1721,
    offices: [
      { office: "King", state: null, from: -1464, to: -1455 }
    ]
  },
  {
    uid: "Q878477",
    name: "Tai Geng",
    cjkName: "大庚",
    cjkNames: ["大庚", "太庚", "小庚"],
    aliases: ["Tai Geng", "Da Geng", "Kralj Tai Geng iz dinastije Šang", "太庚", "小庚"],
    desc: "Shang dynasty king",
    born: -1701,
    died: -1668,
    offices: [
      { office: "King", state: null, from: -1454, to: -1441 }
    ]
  },
  {
    uid: "Q878479",
    name: "Tai Wu",
    cjkName: "太戊",
    cjkNames: ["太戊", "大戊"],
    aliases: ["Zi Mi", "Zi Zhou", "Da Wu", "Tài Wù", "Kralj Tai Vu iz dinastije Šang", "大戊"],
    desc: "Shang dynasty King of China",
    born: -1701,
    died: -1563,
    offices: [
      { office: "King", state: null, from: -1440, to: -1402 }
    ]
  },
  {
    uid: "Q878432",
    name: "Lin Xin",
    cjkName: "廪辛",
    cjkNames: ["廪辛", "廩辛", "冯辛"],
    aliases: ["馮辛", "Kralj Lin Sjin iz dinastije Šang", "冯辛"],
    desc: "King of the Shang dynasty",
    born: -1301,
    died: -1221,
    offices: [
      { office: "King", state: null, from: -1401, to: -1392 },
      { office: "Lin Xin", state: "Shang", from: -1158, to: -1150 }
    ]
  },
  {
    uid: "Q878426",
    name: "Nan Geng",
    cjkName: "南庚",
    cjkNames: ["南庚"],
    aliases: ["Kralj Nan Geng iz dinastije Šang"],
    desc: "King of Shang dynasty China",
    born: -1501,
    died: -1410,
    offices: [
      { office: "King", state: null, from: -1391, to: -1379 }
    ]
  },
  {
    uid: "Q878469",
    name: "Geng Ding",
    cjkName: "庚丁",
    cjkNames: ["庚丁", "康丁"],
    aliases: ["Geng Ding", "Kralj Geng Ding iz dinastije Šang", "Khang Đinh", "康丁"],
    desc: "King of the Shang dynasty of China",
    born: -1201,
    died: -1200,
    offices: [
      { office: "King", state: null, from: -1378, to: -1366 },
      { office: "Geng Ding (Kang Ding)", state: "Shang", from: -1149, to: -1133 }
    ]
  },
  {
    uid: "Q878455",
    name: "Zu Ding",
    cjkName: "祖丁",
    cjkNames: ["祖丁", "且丁"],
    aliases: ["Zi Xin", "Zu Ding", "且丁", "Kralj Cu Ding iz dinastije Šang"],
    desc: "king of Shang dynasty",
    born: -1501,
    died: -1435,
    offices: [
      { office: "King", state: null, from: -1365, to: -1351 }
    ]
  },
  {
    uid: "Q878449",
    name: "Zu Xin",
    cjkName: "祖辛",
    cjkNames: ["祖辛", "且辛"],
    aliases: ["Zu Xin", "زو که سو", "Kralj Cu Sjin iz dinastije Šang", "且辛"],
    desc: "king of Shang dynasty",
    born: -1601,
    died: -1492,
    offices: [
      { office: "King", state: null, from: -1350, to: -1342 }
    ]
  },
  {
    uid: "Q878444",
    name: "Zu Jia",
    cjkName: "祖甲",
    cjkNames: ["祖甲", "且甲", "商世宗", "子載", "帝甲"],
    aliases: ["Di Jia", "Zi Zai", "Zu Jia", "Kralj Cu Đija iz dinastije Šang", "且甲", "商世宗", "子載", "帝甲"],
    desc: "Shang dynasty king",
    born: -1301,
    died: -1227,
    offices: [
      { office: "King", state: null, from: -1341, to: -1325 },
      { office: "Zu Jia", state: "Shang", from: -1178, to: -1159 }
    ]
  },
  {
    uid: "Q878487",
    name: "Zu Yi",
    cjkName: "祖乙",
    cjkNames: ["祖乙", "且乙"],
    aliases: ["Qie Yi", "Zi Teng", "Zu Yi", "且乙", "Kralj Cu Ji iz dinastije Šang"],
    desc: "king of Shang dynasty",
    born: -1601,
    died: -1508,
    offices: [
      { office: "King", state: null, from: -1324, to: -1313 }
    ]
  },
  {
    uid: "Q291267",
    name: "King Zu Geng",
    cjkName: "祖庚",
    cjkNames: ["祖庚"],
    aliases: [],
    desc: "Shiang dynasty king",
    born: -1301,
    died: -1185,
    offices: [
      { office: "King", state: null, from: -1312, to: -1306 },
      { office: "Zu Geng", state: "Shang", from: -1189, to: -1179 }
    ]
  },
  {
    uid: "Q736654",
    name: "Pan Geng",
    cjkName: "盘庚",
    cjkNames: ["盘庚", "盤庚", "商世祖", "商世祖盤庚", "帝盤庚"],
    aliases: ["Ban Geng", "般庚", "商世祖盤庚", "帝盤庚", "Kralj Pan Geng iz dinastije Šang", "Pangeng", "Pán Gēng", "商世祖", "盤庚"],
    desc: "king of Shang dynasty",
    born: -1501,
    died: -1375,
    offices: [
      { office: "King", state: null, from: -1305, to: -1294 }
    ]
  },
  {
    uid: "Q369159",
    name: "Wu Ding",
    cjkName: "武丁",
    cjkNames: ["武丁"],
    aliases: ["Gaozong", "Zi Zhao"],
    desc: "King of Shang dynasty, ancient China",
    born: -1301,
    died: -1193,
    offices: [
      { office: "King", state: null, from: -1260, to: -1200 },
      { office: "Wu Ding", state: "Shang", from: -1251, to: -1193 }
    ]
  },
  {
    uid: "Q496787",
    name: "Jizi",
    cjkName: "箕子",
    cjkNames: ["箕子", "胥余"],
    aliases: ["Gija", "Kija", "Qizi", "Jizi", "胥余", "象牙の箸", "자서여", "Tư Dư"],
    desc: "semi-legendary Chinese sage",
    born: -1201,
    died: -1101,
    offices: [
    ]
  },
  {
    uid: "Q1055128",
    name: "King Ji of Zhou",
    cjkName: null,
    cjkNames: [],
    aliases: [],
    desc: "also known as Ji Li",
    born: null,
    died: null,
    offices: [
      { office: "King", state: null, from: -1151, to: -1101 }
    ]
  },
  {
    uid: "Q878473",
    name: "Wu Yi of Shang",
    cjkName: "武乙",
    cjkNames: ["武乙"],
    aliases: ["Wu Yi", "Kralj Vu Ji iz dinastije Šang"],
    desc: "Shang dynasty king, died c. 1112 BC",
    born: -1201,
    died: -1196,
    offices: [
      { office: "King", state: null, from: -1147, to: -1114 },
      { office: "Wu Yi", state: "Shang", from: -1132, to: -1118 }
    ]
  },
  {
    uid: "Q878441",
    name: "Wen Ding",
    cjkName: "文丁",
    cjkNames: ["文丁", "文武丁"],
    aliases: ["تای دینگ", "Tai Ding", "文丁", "Văn Đinh", "文武丁"],
    desc: "Shang king of China",
    born: -1201,
    died: -1103,
    offices: [
      { office: "Wen Ding (Wen Wu Ding)", state: "Shang", from: -1117, to: -1107 }
    ]
  },
  {
    uid: "Q735420",
    name: "Di Yi",
    cjkName: "帝乙",
    cjkNames: ["帝乙", "商德王", "子羨"],
    aliases: ["Shang De Wang", "Shang Dewang", "Zi Xian", "Zixian", "Emperador Yi", "Kralj Di Ji iz dinastije Šang", "Tử Tiện", "商德王", "子羨"],
    desc: "30th king of Shang dynasty (r. ca. 1101 BCE-1076 BCE)",
    born: -1201,
    died: -1077,
    offices: [
      { office: "King", state: null, from: -1105, to: -1088 },
      { office: "Di Yi", state: "Shang", from: -1106, to: -1088 }
    ]
  },
  {
    uid: "Q468747",
    name: "Dan of Zhou",
    cjkName: "周公旦",
    cjkNames: ["周公旦", "叔旦", "周公", "周文公", "周旦", "姬旦", "文憲王", "褒德王", "魯周公"],
    aliases: ["Baode King of Zhou", "Baode King of the Zhou", "Chi Tan", "Chou Kung", "Chou Kung Tan", "Chou Pao-te Wang", "Chou Tan", "Chou Wen-kung", "Chou-kung", "Civilized Duke of Chou", "Civilized Duke of Zhou", "Civilized Duke of the Chou", "Civilized Duke of the Zhou", "Dan of Zhou", "Duke Wen of Chou", "Duke Wen of Zhou", "Duke Wen of the Zhou", "Duke of Chou", "Gong Tan", "Ji Dan"],
    desc: "Legendary regional lord, regent, and culture hero of the early Zhou dynasty",
    born: -1101,
    died: -1033,
    offices: [
    ]
  },
  {
    uid: "Q28106",
    name: "Yuxiong",
    cjkName: "鬻熊",
    cjkNames: ["鬻熊", "楚鬻熊"],
    aliases: ["Sở Hùng Tảo", "楚鬻熊"],
    desc: "ruler of an ancient Chinese state",
    born: null,
    died: null,
    offices: [
      { office: "Proto-Ruler of Chu", state: "Chu", from: -1101, to: -1051 }
    ]
  },
  {
    uid: "Q698909",
    name: "King Wen of Zhou",
    cjkName: null,
    cjkNames: [],
    aliases: ["Chi Ch'ang", "Chi Chang", "Chou Wen-wang", "Hsi Po", "Hsi Po Hou", "Hsi Po-hou", "Hsi-po", "Hsi-po Hou", "Hsi-po-hou", "Ji Chang", "King Wen of Chou", "Ouene-ouang", "Ven-vang", "Vene-vang", "Wen", "Wen King of Chou", "Wen King of Zhou", "Wen Wang", "Wen-wang", "Wenwang"],
    desc: "King of Zhou",
    born: -1113,
    died: -1051,
    offices: [
      { office: "King", state: null, from: -1100, to: -1051 }
    ]
  },
  {
    uid: "Q8044715",
    name: "Xiong Li",
    cjkName: "熊麗",
    cjkNames: ["熊麗", "楚熊麗"],
    aliases: ["Hùng Lệ", "楚熊麗"],
    desc: "ruler of the state of Chu",
    born: null,
    died: null,
    offices: [
      { office: "Proto-Ruler of Chu", state: "Chu", from: -1091, to: -1041 }
    ]
  },
  {
    uid: "Q470072",
    name: "King Zhou of Shang",
    cjkName: "纣王",
    cjkNames: ["纣王", "紂王", "商帝辛", "受辛", "商紂", "商紂王", "商纣王", "子受辛", "帝纣", "帝辛", "殷纣王", "紂", "纣", "商辛王", "子受", "子受德", "殷紂王"],
    aliases: ["Di Xin", "Dixin", "King Dixin of Shang", "King Xin of Shang", "King Yin Zhou", "Shang Xin Wang", "Shang Zhou", "Yi Shou", "Yin Zhou Wang", "Zhou Xin", "Zi Shou", "الملك تشو من شانغ", "دي شين", "شو ملك شانغ", "Emperador Xin de Shang", "Rei Zhou", "Ti Sin", "Shang Zhou Wang", "Rey Zhou", "Chou Wang"],
    desc: "last king of Chinese Shang dynasty (r. 1075 BBCE-1046 BCE)",
    born: -1106,
    died: -1047,
    offices: [
      { office: "King", state: "Shang", from: -1087, to: -1046 }
    ]
  },
  {
    uid: "Q28045",
    name: "Xiong Kuang",
    cjkName: "熊狂",
    cjkNames: ["熊狂", "楚熊狂"],
    aliases: ["楚熊狂"],
    desc: "ruler of the state of Chu during the early Zhou Dynasty",
    born: null,
    died: null,
    offices: [
      { office: "Proto-Ruler of Chu", state: "Chu", from: -1081, to: -1031 }
    ]
  },
  {
    uid: "Q855012",
    name: "Weizi Qi",
    cjkName: "微子",
    cjkNames: ["微子", "微子啓", "子啟", "宋微子", "宋微子啟", "微子启", "微子开", "仁靖公", "微子啟", "微子開"],
    aliases: ["Song Weizi", "Weizi", "Weizi Qi of Song", "Weizi of Song", "Zi Qi", "微子開", "미자계", "Tống Vi tử", "Tử Khải", "Vi tử", "Vi tử Khải", "子啟", "宋微子", "宋微子啟", "微子启", "微子开", "仁靖公", "微子啟"],
    desc: "older brother of Zi Shou (King Zhou of Shang), first ruler of the client state Song of Zhou dynasty",
    born: -1051,
    died: null,
    offices: [
    ]
  },
  {
    uid: "Q28049",
    name: "Xiong Yi",
    cjkName: "熊繹",
    cjkNames: ["熊繹", "熊绎", "楚熊繹", "楚熊绎", "酓绎", "酓繹"],
    aliases: ["Chu Xiong yi", "Yan Yi", "酓繹", "楚熊繹", "楚熊绎", "酓绎"],
    desc: "viscount and founder of the State of Chu (est. 704 BCE) during early Zhou Dynasty",
    born: null,
    died: -1007,
    offices: [
      { office: "Viscount of Chu", state: "Chu", from: -1051, to: -1001 }
    ]
  },
  {
    uid: "Q1061289",
    name: "King Wu of Zhou",
    cjkName: "周武王",
    cjkNames: ["周武王", "周虎王", "姬发", "姬發", "武王"],
    aliases: ["Ji Fa", "Zhou Wu Wang", "Rei Wu de Chou", "Wu Wang", "Roi Wu", "Roi Wu de Zhou", "Roi Wu des Zhou", "Zhou Wuwang", "姫発", "주 무왕", "주무왕", "Valdovas U", "ᡠ ᠸᠠᠩ", "Kong Wu av Zhou", "Kralj Vu iz dinastije Džou", "Wu", "kralj Vu od Džoujev", "พระเจ้าโจวอู่หวัง", "โจวอู่หวัง", "Chu Võ vương"],
    desc: "founder of China's Zhou dynasty",
    born: -1151,
    died: -1044,
    offices: [
      { office: "Monarch", state: null, from: -1048, to: -1038 },
      { office: "King", state: "Zhou", from: -1047, to: -1044 }
    ]
  },
  {
    uid: "Q701488",
    name: "Jiang Ziya",
    cjkName: "太公望",
    cjkNames: ["太公望", "姜尚", "齊太公", "吕尚", "吕望", "吕牙", "太公", "姜太公", "姜子牙", "齐太公", "师尚父", "吕太公", "呂尚", "呂望", "呂涓", "呂牙", "師尚父", "昭烈武成王", "武成王"],
    aliases: ["Duke Tai of Qi", "Jiang Shang", "Lü Shang", "Lü Wang", "Qi Taigong", "Taigong Wang", "Jiang Taigong", "太公", "太公望", "姜子牙", "姜尚", "강여상", "강자아", "강태공", "태공망", "태공망 여상", "ᡨᠠᡳ ᡤᡠᠩ ᠸᠠᠩ", "Тай-гун", "Цзян Шан", "เจียงจื่อหยา"],
    desc: "military strategist of King Wen of Zhou and King Wu of Zhou",
    born: -1129,
    died: -1016,
    offices: [
      { office: "Q1934938", state: null, from: -1047, to: -1037 }
    ]
  },
  {
    uid: "Q630150",
    name: "Boqin",
    cjkName: "伯禽",
    cjkNames: ["伯禽", "魯公伯禽", "姬伯禽", "鲁公", "鲁公伯禽", "鲁太公"],
    aliases: ["Ji Boqin", "姫伯禽", "Bá Cầm", "姬伯禽", "魯公伯禽", "鲁公", "鲁公伯禽", "鲁太公"],
    desc: "Duke of Lu",
    born: -1069,
    died: -998,
    offices: [
      { office: "Duke of Lu", state: "Lu", from: -1043, to: -998 }
    ]
  },
  {
    uid: "Q388766",
    name: "King Cheng of Zhou",
    cjkName: "周成王",
    cjkNames: ["周成王"],
    aliases: ["ᠵᡝᠣ ᡤᡠᡵᡠᠨ ᡳ ᠴᡝᠩ ᠸᠠᠩ", "Zhou Chengwang"],
    desc: "11th century BC king of the Chinese Zhou Dynasty",
    born: -1101,
    died: -1022,
    offices: [
      { office: "King", state: "Zhou", from: -1043, to: -1022 }
    ]
  },
  {
    uid: "Q1052091",
    name: "Yu of Tang",
    cjkName: "唐叔虞",
    cjkNames: ["唐叔虞", "叔虞", "唐叔", "姬虞", "晉唐叔虞", "桐叶封弟", "桐葉封弟"],
    aliases: ["Royal Uncle of Tang", "Shu Yu of Tang", "Táng-shū Yú", "Uncle of Tang", "Yu, Royal Uncle of Tang", "당숙우", "Танский Шу-юй", "Ju, Tangov kraljevi stric", "Shu Yu", "Cơ Ngu", "叔虞", "唐叔", "姬虞", "晉唐叔虞", "桐叶封弟", "桐葉封弟"],
    desc: "founder of the State of Tang during the early Zhou Dynasty",
    born: null,
    died: null,
    offices: [
      { office: "Marquis of Jin", state: "Jin", from: -1043, to: -1033 }
    ]
  },
  {
    uid: "Q929178",
    name: "King Kang of Zhou",
    cjkName: "周康王",
    cjkNames: ["周康王"],
    aliases: [],
    desc: "King of the Chinese Zhou Dynasty",
    born: -1051,
    died: -997,
    offices: [
      { office: "King", state: "Zhou", from: -1021, to: -997 }
    ]
  },
  {
    uid: "Q646291",
    name: "Lu Kaogong",
    cjkName: "魯考公",
    cjkNames: ["魯考公", "鲁考公", "姬酋"],
    aliases: ["Duke Kao of Lu", "姬酋"],
    desc: "ruler of Lu",
    born: null,
    died: null,
    offices: [
      { office: "Duke of Lu", state: "Lu", from: -999, to: -996 }
    ]
  },
  {
    uid: "Q1275781",
    name: "King Zhao of Zhou",
    cjkName: "周昭王",
    cjkNames: ["周昭王", "姬瑕"],
    aliases: ["Zhou Zhaowang", "Čao", "주 소왕", "Чжоу Чжао-ван", "Kralj Chao od Choua", "Kralj Džao iz dinastije Džou", "Zhou zhao wang", "Cơ Hà", "姬瑕"],
    desc: "King of the Chinese Zhou Dynasty",
    born: -1028,
    died: -958,
    offices: [
      { office: "King", state: "Zhou", from: -996, to: -978 }
    ]
  },
  {
    uid: "Q646282",
    name: "Lu Yanggong",
    cjkName: "魯煬公",
    cjkNames: ["魯煬公", "鲁炀公", "姬熙", "鲁殇公"],
    aliases: ["姬熙", "鲁殇公"],
    desc: "ruler of Lu",
    born: null,
    died: null,
    offices: [
      { office: "Duke of Lu", state: "Lu", from: -995, to: -990 }
    ]
  },
  {
    uid: "Q646298",
    name: "Lu Yougong",
    cjkName: "魯幽公",
    cjkNames: ["魯幽公", "鲁幽公", "姬宰"],
    aliases: ["姬宰"],
    desc: "ruler of Lu",
    born: null,
    died: null,
    offices: [
      { office: "Duke of Lu", state: "Lu", from: -989, to: -976 }
    ]
  },
  {
    uid: "Q28046",
    name: "Xiong Ai",
    cjkName: "熊艾",
    cjkNames: ["熊艾", "楚熊艾"],
    aliases: ["楚熊艾"],
    desc: "viscount of the state of Chu during the early Zhou Dynasty",
    born: null,
    died: null,
    offices: [
      { office: "Viscount of Chu", state: "Chu", from: -978, to: -951 }
    ]
  },
  {
    uid: "Q1193439",
    name: "King Mu of Zhou",
    cjkName: "周穆王",
    cjkNames: ["周穆王", "姬滿", "穆王巡游"],
    aliases: ["Mu of Zhou", "Zhou Muwang", "Zhou Mu", "주 목왕", "주목왕", "Чжоу Му-ван", "Kralj Mu iz dinastije Džou", "Kralj Mu od Choua", "Zhou mo wang", "Cơ Mãn", "姬滿", "穆王巡游"],
    desc: "King of Zhou Dynasty",
    born: -951,
    died: -923,
    offices: [
      { office: "King", state: "Zhou", from: -977, to: -923 }
    ]
  },
  {
    uid: "Q28295",
    name: "Xiong Dan",
    cjkName: "熊䵣",
    cjkNames: ["熊䵣", "楚熊䵣", "楚熊黵"],
    aliases: ["Sở Hùng Hắc Đán", "楚熊䵣", "楚熊黵"],
    desc: "third viscount of the state of Chu",
    born: null,
    died: null,
    offices: [
      { office: "Viscount of Chu", state: "Chu", from: -942, to: -921 }
    ]
  },
  {
    uid: "Q1207688",
    name: "King Gong of Zhou",
    cjkName: "周共王",
    cjkNames: ["周共王", "姬繄扈"],
    aliases: ["Kung", "Ji Yihu", "恭王", "주 공왕", "Kralj Gung iz dinastije Džou", "Kralj Kung od Choua", "Zhou gong wang", "Cơ Ý Hỗ", "姬繄扈"],
    desc: "King of China",
    born: -1001,
    died: -910,
    offices: [
      { office: "King", state: "Zhou", from: -923, to: -901 }
    ]
  },
  {
    uid: "Q1208109",
    name: "King Yi of Zhou",
    cjkName: "周懿王",
    cjkNames: ["周懿王", "姬囏"],
    aliases: ["King Yì of Zhou", "주 의왕", "Kralj I od Choua", "Kralj Ji iz dinastije Džou", "Kralj Yi of Zhou", "Kralj Yi of Zhoua", "姬囏"],
    desc: "King of China",
    born: -1001,
    died: -885,
    offices: [
      { office: "King", state: "Zhou", from: -900, to: -893 }
    ]
  },
  {
    uid: "Q1209245",
    name: "King Xiao of Zhou",
    cjkName: "周孝王",
    cjkNames: ["周孝王", "姬辟方", "西周孝王"],
    aliases: ["Siao", "주 효왕", "Kralj Hsiao od Choua", "Kralj Sjao iz dinastije Džou", "Zhou xiao wang", "姬辟方", "西周孝王"],
    desc: "King of Zhou Dynasty China",
    born: -951,
    died: -876,
    offices: [
      { office: "King", state: "Zhou", from: -892, to: -887 }
    ]
  },
  {
    uid: "Q1208124",
    name: "King Yi of Zhou",
    cjkName: "周夷王",
    cjkNames: ["周夷王", "周懿王", "姬燮"],
    aliases: ["周夷王", "Kralj Ji iz dinastije Džou", "姬燮"],
    desc: "King of Zhou Dynasty",
    born: -851,
    died: -865,
    offices: [
      { office: "King", state: "Zhou", from: -886, to: -879 }
    ]
  },
  {
    uid: "Q55256",
    name: "King Li of Zhou",
    cjkName: "周厉王",
    cjkNames: ["周厉王", "周厲王"],
    aliases: ["Zhou Liwang"],
    desc: "tenth king of the Chinese Zhou Dynasty",
    born: -851,
    died: -842,
    offices: [
      { office: "King", state: "Zhou", from: -878, to: -842 }
    ]
  },
  {
    uid: "Q1051783",
    name: "Marquis Li of Jin",
    cjkName: "晋厉侯",
    cjkNames: ["晋厉侯", "晉厲侯", "姬福"],
    aliases: ["レイ侯", "진여후", "姬福"],
    desc: "Ruler of the State of Jin",
    born: null,
    died: -860,
    offices: [
      { office: "Marquis of Jin", state: "Jin", from: -870, to: -860 }
    ]
  },
  {
    uid: "Q709729",
    name: "Duke Xian of Qi",
    cjkName: "齊獻公",
    cjkNames: ["齊獻公", "齐献公"],
    aliases: ["Khương Sơn"],
    desc: "ruler of Qi",
    born: null,
    died: -852,
    offices: [
      { office: "Duke of Qi", state: "Qi", from: -860, to: -852 }
    ]
  },
  {
    uid: "Q1052075",
    name: "Marquis Jing of Jin",
    cjkName: "晋靖侯",
    cjkNames: ["晋靖侯", "晉靖侯", "姬宜臼"],
    aliases: ["姬宜臼"],
    desc: "Ruler of the State of Jin",
    born: null,
    died: -842,
    offices: [
      { office: "Marquis of Jin", state: "Jin", from: -859, to: -842 }
    ]
  },
  {
    uid: "Q7993822",
    name: "Xiong Yan",
    cjkName: "熊延",
    cjkNames: ["熊延", "楚熊延"],
    aliases: ["Hùng Chấp Tì", "Hùng Duyên", "楚熊延"],
    desc: "monarch of the state of Chu",
    born: null,
    died: -849,
    offices: [
      { office: "Viscount of Chu", state: "Chu", from: -859, to: -849 }
    ]
  },
  {
    uid: "Q553776",
    name: "Marquis of Qin",
    cjkName: "秦侯",
    cjkNames: ["秦侯"],
    aliases: [],
    desc: "ruler of Qin",
    born: null,
    died: -849,
    offices: [
      { office: "Marquis of Qin", state: "Qin", from: -858, to: -849 }
    ]
  },
  {
    uid: "Q709696",
    name: "Duke Wu of Qi",
    cjkName: "齊武公",
    cjkNames: ["齊武公", "齐武公", "姜壽"],
    aliases: ["제무공", "Khương Thọ", "姜壽"],
    desc: "ruler of Qi",
    born: null,
    died: -826,
    offices: [
      { office: "Duke of Qi", state: "Qi", from: -851, to: -826 }
    ]
  },
  {
    uid: "Q556234",
    name: "Fez",
    cjkName: "非子",
    cjkNames: ["非子", "秦非子"],
    aliases: ["Qin Ying", "秦非子"],
    desc: "founder of Qin state",
    born: -851,
    died: -859,
    offices: [
    ]
  },
  {
    uid: "Q553791",
    name: "Gongbo",
    cjkName: "公伯",
    cjkNames: ["公伯", "秦公伯"],
    aliases: ["公白", "秦公伯"],
    desc: "ruler of Qin",
    born: null,
    died: -846,
    offices: [
      { office: "Gongbo of Qin", state: "Qin", from: -848, to: -846 }
    ]
  },
  {
    uid: "Q7993719",
    name: "Xiong Yong",
    cjkName: "熊勇",
    cjkNames: ["熊勇", "楚熊勇"],
    aliases: ["楚熊勇"],
    desc: "monarch of the state of Chu",
    born: null,
    died: 838,
    offices: [
      { office: "Viscount of Chu", state: "Chu", from: -848, to: -839 }
    ]
  },
  {
    uid: "Q564135",
    name: "Qin Zhong",
    cjkName: "秦仲",
    cjkNames: ["秦仲"],
    aliases: [],
    desc: "ruler of Qin",
    born: -851,
    died: -823,
    offices: [
      { office: "Marquis of Qin", state: "Qin", from: -845, to: -823 }
    ]
  },
  {
    uid: "Q1279943",
    name: "Gonghe Regency",
    cjkName: "共和",
    cjkNames: ["共和", "周召共和", "共和执政", "共和时期", "共和行政", "西周共和"],
    aliases: ["Gonghe", "Gung-h'", "共和执政", "共和时期", "共和行政", "周召共和", "西周共和"],
    desc: "regency",
    born: null,
    died: null,
    offices: [
      { office: "Gonghe Regency", state: "Zhou", from: -842, to: -829 }
    ]
  },
  {
    uid: "Q1136509",
    name: "Marquis Xi of Jin",
    cjkName: "晉釐侯",
    cjkNames: ["晉釐侯", "晋厘侯", "晉僖侯", "姬司徒", "晉厘侯"],
    aliases: ["진희후", "Cơ Tu Đô", "姬司徒", "晉僖侯", "晉厘侯"],
    desc: "Ruler of the State of Jin",
    born: null,
    died: -824,
    offices: [
      { office: "Marquis of Jin", state: "Jin", from: -841, to: -824 }
    ]
  },
  {
    uid: "Q7993756",
    name: "Xiong Yan",
    cjkName: "熊嚴",
    cjkNames: ["熊嚴", "熊严", "楚熊嚴"],
    aliases: ["Hùng Nghiêm", "楚熊嚴"],
    desc: "viscount of Chu",
    born: null,
    died: -821,
    offices: [
      { office: "Viscount of Chu", state: "Chu", from: -838, to: -829 }
    ]
  },
  {
    uid: "Q7993442",
    name: "Xiong Shuang",
    cjkName: "熊霜",
    cjkNames: ["熊霜", "楚熊霜"],
    aliases: ["Hùng Sương", "楚熊霜"],
    desc: "monarch of the state of Chu",
    born: null,
    died: -823,
    offices: [
      { office: "Viscount of Chu", state: "Chu", from: -828, to: -823 }
    ]
  },
  {
    uid: "Q55247",
    name: "Xuan",
    cjkName: "周宣王",
    cjkNames: ["周宣王"],
    aliases: ["Chou Hsuan Wang", "Chou Hsuan-wang", "Chou Hsüan Wang", "Chou Hsüan-wang", "Commanding King of the Chou", "Commanding King of the Zhou", "Hsuan King of Chou", "Hsuan King of the Chou", "Hsuan Wang", "Hsuan of Chou", "Hsuan of the Chou", "Hsuan-wang", "Hsüan King of Chou", "Hsüan King of the Chou", "Hsüan Wang", "Hsüan of Chou", "Hsüan of the Chou", "Hsüan-wang", "King Hsuan of Chou", "King Hsuan of the Chou"],
    desc: "eleventh king of the Chinese Zhou Dynasty",
    born: -851,
    died: -782,
    offices: [
      { office: "King", state: "Zhou", from: -828, to: -783 }
    ]
  },
  {
    uid: "Q646370",
    name: "Duke Wu of Lu",
    cjkName: "魯武公",
    cjkNames: ["魯武公", "鲁武公", "姬敖"],
    aliases: ["노무공", "姬敖"],
    desc: "ruler of Lu",
    born: null,
    died: -817,
    offices: [
      { office: "Duke of Lu", state: "Lu", from: -826, to: -817 }
    ]
  },
  {
    uid: "Q709452",
    name: "Duke Li of Qi",
    cjkName: "齊厲公",
    cjkNames: ["齊厲公", "齐厉公", "姜無忌"],
    aliases: ["제여공", "Khương Vô Kỵ", "姜無忌"],
    desc: "ruler of Qi",
    born: null,
    died: -817,
    offices: [
      { office: "Duke of Qi", state: "Qi", from: -825, to: -817 }
    ]
  },
  {
    uid: "Q1136503",
    name: "Marquis Xian of Jin",
    cjkName: "晉獻侯",
    cjkNames: ["晉獻侯", "晋献侯", "姬籍"],
    aliases: ["진헌후", "Cơ Tịch", "姬籍"],
    desc: "eighth ruler of the state of Jin",
    born: -851,
    died: -813,
    offices: [
      { office: "Marquis of Jin", state: "Jin", from: -823, to: -813 }
    ]
  },
  {
    uid: "Q564531",
    name: "Duke Zhuang of Qin",
    cjkName: "秦莊公",
    cjkNames: ["秦莊公", "秦庄公", "嬴也", "贏也"],
    aliases: ["Qín Zhuāng Gōng", "嬴也", "秦庄公", "贏也"],
    desc: "ruler of Qin",
    born: null,
    died: -779,
    offices: [
      { office: "Duke of Qin", state: "Qin", from: -822, to: -779 }
    ]
  },
  {
    uid: "Q7993428",
    name: "Xiong Xun",
    cjkName: "熊徇",
    cjkNames: ["熊徇", "楚熊徇"],
    aliases: ["Hùng Tuấn", "楚熊徇"],
    desc: "monarch of the state of Chu",
    born: null,
    died: -801,
    offices: [
      { office: "Viscount of Chu", state: "Chu", from: -822, to: -801 }
    ]
  },
  {
    uid: "Q709444",
    name: "Duke Wen of Qi",
    cjkName: "齊文公",
    cjkNames: ["齊文公", "齐文公", "姜赤"],
    aliases: ["제문공", "Khương Xích", "姜赤"],
    desc: "ruler of Qi",
    born: null,
    died: -805,
    offices: [
      { office: "Duke of Qi", state: "Qi", from: -816, to: -805 }
    ]
  },
  {
    uid: "Q632549",
    name: "Duke Yi of Lu",
    cjkName: "魯懿公",
    cjkNames: ["魯懿公", "鲁懿公", "姬戲"],
    aliases: ["노의공", "姬戲"],
    desc: "ruler of Lu",
    born: null,
    died: -808,
    offices: [
      { office: "Duke of Lu", state: "Lu", from: -816, to: -808 }
    ]
  },
  {
    uid: "Q1052101",
    name: "Marquis Mu of Jin",
    cjkName: "晉穆侯",
    cjkNames: ["晉穆侯", "晋穆侯", "姬費王"],
    aliases: ["Cơ Phế Vương", "姬費王"],
    desc: "ninth ruler of the state of Jin",
    born: -851,
    died: -777,
    offices: [
      { office: "Marquis of Jin", state: "Jin", from: -812, to: -786 }
    ]
  },
  {
    uid: "Q539758",
    name: "Duke Huan of Zheng",
    cjkName: "鄭桓公",
    cjkNames: ["鄭桓公", "郑桓公", "姬友"],
    aliases: ["Ji You", "Zheng Huan gong", "姫友", "姬友"],
    desc: "founding Duke of Zheng from 806 to 771 BC",
    born: -901,
    died: -772,
    offices: [
      { office: "Duke of Zheng", state: "Zheng", from: -807, to: -772 }
    ]
  },
  {
    uid: "Q709425",
    name: "Duke Cheng of Qi",
    cjkName: "齊成公",
    cjkNames: ["齊成公", "齐成公", "姜脫"],
    aliases: ["제성공", "姜脫"],
    desc: "ruler of Qi",
    born: -851,
    died: -796,
    offices: [
      { office: "Duke of Qi", state: "Qi", from: -804, to: -796 }
    ]
  },
  {
    uid: "Q807048",
    name: "Bao Shuya",
    cjkName: "鲍叔牙",
    cjkNames: ["鲍叔牙", "鮑叔牙", "鮑叔"],
    aliases: ["鮑叔牙", "鮑叔"],
    desc: "Chinese politician",
    born: -801,
    died: -645,
    offices: [
    ]
  },
  {
    uid: "Q7993703",
    name: "Xiong E",
    cjkName: "熊咢",
    cjkNames: ["熊咢", "楚熊咢", "楚熊鄂", "熊鄂"],
    aliases: ["Hùng Ngạc", "楚熊咢", "楚熊鄂", "熊鄂"],
    desc: "monarch of the state of Chu",
    born: null,
    died: -792,
    offices: [
      { office: "Viscount of Chu", state: "Chu", from: -800, to: -792 }
    ]
  },
  {
    uid: "Q855660",
    name: "Duke Zhuang I of Qi",
    cjkName: "齊莊公",
    cjkNames: ["齊莊公", "齐庄公", "齊前莊公", "姜購", "齐前庄公"],
    aliases: ["荘公購", "姜購", "齊前莊公", "齐前庄公"],
    desc: "ruler of Qi",
    born: null,
    died: -732,
    offices: [
      { office: "Duke of Qi", state: "Qi", from: -795, to: -732 }
    ]
  },
  {
    uid: "Q855662",
    name: "Ruo'ao",
    cjkName: "若敖",
    cjkNames: ["若敖", "楚若敖", "熊儀"],
    aliases: ["Xiong Yi", "熊儀", "Nhược Ngao", "楚若敖"],
    desc: "monarch of the state of Chu",
    born: null,
    died: -765,
    offices: [
      { office: "Viscount of Chu", state: "Chu", from: -791, to: -765 }
    ]
  },
  {
    uid: "Q1052078",
    name: "Shang Shu",
    cjkName: "殤叔",
    cjkNames: ["殤叔", "殇叔", "晉殤叔", "姬殤"],
    aliases: ["진 상숙", "姬殤", "晉殤叔"],
    desc: "tenth ruler of the state of Jin",
    born: null,
    died: -782,
    offices: [
      { office: "Marquis of Jin", state: "Jin", from: -785, to: -782 }
    ]
  },
  {
    uid: "Q1193397",
    name: "King You of Zhou",
    cjkName: "周幽王",
    cjkNames: ["周幽王", "周宮涅"],
    aliases: ["You", "You de Zhou", "Zhou You wang", "Ji Gongnie", "You dari zhou", "주 유왕", "Kung You av Zhou", "Kralj Jou iz dinastije Džou", "พระเจ้าโจวอิวหวัง", "โจวอิงหวัง", "โจวอิวหวัง", "Cơ Cung Tinh", "周宮涅"],
    desc: "King of Zhou Dynasty China",
    born: -796,
    died: -772,
    offices: [
      { office: "King", state: "Zhou", from: -782, to: -772 }
    ]
  },
  {
    uid: "Q1187802",
    name: "Marquis Wen of Jin",
    cjkName: "晉文侯",
    cjkNames: ["晉文侯", "晋文侯", "姬仇"],
    aliases: ["Ji Chou", "진문후", "Cơ Cừu", "姬仇"],
    desc: "Ruler of the state of Jin (805–746 BC)",
    born: -806,
    died: -747,
    offices: [
      { office: "Marquis of Jin", state: "Jin", from: -781, to: -747 }
    ]
  },
  {
    uid: "Q549872",
    name: "Duke Xiang of Qin",
    cjkName: "秦襄公",
    cjkNames: ["秦襄公"],
    aliases: [],
    desc: "ruler of Qin",
    born: null,
    died: -767,
    offices: [
      { office: "Duke of Qin", state: "Qin", from: -778, to: -767 }
    ]
  },
  {
    uid: "Q1193546",
    name: "King Ping of Zhou",
    cjkName: "周平王",
    cjkNames: ["周平王", "姬宜臼", "宜臼"],
    aliases: ["জি ইজিউ", "Ping", "Ping de Zhou", "Ping wang", "Zhou Ping wang", "주 평왕", "주평왕", "Kralj P'ing od Choua", "Kralj Ping iz dinastije Džou", "พระเจ้าโจวผิงหวัง", "โจวผิงหวัง", "姬宜臼", "宜臼"],
    desc: "First king of the Chinese Eastern Zhou dynasty (died 720 BC)",
    born: -782,
    died: -721,
    offices: [
      { office: "King", state: "Zhou", from: -771, to: -721 }
    ]
  },
  {
    uid: "Q1311353",
    name: "Duke Wu of Zheng",
    cjkName: "鄭武公",
    cjkNames: ["鄭武公", "郑武公", "姬掘突"],
    aliases: ["姬掘突"],
    desc: "ruler of State of Zheng during 806-744 BC",
    born: null,
    died: null,
    offices: [
      { office: "Duke of Zheng", state: "Zheng", from: -771, to: -745 }
    ]
  },
  {
    uid: "Q552740",
    name: "Duke Wen of Qin",
    cjkName: "秦文公",
    cjkNames: ["秦文公"],
    aliases: [],
    desc: "ruler of the Zhou Dynasty, Chinese state of Qin",
    born: -751,
    died: -717,
    offices: [
      { office: "Duke of Qin", state: "Qin", from: -766, to: -717 }
    ]
  },
  {
    uid: "Q39932",
    name: "Xiao'ao",
    cjkName: "霄敖",
    cjkNames: ["霄敖", "楚霄敖", "熊坎", "熊霄敖"],
    aliases: ["熊坎", "楚霄敖", "熊霄敖"],
    desc: "monarch of the state of Chu",
    born: -801,
    died: -759,
    offices: [
      { office: "Viscount of Chu", state: "Chu", from: -764, to: -759 }
    ]
  },
  {
    uid: "Q855018",
    name: "Fenmao",
    cjkName: "蚡冒",
    cjkNames: ["蚡冒", "鼢冒", "楚厲王", "楚蚡冒", "熊眴"],
    aliases: ["フン冒", "熊眴", "Phần Mạo", "楚厲王", "楚蚡冒", "鼢冒"],
    desc: "monarch of the state of Chu",
    born: null,
    died: -742,
    offices: [
      { office: "Viscount of Chu", state: "Chu", from: -758, to: -742 }
    ]
  },
  {
    uid: "Q1051793",
    name: "Marquis Zhao of Jin",
    cjkName: "晉昭侯",
    cjkNames: ["晉昭侯", "晋昭侯", "姬伯"],
    aliases: ["Цзиньский Чжао-хоу", "Cơ Bá", "姬伯"],
    desc: "Ruler of the state of Jin from 745 to 739 BC",
    born: null,
    died: -740,
    offices: [
      { office: "Marquis of Jin", state: "Jin", from: -746, to: -741 }
    ]
  },
  {
    uid: "Q558018",
    name: "Duke Zhuang of Zheng",
    cjkName: "鄭莊公",
    cjkNames: ["鄭莊公", "郑庄公", "姬寤生", "寤生"],
    aliases: ["정 엄공", "Zhuang", "姬寤生", "寤生", "郑庄公"],
    desc: "8th-century BC ruler of Zheng",
    born: -702,
    died: -701,
    offices: [
      { office: "Duke of Zheng", state: "Zheng", from: -744, to: -702 }
    ]
  },
  {
    uid: "Q796039",
    name: "King Wu of Chu",
    cjkName: "楚武王",
    cjkNames: ["楚武王", "楚熊通", "熊通"],
    aliases: ["Chu Wu Wang", "Chu Xiong Tong", "Xiong Tong", "Wang Wu von Chu", "熊徹", "熊通", "楚熊通"],
    desc: "King of Chu",
    born: -751,
    died: -691,
    offices: [
      { office: "King", state: "Chu", from: -741, to: -691 }
    ]
  },
  {
    uid: "Q1136808",
    name: "Marquis Xiao of Jin",
    cjkName: "晉孝侯",
    cjkNames: ["晉孝侯", "晋孝侯"],
    aliases: ["Marquès Xiao de Jin", "진효후"],
    desc: "ruler of the state of Jin",
    born: null,
    died: -725,
    offices: [
      { office: "Q209726", state: null, from: -740, to: -725 },
      { office: "Marquis of Jin", state: "Jin", from: -740, to: -725 }
    ]
  },
  {
    uid: "Q708168",
    name: "Duke Xi of Qi",
    cjkName: "齊僖公",
    cjkNames: ["齊僖公", "齐僖公", "姜祿甫", "齊釐公", "齐厘公"],
    aliases: ["제희공", "Tề Hi công", "Tề Ly công", "姜祿甫", "齊釐公", "齐厘公"],
    desc: "Duke of Qi from 730 to 698 BC",
    born: -751,
    died: -699,
    offices: [
      { office: "Duke of Qi", state: "Qi", from: -731, to: -699 }
    ]
  },
  {
    uid: "Q1052217",
    name: "Marquis E of Jin",
    cjkName: "晉鄂侯",
    cjkNames: ["晉鄂侯", "晋鄂侯", "姬卻", "鄂侯"],
    aliases: ["Cơ Khích", "姬卻", "鄂侯"],
    desc: "8th-century BC marquis of Jin",
    born: null,
    died: -719,
    offices: [
      { office: "Marquis of Jin", state: "Jin", from: -724, to: -719 }
    ]
  },
  {
    uid: "Q626901",
    name: "Duke Yin of Lu",
    cjkName: "鲁隐公",
    cjkNames: ["鲁隐公", "魯隱公", "姬息姑"],
    aliases: ["노은공", "Cơ Tức Cô", "魯隱公", "姬息姑"],
    desc: "Ruler of Chinese state of Lu from 722 to 712 BC",
    born: -751,
    died: null,
    offices: [
      { office: "Duke of Lu", state: "Lu", from: -723, to: -713 }
    ]
  },
  {
    uid: "Q1202938",
    name: "King Huan of Zhou",
    cjkName: "周桓王",
    cjkNames: ["周桓王", "太孙林", "姬林", "桓王", "王孙林"],
    aliases: ["Huan", "Huan wang", "Zhou Huan wang", "주 환왕", "희림", "Koning Huan van Zhou", "Zhou Huanwang", "Kralj Huan iz dinastije Džou", "Kralj Huan od Choua", "พระเจ้าโจวฮวนหวัง", "Cơ Lâm", "太孙林", "姬林", "桓王", "王孙林"],
    desc: "King of the Zhou dynasty from 719 to 697 BC",
    born: null,
    died: -698,
    offices: [
      { office: "King", state: "Zhou", from: -720, to: -698 }
    ]
  },
  {
    uid: "Q1052192",
    name: "Marquis Ai of Jin",
    cjkName: "晉哀侯",
    cjkNames: ["晉哀侯", "晋哀侯"],
    aliases: [],
    desc: "ruler of the state of Jin",
    born: -751,
    died: -710,
    offices: [
      { office: "Marquis of Jin", state: "Jin", from: -718, to: -710 }
    ]
  },
  {
    uid: "Q567033",
    name: "Duke Xian of Qin",
    cjkName: "秦憲公",
    cjkNames: ["秦憲公", "秦宪公", "秦寧公"],
    aliases: ["憲公", "秦宪公", "秦寧公"],
    desc: "ruler of Qin",
    born: -726,
    died: -705,
    offices: [
      { office: "Duke of Qin", state: "Qin", from: -716, to: -705 }
    ]
  },
  {
    uid: "Q1044443",
    name: "Duke Huan of Lu",
    cjkName: "鲁桓公",
    cjkNames: ["鲁桓公", "魯桓公", "姬允"],
    aliases: ["노환공", "Cơ Doãn", "姬允"],
    desc: "ruler of Lu",
    born: -751,
    died: -695,
    offices: [
      { office: "Duke of Lu", state: "Lu", from: -712, to: -695 }
    ]
  },
  {
    uid: "Q1052168",
    name: "Marquis Xiaozi of Jin",
    cjkName: "晉小子侯",
    cjkNames: ["晉小子侯", "晋小子侯", "姬小子"],
    aliases: ["Cơ Thiếu Tử", "姬小子"],
    desc: "ruler of the state of Jin",
    born: -751,
    died: -706,
    offices: [
      { office: "Marquis of Jin", state: "Jin", from: -709, to: -706 }
    ]
  },
  {
    uid: "Q848799",
    name: "Chuzi I",
    cjkName: "秦出子",
    cjkNames: ["秦出子", "秦出公"],
    aliases: ["出公"],
    desc: "ruler of Qin",
    born: -709,
    died: -699,
    offices: [
      { office: "Ruler of Qin", state: "Qin", from: -704, to: -699 }
    ]
  },
  {
    uid: "Q564140",
    name: "Duke Wu of Qin",
    cjkName: "秦武公",
    cjkNames: ["秦武公"],
    aliases: [],
    desc: "ruler of the Zhou Dynasty in Chinese state of Qin",
    born: -751,
    died: -679,
    offices: [
      { office: "Duke of Qin", state: "Qin", from: -698, to: -679 }
    ]
  },
  {
    uid: "Q708272",
    name: "Duke Xiang of Qi",
    cjkName: "齐襄公",
    cjkNames: ["齐襄公", "齊襄公", "姜諸兒", "诸儿"],
    aliases: ["제양공", "Khương Chư Nhi", "姜諸兒", "诸儿", "齊襄公"],
    desc: "ruler of Qi",
    born: -751,
    died: -687,
    offices: [
      { office: "Duke of Qi", state: "Qi", from: -698, to: -687 }
    ]
  },
  {
    uid: "Q1267966",
    name: "King Zhuang of Zhou",
    cjkName: "周莊王",
    cjkNames: ["周莊王", "周庄王", "姬佗"],
    aliases: ["King Chuang of Chou", "Zhou Zhuang wang", "Zhuang wang", "roi Zhuang", "Kralj Zhuang od Zhoua", "주 장왕", "Zhuanwang", "Kralj Chuang od Choua", "Kralj Džuang iz dinastije Džou", "Cơ Đà", "姬佗"],
    desc: "King of the Zhou dynasty from 696 to 682 BC",
    born: null,
    died: -683,
    offices: [
      { office: "King", state: "Zhou", from: -697, to: -683 }
    ]
  },
  {
    uid: "Q622873",
    name: "Duke Zhuang of Lu",
    cjkName: "魯莊公",
    cjkNames: ["魯莊公", "鲁庄公", "姬同"],
    aliases: ["vévoda Čuang z Lu", "노장공", "姬同", "鲁庄公"],
    desc: "ruler of Lu",
    born: -707,
    died: null,
    offices: [
      { office: "Duke of Lu", state: "Lu", from: -694, to: -663 }
    ]
  },
  {
    uid: "Q796034",
    name: "King Wen of Chu",
    cjkName: "楚文王",
    cjkNames: ["楚文王", "熊貲"],
    aliases: ["Chu Wen Wang", "Xiong Zi", "熊貲"],
    desc: "King of Chu from 689 to 677 BC",
    born: null,
    died: -678,
    offices: [
      { office: "King", state: "Chu", from: -690, to: -678 }
    ]
  },
  {
    uid: "Q709466",
    name: "Wuzhi",
    cjkName: "公孫無知",
    cjkNames: ["公孫無知", "公孙无知", "吕無知", "姜无知", "姜無知", "齊前廢公", "齊君無知", "齐前废公"],
    aliases: ["공손무지", "Công Tôn Vô Tri", "Khương Vô Tri", "吕無知", "姜无知", "姜無知", "齊前廢公", "齊君無知", "齐前废公"],
    desc: "ruler of Qi",
    born: -751,
    died: -686,
    offices: [
      { office: "Ruler of Qi", state: "Qi", from: -687, to: -687 }
    ]
  },
  {
    uid: "Q470108",
    name: "Duke Huan of Qi",
    cjkName: "齐桓公",
    cjkNames: ["齐桓公", "齊桓公", "公子小白", "吕小白", "姜小白", "桓公", "姜齊國君小白", "小白"],
    aliases: ["Xiaobai", "Xiǎobái", "Qi Huan Gong", "Qí Huán Gōng", "姜小白", "斉桓公", "제환공", "Хуань-гун I", "Gospodar Huan od Qija", "Čchi Chuan Kung", "公子小白", "吕小白", "桓公", "姜齊國君小白", "小白"],
    desc: "ruler of Qi state; head of the Five Hegemons during the Chinese Spring Autumn period",
    born: -801,
    died: -644,
    offices: [
      { office: "Duke of Qi", state: "Qi", from: -686, to: -644 }
    ]
  },
  {
    uid: "Q261333",
    name: "King Xi of Zhou",
    cjkName: "周僖王",
    cjkNames: ["周僖王", "姬胡齐"],
    aliases: ["Ji Huqi", "Jī Húqí", "Jī Húqí,", "Xi", "Rey Xi de Zhou", "Xi de Zhou", "Xi wang", "Zhou Xi wang", "roi Xi", "姬胡齊", "Xi van Zhou", "姬胡齐"],
    desc: "King of Zhou Dynasty China",
    born: null,
    died: -678,
    offices: [
      { office: "King", state: "Zhou", from: -682, to: -678 }
    ]
  },
  {
    uid: "Q1052199",
    name: "Duke Wu of Jin",
    cjkName: "晋武公",
    cjkNames: ["晋武公", "晉武公", "曲沃武公"],
    aliases: ["晋武公", "曲沃武公"],
    desc: "ruler of the states of Jin and Quwo",
    born: null,
    died: -678,
    offices: [
      { office: "Duke of Jin", state: "Jin", from: -679, to: -678 }
    ]
  },
  {
    uid: "Q552729",
    name: "Duke De of Qin",
    cjkName: "秦德公",
    cjkNames: ["秦德公"],
    aliases: [],
    desc: "ruler of Qin",
    born: -711,
    died: -677,
    offices: [
      { office: "Duke of Qin", state: "Qin", from: -678, to: -677 }
    ]
  },
  {
    uid: "Q557219",
    name: "Du'ao",
    cjkName: "堵敖",
    cjkNames: ["堵敖", "楚堵敖", "楚莊敖", "熊艱"],
    aliases: ["熊囏", "Đổ Ngao", "楚堵敖", "楚莊敖", "熊艱"],
    desc: "King of Chu",
    born: null,
    died: -673,
    offices: [
      { office: "King", state: "Chu", from: -677, to: -673 }
    ]
  },
  {
    uid: "Q1136357",
    name: "Duke Xian of Jin",
    cjkName: "晋献公",
    cjkNames: ["晋献公", "晉獻公", "姬詭諸"],
    aliases: ["晋献公", "Cơ Quỹ Chư", "姬詭諸", "晉獻公"],
    desc: "Ruler of the state of Jin from 676 to 651 BC",
    born: null,
    died: -652,
    offices: [
      { office: "Duke of Jin", state: "Jin", from: -677, to: -652 }
    ]
  },
  {
    uid: "Q1156951",
    name: "King Hui of Zhou",
    cjkName: "周惠王",
    cjkNames: ["周惠王", "姬閬"],
    aliases: ["Hui", "Zhou Hui wang", "주 혜왕", "Kralj Hui iz dinastije Džou", "Kralj Hui od Choua", "Cơ Lãng", "姬閬"],
    desc: "King of the Zhou dynasty from 676 to 652 BC",
    born: null,
    died: -653,
    offices: [
      { office: "King", state: "Zhou", from: -677, to: -653 }
    ]
  },
  {
    uid: "Q552733",
    name: "Duke Xuan of Qin",
    cjkName: "秦宣公",
    cjkNames: ["秦宣公"],
    aliases: [],
    desc: "ruler of the Zhou Dynasty, in China",
    born: -651,
    died: -665,
    offices: [
      { office: "Duke of Qin", state: "Qin", from: -676, to: -665 }
    ]
  },
  {
    uid: "Q795905",
    name: "King Cheng of Chu",
    cjkName: "楚成王",
    cjkNames: ["楚成王", "熊惲", "羋熊覠"],
    aliases: ["Chu Chang Wang", "Xiong Yun", "熊惲", "羋熊覠"],
    desc: "King of Chu",
    born: -651,
    died: -627,
    offices: [
      { office: "King", state: "Chu", from: -672, to: -627 }
    ]
  },
  {
    uid: "Q552744",
    name: "Duke Cheng of Qin",
    cjkName: "秦成公",
    cjkNames: ["秦成公"],
    aliases: [],
    desc: "ruler of the Zhou Dynasty, Chinese state of Qin",
    born: -651,
    died: -661,
    offices: [
      { office: "Duke of Qin", state: "Qin", from: -664, to: -661 }
    ]
  },
  {
    uid: "Q625182",
    name: "Ziban",
    cjkName: "子般",
    cjkNames: ["子般", "姬斑", "魯君子斑", "鲁君子斑"],
    aliases: ["公子班", "姬斑", "魯君子斑", "鲁君子斑"],
    desc: "ruler of Lu",
    born: null,
    died: null,
    offices: [
      { office: "Duke of Lu", state: "Lu", from: -663, to: -663 }
    ]
  },
  {
    uid: "Q625186",
    name: "Lu Min Gong",
    cjkName: "魯閔公",
    cjkNames: ["魯閔公", "鲁闵公", "姬啟", "魯湣公"],
    aliases: ["Ló͘ Bín-kong", "노민공", "Cơ Khải", "姬啟", "魯湣公"],
    desc: "ruler of Lu",
    born: null,
    died: null,
    offices: [
      { office: "Duke of Lu", state: "Lu", from: -662, to: -661 }
    ]
  },
  {
    uid: "Q1146646",
    name: "Duke Mu of Qin",
    cjkName: "秦穆公",
    cjkNames: ["秦穆公", "嬴任好", "秦缪公"],
    aliases: ["Qin Mu Gong", "Ying Renhao", "진목공", "嬴任好", "Công tử Nhậm Hảo", "Doanh Nhậm Hảo", "Nhậm Hảo", "秦缪公"],
    desc: "Ruler of Qin from 659 to 621 BC",
    born: -651,
    died: -622,
    offices: [
      { office: "Duke of Qin", state: "Qin", from: -660, to: -622 }
    ]
  },
  {
    uid: "Q625174",
    name: "Duke Xi of Lu",
    cjkName: "魯僖公",
    cjkNames: ["魯僖公", "鲁僖公", "姬申", "魯釐公", "鲁厘公", "鲁申"],
    aliases: ["노희공", "姬申", "魯釐公", "鲁厘公", "鲁申"],
    desc: "ruler of Lu",
    born: -751,
    died: -628,
    offices: [
      { office: "Duke of Lu", state: "Lu", from: -660, to: -628 }
    ]
  },
  {
    uid: "Q457972",
    name: "Guan Zhong",
    cjkName: "管仲",
    cjkNames: ["管仲", "管夫子", "管夷吾", "管敬仲"],
    aliases: ["Ching-chung Kuan", "Chu Kan", "Chung Kuan", "Di Ngô Quan", "Guan'-tszy", "Guanze", "Guanzi", "I-wu Kuan", "Jingzhong Guan", "Kan-shi", "Kanshi", "Kuan-tse", "Kuan-tzu", "Kwanja", "Trong Quan", "Tu Quan", "Yiwu Guan", "Meister Guan", "管夷吾", "管敬仲"],
    desc: "Chinese chancellor and reformer (c. 720–645 BC)",
    born: -721,
    died: -646,
    offices: [
      { office: "Chancellor", state: "Qi", from: -656, to: -646 }
    ]
  },
  {
    uid: "Q1184862",
    name: "King Xiang of Zhou",
    cjkName: "周襄王",
    cjkNames: ["周襄王", "姬郑"],
    aliases: ["Ji Zheng", "Zhou Xiang wang", "king Xiang of Zhou", "Xiang wang", "roi Xiang", "周襄王", "姬郑", "주 양왕", "Xiang van Zhou", "Kralj Sjang iz dinastije Džou", "Cơ Trịnh"],
    desc: "King of Zhou Dynasty China",
    born: null,
    died: -620,
    offices: [
      { office: "King", state: "Zhou", from: -652, to: -620 }
    ]
  },
  {
    uid: "Q1051369",
    name: "Xiqi",
    cjkName: "奚齊",
    cjkNames: ["奚齊", "奚齐", "姬奚齊", "晉君奚齊"],
    aliases: ["Cơ Hề Tề", "姬奚齊", "晉君奚齊"],
    desc: "ruler of the State of Jin",
    born: -666,
    died: -652,
    offices: [
      { office: "Duke of Jin", state: "Jin", from: -652, to: -652 }
    ]
  },
  {
    uid: "Q870356",
    name: "Zhuozi",
    cjkName: "卓子",
    cjkNames: ["卓子", "姬卓子", "晉君卓子"],
    aliases: ["卓子", "Cơ Trác Tử", "姬卓子", "晉君卓子"],
    desc: "ruler of Jin",
    born: -651,
    died: -652,
    offices: [
      { office: "Duke of Jin", state: "Jin", from: -652, to: -652 }
    ]
  },
  {
    uid: "Q1053226",
    name: "Duke Hui of Jin",
    cjkName: "晋惠公",
    cjkNames: ["晋惠公", "晉惠公", "夷吾", "姬夷吾"],
    aliases: ["Ji Yiwu", "Jin huigong", "Duc Hui de Jin", "晋恵公", "姬夷吾", "夷吾", "晉惠公"],
    desc: "ruler of the state of Jin",
    born: -701,
    died: -638,
    offices: [
      { office: "Duke of Jin", state: "Jin", from: -651, to: -638 }
    ]
  },
  {
    uid: "Q1133608",
    name: "Duke Xiang of Song",
    cjkName: "宋襄公",
    cjkNames: ["宋襄公", "子茲甫"],
    aliases: ["Song Xianggong", "Zi Zifu", "송양공", "子茲甫", "Công tử Tư Phủ", "Tư Phủ", "Tử Tư Phủ"],
    desc: "Duke of Song from 650 to 637 BC",
    born: null,
    died: -638,
    offices: [
      { office: "Duke of Song", state: "Song", from: -651, to: -638 }
    ]
  },
  {
    uid: "Q709433",
    name: "Wukui",
    cjkName: "公子無虧",
    cjkNames: ["公子無虧", "公子无亏", "無虧", "姜無詭", "齊中廢公", "齊君無詭", "齐中废公"],
    aliases: ["제후 무휴", "Khương Vô Khuy", "姜無詭", "無虧", "齊中廢公", "齊君無詭", "齐中废公"],
    desc: "ruler of Qi",
    born: null,
    died: -643,
    offices: [
      { office: "Ruler of Qi", state: "Qi", from: -644, to: -644 }
    ]
  },
  {
    uid: "Q709693",
    name: "Duke Xiao of Qi",
    cjkName: "齊孝公",
    cjkNames: ["齊孝公", "齐孝公", "姜昭", "有恃無恐"],
    aliases: ["제효공", "Khương Chiêu", "姜昭", "有恃無恐"],
    desc: "ruler of Qi",
    born: null,
    died: -634,
    offices: [
      { office: "Duke of Qi", state: "Qi", from: -643, to: -634 }
    ]
  },
  {
    uid: "Q1133572",
    name: "Duke Huai of Jin",
    cjkName: "晋怀公",
    cjkNames: ["晋怀公", "晉懷公", "姬圉"],
    aliases: ["Jin Hui Gong", "Cơ Ngữ", "姬圉"],
    desc: "ruler of the state of Jin",
    born: -651,
    died: -638,
    offices: [
      { office: "Duke of Jin", state: "Jin", from: -638, to: -638 }
    ]
  },
  {
    uid: "Q561973",
    name: "Duke Wen of Jin",
    cjkName: "晋文公",
    cjkNames: ["晋文公", "晉文公", "公子重耳", "姬重耳", "晋重", "重耳"],
    aliases: ["Chong'er", "Jin Wen Gong", "Zhong'er", "Ťin Wen-kung", "Ji Chong'er", "Jin Wengong", "公子重耳", "姫重耳", "晋文公", "重耳", "진문공", "Hertog Wen", "Цзи Чжунъ­эр", "Ťin Wen Kung", "Công tử Trùng Nhĩ", "Cơ Trùng Nhĩ", "Trùng Nhĩ", "Trọng Nhĩ", "姬重耳", "晉文公"],
    desc: "22nd ruler of Jin from 636 to 628 BCE",
    born: -698,
    died: -629,
    offices: [
      { office: "Duke of Jin", state: "Jin", from: -637, to: -629 }
    ]
  },
  {
    uid: "Q844522",
    name: "Cheng Dechen",
    cjkName: "成得臣",
    cjkNames: ["成得臣"],
    aliases: ["Ziyu", "Zi Yu", "子玉"],
    desc: "Chinese politician",
    born: null,
    died: -633,
    offices: [
    ]
  },
  {
    uid: "Q700221",
    name: "Duke Zhao of Qi",
    cjkName: "齊昭公",
    cjkNames: ["齊昭公", "齐昭公", "姜潘", "齐潘"],
    aliases: ["제소공", "Khương Phan", "姜潘", "齐潘"],
    desc: "ruler of Qi",
    born: null,
    died: -614,
    offices: [
      { office: "Duke of Qi", state: "Qi", from: -633, to: -614 }
    ]
  },
  {
    uid: "Q982918",
    name: "Sunshu Ao",
    cjkName: "孙叔敖",
    cjkNames: ["孙叔敖", "孫叔敖", "蒍艾獵"],
    aliases: ["蔿敖", "蔿艾猟", "孙叔敖", "蒍艾獵"],
    desc: "Prime Minister in the State of Chu and Hydraulic engineer",
    born: -631,
    died: -594,
    offices: [
    ]
  },
  {
    uid: "Q1045321",
    name: "Duke Xiang of Jin",
    cjkName: "晋襄公",
    cjkNames: ["晋襄公", "晉襄公", "姬歡"],
    aliases: ["晋襄公", "Cơ Hoan", "姬歡", "晉襄公"],
    desc: "ruler of the state of Jin",
    born: null,
    died: -622,
    offices: [
      { office: "Duke of Jin", state: "Jin", from: -628, to: -622 }
    ]
  },
  {
    uid: "Q626363",
    name: "Lǔwén gōng",
    cjkName: "魯文公",
    cjkNames: ["魯文公", "鲁文公", "姬興", "姬賈"],
    aliases: ["Ló͘ Bûn-kong", "姬興", "姬賈"],
    desc: "ruler of Lu",
    born: -651,
    died: null,
    offices: [
      { office: "Duke of Lu", state: "Lu", from: -627, to: -610 }
    ]
  },
  {
    uid: "Q795957",
    name: "King Mu of Chu",
    cjkName: "楚穆王",
    cjkNames: ["楚穆王", "商臣", "熊商臣"],
    aliases: ["Chu Mu Wang", "Shangchen", "Xiong Shangchen", "熊商臣", "商臣"],
    desc: "king of the state of Chu in ancient China",
    born: -651,
    died: -615,
    offices: [
      { office: "King", state: "Chu", from: -626, to: -615 }
    ]
  },
  {
    uid: "Q552737",
    name: "Duke Kang of Qin",
    cjkName: "秦康公",
    cjkNames: ["秦康公", "嬴罃"],
    aliases: ["嬴罃"],
    desc: "ruler of the state of Qin",
    born: -651,
    died: -610,
    offices: [
      { office: "Duke of Qin", state: "Qin", from: -621, to: -610 }
    ]
  },
  {
    uid: "Q1052924",
    name: "Duke Ling of Jin",
    cjkName: "晋灵公",
    cjkNames: ["晋灵公", "晉靈公", "姬夷皋"],
    aliases: ["Cơ Di Cao", "姬夷皋"],
    desc: "ruler of the state of Jin",
    born: null,
    died: -608,
    offices: [
      { office: "Duke of Jin", state: "Jin", from: -621, to: -608 }
    ]
  },
  {
    uid: "Q1157084",
    name: "King Qing of Zhou",
    cjkName: "周顷王",
    cjkNames: ["周顷王", "周頃王", "姬壬臣"],
    aliases: ["Ji Renchen", "Zhou Qing wang", "Qing de Zhou", "Kralj Ćing iz dinastije Džou", "Cơ Nhâm Thần", "周頃王", "姬壬臣"],
    desc: "19th Zhou king",
    born: null,
    died: -614,
    offices: [
      { office: "King", state: "Zhou", from: -619, to: -614 }
    ]
  },
  {
    uid: "Q198154",
    name: "King Zhuang of Chu",
    cjkName: "楚庄王",
    cjkNames: ["楚庄王", "熊侶", "楚莊王", "羋旅"],
    aliases: ["Chu Zhuang Wang", "Chu Zhuangwang", "Chuzhuangwang", "Mi Lv", "Xiong Lv", "Xiong Lü", "熊侶", "楚莊王", "羋旅"],
    desc: "King of Chu from 613 to 591 BC",
    born: -701,
    died: -592,
    offices: [
      { office: "King", state: "Chu", from: -614, to: -592 }
    ]
  },
  {
    uid: "Q700257",
    name: "She",
    cjkName: "舍",
    cjkNames: ["舍", "齊君舍", "公子舍", "姜舍", "齊後廢公", "齐后废公"],
    aliases: ["Lü She", "Khương Xá", "公子舍", "姜舍", "齊君舍", "齊後廢公", "齐后废公"],
    desc: "ruler of Qi",
    born: null,
    died: -614,
    offices: [
      { office: "Ruler of Qi", state: "Qi", from: -614, to: -614 }
    ]
  },
  {
    uid: "Q700369",
    name: "Duke Yì of Qi",
    cjkName: "齊懿公",
    cjkNames: ["齊懿公", "齐懿公", "姜商人"],
    aliases: ["Duke Yi of Qi", "제의공", "Khương Thương Nhân", "姜商人"],
    desc: "ruler of Qi",
    born: null,
    died: -610,
    offices: [
      { office: "Duke of Qi", state: "Qi", from: -613, to: -610 }
    ]
  },
  {
    uid: "Q1157087",
    name: "King Kuang of Zhou",
    cjkName: "周匡王",
    cjkNames: ["周匡王", "姬班"],
    aliases: ["Zhou Kuang wang", "주 광왕", "Kralj Kuang iz dinastije Džou", "姬班"],
    desc: "King of Zhou Dynasty China",
    born: null,
    died: -608,
    offices: [
      { office: "King", state: "Zhou", from: -613, to: -608 }
    ]
  },
  {
    uid: "Q564147",
    name: "Duke Gong of Qin",
    cjkName: "秦共公",
    cjkNames: ["秦共公", "嬴稻", "嬴貑"],
    aliases: ["嬴稻", "嬴貑"],
    desc: "ruler of the state of Qin",
    born: -651,
    died: -605,
    offices: [
      { office: "Duke of Qin", state: "Qin", from: -609, to: -605 }
    ]
  },
  {
    uid: "Q700390",
    name: "Duke Hui of Qi",
    cjkName: "齊惠公",
    cjkNames: ["齊惠公", "齐惠公", "姜元"],
    aliases: ["제혜공", "Khương Nguyên", "姜元"],
    desc: "ruler of Qi",
    born: -651,
    died: -600,
    offices: [
      { office: "Duke of Qi", state: "Qi", from: -609, to: -600 }
    ]
  },
  {
    uid: "Q646378",
    name: "Duke Xuan of Lu",
    cjkName: "魯宣公",
    cjkNames: ["魯宣公", "鲁宣公", "姬俀", "姬餒"],
    aliases: ["Ji Tui", "Luxuangong", "노선공", "魯宣公", "姬俀", "姬餒"],
    desc: "ruler of the ancient Chinese state of Lu",
    born: -651,
    died: -592,
    offices: [
      { office: "Duke of Lu", state: "Lu", from: -609, to: -592 }
    ]
  },
  {
    uid: "Q1053200",
    name: "Duke Cheng of Jin",
    cjkName: "晋成公",
    cjkNames: ["晋成公", "晉成公", "姬黑臀"],
    aliases: ["Cơ Hắc Đồn", "姬黑臀", "晉成公"],
    desc: "ruler of the state of Jin",
    born: -651,
    died: -601,
    offices: [
      { office: "Duke of Jin", state: "Jin", from: -607, to: -601 }
    ]
  },
  {
    uid: "Q1157075",
    name: "King Ding of Zhou",
    cjkName: "周定王",
    cjkNames: ["周定王", "姬瑜"],
    aliases: ["Chou Ting-wang", "Ding King of Zhou", "Ding of Zhou", "Ji Yu", "King Ding of Zhou", "King Ting of Chou", "Sure King of the Zhou", "Ting of Chou", "Zhou Dingwang", "Ting-vang", "roi Ding de Zhou", "주 정왕", "Tim-vam", "Kralj Ding iz dinastije Džou", "Zhou Ding Wang", "Cơ Du", "Jī Yú", "Zhōu Dìng Wáng", "Zhōu Dìngwáng", "姬瑜"],
    desc: "ancient Chinese king of the Zhou dynasty",
    born: null,
    died: -587,
    offices: [
      { office: "King", state: "Zhou", from: -607, to: -587 }
    ]
  },
  {
    uid: "Q549162",
    name: "Duke Huan of Qin",
    cjkName: "秦桓公",
    cjkNames: ["秦桓公"],
    aliases: [],
    desc: "ruler of the state of Qin",
    born: -651,
    died: -578,
    offices: [
      { office: "Duke of Qin", state: "Qin", from: -604, to: -578 }
    ]
  },
  {
    uid: "Q709711",
    name: "Duke Qing of Qi",
    cjkName: "齊頃公",
    cjkNames: ["齊頃公", "齐顷公", "姜無野"],
    aliases: ["姜無野"],
    desc: "ruler of Qi",
    born: -651,
    died: -583,
    offices: [
      { office: "Duke of Qi", state: "Qi", from: -599, to: -583 }
    ]
  },
  {
    uid: "Q719412",
    name: "Duke Cheng of Lu",
    cjkName: "魯成公",
    cjkNames: ["魯成公", "鲁成公", "姬黑肱"],
    aliases: ["Ji Heigong", "Luchenggong", "노성공", "魯成公", "姬黑肱"],
    desc: "Chinese noble",
    born: -651,
    died: null,
    offices: [
      { office: "Duke of Lu", state: "Lu", from: -591, to: -574 }
    ]
  },
  {
    uid: "Q795856",
    name: "King Gong of Chu",
    cjkName: "楚共王",
    cjkNames: ["楚共王", "熊審"],
    aliases: ["Chu Gong Wang", "Xiong Shen", "恭王", "熊審"],
    desc: "King of the State of Chu during the Spring and Autumn Period of ancient China",
    born: -601,
    died: -561,
    offices: [
      { office: "King", state: "Chu", from: -591, to: -561 }
    ]
  },
  {
    uid: "Q5962901",
    name: "Shoumeng",
    cjkName: "壽夢",
    cjkNames: ["壽夢", "寿梦"],
    aliases: ["Cơ Thọ Mộng", "Ngô vương Thọ Mộng", "Thọ Mộng"],
    desc: "king of Wu",
    born: null,
    died: -561,
    offices: [
      { office: "Ruler of Wu", state: "Wu", from: -587, to: -562 }
    ]
  },
  {
    uid: "Q1157071",
    name: "King Jian of Zhou",
    cjkName: "周简王",
    cjkNames: ["周简王", "周簡王", "姬夷"],
    aliases: ["Jian de Zhou", "Zhou Jian wang", "주 간왕", "Kralj Đijen iz dinastije Džou", "Zhou Jianwang", "姬夷"],
    desc: "King of Zhou Dynasty China",
    born: null,
    died: -573,
    offices: [
      { office: "King", state: "Zhou", from: -586, to: -573 }
    ]
  },
  {
    uid: "Q713902",
    name: "Duke Ling of Qi",
    cjkName: "齊靈公",
    cjkNames: ["齊靈公", "齐灵公", "吕環", "姜環", "齐桓武灵公"],
    aliases: ["제영공", "吕環", "姜環", "齐桓武灵公"],
    desc: "ruler of Qi, ancient China, 581 to 554 BC",
    born: -651,
    died: -555,
    offices: [
      { office: "Duke of Qi", state: "Qi", from: -582, to: -555 }
    ]
  },
  {
    uid: "Q855693",
    name: "Duke Li of Jin",
    cjkName: "晉厲公",
    cjkNames: ["晉厲公", "晋厉公", "姬壽曼", "晉釐公", "晋厘公"],
    aliases: ["Zhoupu", "姬壽曼", "晉釐公", "晋厘公"],
    desc: "ruler of the state of Jin",
    born: null,
    died: -574,
    offices: [
      { office: "Duke of Jin", state: "Jin", from: -581, to: -574 }
    ]
  },
  {
    uid: "Q1045306",
    name: "Yan Ying",
    cjkName: "晏婴",
    cjkNames: ["晏婴", "晏嬰", "平仲", "晏仲", "晏子", "晏平仲"],
    aliases: ["P'ing Chong", "Ping Chong", "Ping Zhong", "Yan Zhong", "Yanzi", "Yen Chong", "Yen P'ing-chong", "Yen Ping-chong", "Yen Ying", "Yen-tse", "Yen-tsee", "Yene-tsee", "Yen-tsëe", "Yen-tsëé", "Yene-tsëe", "Yene-tsëé", "晏子", "平仲", "晏仲", "晏嬰"],
    desc: "ancient Chinese philosopher and politician from the state of Qi in the 6th century BC",
    born: -579,
    died: -501,
    offices: [
    ]
  },
  {
    uid: "Q550122",
    name: "Duke Jing of Qin",
    cjkName: "秦景公",
    cjkNames: ["秦景公", "嬴后伯車"],
    aliases: ["嬴后伯車"],
    desc: "ruler of the state of Qin",
    born: null,
    died: -538,
    offices: [
      { office: "Duke of Qin", state: "Qin", from: -577, to: -538 }
    ]
  },
  {
    uid: "Q985696",
    name: "Duke Dao of Jin",
    cjkName: "晋悼公",
    cjkNames: ["晋悼公", "晉悼公"],
    aliases: ["Cơ Chu"],
    desc: "ruler of the state of Jin",
    born: -587,
    died: -559,
    offices: [
      { office: "Duke of Jin", state: "Jin", from: -574, to: -559 }
    ]
  },
  {
    uid: "Q719400",
    name: "Duke Xiang of Lu",
    cjkName: "鲁襄公",
    cjkNames: ["鲁襄公", "魯襄公"],
    aliases: ["노양공"],
    desc: "ruler of Lu",
    born: -576,
    died: null,
    offices: [
      { office: "Duke of Lu", state: "Lu", from: -573, to: -543 }
    ]
  },
  {
    uid: "Q887580",
    name: "Ling",
    cjkName: "周灵王",
    cjkNames: ["周灵王", "周靈王", "姬泄心"],
    aliases: ["Chi Hsieh-hsin", "Chou Ling-wang", "Ji Xiexin", "King Ling", "King Ling of Chou", "King Ling of Zhou", "Ling King of Chou", "Ling King of Zhou", "Ling-vang", "Ling-wang", "Lingwang", "Spiritual King of the Chou", "Spiritual King of the Zhou", "Zhou Lingwang", "König Ling von Chou", "Ling Wang", "Ling von Chou", "Zhou Ling Wang", "roi Ling", "roi Ling de Zhou"],
    desc: "ancient Chinese king of the Zhou dynasty",
    born: -601,
    died: -546,
    offices: [
      { office: "King", state: "Zhou", from: -572, to: -546 }
    ]
  },
  {
    uid: "Q795948",
    name: "King Kang of Chu",
    cjkName: "楚康王",
    cjkNames: ["楚康王", "熊招"],
    aliases: ["康王 (楚)", "熊招"],
    desc: "King of Chu from 559 to 545 BC",
    born: null,
    died: -546,
    offices: [
      { office: "Monarch", state: null, from: -560, to: -546 },
      { office: "King", state: "Chu", from: -560, to: -546 }
    ]
  },
  {
    uid: "Q985692",
    name: "Duke Ping of Jin",
    cjkName: "晉平公",
    cjkNames: ["晉平公", "晋平公", "姬彪"],
    aliases: ["Cơ Bưu", "姬彪", "晋平公"],
    desc: "ruler of the state of Jin",
    born: null,
    died: -533,
    offices: [
      { office: "Duke of Jin", state: "Jin", from: -558, to: -533 }
    ]
  },
  {
    uid: "Q709690",
    name: "Duke Zhuang II of Qi",
    cjkName: "齊莊公",
    cjkNames: ["齊莊公", "齐庄公", "齊後莊公", "姜光", "齐后庄公"],
    aliases: ["Khương Quang", "姜光", "齊後莊公", "齐后庄公"],
    desc: "ruler of Qi, ancient China, 553 to 548 BC",
    born: -551,
    died: -549,
    offices: [
      { office: "Duke of Qi", state: "Qi", from: -554, to: -549 }
    ]
  },
  {
    uid: "Q1269349",
    name: "Fuchai",
    cjkName: "夫差",
    cjkNames: ["夫差", "吴王夫差", "姬夫差"],
    aliases: ["Duke Fuchai of Wu", "Fucha", "King Fuchai of Wu", "Fuchai av Wu", "Fu Chai av Wu", "Ngô Vương Phù Sai", "Phù Sai", "吴王夫差", "姬夫差"],
    desc: "King of Chinese state of Wu from 495 to 473 BC",
    born: -551,
    died: -474,
    offices: [
    ]
  },
  {
    uid: "Q1279924",
    name: "Helü",
    cjkName: "阖闾",
    cjkNames: ["阖闾", "闔閭", "公子光", "吴王阖闾", "阖庐", "吴王闔閭", "姬光", "闔廬"],
    aliases: ["Gongzi Guang", "Helu", "Helv", "King He Lu of Wu", "King of Wu Guang", "闔廬", "Helu av Wu", "Kralj He Lu od Wu", "Kralj He Lu od Wua", "Kralj Helu od Wua", "Hely av Wu", "Công tử Quang", "Hạp Lư", "Ngô vương Hạp Lư", "公子光", "吴王阖闾", "闔閭", "阖庐", "吴王闔閭", "姬光"],
    desc: "twenty-fourth King of Chinese state of Wu from 514 to 496 BC",
    born: -551,
    died: -497,
    offices: [
    ]
  },
  {
    uid: "Q709736",
    name: "Duke Jing of Qi",
    cjkName: "齊景公",
    cjkNames: ["齊景公", "齐景公", "吕杵臼", "姜杵臼", "晏子"],
    aliases: ["Khương Chử Cữu", "吕杵臼", "姜杵臼", "晏子"],
    desc: "ruler of the Chinese state of Qi from 547 to 490 BC",
    born: -551,
    died: -491,
    offices: [
      { office: "Duke of Qi", state: "Qi", from: -548, to: -491 }
    ]
  },
  {
    uid: "Q557224",
    name: "Jia'ao",
    cjkName: "郏敖",
    cjkNames: ["郏敖", "郟敖", "楚王郏敖", "楚郏敖", "楚郟敖", "熊員"],
    aliases: ["熊員", "Giáp Ngao", "楚王郏敖", "楚郏敖", "楚郟敖"],
    desc: "King of Chu",
    born: null,
    died: -542,
    offices: [
      { office: "King", state: "Chu", from: -545, to: -542 }
    ]
  },
  {
    uid: "Q1184856",
    name: "King Jing of Zhou",
    cjkName: "周景王",
    cjkNames: ["周景王", "姬貴"],
    aliases: ["Ji Gui", "Jing (Ji Gui, Zhou-König)", "Jing Zhou wang", "König Jing von Zhou", "Zhou Jing wang", "Jing wang", "roi Jing", "Kralj Đing iz dinastije Džou", "Cơ Quý", "姬貴"],
    desc: "Chinese Zhou Dynasty king from 544 BC to 520 BC",
    born: null,
    died: -521,
    offices: [
      { office: "King", state: "Zhou", from: -545, to: -522 }
    ]
  },
  {
    uid: "Q795912",
    name: "King Ling of Chu",
    cjkName: "楚靈王",
    cjkNames: ["楚靈王", "楚灵王", "公子圍", "熊圍", "羋圍"],
    aliases: ["熊囲", "公子圍", "楚灵王", "熊圍", "羋圍"],
    desc: "Chinese King of Chu from 540 to 529 BC",
    born: null,
    died: -530,
    offices: [
      { office: "King", state: "Chu", from: -541, to: -530 }
    ]
  },
  {
    uid: "Q565979",
    name: "Duke Ai of Qin",
    cjkName: "秦哀公",
    cjkNames: ["秦哀公"],
    aliases: [],
    desc: "ruler of Chinese state of Qin from 536 to 501 BC",
    born: -551,
    died: -502,
    offices: [
      { office: "Duke of Qin", state: "Qin", from: -537, to: -502 }
    ]
  },
  {
    uid: "Q5312924",
    name: "Duke Zhao of Jin",
    cjkName: "晉昭公",
    cjkNames: ["晉昭公", "姬夷 (晉國)", "晋昭公"],
    aliases: ["Tấn Chiêu Công", "姬夷 (晉國)", "晋昭公"],
    desc: "Chinese ruler of Jin from 531 to 526 BC",
    born: null,
    died: -527,
    offices: [
      { office: "Duke of Jin", state: "Jin", from: -532, to: -527 }
    ]
  },
  {
    uid: "Q3912802",
    name: "Zi'ao",
    cjkName: "訾敖",
    cjkNames: ["訾敖", "公子比", "公子比叛楚之战", "子干", "楚公子比", "楚王比", "楚王訾敖", "楚訾敖", "熊比"],
    aliases: ["シ敖", "熊比", "公子比", "公子比叛楚之战", "子干", "楚公子比", "楚王比", "楚王訾敖", "楚訾敖"],
    desc: "Chinese King of Chu in 529 BC",
    born: null,
    died: -530,
    offices: [
      { office: "King", state: "Chu", from: -530, to: -530 }
    ]
  },
  {
    uid: "Q795877",
    name: "King Ping of Chu",
    cjkName: "楚平王",
    cjkNames: ["楚平王", "熊棄疾", "公子弃疾", "熊居", "羋棄疾", "陈君弃疾", "陳君棄疾"],
    aliases: ["Chu Pingwang", "Chupingwang", "Mi Qiji", "Xiong Ju", "Xiong Qiji", "Chu Ping wang", "熊弃疾", "楚平王", "羋棄疾", "公子弃疾", "熊居", "熊棄疾", "陈君弃疾", "陳君棄疾"],
    desc: "King of Chu from 528 BC to 516 BC",
    born: -551,
    died: -517,
    offices: [
      { office: "Monarch", state: null, from: -529, to: -517 },
      { office: "King", state: "Chu", from: -529, to: -517 }
    ]
  },
  {
    uid: "Q1268609",
    name: "Wu Zixu",
    cjkName: "伍子胥",
    cjkNames: ["伍子胥", "伍員"],
    aliases: ["伍員", "오원", "Wu Zixu", "Ngũ Viên", "Tử Tư", "Viên"],
    desc: "Chinese Wu kingdom general and politician (died 484 BC)",
    born: -527,
    died: -484,
    offices: [
    ]
  },
  {
    uid: "Q5312850",
    name: "Duke Qing of Jin",
    cjkName: "晋顷公",
    cjkNames: ["晋顷公", "晉頃公", "姬棄疾"],
    aliases: ["Cơ Khí Tật", "Tấn Khoảnh Công", "姬棄疾", "晉頃公"],
    desc: "ruler of the Chinese state of Jin from 525 BC to 512 BC",
    born: null,
    died: -513,
    offices: [
      { office: "Duke of Jin", state: "Jin", from: -526, to: -513 }
    ]
  },
  {
    uid: "Q1185205",
    name: "King Dao of Zhou",
    cjkName: "周悼王",
    cjkNames: ["周悼王", "姬猛", "王子猛"],
    aliases: ["Dao (Zhou-König)", "Dao wang", "Zhou Dao wang", "roi Dao", "주 도왕", "Cơ Mãnh", "姬猛", "王子猛"],
    desc: "king of the Chinese Zhou Dynasty (died 520 BC)",
    born: null,
    died: -521,
    offices: [
      { office: "King", state: "Zhou", from: -521, to: -521 }
    ]
  },
  {
    uid: "Q878483",
    name: "King Jing of Zhou (Gai)",
    cjkName: "周敬王",
    cjkNames: ["周敬王", "姬匄"],
    aliases: ["Ji Gai", "König Jing von Zhou", "Jing de Zhou", "Jing wang", "Zhou Jing wang", "roi Jing", "姬匄", "Kralj Đing iz dinastije Džou", "Cơ Cái"],
    desc: "Zhou Dynasty King of China from 519 to 477 BC",
    born: -551,
    died: -478,
    offices: [
      { office: "King", state: "Zhou", from: -520, to: -477 }
    ]
  },
  {
    uid: "Q795862",
    name: "King Zhao of Chu",
    cjkName: "楚昭王",
    cjkNames: ["楚昭王", "熊壬", "熊珍", "羋軫"],
    aliases: ["Chu Zhao Wang", "Chu Zhaowang", "Chuzhaowang", "Mi Zhen", "Xiong Ren", "Xiong Zhen", "Tchāo", "chŭ zhāo wáng", "熊珍", "楚昭王", "羋軫", "熊壬"],
    desc: "king of Chinese state of Chu from 515 to 489 BC",
    born: null,
    died: -490,
    offices: [
      { office: "King", state: "Chu", from: -516, to: -490 }
    ]
  },
  {
    uid: "Q5312758",
    name: "Duke Ding of Jin",
    cjkName: "晉定公",
    cjkNames: ["晉定公", "晋定公"],
    aliases: ["Tấn Định Công", "晋定公"],
    desc: "Chinese state ruler from 511 to 475 BC",
    born: null,
    died: -476,
    offices: [
      { office: "Duke of Jin", state: "Jin", from: -512, to: -476 }
    ]
  },
  {
    uid: "Q766788",
    name: "Lu Dinggong",
    cjkName: "魯定公",
    cjkNames: ["魯定公", "鲁定公", "姬宋"],
    aliases: ["Ló͘ Tēng-kong", "Lǔ dìng gōng", "Lỗ Định công", "Noh Jeonggong", "노정공", "姬宋", "鲁定公"],
    desc: "Lu dynasty king (? ~ 495 BC , reigned 509 BC ~ 495 BC)",
    born: -557,
    died: null,
    offices: [
      { office: "Duke of Lu", state: "Lu", from: -510, to: -496 }
    ]
  },
  {
    uid: "Q549133",
    name: "Duke Hui I of Qin",
    cjkName: "秦惠公",
    cjkNames: ["秦惠公"],
    aliases: ["秦の恵公"],
    desc: "Ruler of Chinese state of Qin from 500 to 492 BC",
    born: -551,
    died: -493,
    offices: [
      { office: "Duke of Qin", state: "Qin", from: -501, to: -493 }
    ]
  },
  {
    uid: "Q1374991",
    name: "Fan Li",
    cjkName: "范蠡",
    cjkNames: ["范蠡", "朱公", "范少伯", "陶朱公", "陶朱公传说", "鴟夷子皮"],
    aliases: ["陶朱", "범여", "范少伯", "陶朱公", "鴟夷子皮", "Đào Chu Công", "朱公", "陶朱公传说"],
    desc: "early 5th-century BC Chinese political and military advisor",
    born: -501,
    died: -449,
    offices: [
    ]
  },
  {
    uid: "Q716190",
    name: "Li Kui",
    cjkName: "李悝",
    cjkNames: ["李悝", "李克", "李兌"],
    aliases: ["Li Kui (légiste)", "Lǐ Kuī", "李悝", "李克", "李兌"],
    desc: "Chinese philosopher",
    born: -501,
    died: -401,
    offices: [
    ]
  },
  {
    uid: "Q1267918",
    name: "Goujian",
    cjkName: "勾践",
    cjkNames: ["勾践", "勾踐", "姒勾踐", "句踐", "菼執", "越王勾踐", "鳩淺"],
    aliases: ["Si Goujian", "Kou-ťien", "Raja Goujian dari Yue", "句践", "Gou Jian av Yue", "Goujian av Yue", "Lạc Câu Tiễn", "Việt vương Câu Tiễn", "勾踐", "句踐", "姒勾踐", "菼執", "越王勾踐", "鳩淺"],
    desc: "King of Yue from 496 to 465 BC",
    born: -551,
    died: null,
    offices: [
      { office: "King", state: "Yue", from: -497, to: -466 }
    ]
  },
  {
    uid: "Q795885",
    name: "Lǔ āigōng",
    cjkName: "魯哀公",
    cjkNames: ["魯哀公", "鲁哀公", "姬將"],
    aliases: ["Ló͘ Ai-kong", "노애공", "姬將"],
    desc: "ruler of Lu",
    born: null,
    died: null,
    offices: [
      { office: "Duke of Lu", state: "Lu", from: -495, to: -468 }
    ]
  },
  {
    uid: "Q553763",
    name: "Duke Dao of Qin",
    cjkName: "秦悼公",
    cjkNames: ["秦悼公"],
    aliases: [],
    desc: "Ruler of the Chinese state of Qin from 491 to 477 BC",
    born: -551,
    died: -478,
    offices: [
      { office: "Duke of Qin", state: "Qin", from: -492, to: -478 }
    ]
  },
  {
    uid: "Q4750213",
    name: "An Ruzi",
    cjkName: "安孺子",
    cjkNames: ["安孺子", "齊晏孺子", "姜荼", "齐晏孺子"],
    aliases: ["An Nhũ Tử", "Khương Đồ", "姜荼", "齊晏孺子", "齐晏孺子"],
    desc: "ruler of the Chinese state of Qi in 489 BC",
    born: null,
    died: -490,
    offices: [
      { office: "Ruler of Qi", state: "Qi", from: -490, to: -490 }
    ]
  },
  {
    uid: "Q700215",
    name: "Duke Dao of Qi",
    cjkName: "齊悼公",
    cjkNames: ["齊悼公", "齐悼公", "姜陽生", "陽生"],
    aliases: ["제도공", "Khương Dương Sinh", "姜陽生", "陽生"],
    desc: "ruler of the Chinese state of Qi from 488 to 485 BC",
    born: null,
    died: -486,
    offices: [
      { office: "Duke of Qi", state: "Qi", from: -489, to: -486 }
    ]
  },
  {
    uid: "Q6411724",
    name: "King Hui of Chu",
    cjkName: "楚惠王",
    cjkNames: ["楚惠王", "熊章"],
    aliases: ["Chu Hui Wang", "Xiong Zhang", "恵王 (楚)", "Sở Hiến Huệ vương", "Sở Huệ vương", "熊章"],
    desc: "king of the State of Chu from 488 to 432 BC",
    born: null,
    died: -433,
    offices: [
      { office: "King", state: "Chu", from: -489, to: -433 }
    ]
  },
  {
    uid: "Q700358",
    name: "Duke Jian of Qi",
    cjkName: "齊簡公",
    cjkNames: ["齊簡公", "齐简公", "姜壬"],
    aliases: ["제간공", "Khương Nhâm", "姜壬"],
    desc: "ruler of Qi from 484 to 481 BC",
    born: null,
    died: -482,
    offices: [
      { office: "Duke of Qi", state: "Qi", from: -485, to: -482 }
    ]
  },
  {
    uid: "Q855862",
    name: "Duke Ping of Qi",
    cjkName: "齊平公",
    cjkNames: ["齊平公", "齐平公", "吕驁", "姜驁"],
    aliases: ["제평공", "Khương Ngao", "吕驁", "姜驁"],
    desc: "ruler of the Chinese state of Qi from 480 to 456 BC",
    born: null,
    died: -457,
    offices: [
      { office: "Duke of Qi", state: "Qi", from: -481, to: -457 }
    ]
  },
  {
    uid: "Q553771",
    name: "Duke Ligong of Qin",
    cjkName: "秦厲共公",
    cjkNames: ["秦厲共公", "秦厉共公", "秦厲公"],
    aliases: ["レイ共公", "秦厉共公", "秦厲公"],
    desc: "ruler of Chinese state of Qin from 476 to 443 BC",
    born: null,
    died: -444,
    offices: [
      { office: "Duke of Qin", state: "Qin", from: -477, to: -444 }
    ]
  },
  {
    uid: "Q1207443",
    name: "King Yuan of Zhou",
    cjkName: "周元王",
    cjkNames: ["周元王", "姬仁"],
    aliases: ["Ji Ren", "Yuan de Zhou", "Yuan wang", "Zhou Yuan wang", "roi Yuan", "周元王", "姬仁", "주 원왕", "Kralj Juen iz dinastije Džou", "Cơ Nhân"],
    desc: "Zhou dynasty king of China from 476 to 469 BC",
    born: null,
    died: -470,
    offices: [
      { office: "King", state: "Zhou", from: -476, to: -470 }
    ]
  },
  {
    uid: "Q5312752",
    name: "Duke Chu of Jin",
    cjkName: "晉出公",
    cjkNames: ["晉出公", "姬鑿", "晋出公"],
    aliases: ["Tấn Xuất Công", "姬鑿", "晋出公"],
    desc: "ruler of Jin, China from 474 to 452 BC",
    born: null,
    died: null,
    offices: [
      { office: "Duke of Jin", state: "Jin", from: -475, to: -453 }
    ]
  },
  {
    uid: "Q1934493",
    name: "Bo Pi",
    cjkName: "伯嚭",
    cjkNames: ["伯嚭", "太宰嚭"],
    aliases: ["伯ヒ", "Bá Bì", "Bá Hi", "太宰嚭"],
    desc: "Official in the Chinese state of Wu (died 473 BC)",
    born: null,
    died: -474,
    offices: [
    ]
  },
  {
    uid: "Q1156961",
    name: "King Zhending of Zhou",
    cjkName: "周貞定王",
    cjkNames: ["周貞定王", "周贞定王", "周贞王", "姬介"],
    aliases: ["Ji Jie", "Zhending de Zhou", "Zhou Zhending wang", "姫介", "주 정정왕", "ᠵᡝᠩ ᡩᡳᠩ ᠸᠠᠩ (ᠵᡝᠣ ᡤᡠᡵᡠᠨ)", "Zhou Zhen Ding Wang", "周贞王", "姬介"],
    desc: "Zhou Dynasty king of China from 468 to 441 BC",
    born: null,
    died: -442,
    offices: [
      { office: "King", state: "Zhou", from: -469, to: -443 }
    ]
  },
  {
    uid: "Q700246",
    name: "Duke Xuan of Qi",
    cjkName: "齊宣公",
    cjkNames: ["齊宣公", "齐宣公", "吕積", "姜積"],
    aliases: ["제선공", "Khương Tích", "吕積", "姜積"],
    desc: "Ruler of State of Qi from 455 to 405 BC",
    born: null,
    died: -406,
    offices: [
      { office: "Duke of Qi", state: "Qi", from: -456, to: -406 }
    ]
  },
  {
    uid: "Q5312802",
    name: "Duke Jing of Jin",
    cjkName: "晋哀公",
    cjkNames: ["晋哀公", "晉哀公", "晉懿公", "晉敬公"],
    aliases: ["Tấn Ai Công", "Tấn Kính công", "Tấn Ý công", "晉哀公", "晉懿公", "晉敬公"],
    desc: "Ruler of the state of Jin from 451 to 434 BC",
    born: null,
    died: -435,
    offices: [
      { office: "Duke of Jin", state: "Jin", from: -452, to: -435 }
    ]
  },
  {
    uid: "Q1140999",
    name: "Marquess Wen of Wei",
    cjkName: "魏文侯",
    cjkNames: ["魏文侯", "魏斯"],
    aliases: ["魏斯", "Вэйский Вэнь-хоу", "Markiz Wen od Weija"],
    desc: "ruler of Wei from 446 to 396 BC",
    born: null,
    died: -397,
    offices: [
      { office: "Marquess of Wei", state: "Wei", from: -446, to: -397 }
    ]
  },
  {
    uid: "Q553781",
    name: "Duke Zao of Qin",
    cjkName: "秦躁公",
    cjkNames: ["秦躁公"],
    aliases: [],
    desc: "Ruler of Chinese state of Qin from 442 to 429 BC",
    born: null,
    died: -430,
    offices: [
      { office: "Duke of Qin", state: "Qin", from: -443, to: -430 }
    ]
  },
  {
    uid: "Q1184849",
    name: "King Ai of Zhou",
    cjkName: "周哀王",
    cjkNames: ["周哀王", "姬去疾"],
    aliases: ["Ji Qubing", "König Ai von Zhou", "Ai de Zhou", "Ai wang", "Zhou Ai wang", "roi Ai", "姬去疾", "주 애왕", "Aiwang", "Kralj Ai od Choua"],
    desc: "Zhou Dynasty king of China during 441 BC",
    born: null,
    died: -442,
    offices: [
      { office: "King", state: "Zhou", from: -442, to: -442 }
    ]
  },
  {
    uid: "Q1184838",
    name: "King Si of Zhou",
    cjkName: "周思王",
    cjkNames: ["周思王", "姬叔襲"],
    aliases: ["Ji Shu", "könig Si von Zhou", "Si de Zhou", "Si wang", "Zhou Si wang", "roi Zhou", "주 사왕", "Si van Zhou", "Siwang", "Kralj Si od Choua", "姬叔襲"],
    desc: "Zhou Dynasty king of China during 441 BC",
    born: null,
    died: -442,
    offices: [
      { office: "King", state: "Zhou", from: -442, to: -442 }
    ]
  },
  {
    uid: "Q1157091",
    name: "King Kao of Zhou",
    cjkName: "周考王",
    cjkNames: ["周考王", "周考哲王", "姬嵬"],
    aliases: ["Kao de Zhou", "Zhou Kao wang", "주 고왕", "Kralj Kao od Choua", "Cơ Nguy", "周考哲王", "姬嵬"],
    desc: "Zhou Dynasty king of China from 440 to 426 BC",
    born: null,
    died: -427,
    offices: [
      { office: "King", state: "Zhou", from: -441, to: -427 }
    ]
  },
  {
    uid: "Q698899",
    name: "Wu Qi",
    cjkName: "吳起",
    cjkNames: ["吳起", "吴起"],
    aliases: ["吴起"],
    desc: "Chinese general (440–381 BC)",
    born: -441,
    died: -382,
    offices: [
    ]
  },
  {
    uid: "Q5312921",
    name: "Duke You of Jin",
    cjkName: "晋幽公",
    cjkNames: ["晋幽公", "晉幽公", "姬柳"],
    aliases: ["Cơ Liễu", "Tấn U Công", "姬柳"],
    desc: "Chinese state of Jin ruler from 433 to 416 BC",
    born: null,
    died: -417,
    offices: [
      { office: "Duke of Jin", state: "Jin", from: -434, to: -417 }
    ]
  },
  {
    uid: "Q795902",
    name: "King Jian of Chu",
    cjkName: "楚简王",
    cjkNames: ["楚简王", "楚簡王", "熊中"],
    aliases: ["Chu Jian Wang", "Xiong Zhong", "熊中", "楚簡王"],
    desc: "King of Chinese state of Chu from 431 to 408 BC",
    born: null,
    died: -409,
    offices: [
      { office: "King", state: "Chu", from: -432, to: -409 }
    ]
  },
  {
    uid: "Q553786",
    name: "Duke Huai of Qin",
    cjkName: "秦怀公",
    cjkNames: ["秦怀公", "秦懷公"],
    aliases: ["Duc Huai de Qin", "秦懷公"],
    desc: "Ruler of the Chinese state of Qin from 428 to 425 BC",
    born: null,
    died: -426,
    offices: [
      { office: "Duke of Qin", state: "Qin", from: -429, to: -426 }
    ]
  },
  {
    uid: "Q1185191",
    name: "King Weilie of Zhou",
    cjkName: "周威烈王",
    cjkNames: ["周威烈王", "周威王", "姬午"],
    aliases: ["Ji Wu", "Zhou Weiliewang", "Weilie de Zhou", "Zhou Weilie wang", "姬午", "주 위열왕", "Weilie", "Zhou wei lie wang", "周威王"],
    desc: "Zhou Dynasty king of China from 425 to 402 BC",
    born: null,
    died: -403,
    offices: [
      { office: "King", state: "Zhou", from: -426, to: -403 }
    ]
  },
  {
    uid: "Q553746",
    name: "Duke Ling of Qin",
    cjkName: "秦靈公",
    cjkNames: ["秦靈公", "秦灵公", "嬴肅"],
    aliases: ["진영공", "嬴肅", "秦灵公"],
    desc: "ruler of Chinese state of Qin from 424 to 415 BC",
    born: -451,
    died: -416,
    offices: [
      { office: "Duke of Qin", state: "Qin", from: -425, to: -416 }
    ]
  },
  {
    uid: "Q3454841",
    name: "Marquess Xian of Zhao",
    cjkName: "趙獻子",
    cjkNames: ["趙獻子", "赵献子", "趙獻侯", "赵浣", "赵献侯", "趙浣"],
    aliases: ["Marquès Xian de Zhao", "Zhao Huan", "Zhào Huàn", "趙献子", "赵浣", "赵献侯", "趙浣", "趙獻侯"],
    desc: "Chinese noble",
    born: null,
    died: -410,
    offices: [
      { office: "Marquess of Zhao", state: "Zhao", from: -425, to: -410 }
    ]
  },
  {
    uid: "Q5312818",
    name: "Duke Lie of Jin",
    cjkName: "晋烈公",
    cjkNames: ["晋烈公", "晉烈公", "姬止"],
    aliases: ["Cơ Chỉ", "Tấn Liệt Công", "姬止"],
    desc: "Ruler of the state of Jin from 415 to 389 BC",
    born: null,
    died: -390,
    offices: [
      { office: "Duke of Jin", state: "Jin", from: -416, to: -390 }
    ]
  },
  {
    uid: "Q553753",
    name: "Duke Jian of Qin",
    cjkName: "秦簡公",
    cjkNames: ["秦簡公", "秦简公", "嬴悼"],
    aliases: ["嬴悼", "秦简公"],
    desc: "ruler of Chinese state of Qin from 414 to 400 BC",
    born: -429,
    died: -401,
    offices: [
      { office: "Duke of Qin", state: "Qin", from: -415, to: -401 }
    ]
  },
  {
    uid: "Q5291592",
    name: "Marquess Lie of Zhao",
    cjkName: "趙烈侯",
    cjkNames: ["趙烈侯", "赵烈侯", "赵籍", "趙籍"],
    aliases: ["烈侯", "趙籍", "赵烈侯", "赵籍"],
    desc: "Ruler of the Chinese State of Zhao from 409 to 400 BCE",
    born: -451,
    died: -401,
    offices: [
      { office: "Marquess of Zhao", state: "Zhao", from: -410, to: -388 }
    ]
  },
  {
    uid: "Q574230",
    name: "Marquess Jing of Han",
    cjkName: "韓景侯",
    cjkNames: ["韓景侯", "韩景侯", "韓虔", "韓景侯虔"],
    aliases: ["Han Jinghou", "Qian", "Qían", "処", "虔", "韓景侯虔", "Маркиз Хан Джинг", "韓虔", "韩景侯"],
    desc: "Ruler of the Chinese state of Han from 408 BC to 400 BC",
    born: null,
    died: -401,
    offices: [
      { office: "Marquess of Han", state: "Han", from: -409, to: -401 }
    ]
  },
  {
    uid: "Q795945",
    name: "King Sheng of Chu",
    cjkName: "楚聲王",
    cjkNames: ["楚聲王", "楚声王", "熊當"],
    aliases: ["Chu Sheng Wang", "Xiong Dang", "熊当", "楚声王", "熊當"],
    desc: "King of Chinese state of Chu from 407 to 402 BC",
    born: null,
    died: -403,
    offices: [
      { office: "King", state: "Chu", from: -408, to: -403 }
    ]
  },
  {
    uid: "Q709741",
    name: "Duke Kang of Qi",
    cjkName: "齊康公",
    cjkNames: ["齊康公", "齐康公", "姜貸"],
    aliases: ["Lü Dai", "제강공", "Khương Thải", "姜貸"],
    desc: "Ruler of the State of Qi from 404 to 386 BC",
    born: -451,
    died: -380,
    offices: [
      { office: "Duke of Qi", state: "Qi", from: -405, to: -387 }
    ]
  },
  {
    uid: "Q1053216",
    name: "Duke Tai of Tian Qi",
    cjkName: "田和",
    cjkNames: ["田和", "齐太公", "齊太公", "田齊太公"],
    aliases: ["田和", "Điền Tề Thái công", "田齊太公", "齊太公"],
    desc: "ruler of the Chinese state of Qi from 386 to 384 BC",
    born: -451,
    died: -385,
    offices: [
      { office: "Duke of Qi", state: "Qi", from: -405, to: -385 }
    ]
  },
  {
    uid: "Q482655",
    name: "King An of Zhou",
    cjkName: "周安王",
    cjkNames: ["周安王", "周元安王", "姬驕", "姬骄"],
    aliases: ["Ji Jiao", "An wang", "Anwang", "König An von Zhou", "Zhou An wang", "Zhou Anwang", "An de Zhou", "주 안왕", "Цзі Цзяо", "周元安王", "姬驕", "姬骄"],
    desc: "Zhou Dynasty king of China from 401 to 376 BC",
    born: -451,
    died: -377,
    offices: [
      { office: "King", state: "Zhou", from: -402, to: -377 }
    ]
  },
  {
    uid: "Q795866",
    name: "King Dao of Chu",
    cjkName: "楚悼王",
    cjkNames: ["楚悼王", "熊疑"],
    aliases: ["Xiong Yi", "熊疑"],
    desc: "King of Chinese state of Chu from 401 to 381 BC",
    born: null,
    died: -382,
    offices: [
      { office: "King", state: "Chu", from: -402, to: -382 }
    ]
  },
  {
    uid: "Q197323",
    name: "Zhang Yi",
    cjkName: "张仪",
    cjkNames: ["张仪", "張儀"],
    aliases: [],
    desc: "Chinese prime minister",
    born: -401,
    died: -310,
    offices: [
    ]
  },
  {
    uid: "Q553758",
    name: "Duke Hui II of Qin",
    cjkName: "秦惠公",
    cjkNames: ["秦惠公", "秦後惠公"],
    aliases: [],
    desc: "Ruler of Qin from 399 to 387 BC",
    born: -451,
    died: -388,
    offices: [
      { office: "Duke of Qin", state: "Qin", from: -400, to: -388 }
    ]
  },
  {
    uid: "Q2890091",
    name: "Marquess Lie of Han",
    cjkName: "韓烈侯",
    cjkNames: ["韓烈侯", "韩烈侯", "韓取", "韓武侯", "韓烈侯取"],
    aliases: ["韓烈侯取", "韓取", "韓武侯"],
    desc: "Ruler of the Chinese State of Han from 399 BC to 387 BC",
    born: null,
    died: -388,
    offices: [
      { office: "Marquess of Han", state: "Han", from: -400, to: -388 }
    ]
  },
  {
    uid: "Q1058997",
    name: "Marquess Wu of Wei",
    cjkName: "魏武侯",
    cjkNames: ["魏武侯", "魏擊"],
    aliases: ["太子撃", "魏撃", "Вэйский У-хоу", "У-хоу (царство Вэй, эпоха Чжаньго)", "魏擊"],
    desc: "Chinese ruler of Wei from 396 to 370 BC",
    born: -425,
    died: -371,
    offices: [
      { office: "Marquess of Wei", state: "Wei", from: -397, to: -371 }
    ]
  },
  {
    uid: "Q40077",
    name: "Yan",
    cjkName: null,
    cjkNames: [],
    aliases: ["Иен", "Йан"],
    desc: "Wikimedia disambiguation page",
    born: null,
    died: null,
    offices: [
      { office: "Marquis of Tian (Ruler of Qi)", state: null, from: -394, to: -384 }
    ]
  },
  {
    uid: "Q351345",
    name: "Shang Yang",
    cjkName: "商鞅",
    cjkNames: ["商鞅", "公孙鞅", "公孫鞅", "商君", "衛鞅"],
    aliases: ["Wei Yang", "Yang de Shang", "Shang Yang", "Shang chün", "Shang jun", "Shang-tzu", "Shangzi", "Yang Kung-sun", "Gongsun Yang", "公孫鞅", "商オウ", "商子", "疑行は名なく、疑事は功なし", "衛鞅", "공손앙", "위앙", "Shang Yang (persoon)", "Kung-sun Jang", "Szang Jang", "Гунсунь Ян"],
    desc: "Qin State statesman, chancellor and reformer (c. 390–338 BC)",
    born: -391,
    died: -339,
    offices: [
    ]
  },
  {
    uid: "Q5312793",
    name: "Duke Huan of Jin",
    cjkName: "晋孝公",
    cjkNames: ["晋孝公", "晉孝公", "姬頎", "晋桓公"],
    aliases: ["Cơ Kỳ", "Tấn Hiếu công", "Tấn Hoàn Công", "姬頎", "晋桓公"],
    desc: "Ruler of the state of Jin from 388 to 369 BC",
    born: null,
    died: null,
    offices: [
      { office: "Duke of Jin", state: "Jin", from: -389, to: -370 }
    ]
  },
  {
    uid: "Q5918038",
    name: "Marquess Jing of Zhao",
    cjkName: "趙敬侯",
    cjkNames: ["趙敬侯", "赵敬侯", "赵敬候", "赵章"],
    aliases: ["赵敬侯", "赵敬候", "赵章"],
    desc: "Chinese ruler",
    born: null,
    died: null,
    offices: [
      { office: "Marquess of Zhao", state: "Zhao", from: -388, to: -376 }
    ]
  },
  {
    uid: "Q556181",
    name: "Chuzi II",
    cjkName: "秦出公",
    cjkNames: ["秦出公", "秦出子"],
    aliases: ["Shaozhu of Qin", "出子"],
    desc: "ruler of Chinese state of Qin from 386 to 385 BC",
    born: -386,
    died: -386,
    offices: [
      { office: "Ruler of Qin", state: "Qin", from: -387, to: -386 }
    ]
  },
  {
    uid: "Q575628",
    name: "Marquess Wen of Han",
    cjkName: "韓文侯",
    cjkNames: ["韓文侯", "韩文侯"],
    aliases: ["韩文侯"],
    desc: "Ruler of the State of Han from 386 to 377 BC",
    born: null,
    died: -378,
    offices: [
      { office: "Marquess of Han", state: "Han", from: -387, to: -378 }
    ]
  },
  {
    uid: "Q553840",
    name: "Duke Xian of Qin",
    cjkName: "秦献公",
    cjkNames: ["秦献公", "秦獻公", "嬴師隰", "秦元献公", "秦元獻公"],
    aliases: ["嬴師隰", "秦元献公", "秦元獻公"],
    desc: "Ruler of Chinese state of Qin from 384 to 362 BC",
    born: -425,
    died: -363,
    offices: [
      { office: "Duke of Qin", state: "Qin", from: -385, to: -363 }
    ]
  },
  {
    uid: "Q795860",
    name: "King Su of Chu",
    cjkName: "楚肅王",
    cjkNames: ["楚肅王", "楚肃王", "熊臧"],
    aliases: ["熊臧", "楚肃王"],
    desc: "King of Chinese state of Chu from 380 to 370 BC",
    born: null,
    died: -371,
    offices: [
      { office: "King", state: "Chu", from: -381, to: -371 }
    ]
  },
  {
    uid: "Q575286",
    name: "Duke Ai of Han",
    cjkName: "韓哀侯",
    cjkNames: ["韓哀侯", "韩哀侯"],
    aliases: ["韩哀侯"],
    desc: "Ruler of the State of Han from 376 BC to 374 BC",
    born: null,
    died: -375,
    offices: [
      { office: "Marquess of Han", state: "Han", from: -377, to: -375 }
    ]
  },
  {
    uid: "Q888530",
    name: "King Lie of Zhou",
    cjkName: "周烈王",
    cjkNames: ["周烈王", "周夷烈王", "姬喜"],
    aliases: ["König Lie von Zhou", "Lie wang", "Liewang", "Zhou Lie wang", "Zhou Liewang", "Lie de Zhou", "夷烈王", "주 열왕", "Cơ Hỷ", "周夷烈王", "姬喜"],
    desc: "Zhou Dynasty king of China from 375 to 369 BC",
    born: -401,
    died: -370,
    offices: [
      { office: "King", state: "Zhou", from: -376, to: -370 }
    ]
  },
  {
    uid: "Q6398446",
    name: "Marquess Cheng of Zhao",
    cjkName: "趙成侯",
    cjkNames: ["趙成侯", "赵成侯", "赵种", "趙種"],
    aliases: ["赵成侯", "赵种", "趙種"],
    desc: "Marquess of Zhao from 374 BCE to 350 BCE",
    born: null,
    died: -351,
    offices: [
      { office: "Marquess of Zhao", state: "Zhao", from: -376, to: -351 }
    ]
  },
  {
    uid: "Q589297",
    name: "Duke Huan of Tian Qi",
    cjkName: "田午",
    cjkNames: ["田午", "齐桓公", "齊桓公", "田齊桓公", "田齐孝武桓公", "田齐桓公", "齐孝武桓公"],
    aliases: ["田齐孝武桓公", "田齐桓公", "齐孝武桓公"],
    desc: "ruler of Qi",
    born: -401,
    died: -358,
    offices: [
      { office: "Duke of Qi", state: "Qi", from: -375, to: -358 }
    ]
  },
  {
    uid: "Q2888519",
    name: "Marquess Gong of Han",
    cjkName: "韓共侯",
    cjkNames: ["韓共侯", "韩共侯", "韓懿侯", "韓若山", "韓莊侯"],
    aliases: ["Hàn Cung hầu", "Hàn Trang hầu", "韓懿侯", "韓若山", "韓莊侯"],
    desc: "Marquess of Han from 374 BC to 363 BC",
    born: null,
    died: null,
    offices: [
      { office: "Marquess of Han", state: "Han", from: -375, to: -364 }
    ]
  },
  {
    uid: "Q943012",
    name: "Hui Shi",
    cjkName: "惠施",
    cjkNames: ["惠施", "惠子"],
    aliases: ["Huizi", "혜자", "Хуй Ши", "惠子"],
    desc: "4th century BCE Chinese philosopher of the School of Names",
    born: -371,
    died: -311,
    offices: [
    ]
  },
  {
    uid: "Q477291",
    name: "King Hui of Wei",
    cjkName: "魏惠王",
    cjkNames: ["魏惠王"],
    aliases: [],
    desc: "Chinese ruler of Wei from 369 to 319 BC",
    born: -401,
    died: -320,
    offices: [
      { office: "King", state: "Wei", from: -371, to: -320 }
    ]
  },
  {
    uid: "Q795965",
    name: "King Xuan of Chu",
    cjkName: "楚宣王",
    cjkNames: ["楚宣王", "熊良夫"],
    aliases: ["熊良夫"],
    desc: "King of Chinese state of Chu from 369 to 340 BC",
    born: -371,
    died: -341,
    offices: [
      { office: "King", state: "Chu", from: -370, to: -341 }
    ]
  },
  {
    uid: "Q887650",
    name: "King Xian of Zhou",
    cjkName: "周顯王",
    cjkNames: ["周顯王", "周显王", "周显圣王", "姬扁"],
    aliases: ["König Xian von Zhou", "Xian wang", "Xianwang", "Zhou Xian wang", "Zhou Xianwang", "Xian de Zhou", "顕声王", "주 현왕", "Cơ Biển", "周显圣王", "姬扁"],
    desc: "Zhou Dynasty king of China from 368 to 321 BC",
    born: -401,
    died: -322,
    offices: [
      { office: "King", state: "Zhou", from: -369, to: -322 }
    ]
  },
  {
    uid: "Q553245",
    name: "Duke Xiao of Qin",
    cjkName: "秦孝公",
    cjkNames: ["秦孝公", "嬴渠梁", "孝公"],
    aliases: ["Xiao de Qin", "Ying Quliang", "贏渠梁", "진효공", "嬴渠梁", "孝公"],
    desc: "ruler of the state of Qin",
    born: -382,
    died: -339,
    offices: [
      { office: "Chinese Sovereign", state: null, from: -362, to: -339 },
      { office: "Duke of Qin", state: "Qin", from: -362, to: -339 }
    ]
  },
  {
    uid: "Q579767",
    name: "King Wei of Qi",
    cjkName: "齊威王",
    cjkNames: ["齊威王", "齐威王", "田因齊"],
    aliases: ["Tian Yinqi", "Wei", "田因齊"],
    desc: "Ruler of Qi between 356 BC and 320 BC",
    born: -371,
    died: -321,
    offices: [
      { office: "King", state: "Qi", from: -357, to: -321 }
    ]
  },
  {
    uid: "Q589259",
    name: "Marquess Su of Zhao",
    cjkName: "赵肃侯",
    cjkNames: ["赵肃侯", "趙肅侯", "赵语", "趙語"],
    aliases: ["粛侯 (趙)", "趙肅侯", "赵语", "趙語"],
    desc: "ruler of Zhao in ancient China",
    born: null,
    died: -327,
    offices: [
      { office: "Marquess of Zhao", state: "Zhao", from: -351, to: -327 }
    ]
  },
  {
    uid: "Q795891",
    name: "King Wei of Chu",
    cjkName: "楚威王",
    cjkNames: ["楚威王", "熊商"],
    aliases: ["熊商"],
    desc: "King of Chu",
    born: null,
    died: -330,
    offices: [
      { office: "King", state: "Chu", from: -340, to: -330 }
    ]
  },
  {
    uid: "Q564282",
    name: "King Huiwen of Qin",
    cjkName: "秦惠文王",
    cjkNames: ["秦惠文王", "嬴駟", "惠文君", "惠文王", "秦惠文君"],
    aliases: ["Huiwen", "King Hui of Qin", "Lord Huiwen of Qin", "Hui de Qin", "Rei Hui de Qin", "Rei Huiwen de Qin", "Senyor Huiwen de Qin", "Ying Si", "恵文君", "Kralj Huiwen od Qina", "嬴駟", "惠文君", "惠文王", "秦惠文君"],
    desc: "ruler of the state of Qin",
    born: -357,
    died: -312,
    offices: [
      { office: "Chinese Sovereign", state: null, from: -339, to: -312 },
      { office: "King", state: "Qin", from: -338, to: -312 }
    ]
  },
  {
    uid: "Q3082166",
    name: "King Xuanhui of Han",
    cjkName: "韓威侯",
    cjkNames: ["韓威侯", "韩威侯", "韓宣惠王", "鄭威侯", "鄭宣王", "韓宣王", "韩宣惠王", "韩宣王"],
    aliases: ["鄭威侯", "鄭宣王", "韓宣惠王", "韓宣王", "韩威侯", "韩宣惠王", "韩宣王"],
    desc: "king of Han",
    born: null,
    died: -313,
    offices: [
      { office: "King", state: "Han", from: -333, to: -313 }
    ]
  },
  {
    uid: "Q795874",
    name: "King Huai of Chu",
    cjkName: "楚懷王",
    cjkNames: ["楚懷王", "楚怀王", "楚前懷王", "熊槐", "羋槐"],
    aliases: ["Xiong Huai", "熊槐", "羋槐", "楚前懷王"],
    desc: "King of Chu",
    born: -351,
    died: -297,
    offices: [
      { office: "King", state: "Chu", from: -329, to: -300 }
    ]
  },
  {
    uid: "Q575375",
    name: "King Wuling of Zhao",
    cjkName: "赵武灵王",
    cjkNames: ["赵武灵王", "趙武靈王", "赵主父", "赵雍"],
    aliases: ["Rey Wuling", "胡服騎射", "趙雍", "赵主父", "赵雍", "趙武靈王"],
    desc: "Zhou Dynasty King",
    born: -341,
    died: -296,
    offices: [
      { office: "King", state: "Zhao", from: -327, to: -300 }
    ]
  },
  {
    uid: "Q1185200",
    name: "King Shenjing of Zhou",
    cjkName: "周慎靚王",
    cjkNames: ["周慎靚王", "周慎靓王", "姬定"],
    aliases: ["Shenjing de Zhou", "Zhou Shenjing wang", "주 신정왕", "Zhou Shen Jing Wang", "Chu Thận Tĩnh Vương", "Cơ Định", "姬定"],
    desc: "King of Zhou Dynasty China",
    born: null,
    died: -316,
    offices: [
      { office: "King", state: "Zhou", from: -321, to: -316 }
    ]
  },
  {
    uid: "Q2650186",
    name: "King Xiang of Wei",
    cjkName: "魏襄王",
    cjkNames: ["魏襄王", "魏哀王", "魏嗣", "魏襄哀王"],
    aliases: ["Wei Si", "襄王 (魏)", "魏哀王", "Ngụy Tự", "魏嗣", "魏襄哀王"],
    desc: "king of Wei from 318 BC to 296 BC",
    born: null,
    died: null,
    offices: [
      { office: "King", state: "Wei", from: -320, to: -297 }
    ]
  },
  {
    uid: "Q580333",
    name: "King Xuan of Qi",
    cjkName: "齊宣王",
    cjkNames: ["齊宣王", "齐宣王", "田辟疆", "宣王", "田辟彊"],
    aliases: ["Tian Pijiang", "Xuanwang", "宣王", "田辟彊", "田辟疆"],
    desc: "King of Chinese state of Qi from 319 to 301 BC",
    born: null,
    died: -302,
    offices: [
      { office: "King", state: "Qi", from: -320, to: -301 }
    ]
  },
  {
    uid: "Q1279933",
    name: "King Nan of Zhou",
    cjkName: "周赧王",
    cjkNames: ["周赧王", "周延", "周隱王", "赧王"],
    aliases: ["Nan de Zhou", "Zhou Nan wang", "주 난왕", "Kralj Nan od Choua", "Chu Noãn Vương", "Cơ Duyên", "周延", "周隱王", "赧王"],
    desc: "Zhou Dynasty king of China from 314 to 256 BC",
    born: -401,
    died: -257,
    offices: [
      { office: "Wang", state: null, from: -316, to: -257 },
      { office: "King", state: "Zhou", from: -315, to: -257 }
    ]
  },
  {
    uid: "Q3178575",
    name: "King Xiang of Han",
    cjkName: "韓襄王",
    cjkNames: ["韓襄王", "韩襄王", "韓倉", "韓悼襄王", "韓襄哀王"],
    aliases: ["韓倉", "韓悼襄王", "韓襄哀王"],
    desc: "king of Han",
    born: null,
    died: -291,
    offices: [
      { office: "King", state: "Han", from: -312, to: -297 }
    ]
  },
  {
    uid: "Q564288",
    name: "King Wu of Qin",
    cjkName: "秦武王",
    cjkNames: ["秦武王", "嬴荡", "嬴蕩", "秦悼武烈王", "秦悼武王", "秦武烈王", "贏盪", "元武王", "悼武王", "武烈王", "秦元武王"],
    aliases: ["Daowu de Qin", "Daowulie de Qin", "Rei Daowu de Qin", "Rei Daowulie de Qin", "Rei Wu de Qin", "Rei Wulie de Qin", "Wulie de Qin", "Kralj Wu od Qina", "嬴荡", "嬴蕩", "秦悼武烈王", "秦悼武王", "秦武烈王", "贏盪", "元武王", "悼武王", "武烈王", "秦元武王"],
    desc: "ruler of Chinese state of Qin from 310 to 307 BC",
    born: -330,
    died: -308,
    offices: [
      { office: "King", state: "Qin", from: -311, to: -308 }
    ]
  },
  {
    uid: "Q553240",
    name: "King Zhaoxiang of Qin",
    cjkName: "秦昭襄王",
    cjkNames: ["秦昭襄王", "嬴稷", "昭襄王", "秦昭王", "秦襄王"],
    aliases: ["Zhaoxiang", "Rei Zhao de Qin", "Rei Zhaoxiang de Qin", "Zhao de Qin", "소양왕", "Kralj Zhaoxiang od Qina", "嬴稷", "昭襄王", "秦昭王", "秦襄王"],
    desc: "king of Chinese state of Qin from 307 to 251 BC",
    born: -326,
    died: -252,
    offices: [
      { office: "King", state: "Qin", from: -307, to: -252 }
    ]
  },
  {
    uid: "Q1059310",
    name: "King Min of Qi",
    cjkName: "齊湣王",
    cjkNames: ["齊湣王", "齐湣王", "田地", "閔王", "齊愍王", "齊閔王"],
    aliases: ["Minwang", "Tian Di", "湣王", "閔王", "田地", "齊愍王", "齊閔王"],
    desc: "king of Qi",
    born: -321,
    died: -285,
    offices: [
      { office: "King", state: "Qi", from: -301, to: -284 }
    ]
  },
  {
    uid: "Q589275",
    name: "King Huiwen of Zhao",
    cjkName: "趙惠文王",
    cjkNames: ["趙惠文王", "赵惠文王", "赵何"],
    aliases: ["赵何", "赵惠文王"],
    desc: "king of Zhao",
    born: -311,
    died: -267,
    offices: [
      { office: "King", state: "Zhao", from: -300, to: -267 }
    ]
  },
  {
    uid: "Q795870",
    name: "King Qingxiang of Chu",
    cjkName: "楚頃襄王",
    cjkNames: ["楚頃襄王", "楚顷襄王", "楚襄王", "熊橫"],
    aliases: ["熊横", "楚襄王", "楚顷襄王", "熊橫"],
    desc: "King of Chinese state of Chu from 298 to 263 BC",
    born: -330,
    died: -264,
    offices: [
      { office: "King", state: "Chu", from: -299, to: -264 }
    ]
  },
  {
    uid: "Q2650580",
    name: "King Zhao of Wei",
    cjkName: "魏昭王",
    cjkNames: ["魏昭王", "魏遫"],
    aliases: ["Ngụy Chính", "魏遫"],
    desc: "monarch",
    born: -351,
    died: -278,
    offices: [
      { office: "King", state: "Wei", from: -297, to: -278 }
    ]
  },
  {
    uid: "Q6412160",
    name: "King Xi of Han",
    cjkName: "韓釐王",
    cjkNames: ["韓釐王", "韓僖王", "韓咎", "韩厘王"],
    aliases: ["Hàn Hy vương", "Hàn Ly Vương", "韓僖王", "韓咎", "韩厘王"],
    desc: "ruler of the State of Han between 295 BC and until his death in 273 BC",
    born: null,
    died: -274,
    offices: [
      { office: "King", state: "Han", from: -296, to: -274 }
    ]
  },
  {
    uid: "Q716543",
    name: "Su Qin",
    cjkName: "苏秦",
    cjkNames: ["苏秦", "蘇秦"],
    aliases: ["Quý Tử", "蘇秦"],
    desc: "Chinese political strategist in the Warring States period",
    born: null,
    died: -285,
    offices: [
    ]
  },
  {
    uid: "Q589289",
    name: "King Xiang of Qi",
    cjkName: "齊襄王",
    cjkNames: ["齊襄王", "齐襄王", "田法章"],
    aliases: ["田法章"],
    desc: "king of Qi",
    born: null,
    died: -266,
    offices: [
      { office: "King", state: "Qi", from: -284, to: -266 }
    ]
  },
  {
    uid: "Q1061351",
    name: "Lord Mengchang",
    cjkName: "孟尝君",
    cjkNames: ["孟尝君", "孟嘗君", "孟嘗"],
    aliases: ["Mengchangjun", "Điền Văn", "孟嘗", "孟嘗君"],
    desc: "personal name Tian Wen",
    born: null,
    died: -280,
    offices: [
    ]
  },
  {
    uid: "Q6656338",
    name: "King Anxi of Wei",
    cjkName: "魏安僖王",
    cjkNames: ["魏安僖王", "魏安釐王", "魏圉"],
    aliases: ["Wei Yu", "魏圉"],
    desc: "King of Wei from 276 BCE to 243 BCE (the Warring States period of China)",
    born: null,
    died: null,
    offices: [
      { office: "King", state: "Wei", from: -278, to: -244 }
    ]
  },
  {
    uid: "Q575290",
    name: "King Huanhui of Han",
    cjkName: "韓桓惠王",
    cjkNames: ["韓桓惠王", "韩桓惠王", "韓悼惠王", "韓惠王"],
    aliases: ["韓悼惠王", "韓惠王", "韩桓惠王"],
    desc: "Chinese king",
    born: null,
    died: -240,
    offices: [
      { office: "King", state: "Han", from: -273, to: -240 }
    ]
  },
  {
    uid: "Q2031216",
    name: "King Wucheng of Yan",
    cjkName: "燕武成王",
    cjkNames: ["燕武成王"],
    aliases: [],
    desc: "Chinese king, ruled 271–258 BCE",
    born: null,
    died: null,
    offices: [
      { office: "King", state: "Yan", from: -272, to: -259 }
    ]
  },
  {
    uid: "Q855000",
    name: "King Xiaocheng of Zhao",
    cjkName: "趙孝成王",
    cjkNames: ["趙孝成王", "赵孝成王", "趙王丹"],
    aliases: ["赵孝成王", "趙王丹"],
    desc: "king of Zhao",
    born: null,
    died: -246,
    offices: [
      { office: "King", state: "Zhao", from: -267, to: -246 }
    ]
  },
  {
    uid: "Q589231",
    name: "Jian of Qi",
    cjkName: "齊王建",
    cjkNames: ["齊王建", "齐王建", "田建", "齊廢王", "齐废王"],
    aliases: ["斉王建", "田建", "齊廢王", "齐废王", "齐王建"],
    desc: "king of Qi from 264 to 221 BC",
    born: -281,
    died: null,
    offices: [
      { office: "King", state: "Qi", from: -265, to: -222 }
    ]
  },
  {
    uid: "Q795943",
    name: "King Kaolie of Chu",
    cjkName: "楚考烈王",
    cjkNames: ["楚考烈王", "熊元", "熊完", "羋完"],
    aliases: ["熊完", "熊元", "羋完"],
    desc: "King of Chinese state of Chu from 262 to 238 BC",
    born: null,
    died: -239,
    offices: [
      { office: "King", state: "Chu", from: -263, to: -239 }
    ]
  },
  {
    uid: "Q3883252",
    name: "King Xiao of Yan",
    cjkName: "燕孝王",
    cjkNames: ["燕孝王"],
    aliases: [],
    desc: "Chinese king of Yan state from 257 to 255 BC",
    born: null,
    died: null,
    offices: [
      { office: "King", state: "Yan", from: -258, to: -256 }
    ]
  },
  {
    uid: "Q366120",
    name: "Lü Buwei",
    cjkName: "呂不韋",
    cjkNames: ["呂不韋", "吕不韦", "吕氏", "呂氏", "文信侯"],
    aliases: ["Liu Pou-ouei", "Liu-pou-ouei", "Lu Bu Wei", "Lu Buwei", "Lu Po Wei", "Lu Po-wei", "Lü Bu Wei", "Lü Po Wei", "Lü Po-wei", "Lü Bu We", "Lu Pu wei", "Lu Pu-wei", "Lü Pu wei", "Lü Pu-wei", "Lüni Buwei", "Люй Бу Вей", "Li Bu-vei", "Ly Buwei", "Lã Bất Vy", "Lữ Bất Vi"],
    desc: "Chinese merchant and politician of the Qin state (291–235 BC)",
    born: -292,
    died: -236,
    offices: [
      { office: "Q111272723", state: null, from: -251, to: -238 },
      { office: "Grand Chancellor", state: "Qin", from: -252, to: -239 }
    ]
  },
  {
    uid: "Q1372297",
    name: "King Xiaowen of Qin",
    cjkName: "秦孝文王",
    cjkNames: ["秦孝文王", "嬴柱", "孝文王", "安国君"],
    aliases: ["Xiaowen", "Rei Xiaowen de Qin", "嬴柱", "安国君", "효문왕", "Kralj Xiaowen od Qina", "孝文王"],
    desc: "ruler of the state of Qin",
    born: -303,
    died: -251,
    offices: [
      { office: "King", state: "Qin", from: -251, to: -251 }
    ]
  },
  {
    uid: "Q1327607",
    name: "King Zhuangxiang of Qin",
    cjkName: "秦莊襄王",
    cjkNames: ["秦莊襄王", "秦庄襄王", "嬴子楚", "嬴異人", "子楚", "庄襄王", "秦異人"],
    aliases: ["Zhuangxiang", "Rei Zhuangxiang de Qin", "Ying Yiren", "Yiren", "Zichu", "嬴子楚", "嬴異人", "영자초", "장양왕", "Kralj Džuang-sjang iz dinastije Ćin", "Kralj Zhuangxiang od Qina", "Doanh Dị Nhân", "Trang Tương Vương", "Tử Sở", "子楚", "庄襄王", "秦庄襄王", "秦異人"],
    desc: "king of the Qin",
    born: -282,
    died: -248,
    offices: [
      { office: "King", state: "Qin", from: -251, to: -248 }
    ]
  },
  {
    uid: "Q714415",
    name: "Li Mu",
    cjkName: "李牧",
    cjkNames: ["李牧"],
    aliases: ["ري بوكو"],
    desc: "Chinese general for the State of Zhao",
    born: -251,
    died: -230,
    offices: [
    ]
  },
  {
    uid: "Q7192",
    name: "Qin Shi Huang",
    cjkName: "秦始皇",
    cjkNames: ["秦始皇", "秦始皇帝", "始皇帝", "嬴政", "祖龍", "秦王政", "趙政", "祖龙"],
    aliases: ["Ch'in Shih Huang", "Ch'in Shih Huang Ti", "Ch'in Shih Huang-ti", "Ch'in Shih-huang", "Ch'in Shih-huang-ti", "Chao Cheng", "Chi Hoang Ti", "Chi Hoang-ti", "Chi-hoang-ti", "Chin Shi Hwang", "Chin Shi Hwangti", "Chin Shih Huang", "Chin Shih Huang Ti", "Chin Shih Huang-ti", "Chin Shih-huang", "Chin Shih-huang-ti", "Dragon Emperor", "First Dragon", "First Emperor", "First Emperor of the Qin"],
    desc: "first emperor of Qin Dynasty",
    born: -260,
    died: -211,
    offices: [
      { office: "Emperor", state: null, from: -222, to: -211 },
      { office: "King", state: "Qin", from: -247, to: -222 },
      { office: "Qin Shi Huang (Shi Huangdi)", state: "Qin", from: -222, to: -211 }
    ]
  },
  {
    uid: "Q575298",
    name: "King Daoxiang of Zhao",
    cjkName: "趙悼襄王",
    cjkNames: ["趙悼襄王", "赵悼襄王", "趙偃"],
    aliases: ["赵悼襄王", "趙偃"],
    desc: "king of Zhao",
    born: null,
    died: -237,
    offices: [
      { office: "King", state: "Zhao", from: -246, to: -237 }
    ]
  },
  {
    uid: "Q2650093",
    name: "King Jingmin of Wei",
    cjkName: "魏景湣王",
    cjkNames: ["魏景湣王", "魏午", "魏景閔王"],
    aliases: ["Ngụy Tăng", "魏午", "魏景閔王"],
    desc: "king...circa 230BC",
    born: -251,
    died: null,
    offices: [
      { office: "King", state: "Wei", from: -244, to: -229 }
    ]
  },
  {
    uid: "Q452664",
    name: "JIA",
    cjkName: null,
    cjkNames: [],
    aliases: ["Comté de Jia"],
    desc: "Wikimedia disambiguation page",
    born: null,
    died: null,
    offices: [
      { office: "King", state: null, from: -239, to: -229 }
    ]
  },
  {
    uid: "Q10835094",
    name: "Lord Chunshen",
    cjkName: "春申君",
    cjkNames: ["春申君", "黄歇"],
    aliases: ["黄歇", "Hoàng Hiết", "Hoàng Yết", "Xuân Thân Quân"],
    desc: "Prime Minister of Chinese state of Chu (died 238 BC)",
    born: null,
    died: -239,
    offices: [
    ]
  },
  {
    uid: "Q795972",
    name: "King You of Chu",
    cjkName: "楚幽王",
    cjkNames: ["楚幽王", "熊悍"],
    aliases: ["熊悍"],
    desc: "King of Chinese state of Chu from 237 to 228 BC",
    born: null,
    died: -229,
    offices: [
      { office: "King", state: "Chu", from: -238, to: -229 }
    ]
  },
  {
    uid: "Q603372",
    name: "King Youmiu",
    cjkName: "趙幽繆王",
    cjkNames: ["趙幽繆王", "赵幽缪王", "赵王迁", "趙遷"],
    aliases: ["赵幽缪王", "赵王迁", "趙遷"],
    desc: "King of Chinese state of Zhao from 235 to 228 BC",
    born: null,
    died: null,
    offices: [
      { office: "King", state: "Zhao", from: -237, to: -229 }
    ]
  },
  {
    uid: "Q795864",
    name: "King Ai of Chu",
    cjkName: "楚哀王",
    cjkNames: ["楚哀王", "熊猶"],
    aliases: ["熊猶"],
    desc: "King of Chinese state of Chu during 228 BC",
    born: null,
    died: -229,
    offices: [
      { office: "King", state: "Chu", from: -229, to: -229 }
    ]
  },
  {
    uid: "Q985688",
    name: "Lord Changping",
    cjkName: "昌平君",
    cjkNames: ["昌平君"],
    aliases: ["Mi Qi", "Xiong Qi", "Changping Jun", "熊啓", "熊啟", "Hùng Khải", "Mị Khải"],
    desc: "Last king of Chinese state of Chu during 223 BC",
    born: null,
    died: -224,
    offices: [
      { office: "King", state: "Chu", from: -224, to: -224 }
    ]
  },
  {
    uid: "Q1121158",
    name: "Xie",
    cjkName: null,
    cjkNames: [],
    aliases: ["Xie"],
    desc: "Wikimedia disambiguation page",
    born: null,
    died: null,
    offices: [
      { office: "King", state: null, from: -220, to: -210 }
    ]
  },
  {
    uid: "Q152919",
    name: "Li Si",
    cjkName: "李斯",
    cjkNames: ["李斯"],
    aliases: ["Li Ssu", "Li Ssû", "Li Si", "Li Sy", "Li S'", "หลี่ซือ", "Lí Tư"],
    desc: "Chinese politician of the Qin Dynasty",
    born: -281,
    died: -209,
    offices: [
      { office: "Grand Chancellor", state: "Qin", from: -219, to: -209 }
    ]
  },
  {
    uid: "Q699882",
    name: "Chen Sheng",
    cjkName: "陈胜",
    cjkNames: ["陈胜", "陳勝", "陈涉", "陳涉"],
    aliases: ["Chan Shing", "Chan Sing", "陳渉", "陳涉", "Czen Szeng", "Чен Шэ", "Чэнь Шэн", "Trần Thiệp", "陈涉", "陳勝"],
    desc: "Qin Dynasty rebel",
    born: -251,
    died: -209,
    offices: [
      { office: "King", state: "Chu", from: -211, to: -210 }
    ]
  },
  {
    uid: "Q7196",
    name: "Qin Er Shi",
    cjkName: "秦二世",
    cjkNames: ["秦二世", "嬴胡亥", "秦二世皇帝", "二世皇帝", "胡亥"],
    aliases: ["Huhai", "Ying Huhai", "Qín Èr Shì", "Zweiter Kaiser der Qín", "Èr Shì Huángdì", "二世皇帝", "嬴胡亥", "秦二世", "胡亥"],
    desc: "emperor of the Qin Dynasty",
    born: -231,
    died: -208,
    offices: [
      { office: "Emperor", state: null, from: -211, to: -208 },
      { office: "Chinese Sovereign", state: null, from: -211, to: -208 },
      { office: "Qin Er Shi", state: "Qin", from: -211, to: -208 }
    ]
  },
  {
    uid: "Q3773184",
    name: "Jing Ju",
    cjkName: "景駒",
    cjkNames: ["景駒", "景驹"],
    aliases: [],
    desc: "One of the leaders during the Dazexiang Uprising against the Qin dynasty",
    born: -202,
    died: -209,
    offices: [
      { office: "King", state: "Chu", from: -210, to: -209 }
    ]
  },
  {
    uid: "Q1207474",
    name: "Emperor Yi of Chu",
    cjkName: "楚義帝",
    cjkNames: ["楚義帝", "楚义帝", "后怀王", "楚後懷王", "楚怀王", "熊心", "羋心", "義帝", "楚后怀王"],
    aliases: ["Rei Huai II de Chu", "Xiong Xin", "熊心", "羋心", "后怀王", "楚义帝", "楚後懷王", "楚怀王", "義帝", "楚后怀王"],
    desc: "king of Chinese state of Chu from 208 to 206 BC",
    born: -351,
    died: -207,
    offices: [
      { office: "Chinese Sovereign", state: null, from: -209, to: -207 }
    ]
  },
  {
    uid: "Q197436",
    name: "Zhao Gao",
    cjkName: "赵高",
    cjkNames: ["赵高", "趙高"],
    aliases: ["Chiu Ko", "Gao Zhao", "趙高"],
    desc: "Qin dynasty politician",
    born: -301,
    died: -208,
    offices: [
      { office: "Grand Chancellor", state: "Qin", from: -209, to: -208 }
    ]
  },
  {
    uid: "Q7203",
    name: "Ziying",
    cjkName: "子婴",
    cjkNames: ["子婴", "秦王子嬰", "秦子婴"],
    aliases: ["Qin San Shi", "Sān Shì Huángdì", "嬴子嬰", "秦三世", "秦王子嬰", "Tần Tam Thế", "秦子婴"],
    desc: "third and last ruler of the Qin dynasty during 207 BC",
    born: -240,
    died: -207,
    offices: [
      { office: "Chinese Sovereign", state: null, from: -208, to: -208 }
    ]
  },
  {
    uid: "Q7210",
    name: "Emperor Gaozu of Han",
    cjkName: "刘邦",
    cjkNames: ["刘邦", "劉邦", "漢太祖高皇帝", "刘季", "太祖", "季", "汉高祖", "漢高祖", "赤帝子", "高皇帝", "高祖", "汉王", "劉季", "漢王"],
    aliases: ["Emperor liu bang", "Gao Zu", "Gaozu", "Han Wang", "Ji", "King of Han", "Liu Bang", "Liou Pang", "Kaiser Gao von Han", "Liú Bāng", "高祖", "유방", "전한 고조", "한 고조", "劉邦", "太祖", "季", "高皇帝", "ᡥᠠᠨ᠋ ᡤᡠᡵᡠᠨ ᡳ ᡬᠠᠣ ᡯᡠ", "ᡬᠠᠣ ᡯᡠ (ᡥᠠᠨ᠋ ᡤᡠᡵᡠᠨ)"],
    desc: "founding emperor of the Han dynasty (256–195 BC)",
    born: -257,
    died: -196,
    offices: [
      { office: "Emperor", state: null, from: -203, to: -196 },
      { office: "King", state: null, from: -207, to: -203 },
      { office: "Chinese Sovereign", state: null, from: -203, to: -196 },
      { office: "Emperor", state: "Western)", from: -203, to: -196 }
    ]
  },
  {
    uid: "Q182266",
    name: "Xiang Yu",
    cjkName: "项羽",
    cjkNames: ["项羽", "項羽", "西楚霸王", "楚重瞳", "楚霸王", "項籍", "项籍", "項王"],
    aliases: ["Xiang Ji", "項籍", "Hạng Võ", "楚重瞳", "楚霸王", "西楚霸王", "項羽", "项籍", "項王"],
    desc: "Chinese military leader",
    born: -233,
    died: -203,
    offices: [
      { office: "Chinese Sovereign", state: null, from: -207, to: -203 },
      { office: "King", state: "Chu", from: -207, to: -203 }
    ]
  },
  {
    uid: "Q1368034",
    name: "Xiao He",
    cjkName: "萧何",
    cjkNames: ["萧何", "蕭何", "文终侯", "漢酇文終侯蕭何"],
    aliases: ["しょう か", "シャオ・ヘー", "漢酇文終侯蕭何", "เซี่ยวเหอ", "文终侯", "蕭何"],
    desc: "Han dynasty chancellor",
    born: -258,
    died: -194,
    offices: [
      { office: "Chancellor", state: "Han", from: -207, to: -194 }
    ]
  },
  {
    uid: "Q7214",
    name: "Emperor Hui of Han",
    cjkName: "漢惠帝",
    cjkNames: ["漢惠帝", "汉惠帝", "漢孝惠皇帝", "劉盈", "孝惠皇帝", "惠帝"],
    aliases: ["Hui Di", "Liu Ying", "劉盈", "孝恵皇帝", "유영", "한 효혜황제", "孝惠皇帝", "惠帝", "漢惠帝", "ᡥᠠᠨ᠋ ᡤᡠᡵᡠᠨ ᡳ ᡥᡡᡳ ᡥᡡᠸᠠᠩᡩᡳ"],
    desc: "emperor of the Han dynasty",
    born: -214,
    died: -189,
    offices: [
      { office: "Emperor", state: null, from: -196, to: -189 },
      { office: "Crown Prince", state: null, from: -203, to: -196 },
      { office: "Emperor", state: "Western)", from: -196, to: -189 }
    ]
  },
  {
    uid: "Q298039",
    name: "Empress Lü Zhi",
    cjkName: null,
    cjkNames: [],
    aliases: ["Lu Zhi", "Lü Zhi", "lv Zhi"],
    desc: "Empress Regent of the Han dynasty (241–180 BC)",
    born: -242,
    died: -181,
    offices: [
      { office: "Empress Consort", state: null, from: -203, to: -196 },
      { office: "Empress Dowager", state: null, from: -196, to: -181 },
      { office: "Regent", state: null, from: -189, to: -181 }
    ]
  },
  {
    uid: "Q7221",
    name: "Emperor Wen of Han",
    cjkName: "漢文帝",
    cjkNames: ["漢文帝", "汉文帝", "漢太宗孝文皇帝", "劉恆", "太宗", "孝文皇帝", "文帝", "刘恒"],
    aliases: ["Civilized Emperor of the Han", "Emperor Ven", "Emperor Ven-ti", "Emperor Wen", "Emperor Wen-ti", "Emperor Wendi", "Han T'ai-tsung", "Han Tai-tsung", "Han Taizong", "Han Wen-ti", "Han Wendi", "Han-t'ai-tsung", "Han-tai-tsung", "Han-wen-ti", "Literary Emperor of the Han", "Liu Heng", "T'ai-tsung", "Tai-tsung", "Taizong", "Ven of Han"],
    desc: "emperor of the Han dynasty",
    born: -204,
    died: -158,
    offices: [
      { office: "Emperor", state: null, from: -181, to: -158 },
      { office: "King", state: null, from: -197, to: -181 },
      { office: "Emperor", state: "Western)", from: -181, to: -158 }
    ]
  },
  {
    uid: "Q126832",
    name: "Cao Shen",
    cjkName: "曹参",
    cjkNames: ["曹参", "曹參"],
    aliases: ["Jingbo", "懿侯", "敬伯"],
    desc: "Han dynasty chancellor",
    born: -301,
    died: -191,
    offices: [
      { office: "Chancellor", state: "Han", from: -194, to: -191 }
    ]
  },
  {
    uid: "Q707658",
    name: "Chen Ping",
    cjkName: "陈平",
    cjkNames: ["陈平", "陳平"],
    aliases: ["陳平"],
    desc: "Han dynasty politician",
    born: -251,
    died: -179,
    offices: [
      { office: "Chancellor", state: "Han", from: -191, to: -180 }
    ]
  },
  {
    uid: "Q7217",
    name: "Liu Gong",
    cjkName: "西漢前少帝",
    cjkNames: ["西漢前少帝", "西汉前少帝", "漢少帝恭", "刘恭", "劉恭"],
    aliases: ["Emperor Qianshao of Han", "Liou Kung", "Kaiser Qianshao von Han", "Λιού Γκονγκ", "前少帝", "劉恭", "劉某", "한 소황제", "Liu Gong", "刘恭", "西汉前少帝"],
    desc: "emperor of the Han Dynasty",
    born: -194,
    died: -185,
    offices: [
      { office: "Emperor", state: null, from: -189, to: -185 },
      { office: "Emperor", state: "Western)", from: -189, to: -185 }
    ]
  },
  {
    uid: "Q7220",
    name: "Emperor Houshao of Han",
    cjkName: "劉弘",
    cjkNames: ["劉弘", "刘弘", "漢少帝弘", "汉后少帝", "西汉后少帝"],
    aliases: ["Liu Hong", "Liou Chung", "Kaiser Houshao von Han", "後少帝", "유홍", "한 소황제", "劉弘", "刘弘", "汉后少帝", "西汉后少帝"],
    desc: "emperor of the Han dynasty",
    born: -197,
    died: -181,
    offices: [
      { office: "Emperor", state: null, from: -185, to: -181 },
      { office: "Emperor", state: "Western)", from: -185, to: -181 }
    ]
  },
  {
    uid: "Q7224",
    name: "Emperor Jing of Han",
    cjkName: "汉景帝",
    cjkNames: ["汉景帝", "漢景帝", "漢孝景皇帝", "劉啟", "孝景皇帝", "景帝"],
    aliases: ["Jing Di", "Liu Qi", "Liu Qi (3)", "劉啓", "孝景皇帝", "유계", "한 효경황제", "劉啟", "景帝", "漢景帝", "Імператор Цзін"],
    desc: "emperor of the Han Dynasty",
    born: -189,
    died: -142,
    offices: [
      { office: "Emperor", state: null, from: -158, to: -142 },
      { office: "Crown Prince", state: null, from: -181, to: -158 },
      { office: "Emperor", state: "Western)", from: -158, to: -142 }
    ]
  },
  {
    uid: "Q847632",
    name: "Guan Ying",
    cjkName: "灌嬰",
    cjkNames: ["灌嬰", "灌婴"],
    aliases: [],
    desc: "han dynasty general and official (died 176 BCE)",
    born: null,
    died: -177,
    offices: [
    ]
  },
  {
    uid: "Q3235773",
    name: "Zhou Yafu",
    cjkName: "周亚夫",
    cjkNames: ["周亚夫", "周亞夫"],
    aliases: ["周亞夫"],
    desc: "Han Dynasty general",
    born: -151,
    died: -144,
    offices: [
      { office: "Chancellor", state: "Han", from: -158, to: -148 }
    ]
  },
  {
    uid: "Q7225",
    name: "Emperor Wu of Han",
    cjkName: "漢武帝",
    cjkNames: ["漢武帝", "汉武帝", "漢世宗孝武皇帝", "世宗", "劉徹", "孝武皇帝", "武帝"],
    aliases: ["Emperor Vou", "Emperor Vou-ti", "Emperor Vu", "Emperor Vu-ti", "Emperor Wu", "Emperor Wu-ti", "Emperor Wudi", "Han Shih-tsung", "Han Shizong", "Han Wu-ti", "Han Wudi", "Han-shih-tsung", "Han-wu-ti", "Liu Ch'e", "Liu Che", "Martial Emperor of the Han", "Shi Zong", "Shih Tsung", "Shih-tsung", "Shizong"],
    desc: "seventh emperor of the Han dynasty of China (157 BC–87 BC)",
    born: -157,
    died: -88,
    offices: [
      { office: "Emperor", state: null, from: -142, to: -88 },
      { office: "Crown Prince", state: null, from: -151, to: -142 },
      { office: "Emperor", state: "Western)", from: -142, to: -88 }
    ]
  },
  {
    uid: "Q1193185",
    name: "Huo Guang",
    cjkName: "霍光",
    cjkNames: ["霍光"],
    aliases: ["Хуо Гуан", "หัวกวง", "ฮั่วกวง", "Hoắc Tử Mạnh"],
    desc: "politician and regent",
    born: -151,
    died: -69,
    offices: [
    ]
  },
  {
    uid: "Q706804",
    name: "Liu Yan",
    cjkName: "劉縯",
    cjkNames: ["劉縯", "刘縯", "刘伯升"],
    aliases: ["Bosheng", "Líu Yǎn", "劉伯升", "斉武王", "刘伯升"],
    desc: "1st century Chinese general who led an uprising against Xin Dynasty",
    born: -101,
    died: 23,
    offices: [
    ]
  },
  {
    uid: "Q7227",
    name: "Emperor Zhao of Han",
    cjkName: "漢昭帝",
    cjkNames: ["漢昭帝", "汉昭帝", "漢孝昭皇帝", "劉弗陵", "孝昭皇帝", "昭帝"],
    aliases: ["Liu Fuling", "Zhao Di", "Liou Fu-ling", "Čao Ti", "劉弗陵", "孝昭皇帝", "유불릉", "한 효소황제", "昭帝", "漢昭帝", "Liú Fúlíng", "Сяочжао-ди"],
    desc: "emperor of the Han Dynasty",
    born: -95,
    died: -75,
    offices: [
      { office: "Emperor", state: null, from: -88, to: -75 },
      { office: "Emperor", state: "Western)", from: -88, to: -75 }
    ]
  },
  {
    uid: "Q7230",
    name: "Emperor Xuan of Han",
    cjkName: "漢宣帝",
    cjkNames: ["漢宣帝", "汉宣帝", "漢中宗孝宣皇帝", "中宗", "劉詢", "孝宣皇帝", "宣帝"],
    aliases: ["Liu Bingyi", "Liu Xun", "Xuan Di", "Zhong Zong", "中宗", "劉病已", "劉詢", "孝宣皇帝", "次卿", "유순", "한 중종", "한 효선황제", "宣帝", "漢宣帝", "汉宣帝"],
    desc: "emperor of the Han Dynasty",
    born: -92,
    died: -49,
    offices: [
      { office: "Emperor", state: null, from: -75, to: -49 },
      { office: "Emperor", state: "Western)", from: -75, to: -49 }
    ]
  },
  {
    uid: "Q7228",
    name: "Prince of Changyi",
    cjkName: "劉賀",
    cjkNames: ["劉賀", "刘贺", "漢廢帝昌邑王", "昌邑王", "海昏侯"],
    aliases: ["Changyi Prince", "Haihun Marquess", "Liu He", "Marquess of Haihun", "Prince He of Changyi", "廃帝", "昌邑王", "漢廃帝", "유하", "창읍왕", "한 폐제", "劉賀", "Vorst He van Changyi", "Лю Хэ", "Чанъи-ван Хэ", "刘贺", "海昏侯"],
    desc: "Emperor of the Han dynasty (92–59 BC)",
    born: -93,
    died: -60,
    offices: [
      { office: "Emperor", state: null, from: -75, to: -75 },
      { office: "Marquis of Haihun (Liu He Contested) (Han", state: "Western)", from: -75, to: -75 }
    ]
  },
  {
    uid: "Q712348",
    name: "Wu Han",
    cjkName: "吳漢",
    cjkNames: ["吳漢", "吴汉"],
    aliases: [],
    desc: "1st century CE Eastern Han dynasty general",
    born: -51,
    died: 44,
    offices: [
    ]
  },
  {
    uid: "Q7232",
    name: "Emperor Yuan of Han",
    cjkName: "漢元帝",
    cjkNames: ["漢元帝", "汉元帝", "漢孝元皇帝", "劉奭", "孝元皇帝", "高宗"],
    aliases: ["Han Yuandi", "Liu Shi", "Xiaoyuanhuangdi", "Liou Š'", "劉奭", "유석", "한 효원황제", "孝元皇帝", "高宗", "Keiser Yuán av Hàn", "Liú Shì", "Xiàoyuán", "Лю Ши", "汉元帝"],
    desc: "emperor of the Han dynasty",
    born: -76,
    died: -34,
    offices: [
      { office: "Emperor", state: null, from: -49, to: -34 },
      { office: "Emperor", state: "Western)", from: -49, to: -34 }
    ]
  },
  {
    uid: "Q7234",
    name: "Emperor Chengdy of Han",
    cjkName: "漢成帝",
    cjkNames: ["漢成帝", "汉成帝", "漢孝成皇帝", "劉驁", "劉鶩", "孝成皇帝", "統宗"],
    aliases: ["Han Chengdi", "Liu Wu", "Liu Yao", "Xiaochenghuangdi", "Liu Ao", "劉驁", "太孫", "孝成皇帝", "統宗", "유오", "한 효성황제", "劉鶩", "汉成帝"],
    desc: "emperor of the Han Dynasty",
    born: -52,
    died: -8,
    offices: [
      { office: "Emperor", state: null, from: -34, to: -8 },
      { office: "Emperor", state: "Western)", from: -34, to: -8 }
    ]
  },
  {
    uid: "Q7237",
    name: "Emperor Ai of Han",
    cjkName: "汉哀帝",
    cjkNames: ["汉哀帝", "劉欣", "漢孝哀皇帝", "刘欣", "孝哀皇帝"],
    aliases: ["Liu Xin", "劉欣", "孝哀皇帝", "유흔", "한 효애황제", "刘欣"],
    desc: "emperor of the Han dynasty",
    born: -25,
    died: -2,
    offices: [
      { office: "Emperor", state: null, from: -8, to: -2 },
      { office: "Emperor", state: "Western)", from: -8, to: -2 }
    ]
  },
  {
    uid: "Q7244",
    name: "Emperor Ping of Han",
    cjkName: "汉平帝",
    cjkNames: ["汉平帝", "劉衎", "漢孝平皇帝", "元宗", "刘箕子", "刘衎", "孝平皇帝"],
    aliases: ["Han Pingdi", "Liu Kan", "Xiaoping", "元宗", "劉箕子", "劉衎", "孝平皇帝", "유간", "한 효평황제", "刘箕子", "刘衎"],
    desc: "emperor of the Han dynasty",
    born: -10,
    died: 6,
    offices: [
      { office: "Emperor", state: null, from: -2, to: 6 },
      { office: "Emperor", state: "Western)", from: -2, to: 6 }
    ]
  },
  {
    uid: "Q7247",
    name: "Ruzi Ying",
    cjkName: "孺子嬰",
    cjkNames: ["孺子嬰", "孺子婴", "劉嬰", "漢孺子嬰", "刘婴"],
    aliases: ["Liu Ying", "The infant Ying", "Ruzi Ying", "劉嬰", "유영", "정안공", "Liu Ying (Han)", "刘婴"],
    desc: "Last Western Han dynasty ruler from 6 to 9 CE",
    born: 5,
    died: 25,
    offices: [
      { office: "Emperor", state: null, from: 6, to: 9 },
      { office: "Emperor", state: null, from: 24, to: 25 },
      { office: "Ruzi Ying (Contested) (Han", state: "Western)", from: 6, to: 9 }
    ]
  },
  {
    uid: "Q7250",
    name: "Wang Mang",
    cjkName: "王莽",
    cjkNames: ["王莽"],
    aliases: ["Jujun", "Wang Mang", "巨君", "Ѓуѓуен"],
    desc: "Han dynasty official and founding Emperor of the Xin Dynasty (c.45 BC-23 AD)",
    born: -46,
    died: 23,
    offices: [
      { office: "Emperor", state: null, from: 9, to: 23 },
      { office: "Wang Mang", state: "Xin", from: 9, to: 23 }
    ]
  },
  {
    uid: "Q7262",
    name: "Emperor Gengshi of Han",
    cjkName: "汉更始帝",
    cjkNames: ["汉更始帝", "劉玄", "漢更始帝", "刘玄", "更始帝"],
    aliases: ["Gengshi Emperor", "Liu Xuan", "Prince of Huaiyang", "Shenggong", "劉玄", "淮陽王", "聖公", "刘玄", "更始帝", "漢更始帝"],
    desc: "1st century AD Emperor of the Han dynasty (r. 23-25 AD)",
    born: null,
    died: 25,
    offices: [
      { office: "Emperor", state: null, from: 23, to: 25 },
      { office: "Emperor", state: "Interregnum)", from: 23, to: 25 }
    ]
  },
  {
    uid: "Q1280296",
    name: "Deng Yu",
    cjkName: "邓禹",
    cjkNames: ["邓禹", "鄧禹", "高密侯"],
    aliases: ["Gaomihou", "高密侯", "鄧禹"],
    desc: "Eastern Han dynasty general and official (2-58 CE) (2-58)",
    born: 2,
    died: 58,
    offices: [
      { office: "Chancellor", state: "Han", from: 25, to: 27 }
    ]
  },
  {
    uid: "Q7268",
    name: "Emperor Guangwu of Han",
    cjkName: "汉光武帝",
    cjkNames: ["汉光武帝", "漢光武帝", "漢世祖光武皇帝", "光武帝", "光武皇帝", "劉秀", "汉世祖", "漢世祖", "世祖"],
    aliases: ["Guangwu Di", "Liu Xiu", "Shi Zu", "世祖", "光武皇帝", "劉秀", "文叔", "유수", "한 세조", "光武帝", "漢光武帝", "ᡧᡳ ᡯᡠ (ᡥᠠᠨ᠋ ᡤᡠᡵᡠᠨ)", "Han Guangwudi", "Hán Thế Tổ", "Lưu Tú", "Quang Vũ Đế", "Văn Thúc", "汉世祖", "漢世祖"],
    desc: "emperor and founder of the Eastern Han Dynasty (5 BC - AD 57) (r. AD 25 - AD 57)",
    born: -6,
    died: 57,
    offices: [
      { office: "Emperor", state: null, from: 25, to: 57 },
      { office: "Emperor", state: "Eastern)", from: 25, to: 57 }
    ]
  },
  {
    uid: "Q7271",
    name: "Emperor Ming of Han",
    cjkName: "漢明帝",
    cjkNames: ["漢明帝", "汉明帝", "漢顯宗孝明皇帝", "刘庄", "劉莊", "孝明皇帝", "明帝", "顯宗"],
    aliases: ["Han Mingdi", "Liu Zhuang", "Ming Di", "Xian Zong", "劉荘", "劉陽", "子麗", "孝明皇帝", "顕宗", "유장", "한 현종", "한 효명황제", "劉莊", "明帝", "顯宗", "刘庄", "汉明帝"],
    desc: "Emperor of the Han dynasty (AD 28-75) (ruled 58-75)",
    born: 28,
    died: 75,
    offices: [
      { office: "Emperor", state: null, from: 57, to: 75 },
      { office: "Crown Prince", state: null, from: 43, to: 57 },
      { office: "Emperor", state: "Eastern)", from: 57, to: 75 }
    ]
  },
  {
    uid: "Q717497",
    name: "Chen Fan",
    cjkName: "陈蕃",
    cjkNames: ["陈蕃", "陳蕃"],
    aliases: ["Zhongju"],
    desc: "Chinese Han dynasty official (died 168)",
    born: 50,
    died: 168,
    offices: [
    ]
  },
  {
    uid: "Q1251323",
    name: "Dou Xian",
    cjkName: "竇憲",
    cjkNames: ["竇憲", "窦宪"],
    aliases: ["窦宪"],
    desc: "1st century Chinese general",
    born: 50,
    died: 92,
    offices: [
    ]
  },
  {
    uid: "Q7277",
    name: "Emperor Zhang of Han",
    cjkName: "漢章帝",
    cjkNames: ["漢章帝", "汉章帝", "漢肅宗孝章皇帝", "劉炟", "孝章皇帝", "章帝", "肅宗", "刘炟"],
    aliases: ["Han Zhangdi", "Liu Da", "Su Zong", "Suzong", "Xiaozhang", "Zhang Di", "Čang-ti", "劉炟", "孝章皇帝", "粛宗", "유달", "한 숙종", "한 효장황제", "章帝", "肅宗", "Keiser Zhāng av Hàn", "Líu Dá", "Sùzōng", "Xiàozhāng", "汉章帝"],
    desc: "Emperor of the Chinese Han Dynasty (AD 56 – 88) (ruled 75 – 88)",
    born: 57,
    died: 88,
    offices: [
      { office: "Emperor", state: null, from: 75, to: 88 },
      { office: "Crown Prince", state: null, from: 60, to: 75 },
      { office: "Emperor", state: "Eastern)", from: 75, to: 88 }
    ]
  },
  {
    uid: "Q7280",
    name: "Emperor He of Han",
    cjkName: "漢和帝",
    cjkNames: ["漢和帝", "汉和帝", "漢孝和皇帝", "刘肇", "劉肇", "和帝", "孝和皇帝", "穆宗"],
    aliases: ["He Di", "Liu Zhao", "Muzong", "Xiaohe", "劉肇", "孝和皇帝", "穆宗", "유조", "한 효화황제", "和帝", "刘肇", "汉和帝"],
    desc: "emperor of the Han Dynasty",
    born: 79,
    died: 106,
    offices: [
      { office: "Emperor", state: null, from: 88, to: 106 },
      { office: "Crown Prince", state: null, from: 82, to: 88 },
      { office: "Emperor", state: "Eastern)", from: 88, to: 106 }
    ]
  },
  {
    uid: "Q10333344",
    name: "Li Gu",
    cjkName: "李固",
    cjkNames: ["李固"],
    aliases: [],
    desc: "Eastern Han Dynasty person CBDB = 23153",
    born: 90,
    died: 147,
    offices: [
    ]
  },
  {
    uid: "Q1251330",
    name: "Dou Wu",
    cjkName: "窦武",
    cjkNames: ["窦武", "竇武"],
    aliases: ["游平", "竇武"],
    desc: "Chinese Han Dynasty politician and scholar (died 168)",
    born: 100,
    died: 168,
    offices: [
    ]
  },
  {
    uid: "Q180694",
    name: "Yuan An",
    cjkName: "袁安",
    cjkNames: ["袁安"],
    aliases: [],
    desc: "first century Han dynasty scholar, administrator and statesman",
    born: 100,
    died: 92,
    offices: [
    ]
  },
  {
    uid: "Q5364517",
    name: "Cui Lin",
    cjkName: "崔林",
    cjkNames: ["崔林"],
    aliases: ["Chui Lam"],
    desc: "Chinese Cao Wei official (died 245)",
    born: 101,
    died: 244,
    offices: [
    ]
  },
  {
    uid: "Q1068053",
    name: "Fan Jian",
    cjkName: "樊建",
    cjkNames: ["樊建"],
    aliases: [],
    desc: "3rd century Chinese Shu Han official",
    born: 101,
    died: null,
    offices: [
    ]
  },
  {
    uid: "Q1120512",
    name: "Huangfu Song",
    cjkName: "皇甫嵩",
    cjkNames: ["皇甫嵩"],
    aliases: ["義真"],
    desc: "Chinese Han dynasty general (died 195)",
    born: 101,
    died: 195,
    offices: [
    ]
  },
  {
    uid: "Q710072",
    name: "Liu Yu",
    cjkName: "劉虞",
    cjkNames: ["劉虞", "刘虞"],
    aliases: ["伯安", "유백안"],
    desc: "Chinese warlord and politician in the late Eastern Han dynasty",
    born: 101,
    died: 193,
    offices: [
    ]
  },
  {
    uid: "Q4163141",
    name: "Ma Midi",
    cjkName: "馬日磾",
    cjkNames: ["馬日磾", "马日磾"],
    aliases: ["馬日テイ", "Mã Nhật Đê"],
    desc: "Chinese Eastern Han dynasty official (died 194)",
    born: 101,
    died: 194,
    offices: [
    ]
  },
  {
    uid: "Q7285",
    name: "Emperor An of Han",
    cjkName: "漢安帝",
    cjkNames: ["漢安帝", "汉安帝", "漢孝安皇帝", "刘祐", "劉祐", "孝安皇帝", "安帝", "恭宗"],
    aliases: ["An Di", "Gong Zong", "Gongzong", "Han Andi", "Liu You", "Xiaoan", "劉祜", "孝安皇帝", "恭宗", "유호", "한 효안황제", "劉祐", "安帝", "刘祐", "汉安帝"],
    desc: "Han dynasty Emperor from 106 to 125",
    born: 94,
    died: 125,
    offices: [
      { office: "Emperor", state: null, from: 106, to: 125 },
      { office: "Emperor", state: "Eastern)", from: 106, to: 125 }
    ]
  },
  {
    uid: "Q7282",
    name: "Emperor Shang of Han",
    cjkName: "漢殤帝",
    cjkNames: ["漢殤帝", "汉殇帝", "漢孝殤皇帝", "刘隆", "劉隆", "孝殤皇帝", "殤帝"],
    aliases: ["Han Shangdi", "Liu Long", "Shang Di", "Xiaoshang", "劉隆", "孝殤皇帝", "유융", "한 효상황제", "殤帝", "刘隆", "汉殇帝"],
    desc: "infant emperor of the Han dynasty during 106",
    born: 105,
    died: 106,
    offices: [
      { office: "Emperor", state: null, from: 106, to: 106 },
      { office: "Emperor", state: "Eastern)", from: 106, to: 106 }
    ]
  },
  {
    uid: "Q1042922",
    name: "Qiao Xuan",
    cjkName: "橋玄",
    cjkNames: ["橋玄", "桥玄", "公祖", "喬玄"],
    aliases: ["喬玄", "교국로", "Công Tổ", "公祖"],
    desc: "Han dynasty official and general (110-184)",
    born: 109,
    died: 183,
    offices: [
    ]
  },
  {
    uid: "Q7289",
    name: "Emperor Shun of Han",
    cjkName: "漢順帝",
    cjkNames: ["漢順帝", "汉顺帝", "漢孝順皇帝", "刘保", "劉保", "孝順皇帝", "敬宗", "順帝"],
    aliases: ["Han Shundi", "Jingzong", "Liu Bao", "Shun Di", "Xiaoshun", "劉保", "孝順皇帝", "敬宗", "유보", "한 효순황제", "順帝", "刘保", "汉顺帝"],
    desc: "Han dynasty Emperor from 125 to 144",
    born: 115,
    died: 144,
    offices: [
      { office: "Emperor", state: null, from: 125, to: 144 },
      { office: "Crown Prince", state: null, from: 120, to: 124 },
      { office: "Emperor", state: "Eastern)", from: 125, to: 144 }
    ]
  },
  {
    uid: "Q7288",
    name: "Marquess of Beixiang",
    cjkName: "刘懿",
    cjkNames: ["刘懿", "劉懿", "漢少帝懿"],
    aliases: ["Beixiang Hou", "Emperor Shao", "Liu Yi", "劉懿", "北郷侯", "북향후", "유의", "전소제"],
    desc: "emperor of the Han dynasty",
    born: 50,
    died: 125,
    offices: [
      { office: "Emperor", state: null, from: 125, to: 125 },
      { office: "Marquess of Beixiang (Contested) (Han", state: "Eastern)", from: 125, to: 125 }
    ]
  },
  {
    uid: "Q5250341",
    name: "Xun Shuang",
    cjkName: "荀爽",
    cjkNames: ["荀爽"],
    aliases: [],
    desc: "Chinese essayist, politician and writer (128–190",
    born: 128,
    died: 190,
    offices: [
    ]
  },
  {
    uid: "Q714428",
    name: "He Jin",
    cjkName: "何进",
    cjkNames: ["何进", "何進", "河珍"],
    aliases: ["General Jin", "Suigao", "الجنرال جين", "하수고", "Hà Tiến, Hà Trung", "何進", "河珍"],
    desc: "Han dynasty regent and general (died 189)",
    born: 135,
    died: 189,
    offices: [
    ]
  },
  {
    uid: "Q283105",
    name: "Wang Yun",
    cjkName: "王允",
    cjkNames: ["王允"],
    aliases: [],
    desc: "Han dynasty politician and official (137–192)",
    born: 137,
    died: 192,
    offices: [
    ]
  },
  {
    uid: "Q334081",
    name: "Dong Zhuo",
    cjkName: "董卓",
    cjkNames: ["董卓", "董仲穎", "漢郿侯"],
    aliases: ["Dong Zhongying", "Tong Tcho", "Tung Cheuk", "Tung Chung-ying", "Tung Chuo", "دونگ ژئو", "Dǒng Zhuō", "Dong Zhongyin", "Dhong Zhuo", "仲穎", "동 탁", "동중영", "漢郿侯", "董仲穎", "Tung Czo", "Trọng Dĩnh", "Dǒng Zhòngyǐng", "仲颖", "董仲颖"],
    desc: "Chinese general and warlord during the late Han (2nd century)",
    born: 139,
    died: 192,
    offices: [
    ]
  },
  {
    uid: "Q7292",
    name: "Emperor Chong of Han",
    cjkName: "汉冲帝",
    cjkNames: ["汉冲帝", "漢沖帝", "漢孝沖皇帝", "刘炳", "劉炳", "孝沖皇帝", "沖帝"],
    aliases: ["Chong Di", "Han Chongdi", "Liu Bing", "Talanda", "Xiaochong", "劉炳", "孝沖皇帝", "유병", "한 효충황제", "沖帝", "刘炳"],
    desc: "Emperor of the Han dynasty from 144 to 145",
    born: 143,
    died: 145,
    offices: [
      { office: "Emperor", state: null, from: 144, to: 145 },
      { office: "Crown Prince", state: null, from: 144, to: 144 },
      { office: "Emperor", state: "Eastern)", from: 144, to: 145 }
    ]
  },
  {
    uid: "Q7293",
    name: "Emperor Zhi of Han",
    cjkName: "漢質帝",
    cjkNames: ["漢質帝", "汉质帝", "漢孝質皇帝", "刘缵", "劉纘", "孝質皇帝", "質帝"],
    aliases: ["Han Zhidi", "Liu Zuan", "Xiaozhi", "Zhi Di", "Zhi of Han", "劉纘", "孝質皇帝", "유찬", "한 효질황제", "質帝", "刘缵", "汉质帝"],
    desc: "Emperor of the Han dynasty from 145 to 146",
    born: 138,
    died: 146,
    offices: [
      { office: "Emperor", state: null, from: 145, to: 146 },
      { office: "Emperor", state: "Eastern)", from: 145, to: 146 }
    ]
  },
  {
    uid: "Q7297",
    name: "Emperor Huan of Han",
    cjkName: "漢桓帝",
    cjkNames: ["漢桓帝", "汉桓帝", "漢孝桓皇帝", "刘志", "劉志", "威宗", "孝桓皇帝", "桓帝"],
    aliases: ["Han Huandi", "Huan Di", "Liu Zhi", "Weizong", "Xiaohuan", "劉志", "威宗", "孝桓皇帝", "유지", "한 효환황제", "桓帝", "刘志", "汉桓帝"],
    desc: "Chinese Han Dynasty emperor from 146 to 168",
    born: 132,
    died: 168,
    offices: [
      { office: "Emperor", state: null, from: 146, to: 168 },
      { office: "Emperor", state: "Eastern)", from: 146, to: 168 }
    ]
  },
  {
    uid: "Q559700",
    name: "Jia Xu",
    cjkName: "贾诩",
    cjkNames: ["贾诩", "賈詡", "賈文和", "魏壽鄕肅侯"],
    aliases: ["Ka Hui", "賈ク", "賈文和", "魏壽鄕肅侯", "賈詡"],
    desc: "Cao Wei politician and official (147-223)",
    born: 147,
    died: 223,
    offices: [
    ]
  },
  {
    uid: "Q1146661",
    name: "Zhu Jun",
    cjkName: "朱儁",
    cjkNames: ["朱儁", "朱俊", "朱雋"],
    aliases: ["朱雋"],
    desc: "Chinese Han dynasty general (died 195)",
    born: 149,
    died: 195,
    offices: [
    ]
  },
  {
    uid: "Q701738",
    name: "Chen Qun",
    cjkName: "陳群",
    cjkNames: ["陳群", "陈群"],
    aliases: ["Changwen", "Chen Changwen", "陈群"],
    desc: "Chinese state of Cao Wei minister (died 237)",
    born: 150,
    died: 236,
    offices: [
    ]
  },
  {
    uid: "Q982924",
    name: "Dong Yun",
    cjkName: "董允",
    cjkNames: ["董允"],
    aliases: ["Tung Wan"],
    desc: "Shu Han state general and official (died 246)",
    born: 150,
    died: 246,
    offices: [
    ]
  },
  {
    uid: "Q630881",
    name: "Jiang Ji",
    cjkName: "蔣濟",
    cjkNames: ["蔣濟"],
    aliases: [],
    desc: "Chinese Cao Wei state official and general (died 249)",
    born: 150,
    died: 249,
    offices: [
    ]
  },
  {
    uid: "Q702470",
    name: "Wang Chang",
    cjkName: "王昶",
    cjkNames: ["王昶"],
    aliases: [],
    desc: "Chinese military general and politician (died 259)",
    born: 150,
    died: 259,
    offices: [
    ]
  },
  {
    uid: "Q5969837",
    name: "Wang Guan",
    cjkName: "王观",
    cjkNames: ["王观", "王觀", "王觀偉臺"],
    aliases: [],
    desc: "Chinese Cao Wei state official (died 260)",
    born: 150,
    died: 260,
    offices: [
    ]
  },
  {
    uid: "Q197825",
    name: "Zhong Yao",
    cjkName: "鍾繇",
    cjkNames: ["鍾繇", "钟繇", "鍾太傅", "元常", "定陵侯", "成侯"],
    aliases: ["Chenghou", "Dinglinghou", "Dongwutinghou", "Yuanchang", "Zhong You", "鍾ヨウ", "Чжун Ю", "鍾太傅", "钟繇", "元常", "定陵侯", "成侯", "鍾繇"],
    desc: "Chinese official and calligrapher (151-230)",
    born: 151,
    died: 230,
    offices: [
    ]
  },
  {
    uid: "Q701350",
    name: "Wang Lang",
    cjkName: "王朗",
    cjkNames: ["王朗"],
    aliases: ["Wong Long", "หวัง หลั่ง"],
    desc: "Chinese official and warlord (died 228)",
    born: 152,
    died: 228,
    offices: [
    ]
  },
  {
    uid: "Q1276946",
    name: "Hua Xin",
    cjkName: "华歆",
    cjkNames: ["华歆", "華歆"],
    aliases: ["Ziyu"],
    desc: "Chinese Eastern Han politician (157-232)",
    born: 157,
    died: 232,
    offices: [
    ]
  },
  {
    uid: "Q1276331",
    name: "Liang Ji",
    cjkName: "梁冀",
    cjkNames: ["梁冀"],
    aliases: ["Bozhuo"],
    desc: "Chinese general and politician (died 159)",
    born: null,
    died: 159,
    offices: [
    ]
  },
  {
    uid: "Q7299",
    name: "Emperor Ling of Han",
    cjkName: "漢靈帝",
    cjkNames: ["漢靈帝", "汉灵帝", "漢孝靈皇帝", "刘宏", "劉宏", "孝靈皇帝", "灵帝", "靈帝"],
    aliases: ["Ling Di", "Liu Hong", "Xiaoling", "Chan Ling-ti", "Liou Chung", "Siao-ling", "劉宏", "孝霊皇帝", "유굉", "한 효령황제", "孝靈皇帝", "漢靈帝", "靈帝", "刘宏", "汉灵帝", "灵帝"],
    desc: "Emperor of the Han dynasty from 168 to 189",
    born: 156,
    died: 189,
    offices: [
      { office: "Emperor", state: null, from: 168, to: 189 },
      { office: "Emperor", state: "Eastern)", from: 168, to: 189 }
    ]
  },
  {
    uid: "Q5366233",
    name: "Zhou Bo",
    cjkName: "周勃",
    cjkNames: ["周勃", "绛侯"],
    aliases: ["绛侯"],
    desc: "Chinese military general and politician",
    born: 169,
    died: -170,
    offices: [
    ]
  },
  {
    uid: "Q706628",
    name: "Wang Ling",
    cjkName: "王凌",
    cjkNames: ["王凌", "王淩", "王彥雲", "魏南鄉侯"],
    aliases: ["Wong Ling", "王凌", "王彥雲", "魏南鄉侯"],
    desc: "Chinese Cao Wei state general (died 251)",
    born: 172,
    died: 251,
    offices: [
    ]
  },
  {
    uid: "Q713570",
    name: "Gao Rou",
    cjkName: "高柔",
    cjkNames: ["高柔"],
    aliases: ["Ko Yau", "Wenhui", "文恵"],
    desc: "Chinese Cao Wei official (174-263)",
    born: 174,
    died: 263,
    offices: [
    ]
  },
  {
    uid: "Q353698",
    name: "Sima Yi",
    cjkName: "司马懿",
    cjkNames: ["司马懿", "司馬懿", "仲達", "司馬仲達", "宣皇帝", "晉高祖", "晋宣帝", "高祖"],
    aliases: ["Sima Yi(2)", "Yi Sima", "Zhongda", "Emperador Xuan de Jin", "Sīmǎ Yì", "仲達", "司馬仲達", "司馬宣王", "司馬懿仲達", "宣公", "宣帝", "高祖", "사마 의", "사마중달", "중달", "宣皇帝", "Szuma I", "ซือหม่าอี้", "Trọng Đạt", "晉宣帝"],
    desc: "Chinese general, politician and regent (179-251)",
    born: 179,
    died: 251,
    offices: [
    ]
  },
  {
    uid: "Q1156935",
    name: "Sima Fu",
    cjkName: "司馬孚",
    cjkNames: ["司馬孚", "司马孚"],
    aliases: ["Prince Xian of Anping", "Shuda", "Pangeran Xian dari Anping", "叔達"],
    desc: "Jin dynasty Prince of Anping (180–272)",
    born: 180,
    died: 272,
    offices: [
    ]
  },
  {
    uid: "Q710053",
    name: "Wang Xiang",
    cjkName: "王祥",
    cjkNames: ["王祥"],
    aliases: ["休徴"],
    desc: "Chinese senior official (185–269)",
    born: 185,
    died: 269,
    offices: [
    ]
  },
  {
    uid: "Q7316",
    name: "Emperor Xian of Han",
    cjkName: "漢獻帝",
    cjkNames: ["漢獻帝", "汉献帝", "漢孝獻皇帝", "劉協", "孝献皇帝", "孝獻皇帝", "愍帝", "献帝", "獻帝", "刘协"],
    aliases: ["Emperor Xian", "Emperor Xian of the Han", "Han Hsien Ti", "Han Hsien-ti", "Han Min Di", "Han Min Ti", "Han Min-ti", "Han Mindi", "Han Xian Di", "Han Xiandi", "Hsiao Hsien Huang-ti", "Hsiao-hsien Huang-ti", "Hsien Ti", "Hsien-ti", "Liu Xie", "Min Di", "Min Ti", "Min-ti", "Mindi", "Xian Di"],
    desc: "Emperor of the Han dynasty from 189 to 220",
    born: 181,
    died: 234,
    offices: [
      { office: "Emperor", state: null, from: 189, to: 220 },
      { office: "Emperor", state: "Eastern)", from: 189, to: 220 }
    ]
  },
  {
    uid: "Q7301",
    name: "Prince of Hongnong",
    cjkName: "劉辯",
    cjkNames: ["劉辯", "刘辩", "漢少帝辯", "少帝", "弘农王", "弘農懷王", "弘農王"],
    aliases: ["Hongnongwang", "Liu Ban(2)", "Liu Bian", "Shao Di", "劉弁", "劉辯", "弘農懐王", "弘農王", "유변", "홍농회왕", "후소제", "少帝", "弘農懷王", "Kongen av Hóngnóng", "Liú Biàn", "Prins Huái av Hóngnóng", "keiser Shào av Hàn", "東漢後少帝", "皇子辯", "弘农王"],
    desc: "Emperor of the Han dynasty in 189",
    born: 176,
    died: 190,
    offices: [
      { office: "Emperor", state: null, from: 189, to: 189 },
      { office: "Prince of Hongnong (Liu Bian Contested) (Han", state: "Eastern)", from: 189, to: 189 }
    ]
  },
  {
    uid: "Q713616",
    name: "Zhang Wen",
    cjkName: "张温",
    cjkNames: ["张温", "張溫", "張溫伯慎"],
    aliases: ["張溫"],
    desc: "Chinese general and minister (died 191)",
    born: null,
    died: 191,
    offices: [
    ]
  },
  {
    uid: "Q954093",
    name: "Jiang Wan",
    cjkName: "蔣琬",
    cjkNames: ["蔣琬", "蒋琬", "公琰", "蒋公琰"],
    aliases: ["公琰", "蒋公琰", "蒋琬"],
    desc: "Shu Han state official and general (died 246)",
    born: 193,
    died: 245,
    offices: [
    ]
  },
  {
    uid: "Q204077",
    name: "Cao Cao",
    cjkName: "曹操",
    cjkNames: ["曹操", "漢魏武王", "夏侯操", "太祖", "曹孟德", "曹阿瞞", "武皇帝", "阿瞒", "魏太祖", "魏武帝", "汉魏武王", "漢魏王", "魏太祖武皇帝", "魏太祖武皇帝操", "魏武王"],
    aliases: ["Cao Mengde", "Cho Cho", "Meng-te", "Mengde", "T'ai-tsu", "Tai-tsu", "Taizu", "Ts'ao Meng-te", "Ts'ao Ts'ao", "Tsao Meng-te", "Tsao Tsao", "Wei T'ai-tsu", "Wei Tai-tsu", "Wei Taizu", "تساوتساو", "صاو صاو", "كاو كاو", "ཚའོ་ཚའོ་", "Cchao Cchao", "Meng-te Ts'ao"],
    desc: "Chinese warlord and statesman (155–220)",
    born: 155,
    died: 220,
    offices: [
      { office: "King", state: null, from: 216, to: 220 },
      { office: "Chancellor", state: "Han", from: 196, to: 220 }
    ]
  },
  {
    uid: "Q550368",
    name: "Deng Ai",
    cjkName: "邓艾",
    cjkNames: ["邓艾", "鄧艾"],
    aliases: ["鄧艾"],
    desc: "Cao Wei state general and official (197–264)",
    born: 197,
    died: 264,
    offices: [
    ]
  },
  {
    uid: "Q699910",
    name: "Cao Song",
    cjkName: "曹嵩",
    cjkNames: ["曹嵩", "夏侯嵩", "太皇帝"],
    aliases: ["Cao Song(2)", "太帝", "太皇帝", "巨堅", "巨高", "曹忠", "위 태황제", "夏侯嵩"],
    desc: "Eastern Han dynasty official (died 193)",
    born: 200,
    died: 194,
    offices: [
    ]
  },
  {
    uid: "Q198188",
    name: "Zhuge Dan",
    cjkName: "諸葛誕",
    cjkNames: ["諸葛誕", "诸葛诞"],
    aliases: ["公休"],
    desc: "Cao Wei general and politician (died 258)",
    born: 200,
    died: 258,
    offices: [
    ]
  },
  {
    uid: "Q280866",
    name: "Jiang Wei",
    cjkName: "姜维",
    cjkNames: ["姜维", "姜維"],
    aliases: ["Jiang Boyue", "姜維"],
    desc: "Chinese Shu Han state general (202-264)",
    born: 202,
    died: 264,
    offices: [
    ]
  },
  {
    uid: "Q1074543",
    name: "Dong Jue",
    cjkName: "董厥",
    cjkNames: ["董厥"],
    aliases: [],
    desc: "3rd century Shu Han official and general",
    born: 204,
    died: null,
    offices: [
    ]
  },
  {
    uid: "Q1154734",
    name: "Sima Wang",
    cjkName: "司馬望",
    cjkNames: ["司馬望", "司马望"],
    aliases: ["子初", "成王", "義陽成王"],
    desc: "Jin dynasty Prince of Yiyang (205–271)",
    born: 205,
    died: 271,
    offices: [
    ]
  },
  {
    uid: "Q707808",
    name: "Sima Shi",
    cjkName: "司馬師",
    cjkNames: ["司馬師", "司马师", "世宗", "晉世宗", "晉景帝", "景皇帝"],
    aliases: ["Emperador Jing de Jin", "世宗", "景皇帝", "司马师", "晉世宗", "晉景帝"],
    desc: "Cao Wei state general and regent (208-255)",
    born: 208,
    died: 255,
    offices: [
    ]
  },
  {
    uid: "Q559466",
    name: "Man Chong",
    cjkName: "滿寵",
    cjkNames: ["滿寵", "满宠", "滿伯寧", "魏昌邑侯", "魏昌邑景侯"],
    aliases: ["Chong Man", "滿伯寧", "魏昌邑侯", "魏昌邑景侯", "บวนทง"],
    desc: "Cao Wei general and official (died 242)",
    born: 209,
    died: 242,
    offices: [
    ]
  },
  {
    uid: "Q532884",
    name: "Sima Zhao",
    cjkName: "司马昭",
    cjkNames: ["司马昭", "司馬昭", "司馬子上", "太祖", "文皇帝", "晉文帝", "晋太祖"],
    aliases: ["Sima Chiu", "Emperador Wen de Jin", "Empereur Wen de Jin", "Jin Wenhuang", "Zishang", "太祖", "文皇帝", "ซือหม่าเจา", "Tấn Thái Tổ", "司馬子上", "司馬昭", "晉文帝", "晋太祖"],
    desc: "Cao Wei regent",
    born: 211,
    died: 265,
    offices: [
    ]
  },
  {
    uid: "Q313333",
    name: "Cao Pi",
    cjkName: "曹丕",
    cjkNames: ["曹丕", "魏世祖文皇帝", "世祖", "子桓", "字子桓", "文帝", "文皇帝", "曹子桓", "魏世祖", "魏文帝", "魏高祖", "魏高祖文皇帝丕"],
    aliases: ["Emperor Wen", "the Wen Emperor", "Wei Wendi", "Cao Zihuan", "Kaisar Wen", "Kaisar Wen dari Wei", "Tsao Pi", "Wen Di", "Zihuan", "世祖", "子桓", "文帝", "文皇帝", "高祖", "위 고조", "위 문왕", "위 문제", "위 세조", "위 태종", "조 비"],
    desc: "Cao Wei Emperror (187-226)",
    born: 187,
    died: 226,
    offices: [
      { office: "Emperor", state: null, from: 220, to: 226 },
      { office: "King", state: null, from: 220, to: 220 }
    ]
  },
  {
    uid: "Q245315",
    name: "Liu Bei",
    cjkName: null,
    cjkNames: [],
    aliases: ["Lau Bei", "Liu Xuande", "Xuande", "Zhaoliedi"],
    desc: "Chinese warlord and founding Emperor of Shu Han (161–223)",
    born: 161,
    died: 223,
    offices: [
      { office: "Emperor", state: null, from: 221, to: 223 }
    ]
  },
  {
    uid: "Q4385748",
    name: "Sun Shao",
    cjkName: "孫邵",
    cjkNames: ["孫邵", "孙邵"],
    aliases: [],
    desc: "Chinese Eastern Wu state official (163-225)",
    born: 163,
    died: 225,
    offices: [
      { office: "Chancellor", state: "Eastern Wu", from: 221, to: 225 }
    ]
  },
  {
    uid: "Q198211",
    name: "Zhuge Liang",
    cjkName: "诸葛亮",
    cjkNames: ["诸葛亮", "諸葛亮", "孔明", "諸葛孔明"],
    aliases: ["Zhuge Kongming", "Zhuge Liang", "Hung Ming", "伏龍", "孔明", "忠武侯", "臥龍", "諸葛孔明", "공명", "와룡", "제갈공명", "Chư Cát Lượng", "Gia Cát Khổng Minh", "諸葛亮", "诸葛孔明"],
    desc: "Chinese statesman and military strategist (181–234)",
    born: 181,
    died: 234,
    offices: [
      { office: "Q13218121", state: null, from: 221, to: 234 },
      { office: "Chancellor", state: "Shu Han", from: 221, to: 234 }
    ]
  },
  {
    uid: "Q313327",
    name: "Sun Quan",
    cjkName: null,
    cjkNames: [],
    aliases: ["Da Di", "Suen Kuen", "Sun Kuen", "Zhongmou"],
    desc: "Emperor of Eastern Wu during the Three Kingdoms period",
    born: 182,
    died: 252,
    offices: [
      { office: "Emperor", state: null, from: 229, to: 252 },
      { office: "King", state: null, from: 222, to: 229 }
    ]
  },
  {
    uid: "Q468780",
    name: "Liu Shan",
    cjkName: null,
    cjkNames: [],
    aliases: ["Adou", "Gongsi", "Hou Zhu", "Lau Sim", "Liu Chan"],
    desc: "Chinese emperor of Shu Han from 223 to 263",
    born: 207,
    died: 271,
    offices: [
      { office: "Emperor", state: null, from: 223, to: 263 }
    ]
  },
  {
    uid: "Q1195417",
    name: "Sun He",
    cjkName: null,
    cjkNames: [],
    aliases: ["He Sun", "Suen Wo", "Wen Di", "Zixiao"],
    desc: "Prince of Nanyang (224–253)",
    born: 224,
    died: 253,
    offices: [
    ]
  },
  {
    uid: "Q1275332",
    name: "Gu Yong",
    cjkName: "顧雍",
    cjkNames: ["顧雍", "顾雍", "吳醴陵侯", "吳醴陵肅侯", "顧元歎", "顧裕"],
    aliases: ["元歎", "粛侯", "吳醴陵侯", "吳醴陵肅侯", "顧元歎", "顧裕"],
    desc: "State of Eastern Wu Minister and Chancellor (168-243)",
    born: 168,
    died: 243,
    offices: [
      { office: "Chancellor", state: "Eastern Wu", from: 225, to: 243 }
    ]
  },
  {
    uid: "Q197813",
    name: "Zhong Hui",
    cjkName: "鍾會",
    cjkNames: ["鍾會", "钟会", "锺会"],
    aliases: ["Chung Wui", "钟会", "锺会"],
    desc: "Cao Wei calligrapher, essayist and general (225-264)",
    born: 225,
    died: 264,
    offices: [
    ]
  },
  {
    uid: "Q378470",
    name: "Cao Rui",
    cjkName: null,
    cjkNames: [],
    aliases: ["Cho Yui", "Ming Di", "Tso Yui", "Yuanzhong"],
    desc: "Chinese Cao Wei emperor from 226 to 239",
    born: 205,
    died: 239,
    offices: [
      { office: "Emperor", state: null, from: 226, to: 239 }
    ]
  },
  {
    uid: "Q198208",
    name: "Zhuge Zhan",
    cjkName: "诸葛瞻",
    cjkNames: ["诸葛瞻", "諸葛瞻"],
    aliases: ["思遠"],
    desc: "Shu Han general and official (227-263)",
    born: 227,
    died: 263,
    offices: [
    ]
  },
  {
    uid: "Q77822",
    name: "Cao Fang",
    cjkName: null,
    cjkNames: [],
    aliases: ["Fei Di", "Lanqing", "Li Wang", "Shaoling Gong"],
    desc: "Cao Wei emperor from 239 to 254",
    born: 232,
    died: 274,
    offices: [
      { office: "Emperor", state: null, from: 239, to: 254 }
    ]
  },
  {
    uid: "Q1368016",
    name: "Bu Zhi",
    cjkName: "步騭",
    cjkNames: ["步騭", "步骘", "吳臨湘侯", "步子山"],
    aliases: ["Zhi Bu", "歩隲", "吳臨湘侯", "步子山"],
    desc: "Eastern Wu official and general (died 247)",
    born: 150,
    died: 247,
    offices: [
      { office: "Chancellor", state: "Eastern Wu", from: 246, to: 247 }
    ]
  },
  {
    uid: "Q1133156",
    name: "Zhu Ju",
    cjkName: "朱據",
    cjkNames: ["朱據", "朱据", "子範", "子范", "朱子範", "朱子范"],
    aliases: ["Zifan", "朱子範", "朱子范", "子範", "子范"],
    desc: "Eastern Wu state official and general (194-250)",
    born: 194,
    died: 250,
    offices: [
      { office: "Q1051272", state: null, from: 246, to: 256 },
      { office: "Chancellor", state: "Eastern Wu", from: 249, to: 250 }
    ]
  },
  {
    uid: "Q1207638",
    name: "Sun Chen",
    cjkName: "孙綝",
    cjkNames: ["孙綝", "孫綝", "孫子通"],
    aliases: ["子通", "孫子通", "Tôn Lâm", "Tử Thông"],
    desc: "Eastern Wu general and regent (232-259)",
    born: 232,
    died: 259,
    offices: [
      { office: "Chancellor", state: "Eastern Wu", from: 248, to: 258 }
    ]
  },
  {
    uid: "Q740867",
    name: "Fei Yi",
    cjkName: "費禕",
    cjkNames: ["費禕", "费祎", "费文伟", "费袆"],
    aliases: ["Wenwei", "ひ い", "ウェンウェイ", "フェイ・イー", "文偉", "費イ", "비위", "费文伟", "费祎", "费袆"],
    desc: "Shu Han state regent and general (died 253)",
    born: 250,
    died: 253,
    offices: [
    ]
  },
  {
    uid: "Q714140",
    name: "Liu He",
    cjkName: null,
    cjkNames: [],
    aliases: [],
    desc: "emperor of Han Zhao",
    born: 250,
    died: 310,
    offices: [
    ]
  },
  {
    uid: "Q1044471",
    name: "Sun Li",
    cjkName: "孫禮",
    cjkNames: ["孫禮", "孙礼"],
    aliases: ["Suen Lai"],
    desc: "3rd century Cao Wei state general and official",
    born: null,
    died: 250,
    offices: [
    ]
  },
  {
    uid: "Q470034",
    name: "Sun Liang",
    cjkName: null,
    cjkNames: [],
    aliases: [],
    desc: "Eastern Wu emperor from 252 to 258",
    born: 243,
    died: 260,
    offices: [
      { office: "Emperor", state: null, from: 252, to: 258 }
    ]
  },
  {
    uid: "Q550290",
    name: "Cao Mao",
    cjkName: null,
    cjkNames: [],
    aliases: ["Gaoguixiang Gong", "Shao Di", "Wei Gaoguixiang Gong", "Yanshi"],
    desc: "Cao Wei emperor from 254 to 260",
    born: 241,
    died: 260,
    offices: [
      { office: "Emperor", state: null, from: 254, to: 260 }
    ]
  },
  {
    uid: "Q468767",
    name: "Sun Xiu",
    cjkName: null,
    cjkNames: [],
    aliases: [],
    desc: "Emperor of Eastern Wu from 258 to 264",
    born: 235,
    died: 264,
    offices: [
      { office: "Emperor", state: null, from: 257, to: 264 }
    ]
  },
  {
    uid: "Q470091",
    name: "Cao Huan",
    cjkName: null,
    cjkNames: [],
    aliases: ["Jingming", "Yuan Di"],
    desc: "Emperor of Cao Wei from 260 to 266",
    born: 246,
    died: 303,
    offices: [
      { office: "Emperor", state: null, from: 260, to: 266 }
    ]
  },
  {
    uid: "Q847643",
    name: "Puyang Xing",
    cjkName: "濮陽興",
    cjkNames: ["濮陽興", "濮阳兴", "濮陽子元", "濮陽逸"],
    aliases: ["濮陽子元", "濮陽逸"],
    desc: "Chinese Eastern Wu chancellor (died 264)",
    born: 250,
    died: 264,
    offices: [
      { office: "Chancellor", state: "Eastern Wu", from: 262, to: 264 }
    ]
  },
  {
    uid: "Q470030",
    name: "Sun Hao",
    cjkName: null,
    cjkNames: [],
    aliases: ["Mo Di", "Suen Ho", "Yuanzong"],
    desc: "last emperor of Eastern Wu (243-284)",
    born: 243,
    died: 284,
    offices: [
      { office: "Emperor", state: null, from: 264, to: 280 }
    ]
  },
  {
    uid: "Q7356",
    name: "Emperor Wu of Jin",
    cjkName: "司馬炎",
    cjkNames: ["司馬炎", "司马炎", "晉武帝", "世祖", "安世", "晋武帝", "武帝", "武皇帝"],
    aliases: ["Anshi", "Emperor Wu of Jìn", "Shi Zu", "Sima Yan", "Sima Yan (2)", "Sima Yim", "Wu Di", "S'-ma Jen", "Jin Wu Di", "Kaisar Wu dari Jin", "Shizu", "世祖", "安世", "武帝", "武皇帝", "司馬炎", "晉武帝", "司马炎", "晋武帝"],
    desc: "Emperor of the Jin Dynasty from 266 to 290",
    born: 236,
    died: 290,
    offices: [
      { office: "Emperor", state: null, from: 266, to: 290 }
    ]
  },
  {
    uid: "Q7360",
    name: "Sima Lun",
    cjkName: null,
    cjkNames: [],
    aliases: ["Prince of Langye Commandery", "Prince of Zhao", "Ziyi"],
    desc: "Prince of Zhao and Jin dynasty usurper (died 301)",
    born: 240,
    died: 301,
    offices: [
      { office: "Emperor", state: null, from: 301, to: 301 },
      { office: "Prince", state: null, from: 277, to: 301 }
    ]
  },
  {
    uid: "Q711750",
    name: "Zhang Ti",
    cjkName: "張悌",
    cjkNames: ["張悌", "张悌", "張巨先"],
    aliases: ["張巨先"],
    desc: "Chinese Eastern Wu chancellor (236-280)",
    born: 236,
    died: 280,
    offices: [
      { office: "Chancellor", state: "Eastern Wu", from: 279, to: 280 }
    ]
  },
  {
    uid: "Q7357",
    name: "Emperor Hui of Jin",
    cjkName: null,
    cjkNames: [],
    aliases: ["Hui Di", "Sima Zhong", "Zhengdu"],
    desc: "Emperor of the Jin Dynasty from 290 to 307",
    born: 259,
    died: 307,
    offices: [
      { office: "Emperor", state: null, from: 290, to: 307 }
    ]
  },
  {
    uid: "Q699624",
    name: "Cao Shuang",
    cjkName: "曹爽",
    cjkNames: ["曹爽"],
    aliases: ["昭伯"],
    desc: "Chinese general and Cao Wei regent (died 249)",
    born: 300,
    died: 249,
    offices: [
    ]
  },
  {
    uid: "Q712330",
    name: "Li Xiong",
    cjkName: null,
    cjkNames: [],
    aliases: ["Zhongjuan"],
    desc: "Cheng-Han dynasty emperor from 303 to 334",
    born: 274,
    died: 334,
    offices: [
      { office: "Emperor", state: null, from: 304, to: 334 }
    ]
  },
  {
    uid: "Q714159",
    name: "Liu Yuan",
    cjkName: null,
    cjkNames: [],
    aliases: ["Lau Yuen"],
    desc: "Emperor of Han Zhao dynasty from 304 to 310",
    born: 271,
    died: 310,
    offices: [
      { office: "Emperor", state: null, from: 304, to: 310 }
    ]
  },
  {
    uid: "Q7361",
    name: "Emperor Huai of Jin",
    cjkName: null,
    cjkNames: [],
    aliases: ["Fengdu", "Huai Di", "Jin Huaidi", "Sima Chi", "Sima Zhi(2)"],
    desc: "3rd emperor of the Jin Dynasty (265–420)",
    born: 300,
    died: 313,
    offices: [
      { office: "Emperor", state: null, from: 307, to: 311 }
    ]
  },
  {
    uid: "Q714176",
    name: "Liu Cong",
    cjkName: null,
    cjkNames: [],
    aliases: ["Lau Chung"],
    desc: "emperor of Han Zhao",
    born: 300,
    died: 318,
    offices: [
      { office: "Emperor", state: null, from: 310, to: 318 }
    ]
  },
  {
    uid: "Q7382",
    name: "Emperor Min of Jin",
    cjkName: null,
    cjkNames: [],
    aliases: ["Jin Mindi", "Min Di", "Sima Ye", "Yanqi"],
    desc: "Emperor of the Jin Dynasty from 313 to 318",
    born: 300,
    died: 318,
    offices: [
      { office: "Emperor", state: null, from: 313, to: 316 },
      { office: "Emperor", state: null, from: 313, to: 316 }
    ]
  },
  {
    uid: "Q7392",
    name: "Emperor Yuan of Jin",
    cjkName: null,
    cjkNames: [],
    aliases: ["Jingwen", "Sima Rui", "Sima Yui"],
    desc: "First Emperor of Eastern Jin Dynasty freom 318 to 323",
    born: 276,
    died: 323,
    offices: [
      { office: "Emperor", state: null, from: 317, to: 323 }
    ]
  },
  {
    uid: "Q7393",
    name: "Emperor Ming of Jin",
    cjkName: null,
    cjkNames: [],
    aliases: ["Daoji", "Jin Mingdi", "Ming Di", "Sima Shao", "Su Zong", "Suzu"],
    desc: "Emperor of the Jin dynasty from 323 to 325",
    born: 299,
    died: 325,
    offices: [
      { office: "Emperor", state: null, from: 323, to: 325 },
      { office: "Crown Prince", state: null, from: 318, to: 323 }
    ]
  },
  {
    uid: "Q1152735",
    name: "Liu Can",
    cjkName: null,
    cjkNames: [],
    aliases: [],
    desc: "emperor of Han Zhao",
    born: 250,
    died: 318,
    offices: [
      { office: "Emperor", state: null, from: 318, to: 318 }
    ]
  },
  {
    uid: "Q1149197",
    name: "Liu Yao",
    cjkName: null,
    cjkNames: [],
    aliases: ["Lau Yeuk"],
    desc: "Emperor of Han Zhao from 318 to 329",
    born: 275,
    died: 329,
    offices: [
      { office: "Emperor", state: null, from: 318, to: 329 }
    ]
  },
  {
    uid: "Q1196190",
    name: "Shi Le",
    cjkName: null,
    cjkNames: [],
    aliases: ["Gao Zu", "Ming Di", "Shilong"],
    desc: "Emperor of Later Zhao from 330 to 333",
    born: 274,
    died: 333,
    offices: [
      { office: "Emperor", state: null, from: 319, to: 333 }
    ]
  },
  {
    uid: "Q7394",
    name: "Emperor Cheng of Jin",
    cjkName: null,
    cjkNames: [],
    aliases: ["Cheng Di", "Shigen", "Sima Yan", "Xian Zong", "Xianzong"],
    desc: "emperor of the Jin Dynasty (265–420) (321-342)",
    born: 321,
    died: 342,
    offices: [
      { office: "Emperor", state: null, from: 325, to: 342 },
      { office: "Crown Prince", state: null, from: 325, to: 325 }
    ]
  },
  {
    uid: "Q1069778",
    name: "Murong Huang",
    cjkName: null,
    cjkNames: [],
    aliases: ["Gao Zu", "Wuxuan Di", "Yuanzhen"],
    desc: "Prince of Former Yan from 337 to 348",
    born: 297,
    died: 348,
    offices: [
      { office: "Emperor", state: null, from: 333, to: 348 }
    ]
  },
  {
    uid: "Q712327",
    name: "Li Qi",
    cjkName: null,
    cjkNames: [],
    aliases: [],
    desc: "Cheng Han emperor (314-338)",
    born: 314,
    died: 338,
    offices: [
      { office: "Emperor", state: null, from: 334, to: 338 }
    ]
  },
  {
    uid: "Q1199590",
    name: "Shi Hong",
    cjkName: null,
    cjkNames: [],
    aliases: ["Daya"],
    desc: "emperor of the Jie state",
    born: 313,
    died: 334,
    offices: [
      { office: "Emperor", state: null, from: 334, to: 335 }
    ]
  },
  {
    uid: "Q1149441",
    name: "Shi Hu",
    cjkName: null,
    cjkNames: [],
    aliases: [],
    desc: "Chinese general and emperor",
    born: 295,
    died: 349,
    offices: [
      { office: "Emperor", state: null, from: 334, to: 349 }
    ]
  },
  {
    uid: "Q7395",
    name: "Emperor Kang of Jin",
    cjkName: null,
    cjkNames: [],
    aliases: ["Kang Di", "Shitong", "Sima Yue"],
    desc: "emperor of the Jin Dynasty (265–420)",
    born: 322,
    died: 344,
    offices: [
      { office: "Emperor", state: null, from: 342, to: 344 }
    ]
  },
  {
    uid: "Q7396",
    name: "Emperor Mu of Jin",
    cjkName: null,
    cjkNames: [],
    aliases: ["Mu Di", "Pengzu", "Sima Dan", "Xianzong", "Xiao Zong"],
    desc: "emperor of the Jin Dynasty (265–420)",
    born: 343,
    died: 361,
    offices: [
      { office: "Emperor", state: null, from: 344, to: 361 }
    ]
  },
  {
    uid: "Q1071329",
    name: "Murong Jun",
    cjkName: null,
    cjkNames: [],
    aliases: ["Emperor Jingzhao of Yan", "Jingzhao Di", "Lie Zu", "Xuanying"],
    desc: "Emperor Jingzhao of Yan",
    born: 319,
    died: 360,
    offices: [
      { office: "Emperor", state: null, from: 348, to: 360 }
    ]
  },
  {
    uid: "Q1152762",
    name: "Shi Shi",
    cjkName: null,
    cjkNames: [],
    aliases: ["Prince of Qiao"],
    desc: "emperor of the Jie Hun state Later Zhao",
    born: 339,
    died: 349,
    offices: [
      { office: "Emperor", state: null, from: 349, to: 349 }
    ]
  },
  {
    uid: "Q1152755",
    name: "Shi Zun",
    cjkName: null,
    cjkNames: [],
    aliases: [],
    desc: "Emperor of the Jie state Later Zhao",
    born: 350,
    died: 349,
    offices: [
      { office: "Emperor", state: null, from: 349, to: 349 }
    ]
  },
  {
    uid: "Q718238",
    name: "Li Xin",
    cjkName: null,
    cjkNames: [],
    aliases: ["Hou Zhu", "Li Xin(4)"],
    desc: "Duke of Western Liang",
    born: 350,
    died: 420,
    offices: [
    ]
  },
  {
    uid: "Q836256",
    name: "Ran Min",
    cjkName: null,
    cjkNames: [],
    aliases: ["Shi Min"],
    desc: "Emperor of the Chinese state of Ran Wei from 350 to 352",
    born: 320,
    died: 352,
    offices: [
      { office: "Emperor", state: null, from: 350, to: 352 }
    ]
  },
  {
    uid: "Q283828",
    name: "Shi Jian",
    cjkName: null,
    cjkNames: [],
    aliases: [],
    desc: "Emperor of the Jie state",
    born: 350,
    died: 350,
    offices: [
      { office: "Emperor", state: null, from: 350, to: 350 }
    ]
  },
  {
    uid: "Q1199583",
    name: "Shi Zhi",
    cjkName: null,
    cjkNames: [],
    aliases: [],
    desc: "Emperor of Later Zhao from 350 to 351",
    born: 350,
    died: 351,
    offices: [
      { office: "Emperor", state: null, from: 350, to: 351 }
    ]
  },
  {
    uid: "Q1071647",
    name: "Fú Jiàn",
    cjkName: null,
    cjkNames: [],
    aliases: ["Emperor Jingming of Former Qin", "Fu Jian", "Gao Zu", "Jianye", "Minghuang", "Po Kin", "Qin Jingming Di"],
    desc: "founding emperor of the Di-led Chinese Former Qin dynasty during the Sixteen Kingdoms period",
    born: 317,
    died: 355,
    offices: [
      { office: "Emperor", state: null, from: 351, to: 355 }
    ]
  },
  {
    uid: "Q1151680",
    name: "Fú Shēng",
    cjkName: null,
    cjkNames: [],
    aliases: ["Changsheng", "Fu Sheng", "Li Wang", "Po Sang"],
    desc: "former Qin emperor",
    born: 335,
    died: 357,
    offices: [
      { office: "Emperor", state: null, from: 355, to: 357 }
    ]
  },
  {
    uid: "Q967998",
    name: "Fú Jiān",
    cjkName: null,
    cjkNames: [],
    aliases: ["Emperor Xuanzhao of Former Qin", "Fu, Jian", "Po Kin", "Qin Jing ming di", "Shi Zu", "Yonggu"],
    desc: "third emperor of Former Qin during the he Sixteen Kingdoms period",
    born: 338,
    died: 385,
    offices: [
      { office: "Emperor", state: null, from: 357, to: 385 }
    ]
  },
  {
    uid: "Q1074804",
    name: "Murong Wei",
    cjkName: null,
    cjkNames: [],
    aliases: ["Jingmao", "Mo Yung Wai", "You Di"],
    desc: "Emperor You of Former Yan",
    born: 350,
    died: 384,
    offices: [
      { office: "Emperor", state: null, from: 360, to: 370 }
    ]
  },
  {
    uid: "Q7398",
    name: "Emperor Ai of Jin",
    cjkName: null,
    cjkNames: [],
    aliases: ["Ai Di", "Qianling", "Sima Pi"],
    desc: "emperor of the Jin Dynasty (265–420)",
    born: 341,
    died: 365,
    offices: [
      { office: "Emperor", state: null, from: 361, to: 365 }
    ]
  },
  {
    uid: "Q3276219",
    name: "Xu Xianzhi",
    cjkName: null,
    cjkNames: [],
    aliases: [],
    desc: "Liu Song regent",
    born: 364,
    died: 426,
    offices: [
    ]
  },
  {
    uid: "Q7399",
    name: "Emperor Fei of Jin",
    cjkName: null,
    cjkNames: [],
    aliases: ["Di Yi", "Duke of Haixi", "Sima Yi", "Yanling"],
    desc: "Emperor of the Jin Dynasty from 365 to 372",
    born: 342,
    died: 386,
    offices: [
      { office: "Emperor", state: null, from: 365, to: 372 }
    ]
  },
  {
    uid: "Q7400",
    name: "Emperor Jianwen of Jin",
    cjkName: null,
    cjkNames: [],
    aliases: ["Daowan", "Jianwen Di", "Sima Yu", "Tai Zong"],
    desc: "emperor of the Jin Dynasty (265–420) (320-372)",
    born: 320,
    died: 372,
    offices: [
      { office: "Emperor", state: null, from: 372, to: 372 },
      { office: "Emperor", state: null, from: 371, to: 372 }
    ]
  },
  {
    uid: "Q7402",
    name: "Emperor Xiaowu of Jin",
    cjkName: null,
    cjkNames: [],
    aliases: ["Changming", "Lie Zong", "Sima Yao", "Xiaowu Di"],
    desc: "Eastern Jin dynasty emperor from 372 to 396",
    born: 362,
    died: 396,
    offices: [
      { office: "Emperor", state: null, from: 372, to: 396 },
      { office: "Emperor", state: null, from: 372, to: 396 }
    ]
  },
  {
    uid: "Q1147266",
    name: "Yao Chang",
    cjkName: null,
    cjkNames: [],
    aliases: [],
    desc: "Later Qin emperor",
    born: 331,
    died: 394,
    offices: [
      { office: "Emperor", state: null, from: 384, to: 394 }
    ]
  },
  {
    uid: "Q1153333",
    name: "Fu Pi",
    cjkName: null,
    cjkNames: [],
    aliases: ["Po Pei", "Po Pi", "Yongshu"],
    desc: "former Qin emperor",
    born: 350,
    died: 386,
    offices: [
      { office: "Emperor", state: null, from: 385, to: 386 }
    ]
  },
  {
    uid: "Q1076719",
    name: "Fu Deng",
    cjkName: null,
    cjkNames: [],
    aliases: ["Gao Di", "Wengao"],
    desc: "former Qin emperor",
    born: 343,
    died: 394,
    offices: [
      { office: "Emperor", state: null, from: 386, to: 394 }
    ]
  },
  {
    uid: "Q1069762",
    name: "Lü Guang",
    cjkName: null,
    cjkNames: [],
    aliases: [],
    desc: "emperor of Later Liang",
    born: 337,
    died: 400,
    offices: [
      { office: "Emperor", state: null, from: 386, to: 399 }
    ]
  },
  {
    uid: "Q1149160",
    name: "Yao Xing",
    cjkName: null,
    cjkNames: [],
    aliases: ["Yiu Hing"],
    desc: "Later Qin emperor",
    born: 366,
    died: 416,
    offices: [
      { office: "Emperor", state: null, from: 394, to: 416 }
    ]
  },
  {
    uid: "Q7403",
    name: "Emperor An of Jin",
    cjkName: null,
    cjkNames: [],
    aliases: ["An Di", "Dezong", "Sima De", "Sima Dezong"],
    desc: "emperor of the Jin Dynasty (265–420)",
    born: 382,
    died: 419,
    offices: [
      { office: "Emperor", state: null, from: 396, to: 419 },
      { office: "Emperor", state: null, from: 397, to: 418 }
    ]
  },
  {
    uid: "Q1076801",
    name: "Murong Bao",
    cjkName: null,
    cjkNames: [],
    aliases: ["Daoyou", "Huimin Di"],
    desc: "Chinese emperor",
    born: 355,
    died: 398,
    offices: [
      { office: "Emperor", state: null, from: 396, to: 398 }
    ]
  },
  {
    uid: "Q1069790",
    name: "Tufa Wugu",
    cjkName: null,
    cjkNames: [],
    aliases: ["Nan Liang liezu", "Nan Liang wuwang", "Wuwei wang", "Wuwei wuwang", "Xipoing wang"],
    desc: "Xianbei chieftain, founder of Southern Liang (r. 397-399)",
    born: 350,
    died: 399,
    offices: [
      { office: "Emperor", state: null, from: 397, to: 399 }
    ]
  },
  {
    uid: "Q1069310",
    name: "Murong De",
    cjkName: null,
    cjkNames: [],
    aliases: ["Xianwu Di", "Yuanming"],
    desc: "Emperor of Southern Yan from 398 to 405",
    born: 336,
    died: 405,
    offices: [
      { office: "Emperor", state: null, from: 398, to: 405 }
    ]
  },
  {
    uid: "Q1078573",
    name: "Murong Sheng",
    cjkName: null,
    cjkNames: [],
    aliases: ["Daoyun", "Murong Sheng(2)", "Zhaowu Di"],
    desc: "Emperor Zhaowu of Later Yan",
    born: 373,
    died: 401,
    offices: [
      { office: "Emperor", state: null, from: 398, to: 401 }
    ]
  },
  {
    uid: "Q1149178",
    name: "Emperor Daowu of Northern Wei",
    cjkName: null,
    cjkNames: [],
    aliases: ["Daowu Di", "Tuoba Gui"],
    desc: "founding emperor of Northern Wei (during the Northern dynasties period, China)",
    born: 371,
    died: 409,
    offices: [
      { office: "Emperor", state: null, from: 399, to: 409 }
    ]
  },
  {
    uid: "Q1071544",
    name: "Murong Xi",
    cjkName: null,
    cjkNames: [],
    aliases: [],
    desc: "Chinese ruler",
    born: 385,
    died: 407,
    offices: [
      { office: "Emperor", state: null, from: 401, to: 407 }
    ]
  },
  {
    uid: "Q1137864",
    name: "Huan Xuan",
    cjkName: null,
    cjkNames: [],
    aliases: [],
    desc: "Chinese emperor",
    born: 369,
    died: 404,
    offices: [
      { office: "Emperor", state: null, from: 403, to: 404 }
    ]
  },
  {
    uid: "Q254752",
    name: "Helian Bobo",
    cjkName: null,
    cjkNames: [],
    aliases: ["Emperor Wulie of Xia", "Emperor Xia Shizu Wulie", "Liu Bobo", "Qujie"],
    desc: "Hu Xia Emperor from 407 to 425",
    born: 381,
    died: 425,
    offices: [
      { office: "Emperor", state: null, from: 407, to: 425 }
    ]
  },
  {
    uid: "Q1071591",
    name: "Emperor Mingyuan of Northern Wei",
    cjkName: null,
    cjkNames: [],
    aliases: ["Mingyuan Di", "Tai Zong", "Tuoba Si"],
    desc: "Chinese emperor",
    born: 392,
    died: 423,
    offices: [
      { office: "Emperor", state: null, from: 409, to: 423 },
      { office: "Emperor", state: null, from: 409, to: 423 }
    ]
  },
  {
    uid: "Q1147737",
    name: "Feng Ba",
    cjkName: null,
    cjkNames: [],
    aliases: [],
    desc: "Northern Yan emperor",
    born: 350,
    died: 430,
    offices: [
      { office: "Emperor", state: null, from: 409, to: 430 }
    ]
  },
  {
    uid: "Q1131653",
    name: "Murong Chao",
    cjkName: null,
    cjkNames: [],
    aliases: [],
    desc: "Emperor of Xianbei state Southern Yan",
    born: 385,
    died: 410,
    offices: [
      { office: "Emperor", state: null, from: 409, to: 410 }
    ]
  },
  {
    uid: "Q7404",
    name: "Emperor Gong of Jin",
    cjkName: null,
    cjkNames: [],
    aliases: ["Gong Di", "Sima Dewen"],
    desc: "Emperor of the Eastern Jin dynasty from 419 to 420",
    born: 386,
    died: 421,
    offices: [
      { office: "Emperor", state: null, from: 419, to: 420 }
    ]
  },
  {
    uid: "Q49699",
    name: "Emperor Wu of Liu Song",
    cjkName: null,
    cjkNames: [],
    aliases: ["Dexing", "Deyu", "Liu Wu", "Liu Yu", "Qinu", "Wu Di"],
    desc: "Emperor of Liu Song from 420 to 422",
    born: 363,
    died: 422,
    offices: [
      { office: "Emperor", state: null, from: 420, to: 422 }
    ]
  },
  {
    uid: "Q49701",
    name: "Emperor Shao of Liu Song",
    cjkName: null,
    cjkNames: [],
    aliases: ["Chebing", "Liu Yifu", "Prince of Yingyang", "Song Shaodi", "Yingyang Wang"],
    desc: "emperor of the Liu Song Dynasty",
    born: 406,
    died: 424,
    offices: [
      { office: "Emperor", state: null, from: 422, to: 424 }
    ]
  },
  {
    uid: "Q1194963",
    name: "Emperor Taiwu of Northern Wei",
    cjkName: null,
    cjkNames: [],
    aliases: ["Bili", "Shi Zu", "Taiwu Di", "Tuoba Dao", "Tuoba Tao"],
    desc: "Northern Wei emperor",
    born: 408,
    died: 452,
    offices: [
      { office: "Emperor", state: null, from: 423, to: 452 },
      { office: "Emperor", state: null, from: 424, to: 452 }
    ]
  },
  {
    uid: "Q49702",
    name: "Emperor Wen of Liu Song",
    cjkName: null,
    cjkNames: [],
    aliases: ["Che'er", "Liu Yilong", "Song Wen-di", "Wen of Liu Song"],
    desc: "emperor of the Liu Song Dynasty (407-453)",
    born: 407,
    died: 453,
    offices: [
      { office: "Emperor", state: null, from: 424, to: 453 }
    ]
  },
  {
    uid: "Q1149447",
    name: "Helian Chang",
    cjkName: null,
    cjkNames: [],
    aliases: ["Duke Taiyuan"],
    desc: "2nd emperor of Xia (Sixteen Kingdoms of Chinese historical period)",
    born: null,
    died: 434,
    offices: [
      { office: "Emperor", state: null, from: 425, to: 428 }
    ]
  },
  {
    uid: "Q1074798",
    name: "Emperor Wencheng of Northern Wei",
    cjkName: null,
    cjkNames: [],
    aliases: ["Gao Zong", "Tuoba Jun", "Wencheng Di"],
    desc: "Northern Wei emperor",
    born: 440,
    died: 465,
    offices: [
      { office: "Emperor", state: null, from: 452, to: 465 }
    ]
  },
  {
    uid: "Q3275322",
    name: "Tuoba Yu",
    cjkName: null,
    cjkNames: [],
    aliases: [],
    desc: "Emperor of Northern Wei",
    born: 450,
    died: 452,
    offices: [
      { office: "Emperor", state: null, from: 452, to: 452 }
    ]
  },
  {
    uid: "Q718246",
    name: "Emperor Xiaowu of Liu Song",
    cjkName: null,
    cjkNames: [],
    aliases: ["Liu Jun"],
    desc: "Chinese Emperor of the Liu Song dynasty",
    born: 430,
    died: 464,
    offices: [
      { office: "Emperor", state: null, from: 453, to: 464 }
    ]
  },
  {
    uid: "Q717895",
    name: "Liu Shao",
    cjkName: null,
    cjkNames: [],
    aliases: [],
    desc: "Chinese emperor of the Liu Song dynasty",
    born: 426,
    died: 453,
    offices: [
      { office: "Emperor", state: null, from: 453, to: 453 }
    ]
  },
  {
    uid: "Q718258",
    name: "Emperor Qianfei of Liu Song",
    cjkName: null,
    cjkNames: [],
    aliases: ["Former Deposed Emperor of Liu Song", "Liu Ziye"],
    desc: "Liu Song emperor",
    born: 449,
    died: 466,
    offices: [
      { office: "Emperor", state: null, from: 464, to: 466 }
    ]
  },
  {
    uid: "Q1071582",
    name: "Emperor Xianwen of Northern Wei",
    cjkName: null,
    cjkNames: [],
    aliases: ["Tuoba Hong", "Xian Zu", "Xianwen Di"],
    desc: "Northern Wei emperor",
    born: 454,
    died: 476,
    offices: [
      { office: "Emperor", state: null, from: 465, to: 471 }
    ]
  },
  {
    uid: "Q718195",
    name: "Emperor Ming of Liu Song",
    cjkName: null,
    cjkNames: [],
    aliases: ["Liu Yu", "Xiubing"],
    desc: "Liu Song Emperor from 466 to 472",
    born: 439,
    died: 472,
    offices: [
      { office: "Emperor", state: null, from: 466, to: 472 }
    ]
  },
  {
    uid: "Q1327614",
    name: "Emperor Xiaowen of Northern Wei",
    cjkName: null,
    cjkNames: [],
    aliases: ["Gao Zu", "Tuoba Hong", "Wei Xiaowen Di", "Wei Xiaowen Emperor", "Wen Di", "Yuan Hong", "Yuan Hongyan"],
    desc: "Emperor of Northern Wei Dynasty from 471 to 499",
    born: 467,
    died: 499,
    offices: [
      { office: "Emperor", state: null, from: 471, to: 499 }
    ]
  },
  {
    uid: "Q717946",
    name: "Emperor Houfei of Liu Song",
    cjkName: null,
    cjkNames: [],
    aliases: ["Latter Deposed Emperor of Liu Song", "Liu Yu"],
    desc: "Liu Song emperor of the Liu Song dynasty",
    born: 463,
    died: 477,
    offices: [
      { office: "Emperor", state: null, from: 472, to: 477 }
    ]
  },
  {
    uid: "Q718210",
    name: "Emperor Shun of Liu Song",
    cjkName: null,
    cjkNames: [],
    aliases: ["Liu Zhun"],
    desc: "last emperor of the Liu Song dynasty",
    born: 467,
    died: 479,
    offices: [
      { office: "Emperor", state: null, from: 477, to: 479 }
    ]
  },
  {
    uid: "Q1194981",
    name: "Emperor Gao of Southern Qi",
    cjkName: null,
    cjkNames: [],
    aliases: ["Gao Di", "Shaobo", "Tai Zu", "Xiao Daocheng"],
    desc: "Southern Qi emperor",
    born: 427,
    died: 482,
    offices: [
      { office: "Emperor", state: null, from: 479, to: 482 }
    ]
  },
  {
    uid: "Q940037",
    name: "Emperor Wu of Southern Qi",
    cjkName: null,
    cjkNames: [],
    aliases: ["Shi Zu", "Wu Di", "Xiao Ze(2)", "Xuanyuan"],
    desc: "Southern Qi Emperor",
    born: 440,
    died: 493,
    offices: [
      { office: "Emperor", state: null, from: 482, to: 493 }
    ]
  },
  {
    uid: "Q1336575",
    name: "Xiao Baojuan",
    cjkName: null,
    cjkNames: [],
    aliases: ["Donghun Hou", "Xiao Baozhuan", "Zhizang"],
    desc: "Southern Qi emperor",
    born: 483,
    died: 501,
    offices: [
      { office: "Emperor", state: null, from: 489, to: 501 }
    ]
  },
  {
    uid: "Q1141013",
    name: "Xiao Zhaoye",
    cjkName: null,
    cjkNames: [],
    aliases: ["Yulin Wang"],
    desc: "Southern Qi emperor",
    born: 473,
    died: 494,
    offices: [
      { office: "Emperor", state: null, from: 493, to: 494 }
    ]
  },
  {
    uid: "Q1149132",
    name: "Emperor Ming of Southern Qi",
    cjkName: null,
    cjkNames: [],
    aliases: ["Gao Zong", "Jingxi", "Ming Di", "Xiao Luan"],
    desc: "Chinese emperor (452-498)",
    born: 452,
    died: 498,
    offices: [
      { office: "Emperor", state: null, from: 494, to: 498 }
    ]
  },
  {
    uid: "Q1190405",
    name: "Xiao Zhaowen",
    cjkName: null,
    cjkNames: [],
    aliases: ["Hailing Wang"],
    desc: "Southern Qi emperor (480-494)",
    born: 480,
    died: 494,
    offices: [
      { office: "Emperor", state: null, from: 494, to: 494 }
    ]
  },
  {
    uid: "Q1194968",
    name: "Emperor Xuanwu of Northern Wei",
    cjkName: null,
    cjkNames: [],
    aliases: ["Shi Zong", "Xuanwu Di", "Yuan Ke"],
    desc: "Northern Wei emperor",
    born: 483,
    died: 515,
    offices: [
      { office: "Emperor", state: null, from: 499, to: 515 },
      { office: "Crown Prince", state: null, from: 498, to: 499 }
    ]
  },
  {
    uid: "Q1190420",
    name: "Emperor He of Southern Qi",
    cjkName: null,
    cjkNames: [],
    aliases: ["He Di", "Xiao Baorong", "Zhizhao"],
    desc: "Chinese Emperor",
    born: 488,
    died: 502,
    offices: [
      { office: "Emperor", state: null, from: 501, to: 502 }
    ]
  },
  {
    uid: "Q736726",
    name: "Wu",
    cjkName: null,
    cjkNames: [],
    aliases: ["Emperor Wu of Liang", "Gaozu", "Gaozu of Liang", "Gaozu of the Liang", "High Ancestor of the Liang", "Hsiao Lien-erh", "Hsiao Shu-ta", "Hsiao Yen", "Kao-tsu", "Kao-tsu of Liang", "Kao-tsu of the Liang", "Liang Gaozu", "Liang Kao-tsu", "Liang Wu Di", "Liang Wu Ti", "Liang Wu-ti", "Liang Wudi", "Martial Emperor of Liang", "Martial Emperor of the Liang", "Wu Di"],
    desc: "Founding Liang emperor from 502 to 549",
    born: 464,
    died: 549,
    offices: [
      { office: "Emperor", state: null, from: 502, to: 549 }
    ]
  },
  {
    uid: "Q1071618",
    name: "Emperor Xiaoming of Northern Wei",
    cjkName: null,
    cjkNames: [],
    aliases: ["Ming Di", "Su Zong", "Yuan Xu", "Yuan Yi", "suzong"],
    desc: "Northern Wei emperor",
    born: 510,
    died: 528,
    offices: [
      { office: "Emperor", state: null, from: 515, to: 528 }
    ]
  },
  {
    uid: "Q1071537",
    name: "Emperor Xiaowu of Northern Wei",
    cjkName: null,
    cjkNames: [],
    aliases: ["Wu Di", "Yuan Xiu"],
    desc: "last Northern Wei emperor (510-535)",
    born: 510,
    died: 535,
    offices: [
      { office: "Emperor", state: null, from: 532, to: 535 },
      { office: "Emperor", state: null, from: 528, to: 530 }
    ]
  },
  {
    uid: "Q1074789",
    name: "Emperor Xiaozhuang of Northern Wei",
    cjkName: null,
    cjkNames: [],
    aliases: ["Jingzong", "Yuan Ziyou", "Zhuang Di"],
    desc: "Northern Wei emperor",
    born: 507,
    died: 531,
    offices: [
      { office: "Emperor", state: null, from: 528, to: 531 },
      { office: "Emperor", state: null, from: 528, to: 531 }
    ]
  },
  {
    uid: "Q3268609",
    name: "Yuan Zhao",
    cjkName: null,
    cjkNames: [],
    aliases: [],
    desc: "Northern Wei emperor",
    born: 526,
    died: 528,
    offices: [
      { office: "Emperor", state: null, from: 528, to: 528 }
    ]
  },
  {
    uid: "Q3276215",
    name: "Yuan Ye",
    cjkName: null,
    cjkNames: [],
    aliases: ["Prince of Changguang"],
    desc: "Northern Wei Emperor",
    born: 509,
    died: 532,
    offices: [
      { office: "Emperor", state: null, from: 530, to: 531 }
    ]
  },
  {
    uid: "Q1074737",
    name: "Emperor Jiemin of Northern Wei",
    cjkName: null,
    cjkNames: [],
    aliases: ["Yuan Gong"],
    desc: "Northern Wei emperor",
    born: 498,
    died: 532,
    offices: [
      { office: "Emperor", state: null, from: 531, to: 532 }
    ]
  },
  {
    uid: "Q3276194",
    name: "Yuan Lang",
    cjkName: null,
    cjkNames: [],
    aliases: [],
    desc: "Northern Wei emperor",
    born: 513,
    died: 532,
    offices: [
      { office: "Emperor", state: null, from: 531, to: 532 }
    ]
  },
  {
    uid: "Q1149239",
    name: "Emperor Xiaojing of Eastern Wei",
    cjkName: null,
    cjkNames: [],
    aliases: ["Jing Di", "Yuan Shanjian"],
    desc: "Emperor of Eastern Wei from 534 to 550",
    born: 524,
    died: 552,
    offices: [
      { office: "Emperor", state: null, from: 534, to: 550 }
    ]
  },
  {
    uid: "Q2985487",
    name: "Emperor Wen of Western Wei",
    cjkName: null,
    cjkNames: [],
    aliases: ["Wen Di", "Yuan Baoju"],
    desc: "Emperor of Western Wei from 535 to 551",
    born: 507,
    died: 551,
    offices: [
      { office: "Emperor", state: null, from: 535, to: 551 },
      { office: "Emperor", state: null, from: 535, to: 551 }
    ]
  },
  {
    uid: "Q1140994",
    name: "Emperor Jianwen of Liang",
    cjkName: null,
    cjkNames: [],
    aliases: ["Jianwen Di", "Shizan", "Tai Zong", "Xiao Gang"],
    desc: "Chinese Emperor of the Liang dynasty",
    born: 503,
    died: 551,
    offices: [
      { office: "Emperor", state: null, from: 549, to: 551 }
    ]
  },
  {
    uid: "Q712338",
    name: "Emperor Wenxuan of Northern Qi",
    cjkName: null,
    cjkNames: [],
    aliases: ["Gao Yang"],
    desc: "Emperor of Northern Qi from 550 to 559",
    born: 526,
    died: 559,
    offices: [
      { office: "Emperor", state: null, from: 550, to: 559 }
    ]
  },
  {
    uid: "Q2660296",
    name: "Emperor Fei of Western Wei",
    cjkName: null,
    cjkNames: [],
    aliases: ["Yuan Qin"],
    desc: "Western Wei emperor",
    born: 525,
    died: 554,
    offices: [
      { office: "Emperor", state: null, from: 551, to: 554 }
    ]
  },
  {
    uid: "Q890338",
    name: "Hou Jing",
    cjkName: null,
    cjkNames: [],
    aliases: [],
    desc: "Chinese emperor during the Liang dynasty (503-552)",
    born: 503,
    died: 552,
    offices: [
      { office: "Emperor", state: null, from: 551, to: 552 }
    ]
  },
  {
    uid: "Q1059882",
    name: "Xiao Dong",
    cjkName: null,
    cjkNames: [],
    aliases: ["Dong Xiao"],
    desc: "Chinese emperor of the Liang dynasty",
    born: 501,
    died: 552,
    offices: [
      { office: "Emperor", state: null, from: 551, to: 551 }
    ]
  },
  {
    uid: "Q1149114",
    name: "Emperor Yuan of Liang",
    cjkName: null,
    cjkNames: [],
    aliases: ["Shi Zu", "Shicheng", "Xiao Yi", "Yuan Di"],
    desc: "Liang Dynasty emperor",
    born: 508,
    died: 555,
    offices: [
      { office: "Emperor", state: null, from: 552, to: 555 }
    ]
  },
  {
    uid: "Q837912",
    name: "Xiao Ji",
    cjkName: null,
    cjkNames: [],
    aliases: ["Emperor Wuling of Liang", "Liang Wuling wang", "Prince of Wuling"],
    desc: "Chinese emperor of Liang (Southern dynasties) (508-553)",
    born: 508,
    died: 553,
    offices: [
      { office: "Emperor", state: null, from: 552, to: 553 }
    ]
  },
  {
    uid: "Q2665689",
    name: "Emperor Gong of Western Wei",
    cjkName: null,
    cjkNames: [],
    aliases: ["Tuo Bakuo", "Tuoba Kuo", "Yuan Kuo"],
    desc: "Western Wei emperor",
    born: 537,
    died: 557,
    offices: [
      { office: "Emperor", state: null, from: 554, to: 557 }
    ]
  },
  {
    uid: "Q4308625",
    name: "Li Bing",
    cjkName: null,
    cjkNames: [],
    aliases: ["Li Bing(5)"],
    desc: "official of Northern Zhou (Chinese Northern dynasties period); father of Emperor Gaozu of Tang",
    born: 550,
    died: 573,
    offices: [
      { office: "Duke", state: null, from: 554, to: 564 },
      { office: "Zhuguo", state: null, from: 564, to: 574 },
      { office: "Chancellor of the Tang Dynasty", state: null, from: 564, to: 574 }
    ]
  },
  {
    uid: "Q1059979",
    name: "Emperor Jing of Liang",
    cjkName: null,
    cjkNames: [],
    aliases: ["Xiao Fangzhi"],
    desc: "Chinese Emperor (544-558)",
    born: 544,
    died: 558,
    offices: [
      { office: "Emperor", state: null, from: 555, to: 557 }
    ]
  },
  {
    uid: "Q1285740",
    name: "Emperor Xuan of Western Liang",
    cjkName: null,
    cjkNames: [],
    aliases: ["Lisun", "Xiao Cha", "Xiao Cha(Liangxuanhuangdi)", "Xiao Qie", "Xuan Di", "Zhong Zong"],
    desc: "Western Liang emperor",
    born: 519,
    died: 562,
    offices: [
      { office: "Emperor", state: null, from: 555, to: 562 }
    ]
  },
  {
    uid: "Q1059874",
    name: "Xiao Yuanming",
    cjkName: null,
    cjkNames: [],
    aliases: ["Xiao Ming"],
    desc: "Liang Dynasty emperor",
    born: 450,
    died: 556,
    offices: [
      { office: "Emperor", state: null, from: 555, to: 555 }
    ]
  },
  {
    uid: "Q1196041",
    name: "Emperor Ming of Northern Zhou",
    cjkName: null,
    cjkNames: [],
    aliases: ["Ming Di", "Shi Zong", "Yuwen Yu"],
    desc: "Northern Zhou emperor",
    born: 534,
    died: 560,
    offices: [
      { office: "Emperor", state: null, from: 557, to: 560 }
    ]
  },
  {
    uid: "Q718217",
    name: "Emperor Wu of Chen",
    cjkName: null,
    cjkNames: [],
    aliases: ["Chen Baxian", "Gao Zu", "Wu Di", "Xingguo"],
    desc: "founding emperor of Chen dynasty from 557 to 559",
    born: 503,
    died: 559,
    offices: [
      { office: "Emperor", state: null, from: 557, to: 559 }
    ]
  },
  {
    uid: "Q1149222",
    name: "Emperor Xiaomin of Northern Zhou",
    cjkName: null,
    cjkNames: [],
    aliases: ["Min Di", "Yuwen Jue"],
    desc: "Northern Zhou emperor",
    born: 542,
    died: 557,
    offices: [
      { office: "Emperor", state: null, from: 557, to: 557 }
    ]
  },
  {
    uid: "Q708368",
    name: "Emperor Fei of Northern Qi",
    cjkName: null,
    cjkNames: [],
    aliases: ["Gao Yin"],
    desc: "Northern Qi Emperor",
    born: 545,
    died: 561,
    offices: [
      { office: "Emperor", state: null, from: 559, to: 560 }
    ]
  },
  {
    uid: "Q712113",
    name: "Emperor Wen of Chen",
    cjkName: null,
    cjkNames: [],
    aliases: ["Chen Qian(4)", "Chen Tanqian", "Shi Zu", "Wen Di", "Zihua"],
    desc: "Chen Dynasty emperor",
    born: 522,
    died: 566,
    offices: [
      { office: "Emperor", state: null, from: 559, to: 566 }
    ]
  },
  {
    uid: "Q1327591",
    name: "Emperor Wu of Northern Zhou",
    cjkName: null,
    cjkNames: [],
    aliases: ["Gao Zu", "Wu Di", "Yuwen Yong"],
    desc: "Northern Zhou emperor",
    born: 543,
    died: 578,
    offices: [
      { office: "Emperor", state: null, from: 560, to: 578 }
    ]
  },
  {
    uid: "Q708325",
    name: "Emperor Xiaozhao of Northern Qi",
    cjkName: null,
    cjkNames: [],
    aliases: ["Gao Yan"],
    desc: "Northern Qi emperor (535-561)",
    born: 535,
    died: 561,
    offices: [
      { office: "Emperor", state: null, from: 560, to: 561 }
    ]
  },
  {
    uid: "Q718243",
    name: "Emperor Wucheng of Northern Qi",
    cjkName: null,
    cjkNames: [],
    aliases: ["Gao Zhan"],
    desc: "Northern Qi Emperor (537-569)",
    born: 537,
    died: 569,
    offices: [
      { office: "Emperor", state: null, from: 561, to: 565 }
    ]
  },
  {
    uid: "Q836203",
    name: "Emperor Ming of Western Liang",
    cjkName: null,
    cjkNames: [],
    aliases: ["Renyuan", "Xiao Kui", "Xiao Kui(2)"],
    desc: "Chinese emperor",
    born: 542,
    died: 585,
    offices: [
      { office: "Emperor", state: null, from: 562, to: 585 }
    ]
  },
  {
    uid: "Q718181",
    name: "Gao Wei",
    cjkName: null,
    cjkNames: [],
    aliases: [],
    desc: "Northern Qi emperor",
    born: 556,
    died: 577,
    offices: [
      { office: "Emperor", state: null, from: 565, to: 577 }
    ]
  },
  {
    uid: "Q718222",
    name: "Emperor Fei of Chen",
    cjkName: null,
    cjkNames: [],
    aliases: ["Chen Bozong", "Fei Di", "Fengye", "Linhai Wang"],
    desc: "Chinese emperor",
    born: 554,
    died: 570,
    offices: [
      { office: "Emperor", state: null, from: 566, to: 568 }
    ]
  },
  {
    uid: "Q718227",
    name: "Emperor Xuan of Chen",
    cjkName: null,
    cjkNames: [],
    aliases: ["Chen Tanxu", "Chen Xu(2)", "Gao Zong", "Shaoshi", "Xuan Di"],
    desc: "Chen Dynasty Emperor",
    born: 530,
    died: 582,
    offices: [
      { office: "Emperor", state: null, from: 568, to: 582 }
    ]
  },
  {
    uid: "Q288135",
    name: "Gao Heng",
    cjkName: null,
    cjkNames: [],
    aliases: [],
    desc: "Northern Qi emperor",
    born: 570,
    died: 577,
    offices: [
      { office: "Emperor", state: null, from: 577, to: 577 }
    ]
  },
  {
    uid: "Q1149215",
    name: "Emperor Xuan of Northern Zhou",
    cjkName: null,
    cjkNames: [],
    aliases: ["Yuwen Yun"],
    desc: "Northern Zhou emperor",
    born: 559,
    died: 580,
    offices: [
      { office: "Emperor", state: null, from: 578, to: 579 }
    ]
  },
  {
    uid: "Q1149124",
    name: "Emperor Jing of Northern Zhou",
    cjkName: null,
    cjkNames: [],
    aliases: ["Yuwen Chan", "Yuwen Yan"],
    desc: "Emperor of Northern Zhou",
    born: 573,
    died: 581,
    offices: [
      { office: "Emperor", state: null, from: 579, to: 581 }
    ]
  },
  {
    uid: "Q7418",
    name: "Emperor Wen of Sui",
    cjkName: null,
    cjkNames: [],
    aliases: ["Gao Zu", "Naluoyan", "Wen Di", "Yang Jian", "Yang Jian(8)", "Yeung Kin"],
    desc: "founding emperor of the Sui Dynasty (541-604)",
    born: 541,
    died: 604,
    offices: [
      { office: "Emperor", state: null, from: 581, to: 604 }
    ]
  },
  {
    uid: "Q718206",
    name: "Chen Shubao",
    cjkName: null,
    cjkNames: [],
    aliases: ["Hou Zhu", "Yuanxiu"],
    desc: "Chinese emperor (553-604)",
    born: 553,
    died: 604,
    offices: [
      { office: "Emperor", state: null, from: 582, to: 589 }
    ]
  },
  {
    uid: "Q837918",
    name: "Emperor Jing of Western Liang",
    cjkName: null,
    cjkNames: [],
    aliases: ["Wenwen", "Xiao Cong"],
    desc: "Western Liang emperor (558-607)",
    born: 558,
    died: 607,
    offices: [
      { office: "Emperor", state: null, from: 585, to: 587 }
    ]
  },
  {
    uid: "Q711674",
    name: "Li Jiancheng",
    cjkName: null,
    cjkNames: [],
    aliases: ["Crown Prince Yin", "Pishamen"],
    desc: "crown prince of the Tang Dynasty in China (589-626)",
    born: 589,
    died: 626,
    offices: [
    ]
  },
  {
    uid: "Q7419",
    name: "Emperor Yang of Sui",
    cjkName: null,
    cjkNames: [],
    aliases: ["Amo", "Emperor Min of Sui", "Emperor Ming of Sui", "Maharaja Yang dari Sui", "Sui Yangdi", "Yang Di", "Yang Guang", "Yang Guang(2)", "Yang Ying", "Yeung Kwong"],
    desc: "emperor of the Sui Dynasty",
    born: 569,
    died: 617,
    offices: [
      { office: "Emperor", state: null, from: 604, to: 618 }
    ]
  },
  {
    uid: "Q7420",
    name: "Emperor Gong of Sui",
    cjkName: null,
    cjkNames: [],
    aliases: ["Xiguo gong", "Yang You"],
    desc: "emperor of the Sui Dynasty",
    born: 605,
    died: 619,
    offices: [
      { office: "Emperor", state: null, from: 617, to: 618 }
    ]
  },
  {
    uid: "Q9700",
    name: "Emperor Gaozu of Tang",
    cjkName: null,
    cjkNames: [],
    aliases: ["Emperor Gaozu", "Gaozu", "Li Yuan", "Lǐ Yuān", "Shenyao dasheng daguang xiao huangdi", "Shude", "Taiwu"],
    desc: "Founding emperor of the Tang Dynasty (566-635) (r. 618–626)",
    born: 566,
    died: 635,
    offices: [
      { office: "Emperor", state: null, from: 618, to: 626 }
    ]
  },
  {
    uid: "Q708460",
    name: "Zhang Jianzhi",
    cjkName: null,
    cjkNames: [],
    aliases: ["Mengjiang", "Wenzhen"],
    desc: "Chinese chancellor (625-706)",
    born: 625,
    died: 706,
    offices: [
    ]
  },
  {
    uid: "Q9701",
    name: "Emperor Taizong of Tang",
    cjkName: null,
    cjkNames: [],
    aliases: ["Li Huangdi", "Li Shimin", "Taizong", "Tang Tai-tsung", "Tang Taizong", "Tengri Qaghan", "Wen", "Wenwu dasheng daguang xiao huangdi"],
    desc: "Chinese emperor of the Tang Dynasty (598-649) (r. 626-649)",
    born: 598,
    died: 649,
    offices: [
      { office: "Emperor", state: null, from: 626, to: 649 },
      { office: "Khan of Heaven", state: null, from: 630, to: 649 }
    ]
  },
  {
    uid: "Q9703",
    name: "Emperor Gaozong of Tang",
    cjkName: null,
    cjkNames: [],
    aliases: ["Gaozong", "Li Zhi", "Tang Gaozong", "Tianhuang dasheng dahong xiao huangdi", "Tianhuangdadi", "Weishan"],
    desc: "Emperor of the Tang Dynasty (628-683) (r. 649-683)",
    born: 628,
    died: 683,
    offices: [
      { office: "Emperor", state: null, from: 649, to: 683 },
      { office: "Khan of Heaven", state: null, from: 649, to: 683 }
    ]
  },
  {
    uid: "Q1063783",
    name: "Empress Wei",
    cjkName: null,
    cjkNames: [],
    aliases: ["Wei Shi", "Wei huanghou"],
    desc: "wife of Emperor Zhongzong of Tang (664-710)",
    born: 664,
    died: 710,
    offices: [
      { office: "Empress Consort", state: null, from: 683, to: 683 },
      { office: "Empress Consort", state: null, from: 705, to: 710 }
    ]
  },
  {
    uid: "Q9722",
    name: "Emperor Ruizong of Tang",
    cjkName: null,
    cjkNames: [],
    aliases: ["Dasheng zhen huangdi", "Li Dan", "Li Lun", "Li Si", "Li Xulun", "Lǐ Dàn", "Ruizong", "Wu Dan", "Wu Lun", "Xiangwanglidan"],
    desc: "emperor of the Tang Dynasty",
    born: 662,
    died: 716,
    offices: [
      { office: "Emperor", state: null, from: 684, to: 690 },
      { office: "Emperor", state: null, from: 710, to: 712 }
    ]
  },
  {
    uid: "Q9717",
    name: "Emperor Zhongzong of Tang",
    cjkName: null,
    cjkNames: [],
    aliases: ["Dahe dasheng dazhao xiao huangdi", "Li Huangshang", "Li Xian", "Li Zhe", "Li(2) Zhe", "Lǐ Xiǎn", "Wu Xian", "Xiaohe huangdi", "Zhong Zong", "Zhongzong"],
    desc: "emperor of the Tang Dynasty",
    born: 656,
    died: 710,
    offices: [
      { office: "Emperor", state: null, from: 684, to: 684 },
      { office: "Emperor", state: null, from: 705, to: 710 }
    ]
  },
  {
    uid: "Q9738",
    name: "Wu Zetian",
    cjkName: null,
    cjkNames: [],
    aliases: ["Empress Consort Wu", "Empress Wu", "Wu Zhao", "Wu mei", "Wuzetian", "Zetian dasheng huanghou", "shunsheng huanghou"],
    desc: "founding empress of Zhou dynasty (r. 690–705); de facto ruler of Tang dynasty from 665 to 690",
    born: 624,
    died: 705,
    offices: [
      { office: "Emperor", state: null, from: 690, to: 705 }
    ]
  },
  {
    uid: "Q9743",
    name: "Emperor Shang of Tang",
    cjkName: null,
    cjkNames: [],
    aliases: ["Emperor Shang", "Emperor Shao", "Li Chongmao", "Li Zhongmao", "Shang huangdi"],
    desc: "emperor of the Tang Dynasty",
    born: 695,
    died: 715,
    offices: [
      { office: "Emperor", state: null, from: 710, to: 710 }
    ]
  },
  {
    uid: "Q9746",
    name: "Emperor Xuanzong of Tang",
    cjkName: null,
    cjkNames: [],
    aliases: ["Emperor Minghuang of Tang", "Emperor of China Chih-tao-ta-sheng-ta-ming-hsiao-huang-ti", "Emperor of China Hsien-tʻien", "Emperor of China Hsüan Tsung", "Emperor of China Hsüan-tsung", "Emperor of China Hüan Dsung", "Emperor of China Kaiyuan", "Emperor of China Kʻai-yüan", "Emperor of China Ming Huang", "Emperor of China Ming Hwang", "Emperor of China Tang Minghuang", "Emperor of China Tang Xuanzong", "Emperor of China Tang Yuanzong", "Emperor of China Tianbao", "Emperor of China Tʻang Hsüan-tsung", "Emperor of China Tʻang Ming-huang", "Emperor of China Tʻang Yüan-tsung", "Emperor of China Tʻien-pao", "Emperor of China Xiantian", "Emperor of China Xuan Zong"],
    desc: "7th emperor of the Tang dynasty, reigning from 713 to 756 CE",
    born: 685,
    died: 762,
    offices: [
      { office: "Emperor", state: null, from: 712, to: 756 },
      { office: "Taishang Huang", state: null, from: 756, to: 762 }
    ]
  },
  {
    uid: "Q9749",
    name: "Emperor Suzong of Tang",
    cjkName: null,
    cjkNames: [],
    aliases: ["Li Heng", "Li Jun", "Li Shao", "Li Sisheng", "Li Xun", "Li Yu", "Su Zong", "Suzong", "Tang Suzong Emperor"],
    desc: "emperor of the Tang Dynasty",
    born: 711,
    died: 762,
    offices: [
      { office: "Emperor", state: null, from: 756, to: 762 },
      { office: "Crown Prince", state: null, from: 738, to: 756 }
    ]
  },
  {
    uid: "Q9753",
    name: "Emperor Daizong of Tang",
    cjkName: null,
    cjkNames: [],
    aliases: ["Dai Zong", "Li Chu", "Li Yu", "Li Yu(8)", "Li(2) Shu"],
    desc: "emperor of the Tang Dynasty",
    born: 727,
    died: 779,
    offices: [
      { office: "Emperor", state: null, from: 762, to: 779 },
      { office: "Crown Prince", state: null, from: 758, to: 762 }
    ]
  },
  {
    uid: "Q6538769",
    name: "Li Fengji",
    cjkName: null,
    cjkNames: [],
    aliases: ["Cheng", "Li Ershi", "Xuzhou"],
    desc: "Chinese writer and chancellor",
    born: 758,
    died: 835,
    offices: [
    ]
  },
  {
    uid: "Q9755",
    name: "Emperor Dezong of Tang",
    cjkName: null,
    cjkNames: [],
    aliases: ["Dezong", "Li Kuo", "Shenwuxiaowen"],
    desc: "emperor of the Tang Dynasty",
    born: 742,
    died: 805,
    offices: [
      { office: "Emperor", state: null, from: 779, to: 805 },
      { office: "Crown Prince", state: null, from: 764, to: 779 }
    ]
  },
  {
    uid: "Q9760",
    name: "Emperor Shunzong of Tang",
    cjkName: null,
    cjkNames: [],
    aliases: ["Dasheng Da'an Xiao", "Emperor Zhide", "Li Song", "Li Song(6)", "Shun Zong"],
    desc: "emperor of the Tang Dynasty",
    born: 761,
    died: 806,
    offices: [
      { office: "Emperor", state: null, from: 805, to: 805 },
      { office: "Crown Prince", state: null, from: 779, to: 805 }
    ]
  },
  {
    uid: "Q9761",
    name: "Emperor Xianzong of Tang",
    cjkName: null,
    cjkNames: [],
    aliases: ["Li Chun", "Li Chun(2)", "Li Chun(Xianzonghuangdi)", "Xian Zong"],
    desc: "emperor of the Tang Dynasty",
    born: 778,
    died: 820,
    offices: [
      { office: "Emperor", state: null, from: 805, to: 820 },
      { office: "Crown Prince", state: null, from: 805, to: 805 }
    ]
  },
  {
    uid: "Q9763",
    name: "Emperor Muzong of Tang",
    cjkName: null,
    cjkNames: [],
    aliases: ["Emperor Tang Muzong", "Li Heng", "Li Heng(2)", "Li Muzong", "Li You", "Mu Zong", "Tang Muzong"],
    desc: "emperor of the Tang Dynasty",
    born: 795,
    died: 824,
    offices: [
      { office: "Emperor", state: null, from: 820, to: 824 },
      { office: "Crown Prince", state: null, from: 812, to: 820 }
    ]
  },
  {
    uid: "Q9776",
    name: "Emperor Jingzong of Tang",
    cjkName: null,
    cjkNames: [],
    aliases: ["Emperor Ruiwu Zhaomin Xiao", "Emperor Zhaomin", "Jing Zong", "Li Zhan"],
    desc: "emperor of the Tang Dynasty",
    born: 809,
    died: 827,
    offices: [
      { office: "Emperor", state: null, from: 824, to: 827 }
    ]
  },
  {
    uid: "Q9790",
    name: "Emperor Wenzong of Tang",
    cjkName: null,
    cjkNames: [],
    aliases: ["Emperor Yuansheng Zhaoxian Xiao", "Emperor Zhaoxian", "Li Ang", "Li Ang(Wenzonghuangdi)", "Li Han", "Wenzong", "Yuanshengzhaoxian huangdi"],
    desc: "emperor of the Tang Dynasty",
    born: 809,
    died: 840,
    offices: [
      { office: "Emperor", state: null, from: 827, to: 840 }
    ]
  },
  {
    uid: "Q9801",
    name: "Emperor Wuzong of Tang",
    cjkName: null,
    cjkNames: [],
    aliases: ["Emperor Zedao Zhaosui Xiao", "Li Chan", "Li Yan", "Li Yan(5)", "Wu Zong"],
    desc: "emperor of the Tang Dynasty",
    born: 814,
    died: 846,
    offices: [
      { office: "Emperor", state: null, from: 840, to: 846 }
    ]
  },
  {
    uid: "Q9825",
    name: "Emperor Xuánzong of Tang",
    cjkName: null,
    cjkNames: [],
    aliases: ["Emperor Xuanzong of Tang", "Emperor Yuanshen Zeming Chengwu Xiangwen Ruize Jianren Shenchung Yidao Daxiao", "Li Chen", "Li Chen(Xuanzonghuangdi)", "Li Yi", "Shengwu xianwenxiao huangdi", "Tang Xuānzong", "Xuanzong", "Xuánzōng"],
    desc: "Emperor of Tang China from 846 to 859 AD",
    born: 810,
    died: 859,
    offices: [
      { office: "Emperor", state: null, from: 846, to: 859 }
    ]
  },
  {
    uid: "Q9886",
    name: "Emperor Yizong of Tang",
    cjkName: null,
    cjkNames: [],
    aliases: ["Emperor Gonghui", "Emperor Zhaosheng Gonghui Xiao", "Li Cui", "Li Cui(Yizonghuangdi)", "Li Wen", "Ruiwen zhaosheng gonghui xiao huangdi", "Yi Zong", "Yizong"],
    desc: "emperor of the Tang Dynasty",
    born: 833,
    died: 873,
    offices: [
      { office: "Emperor", state: null, from: 859, to: 873 },
      { office: "Emperor", state: null, from: 859, to: 873 }
    ]
  },
  {
    uid: "Q9889",
    name: "Emperor Xizong of Tang",
    cjkName: null,
    cjkNames: [],
    aliases: ["Emperor Gongding", "Emperor Huisheng Gongding Xiao", "Li Xuan", "Li Yan", "Xi Zong"],
    desc: "emperor of the Tang Dynasty",
    born: 862,
    died: 888,
    offices: [
      { office: "Emperor", state: null, from: 873, to: 888 },
      { office: "Emperor", state: null, from: 873, to: 888 }
    ]
  },
  {
    uid: "Q714113",
    name: "Huang Chao",
    cjkName: null,
    cjkNames: [],
    aliases: ["Chongtian dajiangjun", "Huang di"],
    desc: "Chinese emperor",
    born: 801,
    died: 884,
    offices: [
      { office: "Emperor", state: null, from: 881, to: 884 }
    ]
  },
  {
    uid: "Q9891",
    name: "Emperor Zhaozong of Tang",
    cjkName: null,
    cjkNames: [],
    aliases: ["Emperor Gōnglíng Zhuāngmǐn Xiào", "Emperor Shèngmù Jǐngwén Xìao", "Li Jie", "Li Min", "Li Ye", "Shengmu jingwen xiao huangdi", "Xiāngzōng", "Zhaozong", "Zhāozōng"],
    desc: "final emperor of the Tang dynasty of China (r. 888-904)",
    born: 867,
    died: 904,
    offices: [
      { office: "Emperor", state: null, from: 888, to: 900 },
      { office: "Emperor", state: null, from: 901, to: 904 },
      { office: "Emperor", state: null, from: 888, to: 904 }
    ]
  },
  {
    uid: "Q9892",
    name: "Emperor Ai of Tang",
    cjkName: null,
    cjkNames: [],
    aliases: ["Emperor Zhaoxuan", "Emperor Zhaoxuan Guanglie Xiao", "Jǐngzōng", "Li Zhu", "Li Zuo"],
    desc: "final emperor of Tang-dynasty China from 904 to 907",
    born: 892,
    died: 908,
    offices: [
      { office: "Emperor", state: null, from: 904, to: 907 }
    ]
  },
  {
    uid: "Q1275305",
    name: "Emperor Taizu of Later Liang",
    cjkName: null,
    cjkNames: [],
    aliases: ["Zhu Huang", "Zhu Quanzhong"],
    desc: "Chinese warlord and Later Liang emperor from 907 to 912",
    born: 852,
    died: 912,
    offices: [
      { office: "Emperor", state: null, from: 907, to: 912 }
    ]
  },
  {
    uid: "Q1071598",
    name: "Ma Yin",
    cjkName: null,
    cjkNames: [],
    aliases: [],
    desc: "Chu prince",
    born: 853,
    died: 930,
    offices: [
      { office: "King", state: null, from: 907, to: 930 }
    ]
  },
  {
    uid: "Q708651",
    name: "Wang Jian",
    cjkName: null,
    cjkNames: [],
    aliases: ["Gaozu", "Guangtu", "Kao-tsu", "Kuang-t'u", "Kuang-tu", "Wang Chien", "Zeiwangba"],
    desc: "king or emperor of Former Shu (847–918)",
    born: 847,
    died: 918,
    offices: [
      { office: "Emperor", state: null, from: 907, to: 918 }
    ]
  },
  {
    uid: "Q1138520",
    name: "Zhu Yougui",
    cjkName: null,
    cjkNames: [],
    aliases: ["Prince of Ying"],
    desc: "Later Liang Emperor",
    born: 888,
    died: 913,
    offices: [
      { office: "Emperor", state: null, from: 912, to: 913 }
    ]
  },
  {
    uid: "Q1319637",
    name: "Zhu Zhen",
    cjkName: null,
    cjkNames: [],
    aliases: ["Zhu Youzhen"],
    desc: "Emperor of Later Liang (888-923)",
    born: 888,
    died: 923,
    offices: [
      { office: "Emperor", state: null, from: 913, to: 923 }
    ]
  },
  {
    uid: "Q4989",
    name: "Emperor Taizu of Liao",
    cjkName: null,
    cjkNames: [],
    aliases: ["Abaoji", "Apaochi", "Dasheng Daming Shenlie Tianhuangdi", "Dasheng Daming Tianhuangdi", "Liu Yi", "Shengtian Huangdi", "Tai Zu", "Tian Huangdi", "Yelv Abaoji", "Yelv Abaojin(Abuji)", "Yelv Yi", "Yelv(1) Chuolizhi", "Yelü Abaoji", "Yelü Yi"],
    desc: "Emperor of the Khitans and founder of the Liao dynasty (872-926)",
    born: 872,
    died: 926,
    offices: [
      { office: "Emperor", state: null, from: 916, to: 926 }
    ]
  },
  {
    uid: "Q706815",
    name: "Emperor Zhuangzong of Later Tang",
    cjkName: null,
    cjkNames: [],
    aliases: ["Li Cunxu", "Yazi", "Zhuangzong"],
    desc: "Prince of Jin and then Emperor of Later Tang (885-926)",
    born: 885,
    died: 926,
    offices: [
      { office: "Emperor", state: null, from: 923, to: 926 }
    ]
  },
  {
    uid: "Q703646",
    name: "Li Siyuan",
    cjkName: null,
    cjkNames: [],
    aliases: ["Emperor Mingzong", "Li Dan", "Miaojilie"],
    desc: "emperor of Later Tang Dynasty (867-933)",
    born: 867,
    died: 933,
    offices: [
      { office: "Emperor", state: null, from: 926, to: 933 }
    ]
  },
  {
    uid: "Q4991",
    name: "Emperor Taizong of Liao",
    cjkName: null,
    cjkNames: [],
    aliases: ["Emperor Taizong", "Ruiwen Shenwu Fatian Qingyun Mingde Zhangxin Zhidao Guangjing Zhaoxiao Sisheng Huangdi", "Sisheng Huangdi", "Taizong", "Taizong of Liao", "Xiaowu Huiwen Huangdi", "Yelv Deguang", "Yelv Dejin", "Yelv Yaogu(Yaoquzhi)"],
    desc: "emperor of the Liao dynasty of China from 927 to 947",
    born: 902,
    died: 947,
    offices: [
      { office: "Emperor", state: null, from: 927, to: 947 },
      { office: "Emperor", state: null, from: 947, to: 947 }
    ]
  },
  {
    uid: "Q708431",
    name: "Emperor Min of Later Tang",
    cjkName: null,
    cjkNames: [],
    aliases: ["Conghou Li", "Li Conghou"],
    desc: "Chinese emperor (914-934)",
    born: 914,
    died: 934,
    offices: [
      { office: "Emperor", state: null, from: 933, to: 934 }
    ]
  },
  {
    uid: "Q713115",
    name: "Li Congke",
    cjkName: null,
    cjkNames: [],
    aliases: [],
    desc: "Last emperor of Later Tang (885-937) (r. 934-937) (885-937)",
    born: 885,
    died: 937,
    offices: [
      { office: "Emperor", state: null, from: 934, to: 937 }
    ]
  },
  {
    uid: "Q1071718",
    name: "Meng Chang",
    cjkName: null,
    cjkNames: [],
    aliases: ["Baoyuan", "Gongxiao", "Houshu houzhu", "Meng Renzan"],
    desc: "Emperor of Later Shu",
    born: 919,
    died: 965,
    offices: [
      { office: "Emperor", state: null, from: 934, to: 965 }
    ]
  },
  {
    uid: "Q1149186",
    name: "Meng Zhixiang",
    cjkName: null,
    cjkNames: [],
    aliases: [],
    desc: "general and later founder of the Later Shu kingdom",
    born: 874,
    died: 934,
    offices: [
      { office: "Emperor", state: null, from: 934, to: 934 }
    ]
  },
  {
    uid: "Q2109914",
    name: "Wang Jipeng",
    cjkName: null,
    cjkNames: [],
    aliases: ["Kangzong", "Wang Chang"],
    desc: "Min person CBDB = 11522",
    born: null,
    died: 939,
    offices: [
      { office: "Emperor", state: null, from: 935, to: 939 }
    ]
  },
  {
    uid: "Q1189495",
    name: "Emperor Gaozu of Later Jin",
    cjkName: null,
    cjkNames: [],
    aliases: ["Gaozu", "Shi Jingtang"],
    desc: "Later Jin emperor (892-942)",
    born: 892,
    died: 942,
    offices: [
      { office: "Emperor", state: null, from: 936, to: 942 }
    ]
  },
  {
    uid: "Q4993",
    name: "Emperor Muzong of Liao",
    cjkName: null,
    cjkNames: [],
    aliases: ["Liao Muzong", "Muzong", "Tianshun Huangdi", "Yelv Jing", "Yelv Ming", "Yelv Shulv", "Yelü Jing", "Yelü Ming"],
    desc: "emperor of the Liao Dynasty",
    born: 931,
    died: 969,
    offices: [
      { office: "Emperor", state: null, from: 951, to: 969 },
      { office: "Imperial Prince", state: null, from: 939, to: 951 }
    ]
  },
  {
    uid: "Q1319472",
    name: "Shi Chonggui",
    cjkName: null,
    cjkNames: [],
    aliases: [],
    desc: "Last Emperor of China from the Later Jin (914-974)",
    born: 914,
    died: 974,
    offices: [
      { office: "Emperor", state: null, from: 942, to: 947 }
    ]
  },
  {
    uid: "Q2109927",
    name: "Wang Yanjun",
    cjkName: null,
    cjkNames: [],
    aliases: ["Wang Lin"],
    desc: "third ruler of the Chinese Five Dynasties and Ten Kingdoms state Min",
    born: null,
    died: 935,
    offices: [
      { office: "Emperor", state: null, from: 943, to: 945 }
    ]
  },
  {
    uid: "Q708522",
    name: "Emperor Gaozu of Later Han",
    cjkName: null,
    cjkNames: [],
    aliases: ["Gao Zu", "Liu Zhiyuan"],
    desc: "Later Han emperor from 947 to 948",
    born: 895,
    died: 948,
    offices: [
      { office: "Emperor", state: null, from: 947, to: 948 }
    ]
  },
  {
    uid: "Q4992",
    name: "Emperor Shizong of Liao",
    cjkName: null,
    cjkNames: [],
    aliases: ["Liao Shizong", "Shi Zong", "Shizong", "Tianshou Huangdi", "Wuyu", "Xiaohe Zhuangxian Huangdi", "Yelv Ruan", "Yelv Wuyu(Weiyu)", "Yelü Ruan"],
    desc: "third emperor of the Liao Dynasty",
    born: 919,
    died: 951,
    offices: [
      { office: "Emperor", state: null, from: 947, to: 951 }
    ]
  },
  {
    uid: "Q713108",
    name: "Emperor Yin of Later Han",
    cjkName: null,
    cjkNames: [],
    aliases: ["Liu Chengyou", "Yin Di"],
    desc: "Later Han emperor",
    born: 931,
    died: 951,
    offices: [
      { office: "Emperor", state: null, from: 948, to: 951 }
    ]
  },
  {
    uid: "Q1188860",
    name: "Emperor Taizu of Later Zhou",
    cjkName: null,
    cjkNames: [],
    aliases: ["Guo Wei"],
    desc: "Emperor of Later Zhou from 951 to 954",
    born: 904,
    died: 954,
    offices: [
      { office: "Emperor", state: null, from: 951, to: 954 }
    ]
  },
  {
    uid: "Q712595",
    name: "Liu Min",
    cjkName: null,
    cjkNames: [],
    aliases: ["Beihan Shizu", "Liu Chong", "Pei-han Shih-tsu", "Shenwu Huangdi", "Shizu"],
    desc: "Northern Han emperor",
    born: 895,
    died: 954,
    offices: [
      { office: "Emperor", state: null, from: 951, to: 954 }
    ]
  },
  {
    uid: "Q1319646",
    name: "Emperor Shizong of Later Zhou",
    cjkName: null,
    cjkNames: [],
    aliases: ["Chai Rong", "Guo Rong", "Shi Zong", "Shizong"],
    desc: "Later Zhou dynasty emperor from 954 to 959",
    born: 921,
    died: 959,
    offices: [
      { office: "Emperor", state: null, from: 954, to: 959 }
    ]
  },
  {
    uid: "Q8013009",
    name: "Liu Jun",
    cjkName: null,
    cjkNames: [],
    aliases: ["Liu Chengjun"],
    desc: "Northern Han emperor",
    born: 926,
    died: 968,
    offices: [
      { office: "Emperor", state: null, from: 954, to: 968 }
    ]
  },
  {
    uid: "Q1195669",
    name: "Emperor Gongdi of Later Zhou",
    cjkName: null,
    cjkNames: [],
    aliases: ["Guo Zongxun"],
    desc: "Later Zhou emperor",
    born: 953,
    died: 973,
    offices: [
      { office: "Emperor", state: null, from: 959, to: 960 }
    ]
  },
  {
    uid: "Q7471",
    name: "Emperor Taizu of Song",
    cjkName: null,
    cjkNames: [],
    aliases: ["Tai Zu", "Zhao Kuangyin"],
    desc: "founding emperor of the Song Dynasty (reigned 960-976)",
    born: 927,
    died: 976,
    offices: [
      { office: "Emperor", state: null, from: 960, to: 976 },
      { office: "Emperor", state: null, from: 960, to: 976 }
    ]
  },
  {
    uid: "Q378528",
    name: "Li Yu",
    cjkName: null,
    cjkNames: [],
    aliases: ["Chongguang", "Li Congjia", "Li Houzhu", "Zhongfeng yinzhe", "Zhongfengbailian jushi", "Zhongshanyinshi", "Zhongyin"],
    desc: "ruler of the Southern Tang Kingdom in ancient China",
    born: 937,
    died: 978,
    offices: [
      { office: "Emperor", state: null, from: 961, to: 975 }
    ]
  },
  {
    uid: "Q10900291",
    name: "Liu Ji'en",
    cjkName: null,
    cjkNames: [],
    aliases: ["Xue Ji'en"],
    desc: "Northern Han emperor",
    born: 950,
    died: 968,
    offices: [
      { office: "Emperor", state: null, from: 968, to: 968 }
    ]
  },
  {
    uid: "Q842954",
    name: "Liu Jiyuan",
    cjkName: null,
    cjkNames: [],
    aliases: [],
    desc: "Northern Han emperor",
    born: 950,
    died: 992,
    offices: [
      { office: "Emperor", state: null, from: 968, to: 979 }
    ]
  },
  {
    uid: "Q4997",
    name: "Emperor Jingzong of Liao",
    cjkName: null,
    cjkNames: [],
    aliases: ["Jing Zong", "Jingzong", "Liao Jingzong", "Tianzan Huangdi", "Xiaocheng Kangjing Huangdi", "Yelv Mingji", "Yelv Mingyi", "Yelv Xian", "Yelv Xianning", "Yelü Xian"],
    desc: "5th emperor of Liao Dynasty (r. 969－982)",
    born: 948,
    died: 982,
    offices: [
      { office: "Emperor", state: null, from: 969, to: 982 }
    ]
  },
  {
    uid: "Q777372",
    name: "Xiao Chuo",
    cjkName: null,
    cjkNames: [],
    aliases: ["Chengtian Huangtaihou", "Empress Dowager Chengtian", "Empress Dowager Xiao", "Ruide Shenlve Yingyun Qihua Chengtian Huangtaihou", "Ruizhi Huanghou", "Shengsheng Xuanjian Huanghou", "Xiao Yanyan"],
    desc: "empress of Emperor Jingzong of Liao dynasty (r. 982-1009); CDBD ID=43666",
    born: 953,
    died: 1009,
    offices: [
      { office: "Emperor", state: null, from: 969, to: 979 }
    ]
  },
  {
    uid: "Q7473",
    name: "Emperor Taizong of Song",
    cjkName: null,
    cjkNames: [],
    aliases: ["Guangyi", "Tai Zong", "Zhao Jiong", "Zhao Kuangyi"],
    desc: "2nd emperor of the Song Dynasty",
    born: 939,
    died: 997,
    offices: [
      { office: "Emperor", state: null, from: 976, to: 997 }
    ]
  },
  {
    uid: "Q5000",
    name: "Emperor Shengzong of Liao",
    cjkName: null,
    cjkNames: [],
    aliases: ["Hongwen Xuanwu Zundao Zhide Chongren Guangxiao Congrui Zhaosheng Shenzan Tianfu Huangdi", "Ruiwen Yingwu Zundao Zhide Chongren Guangxiao Gongcheng Zhiding Zhaosheng Shenzan Tianfu Huangdi", "Sheng Zong", "Tianfu Huangdi", "Wenwu Daxiaoxuan Huangdi", "Yelv Longxu", "Yelv Wenshunu", "Yelü Longxu", "Zhaosheng Huangdi", "Zhide Guangxiao Zhaosheng Tianfu Huangdi"],
    desc: "sixth emperor of the Liao Dynasty (r. 982-1031)",
    born: 972,
    died: 1031,
    offices: [
      { office: "Emperor", state: null, from: 982, to: 1031 }
    ]
  },
  {
    uid: "Q7475",
    name: "Emperor Zhenzong of Song",
    cjkName: null,
    cjkNames: [],
    aliases: ["Zhao Dechang", "Zhao Heng", "Zhao Yuankan", "Zhao Yuanxiu", "Zhen Zong"],
    desc: "Chinese emperor from 997 to 1022",
    born: 968,
    died: 1022,
    offices: [
      { office: "Emperor", state: null, from: 997, to: 1022 }
    ]
  },
  {
    uid: "Q7477",
    name: "Emperor Renzong of Song",
    cjkName: null,
    cjkNames: [],
    aliases: ["Ren Zong", "Renzong Of Song", "Song Renzong", "Zhao Shouyi", "Zhao Zhen"],
    desc: "Chinese emperor from 1022 to 1063",
    born: 1010,
    died: 1063,
    offices: [
      { office: "Emperor", state: null, from: 1022, to: 1063 },
      { office: "Crown Prince", state: null, from: 1018, to: 1022 }
    ]
  },
  {
    uid: "Q5005",
    name: "Emperor Xingzong of Liao",
    cjkName: null,
    cjkNames: [],
    aliases: ["Congwen Shengwu Yinglve Shengong Ruizhe Renxiao Huangdi", "Qintian Fengdao Youshi Xingli Wuding Wencheng Shengshen Renxiao Huangdi", "Shensheng Xiaozhang Huangdi", "Wenwu Rensheng Zhaoxiao Huangdi", "Xing Zong", "Yelu Zongzhen", "Yelv Yibujin", "Yelv Zhigu(Zhubugu)", "Yelv Zongzhen", "Yelü Zongzhen"],
    desc: "emperor of the Liao Dynasty",
    born: 1016,
    died: 1055,
    offices: [
      { office: "Emperor", state: null, from: 1031, to: 1055 },
      { office: "Crown Prince", state: null, from: 1021, to: 1031 }
    ]
  },
  {
    uid: "Q7438",
    name: "Emperor Jingzong of Western Xia",
    cjkName: null,
    cjkNames: [],
    aliases: ["Li Weili", "Li Yuanhao", "Tabghatch Yuanhao", "Tuoba Yuanhao", "Weiming Nangxiao", "Zhao Yuanhao"],
    desc: "Founding emperor of the Western Xia (Dangxiang Empire)",
    born: 1003,
    died: 1048,
    offices: [
      { office: "Emperor", state: null, from: 1032, to: 1048 }
    ]
  },
  {
    uid: "Q5007",
    name: "Emperor Daozong of Liao",
    cjkName: null,
    cjkNames: [],
    aliases: ["Daozong", "Shengwen Shenwu Quangong Dalve Guangzhi Congren Ruixiao Tianyou Huangdi", "Tianyou Huangdi", "Xiaowen Huangdi", "Yehlu Hongji", "Yelu Hongji", "Yelv Chala", "Yelv Hongji", "Yelv Nielin", "Yelü Hongji"],
    desc: "emperor of the Liao Dynasty",
    born: 1032,
    died: 1101,
    offices: [
      { office: "Emperor", state: null, from: 1055, to: 1101 }
    ]
  },
  {
    uid: "Q334323",
    name: "Ouyang Xiu",
    cjkName: null,
    cjkNames: [],
    aliases: ["Liuyi jushi", "Ou-yang Hsiu", "Wenzhong", "Wenzhong Gong", "Yongshu", "Zuiweng"],
    desc: "Chinese poet, historian and statesman (1007-1072)",
    born: 1007,
    died: 1072,
    offices: [
      { office: "Mayor of Kaifeng Fu", state: null, from: 1058, to: 1059 }
    ]
  },
  {
    uid: "Q7479",
    name: "Emperor Yingzong of Song",
    cjkName: null,
    cjkNames: [],
    aliases: ["Emperor Ying-tsung of Sung", "Ying Zong", "Zhao Shu", "Zhao Zongshi"],
    desc: "5th Emperor of the Northern Song Dynasty",
    born: 1032,
    died: 1067,
    offices: [
      { office: "Emperor", state: null, from: 1063, to: 1067 },
      { office: "Crown Prince", state: null, from: 1062, to: 1063 }
    ]
  },
  {
    uid: "Q7483",
    name: "Emperor Shenzong of Song",
    cjkName: null,
    cjkNames: [],
    aliases: ["Shen Zong", "Zhao Xu", "Zhao Zhongzhen"],
    desc: "6th emperor of the Northern Song Dynasty",
    born: 1048,
    died: 1085,
    offices: [
      { office: "Emperor", state: null, from: 1067, to: 1085 },
      { office: "Crown Prince", state: null, from: 1066, to: 1067 }
    ]
  },
  {
    uid: "Q5009",
    name: "Emperor Tianzuo of Liao",
    cjkName: null,
    cjkNames: [],
    aliases: ["Huiwen Zhiwu Shengxiao Tianzuo Huangdi", "Liao Tianzuo", "Tianzuo Huangdi", "Yelv Aguo", "Yelv Yanning", "Yelv Yanxi", "Yelü Yanxi"],
    desc: "emperor of the Liao Dynasty",
    born: 1075,
    died: 1128,
    offices: [
      { office: "Emperor", state: null, from: 1101, to: 1125 },
      { office: "Imperial Prince", state: null, from: 1081, to: 1101 }
    ]
  },
  {
    uid: "Q7484",
    name: "Emperor Zhezong of Song",
    cjkName: null,
    cjkNames: [],
    aliases: ["Zhao Xu", "Zhe Zong", "Zhezong of Song"],
    desc: "7th emperor of the Song Dynasty",
    born: 1077,
    died: 1100,
    offices: [
      { office: "Emperor", state: null, from: 1085, to: 1100 },
      { office: "Crown Prince", state: null, from: 1085, to: 1085 }
    ]
  },
  {
    uid: "Q7457",
    name: "Emperor Shenzong of Western Xia",
    cjkName: null,
    cjkNames: [],
    aliases: ["Emperor Shenzong", "Li Zunxu"],
    desc: "emperor of the Western Xia Dynasty",
    born: 1163,
    died: 1226,
    offices: [
      { office: "Emperor", state: null, from: 1086, to: 1139 }
    ]
  },
  {
    uid: "Q7486",
    name: "Emperor Huizong of Song",
    cjkName: null,
    cjkNames: [],
    aliases: ["Emperor Hui-tsung of Sung", "Emperor Huizong", "Hui Zong", "Hui-tsung", "Huizong", "Song Huizong", "Zhao Ji"],
    desc: "emperor of the Song Dynasty (1082-1135)",
    born: 1082,
    died: 1135,
    offices: [
      { office: "Emperor", state: null, from: 1100, to: 1126 },
      { office: "Taishang Huang", state: null, from: 1126, to: 1127 }
    ]
  },
  {
    uid: "Q7488",
    name: "Emperor Qinzong of Song",
    cjkName: null,
    cjkNames: [],
    aliases: ["Emperor Chin-tsung of Sung", "Prince Huan", "Qin Zong", "Qinzong o Zhao Huan", "Zhao Dan", "Zhao Huan", "Zhao Xuan"],
    desc: "emperor of the Song Dynasty",
    born: 1100,
    died: 1161,
    offices: [
      { office: "Emperor", state: null, from: 1126, to: 1127 },
      { office: "Crown Prince", state: null, from: 1115, to: 1126 }
    ]
  },
  {
    uid: "Q5060",
    name: "Emperor Taizu of Jin",
    cjkName: null,
    cjkNames: [],
    aliases: ["Aguda", "Jin Taizu", "Wanyan Aguda"],
    desc: "Jin Dynasty emperor (1068-1123)",
    born: 1068,
    died: 1123,
    offices: [
      { office: "Emperor", state: null, from: 1115, to: 1123 }
    ]
  },
  {
    uid: "Q5070",
    name: "Emperor Taizong of Jin",
    cjkName: null,
    cjkNames: [],
    aliases: ["Emperor Tiyuan", "Jin Taizong", "Wanyan Sheng", "Wuqimai"],
    desc: "emperor of the Jin Dynasty (1075–1135) (r. 1123-1135)",
    born: 1075,
    died: 1135,
    offices: [
      { office: "Emperor", state: null, from: 1123, to: 1135 }
    ]
  },
  {
    uid: "Q7489",
    name: "Emperor Gaozong of Song",
    cjkName: null,
    cjkNames: [],
    aliases: ["Deji", "Emperor of China Song Gaozong", "Emperor of the Song dynasty Ga0zong", "Emperor of the Song dynasty Gaozong", "Emperor of the Song dynasty Kao-tsung", "Gao Zong", "Gaozong", "Gou Zhao", "Kao Tsung", "Kao-tsung", "Kou Chao", "Song Gaozong", "Song Kangwang", "Sung Kao-tsung", "Sung Kʻang-wang", "Sung K‘ang-wang", "Wanyan Gou", "Zhao Gou"],
    desc: "emperor of Song Dynasty China (1107–1187)",
    born: 1107,
    died: 1187,
    offices: [
      { office: "Emperor", state: null, from: 1127, to: 1129 },
      { office: "Emperor", state: null, from: 1129, to: 1162 }
    ]
  },
  {
    uid: "Q11636648",
    name: "Zhao Fu",
    cjkName: null,
    cjkNames: [],
    aliases: ["Yuanyi"],
    desc: "12th-century Chinese prince",
    born: 1127,
    died: 1129,
    offices: [
      { office: "Emperor", state: null, from: 1129, to: 1129 }
    ]
  },
  {
    uid: "Q5071",
    name: "Emperor Xizong of Jin",
    cjkName: null,
    cjkNames: [],
    aliases: ["Wanyan Dan"],
    desc: "emperor of the Jin Dynasty (1115–1234)",
    born: 1119,
    died: 1150,
    offices: [
      { office: "Emperor", state: null, from: 1135, to: 1150 }
    ]
  },
  {
    uid: "Q7453",
    name: "Emperor Renzong of Western Xia",
    cjkName: null,
    cjkNames: [],
    aliases: ["Emperor Renzong", "Li Renxiao"],
    desc: "emperor of the Western Xia Dynasty",
    born: 1124,
    died: 1193,
    offices: [
      { office: "Emperor", state: null, from: 1139, to: 1193 }
    ]
  },
  {
    uid: "Q5072",
    name: "Emperor Hailingwang of Jin",
    cjkName: null,
    cjkNames: [],
    aliases: ["Wanyan Liang"],
    desc: "emperor of the Jin Dynasty (1115–1234)",
    born: 1122,
    died: 1161,
    offices: [
      { office: "Emperor", state: null, from: 1150, to: 1161 }
    ]
  },
  {
    uid: "Q5073",
    name: "Emperor Shizong of Jin",
    cjkName: null,
    cjkNames: [],
    aliases: ["Wanyan Yong"],
    desc: "emperor of the Jin Dynasty (1123–1189)",
    born: 1123,
    died: 1189,
    offices: [
      { office: "Emperor", state: null, from: 1161, to: 1189 }
    ]
  },
  {
    uid: "Q7492",
    name: "Emperor Xiaozong of Song",
    cjkName: null,
    cjkNames: [],
    aliases: ["Ai", "Bo Cong", "Shao Tong Tong Dao Guan De Zhao Gong Zhe Wen Shen Wu Ming Sheng Cheng Xiao Huang Di", "Wei", "Xiao Zong", "Xiaozong Of Song", "Yuangui", "Yuanyong", "Zhao Ai", "Zhao Bocong", "Zhao Shen", "Zhao Wei"],
    desc: "Chinese Song dynasty emperor from 1162 to 1189",
    born: 1127,
    died: 1194,
    offices: [
      { office: "Emperor", state: null, from: 1162, to: 1189 },
      { office: "Taishang Huang", state: null, from: 1189, to: 1194 }
    ]
  },
  {
    uid: "Q7494",
    name: "Emperor Guangzong of Song",
    cjkName: null,
    cjkNames: [],
    aliases: ["Emperor Guangzong", "Guang Zong", "Zhao Dun"],
    desc: "emperor of the Song Dynasty",
    born: 1147,
    died: 1200,
    offices: [
      { office: "Emperor", state: null, from: 1189, to: 1194 },
      { office: "Taishang Huang", state: null, from: 1194, to: 1200 }
    ]
  },
  {
    uid: "Q5074",
    name: "Emperor Zhangzong of Jin",
    cjkName: null,
    cjkNames: [],
    aliases: ["Wanyan Jing", "Zhangzong"],
    desc: "Emperor of the Jin Dynasty (1168–1208)",
    born: 1168,
    died: 1208,
    offices: [
      { office: "Emperor", state: null, from: 1189, to: 1208 }
    ]
  },
  {
    uid: "Q7496",
    name: "Emperor Ningzong of Song",
    cjkName: null,
    cjkNames: [],
    aliases: ["Emperor Ning-tsung", "Ning Zong", "Zhao Kuo"],
    desc: "emperor of the Song Dynasty",
    born: 1168,
    died: 1224,
    offices: [
      { office: "Emperor", state: null, from: 1194, to: 1224 },
      { office: "Crown Prince", state: null, from: 1194, to: 1194 }
    ]
  },
  {
    uid: "Q720",
    name: "Genghis Khan",
    cjkName: null,
    cjkNames: [],
    aliases: ["Borjigin Temüjin", "Chengiz Khan", "Chengjisihan", "Chinggis Khan", "Chingiz", "Chingiz Khaan", "Chingiz Khan", "Emperor Taizu", "Genghis", "Jenghis", "Jenghis Khan", "Jenghiz", "Jenghiz Khan", "Tai Zu", "Temuchin", "Temujin", "Tiemuzhen", "Yuan Taizu"],
    desc: "founder and first khan of the Mongol Empire (1162–1227)",
    born: 1162,
    died: 1227,
    offices: [
      { office: "Khagan of the Mongol Empire", state: null, from: 1206, to: 1227 }
    ]
  },
  {
    uid: "Q5076",
    name: "Wanyan Yongji",
    cjkName: null,
    cjkNames: [],
    aliases: ["Prince Shao of Wei"],
    desc: "Jin dynasty emperor",
    born: 1168,
    died: 1213,
    offices: [
      { office: "Emperor", state: null, from: 1208, to: 1213 }
    ]
  },
  {
    uid: "Q5080",
    name: "Emperor Xuanzong of Jin",
    cjkName: null,
    cjkNames: [],
    aliases: ["Ai Zong", "Wanyan Xun"],
    desc: "emperor of the Jin Dynasty (1115–1234)",
    born: 1163,
    died: 1224,
    offices: [
      { office: "Emperor", state: null, from: 1213, to: 1224 }
    ]
  },
  {
    uid: "Q5081",
    name: "Emperor Aizong of Jin",
    cjkName: null,
    cjkNames: [],
    aliases: ["Aizong", "Wanyan Shouli", "Wanyan Shouxu"],
    desc: "emperor of the Jin Dynasty (1115–1234)",
    born: 1198,
    died: 1234,
    offices: [
      { office: "Emperor", state: null, from: 1224, to: 1234 }
    ]
  },
  {
    uid: "Q7497",
    name: "Emperor Lizong of Song",
    cjkName: null,
    cjkNames: [],
    aliases: ["Guicheng", "Li Zong", "Song Guicheng", "Zhao Qilao", "Zhao Yun"],
    desc: "Chinese emperor from 1224 to 1264 (1205–1264)",
    born: 1205,
    died: 1264,
    offices: [
      { office: "Emperor", state: null, from: 1224, to: 1264 }
    ]
  },
  {
    uid: "Q5069",
    name: "Emperor Modi of Jin",
    cjkName: null,
    cjkNames: [],
    aliases: ["Wanyan Chenglin"],
    desc: "emperor of the Jin Dynasty (1115–1234)",
    born: 1201,
    died: 1234,
    offices: [
      { office: "Emperor", state: null, from: 1234, to: 1234 }
    ]
  },
  {
    uid: "Q7498",
    name: "Emperor Duzong of Song",
    cjkName: null,
    cjkNames: [],
    aliases: ["Du Zong", "Zhao Mengqi", "Zhao Qi"],
    desc: "emperor of the Song Dynasty",
    born: 1240,
    died: 1274,
    offices: [
      { office: "Emperor", state: null, from: 1264, to: 1274 },
      { office: "Crown Prince", state: null, from: 1260, to: 1264 }
    ]
  },
  {
    uid: "Q7523",
    name: "Kublai Khan",
    cjkName: null,
    cjkNames: [],
    aliases: ["Hubilie", "Khubilai", "Khubilai Khan", "Kubla Khan", "Kublai", "Kublai khan", "Pouyuandaizhudi", "Qubilai", "Shi Zu", "Sé Chen Gyalpo", "Yuán Shìzǔ"],
    desc: "founding emperor of the Yuan dynasty, grandson of Genghis Khan (1215–1294)",
    born: 1215,
    died: 1294,
    offices: [
      { office: "Khagan", state: null, from: 1260, to: 1294 },
      { office: "Emperor", state: null, from: 1271, to: 1294 },
      { office: "Emperor", state: null, from: 1260, to: 1294 }
    ]
  },
  {
    uid: "Q7500",
    name: "Emperor Gong of Song",
    cjkName: null,
    cjkNames: [],
    aliases: ["Gong Huangdi", "Gong Zong", "Xiàogōng Yìshèng Huángdì", "Zhao Xian", "Zhào Xiǎn"],
    desc: "Emperor of the Song Dynasty",
    born: 1271,
    died: 1323,
    offices: [
      { office: "Emperor", state: null, from: 1274, to: 1276 }
    ]
  },
  {
    uid: "Q7501",
    name: "Emperor Duanzong of Song",
    cjkName: null,
    cjkNames: [],
    aliases: ["Duanzong", "Zhao Shi"],
    desc: "emperor of the Song Dynasty",
    born: 1268,
    died: 1278,
    offices: [
      { office: "Emperor", state: null, from: 1276, to: 1278 }
    ]
  },
  {
    uid: "Q7503",
    name: "Emperor Bing of Song",
    cjkName: null,
    cjkNames: [],
    aliases: ["Zhao Bing", "Zhào Bǐng"],
    desc: "emperor of the Song Dynasty",
    born: 1272,
    died: 1279,
    offices: [
      { office: "Emperor", state: null, from: 1278, to: 1279 }
    ]
  },
  {
    uid: "Q8468",
    name: "Temür Khan",
    cjkName: null,
    cjkNames: [],
    aliases: ["Beierzhijin Tiemuer", "Boerzhijin Tiemuer", "Emperor Chengzong of Yuan", "Pouyuandaizhudi", "Temür Öljeytü Khan", "Timur"],
    desc: "2nd emperor of the Yuan Dynasty",
    born: 1265,
    died: 1307,
    offices: [
      { office: "Khagan", state: null, from: 1294, to: 1307 },
      { office: "Emperor", state: null, from: 1294, to: 1307 }
    ]
  },
  {
    uid: "Q8532",
    name: "Külüg Khan",
    cjkName: null,
    cjkNames: [],
    aliases: ["Beierzhijin Haishan", "Emperor Wuzong of Yuan", "Khayishan", "Pouyuandaizhudi", "Yuán Wǔzōng"],
    desc: "emperor of the Yuan Dynasty",
    born: 1281,
    died: 1311,
    offices: [
      { office: "Khagan", state: null, from: 1307, to: 1311 },
      { office: "Emperor", state: null, from: 1307, to: 1311 }
    ]
  },
  {
    uid: "Q8540",
    name: "Ayurbarwada Buyantu Khan",
    cjkName: null,
    cjkNames: [],
    aliases: ["Ayurbarwada", "Beierzhijin Aiyulibalibada", "Buyantu Khan", "Emperor Renzong of Yuan", "Pouyuandaizhudi"],
    desc: "emperor of the Yuan Dynasty (1285-1320)",
    born: 1285,
    died: 1320,
    offices: [
      { office: "Khagan", state: null, from: 1311, to: 1320 },
      { office: "Emperor", state: null, from: 1311, to: 1320 }
    ]
  },
  {
    uid: "Q8549",
    name: "Gegeen Khan",
    cjkName: null,
    cjkNames: [],
    aliases: ["Beierzhijin Shuodebala", "Emperor Yingzong of Yuan", "Pouyuandaizhudi", "Shidibala"],
    desc: "emperor of the Yuan Dynasty",
    born: 1302,
    died: 1323,
    offices: [
      { office: "Khagan", state: null, from: 1320, to: 1323 },
      { office: "Emperor", state: null, from: 1320, to: 1323 }
    ]
  },
  {
    uid: "Q8560",
    name: "Yesün Temür Khan",
    cjkName: null,
    cjkNames: [],
    aliases: ["Emperor Taiding of Yuan", "Jinzong", "Pouyuandaizhudi", "Taiding Di"],
    desc: "emperor of the Yuan Dynasty",
    born: 1293,
    died: 1328,
    offices: [
      { office: "Khagan", state: null, from: 1323, to: 1328 },
      { office: "Emperor", state: null, from: 1323, to: 1328 }
    ]
  },
  {
    uid: "Q8655",
    name: "Jayaatu Khan",
    cjkName: null,
    cjkNames: [],
    aliases: ["Beierzhijin Tutiemuer", "Emperor Wenzong of Yuan", "Pouyuandaizhudi", "Tugh Temür"],
    desc: "Yuan dynasty emperor from 1328 to 1332",
    born: 1304,
    died: 1332,
    offices: [
      { office: "Khagan", state: null, from: 1328, to: 1329 },
      { office: "Emperor", state: null, from: 1328, to: 1329 },
      { office: "Emperor", state: null, from: 1329, to: 1332 },
      { office: "Khagan", state: null, from: 1329, to: 1332 }
    ]
  },
  {
    uid: "Q8653",
    name: "Ragibagh Khan",
    cjkName: null,
    cjkNames: [],
    aliases: ["Arigabag", "Asugiba", "Asujiba", "Beierzhijin Asujiba", "Emperor Tianshun of Yuan"],
    desc: "emperor of the Yuan Dynasty",
    born: 1320,
    died: 1328,
    offices: [
      { office: "Khagan", state: null, from: 1328, to: 1328 },
      { office: "Emperor", state: null, from: 1328, to: 1328 }
    ]
  },
  {
    uid: "Q8659",
    name: "Khutughtu Khan",
    cjkName: null,
    cjkNames: [],
    aliases: ["Beierzhijin Heshila", "Emperor Mingzong of Yuan", "Khutughtu Khan, Emperor Mingzong of Yuan", "Kuśala", "Pouyuandaizhudi"],
    desc: "emperor of the Yuan Dynasty",
    born: 1300,
    died: 1329,
    offices: [
      { office: "Emperor", state: null, from: 1329, to: 1329 }
    ]
  },
  {
    uid: "Q8664",
    name: "Rinchinbal Khan",
    cjkName: null,
    cjkNames: [],
    aliases: ["Beierzhijin Yilinzhiban", "Emperor Chongsheng Si Xiao", "Emperor Ningzong of Yuan", "Ningzong"],
    desc: "emperor of the Yuan Dynasty (1326-1332)",
    born: 1326,
    died: 1332,
    offices: [
      { office: "Khagan", state: null, from: 1332, to: 1332 },
      { office: "Emperor", state: null, from: 1332, to: 1332 }
    ]
  },
  {
    uid: "Q8666",
    name: "Toghon Temür",
    cjkName: null,
    cjkNames: [],
    aliases: ["Beierzhijin Tuohuantiemuer", "Huizong", "Kaisar Huizong", "Pouyuandaizhudi", "Shundi"],
    desc: "Yuan and Northern Yuan emperor from 1333 to 1370",
    born: 1320,
    died: 1370,
    offices: [
      { office: "Khagan", state: null, from: 1333, to: 1368 },
      { office: "Khagan", state: null, from: 1368, to: 1370 },
      { office: "Emperor", state: null, from: 1333, to: 1368 }
    ]
  },
  {
    uid: "Q9957",
    name: "Hongwu Emperor",
    cjkName: null,
    cjkNames: [],
    aliases: ["Emperor Taizu of Ming", "Gaohuangdi", "Guorui", "Hongwu", "Kaitianxingdaozhaojilijidashengzhishenrenwenyiwujundechenggonggaohuangdi", "Kang Di", "Ming Taizu", "Shengshenwenwuqinmingqiyunjundechenggongtongtiandaxiaogaohuangdi", "Tai Zu", "Wu", "Zhu Yuanzhang"],
    desc: "founding emperor of China's Ming dynasty; ruled 1368–1398",
    born: 1328,
    died: 1398,
    offices: [
      { office: "Emperor", state: null, from: 1368, to: 1398 }
    ]
  },
  {
    uid: "Q9965",
    name: "Yongle Emperor",
    cjkName: null,
    cjkNames: [],
    aliases: ["Cheng Zu", "Chengzu", "Di Zhu", "Emperor Chengzu of Ming", "Emperor of China Ming Chengzu", "Emperor of China Yongli", "Emperor of China Yung-le", "Prince Yan", "Qitian Hongdao Gaoming Zhaoyun Shengwu Shengong Chunren Zhixiao Wen", "Qitianhongdaogaomingzhaoyunshengwushengongchunrenzhixiaowenhuangdi", "Taizong", "Ti Chu", "Titianhongdaogaomingguangyunshengwushengongchunrenzhixiaowenhuangdi", "Wen Di", "Wendi", "Wenhuangdi", "Yancheng", "Yongle", "Yonglo Emperor", "Yung-lo"],
    desc: "emperor of Ming dynasty China from 1402 to 1424",
    born: 1360,
    died: 1424,
    offices: [
      { office: "Emperor", state: null, from: 1402, to: 1424 },
      { office: "Prince", state: null, from: 1370, to: 1402 }
    ]
  },
  {
    uid: "Q9961",
    name: "Jianwen Emperor",
    cjkName: null,
    cjkNames: [],
    aliases: ["Emperor Hui", "Emperor Rang", "Gongminhuihuangdi", "Hui Di", "Huizong", "Jianwen Di", "Zhu Yunwen"],
    desc: "emperor of China from 1398 to 1402",
    born: 1377,
    died: 1402,
    offices: [
      { office: "Emperor", state: null, from: 1398, to: 1402 },
      { office: "Q7217722", state: null, from: 1392, to: 1398 }
    ]
  },
  {
    uid: "Q9972",
    name: "Hongxi Emperor",
    cjkName: null,
    cjkNames: [],
    aliases: ["Emperor Jingtian Tidao Chuncheng Zhide Hongwen Qinwu Zhangsheng Daxiao Zhao", "Hongxi", "Jingtian tidao chuncheng zhide hongwen qinwu zhangsheng daxiaozhao huangdi", "Ren Zong", "Renzong", "Zhao Di", "Zhu Gaochi", "Zhu Gaozhi"],
    desc: "emperor of the Ming Dynasty from 1424 to 1425",
    born: 1378,
    died: 1425,
    offices: [
      { office: "Emperor", state: null, from: 1424, to: 1425 },
      { office: "Crown Prince", state: null, from: 1404, to: 1424 }
    ]
  },
  {
    uid: "Q9977",
    name: "Xuande Emperor",
    cjkName: null,
    cjkNames: [],
    aliases: ["Emperor Xuande of Ming", "Emperor Xuanzong of Ming", "Hsüan-te, Emperor of China", "Muweituqi", "Xiantianchongdaoyingmingshenshengqinwenzhaowukuanrenchunxiaozhanghuangdi", "Xuan Zong", "Xuande", "Xuanzong", "Zhang Di", "Zhangdi", "Zhu Zhanji"],
    desc: "emperor of the Ming Dynasty (1399-1435)",
    born: 1399,
    died: 1435,
    offices: [
      { office: "Emperor", state: null, from: 1425, to: 1435 },
      { office: "Q7217722", state: null, from: 1411, to: 1424 }
    ]
  },
  {
    uid: "Q9983",
    name: "Zhengtong Emperor",
    cjkName: null,
    cjkNames: [],
    aliases: ["Emperor Fatian Lidao Renming Chengjing Zhaowen Xianwu Zhide Guangxiao Rui", "Emperor Yingzong of Ming", "Fatianlidaorenmingchengjingzhaowenxianwuzhideguangxiaoruihuangdi", "Rui Di", "Tianshun", "Tianshun Emperor", "Ying Zong", "Zhengtong", "Zhu Qizhen"],
    desc: "emperor of the Ming Dynasty",
    born: 1427,
    died: 1464,
    offices: [
      { office: "Emperor", state: null, from: 1435, to: 1449 },
      { office: "Emperor", state: null, from: 1457, to: 1464 }
    ]
  },
  {
    uid: "Q9991",
    name: "Chenghua Emperor",
    cjkName: null,
    cjkNames: [],
    aliases: ["Chenghua", "Chun Di", "Jitianningdaochengmingrenjingchongwensuwuhongdeshengxiaochunhuangdi", "Xian Zong", "Zhu Jianjun", "Zhu Jianshen", "Zhū Jiànshēn"],
    desc: "9th Emperor of the Ming dynasty (1447-1487)",
    born: 1447,
    died: 1487,
    offices: [
      { office: "Emperor", state: null, from: 1464, to: 1487 },
      { office: "Crown Prince", state: null, from: 1449, to: 1452 }
    ]
  },
  {
    uid: "Q9988",
    name: "Jingtai Emperor",
    cjkName: null,
    cjkNames: [],
    aliases: ["Dai Zong", "Emperor Gongren Kangding Jing", "Gongrenkangdingjinghuangdi", "Jing Di", "Jingtai", "Lihui", "Ming Daizong", "Zhu Qiyu"],
    desc: "emperor of the Ming Dynasty",
    born: 1428,
    died: 1457,
    offices: [
      { office: "Emperor", state: null, from: 1449, to: 1457 }
    ]
  },
  {
    uid: "Q9994",
    name: "Hongzhi Emperor",
    cjkName: null,
    cjkNames: [],
    aliases: ["Datianmingdaochunchengzhongzhengshengwenshenwuzhirendadejinghuangdi", "Hongzhi", "Jing Di", "Xiao Zong", "Zhu Youcheng", "Zhu Youtang"],
    desc: "10th emperor of the Ming Dynasty (1470–1505)",
    born: 1470,
    died: 1505,
    offices: [
      { office: "Emperor", state: null, from: 1487, to: 1505 },
      { office: "Crown Prince", state: null, from: 1475, to: 1487 }
    ]
  },
  {
    uid: "Q10007",
    name: "Zhengde Emperor",
    cjkName: null,
    cjkNames: [],
    aliases: ["Chengtiandadaoyingsuruizhezhaodexiangonghongwensixiaoyihuangdi", "Daqingfawang", "Shou", "Wu Zong", "Yi Di", "Zhengde", "Zhu Houzhao"],
    desc: "emperor of the Ming Dynasty",
    born: 1491,
    died: 1521,
    offices: [
      { office: "Emperor", state: null, from: 1505, to: 1521 },
      { office: "Crown Prince", state: null, from: 1493, to: 1505 }
    ]
  },
  {
    uid: "Q10011",
    name: "Jiajing Emperor of Ming",
    cjkName: null,
    cjkNames: [],
    aliases: ["Emperor Shizong of Ming", "Jiajing", "Ming Shizong", "Qintianlüdaoyingyishengshenxuanwenguangwuhongrendaxiaosuhuangdi", "Shi Zong", "Su Di", "Zhu Houcong"],
    desc: "Emperor of the Ming dynasty from 1521 to 1567",
    born: 1507,
    died: 1567,
    offices: [
      { office: "Emperor", state: null, from: 1521, to: 1567 }
    ]
  },
  {
    uid: "Q10059",
    name: "Longqing Emperor",
    cjkName: null,
    cjkNames: [],
    aliases: ["Longqing", "Mu Zong", "Qitianlongdaoyuanyikuanrenxianwenguangwuchundehongxiaozhuanghuangdi", "Zhu Zaihou", "Zhuang Di"],
    desc: "13th Emperor of the Ming dynasty",
    born: 1537,
    died: 1572,
    offices: [
      { office: "Emperor", state: null, from: 1567, to: 1572 }
    ]
  },
  {
    uid: "Q10061",
    name: "Wanli Emperor",
    cjkName: null,
    cjkNames: [],
    aliases: ["Dingling", "Emperor Shenzong of Ming", "Fantianhedaozhesudunjianguangwenzhangwuanrenzhixiaoxianhuangdi", "Shen Zong", "Wan Li Di", "Xian Di", "Zhu Yijun"],
    desc: "emperor of the Ming Dynasty (1563-1620)",
    born: 1563,
    died: 1620,
    offices: [
      { office: "Emperor", state: null, from: 1572, to: 1620 }
    ]
  },
  {
    uid: "Q10065",
    name: "Taichang Emperor",
    cjkName: null,
    cjkNames: [],
    aliases: ["Chongtianqidaoyingruigongchunxianwenjingwuyuanrenyixiaozhenhuangdi", "Guang Zong", "Taichang", "The Taichang Emperor", "Zhen Di", "Zhu Changluo"],
    desc: "15th Emperor of the Ming dynasty",
    born: 1582,
    died: 1620,
    offices: [
      { office: "Emperor", state: null, from: 1620, to: 1620 },
      { office: "Crown Prince", state: null, from: 1601, to: 1620 }
    ]
  },
  {
    uid: "Q10066",
    name: "Tianqi Emperor",
    cjkName: null,
    cjkNames: [],
    aliases: ["Tianqi", "Zhe Di", "Zhu Youxiao"],
    desc: "emperor of the Ming Dynasty",
    born: 1605,
    died: 1627,
    offices: [
      { office: "Emperor", state: null, from: 1620, to: 1627 }
    ]
  },
  {
    uid: "Q10069",
    name: "Chongzhen Emperor",
    cjkName: null,
    cjkNames: [],
    aliases: ["Chongzhen", "Huai Zong", "Min Di", "Qintianshoudaominyigangmingdunjiankejianhongwenxiangwutirenzhixiaoduanhuangdi", "Shaotianyidaogangmingkejiankuiwenfenwudunrenmaoxiaoliehuangdi", "Siling", "Sizong", "Weizong", "Yizong", "Zhu Youjian", "Zhuanglie Di", "Zhuanglieminhuangdi"],
    desc: "emperor of the Ming Dynasty",
    born: 1611,
    died: 1644,
    offices: [
      { office: "Emperor", state: null, from: 1627, to: 1644 },
      { office: "Imperial Prince", state: null, from: 1622, to: 1627 }
    ]
  },
  {
    uid: "Q296367",
    name: "Hong Taiji",
    cjkName: null,
    cjkNames: [],
    aliases: ["2nd Khan of Later Jin", "Abahai", "Chongde", "Huang Taiji", "Kuanwenrenshenghuangdi", "Taizong", "Tiancong", "Wenhuangdi", "Yingtianxingguohongdezhangwukuanwenrenshengruixiaojingminzhaodinglongdaoxiangongwenhuangdi", "Yingtianxingguohongdezhangwukuanwenrenshengruixiaowenhuangdi"],
    desc: "1st emperor of the Qing Dynasty (1592-1643)",
    born: 1592,
    died: 1643,
    offices: [
      { office: "Emperor", state: null, from: 1636, to: 1643 },
      { office: "Khan", state: null, from: 1626, to: 1636 }
    ]
  },
  {
    uid: "Q310453",
    name: "Shunzhi Emperor",
    cjkName: null,
    cjkNames: [],
    aliases: ["Chidaoren", "Fu-lin", "Fulin", "Shizu", "Shun-chih Emperor", "Shunzhi", "Taihe Zhuren", "Titian Longyun Dingtong Jianji Yingrui Qinwen Xianwu Dade Honggong Zhiren Chunxiao Zhang Huangdi", "Tiyuanzhai Zhuren", "Xingchi", "Yiandaoren"],
    desc: "Qing Dynasty emperor of China (1638–1661)",
    born: 1638,
    died: 1661,
    offices: [
      { office: "Emperor", state: null, from: 1644, to: 1661 },
      { office: "Emperor", state: null, from: 1643, to: 1661 }
    ]
  },
  {
    uid: "Q1352743",
    name: "Zhu Yousong, Prince of Fu",
    cjkName: null,
    cjkNames: [],
    aliases: ["Anzong", "Fuwang", "Hongguang", "Jianhuangdi", "Nanhuangdi", "Shenganhuangdi", "Zhu Yousong"],
    desc: "Southern Ming Emperor from 1644 to 1645",
    born: 1607,
    died: 1646,
    offices: [
      { office: "Emperor", state: null, from: 1644, to: 1645 }
    ]
  },
  {
    uid: "Q17790",
    name: "Kangxi Emperor",
    cjkName: null,
    cjkNames: [],
    aliases: ["Amulon Bogdo-Cham", "Amulon-Bogdo-Cham", "Amuγulang Bogda Qaγan", "Amuγulang Qaγan", "Camhi", "Cang-hi", "Emperor Kangxi", "Emperor Shengzu of Qing", "Engke Amuyulang", "Engke Amuγulang", "Engke-Amuulang", "Enh-Amgalan", "Hetianhongyunwenwuruizhegongjiankuanyuxiaojingchengxingongdedachengrenhuangdi", "Hsüan-ye", "K'ang Hsi", "K'ang-hsi", "Kang Hsi", "Kang-hsi", "Kanghsi", "Kangxi"],
    desc: "3rd Emperor of the Qing dynasty (r. 1661–1722)",
    born: 1654,
    died: 1722,
    offices: [
      { office: "Emperor", state: null, from: 1661, to: 1722 }
    ]
  },
  {
    uid: "Q317839",
    name: "Yongzheng Emperor",
    cjkName: null,
    cjkNames: [],
    aliases: ["Jingtianchangyunjianzhongbiaozhengwenwuyingmingkuanrenxinyiruishengdaxiaozhichengxianhuangdi", "Langkoujinge", "Pochenjushi", "Pochenyanshi", "Shizong", "Siyitang", "Yongzheng", "Yongzheng o Yinchen"],
    desc: "emperor of Qing-dynasty China from 1722 to 1735 (1678–1735)",
    born: 1678,
    died: 1735,
    offices: [
      { office: "Emperor", state: null, from: 1722, to: 1735 }
    ]
  },
  {
    uid: "Q19133",
    name: "Qianlong Emperor",
    cjkName: null,
    cjkNames: [],
    aliases: ["Changchunjushi", "Chien-lung Emperor", "Emperor Gaozong of Qing", "Emperor Khien-long", "Emperor Kien-long", "Emperor Kienlung", "Fatianlongyunzhichengxianjiaotiyuanlijifuwenfenwuqinmingxiaocishenshengchunhuangdi", "Gaozong", "Guxitianzi", "Hong Li", "Hongli", "Hung-li", "Khien-long", "Khien-long Emperor", "Kien-long", "Kien-long Emperor", "Kienlung", "Kienlung Emperor", "Perfect Old Sage", "Qianlong"],
    desc: "emperor of the Qing Dynasty (1711–1799)",
    born: 1711,
    died: 1799,
    offices: [
      { office: "Emperor", state: null, from: 1735, to: 1796 },
      { office: "Taishang Huang", state: null, from: 1796, to: 1799 },
      { office: "Heshuo Qinwang", state: null, from: 1733, to: 1743 }
    ]
  },
  {
    uid: "Q333178",
    name: "Jiaqing Emperor",
    cjkName: null,
    cjkNames: [],
    aliases: ["Chia-ch'ing Emperor", "Emperor Jiaqing", "Jiaqing", "Jiaqing Emperor of Qing", "Renzong", "Shoutianxingfuhuasuiyouchongwenjingwuxiaogongqinjianduanminyingzheruihuangdi"],
    desc: "Chinese emperor (1760-1820) of the Qing dynasty",
    born: 1760,
    died: 1820,
    offices: [
      { office: "Emperor", state: null, from: 1796, to: 1820 }
    ]
  },
  {
    uid: "Q334351",
    name: "Daoguang Emperor",
    cjkName: null,
    cjkNames: [],
    aliases: ["Emperor Tao-kuang", "Emperor Taokuang", "Mian-ming", "Tao-kuang", "Tao-kuang Emperor", "Taokuang", "Taokuang Emperor", "Xiaotianfuyunlizhongtizhengzhiwenshengwuzhiyongrencijianqinxiaominchenghuangdi", "Xuanzong"],
    desc: "Qing-dynasty Chinese emperor (1782–1850)",
    born: 1782,
    died: 1850,
    offices: [
      { office: "Emperor", state: null, from: 1820, to: 1850 },
      { office: "Imperial Prince", state: null, from: 1813, to: 1820 }
    ]
  },
  {
    uid: "Q334452",
    name: "Xianfeng Emperor",
    cjkName: null,
    cjkNames: [],
    aliases: ["Emperor Hsien-feng", "Emperor Wenzong of Qing", "Emperor Xianfeng", "Hsien-feng Emperor", "Lüxinshuwu", "Qieledaoren", "Qingwenzong", "Tongletang", "Xietianyiyunzhizhongchuimomaodezhenwushengxiaoyuangongduanrenkuanminxianhuangdi"],
    desc: "The ninth emperor (and the seventh after defeating Ming) of the Qing Dynasty (1831-1861)",
    born: 1831,
    died: 1861,
    offices: [
      { office: "Emperor", state: null, from: 1850, to: 1861 },
      { office: "Crown Prince", state: null, from: 1850, to: 1850 }
    ]
  },
  {
    uid: "Q699600",
    name: "Zhang Xun",
    cjkName: null,
    cjkNames: [],
    aliases: ["Shaoxuan", "shao xuan", "sheng sheng", "shun sheng zhe", "song shou lao ren", "yu zhi", "zhang xi zan", "zhang xun", "zhong wu"],
    desc: "Chinese general (1854-1923)",
    born: 1854,
    died: 1923,
    offices: [
    ]
  },
  {
    uid: "Q47842",
    name: "Empress Dowager Cixi",
    cjkName: null,
    cjkNames: [],
    aliases: ["Cixi", "Cixi Taihou", "Dowager Empress Tzu-hsi", "Empress Cixi", "Empress Tzu-hsi", "Tzu Hsi", "Tzu-hsi"],
    desc: "Chinese empress (1835–1908)",
    born: 1835,
    died: 1908,
    offices: [
      { office: "List of Consorts of Rulers of China", state: null, from: 1861, to: 1908 }
    ]
  },
  {
    uid: "Q318811",
    name: "Tongzhi Emperor",
    cjkName: null,
    cjkNames: [],
    aliases: ["Jitiankaiyunshouzhongjuzhengbaodadinggongshengzhichengxiaoxinmingongkuanyihuangdi", "Muzong", "Tsai-chun", "Zaichun"],
    desc: "emperor of the Qing Dynasty (1856-1875)",
    born: 1856,
    died: 1875,
    offices: [
      { office: "Emperor", state: null, from: 1861, to: 1875 }
    ]
  },
  {
    uid: "Q299710",
    name: "Guangxu Emperor",
    cjkName: null,
    cjkNames: [],
    aliases: ["Aixinjueluo Zaitian", "Dezong", "Emperor Guangxu", "Emperor Kuang-hsü", "Kuang-hsü Emperor"],
    desc: "Chinese emperor (1871-1908)",
    born: 1871,
    died: 1908,
    offices: [
      { office: "Emperor", state: null, from: 1875, to: 1908 }
    ]
  },
  {
    uid: "Q210329",
    name: "Yuan Shikai",
    cjkName: null,
    cjkNames: [],
    aliases: ["Chunyizhai", "Huanshangdiaotu", "Huanshangyuren", "Muyexinnong", "Rongan", "Songyun", "Weiting", "Xiazhulou", "Yangshoutang", "Yangshouyuan"],
    desc: "Chinese military and government official (1859–1916)",
    born: 1859,
    died: 1916,
    offices: [
      { office: "Prime Minister of the Imperial Cabinet", state: null, from: 1911, to: 1912 },
      { office: "Great President of the Republic of China", state: null, from: 1912, to: 1915 },
      { office: "Great President of the Republic of China", state: null, from: 1916, to: 1916 },
      { office: "Viceroy of Zhili", state: null, from: 1901, to: 1908 },
      { office: "Emperor", state: null, from: 1915, to: 1916 },
      { office: "Emperor", state: null, from: 1915, to: 1916 }
    ]
  },
  {
    uid: "Q1530440",
    name: "K. C. Wu",
    cjkName: null,
    cjkNames: [],
    aliases: ["Kuo-Chen Wu", "Wu Kuo-Chen", "Wu Kuo-Cheng"],
    desc: "Chinese politician and historian (1903-1984)",
    born: 1903,
    died: 1984,
    offices: [
    ]
  },
  {
    uid: "Q185152",
    name: "Puyi",
    cjkName: null,
    cjkNames: [],
    aliases: ["Haoran", "Henry Pu-yi", "Henry Puyi", "Kang-te Emperor", "Kangde", "Xuantong", "Yaozhi"],
    desc: "Last Emperor of Qing dynasty and Manchukuo (1906–1967)",
    born: 1906,
    died: 1967,
    offices: [
      { office: "Emperor", state: null, from: 1917, to: 1917 },
      { office: "Emperor", state: null, from: 1908, to: 1912 },
      { office: "Emperor", state: null, from: 1934, to: 1945 },
      { office: "Emperor", state: null, from: 1908, to: 1912 },
      { office: "Emperor", state: null, from: 1934, to: 1945 }
    ]
  },
  {
    uid: "Q17402765",
    name: "Endymion Porter Wilkinson",
    cjkName: null,
    cjkNames: [],
    aliases: [],
    desc: "Diplomat, Sinologist",
    born: 1941,
    died: null,
    offices: [
    ]
  },
  {
    uid: "Q851900",
    name: "Baili Xi",
    cjkName: "百里奚",
    cjkNames: ["百里奚", "五羖大夫", "井伯", "百里傒", "百里子"],
    aliases: ["Baili Zi", "Wu gu da fu", "jin bo", "五羖大夫", "井伯", "百里傒", "百里子"],
    desc: "Qin politician",
    born: null,
    died: null,
    offices: [
    ]
  },
  {
    uid: "Q709477",
    name: "Duke Ai of Qi",
    cjkName: "齊哀公",
    cjkNames: ["齊哀公", "齐哀公", "吕不辰", "姜不辰"],
    aliases: ["제애공", "Khương Bất Thần", "吕不辰", "姜不辰"],
    desc: "ruler of Qi",
    born: null,
    died: null,
    offices: [
    ]
  },
  {
    uid: "Q712380",
    name: "Duke Ding of Qi",
    cjkName: "齊丁公",
    cjkNames: ["齊丁公", "齐丁公", "呂伋", "姜伋"],
    aliases: ["Lü Ji", "제정공", "Khương Cấp", "Lã Cấp", "呂伋", "姜伋"],
    desc: "ruler of Qi",
    born: null,
    died: null,
    offices: [
    ]
  },
  {
    uid: "Q709700",
    name: "Duke Gui of Qi",
    cjkName: "齊癸公",
    cjkNames: ["齊癸公", "齐癸公", "吕慈母", "姜慈母"],
    aliases: ["Khương Từ Mâu", "吕慈母", "姜慈母"],
    desc: "ruler of Qi",
    born: null,
    died: null,
    offices: [
    ]
  },
  {
    uid: "Q709725",
    name: "Duke Hu of Qi",
    cjkName: "齊胡公",
    cjkNames: ["齊胡公", "齐胡公", "吕靜", "姜靜"],
    aliases: ["Khương Tịnh Thị", "吕靜", "姜靜"],
    desc: "ruler of Qi",
    born: null,
    died: null,
    offices: [
    ]
  },
  {
    uid: "Q709417",
    name: "Duke Yǐ of Qi",
    cjkName: "齊乙公",
    cjkNames: ["齊乙公", "齐乙公", "吕得", "姜得"],
    aliases: ["제을공", "Khương Đắc", "吕得", "姜得"],
    desc: "ruler of Qi",
    born: null,
    died: null,
    offices: [
    ]
  },
  {
    uid: "Q845535",
    name: "Fan Ju",
    cjkName: "范雎",
    cjkNames: ["范雎", "应侯", "张禄", "范且", "范睢"],
    aliases: ["Fan Sui", "張禄", "범저", "범휴", "应侯", "张禄", "范且", "范睢"],
    desc: "Prime minister of the State of Qin.",
    born: null,
    died: null,
    offices: [
    ]
  },
  {
    uid: "Q5506864",
    name: "Fu Yue",
    cjkName: "傅說",
    cjkNames: ["傅說", "傅说", "傅説"],
    aliases: [],
    desc: "Chinese government official",
    born: null,
    died: null,
    offices: [
    ]
  },
  {
    uid: "Q236972",
    name: "Fuxi",
    cjkName: "伏羲",
    cjkNames: ["伏羲", "伏犧", "伏羲氏", "八卦祖師", "包犧", "太昊伏羲氏", "宓戏", "宓戏氏", "庖犧", "庖犧氏", "牺皇"],
    aliases: ["Fo-Hi", "Fou Hi", "Fou-hi", "Fou-hi-chi", "Fu Hsi", "Fu Xi", "Fu-hsi", "Fuh-He", "Pao Hsi", "Pao-Hsi", "Paoxi", "Poa-hi", "Poa-hi-chi", "Tay-hau Fo-hi", "Фуси", "Fuxi", "Himmelssouverän", "Pao Xi", "Tai Hao", "Fu Hi"],
    desc: "culture hero in Chinese legend and mythology, credited with creating humanity and the invention of hunting, fishing, cooking, animal husbandry, and Chinese characters",
    born: null,
    died: null,
    offices: [
    ]
  },
  {
    uid: "Q242756",
    name: "Gonggong",
    cjkName: "共工",
    cjkNames: ["共工", "共工氏", "帝宜", "帝直", "龔工"],
    aliases: ["Gong Gong", "Gong Gong Shi", "Gonggong Shi", "Great Kong", "Kanghui", "Kong Kong", "Kong-kong", "Koung Koung", "Koung-koung", "Kungkung", "Gonggong", "گونگ گونگ", "گونگ گونگ هیولا", "Kang Hui", "共工氏", "Gònggōng", "Cung Công", "Cộng Công thị", "Khang Hồi", "Đế Nghi"],
    desc: "Legendary figure of Chinese prehistory, variously described as an early leader, a rebel, and a water deity",
    born: null,
    died: null,
    offices: [
    ]
  },
  {
    uid: "Q1065105",
    name: "Hou Yi",
    cjkName: "后羿",
    cjkNames: ["后羿", "司羿", "夷羿", "有穷羿", "穷羿", "穹羿", "羿"],
    aliases: ["Yi", "یی کمانگیر", "Archer Yi", "Yi l'arciere", "后羿", "夷羿", "후예", "Hou Yi", "Yiyi", "И", "Охотник", "Стрелок И", "Хоу-и", "羿", "司羿", "有穷羿", "穷羿", "穹羿"],
    desc: "Chinese mythological archer",
    born: null,
    died: null,
    offices: [
    ]
  },
  {
    uid: "Q10122188",
    name: "Jilian",
    cjkName: "季连",
    cjkNames: ["季连", "季連"],
    aliases: ["Dục Hùng", "Huyệt Hùng", "Xuy Yếm"],
    desc: "founder of the House of Mi, first ruler of the state of Chu",
    born: null,
    died: null,
    offices: [
    ]
  },
  {
    uid: "Q3051517",
    name: "Lin Xiangru",
    cjkName: "藺相如",
    cjkNames: ["藺相如", "蔺相如"],
    aliases: ["蘭相如", "Lận Tương Như", "蔺相如"],
    desc: "Chinese chancellor",
    born: null,
    died: null,
    offices: [
    ]
  },
  {
    uid: "Q1052084",
    name: "Marquis Cheng of Jin",
    cjkName: "晉成侯",
    cjkNames: ["晉成侯", "晋成侯", "姬服人"],
    aliases: ["진성후", "Cơ Phục Nhân", "姬服人"],
    desc: "Ruler of the State of Jin",
    born: null,
    died: null,
    offices: [
    ]
  },
  {
    uid: "Q1051774",
    name: "Marquis Wu of Jin",
    cjkName: "晉武侯",
    cjkNames: ["晉武侯", "晋武侯", "姬寧族"],
    aliases: ["진무후", "Cơ Ninh Tộc", "姬寧族"],
    desc: "Ruler of the State of Jin",
    born: null,
    died: null,
    offices: [
    ]
  },
  {
    uid: "Q641632",
    name: "Nüwa",
    cjkName: "女媧",
    cjkNames: ["女媧", "女娲", "女希氏", "女娲娘娘", "女娲氏", "娲皇", "女媧娘娘", "女媧氏", "媧皇"],
    aliases: ["Nin-na", "Niu Koua", "Niu-oua", "Niu-ua", "Noe-hoa", "Nu Kua", "Nu-wa", "Nugua", "Nuwa", "Nvwa", "Nyuwa", "Nü-wa", "Nügua", "Nœ-hoa", "the Woman Kua", "Nu Wa", "Erdsouverän", "Nü Gua", "Nü Wa", "شهریار زمینی"],
    desc: "Legendary figure of Chinese prehistory, the sister and wife of Fuxi and variously described as a divine mother goddess, half-snake demigod, empress and inventor",
    born: null,
    died: null,
    offices: [
    ]
  },
  {
    uid: "Q245395",
    name: "Pangu",
    cjkName: "盘古",
    cjkNames: ["盘古", "盤古"],
    aliases: ["P'an-ku", "Pan Gu", "Pan Koo", "Pan Ku", "Pan-koo", "Pan-ku", "Pankoo", "Pouan-kou", "Pouane Cou", "Pouane-cou", "Puan-ku", "Puan-ku Shi", "خالق كل شيء", "Pangu", "Puon-çu", "Pán Gǔ", "Pángǔ", "盤古"],
    desc: "primordial giant of Chinese myth",
    born: null,
    died: null,
    offices: [
    ]
  },
  {
    uid: "Q1147250",
    name: "Shaohao",
    cjkName: "少昊",
    cjkNames: ["少昊", "少皞", "少昊氏", "少皓", "少皞氏", "玄嚣", "金天氏"],
    aliases: ["Chao Hao", "Chao-hao", "Chin-t'ien", "Chin-t'ien Shih", "Chin-t'ien-shih", "Chin-tien", "Chin-tien Shih", "Chin-tien-shih", "Jintian", "Jintian Shi", "Lesser Brightness", "Shao Hao", "Shao-hao", "Shau-hau", "Ta-ywen", "Ŝaŭhaŭ", "Chaoh-ao", "Jin Tian", "少皓", "少皞"],
    desc: "ancient Chinese leader and culture hero, supposedly a son of the Yellow Emperor",
    born: null,
    died: null,
    offices: [
    ]
  },
  {
    uid: "Q313336",
    name: "Shennong",
    cjkName: "神農氏",
    cjkNames: ["神農氏", "神农", "神農", "五榖先帝", "五穀先帝", "五穀王", "姜朱襄", "姜石年", "帝石年", "炎帝神農", "神农氏", "神農大帝", "炎帝", "炎帝神農氏"],
    aliases: ["Agriculture God", "Chen Noung", "Chen-noung", "Chin-nong", "Chin-noung", "Chini-nong", "Divine Farmer", "Divine Husbandman", "Divine Laborer", "Divine Labourer", "Divine Peasant", "God of the Five Grains", "Immortal Emperor of the Five Grains", "Shen Nong", "Shen-nong", "Shin-nong", "Shinnong", "Spirit of Husbandry", "Wugu Shen", "Wugu Xiandi"],
    desc: "legendary Chinese culture hero and god",
    born: null,
    died: null,
    offices: [
    ]
  },
  {
    uid: "Q3274709",
    name: "Tian Dan",
    cjkName: "田單",
    cjkNames: ["田單", "田单", "田單復國"],
    aliases: ["Dan Tian", "でん たん", "田單復國"],
    desc: "Military general",
    born: null,
    died: null,
    offices: [
    ]
  },
  {
    uid: "Q621376",
    name: "Xiong Kang",
    cjkName: "熊毋康",
    cjkNames: ["熊毋康", "熊康"],
    aliases: ["Hùng Khang"],
    desc: "monarch of the state of Chu",
    born: null,
    died: null,
    offices: [
    ]
  },
  {
    uid: "Q31464",
    name: "Xiong Qu",
    cjkName: "熊渠",
    cjkNames: ["熊渠", "楚熊渠"],
    aliases: ["熊渠", "楚熊渠"],
    desc: "Chinese monarch of Chu",
    born: null,
    died: null,
    offices: [
    ]
  },
  {
    uid: "Q31468",
    name: "Xiong Sheng",
    cjkName: "熊勝",
    cjkNames: ["熊勝", "楚熊勝"],
    aliases: ["楚熊勝"],
    desc: "fourth viscount of the state of Chu during the early Zhou Dynasty of ancient China",
    born: null,
    died: null,
    offices: [
    ]
  },
  {
    uid: "Q31470",
    name: "Xiong Yang",
    cjkName: "熊楊",
    cjkNames: ["熊楊", "楚熊楊"],
    aliases: ["楚熊楊"],
    desc: "fifth viscount of the state of Chu during the early Zhou Dynasty of ancient China",
    born: null,
    died: null,
    offices: [
    ]
  },
  {
    uid: "Q7993785",
    name: "Xiong Zhi",
    cjkName: "熊挚红",
    cjkNames: ["熊挚红", "熊摯紅", "楚熊摯"],
    aliases: ["Hùng Chí", "楚熊摯"],
    desc: "monarch of the state of Chu, founder of the state of Kui",
    born: null,
    died: null,
    offices: [
    ]
  },
  {
    uid: "Q8053703",
    name: "Yingbo",
    cjkName: "𦀚伯",
    cjkNames: ["𦀚伯"],
    aliases: [],
    desc: "ruler of the state of Chu",
    born: null,
    died: null,
    offices: [
    ]
  },
  {
    uid: "Q912239",
    name: "Yue Yi",
    cjkName: "乐毅",
    cjkNames: ["乐毅", "樂毅", "望诸君"],
    aliases: ["望诸君", "樂毅"],
    desc: "Chinese minister",
    born: null,
    died: null,
    offices: [
    ]
  }
];


  const MAX_PORTRAITS_PER_ROW = 8;
  const INITIAL_YEAR = 2024;

  // ---- CACHES / PERFORMANCE ----------------------------------------------

  // Cache placeholder PNG dataURLs (canvas output)
  // Keyed by: `${cjkLabel}|${borderColor}|${bgColor}|${size}`
  const PLACEHOLDER_DATAURL_CACHE = new Map();

  // Cache full rendered DOM per year (so scrolling back is instant)
  const YEAR_RENDER_CACHE = new Map(); // yearStr -> { node: HTMLElement, entriesCount: number }
  const YEAR_RENDER_LRU = [];          // yearStr in LRU order (oldest first)
  const YEAR_RENDER_CACHE_LIMIT = 30;  // tweak: 15–60 depending on dataset size
  let currentRenderedYear = null;

  // ---- BACKGROUND COLORS (HASHED BY LAST WORD) ----------------------------
  // Same palette you liked, chosen by hash(last-word-of-English-name).
  const BG_PALETTE = [
    "#241f13",
    "#231d12",
    "#13241a",
    "#13202a",
    "#27121d",
    "#2a1a13",
    "#22192a",
    "#2a1513",
    "#1e1e1e",
    "#1b1b1b",
  ];

  function getLastWordKey(englishName) {
    const s = String(englishName || "").trim();
    if (!s) return "unknown";
    const parts = s.split(/\s+/).filter(Boolean);
    let last = parts.length ? parts[parts.length - 1] : "unknown";
    last = last.replace(/[.,;:!?'"()\[\]{}<>]+$/g, "");
    return last || "unknown";
  }

  function hashStringToIndex(str, mod) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) + h) ^ str.charCodeAt(i);
    }
    h = h >>> 0;
    return mod > 0 ? (h % mod) : 0;
  }

  function getBgColorForEnglishName(englishName) {
    const key = getLastWordKey(englishName).toLowerCase();
    const idx = hashStringToIndex(key, BG_PALETTE.length);
    return BG_PALETTE[idx];
  }

  // ---- STATE COLORS -------------------------------------------------------

  // Muted-but-distinct palette for states. (No “meaning”, just stable identity.)
  const STATE_COLOR_PALETTE = [
    "#c9a227", // warm gold
    "#4fb7a5", // teal
    "#5aa2d6", // blue
    "#b07bd3", // purple
    "#d98b5f", // orange
    "#d46b8f", // rose
    "#7fc15a", // green
    "#e0c15a", // pale gold
    "#a6a6a6", // gray
    "#c45757", // red
    "#8bb1d8", // light blue
    "#9bd6c8", // mint
  ];

  function getStateColor(stateName) {
	  if (stateName == "Zhou"){
		return "#58233F";
	  }
	  if (stateName == "Qin"){
		return "#20454E";
	  }
	  if (stateName == "Qi"){
		return "#ADA319";
	  }
	  if (stateName == "Chu"){
		return "#206A36";
	  }
	  if (stateName == "Jin"){
		return "#B84707";
	  }
    const s = String(stateName || "").trim();
    if (!s) return null;
    const idx = hashStringToIndex(s.toLowerCase(), STATE_COLOR_PALETTE.length);
    return STATE_COLOR_PALETTE[idx];
  }

  // Tier defaults when state is null (so tablets still look intentional).
  const TIER_DEFAULT_COLOR = {
    1: "#c9a227", // gold
    2: "#5aa2d6", // blue
    3: "#5aa2d6", // blue
    4: "#b07bd3", // purple
    5: "#a6a6a6", // gray
    6: "#777777", // darker gray
  };

  // ---- DOM HOOKS ----------------------------------------------------------

  const rightPanel = document.querySelector(".right-panel");
  const yearElements = document.querySelectorAll(".year");
  const yearLabel = document.getElementById("current-year");
  const container = document.getElementById("constitution-container");

  const mapImg = document.createElement("img");
  mapImg.id = "timeline-map";
  mapImg.style.width = `${MAP_WIDTH_PX}px`;
  mapImg.style.maxWidth = "100%";
  mapImg.style.height = "auto";
  mapImg.style.display = "block";
  mapImg.style.margin = "0 auto 12px auto";

  container?.parentElement?.insertBefore(mapImg, container);

  if (!rightPanel || !yearLabel || !container) {
    console.error("Missing required DOM elements (.right-panel, #current-year, #constitution-container).");
    return;
  }

  // ---- MAP HELPERS --------------------------------------------------------

  function mapPathForYear(year) {
    return `${MAP_DIR}y-${year}${MAP_EXT}`;
  }

  function setMapForYear(year) {
    const y = Number(year);
    let fallbackSrc;

    if (y >= -1000) {
      fallbackSrc = mapPathForYear(-710);
    } else if (y >= -1046) {
      fallbackSrc = mapPathForYear(MAP_DEFAULT_YEAR);
    } else {
      fallbackSrc = mapPathForYear(-1600);
    }

    const desiredSrc = mapPathForYear(y);

    mapImg.onerror = null;
    mapImg.onerror = () => {
      mapImg.onerror = null;
      mapImg.src = fallbackSrc;
    };

    if (mapImg.src && mapImg.src.endsWith(desiredSrc)) return;
    mapImg.src = desiredSrc;
  }

  // ---- GENERAL HELPERS ----------------------------------------------------

  function formatYear(y) {
    const year = Number(y);
    if (Number.isNaN(year)) return "--";
    return year < 0 ? `${Math.abs(year)} BC` : `${year} AD`;
  }

  function getCurrentYearFromScroll() {
    let currentYear = null;
    let bestTop = Infinity;

    yearElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const parentRect = rightPanel.getBoundingClientRect();
      const topWithin = rect.top - parentRect.top;

      if (topWithin >= -5 && topWithin < bestTop) {
        bestTop = topWithin;
        currentYear = el.getAttribute("data-year");
      }
    });

    return currentYear;
  }

  function officeRank(officeName) {
    const idx = OFFICE_SORT_ORDER.indexOf(officeName);
    return idx === -1 ? 9999 : idx;
  }

  function activeOfficeStints(person, year) {
    return (person.offices || []).filter((o) => o.from <= year && o.to >= year);
  }

  // ---- CJK monogram helpers ----------------------------------------------

  function containsCjk(str) {
    if (!str) return false;
    return /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/.test(str);
  }

  function pickBestCjkLabel(entry) {
    if (entry.cjkName && containsCjk(entry.cjkName)) return String(entry.cjkName).trim();

    if (Array.isArray(entry.cjkNames)) {
      for (const n of entry.cjkNames) {
        if (n && containsCjk(n)) return String(n).trim();
      }
    }

    const aliases = Array.isArray(entry.aliases) ? entry.aliases : [];
    for (const a of aliases) {
      if (a && containsCjk(a)) return String(a).trim();
    }

    if (entry.name && containsCjk(entry.name)) return String(entry.name).trim();

    return null;
  }

  function extractCjkMonogram(label) {
    const chars = Array.from(label).filter((ch) => containsCjk(ch));
    if (chars.length >= 3) return chars.slice(0, 3).join("");
    if (chars.length >= 2) return chars.slice(0, 2).join("");
    if (chars.length >= 1) return chars[0];
    return "？";
  }

function makePlaceholderDataUrlCached({
  label,
  borderColor,
  bgColor,
  size = 512,
  shape = "circle", // NEW: "circle" | "rounded" | "square"
  radius = 0.2      // NEW: relative corner radius for rounded
}) {
  const cacheKey = `${label}|${borderColor}|${bgColor}|${size}|${shape}|${radius}`;
  const hit = PLACEHOLDER_DATAURL_CACHE.get(cacheKey);
  if (hit) return hit;

  const monogram = extractCjkMonogram(label);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, size, size);

  // ---- SHAPE MASK ---------------------------------------------------------
  ctx.save();
  ctx.beginPath();

  if (shape === "circle") {
    ctx.arc(size / 2, size / 2, size / 2 * 0.96, 0, Math.PI * 2);
  } else {
    const r = shape === "rounded" ? size * radius : 0;
    ctx.roundRect(0, 0, size, size, r);
  }

  ctx.clip();

  // ---- BACKGROUND ---------------------------------------------------------
  const grad = ctx.createRadialGradient(
    size * 0.4, size * 0.35, size * 0.15,
    size / 2, size / 2, size * 0.6
  );
  grad.addColorStop(0, lightenHex(bgColor, 0.12));
  grad.addColorStop(1, bgColor);

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // vignette
  ctx.globalAlpha = 0.25;
  const vignette = ctx.createRadialGradient(
    size / 2, size / 2, size * 0.2,
    size / 2, size / 2, size * 0.7
  );
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,1)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, size, size);
  ctx.globalAlpha = 1;

  ctx.restore();

  // ---- BORDER -------------------------------------------------------------
  ctx.beginPath();
  if (shape === "circle") {
    ctx.arc(size / 2, size / 2, size / 2 * 0.94, 0, Math.PI * 2);
  } else {
    const r = shape === "rounded" ? size * radius : 0;
    ctx.roundRect(size * 0.03, size * 0.03, size * 0.94, size * 0.94, r);
  }

  ctx.lineWidth = Math.max(6, size * 0.03);
  ctx.strokeStyle = borderColor || "#c9a227";
  ctx.stroke();

  // ---- TEXT ---------------------------------------------------------------
  const fontStack = `"Noto Serif SC","Source Han Serif SC","Songti SC","SimSun","PMingLiU","serif"`;
  let fontPx = size * 0.42;
  if (monogram.length === 2) fontPx = size * 0.36;
  if (monogram.length >= 3) fontPx = size * 0.30;

  ctx.font = `600 ${Math.floor(fontPx)}px ${fontStack}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#F2F2F2";
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = size * 0.03;

  ctx.fillText(monogram, size / 2, size / 2 + size * 0.02);

  const dataUrl = canvas.toDataURL("image/png");
  PLACEHOLDER_DATAURL_CACHE.set(cacheKey, dataUrl);
  return dataUrl;
}


  function lightenHex(hex, amount01) {
    const m = Math.max(0, Math.min(1, amount01));
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    const r = Math.round(rgb.r + (255 - rgb.r) * m);
    const g = Math.round(rgb.g + (255 - rgb.g) * m);
    const b = Math.round(rgb.b + (255 - rgb.b) * m);
    return rgbToHex(r, g, b);
  }

  function hexToRgb(hex) {
    const h = String(hex || "").trim();
    const m = /^#?([0-9a-f]{6})$/i.exec(h);
    if (!m) return null;
    const n = parseInt(m[1], 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function rgbToHex(r, g, b) {
    const to2 = (x) => x.toString(16).padStart(2, "0");
    return `#${to2(r)}${to2(g)}${to2(b)}`;
  }

  // =========================================================================
  // TABLETS (procedural textures + procedural seals)
  // =========================================================================

  function svgToDataUrl(svgString) {
    const encoded = encodeURIComponent(svgString)
      .replace(/%0A/g, "")
      .replace(/%20/g, " ")
      .replace(/%3D/g, "=")
      .replace(/%3A/g, ":")
      .replace(/%2F/g, "/")
      .replace(/%22/g, "'");
    return `data:image/svg+xml;charset=utf-8,${encoded}`;
  }

  function makeSealDataUrl({ shape = "square", stroke = "rgba(160,40,40,0.35)", fill = "rgba(160,40,40,0.10)" } = {}) {
    const w = 64, h = 64;
    const pad = 10;
    const r = shape === "square" ? 6 : 10;

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
        <defs>
          <filter id="rough">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="2" />
            <feDisplacementMap in="SourceGraphic" scale="0.8" />
          </filter>
        </defs>
        <g filter="url(#rough)">
          <rect x="${pad}" y="${pad}" width="${w - pad * 2}" height="${h - pad * 2}"
                rx="${r}" ry="${r}"
                fill="${fill}" stroke="${stroke}" stroke-width="3"/>
          <rect x="${pad + 6}" y="${pad + 6}" width="${w - pad * 2 - 12}" height="${h - pad * 2 - 12}"
                rx="${Math.max(2, r - 3)}" ry="${Math.max(2, r - 3)}"
                fill="none" stroke="rgba(160,40,40,0.18)" stroke-width="2"/>
          <path d="M${pad+2},${pad+12} L${pad+2},${pad+4} L${pad+10},${pad+4}"
                stroke="rgba(160,40,40,0.22)" stroke-width="2" fill="none"/>
          <path d="M${w-pad-2},${h-pad-12} L${w-pad-2},${h-pad-4} L${w-pad-10},${h-pad-4}"
                stroke="rgba(160,40,40,0.22)" stroke-width="2" fill="none"/>
        </g>
      </svg>
    `;
    return svgToDataUrl(svg);
  }

  function safeText(s) { return String(s ?? "").trim(); }

  function formatLifeRange(entry) {
    const b = entry.born != null ? formatYear(entry.born) : "?";
    const d = entry.died != null ? formatYear(entry.died) : "?";
    if (b === "?" && d === "?") return "";
    return `${b} – ${d}`;
  }

  function formatRegnalYears(regnal) {
    if (!regnal || regnal.from == null || regnal.to == null) return "";
    const a = Number(regnal.from), b = Number(regnal.to);
    if (Number.isNaN(a) || Number.isNaN(b)) return "";
    return `r. ${formatYear(a)} – ${formatYear(b)}`;
  }

  function getPrimaryName(entry) { return safeText(entry.name) || "(unknown)"; }
  function getSecondaryName(entry) {
    const cjk = pickBestCjkLabel(entry);
    return cjk ? safeText(cjk) : "";
  }

  function setTabletThemeVars(node, { tier, stateColor, neutral = false, texMode = "paper" }) {
    node.style.setProperty("--state-color", stateColor || "#777");
    node.dataset.tier = String(tier);
    node.dataset.neutral = neutral ? "1" : "0";
    node.dataset.tex = texMode; // "paper" | "paperDense" | "lacquer"
  }

  function CreateTabletBase(entry, opts) {
    const {
      tier,
      stateColor,
      neutralState = false,
      texMode = "paper",
      borderStyle = "single",
      borderWeight = "md",
      showSeal = false,
      sealShape = "square",
      showSecondaryCjk = false,
      regnal = null,
      subtitle = "",
    } = opts;

    const root = document.createElement("div");
    root.className = "tablet";
    root.dataset.border = borderStyle;
    root.dataset.weight = borderWeight;
    setTabletThemeVars(root, { tier, stateColor, neutral: neutralState, texMode });

    const header = document.createElement("div");
    header.className = "tablet-header";

    const name = document.createElement("div");
    name.className = "tablet-name";
    name.textContent = getPrimaryName(entry);
    header.appendChild(name);

    const regText = formatRegnalYears(regnal);
    if (regText) {
      const reg = document.createElement("div");
      reg.className = "tablet-regnal";
      reg.textContent = regText;
      header.appendChild(reg);
    }

    if (subtitle) {
      const sub = document.createElement("div");
      sub.className = "tablet-subtitle";
      sub.textContent = subtitle;
      header.appendChild(sub);
    }

    const portraitWrap = document.createElement("div");
    portraitWrap.className = "tablet-portrait-wrap";

    const img = document.createElement("img");
    img.className = "tablet-portrait";

    const imgPath = entry.imageFile
      ? `${IMAGE_DIR}${entry.imageFile}`
      : `${IMAGE_DIR}${entry.uid}${IMAGE_EXT}`;

    img.src = imgPath;
    img.alt = getPrimaryName(entry);

img.onerror = () => {
  img.onerror = null;
  const cjkLabel = pickBestCjkLabel(entry);
  if (cjkLabel) {
    const bgColor = getBgColorForEnglishName(entry.name);

    const tier = Number(root.dataset.tier);
    const shape =
      tier <= 2 ? "circle" :
      tier <= 4 ? "rounded" :
      "square";

    const radius =
      tier <= 2 ? 0.5 :
      tier <= 4 ? 0.18 :
      0.02;

    img.src = makePlaceholderDataUrlCached({
      label: cjkLabel,
      borderColor: stateColor || "#c9a227",
      bgColor,
      size: 512,
      shape,
      radius
    });
}}

    portraitWrap.appendChild(img);

    if (showSeal) {
      const seal = document.createElement("img");
      seal.className = "tablet-seal";
      seal.alt = "";
      seal.decoding = "async";
      seal.loading = "lazy";
      seal.src = makeSealDataUrl({
        shape: sealShape === "rect" ? "rect" : "square",
      });
      portraitWrap.appendChild(seal);
    }

    const footer = document.createElement("div");
    footer.className = "tablet-footer";

    const life = formatLifeRange(entry);
    if (life) {
      const lifeEl = document.createElement("div");
      lifeEl.className = "tablet-life";
      lifeEl.textContent = life;
      footer.appendChild(lifeEl);
    }

    if (showSecondaryCjk) {
      const cjk = getSecondaryName(entry);
      if (cjk) {
        const cjkEl = document.createElement("div");
        cjkEl.className = "tablet-cjk";
        cjkEl.textContent = cjk;
        footer.appendChild(cjkEl);
      }
    }

    root.appendChild(header);
    root.appendChild(portraitWrap);
    root.appendChild(footer);

    // Tooltip
    const born = entry.born != null ? formatYear(entry.born) : "?";
    const died = entry.died != null ? formatYear(entry.died) : "?";
    const aka =
      entry.aliases && entry.aliases.length
        ? `AKA: ${entry.aliases.slice(0, 6).join(", ")}`
        : "";
    const desc = entry.desc ? entry.desc : "";
    root.title =
      `${entry.name}\n` +
      `Life: ${born} – ${died}\n` +
      (desc ? `${desc}\n` : "") +
      (aka ? `${aka}\n` : "");

    return root;
  }

  function CreateTabletTier1(entry, { stateColor, regnal = null, subtitle = "" } = {}) {
    return CreateTabletBase(entry, {
      tier: 1,
      stateColor,
      neutralState: !stateColor,
      texMode: "lacquer",
      borderStyle: "double",
      borderWeight: "xl",
      showSeal: true,
      sealShape: "square",
      showSecondaryCjk: false,
      regnal,
      subtitle,
    });
  }

  function CreateTabletTier2(entry, { stateColor, regnal = null, subtitle = "" } = {}) {
    return CreateTabletBase(entry, {
      tier: 2,
      stateColor,
      neutralState: !stateColor,
      texMode: "paperDense",
      borderStyle: "double",
      borderWeight: "lg",
      showSeal: false,
      regnal,
      subtitle,
    });
  }

  function CreateTabletTier3(entry, { stateColor, subtitle = "" } = {}) {
    return CreateTabletBase(entry, {
      tier: 3,
      stateColor,
      neutralState: !stateColor,
      texMode: "paperDense",
      borderStyle: "single",
      borderWeight: "md",
      showSeal: false,
      subtitle,
    });
  }

  function CreateTabletTier4(entry, { stateColor, subtitle = "" } = {}) {
    return CreateTabletBase(entry, {
      tier: 4,
      stateColor,
      neutralState: !stateColor,
      texMode: "paper",
      borderStyle: "single",
      borderWeight: "sm",
      showSeal: false,
      subtitle,
    });
  }

  function CreateTabletTier5(entry, { stateColor, subtitle = "" } = {}) {
    return CreateTabletBase(entry, {
      tier: 5,
      stateColor,
      neutralState: !stateColor,
      texMode: "paper",
      borderStyle: "inset",
      borderWeight: "sm",
      showSeal: false,
      subtitle,
    });
  }

  function CreateTabletTier6(entry, { stateColor, subtitle = "" } = {}) {
    return CreateTabletBase(entry, {
      tier: 6,
      stateColor,
      neutralState: !stateColor,
      texMode: "paper",
      borderStyle: "hairline",
      borderWeight: "hair",
      showSeal: false,
      subtitle,
    });
  }
// ---- TIER LOGIC ---------------------------------------------------------

// Tier 1: Sons of Heaven / Emperors / Universal Sovereigns
const TIER_1 = new Set([
  "Emperor",
  "Chinese Sovereign",
  "Son of Heaven",
  "Huangdi",
  "Taishang Huang",
  "Khagan of the Mongol Empire",
  "Khagan",
  "Khan of Heaven",
  "Great President of the Republic of China",

  // Historical one-off sovereign labels
  "Qin Shi Huang (Shi Huangdi)",
  "Qin Er Shi",
  "Wang Mang",
  "Wu Ding",
  "Di Yi",
]);

// Tier 2: Kings and equivalents (王, Rex-tier rulers)
const TIER_2 = new Set([
  "King",
  "Wang",
  "Chinese King",
  "Prince of a State",
]);

// Tier 3: Dukes and equivalents (公)
const TIER_3_PREFIXES = [
  "Duke",
  "Gong",
];

// Tier 4: Marquises and equivalents (侯, 伯爵, etc.)
const TIER_4_PREFIXES = [
  "Marquis",
  "Marquess",
  "Hou",
  "Count",
  "Viscount",
  "Earl",
];

// Tier 5: Ministers, chancellors, regents, consorts, officials
const TIER_5 = new Set([
  "Crown Prince",
  "Imperial Prince",
  "Prince",
  "Heshuo Qinwang",
  "Regent",
  "Gonghe Regency",
  "Empress Dowager",
  "Empress Consort",
  "Prime Minister of the Imperial Cabinet",
  "Grand Chancellor",
  "Chancellor",
  "Chancellor of the Tang Dynasty",
  "Zhuguo",
  "Viceroy of Zhili",
  "Mayor of Kaifeng Fu",
  "List of Consorts of Rulers of China",
]);

function getTierForOffice(officeName) {
  if (!officeName) return 6;

  // Sink QIDs and unknown labels
  if (/^Q\d+$/.test(officeName)) return 6;

  if (TIER_1.has(officeName)) return 1;
  if (TIER_2.has(officeName)) return 2;
  if (TIER_5.has(officeName)) return 5;

  for (const pre of TIER_3_PREFIXES) {
    if (officeName.startsWith(pre)) return 3;
  }

  for (const pre of TIER_4_PREFIXES) {
    if (officeName.startsWith(pre)) return 4;
  }

  // Default: civilian / miscellaneous
  return 6;
}

  // ---- DATA -> ENTRIES ----------------------------------------------------

  function getActiveEntriesForYear(year) {
    const y = Number(year);
    if (Number.isNaN(y)) return [];

    const entries = [];

    // PEOPLE must exist globally (from people.js)
    if (!Array.isArray(window.PEOPLE)) {
      // allow const PEOPLE in module scope too
      if (!Array.isArray(typeof PEOPLE !== "undefined" ? PEOPLE : null)) {
        console.error("PEOPLE is not defined or not an array. Include people.js before script.js.");
        return [];
      }
    }

    const PEOPLE_ARRAY = Array.isArray(window.PEOPLE) ? window.PEOPLE : PEOPLE;

    for (const p of PEOPLE_ARRAY) {
      const stints = activeOfficeStints(p, y);
      if (stints.length === 0) continue;

      for (const stint of stints) {
        const officeName = stint.office || "Other";
        const stateName = stint.state ?? null;

        entries.push({
          uid: p.uid,
          name: p.name.split(" of ")[0],
          cjkName: p.cjkName ?? null,
          cjkNames: p.cjkNames ?? [],
          aliases: p.aliases || [],
          desc: p.desc || "",
          born: p.born ?? null,
          died: p.died ?? null,
          imageFile: p.imageFile || null,

          officeName,
          stateName,

          // Preserve from/to so we can show regnal span on higher tiers
          from: stint.from,
          to: stint.to,
        });
      }
    }

    // Dedup by (uid + officeName + stateName)
    const seen = new Set();
    const deduped = [];
    for (const e of entries) {
      const key = `${e.uid}::${e.officeName}::${e.stateName ?? "null"}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(e);
    }

    // Sort by office rank, then by state, then by name
    deduped.sort((a, b) => {
      const ra = officeRank(a.officeName);
      const rb = officeRank(b.officeName);
      if (ra !== rb) return ra - rb;

      const sa = (a.stateName || "").toLowerCase();
      const sb = (b.stateName || "").toLowerCase();
      if (sa !== sb) return sa.localeCompare(sb);

      return a.name.localeCompare(b.name);
    });

    return deduped;
  }

  // ---- RENDERING ----------------------------------------------------------

  function clearContainer() {
    container.innerHTML = "";
  }

  function renderYearLabel(year) {
    yearLabel.textContent = `Year: ${formatYear(year)}`;
  }

  function buildSubtitle(entry) {
    // Put office prominently, then state if present
    if (entry.stateName) return `${entry.officeName} — ${entry.stateName}`;
    return entry.officeName;
  }

  function createTabletNode(entry) {
    const tier = getTierForOffice(entry.officeName);

    // State color: hash(state) if present; else tier default
    let stateColor = getStateColor(entry.stateName);
    if (!stateColor) stateColor = TIER_DEFAULT_COLOR[tier] || "#777";

    const subtitle = buildSubtitle(entry);

    // Only show regnal years on tiers 1–2 (keeps tablets clean)
    const regnal = (tier <= 2 && entry.from != null && entry.to != null)
      ? { from: entry.from, to: entry.to }
      : null;

    switch (tier) {
      case 1: return CreateTabletTier1(entry, { stateColor, regnal, subtitle });
      case 2: return CreateTabletTier2(entry, { stateColor, regnal, subtitle });
      case 3: return CreateTabletTier3(entry, { stateColor, subtitle });
      case 4: return CreateTabletTier4(entry, { stateColor, subtitle });
      case 5: return CreateTabletTier5(entry, { stateColor, subtitle });
      default: return CreateTabletTier6(entry, { stateColor, subtitle });
    }
  }

function stateKey(entry) {
  const s = String(entry.stateName || "").trim();
  return s || "—";
}

function buildYearNode(entries) {
  const group = document.createElement("div");
  group.classList.add("group-container");

  // ---- 1) Group by state --------------------------------------------------
  const byState = new Map();
  for (const e of entries) {
    const key = stateKey(e);
    if (!byState.has(key)) byState.set(key, []);
    byState.get(key).push(e);
  }

  // ---- 2) Compute best tier per state + sort state groups -----------------
  const stateGroups = Array.from(byState.entries()).map(([state, list]) => {
    let bestTier = 999;
    for (const e of list) {
      const t = getTierForOffice(e.officeName);
      if (t < bestTier) bestTier = t;
    }

    // Slot width for packing: how many portraits wide this state "wants"
    // (clamped to MAX_PORTRAITS_PER_ROW).
    const slotWidth = 1;//Math.max(1, Math.min(MAX_PORTRAITS_PER_ROW, list.length));

    return { state, list, bestTier, slotWidth };
  });

  stateGroups.sort((a, b) => {
    if (a.bestTier !== b.bestTier) return a.bestTier - b.bestTier; // tier 1 first
    if (a.state === "—" && b.state !== "—") return 1;
    if (b.state === "—" && a.state !== "—") return -1;
    return a.state.localeCompare(b.state);
  });

  // ---- 3) Packing layout: state-groups side-by-side within slot budget ----
  const packed = document.createElement("div");
  packed.classList.add("state-packed");

  let currentRow = document.createElement("div");
  currentRow.classList.add("state-row");
  let usedSlots = 0;

  function flushRowIfHasContent() {
    if (currentRow.childNodes.length > 0) {
      packed.appendChild(currentRow);
      currentRow = document.createElement("div");
      currentRow.classList.add("state-row");
      usedSlots = 0;
    }
  }

  for (const sg of stateGroups) {
    // Sort within state: tier -> officeRank -> name
    sg.list.sort((x, y) => {
      const tx = getTierForOffice(x.officeName);
      const ty = getTierForOffice(y.officeName);
      if (tx !== ty) return tx - ty;

      const rx = officeRank(x.officeName);
      const ry = officeRank(y.officeName);
      if (rx !== ry) return rx - ry;

      return x.name.localeCompare(y.name);
    });

    // If this state won't fit in the current row, start a new row
    if (usedSlots > 0 && usedSlots + sg.slotWidth > MAX_PORTRAITS_PER_ROW) {
      flushRowIfHasContent();
    }

    // Create state block
    const stateBlock = document.createElement("div");
    stateBlock.classList.add("state-group");

stateBlock.style.setProperty("--slots", String(sg.slotWidth));

    const title = document.createElement("div");
    title.classList.add("state-group-title");
    title.textContent = sg.state;

    const headerColor = getStateColor(sg.state);
    if (headerColor) title.style.setProperty("--state-color", headerColor);

    stateBlock.appendChild(title);

    const grid = document.createElement("div");
    grid.classList.add("member-grid");

    let row = document.createElement("div");
    row.classList.add("row-container");
    let count = 0;

    for (const e of sg.list) {
      if (count >= MAX_PORTRAITS_PER_ROW) {
        grid.appendChild(row);
        row = document.createElement("div");
        row.classList.add("row-container");
        count = 0;
      }
      row.appendChild(createTabletNode(e));
      count++;
    }
    if (row.childNodes.length > 0) grid.appendChild(row);

    stateBlock.appendChild(grid);
    currentRow.appendChild(stateBlock);

    usedSlots += sg.slotWidth;
  }

  flushRowIfHasContent();

  group.appendChild(packed);
  return group;
}


  // ---- YEAR DOM CACHE (LRU) ----------------------------------------------

  function touchYearLru(yearStr) {
    const idx = YEAR_RENDER_LRU.indexOf(yearStr);
    if (idx !== -1) YEAR_RENDER_LRU.splice(idx, 1);
    YEAR_RENDER_LRU.push(yearStr);
  }

  function evictIfNeeded(currentYearStr) {
    while (YEAR_RENDER_LRU.length > YEAR_RENDER_CACHE_LIMIT) {
      const oldest = YEAR_RENDER_LRU[0];
      if (oldest === currentYearStr) {
        YEAR_RENDER_LRU.shift();
        YEAR_RENDER_LRU.push(oldest);
        continue;
      }

      YEAR_RENDER_LRU.shift();
      const payload = YEAR_RENDER_CACHE.get(oldest);
      if (payload && payload.node && payload.node.parentElement) {
        payload.node.remove();
      }
      YEAR_RENDER_CACHE.delete(oldest);
    }
  }

  function getOrBuildYearNode(yearStr) {
    const cached = YEAR_RENDER_CACHE.get(yearStr);
    if (cached && cached.node) {
      touchYearLru(yearStr);
      return cached.node;
    }

    const entries = getActiveEntriesForYear(yearStr);
    const node = buildYearNode(entries);

    YEAR_RENDER_CACHE.set(yearStr, { node, entriesCount: entries.length });
    touchYearLru(yearStr);
    evictIfNeeded(yearStr);

    return node;
  }

  function renderForYear(yearStr) {
    if (yearStr == null) return;

    if (currentRenderedYear === yearStr) return;
    currentRenderedYear = yearStr;

    renderYearLabel(yearStr);
    setMapForYear(yearStr);

    clearContainer();
    const node = getOrBuildYearNode(yearStr);
    container.appendChild(node);
  }

  // ---- SCROLL SYNC --------------------------------------------------------

  const observerOptions = {
    root: rightPanel,
    rootMargin: "-20% 0px -80% 0px",
    threshold: 0,
  };

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const year = entry.target.getAttribute("data-year");
      if (year != null) renderForYear(year);
      break;
    }
  }, observerOptions);

  yearElements.forEach((el) => observer.observe(el));

  let scrollRaf = null;
  rightPanel.addEventListener("scroll", () => {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = null;
      const y = getCurrentYearFromScroll();
      if (y != null) renderForYear(y);
    });
  });

  renderForYear(String(INITIAL_YEAR));
});
