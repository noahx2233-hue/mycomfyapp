/**
 * Special App — Curated Daily Datasets
 * Curated collection of uplifting Bible verses and enriching vocabulary words.
 */

const BIBLE_VERSES = [
  {
    id: "v1",
    reference: "Philippians 4:6-7",
    text: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds.",
    translation: "NIV",
    theme: "Peace & Serenity",
    reflection: "Release worries today through gratitude and trust in divine peace."
  },
  {
    id: "v2",
    reference: "Isaiah 40:31",
    text: "Those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.",
    translation: "NIV",
    theme: "Renewed Strength",
    reflection: "True resilience is cultivated in patience and steadfast hope."
  },
  {
    id: "v3",
    reference: "Proverbs 3:5-6",
    text: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
    translation: "NIV",
    theme: "Wisdom & Guidance",
    reflection: "When the journey feels uncertain, trust that each step is guided."
  },
  {
    id: "v4",
    reference: "Psalm 46:10",
    text: "Be still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth.",
    translation: "NIV",
    theme: "Stillness & Presence",
    reflection: "In the quiet moments of stillness, find true clarity and stillness."
  },
  {
    id: "v5",
    reference: "Jeremiah 29:11",
    text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.",
    translation: "NIV",
    theme: "Hope & Purpose",
    reflection: "Your future holds purpose; trust the gentle unfolding of your path."
  },
  {
    id: "v6",
    reference: "Matthew 11:28",
    text: "Come to me, all you who are weary and burdened, and I will give you rest. Take my yoke upon you and learn from me, for I am gentle and humble in heart.",
    translation: "NIV",
    theme: "Rest & Comfort",
    reflection: "Rest is not a luxury, but a sacred necessity for renewal."
  },
  {
    id: "v7",
    reference: "Romans 8:28",
    text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.",
    translation: "NIV",
    theme: "Trust & Assurance",
    reflection: "Every circumstance, whether challenging or joyful, shapes your growth."
  },
  {
    id: "v8",
    reference: "Psalm 23:1-3",
    text: "The Lord is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul.",
    translation: "NIV",
    theme: "Restoration",
    reflection: "Allow your soul to drink from calm waters and be refreshed today."
  },
  {
    id: "v9",
    reference: "Joshua 1:9",
    text: "Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.",
    translation: "NIV",
    theme: "Courage & Faith",
    reflection: "Courage does not mean the absence of fear, but taking action alongside faith."
  },
  {
    id: "v10",
    reference: "Lamentations 3:22-23",
    text: "Because of the Lord's great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.",
    translation: "NIV",
    theme: "New Beginnings",
    reflection: "Every sunrise brings fresh mercy and a clean page to begin anew."
  },
  {
    id: "v11",
    reference: "Colossians 3:12",
    text: "Therefore, as God's chosen people, holy and dearly loved, clothe yourselves with compassion, kindness, humility, gentleness and patience.",
    translation: "NIV",
    theme: "Kindness & Grace",
    reflection: "Wear patience and gentleness as your garment throughout your encounters today."
  },
  {
    id: "v12",
    reference: "Psalm 121:1-2",
    text: "I lift up my eyes to the mountains—where does my help come from? My help comes from the Lord, the Maker of heaven and earth.",
    translation: "NIV",
    theme: "Divine Protection",
    reflection: "Look upward with confidence; unshakeable support is always present."
  },
  {
    id: "v13",
    reference: "2 Corinthians 12:9",
    text: "My grace is sufficient for you, for my power is made perfect in weakness. Therefore I will boast all the more gladly about my weaknesses.",
    translation: "NIV",
    theme: "Grace in Vulnerability",
    reflection: "You do not need to be flawless; grace meets you exactly where you are."
  },
  {
    id: "v14",
    reference: "Micah 6:8",
    text: "He has shown you, O mortal, what is good. And what does the Lord require of you? To act justly and to love mercy and to walk humbly with your God.",
    translation: "NIV",
    theme: "Humility & Justice",
    reflection: "Simplicity of living: do what is right, love kindness, and walk gently."
  },
  {
    id: "v15",
    reference: "1 Thessalonians 5:16-18",
    text: "Rejoice always, pray continually, give thanks in all circumstances; for this is God's will for you in Christ Jesus.",
    translation: "NIV",
    theme: "Unceasing Gratitude",
    reflection: "Gratitude turns what we have into more than enough."
  },
  {
    id: "v16",
    reference: "Psalm 119:105",
    text: "Your word is a lamp for my feet, a light on my path.",
    translation: "NIV",
    theme: "Illumination",
    reflection: "You only need light for the next faithful step in front of you."
  },
  {
    id: "v17",
    reference: "Galatians 5:22-23",
    text: "The fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control.",
    translation: "NIV",
    theme: "Spiritual Growth",
    reflection: "Cultivate peace and gentle actions like fruit on a patient tree."
  },
  {
    id: "v18",
    reference: "Proverbs 16:3",
    text: "Commit to the Lord whatever you do, and he will establish your plans.",
    translation: "NIV",
    theme: "Diligence & Purpose",
    reflection: "Dedicate your daily tasks with integrity and watch them flourish."
  },
  {
    id: "v19",
    reference: "Hebrews 11:1",
    text: "Now faith is confidence in what we hope for and assurance about what we do not see.",
    translation: "NIV",
    theme: "Faith & Assurance",
    reflection: "Hold steady in faith, knowing that unseen seeds take time to blossom."
  },
  {
    id: "v20",
    reference: "Psalm 90:12",
    text: "Teach us to number our days, that we may gain a heart of wisdom.",
    translation: "NIV",
    theme: "Mindful Living",
    reflection: "Treasure each fleeting hour as an irreplaceable gift."
  }
];

