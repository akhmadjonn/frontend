import type { AnimatedQuestion } from '../types';

export const animatedQuestions: AnimatedQuestion[] = [
  // ═══════════════════════════════════════════════════════
  // 1. RAILWAY CROSSING — Barriers down, train approaching
  // ═══════════════════════════════════════════════════════
  {
    id: 'rw-1',
    category: 'railway',
    difficulty: 'easy',
    question: {
      uzLatin: "Temir yo'l o'tish joyiga yaqinlashayapsiz. Shlagbaum tushgan va poyezd ko'rinib turibdi. Nima qilasiz?",
      uz: "Темир йўл ўтиш жойига яқинлашаяпсиз. Шлагбаум тушган ва поезд кўриниб турибди. Нима қиласиз?",
      ru: "Вы приближаетесь к железнодорожному переезду. Шлагбаум опущен и виден поезд. Что вы сделаете?",
    },
    options: [
      {
        id: 'rw1-a',
        text: {
          uzLatin: "Tezlikni oshirib, poyezddan oldin o'tib ketaman",
          uz: "Тезликни оширибб поезддан олдин ўтиб кетаман",
          ru: "Увеличу скорость и проеду перед поездом",
        },
        correct: false,
      },
      {
        id: 'rw1-b',
        text: {
          uzLatin: "To'xtab, poyezd o'tib ketishini kutaman",
          uz: "Тўхтаб, поезд ўтиб кетишини кутаман",
          ru: "Остановлюсь и подожду, пока поезд проедет",
        },
        correct: true,
      },
    ],
    explanation: {
      uzLatin: "YHQ 15.1-bandiga ko'ra, shlagbaum tushgan yoki yopilayotgan, shuningdek svetofor qizil signal ko'rsatayotgan bo'lsa, temir yo'l o'tish joyidan o'tish taqiqlanadi.",
      uz: "ЙҲҚ 15.1-бандига кўра, шлагбаум тушган ёки ёпилаётган, шунингдек светофор қизил сигнал кўрсатаётган бўлса, темир йўл ўтиш жойидан ўтиш тақиқланади.",
      ru: "Согласно п. 15.1 ПДД, запрещается выезжать на переезд при закрытом или закрывающемся шлагбауме, а также при запрещающем сигнале светофора.",
    },
    pddReference: 'YHQ 15.1',
    scene: {
      type: 'railway_crossing',
      viewBox: '0 0 600 400',
      vehicles: [
        { id: 'player', type: 'car', isPlayer: true, position: { x: 150, y: 210 }, direction: 'east', rotation: -90, color: '#2196F3', label: { uzLatin: 'SIZ', uz: 'СИЗ', ru: 'ВЫ' } },
        { id: 'train', type: 'train', isPlayer: false, position: { x: 300, y: -60 }, direction: 'south', rotation: 0, color: '#CC0000' },
      ],
      signs: [
        { type: 'railway', position: { x: 240, y: 150 } },
      ],
      roadElements: [
        { type: 'railway_tracks', position: { x: 300, y: 0 }, width: 30, height: 400 },
        { type: 'barrier', position: { x: 268, y: 175 }, width: 40, height: 4, rotation: 0 },
      ],
    },
    outcomes: {
      'rw1-a': {
        type: 'crash',
        animations: [
          { targetId: 'player', path: [{ x: 150, y: 210 }, { x: 240, y: 210 }, { x: 300, y: 210 }], rotations: [-90, -90, -90], duration: 1800 },
          { targetId: 'train', path: [{ x: 300, y: -60 }, { x: 300, y: 80 }, { x: 300, y: 210 }], rotations: [0, 0, 0], duration: 2200 },
        ],
        crashPoint: { x: 300, y: 210 },
        message: { uzLatin: "Poyezd bilan to'qnashish!", uz: "Поезд билан тўқнашиш!", ru: "Столкновение с поездом!" },
      },
      'rw1-b': {
        type: 'safe',
        animations: [
          { targetId: 'player', path: [{ x: 150, y: 210 }, { x: 210, y: 210 }], rotations: [-90, -90], duration: 800 },
          { targetId: 'train', path: [{ x: 300, y: -60 }, { x: 300, y: 200 }, { x: 300, y: 500 }], rotations: [0, 0, 0], duration: 2800 },
        ],
        message: { uzLatin: "To'g'ri! Poyezd xavfsiz o'tib ketdi.", uz: "Тўғри! Поезд хавфсиз ўтиб кетди.", ru: "Правильно! Поезд безопасно проехал." },
      },
    },
  },

  // ═══════════════════════════════════════════════════════
  // 2. RAILWAY CROSSING — No barriers, flashing red signal
  // ═══════════════════════════════════════════════════════
  {
    id: 'rw-2',
    category: 'railway',
    difficulty: 'medium',
    question: {
      uzLatin: "Temir yo'l o'tish joyida shlagbaum yo'q, lekin svetofor qizil miltillab turibdi. Nima qilasiz?",
      uz: "Темир йўл ўтиш жойида шлагбаум йўқ, лекин светофор қизил милтиллаб турибди. Нима қиласиз?",
      ru: "На железнодорожном переезде нет шлагбаума, но светофор мигает красным. Что вы сделаете?",
    },
    options: [
      {
        id: 'rw2-a',
        text: {
          uzLatin: "Sekin o'tib ketaman, chunki shlagbaum yo'q",
          uz: "Секин ўтиб кетаман, чунки шлагбаум йўқ",
          ru: "Проеду медленно, так как шлагбаума нет",
        },
        correct: false,
      },
      {
        id: 'rw2-b',
        text: {
          uzLatin: "To'xtab, signal o'chishini kutaman",
          uz: "Тўхтаб, сигнал ўчишини кутаман",
          ru: "Остановлюсь и подожду, пока сигнал погаснет",
        },
        correct: true,
      },
      {
        id: 'rw2-c',
        text: {
          uzLatin: "Signal beraman va tezda o'tib ketaman",
          uz: "Сигнал бераман ва тезда ўтиб кетаман",
          ru: "Подам сигнал и быстро проеду",
        },
        correct: false,
      },
    ],
    explanation: {
      uzLatin: "YHQ 15.2-bandiga ko'ra, svetoforning qizil miltillovchi signalida to'xtash chizig'i oldida to'xtash shart, shlagbaum mavjudligidan qat'i nazar.",
      uz: "ЙҲҚ 15.2-бандига кўра, светофорнинг қизил милтилловчи сигналида тўхташ чизиғи олдида тўхташ шарт, шлагбаум мавжудлигидан қатъи назар.",
      ru: "Согласно п. 15.2 ПДД, при мигающем красном сигнале светофора необходимо остановиться перед стоп-линией, независимо от наличия шлагбаума.",
    },
    pddReference: 'YHQ 15.2',
    scene: {
      type: 'railway_crossing',
      viewBox: '0 0 600 400',
      vehicles: [
        { id: 'player', type: 'car', isPlayer: true, position: { x: 140, y: 210 }, direction: 'east', rotation: -90, color: '#2196F3', label: { uzLatin: 'SIZ', uz: 'СИЗ', ru: 'ВЫ' } },
        { id: 'train', type: 'train', isPlayer: false, position: { x: 310, y: -60 }, direction: 'south', rotation: 0, color: '#CC0000' },
      ],
      signs: [{ type: 'railway', position: { x: 260, y: 160 } }],
      trafficLights: [{ id: 'tl1', position: { x: 270, y: 140 }, state: 'red', forDirection: 'east' }],
      roadElements: [{ type: 'railway_tracks', position: { x: 310, y: 0 }, width: 30, height: 400 }],
    },
    outcomes: {
      'rw2-a': {
        type: 'crash',
        animations: [
          { targetId: 'player', path: [{ x: 140, y: 210 }, { x: 230, y: 210 }, { x: 310, y: 210 }], rotations: [-90, -90, -90], duration: 2200 },
          { targetId: 'train', path: [{ x: 310, y: -60 }, { x: 310, y: 80 }, { x: 310, y: 210 }], rotations: [0, 0, 0], duration: 2400 },
        ],
        crashPoint: { x: 310, y: 210 },
        message: { uzLatin: "Poyezd bilan to'qnashish!", uz: "Поезд билан тўқнашиш!", ru: "Столкновение с поездом!" },
      },
      'rw2-b': {
        type: 'safe',
        animations: [
          { targetId: 'player', path: [{ x: 140, y: 210 }, { x: 220, y: 210 }], rotations: [-90, -90], duration: 800 },
          { targetId: 'train', path: [{ x: 310, y: -60 }, { x: 310, y: 200 }, { x: 310, y: 500 }], rotations: [0, 0, 0], duration: 2800 },
        ],
        message: { uzLatin: "To'g'ri! Xavfsiz kutib qoldingiz.", uz: "Тўғри! Хавфсиз кутиб қолдингиз.", ru: "Правильно! Вы безопасно подождали." },
      },
      'rw2-c': {
        type: 'crash',
        animations: [
          { targetId: 'player', path: [{ x: 140, y: 210 }, { x: 280, y: 210 }, { x: 310, y: 210 }], rotations: [-90, -90, -90], duration: 1500 },
          { targetId: 'train', path: [{ x: 310, y: -60 }, { x: 310, y: 100 }, { x: 310, y: 210 }], rotations: [0, 0, 0], duration: 1800 },
        ],
        crashPoint: { x: 310, y: 210 },
        message: { uzLatin: "Poyezd bilan to'qnashish!", uz: "Поезд билан тўқнашиш!", ru: "Столкновение с поездом!" },
      },
    },
  },

  // ═══════════════════════════════════════════════════════
  // 3. INTERSECTION — 4-way uncontrolled, right-of-way rule
  // ═══════════════════════════════════════════════════════
  {
    id: 'int-1',
    category: 'intersection',
    difficulty: 'medium',
    question: {
      uzLatin: "Tartibga solinmagan teng ahamiyatli chorrahada siz to'g'riga harakatlanmoqchisiz. O'ngingizdan avtomobil kelmoqda. Kim birinchi o'tadi?",
      uz: "Тартибга солинмаган тенг аҳамиятли чорраҳада сиз тўғрига ҳаракатланмоқчисиз. Ўнгингиздан автомобил келмоқда. Ким биринчи ўтади?",
      ru: "На нерегулируемом равнозначном перекрёстке вы хотите проехать прямо. Справа приближается автомобиль. Кто проедет первым?",
    },
    options: [
      {
        id: 'int1-a',
        text: { uzLatin: "Men birinchi o'taman", uz: "Мен биринчи ўтаман", ru: "Я проеду первым" },
        correct: false,
      },
      {
        id: 'int1-b',
        text: { uzLatin: "O'ngdagi avtomobilga yo'l beraman", uz: "Ўнгдаги автомобилга йўл бераман", ru: "Уступлю дорогу автомобилю справа" },
        correct: true,
      },
    ],
    explanation: {
      uzLatin: "YHQ 13.11-bandiga ko'ra, tartibga solinmagan teng ahamiyatli chorrahada o'ngdan kelayotgan transport vositasiga yo'l berish shart.",
      uz: "ЙҲҚ 13.11-бандига кўра, тартибга солинмаган тенг аҳамиятли чорраҳада ўнгдан келаётган транспорт воситасига йўл бериш шарт.",
      ru: "Согласно п. 13.11 ПДД, на нерегулируемом равнозначном перекрёстке водитель обязан уступить дорогу транспортным средствам, приближающимся справа.",
    },
    pddReference: 'YHQ 13.11',
    scene: {
      type: 'intersection_4way',
      viewBox: '0 0 600 400',
      vehicles: [
        { id: 'player', type: 'car', isPlayer: true, position: { x: 130, y: 215 }, direction: 'east', rotation: -90, color: '#2196F3', label: { uzLatin: 'SIZ', uz: 'СИЗ', ru: 'ВЫ' } },
        { id: 'car-right', type: 'car', isPlayer: false, position: { x: 300, y: 60 }, direction: 'south', rotation: 0, color: '#F44336' },
      ],
    },
    outcomes: {
      'int1-a': {
        type: 'crash',
        animations: [
          { targetId: 'player', path: [{ x: 130, y: 215 }, { x: 250, y: 215 }, { x: 310, y: 215 }], rotations: [-90, -90, -90], duration: 1800 },
          { targetId: 'car-right', path: [{ x: 300, y: 60 }, { x: 300, y: 150 }, { x: 300, y: 215 }], rotations: [0, 0, 0], duration: 2000 },
        ],
        crashPoint: { x: 305, y: 215 },
        message: { uzLatin: "To'qnashish! O'ngdan keluvchiga yo'l berish kerak edi.", uz: "Тўқнашиш! Ўнгдан келувчига йўл бериш керак эди.", ru: "Столкновение! Нужно было уступить дорогу справа." },
      },
      'int1-b': {
        type: 'safe',
        animations: [
          { targetId: 'player', path: [{ x: 130, y: 215 }, { x: 190, y: 215 }], rotations: [-90, -90], duration: 600 },
          { targetId: 'car-right', path: [{ x: 300, y: 60 }, { x: 300, y: 200 }, { x: 300, y: 350 }], rotations: [0, 0, 0], duration: 2800 },
        ],
        message: { uzLatin: "To'g'ri! O'ngdagi avtomobil xavfsiz o'tib ketdi.", uz: "Тўғри! Ўнгдаги автомобил хавфсиз ўтиб кетди.", ru: "Правильно! Автомобиль справа безопасно проехал." },
      },
    },
  },

  // ═══════════════════════════════════════════════════════
  // 4. INTERSECTION — Main road priority (diamond sign)
  // ═══════════════════════════════════════════════════════
  {
    id: 'int-2',
    category: 'intersection',
    difficulty: 'easy',
    question: {
      uzLatin: "Siz asosiy yo'lda harakat qilyapsiz va chorrahaga yaqinlashyapsiz. Ikkinchi darajali yo'ldan avtomobil kelmoqda. Kim birinchi o'tadi?",
      uz: "Сиз асосий йўлда ҳаракат қиляпсиз ва чорраҳага яқинлашяпсиз. Иккинчи даражали йўлдан автомобил келмоқда. Ким биринчи ўтади?",
      ru: "Вы движетесь по главной дороге и приближаетесь к перекрёстку. С второстепенной дороги приближается автомобиль. Кто проедет первым?",
    },
    options: [
      {
        id: 'int2-a',
        text: { uzLatin: "Men birinchi o'taman, chunki asosiy yo'ldaman", uz: "Мен биринчи ўтаман, чунки асосий йўлдаман", ru: "Я проеду первым, так как на главной дороге" },
        correct: true,
      },
      {
        id: 'int2-b',
        text: { uzLatin: "Ikkinchi darajali yo'ldagi avtomobilga yo'l beraman", uz: "Иккинчи даражали йўлдаги автомобилга йўл бераман", ru: "Уступлю дорогу автомобилю с второстепенной" },
        correct: false,
      },
    ],
    explanation: {
      uzLatin: "YHQ 13.9-bandiga ko'ra, asosiy yo'lda harakatlanuvchi transport vositasi ustunlik huquqiga ega.",
      uz: "ЙҲҚ 13.9-бандига кўра, асосий йўлда ҳаракатланувчи транспорт воситаси устунлик ҳуқуқига эга.",
      ru: "Согласно п. 13.9 ПДД, транспортное средство, движущееся по главной дороге, имеет преимущество.",
    },
    pddReference: 'YHQ 13.9',
    scene: {
      type: 'intersection_4way',
      viewBox: '0 0 600 400',
      vehicles: [
        { id: 'player', type: 'car', isPlayer: true, position: { x: 130, y: 215 }, direction: 'east', rotation: -90, color: '#2196F3', label: { uzLatin: 'SIZ', uz: 'СИЗ', ru: 'ВЫ' } },
        { id: 'car-side', type: 'car', isPlayer: false, position: { x: 300, y: 60 }, direction: 'south', rotation: 0, color: '#FF9800' },
      ],
      signs: [
        { type: 'main_road', position: { x: 190, y: 170 } },
        { type: 'yield', position: { x: 270, y: 120 } },
      ],
    },
    outcomes: {
      'int2-a': {
        type: 'safe',
        animations: [
          { targetId: 'player', path: [{ x: 130, y: 215 }, { x: 300, y: 215 }, { x: 480, y: 215 }], rotations: [-90, -90, -90], duration: 2800 },
          { targetId: 'car-side', path: [{ x: 300, y: 60 }, { x: 300, y: 130 }], rotations: [0, 0], duration: 800 },
        ],
        message: { uzLatin: "To'g'ri! Asosiy yo'lda ustunlik sizda.", uz: "Тўғри! Асосий йўлда устунлик сизда.", ru: "Правильно! На главной дороге преимущество у вас." },
      },
      'int2-b': {
        type: 'crash',
        animations: [
          { targetId: 'player', path: [{ x: 130, y: 215 }, { x: 190, y: 215 }], rotations: [-90, -90], duration: 600 },
          { targetId: 'car-side', path: [{ x: 300, y: 60 }, { x: 300, y: 200 }, { x: 300, y: 350 }], rotations: [0, 0, 0], duration: 2000 },
        ],
        crashPoint: { x: 250, y: 215 },
        message: { uzLatin: "Xato! Siz asosiy yo'lda edingiz — to'xtashingiz shart emas edi.", uz: "Хато! Сиз асосий йўлда эдингиз — тўхташингиз шарт эмас эди.", ru: "Ошибка! Вы были на главной дороге — останавливаться не нужно было." },
      },
    },
  },

  // ═══════════════════════════════════════════════════════
  // 5. INTERSECTION — T-intersection with STOP sign
  // ═══════════════════════════════════════════════════════
  {
    id: 'int-3',
    category: 'intersection',
    difficulty: 'medium',
    question: {
      uzLatin: "T-simon chorrahaga yaqinlashyapsiz va STOP belgisi o'rnatilgan. Asosiy yo'lda harakatlanayotgan avtomobil bor. Nima qilasiz?",
      uz: "T-симон чорраҳага яқинлашяпсиз ва STOP белгиси ўрнатилган. Асосий йўлда ҳаракатланаётган автомобил бор. Нима қиласиз?",
      ru: "Вы подъезжаете к Т-образному перекрёстку со знаком СТОП. По главной дороге движется автомобиль. Что вы сделаете?",
    },
    options: [
      {
        id: 'int3-a',
        text: { uzLatin: "Sekinlataman va imkoniyat bo'lsa o'taman", uz: "Секинлатаман ва имконият бўлса ўтаман", ru: "Притормаживаю и, если есть возможность, проеду" },
        correct: false,
      },
      {
        id: 'int3-b',
        text: { uzLatin: "To'liq to'xtab, yo'l beraman, keyin o'taman", uz: "Тўлиқ тўхтаб, йўл бераман, кейин ўтаман", ru: "Полностью остановлюсь, уступлю дорогу, затем проеду" },
        correct: true,
      },
    ],
    explanation: {
      uzLatin: "YHQ 2.5-ga ko'ra, STOP belgisida to'liq to'xtash va asosiy yo'ldagi barcha transport vositalariga yo'l berish shart.",
      uz: "ЙҲҚ 2.5-га кўра, СТОП белгисида тўлиқ тўхташ ва асосий йўлдаги барча транспорт воситаларига йўл бериш шарт.",
      ru: "Согласно п. 2.5, при знаке СТОП необходимо полностью остановиться и уступить дорогу всем ТС на главной дороге.",
    },
    pddReference: 'YHQ 2.5',
    scene: {
      type: 'intersection_t',
      viewBox: '0 0 600 400',
      vehicles: [
        { id: 'player', type: 'car', isPlayer: true, position: { x: 300, y: 360 }, direction: 'north', rotation: 180, color: '#2196F3', label: { uzLatin: 'SIZ', uz: 'СИЗ', ru: 'ВЫ' } },
        { id: 'car-main', type: 'truck', isPlayer: false, position: { x: 530, y: 200 }, direction: 'west', rotation: 90, color: '#4CAF50' },
      ],
      signs: [{ type: 'stop', position: { x: 270, y: 250 } }],
    },
    outcomes: {
      'int3-a': {
        type: 'crash',
        animations: [
          { targetId: 'player', path: [{ x: 300, y: 360 }, { x: 300, y: 280 }, { x: 300, y: 200 }], rotations: [180, 180, 180], duration: 1800 },
          { targetId: 'car-main', path: [{ x: 530, y: 200 }, { x: 400, y: 200 }, { x: 300, y: 200 }], rotations: [90, 90, 90], duration: 2000 },
        ],
        crashPoint: { x: 300, y: 200 },
        message: { uzLatin: "To'qnashish! STOP belgisida to'liq to'xtash shart edi!", uz: "Тўқнашиш! СТОП белгисида тўлиқ тўхташ шарт эди!", ru: "Столкновение! Нужно было полностью остановиться у знака СТОП!" },
      },
      'int3-b': {
        type: 'safe',
        animations: [
          { targetId: 'player', path: [{ x: 300, y: 360 }, { x: 300, y: 270 }], rotations: [180, 180], duration: 700 },
          { targetId: 'car-main', path: [{ x: 530, y: 200 }, { x: 300, y: 200 }, { x: 70, y: 200 }], rotations: [90, 90, 90], duration: 2800 },
        ],
        message: { uzLatin: "To'g'ri! To'xtab, yo'l berdingiz.", uz: "Тўғри! Тўхтаб, йўл бердингиз.", ru: "Правильно! Остановились и уступили дорогу." },
      },
    },
  },

  // ═══════════════════════════════════════════════════════
  // 6. PEDESTRIAN CROSSING — Zebra crossing scenario
  // ═══════════════════════════════════════════════════════
  {
    id: 'ped-1',
    category: 'pedestrian',
    difficulty: 'easy',
    question: {
      uzLatin: "Piyodalar o'tish joyiga yaqinlashyapsiz. Piyoda yo'lakka chiqib, yo'lni kesib o'tmoqchi. Nima qilasiz?",
      uz: "Пиёдалар ўтиш жойига яқинлашяпсиз. Пиёда йўлакка чиқиб, йўлни кесиб ўтмоқчи. Нима қиласиз?",
      ru: "Вы приближаетесь к пешеходному переходу. Пешеход вышел на переход. Что вы сделаете?",
    },
    options: [
      {
        id: 'ped1-a',
        text: { uzLatin: "Signal beraman va o'tib ketaman", uz: "Сигнал бераман ва ўтиб кетаман", ru: "Подам сигнал и проеду" },
        correct: false,
      },
      {
        id: 'ped1-b',
        text: { uzLatin: "To'xtab, piyoda o'tib ketishini kutaman", uz: "Тўхтаб, пиёда ўтиб кетишини кутаман", ru: "Остановлюсь и подожду, пока пешеход перейдёт" },
        correct: true,
      },
    ],
    explanation: {
      uzLatin: "YHQ 14.1-bandiga ko'ra, haydovchi piyodalar o'tish joyida yo'lni kesib o'tayotgan piyodalarga yo'l berishi shart.",
      uz: "ЙҲҚ 14.1-бандига кўра, ҳайдовчи пиёдалар ўтиш жойида йўлни кесиб ўтаётган пиёдаларга йўл бериши шарт.",
      ru: "Согласно п. 14.1 ПДД, водитель обязан уступить дорогу пешеходам, переходящим проезжую часть по пешеходному переходу.",
    },
    pddReference: 'YHQ 14.1',
    scene: {
      type: 'pedestrian_crossing',
      viewBox: '0 0 600 400',
      vehicles: [
        { id: 'player', type: 'car', isPlayer: true, position: { x: 130, y: 215 }, direction: 'east', rotation: -90, color: '#2196F3', label: { uzLatin: 'SIZ', uz: 'СИЗ', ru: 'ВЫ' } },
      ],
      pedestrians: [{ id: 'ped', position: { x: 350, y: 145 }, direction: 'left' }],
      signs: [{ type: 'pedestrian_crossing', position: { x: 310, y: 140 } }],
      roadElements: [{ type: 'zebra_crossing', position: { x: 330, y: 164 }, width: 50, height: 72 }],
    },
    outcomes: {
      'ped1-a': {
        type: 'crash',
        animations: [
          { targetId: 'player', path: [{ x: 130, y: 215 }, { x: 280, y: 215 }, { x: 360, y: 215 }], rotations: [-90, -90, -90], duration: 2000 },
          { targetId: 'ped', path: [{ x: 350, y: 145 }, { x: 350, y: 190 }, { x: 350, y: 215 }], duration: 2200 },
        ],
        crashPoint: { x: 355, y: 215 },
        message: { uzLatin: "Piyodani urib yubordingiz!", uz: "Пиёдани уриб юбордингиз!", ru: "Вы сбили пешехода!" },
      },
      'ped1-b': {
        type: 'safe',
        animations: [
          { targetId: 'player', path: [{ x: 130, y: 215 }, { x: 260, y: 215 }], rotations: [-90, -90], duration: 800 },
          { targetId: 'ped', path: [{ x: 350, y: 145 }, { x: 350, y: 200 }, { x: 350, y: 260 }], duration: 2800 },
        ],
        message: { uzLatin: "To'g'ri! Piyoda xavfsiz o'tib ketdi.", uz: "Тўғри! Пиёда хавфсиз ўтиб кетди.", ru: "Правильно! Пешеход безопасно перешёл." },
      },
    },
  },

  // ═══════════════════════════════════════════════════════
  // 7. PEDESTRIAN — School zone with child
  // ═══════════════════════════════════════════════════════
  {
    id: 'ped-2',
    category: 'pedestrian',
    difficulty: 'medium',
    question: {
      uzLatin: "Maktab hududida 20 km/soat tezlik cheklovi bor. Bola yo'l yoqasida turibdi. Nima qilasiz?",
      uz: "Мактаб ҳудудида 20 км/соат тезлик чеклови бор. Бола йўл ёқасида турибди. Нима қиласиз?",
      ru: "В школьной зоне ограничение скорости 20 км/ч. Ребёнок стоит у дороги. Что вы сделаете?",
    },
    options: [
      {
        id: 'ped2-a',
        text: { uzLatin: "Tezlikni kamaytirib 20 km/soatda o'taman", uz: "Тезликни камайтириб 20 км/соатда ўтаман", ru: "Снижу скорость до 20 км/ч и проеду" },
        correct: false,
      },
      {
        id: 'ped2-b',
        text: { uzLatin: "Tezlikni sekinlataman va bolaning harakatini kuzataman", uz: "Тезликни секинлатаман ва боланинг ҳаракатини кузатаман", ru: "Замедлюсь и буду наблюдать за действиями ребёнка" },
        correct: true,
      },
    ],
    explanation: {
      uzLatin: "YHQ 14.7-bandiga ko'ra, bolalar yaqinida maxsus ehtiyot bo'lish shart. Bola kutilmagan harakatlar qilishi mumkin.",
      uz: "ЙҲҚ 14.7-бандига кўра, болалар яқинида махсус эҳтиёт бўлиш шарт. Бола кутилмаган ҳаракатлар қилиши мумкин.",
      ru: "Согласно п. 14.7 ПДД, вблизи детей необходимо проявлять особую осторожность. Ребёнок может совершить неожиданные действия.",
    },
    pddReference: 'YHQ 14.7',
    scene: {
      type: 'pedestrian_crossing',
      viewBox: '0 0 600 400',
      vehicles: [
        { id: 'player', type: 'car', isPlayer: true, position: { x: 120, y: 215 }, direction: 'east', rotation: -90, color: '#2196F3', label: { uzLatin: 'SIZ', uz: 'СИЗ', ru: 'ВЫ' } },
      ],
      pedestrians: [{ id: 'child', position: { x: 380, y: 148 }, direction: 'left' }],
      signs: [{ type: 'speed_limit', position: { x: 200, y: 140 }, value: 20 }],
    },
    outcomes: {
      'ped2-a': {
        type: 'crash',
        animations: [
          { targetId: 'player', path: [{ x: 120, y: 215 }, { x: 300, y: 215 }, { x: 390, y: 215 }], rotations: [-90, -90, -90], duration: 2200 },
          { targetId: 'child', path: [{ x: 380, y: 148 }, { x: 380, y: 185 }, { x: 385, y: 215 }], duration: 2000 },
        ],
        crashPoint: { x: 387, y: 215 },
        message: { uzLatin: "Bola yo'lga chiqib qoldi!", uz: "Бола йўлга чиқиб қолди!", ru: "Ребёнок выбежал на дорогу!" },
      },
      'ped2-b': {
        type: 'safe',
        animations: [
          { targetId: 'player', path: [{ x: 120, y: 215 }, { x: 280, y: 215 }, { x: 330, y: 215 }], rotations: [-90, -90, -90], duration: 2000 },
          { targetId: 'child', path: [{ x: 380, y: 148 }, { x: 380, y: 165 }, { x: 380, y: 148 }], duration: 2800 },
        ],
        message: { uzLatin: "To'g'ri! Ehtiyotkorlik bilan o'tdingiz.", uz: "Тўғри! Эҳтиёткорлик билан ўтдингиз.", ru: "Правильно! Проехали с осторожностью." },
      },
    },
  },

  // ═══════════════════════════════════════════════════════
  // 8. OVERTAKING — Oncoming traffic visible
  // ═══════════════════════════════════════════════════════
  {
    id: 'ovt-1',
    category: 'overtake',
    difficulty: 'hard',
    question: {
      uzLatin: "Yuk mashinasi ortidan harakatlanayapsiz. Qarshi yo'lakda mashina ko'rinmoqda. Qo'shib o'tasizmi?",
      uz: "Юк машинаси ортидан ҳаракатланаяпсиз. Қарши йўлакда машина кўринмоқда. Қўшиб ўтасизми?",
      ru: "Вы едете за грузовиком. На встречной полосе виден автомобиль. Будете обгонять?",
    },
    options: [
      {
        id: 'ovt1-a',
        text: { uzLatin: "Ha, tezda qo'shib o'taman", uz: "Ҳа, тезда қўшиб ўтаман", ru: "Да, быстро обгоню" },
        correct: false,
      },
      {
        id: 'ovt1-b',
        text: { uzLatin: "Yo'q, qarshi transport vositasi o'tguncha kutaman", uz: "Йўқ, қарши транспорт воситаси ўтгунча кутаман", ru: "Нет, подожду, пока встречный автомобиль проедет" },
        correct: true,
      },
    ],
    explanation: {
      uzLatin: "YHQ 11.2-bandiga ko'ra, agar qarshi yo'lakda transport vositasi ko'rinsa, qo'shib o'tish taqiqlanadi.",
      uz: "ЙҲҚ 11.2-бандига кўра, агар қарши йўлакда транспорт воситаси кўринса, қўшиб ўтиш тақиқланади.",
      ru: "Согласно п. 11.2 ПДД, обгон запрещён, если на встречной полосе видно транспортное средство.",
    },
    pddReference: 'YHQ 11.2',
    scene: {
      type: 'two_lane_road',
      viewBox: '0 0 600 400',
      vehicles: [
        { id: 'player', type: 'car', isPlayer: true, position: { x: 150, y: 220 }, direction: 'east', rotation: -90, color: '#2196F3', label: { uzLatin: 'SIZ', uz: 'СИЗ', ru: 'ВЫ' } },
        { id: 'truck', type: 'truck', isPlayer: false, position: { x: 260, y: 220 }, direction: 'east', rotation: -90, color: '#795548' },
        { id: 'oncoming', type: 'car', isPlayer: false, position: { x: 520, y: 185 }, direction: 'west', rotation: 90, color: '#F44336' },
      ],
    },
    outcomes: {
      'ovt1-a': {
        type: 'crash',
        animations: [
          { targetId: 'player', path: [{ x: 150, y: 220 }, { x: 200, y: 190 }, { x: 320, y: 190 }], rotations: [-90, -80, -90], duration: 2000 },
          { targetId: 'truck', path: [{ x: 260, y: 220 }, { x: 330, y: 220 }, { x: 400, y: 220 }], rotations: [-90, -90, -90], duration: 2400 },
          { targetId: 'oncoming', path: [{ x: 520, y: 185 }, { x: 420, y: 185 }, { x: 320, y: 185 }], rotations: [90, 90, 90], duration: 2200 },
        ],
        crashPoint: { x: 320, y: 188 },
        message: { uzLatin: "Qarshi kelayotgan mashina bilan to'qnashish!", uz: "Қарши келаётган машина билан тўқнашиш!", ru: "Лобовое столкновение со встречным автомобилем!" },
      },
      'ovt1-b': {
        type: 'safe',
        animations: [
          { targetId: 'player', path: [{ x: 150, y: 220 }, { x: 190, y: 220 }], rotations: [-90, -90], duration: 600 },
          { targetId: 'truck', path: [{ x: 260, y: 220 }, { x: 360, y: 220 }, { x: 480, y: 220 }], rotations: [-90, -90, -90], duration: 2800 },
          { targetId: 'oncoming', path: [{ x: 520, y: 185 }, { x: 350, y: 185 }, { x: 80, y: 185 }], rotations: [90, 90, 90], duration: 2800 },
        ],
        message: { uzLatin: "To'g'ri! Xavfsiz kutib qoldingiz.", uz: "Тўғри! Хавфсиз кутиб қолдингиз.", ru: "Правильно! Безопасно подождали." },
      },
    },
  },

  // ═══════════════════════════════════════════════════════
  // 9. OVERTAKING — Solid line prohibition
  // ═══════════════════════════════════════════════════════
  {
    id: 'ovt-2',
    category: 'overtake',
    difficulty: 'easy',
    question: {
      uzLatin: "Siz sekin harakatlanayotgan yuk mashinasi ortida. Yo'l uzluksiz chiziq bilan belgilangan. Qo'shib o'tasizmi?",
      uz: "Сиз секин ҳаракатланаётган юк машинаси ортида. Йўл узлуксиз чизиқ билан белгиланган. Қўшиб ўтасизми?",
      ru: "Вы за медленным грузовиком. Дорога обозначена сплошной линией. Будете обгонять?",
    },
    options: [
      {
        id: 'ovt2-a',
        text: { uzLatin: "Ha, tezda qo'shib o'taman", uz: "Ҳа, тезда қўшиб ўтаман", ru: "Да, быстро обгоню" },
        correct: false,
      },
      {
        id: 'ovt2-b',
        text: { uzLatin: "Yo'q, uzluksiz chiziqni kesib o'tish taqiqlangan", uz: "Йўқ, узлуксиз чизиқни кесиб ўтиш тақиқланган", ru: "Нет, пересекать сплошную линию запрещено" },
        correct: true,
      },
    ],
    explanation: {
      uzLatin: "YHQ 1.1-chizig'ini kesib o'tish mutlaqo taqiqlangan. Uzluksiz chiziq qarama-qarshi oqimlarni ajratadi.",
      uz: "ЙҲҚ 1.1-чизиғини кесиб ўтиш мутлақо тақиқланган. Узлуксиз чизиқ қарама-қарши оқимларни ажратади.",
      ru: "Пересечение разметки 1.1 (сплошная линия) категорически запрещено. Она разделяет встречные потоки.",
    },
    pddReference: 'YHQ Razmetka 1.1',
    scene: {
      type: 'two_lane_road',
      viewBox: '0 0 600 400',
      vehicles: [
        { id: 'player', type: 'car', isPlayer: true, position: { x: 150, y: 220 }, direction: 'east', rotation: -90, color: '#2196F3', label: { uzLatin: 'SIZ', uz: 'СИЗ', ru: 'ВЫ' } },
        { id: 'truck', type: 'truck', isPlayer: false, position: { x: 280, y: 220 }, direction: 'east', rotation: -90, color: '#8D6E63' },
      ],
      signs: [{ type: 'no_overtaking', position: { x: 100, y: 140 } }],
    },
    outcomes: {
      'ovt2-a': {
        type: 'crash',
        animations: [
          { targetId: 'player', path: [{ x: 150, y: 220 }, { x: 200, y: 190 }, { x: 350, y: 190 }, { x: 400, y: 220 }], rotations: [-90, -80, -90, -100], duration: 2400 },
          { targetId: 'truck', path: [{ x: 280, y: 220 }, { x: 370, y: 220 }, { x: 460, y: 220 }], rotations: [-90, -90, -90], duration: 2400 },
        ],
        crashPoint: { x: 350, y: 195 },
        message: { uzLatin: "Uzluksiz chiziqni kesdingiz! Jarima va baxtsiz hodisa!", uz: "Узлуксиз чизиқни кесдингиз! Жарима ва бахтсиз ҳодиса!", ru: "Вы пересекли сплошную! Штраф и ДТП!" },
      },
      'ovt2-b': {
        type: 'safe',
        animations: [
          { targetId: 'player', path: [{ x: 150, y: 220 }, { x: 220, y: 220 }], rotations: [-90, -90], duration: 800 },
          { targetId: 'truck', path: [{ x: 280, y: 220 }, { x: 400, y: 220 }, { x: 550, y: 220 }], rotations: [-90, -90, -90], duration: 2800 },
        ],
        message: { uzLatin: "To'g'ri! Uzluksiz chiziqni kesmasdan kutdingiz.", uz: "Тўғри! Узлуксиз чизиқни кесмасдан кутдингиз.", ru: "Правильно! Не пересекли сплошную линию." },
      },
    },
  },

  // ═══════════════════════════════════════════════════════
  // 10. TRAFFIC LIGHT — Red light running
  // ═══════════════════════════════════════════════════════
  {
    id: 'tl-1',
    category: 'traffic_light',
    difficulty: 'easy',
    question: {
      uzLatin: "Chorrahaga yaqinlashyapsiz. Svetofor qizil signal ko'rsatmoqda. Nima qilasiz?",
      uz: "Чорраҳага яқинлашяпсиз. Светофор қизил сигнал кўрсатмоқда. Нима қиласиз?",
      ru: "Вы приближаетесь к перекрёстку. Светофор показывает красный сигнал. Что вы сделаете?",
    },
    options: [
      {
        id: 'tl1-a',
        text: { uzLatin: "To'xtab, yashil signalni kutaman", uz: "Тўхтаб, яшил сигнални кутаман", ru: "Остановлюсь и подожду зелёный сигнал" },
        correct: true,
      },
      {
        id: 'tl1-b',
        text: { uzLatin: "Chorrahada mashina yo'q, o'tib ketaman", uz: "Чорраҳада машина йўқ, ўтиб кетаман", ru: "На перекрёстке нет машин, проеду" },
        correct: false,
      },
    ],
    explanation: {
      uzLatin: "YHQ 6.2-bandiga ko'ra, qizil signal taqiqlovchi signal bo'lib, har qanday sharoitda to'xtash shart.",
      uz: "ЙҲҚ 6.2-бандига кўра, қизил сигнал тақиқловчи сигнал бўлиб, ҳар қандай шароитда тўхташ шарт.",
      ru: "Согласно п. 6.2 ПДД, красный сигнал светофора является запрещающим, остановка обязательна в любых условиях.",
    },
    pddReference: 'YHQ 6.2',
    scene: {
      type: 'traffic_light_intersection',
      viewBox: '0 0 600 400',
      vehicles: [
        { id: 'player', type: 'car', isPlayer: true, position: { x: 130, y: 215 }, direction: 'east', rotation: -90, color: '#2196F3', label: { uzLatin: 'SIZ', uz: 'СИЗ', ru: 'ВЫ' } },
        { id: 'cross-car', type: 'car', isPlayer: false, position: { x: 300, y: 60 }, direction: 'south', rotation: 0, color: '#4CAF50' },
      ],
      trafficLights: [
        { id: 'tl-player', position: { x: 218, y: 165 }, state: 'red', forDirection: 'east' },
        { id: 'tl-cross', position: { x: 310, y: 158 }, state: 'green', forDirection: 'south' },
      ],
    },
    outcomes: {
      'tl1-a': {
        type: 'safe',
        animations: [
          { targetId: 'player', path: [{ x: 130, y: 215 }, { x: 190, y: 215 }], rotations: [-90, -90], duration: 600 },
          { targetId: 'cross-car', path: [{ x: 300, y: 60 }, { x: 300, y: 200 }, { x: 300, y: 360 }], rotations: [0, 0, 0], duration: 2800 },
        ],
        message: { uzLatin: "To'g'ri! Qizil signalda to'xtadingiz.", uz: "Тўғри! Қизил сигналда тўхтадингиз.", ru: "Правильно! Остановились на красный сигнал." },
      },
      'tl1-b': {
        type: 'crash',
        animations: [
          { targetId: 'player', path: [{ x: 130, y: 215 }, { x: 250, y: 215 }, { x: 310, y: 215 }], rotations: [-90, -90, -90], duration: 1800 },
          { targetId: 'cross-car', path: [{ x: 300, y: 60 }, { x: 300, y: 150 }, { x: 300, y: 215 }], rotations: [0, 0, 0], duration: 2000 },
        ],
        crashPoint: { x: 305, y: 215 },
        message: { uzLatin: "Qizil signalda o'tdingiz — to'qnashish!", uz: "Қизил сигналда ўтдингиз — тўқнашиш!", ru: "Проехали на красный — столкновение!" },
      },
    },
  },

  // ═══════════════════════════════════════════════════════
  // 11. ROUNDABOUT — Yield to traffic already in circle
  // ═══════════════════════════════════════════════════════
  {
    id: 'rnd-1',
    category: 'roundabout',
    difficulty: 'medium',
    question: {
      uzLatin: "Aylanma harakatga kirishmoqchisiz. Aylanma ichida avtomobil harakatlanmoqda. Nima qilasiz?",
      uz: "Айланма ҳаракатга киришмоқчисиз. Айланма ичида автомобил ҳаракатланмоқда. Нима қиласиз?",
      ru: "Вы хотите въехать на круговое движение. В круге движется автомобиль. Что вы сделаете?",
    },
    options: [
      { id: 'rnd1-a', text: { uzLatin: "Tezda aylanmaga kiraman", uz: "Тезда айланмага кираман", ru: "Быстро въеду в круг" }, correct: false },
      { id: 'rnd1-b', text: { uzLatin: "Aylanmadagi avtomobilga yo'l beraman", uz: "Айланмадаги автомобилга йўл бераман", ru: "Уступлю дорогу автомобилю в круге" }, correct: true },
    ],
    explanation: {
      uzLatin: "YHQ 13.11.1-bandiga ko'ra, aylanma harakatga kirishda aylanma ichidagi transport vositalariga yo'l berish shart.",
      uz: "ЙҲҚ 13.11.1-бандига кўра, айланма ҳаракатга киришда айланма ичидаги транспорт воситаларига йўл бериш шарт.",
      ru: "Согласно п. 13.11.1 ПДД, при въезде на круговое движение необходимо уступить дорогу ТС, движущимся в круге.",
    },
    pddReference: 'YHQ 13.11.1',
    scene: {
      type: 'roundabout',
      viewBox: '0 0 600 400',
      vehicles: [
        { id: 'player', type: 'car', isPlayer: true, position: { x: 100, y: 200 }, direction: 'east', rotation: -90, color: '#2196F3', label: { uzLatin: 'SIZ', uz: 'СИЗ', ru: 'ВЫ' } },
        { id: 'car-circle', type: 'car', isPlayer: false, position: { x: 300, y: 110 }, direction: 'east', rotation: -90, color: '#F44336' },
      ],
      signs: [{ type: 'yield', position: { x: 180, y: 170 } }],
    },
    outcomes: {
      'rnd1-a': {
        type: 'crash',
        animations: [
          { targetId: 'player', path: [{ x: 100, y: 200 }, { x: 200, y: 200 }, { x: 260, y: 170 }], rotations: [-90, -90, -120], duration: 1800 },
          { targetId: 'car-circle', path: [{ x: 300, y: 110 }, { x: 250, y: 130 }, { x: 230, y: 170 }], rotations: [-90, -130, -160], duration: 2000 },
        ],
        crashPoint: { x: 245, y: 170 },
        message: { uzLatin: "Aylanmadagi avtomobil bilan to'qnashish!", uz: "Айланмадаги автомобил билан тўқнашиш!", ru: "Столкновение с автомобилем в круге!" },
      },
      'rnd1-b': {
        type: 'safe',
        animations: [
          { targetId: 'player', path: [{ x: 100, y: 200 }, { x: 170, y: 200 }], rotations: [-90, -90], duration: 600 },
          { targetId: 'car-circle', path: [{ x: 300, y: 110 }, { x: 230, y: 150 }, { x: 210, y: 200 }, { x: 230, y: 250 }, { x: 300, y: 290 }], rotations: [-90, -150, 180, 150, 90], duration: 2800 },
        ],
        message: { uzLatin: "To'g'ri! Aylanmadagi avtomobil xavfsiz o'tdi.", uz: "Тўғри! Айланмадаги автомобил хавфсиз ўтди.", ru: "Правильно! Автомобиль в круге безопасно проехал." },
      },
    },
  },

  // ═══════════════════════════════════════════════════════
  // 12. ROUNDABOUT — Correct lane for exit
  // ═══════════════════════════════════════════════════════
  {
    id: 'rnd-2',
    category: 'roundabout',
    difficulty: 'hard',
    question: {
      uzLatin: "Aylanma harakatda birinchi chiqishdan chiqmoqchisiz (o'ngga). Qaysi qatorda harakatlanishingiz kerak?",
      uz: "Айланма ҳаракатда биринчи чиқишдан чиқмоқчисиз (ўнгга). Қайси қаторда ҳаракатланишингиз керак?",
      ru: "На круговом движении хотите свернуть в первый выезд (направо). В какой полосе нужно двигаться?",
    },
    options: [
      { id: 'rnd2-a', text: { uzLatin: "O'ng (tashqi) qatorda", uz: "Ўнг (ташқи) қаторда", ru: "В правой (внешней) полосе" }, correct: true },
      { id: 'rnd2-b', text: { uzLatin: "Chap (ichki) qatorda", uz: "Чап (ички) қаторда", ru: "В левой (внутренней) полосе" }, correct: false },
    ],
    explanation: {
      uzLatin: "YHQ 8.6-bandiga ko'ra, birinchi chiqishdan chiqish uchun tashqi (o'ng) qatorda harakatlanish kerak.",
      uz: "ЙҲҚ 8.6-бандига кўра, биринчи чиқишдан чиқиш учун ташқи (ўнг) қаторда ҳаракатланиш керак.",
      ru: "Согласно п. 8.6, для первого выезда нужно двигаться по внешней (правой) полосе кругового движения.",
    },
    pddReference: 'YHQ 8.6',
    scene: {
      type: 'roundabout',
      viewBox: '0 0 600 400',
      vehicles: [
        { id: 'player', type: 'car', isPlayer: true, position: { x: 300, y: 350 }, direction: 'north', rotation: 180, color: '#2196F3', label: { uzLatin: 'SIZ', uz: 'СИЗ', ru: 'ВЫ' } },
      ],
    },
    outcomes: {
      'rnd2-a': {
        type: 'safe',
        animations: [
          { targetId: 'player', path: [{ x: 300, y: 350 }, { x: 320, y: 280 }, { x: 370, y: 220 }, { x: 390, y: 200 }, { x: 480, y: 200 }], rotations: [180, -160, -120, -90, -90], duration: 2800 },
        ],
        message: { uzLatin: "To'g'ri! Tashqi qatorda xavfsiz chiqdingiz.", uz: "Тўғри! Ташқи қаторда хавфсиз чиқдингиз.", ru: "Правильно! Безопасно выехали по внешней полосе." },
      },
      'rnd2-b': {
        type: 'crash',
        animations: [
          { targetId: 'player', path: [{ x: 300, y: 350 }, { x: 280, y: 280 }, { x: 260, y: 200 }, { x: 290, y: 160 }, { x: 370, y: 200 }], rotations: [180, -170, 180, -130, -90], duration: 2400 },
        ],
        crashPoint: { x: 370, y: 200 },
        message: { uzLatin: "Xato! Ichki qatordan chiqish xavfli!", uz: "Хато! Ички қатордан чиқиш хавфли!", ru: "Ошибка! Выезд из внутренней полосы опасен!" },
      },
    },
  },

  // ═══════════════════════════════════════════════════════
  // 13. SPEED ZONE — Residential area 20 km/h
  // ═══════════════════════════════════════════════════════
  {
    id: 'spd-1',
    category: 'speed_zone',
    difficulty: 'easy',
    question: {
      uzLatin: "Turar-joy hududida 20 km/soat tezlik cheklovi. Siz 45 km/soatda harakatlanayapsiz. To'g'rimi?",
      uz: "Турар-жой ҳудудида 20 км/соат тезлик чеклови. Сиз 45 км/соатда ҳаракатланаяпсиз. Тўғрими?",
      ru: "В жилой зоне ограничение 20 км/ч. Вы едете 45 км/ч. Правильно ли это?",
    },
    options: [
      { id: 'spd1-a', text: { uzLatin: "Ha, turar-joy hududida 50 gacha ruxsat", uz: "Ҳа, турар-жой ҳудудида 50 гача рухсат", ru: "Да, в жилой зоне разрешено до 50 км/ч" }, correct: false },
      { id: 'spd1-b', text: { uzLatin: "Yo'q, 20 km/soatdan oshmasligi kerak", uz: "Йўқ, 20 км/соатдан ошмаслиги керак", ru: "Нет, нельзя превышать 20 км/ч" }, correct: true },
    ],
    explanation: {
      uzLatin: "YHQ 10.2-bandiga ko'ra, turar-joy hududida tezlik 20 km/soatdan oshmasligi kerak.",
      uz: "ЙҲҚ 10.2-бандига кўра, турар-жой ҳудудида тезлик 20 км/соатдан ошмаслиги керак.",
      ru: "Согласно п. 10.2 ПДД, скорость в жилой зоне не должна превышать 20 км/ч.",
    },
    pddReference: 'YHQ 10.2',
    scene: {
      type: 'two_lane_road',
      viewBox: '0 0 600 400',
      vehicles: [
        { id: 'player', type: 'car', isPlayer: true, position: { x: 100, y: 215 }, direction: 'east', rotation: -90, color: '#2196F3', label: { uzLatin: 'SIZ', uz: 'СИЗ', ru: 'ВЫ' } },
      ],
      pedestrians: [{ id: 'ped', position: { x: 420, y: 148 }, direction: 'left' }],
      signs: [{ type: 'speed_limit', position: { x: 160, y: 140 }, value: 20 }],
    },
    outcomes: {
      'spd1-a': {
        type: 'crash',
        animations: [
          { targetId: 'player', path: [{ x: 100, y: 215 }, { x: 300, y: 215 }, { x: 430, y: 215 }], rotations: [-90, -90, -90], duration: 1500 },
          { targetId: 'ped', path: [{ x: 420, y: 148 }, { x: 420, y: 190 }, { x: 425, y: 215 }], duration: 2000 },
        ],
        crashPoint: { x: 427, y: 215 },
        message: { uzLatin: "Tezlik oshirib, piyodani urib yubordingiz!", uz: "Тезлик оширибб пиёдани уриб юбордингиз!", ru: "Превысили скорость и сбили пешехода!" },
      },
      'spd1-b': {
        type: 'safe',
        animations: [
          { targetId: 'player', path: [{ x: 100, y: 215 }, { x: 280, y: 215 }, { x: 350, y: 215 }], rotations: [-90, -90, -90], duration: 2800 },
          { targetId: 'ped', path: [{ x: 420, y: 148 }, { x: 420, y: 200 }, { x: 420, y: 260 }], duration: 2800 },
        ],
        message: { uzLatin: "To'g'ri! Tezlikni cheklad va piyoda xavfsiz o'tdi.", uz: "Тўғри! Тезликни чеклад ва пиёда хавфсиз ўтди.", ru: "Правильно! Соблюдали скорость, пешеход безопасно перешёл." },
      },
    },
  },

  // ═══════════════════════════════════════════════════════
  // 14. TRAFFIC LIGHT — Yellow light dilemma
  // ═══════════════════════════════════════════════════════
  {
    id: 'tl-2',
    category: 'traffic_light',
    difficulty: 'medium',
    question: {
      uzLatin: "Svetofor sariq signal ko'rsatmoqda. Siz chorrahaga yaqinsiz va xavfsiz to'xta olasiz. Nima qilasiz?",
      uz: "Светофор сариқ сигнал кўрсатмоқда. Сиз чорраҳага яқинсиз ва хавфсиз тўхта оласиз. Нима қиласиз?",
      ru: "Светофор показывает жёлтый. Вы близко к перекрёстку и можете безопасно остановиться. Что сделаете?",
    },
    options: [
      { id: 'tl2-a', text: { uzLatin: "To'xtaman, chunki xavfsiz to'xta olaman", uz: "Тўхтаман, чунки хавфсиз тўхта оламан", ru: "Остановлюсь, так как могу безопасно" }, correct: true },
      { id: 'tl2-b', text: { uzLatin: "Tezlikni oshirib o'tib ketaman", uz: "Тезликни оширибб ўтиб кетаман", ru: "Ускорюсь и проеду" }, correct: false },
    ],
    explanation: {
      uzLatin: "YHQ 6.2-bandiga ko'ra, sariq signal taqiqlovchi hisoblanadi. Agar xavfsiz to'xta olsangiz — to'xtashingiz shart.",
      uz: "ЙҲҚ 6.2-бандига кўра, сариқ сигнал тақиқловчи ҳисобланади. Агар хавфсиз тўхта олсангиз — тўхташингиз шарт.",
      ru: "Согласно п. 6.2, жёлтый сигнал является запрещающим. Если можете безопасно остановиться — обязаны.",
    },
    pddReference: 'YHQ 6.2',
    scene: {
      type: 'traffic_light_intersection',
      viewBox: '0 0 600 400',
      vehicles: [
        { id: 'player', type: 'car', isPlayer: true, position: { x: 150, y: 215 }, direction: 'east', rotation: -90, color: '#2196F3', label: { uzLatin: 'SIZ', uz: 'СИЗ', ru: 'ВЫ' } },
        { id: 'cross-car', type: 'car', isPlayer: false, position: { x: 300, y: 60 }, direction: 'south', rotation: 0, color: '#FF9800' },
      ],
      trafficLights: [
        { id: 'tl-p', position: { x: 218, y: 165 }, state: 'yellow', forDirection: 'east' },
      ],
    },
    outcomes: {
      'tl2-a': {
        type: 'safe',
        animations: [
          { targetId: 'player', path: [{ x: 150, y: 215 }, { x: 200, y: 215 }], rotations: [-90, -90], duration: 700 },
          { targetId: 'cross-car', path: [{ x: 300, y: 60 }, { x: 300, y: 120 }], rotations: [0, 0], duration: 800 },
        ],
        message: { uzLatin: "To'g'ri! Sariq signalda xavfsiz to'xtadingiz.", uz: "Тўғри! Сариқ сигналда хавфсиз тўхтадингиз.", ru: "Правильно! Остановились на жёлтый." },
      },
      'tl2-b': {
        type: 'crash',
        animations: [
          { targetId: 'player', path: [{ x: 150, y: 215 }, { x: 260, y: 215 }, { x: 310, y: 215 }], rotations: [-90, -90, -90], duration: 1500 },
          { targetId: 'cross-car', path: [{ x: 300, y: 60 }, { x: 300, y: 150 }, { x: 300, y: 215 }], rotations: [0, 0, 0], duration: 1800 },
        ],
        crashPoint: { x: 305, y: 215 },
        message: { uzLatin: "Sariq signalni e'tiborsiz qoldirib to'qnashdingiz!", uz: "Сариқ сигнални эътиборсиз қолдириб тўқнашдингиз!", ru: "Проигнорировали жёлтый — столкновение!" },
      },
    },
  },

  // ═══════════════════════════════════════════════════════
  // 15. INTERSECTION — Left turn yield to oncoming
  // ═══════════════════════════════════════════════════════
  {
    id: 'int-4',
    category: 'intersection',
    difficulty: 'medium',
    question: {
      uzLatin: "Chorrahada chapga burilmoqchisiz. Qarshidan avtomobil to'g'riga kelmoqda. Kim birinchi o'tadi?",
      uz: "Чорраҳада чапга бурилмоқчисиз. Қаршидан автомобил тўғрига келмоқда. Ким биринчи ўтади?",
      ru: "На перекрёстке хотите повернуть налево. Встречный автомобиль едет прямо. Кто проедет первым?",
    },
    options: [
      { id: 'int4-a', text: { uzLatin: "Men birinchi burilaman", uz: "Мен биринчи бурилиман", ru: "Я поверну первым" }, correct: false },
      { id: 'int4-b', text: { uzLatin: "Qarshi avtomobilga yo'l beraman", uz: "Қарши автомобилга йўл бераман", ru: "Уступлю встречному автомобилю" }, correct: true },
    ],
    explanation: {
      uzLatin: "YHQ 13.4-bandiga ko'ra, chapga burilishda qarshi yo'nalishdan kelayotgan transport vositalariga yo'l berish shart.",
      uz: "ЙҲҚ 13.4-бандига кўра, чапга бурилишда қарши йўналишдан келаётган транспорт воситаларига йўл бериш шарт.",
      ru: "Согласно п. 13.4 ПДД, при повороте налево необходимо уступить дорогу встречным ТС.",
    },
    pddReference: 'YHQ 13.4',
    scene: {
      type: 'intersection_4way',
      viewBox: '0 0 600 400',
      vehicles: [
        { id: 'player', type: 'car', isPlayer: true, position: { x: 130, y: 215 }, direction: 'east', rotation: -90, color: '#2196F3', label: { uzLatin: 'SIZ', uz: 'СИЗ', ru: 'ВЫ' } },
        { id: 'oncoming', type: 'car', isPlayer: false, position: { x: 470, y: 185 }, direction: 'west', rotation: 90, color: '#F44336' },
      ],
    },
    outcomes: {
      'int4-a': {
        type: 'crash',
        animations: [
          { targetId: 'player', path: [{ x: 130, y: 215 }, { x: 270, y: 215 }, { x: 300, y: 195 }, { x: 300, y: 160 }], rotations: [-90, -90, -135, -180], duration: 2000 },
          { targetId: 'oncoming', path: [{ x: 470, y: 185 }, { x: 370, y: 185 }, { x: 300, y: 185 }], rotations: [90, 90, 90], duration: 2000 },
        ],
        crashPoint: { x: 300, y: 185 },
        message: { uzLatin: "Qarshi mashina bilan to'qnashish!", uz: "Қарши машина билан тўқнашиш!", ru: "Столкновение со встречным автомобилем!" },
      },
      'int4-b': {
        type: 'safe',
        animations: [
          { targetId: 'player', path: [{ x: 130, y: 215 }, { x: 230, y: 215 }], rotations: [-90, -90], duration: 700 },
          { targetId: 'oncoming', path: [{ x: 470, y: 185 }, { x: 300, y: 185 }, { x: 130, y: 185 }], rotations: [90, 90, 90], duration: 2800 },
        ],
        message: { uzLatin: "To'g'ri! Qarshi avtomobilga yo'l berdingiz.", uz: "Тўғри! Қарши автомобилга йўл бердингиз.", ru: "Правильно! Уступили встречному автомобилю." },
      },
    },
  },

  // ═══════════════════════════════════════════════════════
  // 16. EMERGENCY VEHICLE — Yielding to ambulance
  // ═══════════════════════════════════════════════════════
  {
    id: 'emg-1',
    category: 'intersection',
    difficulty: 'medium',
    question: {
      uzLatin: "Orqangizdan tez yordam mashinasi maxsus signal bilan yaqinlashmoqda. Nima qilasiz?",
      uz: "Орқангиздан тез ёрдам машинаси махсус сигнал билан яқинлашмоқда. Нима қиласиз?",
      ru: "Сзади приближается скорая помощь с включённым спецсигналом. Что вы сделаете?",
    },
    options: [
      { id: 'emg1-a', text: { uzLatin: "O'ng tomonga chekinib, yo'l beraman", uz: "Ўнг томонга чекиниб, йўл бераман", ru: "Приму вправо и уступлю дорогу" }, correct: true },
      { id: 'emg1-b', text: { uzLatin: "Tezlikni oshirib, undan qochaman", uz: "Тезликни оширибб ундан қочаман", ru: "Ускорюсь и уеду от неё" }, correct: false },
    ],
    explanation: {
      uzLatin: "YHQ 3.1-bandiga ko'ra, maxsus signal ishlatayotgan tez yordam mashinasiga darhol yo'l berish shart.",
      uz: "ЙҲҚ 3.1-бандига кўра, махсус сигнал ишлатаётган тез ёрдам машинасига дарҳол йўл бериш шарт.",
      ru: "Согласно п. 3.1 ПДД, при приближении ТС с включённым спецсигналом необходимо немедленно уступить дорогу.",
    },
    pddReference: 'YHQ 3.1',
    scene: {
      type: 'two_lane_road',
      viewBox: '0 0 600 400',
      vehicles: [
        { id: 'player', type: 'car', isPlayer: true, position: { x: 300, y: 215 }, direction: 'east', rotation: -90, color: '#2196F3', label: { uzLatin: 'SIZ', uz: 'СИЗ', ru: 'ВЫ' } },
        { id: 'ambulance', type: 'car', isPlayer: false, position: { x: 80, y: 215 }, direction: 'east', rotation: -90, color: '#FF1744' },
      ],
    },
    outcomes: {
      'emg1-a': {
        type: 'safe',
        animations: [
          { targetId: 'player', path: [{ x: 300, y: 215 }, { x: 350, y: 225 }, { x: 400, y: 230 }], rotations: [-90, -85, -90], duration: 1200 },
          { targetId: 'ambulance', path: [{ x: 80, y: 215 }, { x: 300, y: 215 }, { x: 550, y: 215 }], rotations: [-90, -90, -90], duration: 2800 },
        ],
        message: { uzLatin: "To'g'ri! Tez yordamga yo'l berdingiz.", uz: "Тўғри! Тез ёрдамга йўл бердингиз.", ru: "Правильно! Уступили дорогу скорой помощи." },
      },
      'emg1-b': {
        type: 'crash',
        animations: [
          { targetId: 'player', path: [{ x: 300, y: 215 }, { x: 400, y: 215 }, { x: 450, y: 215 }], rotations: [-90, -90, -90], duration: 1800 },
          { targetId: 'ambulance', path: [{ x: 80, y: 215 }, { x: 300, y: 215 }, { x: 450, y: 215 }], rotations: [-90, -90, -90], duration: 2000 },
        ],
        crashPoint: { x: 450, y: 215 },
        message: { uzLatin: "Tez yordam mashinasiga to'sqinlik qildingiz!", uz: "Тез ёрдам машинасига тўсқинлик қилдингиз!", ru: "Вы заблокировали скорую помощь!" },
      },
    },
  },

  // ═══════════════════════════════════════════════════════
  // 17. OVERTAKING — Near intersection prohibited
  // ═══════════════════════════════════════════════════════
  {
    id: 'ovt-3',
    category: 'overtake',
    difficulty: 'hard',
    question: {
      uzLatin: "Chorrahaga 50 metr qoldi. Oldingizda sekin harakatlanayotgan mashina bor. Qo'shib o'tasizmi?",
      uz: "Чорраҳага 50 метр қолди. Олдингизда секин ҳаракатланаётган машина бор. Қўшиб ўтасизми?",
      ru: "До перекрёстка 50 метров. Впереди медленный автомобиль. Будете обгонять?",
    },
    options: [
      { id: 'ovt3-a', text: { uzLatin: "Ha, chorrahagacha ulguraman", uz: "Ҳа, чорраҳагача улгураман", ru: "Да, успею до перекрёстка" }, correct: false },
      { id: 'ovt3-b', text: { uzLatin: "Yo'q, chorrahada qo'shib o'tish taqiqlangan", uz: "Йўқ, чорраҳада қўшиб ўтиш тақиқланган", ru: "Нет, обгон у перекрёстка запрещён" }, correct: true },
    ],
    explanation: {
      uzLatin: "YHQ 11.4-bandiga ko'ra, tartibga solinmagan chorrahada va unga yaqin joyda qo'shib o'tish taqiqlanadi.",
      uz: "ЙҲҚ 11.4-бандига кўра, тартибга солинмаган чорраҳада ва унга яқин жойда қўшиб ўтиш тақиқланади.",
      ru: "Согласно п. 11.4 ПДД, обгон запрещён на нерегулируемых перекрёстках и вблизи них.",
    },
    pddReference: 'YHQ 11.4',
    scene: {
      type: 'two_lane_road',
      viewBox: '0 0 600 400',
      vehicles: [
        { id: 'player', type: 'car', isPlayer: true, position: { x: 120, y: 220 }, direction: 'east', rotation: -90, color: '#2196F3', label: { uzLatin: 'SIZ', uz: 'СИЗ', ru: 'ВЫ' } },
        { id: 'slow', type: 'car', isPlayer: false, position: { x: 250, y: 220 }, direction: 'east', rotation: -90, color: '#9E9E9E' },
        { id: 'side-car', type: 'car', isPlayer: false, position: { x: 500, y: 135 }, direction: 'south', rotation: 0, color: '#FF9800' },
      ],
    },
    outcomes: {
      'ovt3-a': {
        type: 'crash',
        animations: [
          { targetId: 'player', path: [{ x: 120, y: 220 }, { x: 200, y: 190 }, { x: 350, y: 190 }, { x: 420, y: 190 }], rotations: [-90, -80, -90, -90], duration: 2200 },
          { targetId: 'slow', path: [{ x: 250, y: 220 }, { x: 350, y: 220 }, { x: 440, y: 220 }], rotations: [-90, -90, -90], duration: 2400 },
          { targetId: 'side-car', path: [{ x: 500, y: 135 }, { x: 500, y: 175 }, { x: 500, y: 200 }], rotations: [0, 0, 0], duration: 2000 },
        ],
        crashPoint: { x: 430, y: 195 },
        message: { uzLatin: "Chorrahada to'qnashish!", uz: "Чорраҳада тўқнашиш!", ru: "Столкновение у перекрёстка!" },
      },
      'ovt3-b': {
        type: 'safe',
        animations: [
          { targetId: 'player', path: [{ x: 120, y: 220 }, { x: 200, y: 220 }], rotations: [-90, -90], duration: 600 },
          { targetId: 'slow', path: [{ x: 250, y: 220 }, { x: 400, y: 220 }, { x: 540, y: 220 }], rotations: [-90, -90, -90], duration: 2800 },
          { targetId: 'side-car', path: [{ x: 500, y: 135 }, { x: 500, y: 200 }, { x: 500, y: 300 }], rotations: [0, 0, 0], duration: 2800 },
        ],
        message: { uzLatin: "To'g'ri! Xavfsiz kutib qoldingiz.", uz: "Тўғри! Хавфсиз кутиб қолдингиз.", ru: "Правильно! Безопасно подождали." },
      },
    },
  },

  // ═══════════════════════════════════════════════════════
  // 18. PEDESTRIAN — Blind pedestrian with cane
  // ═══════════════════════════════════════════════════════
  {
    id: 'ped-3',
    category: 'pedestrian',
    difficulty: 'medium',
    question: {
      uzLatin: "Yo'lda oq hassa ko'targan ko'zi ojiz piyoda turibdi. U piyodalar o'tish joyidan tashqarida. Nima qilasiz?",
      uz: "Йўлда оқ ҳасса кўтарган кўзи ожиз пиёда турибди. У пиёдалар ўтиш жойидан ташқарида. Нима қиласиз?",
      ru: "На дороге стоит слепой пешеход с белой тростью. Он вне пешеходного перехода. Что сделаете?",
    },
    options: [
      { id: 'ped3-a', text: { uzLatin: "Signal beraman va o'tib ketaman", uz: "Сигнал бераман ва ўтиб кетаман", ru: "Подам сигнал и проеду" }, correct: false },
      { id: 'ped3-b', text: { uzLatin: "To'xtab, yo'l beraman", uz: "Тўхтаб, йўл бераман", ru: "Остановлюсь и уступлю дорогу" }, correct: true },
    ],
    explanation: {
      uzLatin: "YHQ 14.5-bandiga ko'ra, oq hassa ko'targan ko'zi ojiz piyodalarga har qanday joyda yo'l berish shart.",
      uz: "ЙҲҚ 14.5-бандига кўра, оқ ҳасса кўтарган кўзи ожиз пиёдаларга ҳар қандай жойда йўл бериш шарт.",
      ru: "Согласно п. 14.5 ПДД, слепым пешеходам с белой тростью необходимо уступать дорогу в любом месте.",
    },
    pddReference: 'YHQ 14.5',
    scene: {
      type: 'two_lane_road',
      viewBox: '0 0 600 400',
      vehicles: [
        { id: 'player', type: 'car', isPlayer: true, position: { x: 120, y: 215 }, direction: 'east', rotation: -90, color: '#2196F3', label: { uzLatin: 'SIZ', uz: 'СИЗ', ru: 'ВЫ' } },
      ],
      pedestrians: [{ id: 'blind', position: { x: 380, y: 148 }, direction: 'left' }],
    },
    outcomes: {
      'ped3-a': {
        type: 'crash',
        animations: [
          { targetId: 'player', path: [{ x: 120, y: 215 }, { x: 300, y: 215 }, { x: 390, y: 215 }], rotations: [-90, -90, -90], duration: 1800 },
          { targetId: 'blind', path: [{ x: 380, y: 148 }, { x: 380, y: 190 }, { x: 385, y: 215 }], duration: 2200 },
        ],
        crashPoint: { x: 387, y: 215 },
        message: { uzLatin: "Ko'zi ojiz piyodani urib yubordingiz!", uz: "Кўзи ожиз пиёдани уриб юбордингиз!", ru: "Вы сбили слепого пешехода!" },
      },
      'ped3-b': {
        type: 'safe',
        animations: [
          { targetId: 'player', path: [{ x: 120, y: 215 }, { x: 280, y: 215 }, { x: 320, y: 215 }], rotations: [-90, -90, -90], duration: 1500 },
          { targetId: 'blind', path: [{ x: 380, y: 148 }, { x: 380, y: 200 }, { x: 380, y: 260 }], duration: 2800 },
        ],
        message: { uzLatin: "To'g'ri! Ko'zi ojiz piyodaga yo'l berdingiz.", uz: "Тўғри! Кўзи ожиз пиёдага йўл бердингиз.", ru: "Правильно! Уступили дорогу слепому пешеходу." },
      },
    },
  },

  // ═══════════════════════════════════════════════════════
  // 19. INTERSECTION — Tram priority
  // ═══════════════════════════════════════════════════════
  {
    id: 'int-5',
    category: 'intersection',
    difficulty: 'hard',
    question: {
      uzLatin: "Tartibga solinmagan teng ahamiyatli chorrahada tramvay chapdan kelmoqda. Kim birinchi o'tadi?",
      uz: "Тартибга солинмаган тенг аҳамиятли чорраҳада трамвай чапдан келмоқда. Ким биринчи ўтади?",
      ru: "На нерегулируемом равнозначном перекрёстке трамвай приближается слева. Кто проедет первым?",
    },
    options: [
      { id: 'int5-a', text: { uzLatin: "Tramvay birinchi o'tadi", uz: "Трамвай биринчи ўтади", ru: "Трамвай проедет первым" }, correct: true },
      { id: 'int5-b', text: { uzLatin: "Men birinchi o'taman — u chapdan", uz: "Мен биринчи ўтаман — у чапдан", ru: "Я первый — он слева" }, correct: false },
    ],
    explanation: {
      uzLatin: "YHQ 13.11-bandiga ko'ra, tramvay teng sharoitda har doim ustunlik huquqiga ega, qaysi tomondan kelishidan qat'i nazar.",
      uz: "ЙҲҚ 13.11-бандига кўра, трамвай тенг шароитда ҳар доим устунлик ҳуқуқига эга, қайси томондан келишидан қатъи назар.",
      ru: "Согласно п. 13.11, трамвай при равных условиях всегда имеет преимущество, независимо от направления.",
    },
    pddReference: 'YHQ 13.11',
    scene: {
      type: 'intersection_4way',
      viewBox: '0 0 600 400',
      vehicles: [
        { id: 'player', type: 'car', isPlayer: true, position: { x: 130, y: 215 }, direction: 'east', rotation: -90, color: '#2196F3', label: { uzLatin: 'SIZ', uz: 'СИЗ', ru: 'ВЫ' } },
        { id: 'tram', type: 'bus', isPlayer: false, position: { x: 300, y: 350 }, direction: 'north', rotation: 180, color: '#FF5722' },
      ],
    },
    outcomes: {
      'int5-a': {
        type: 'safe',
        animations: [
          { targetId: 'player', path: [{ x: 130, y: 215 }, { x: 195, y: 215 }], rotations: [-90, -90], duration: 600 },
          { targetId: 'tram', path: [{ x: 300, y: 350 }, { x: 300, y: 200 }, { x: 300, y: 50 }], rotations: [180, 180, 180], duration: 2800 },
        ],
        message: { uzLatin: "To'g'ri! Tramvayga yo'l berdingiz.", uz: "Тўғри! Трамвайга йўл бердингиз.", ru: "Правильно! Уступили дорогу трамваю." },
      },
      'int5-b': {
        type: 'crash',
        animations: [
          { targetId: 'player', path: [{ x: 130, y: 215 }, { x: 250, y: 215 }, { x: 310, y: 215 }], rotations: [-90, -90, -90], duration: 1800 },
          { targetId: 'tram', path: [{ x: 300, y: 350 }, { x: 300, y: 260 }, { x: 300, y: 215 }], rotations: [180, 180, 180], duration: 2000 },
        ],
        crashPoint: { x: 305, y: 215 },
        message: { uzLatin: "Tramvay bilan to'qnashish!", uz: "Трамвай билан тўқнашиш!", ru: "Столкновение с трамваем!" },
      },
    },
  },

  // ═══════════════════════════════════════════════════════
  // 20. SPEED ZONE — City speed limit
  // ═══════════════════════════════════════════════════════
  {
    id: 'spd-2',
    category: 'speed_zone',
    difficulty: 'easy',
    question: {
      uzLatin: "Shaharda harakatlanayapsiz. Tezlik belgisi yo'q. Ruxsat etilgan maksimal tezlik qancha?",
      uz: "Шаҳарда ҳаракатланаяпсиз. Тезлик белгиси йўқ. Рухсат этилган максимал тезлик қанча?",
      ru: "Вы едете в городе. Знак ограничения скорости отсутствует. Какова максимальная разрешённая скорость?",
    },
    options: [
      { id: 'spd2-a', text: { uzLatin: "60 km/soat", uz: "60 км/соат", ru: "60 км/ч" }, correct: true },
      { id: 'spd2-b', text: { uzLatin: "80 km/soat", uz: "80 км/соат", ru: "80 км/ч" }, correct: false },
      { id: 'spd2-c', text: { uzLatin: "90 km/soat", uz: "90 км/соат", ru: "90 км/ч" }, correct: false },
    ],
    explanation: {
      uzLatin: "YHQ 10.2-bandiga ko'ra, aholi yashash joylarida tezlik cheklovi 60 km/soat (maxsus belgi bo'lmagan holda).",
      uz: "ЙҲҚ 10.2-бандига кўра, аҳоли яшаш жойларида тезлик чеклови 60 км/соат (махсус белги бўлмаган ҳолда).",
      ru: "Согласно п. 10.2 ПДД, в населённых пунктах ограничение скорости — 60 км/ч (без специального знака).",
    },
    pddReference: 'YHQ 10.2',
    scene: {
      type: 'two_lane_road',
      viewBox: '0 0 600 400',
      vehicles: [
        { id: 'player', type: 'car', isPlayer: true, position: { x: 150, y: 215 }, direction: 'east', rotation: -90, color: '#2196F3', label: { uzLatin: 'SIZ', uz: 'СИЗ', ru: 'ВЫ' } },
        { id: 'other', type: 'car', isPlayer: false, position: { x: 450, y: 185 }, direction: 'west', rotation: 90, color: '#9E9E9E' },
      ],
    },
    outcomes: {
      'spd2-a': {
        type: 'safe',
        animations: [
          { targetId: 'player', path: [{ x: 150, y: 215 }, { x: 350, y: 215 }, { x: 520, y: 215 }], rotations: [-90, -90, -90], duration: 2800 },
          { targetId: 'other', path: [{ x: 450, y: 185 }, { x: 300, y: 185 }, { x: 80, y: 185 }], rotations: [90, 90, 90], duration: 2800 },
        ],
        message: { uzLatin: "To'g'ri! Shaharda 60 km/soat.", uz: "Тўғри! Шаҳарда 60 км/соат.", ru: "Правильно! В городе — 60 км/ч." },
      },
      'spd2-b': {
        type: 'crash',
        animations: [
          { targetId: 'player', path: [{ x: 150, y: 215 }, { x: 380, y: 210 }, { x: 500, y: 215 }], rotations: [-90, -88, -90], duration: 1600 },
          { targetId: 'other', path: [{ x: 450, y: 185 }, { x: 300, y: 185 }, { x: 80, y: 185 }], rotations: [90, 90, 90], duration: 2800 },
        ],
        crashPoint: { x: 500, y: 215 },
        message: { uzLatin: "Xato! Shaharda 60 km/soat cheklovi amal qiladi.", uz: "Хато! Шаҳарда 60 км/соат чеклови амал қилади.", ru: "Ошибка! В городе действует ограничение 60 км/ч." },
      },
      'spd2-c': {
        type: 'crash',
        animations: [
          { targetId: 'player', path: [{ x: 150, y: 215 }, { x: 400, y: 210 }, { x: 520, y: 215 }], rotations: [-90, -87, -90], duration: 1400 },
          { targetId: 'other', path: [{ x: 450, y: 185 }, { x: 300, y: 185 }, { x: 80, y: 185 }], rotations: [90, 90, 90], duration: 2800 },
        ],
        crashPoint: { x: 520, y: 215 },
        message: { uzLatin: "Xato! 90 km/soat faqat shahar tashqarisida ruxsat.", uz: "Хато! 90 км/соат фақат шаҳар ташқарисида рухсат.", ru: "Ошибка! 90 км/ч только за городом." },
      },
    },
  },
];