const WORDS_OF_THE_DAY = [
  {
    id: "w1",
    word: "Serenity",
    phonetic: "/səˈren.ə.ti/",
    partOfSpeech: "noun",
    definition: "The state of being calm, peaceful, and untroubled.",
    example: "She found deep serenity in the quiet early morning light before the city awoke."
  },
  {
    id: "w2",
    word: "Equanimity",
    phonetic: "/ˌek.wəˈnɪm.ə.ti/",
    partOfSpeech: "noun",
    definition: "Mental calmness, composure, and evenness of temper, especially in a difficult situation.",
    example: "He handled the sudden disruption with remarkable equanimity and gentle resolve."
  },
  {
    id: "w3",
    word: "Resilience",
    phonetic: "/rɪˈzɪl.jəns/",
    partOfSpeech: "noun",
    definition: "The capacity to withstand or recover quickly from difficulties; mental toughness and flexibility.",
    example: "Through every unexpected setback, her quiet resilience allowed her to rise stronger."
  },
  {
    id: "w4",
    word: "Mellifluous",
    phonetic: "/məˈlɪf.lu.əs/",
    partOfSpeech: "adjective",
    definition: "Sweet or musical; pleasant to hear; flowing with honeyed smoothness.",
    example: "The mellow chimes and rain produced a mellifluous soundtrack for focused work."
  },
  {
    id: "w5",
    word: "Ephemeral",
    phonetic: "/ɪˈfem.ər.əl/",
    partOfSpeech: "adjective",
    definition: "Lasting for a very short time; fleeting and transient.",
    example: "The golden sunset was ephemeral, reminding them to cherish each fleeting second."
  },
  {
    id: "w6",
    word: "Halcyon",
    phonetic: "/ˈhæl.si.ən/",
    partOfSpeech: "adjective",
    definition: "Denoting a period of time in the past that was idyllically happy and peaceful.",
    example: "He fondly recalled those halcyon autumn afternoons spent reading by the fireside."
  },
  {
    id: "w7",
    word: "Solace",
    phonetic: "/ˈsɑː.lɪs/",
    partOfSpeech: "noun",
    definition: "Comfort or consolation in a time of distress or sadness.",
    example: "In quiet contemplative writing, she discovered profound solace."
  },
  {
    id: "w8",
    word: "Perspicacity",
    phonetic: "/ˌpɜː.spɪˈkæs.ə.ti/",
    partOfSpeech: "noun",
    definition: "The quality of having a ready insight into things; acute mental discernment.",
    example: "Her perspicacity enabled her to understand the crux of complex challenges effortlessly."
  },
  {
    id: "w9",
    word: "Luminous",
    phonetic: "/ˈluː.mɪ.nəs/",
    partOfSpeech: "adjective",
    definition: "Full of or shedding light; bright or shining, especially in the dark; enlightened.",
    example: "His mind was filled with luminous ideas that brought clarity to the team."
  },
  {
    id: "w10",
    word: "Sonder",
    phonetic: "/ˈsɒn.dər/",
    partOfSpeech: "noun",
    definition: "The profound feeling of realizing that everyone around you has a life as vivid and complex as your own.",
    example: "Looking out across the crowded station, a wave of sonder washed over him."
  },
  {
    id: "w11",
    word: "Amiable",
    phonetic: "/ˈeɪ.mi.ə.bəl/",
    partOfSpeech: "adjective",
    definition: "Having or displaying a friendly and pleasant manner.",
    example: "An amiable disposition puts everyone at ease, diffusing all daily tension."
  },
  {
    id: "w12",
    word: "Eloquence",
    phonetic: "/ˈel.ə.kwəns/",
    partOfSpeech: "noun",
    definition: "Fluent or persuasive speaking or writing that moves the heart.",
    example: "Her eloquence lay not in elaborate vocabulary, but in sincere, gentle truth."
  },
  {
    id: "w13",
    word: "Eunoia",
    phonetic: "/juːˈnɔɪ.ə/",
    partOfSpeech: "noun",
    definition: "A well-mind; beautiful thinking; goodwill and benevolence toward others.",
    example: "Approaching every project with eunoia fostered mutual harmony and inspiration."
  },
  {
    id: "w14",
    word: "Sanguine",
    phonetic: "/ˈsæŋ.ɡwɪn/",
    partOfSpeech: "adjective",
    definition: "Optimistic or positive, especially in an apparently bad or difficult situation.",
    example: "She remained steadfastly sanguine about the ultimate outcome of the venture."
  },
  {
    id: "w15",
    word: "Petrichor",
    phonetic: "/ˈpet.rɪ.kɔːr/",
    partOfSpeech: "noun",
    definition: "A pleasant smell that frequently accompanies the first rain after a long period of warm, dry weather.",
    example: "The evening air was scented with fresh petrichor as gentle rain touched the garden."
  },
  {
    id: "w16",
    word: "Tenacity",
    phonetic: "/təˈnæs.ə.ti/",
    partOfSpeech: "noun",
    definition: "The quality or fact of being able to grip something firmly; determination and perseverance.",
    example: "With quiet tenacity, he continued polishing his craft one day at a time."
  },
  {
    id: "w17",
    word: "Magnanimous",
    phonetic: "/mæɡˈnæn.ɪ.məs/",
    partOfSpeech: "adjective",
    definition: "Generous or forgiving, especially toward a rival or less powerful person.",
    example: "A magnanimous spirit overlooks petty grievances and seeks the greater good."
  },
  {
    id: "w18",
    word: "Veracity",
    phonetic: "/vəˈræs.ə.ti/",
    partOfSpeech: "noun",
    definition: "Conformity to facts; accuracy, truthfulness, and integrity.",
    example: "His enduring reputation was anchored upon unshakable veracity and honor."
  },
  {
    id: "w19",
    word: "Ataraxia",
    phonetic: "/ˌæt.əˈræk.si.ə/",
    partOfSpeech: "noun",
    definition: "A state of serene calmness; untroubled peace of mind.",
    example: "After deep meditation, he attained a level of ataraxia untouched by external noise."
  },
  {
    id: "w20",
    word: "Ubiquitous",
    phonetic: "/juːˈbɪk.wɪ.təs/",
    partOfSpeech: "adjective",
    definition: "Present, appearing, or found everywhere; omnipresent.",
    example: "Kindness has the potential to become ubiquitous if we practice it each day."
  }
];

// Day-of-year deterministic calculator
function getDayOfYearIndex(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = (date - start) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function getDailyVerse(date = new Date()) {
  const idx = getDayOfYearIndex(date);
  return BIBLE_VERSES[idx % BIBLE_VERSES.length];
}

function getDailyWord(date = new Date()) {
  const idx = getDayOfYearIndex(date);
  return WORDS_OF_THE_DAY[idx % WORDS_OF_THE_DAY.length];
}

// Standard Tag Catalogs for Causal Tracking
const DEFAULT_TAGS = {
  inputs: [
    '7.5h+ Sleep', '7h Sleep', 'Sleep < 6h', '8h Sleep',
    'Coffee x1', 'Coffee x2', 'Coffee > 2', 'No Caffeine',
    'Hydration 2L', 'Clean Diet', 'Fast Food', 'Sugar Craving',
    'Meditation', 'Cold Shower', 'Supplements'
  ],
  activities: [
    'Deep Work 3h', 'Deep Work 2h', 'Gym Session', 'Morning Walk',
    'Evening Walk', 'Reading', 'Writing / Journaling', 'Screen Time > 4h',
    'Coding / Building', 'Creative Hobbies', 'Stretching / Yoga'
  ],
  people: [
    'Solo', 'Colleagues', 'Close Friends', 'Family', 'Partner', 'Mentors', 'New People'
  ],
  outcomes: [
    'Flow State', 'High Energy', 'Calm Mind', 'Completed Goal',
    'Joyful', 'Brain Fog', 'Fatigue', 'Restless / Anxious', 'Creative Burst'
  ]
};
