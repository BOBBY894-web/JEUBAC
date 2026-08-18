import React, { useState, useEffect } from 'react';

type GameMode = 'alphabetical' | 'random';
type VariantMode = 'classic' | 'reversed' | 'frenzy';
type ThemeStyle = 'cyberpunk' | 'arcade' | 'dark';
type AppView = 'home' | 'profile' | 'achievements' | 'salon-menu' | 'lobby' | 'category-select' | 'playing' | 'voting' | 'round-results' | 'podium';

interface PlayerProfile {
  name: string;
  avatar: string;
  celebration: string;
  theme: ThemeStyle;
  stats: {
    gold: number;
    silver: number;
    bronze: number;
    totalGames: number;
  };
}

interface Achievement {
  id: string;
  title: string;
  desc: string;
  icon: string;
  unlocked: boolean;
}

interface GameHistoryItem {
  id: string;
  date: string;
  totalScore: number;
  rank: number;
  badge: string;
  roundsCount: number;
}

interface LeaderboardPlayer {
  name: string;
  avatar: string;
  score: number;
  isUser: boolean;
  celebration?: string;
  isTyping?: boolean;
}

const DEFAULT_CATEGORIES = [
  'Prénom', 
  'Ville', 
  'Fruit / Légume', 
  'Animal', 
  'Métier', 
  'Pays', 
  'Marque', 
  'Objet', 
  'Célébrité', 
  'Film / Série'
];

const playSound = (type: 'beep' | 'success' | 'fail' | 'win' | 'click') => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'click') {
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'beep') {
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'success') {
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'fail') {
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.setValueAtTime(150, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'win') {
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.frequency.setValueAtTime(freq, now + idx * 0.1);
        g.gain.setValueAtTime(0.1, now + idx * 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.2);
        o.start(now + idx * 0.1);
        o.stop(now + idx * 0.1 + 0.2);
      });
    }
  } catch (e) {}
};

export default function App() {
  const loadStoredProfile = (): PlayerProfile => {
    const stored = localStorage.getItem('gotyPetitBacProfileV2');
    return stored ? JSON.parse(stored) : {
      name: 'Joueur 1',
      avatar: '😎',
      celebration: 'Feu d\'artifice réaliste 🎆',
      theme: 'cyberpunk',
      stats: { gold: 0, silver: 0, bronze: 0, totalGames: 0 }
    };
  };

  const loadStoredGamesHistory = (): GameHistoryItem[] => {
    const stored = localStorage.getItem('gotyPetitBacGamesHistoryV2');
    return stored ? JSON.parse(stored) : [];
  };

  const loadStoredAchievements = (): Achievement[] => {
    const stored = localStorage.getItem('gotyPetitBacAchievementsV2');
    return stored ? JSON.parse(stored) : [
      { id: 'first_game', title: 'Premier Pas', desc: 'Terminer une première partie', icon: '🎮', unlocked: false },
      { id: 'master', title: 'Maître ès Lettres', desc: 'Gagner 3 parties (1ère place)', icon: '👑', unlocked: false },
      { id: 'legend', title: 'Légende Vivante', desc: 'Gagner 10 parties', icon: '🏆', unlocked: false },
      { id: 'flash', title: 'Éclair', desc: 'Finir une manche avec plus de la moitié du temps', icon: '⚡', unlocked: false },
      { id: 'encyclopedia', title: 'Encyclopédie', desc: 'Remplir toutes les catégories d\'une manche', icon: '🧠', unlocked: false },
      { id: 'chameleon', title: 'Caméléon', desc: 'Personnaliser son avatar ou son thème', icon: '🎨', unlocked: false },
      { id: 'veteran', title: 'Vétéran du Bac', desc: 'Jouer 5 parties au total', icon: '🎖️', unlocked: false },
      { id: 'perfectionist', title: 'Perfectionniste', desc: 'Obtenir un score supérieur à 20 points en une manche', icon: '💎', unlocked: false }
    ];
  };

  const [view, setView] = useState<AppView>('home');
  const [profile, setProfile] = useState<PlayerProfile>(loadStoredProfile);
  const [gamesHistory, setGamesHistory] = useState<GameHistoryItem[]>(loadStoredGamesHistory);
  const [achievements, setAchievements] = useState<Achievement[]>(loadStoredAchievements);

  const [totalRounds, setTotalRounds] = useState<number>(3);
  const [useTimer, setUseTimer] = useState<boolean>(true);
  const [enableVoting, setEnableVoting] = useState<boolean>(true); // Option pour activer/désactiver le vote des réponses
  const [roundTime, setRoundTime] = useState<number>(60);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [gameMode, setGameMode] = useState<GameMode>('alphabetical');
  const [variantMode, setVariantMode] = useState<VariantMode>('classic');
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [currentLetter, setCurrentLetter] = useState<string>('A');
  
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [newCategoryInput, setNewCategoryInput] = useState<string>('');

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [scores, setScores] = useState<Record<string, number>>({});
  const [salonCode, setSalonCode] = useState<string>('');
  const [inputCode, setInputCode] = useState<string>('');
  
  const [votingData, setVotingData] = useState<Array<{category: string; player: string; word: string; valid: boolean | null}>>([]);
  const [simulatedBotsProgress, setSimulatedBotsProgress] = useState<Record<string, number>>({ Bot_Alex: 0, Bot_Sarah: 0 });
  const [currentRoundDetails, setCurrentRoundDetails] = useState<any[]>([]);
  const [finalPodium, setFinalPodium] = useState<LeaderboardPlayer[]>([]);

  const celebrations = [
    { name: 'Pluie de confettis 🎉', type: 'confetti' },
    { name: 'Feu d\'artifice réaliste 🎆', type: 'fireworks' },
    { name: 'Danse de la victoire 💃', type: 'dance' },
  ];

  const avatars = ['😎', '🤡', '👽', '🤖', '👻', '🤠', '🦊', '🐱', '🦄', '🦁'];

  useEffect(() => {
    localStorage.setItem('gotyPetitBacProfileV2', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('gotyPetitBacGamesHistoryV2', JSON.stringify(gamesHistory));
  }, [gamesHistory]);

  useEffect(() => {
    localStorage.setItem('gotyPetitBacAchievementsV2', JSON.stringify(achievements));
  }, [achievements]);

  const unlockAchievement = (id: string) => {
    setAchievements(prev => prev.map(a => {
      if (a.id === id && !a.unlocked) {
        playSound('win');
        return { ...a, unlocked: true };
      }
      return a;
    }));
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (view === 'playing') {
      const botTimer = setInterval(() => {
        setSimulatedBotsProgress(prev => ({
          Bot_Alex: Math.min(100, prev.Bot_Alex + Math.floor(Math.random() * 15)),
          Bot_Sarah: Math.min(100, prev.Bot_Sarah + Math.floor(Math.random() * 12))
        }));
      }, 1000);

      if (useTimer && timeLeft > 0) {
        timer = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 10 && prev > 1) playSound('beep');
            if (prev <= 1) {
              clearInterval(timer);
              clearInterval(botTimer);
              handleRoundEndTransition();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
      return () => {
        clearInterval(timer);
        clearInterval(botTimer);
      };
    }
  }, [view, useTimer, timeLeft]);

  const createSalon = () => {
    playSound('click');
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setSalonCode(randomCode);
    setView('lobby');
  };

  const joinSalon = () => {
    playSound('click');
    if (!inputCode.trim()) return;
    setSalonCode(inputCode.toUpperCase());
    setView('lobby');
  };

  const handleAnswerChange = (cat: string, val: string) => {
    setAnswers({ ...answers, [cat]: val });
  };

  const addCategory = () => {
    playSound('click');
    if (newCategoryInput.trim() && !categories.includes(newCategoryInput.trim())) {
      setCategories([...categories, newCategoryInput.trim()]);
      setNewCategoryInput('');
    }
  };

  const removeCategory = (catToRemove: string) => {
    playSound('click');
    if (categories.length > 1) {
      setCategories(categories.filter(c => c !== catToRemove));
    }
  };

  const getNextLetter = (roundNum: number) => {
    if (gameMode === 'alphabetical') {
      const nextCharCode = 65 + (roundNum - 1);
      return nextCharCode <= 90 ? String.fromCharCode(nextCharCode) : 'A';
    } else {
      return String.fromCharCode(65 + Math.floor(Math.random() * 26));
    }
  };

  const startGame = () => {
    playSound('success');
    const firstLetter = gameMode === 'alphabetical' ? 'A' : String.fromCharCode(65 + Math.floor(Math.random() * 26));
    setCurrentRound(1);
    setCurrentLetter(firstLetter);
    setAnswers({});
    setScores({});
    setCurrentRoundDetails([]);
    setSimulatedBotsProgress({ Bot_Alex: 0, Bot_Sarah: 0 });
    setTimeLeft(variantMode === 'frenzy' ? 25 : roundTime);
    setView('category-select');
  };
  
  const confirmCategoriesAndPlay = () => {
    setView('playing');
  };

  // Décide si on passe par le vote ou directement aux résultats selon le choix du joueur
  const handleRoundEndTransition = () => {
    if (enableVoting) {
      goToVotingPhase();
    } else {
      processRoundScoresDirectly();
    }
  };

  const goToVotingPhase = () => {
    playSound('click');
    const items: Array<{category: string; player: string; word: string; valid: boolean | null}> = [];

    categories.forEach(cat => {
      const userWord = (answers[cat] || '').trim();
      items.push({ category: cat, player: profile.name, word: userWord, valid: userWord ? true : null });

      const botWordsAlex = ['Avion', 'Amsterdam', 'Ananas', 'Aigle', 'Acteur', 'Argentine', 'Adidas', 'Anjou', 'Amélie', 'Avatar'];
      const botWordsSarah = ['Arbre', 'Athènes', 'Abricot', 'Araignée', 'Avocat', 'Algérie', 'Apple', 'Agenda', 'Alain', 'Alien'];
      
      const randomAlexWord = userWord ? botWordsAlex[Math.floor(Math.random() * botWordsAlex.length)] : '';
      const randomSarahWord = userWord ? botWordsSarah[Math.floor(Math.random() * botWordsSarah.length)] : '';

      items.push({ category: cat, player: 'Bot_Alex', word: randomAlexWord, valid: randomAlexWord ? true : null });
      items.push({ category: cat, player: 'Bot_Sarah', word: randomSarahWord, valid: randomSarahWord ? true : null });
    });

    setVotingData(items);
    setView('voting');
  };

  const toggleVote = (index: number, status: boolean) => {
    playSound('click');
    setVotingData(prev => prev.map((item, i) => i === index ? { ...item, valid: status } : item));
  };

  const finishRoundFromVoting = () => {
    playSound('success');
    let roundScore = 0;
    const evaluatedAnswers: Record<string, { word: string; pts: number }> = {};

    categories.forEach(cat => {
      const userItem = votingData.find(v => v.category === cat && v.player === profile.name);
      const word = userItem?.word || '';
      const isValid = userItem?.valid;

      let rulePassed = true;
      if (word) {
        if (variantMode === 'classic') {
          rulePassed = word.toUpperCase().startsWith(currentLetter);
        } else if (variantMode === 'reversed') {
          rulePassed = word.toUpperCase().endsWith(currentLetter);
        }
      }

      const pts = (word && isValid && rulePassed) ? 2 : 0;
      roundScore += pts;
      evaluatedAnswers[cat] = { word: word + (!rulePassed && word ? ' (mauvaise lettre)' : ''), pts };
    });

    finalizeRoundScoring(roundScore, evaluatedAnswers);
  };

  const processRoundScoresDirectly = () => {
    playSound('success');
    let roundScore = 0;
    const evaluatedAnswers: Record<string, { word: string; pts: number }> = {};

    categories.forEach(cat => {
      const word = (answers[cat] || '').trim();
      let rulePassed = true;
      if (word) {
        if (variantMode === 'classic') {
          rulePassed = word.toUpperCase().startsWith(currentLetter);
        } else if (variantMode === 'reversed') {
          rulePassed = word.toUpperCase().endsWith(currentLetter);
        }
      }

      const pts = (word && rulePassed) ? 2 : 0;
      roundScore += pts;
      evaluatedAnswers[cat] = { word: word + (!rulePassed && word ? ' (mauvaise lettre)' : ''), pts };
    });

    finalizeRoundScoring(roundScore, evaluatedAnswers);
  };

  const finalizeRoundScoring = (roundScore: number, evaluatedAnswers: Record<string, { word: string; pts: number }>) => {
    if (useTimer && timeLeft > roundTime / 2) {
      unlockAchievement('flash');
    }

    const filledCount = categories.filter(cat => (answers[cat] || '').trim().length > 0).length;
    if (filledCount === categories.length) {
      unlockAchievement('encyclopedia');
    }

    if (roundScore >= 20) {
      unlockAchievement('perfectionist');
    }

    setScores(prev => ({ ...prev, [currentRound]: roundScore }));
    const newRoundInfo = { round: currentRound, letter: currentLetter, details: evaluatedAnswers, total: roundScore };
    setCurrentRoundDetails(prev => [...prev, newRoundInfo]);
    setView('round-results');
  };

  const calculateFinalPodium = () => {
    playSound('win');
    const userTotal = Object.values(scores).reduce((acc, curr) => acc + curr, 0);
    const bot1Score = Math.max(0, userTotal + Math.floor(Math.random() * 10) - 5);
    const bot2Score = Math.max(0, userTotal + Math.floor(Math.random() * 14) - 7);

    const players: LeaderboardPlayer[] = [
      { name: profile.name, avatar: profile.avatar, score: userTotal, isUser: true, celebration: profile.celebration },
      { name: 'Bot_Alex', avatar: '🤖', score: bot1Score, isUser: false },
      { name: 'Bot_Sarah', avatar: '🦊', score: bot2Score, isUser: false }
    ];

    players.sort((a, b) => b.score - a.score);
    setFinalPodium(players);

    const userIndex = players.findIndex(p => p.isUser);
    let rank = userIndex + 1;
    let badge = '🥉';

    const newTotalGames = profile.stats.totalGames + 1;
    unlockAchievement('first_game');
    if (newTotalGames >= 5) unlockAchievement('veteran');

    if (rank === 1) {
      badge = '👑';
      const newGold = profile.stats.gold + 1;
      if (newGold >= 3) unlockAchievement('master');
      if (newGold >= 10) unlockAchievement('legend');
    } else if (rank === 2) {
      badge = '🥈';
    }

    const newGameRecord: GameHistoryItem = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
      totalScore: userTotal,
      rank: rank,
      badge: badge,
      roundsCount: totalRounds
    };

    setGamesHistory(prev => [newGameRecord, ...prev]);

    setProfile(prev => {
      const newStats = { ...prev.stats, totalGames: newTotalGames };
      if (rank === 1) newStats.gold += 1;
      else if (rank === 2) newStats.silver += 1;
      else if (rank === 3) newStats.bronze += 1;
      return { ...prev, stats: newStats };
    });

    setView('podium');
  };

  const nextRoundOrPodium = () => {
    playSound('click');
    if (currentRound < totalRounds) {
      const nextR = currentRound + 1;
      setCurrentRound(nextR);
      setAnswers({});
      setCurrentLetter(getNextLetter(nextR));
      setSimulatedBotsProgress({ Bot_Alex: 0, Bot_Sarah: 0 });
      setTimeLeft(variantMode === 'frenzy' ? 25 : roundTime);
      setView('playing');
    } else {
      calculateFinalPodium();
    }
  };

  const themeClasses = {
    cyberpunk: 'bg-slate-950 text-cyan-400 border-cyan-500/40',
    arcade: 'bg-zinc-900 text-yellow-400 border-yellow-500/40',
    dark: 'bg-slate-900 text-white border-slate-700'
  }[profile.theme];

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-300 ${profile.theme === 'arcade' ? 'bg-zinc-950 text-zinc-100' : profile.theme === 'cyberpunk' ? 'bg-black text-cyan-300' : 'bg-slate-900 text-white'}`}>
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-40px) rotate(0deg) scale(0.8); opacity: 1; }
          100% { transform: translateY(200px) rotate(720deg) scale(1.2); opacity: 0; }
        }
        @keyframes fireworkBurst {
          0% { transform: scale(0.1); opacity: 1; box-shadow: 0 0 0 0 rgba(234, 179, 8, 1), 0 0 0 0 rgba(239, 68, 68, 1); }
          100% { transform: scale(1.8); opacity: 0; box-shadow: 0 -90px 0 20px rgba(234, 179, 8, 0), 90px 0 0 20px rgba(239, 68, 68, 0); }
        }
        .confetti-particle { position: absolute; width: 10px; height: 14px; border-radius: 2px; animation: confettiFall 1.2s infinite linear; }
        .firework-center { position: absolute; width: 10px; height: 10px; border-radius: 50%; animation: fireworkBurst 1.2s infinite ease-out; }
      `}</style>

      {/* Conteneur principal avec largeur maîtrisée pour éviter tout dépassement de bouton */}
      <div className={`w-full max-w-sm sm:max-w-md bg-slate-800/90 rounded-2xl shadow-2xl p-5 sm:p-6 border backdrop-blur-md box-border ${themeClasses}`}>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-center mb-5 tracking-wider uppercase font-mono">⚡ Petit Bac GOTY ⚡</h1>

        {/* 1. ACCUEIL */}
        {view === 'home' && (
          <div className="space-y-3.5 text-center w-full">
            <div className="p-4 bg-slate-700/50 rounded-xl border border-slate-600 mb-4 flex flex-col items-center shadow-inner">
              <span className="text-5xl sm:text-6xl mb-2 animate-bounce">{profile.avatar}</span>
              <span className="font-bold text-lg sm:text-xl">{profile.name}</span>
              <div className="flex gap-3 mt-2 text-xs bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-600">
                <span>👑 {profile.stats.gold}</span>
                <span>🥈 {profile.stats.silver}</span>
                <span>🥉 {profile.stats.bronze}</span>
              </div>
            </div>

            <button onClick={createSalon} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 py-3 rounded-xl font-bold shadow-lg transition-transform active:scale-95 box-border">
              🚀 Jouer (Salons & Multijoueur)
            </button>
            <button onClick={() => { playSound('click'); setView('achievements'); }} className="w-full bg-amber-600/80 hover:bg-amber-600 py-3 rounded-xl font-bold shadow transition-transform active:scale-95 flex items-center justify-center gap-2 box-border">
              🏆 Trophées ({achievements.filter(a => a.unlocked).length}/{achievements.length})
            </button>
            <button onClick={() => { playSound('click'); setView('profile'); }} className="w-full bg-slate-700 hover:bg-slate-600 py-3 rounded-xl font-bold transition-transform active:scale-95 box-border">
              ⚙️ Mon Profil & Customisation
            </button>
          </div>
        )}

        {/* 2. PROFIL & CUSTOMISATION */}
        {view === 'profile' && (
          <div className="space-y-3.5 w-full">
            <h2 className="text-lg sm:text-xl font-semibold text-indigo-300 text-center mb-1">Personnalisation & Stats</h2>
            
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">Pseudo :</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 box-border"
              />
            </div>

            <div className="bg-slate-700/50 p-2.5 rounded-lg border border-slate-600 text-center">
              <p className="text-[11px] text-slate-400 mb-1">Palmarès global</p>
              <div className="flex justify-around text-xs sm:text-sm font-bold">
                <span className="flex items-center gap-1">👑 {profile.stats.gold}</span>
                <span className="flex items-center gap-1">🥈 {profile.stats.silver}</span>
                <span className="flex items-center gap-1">🥉 {profile.stats.bronze}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">Thème visuel :</label>
              <select
                value={profile.theme}
                onChange={(e) => {
                  setProfile({ ...profile, theme: e.target.value as ThemeStyle });
                  unlockAchievement('chameleon');
                }}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs sm:text-sm box-border"
              >
                <option value="cyberpunk">Néon Cyberpunk 🌆</option>
                <option value="arcade">Rétro Arcade 🕹️</option>
                <option value="dark">Sombre Élégant 🌙</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">Avatar :</label>
              <div className="grid grid-cols-5 gap-1.5 bg-slate-700/40 p-2 rounded-lg border border-slate-600">
                {avatars.map(a => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => {
                      setProfile({...profile, avatar: a});
                      unlockAchievement('chameleon');
                    }}
                    className={`text-xl sm:text-2xl p-1 rounded-lg transition-transform flex items-center justify-center ${profile.avatar === a ? 'bg-indigo-600 scale-110 shadow-md ring-2 ring-white' : 'hover:bg-slate-600'}`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">Célébration :</label>
              <select
                value={profile.celebration}
                onChange={(e) => setProfile({ ...profile, celebration: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs sm:text-sm box-border"
              >
                {celebrations.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            <button onClick={() => { playSound('click'); setView('home'); }} className="w-full bg-indigo-600 hover:bg-indigo-700 py-2.5 rounded-xl font-bold text-sm mt-1 box-border">
              Enregistrer et retour
            </button>
          </div>
        )}

        {/* 3. SUCCÈS & TROPHÉES ÉTENDUS */}
        {view === 'achievements' && (
          <div className="space-y-3 w-full">
            <h2 className="text-lg sm:text-xl font-bold text-center text-amber-400">🏆 Trophées & Succès</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {achievements.map(ach => (
                <div key={ach.id} className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${ach.unlocked ? 'bg-amber-950/30 border-amber-500/50 text-amber-200' : 'bg-slate-700/30 border-slate-700 text-slate-400 opacity-60'}`}>
                  <span className="text-2xl sm:text-3xl">{ach.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-xs sm:text-sm truncate">{ach.title}</h3>
                    <p className="text-[10px] sm:text-xs text-slate-300">{ach.desc}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-950 whitespace-nowrap">{ach.unlocked ? '✅ Fait' : '🔒 Cadena'}</span>
                </div>
              ))}
            </div>
            <button onClick={() => { playSound('click'); setView('home'); }} className="w-full bg-slate-700 hover:bg-slate-600 py-2.5 rounded-xl font-bold text-sm box-border">
              Retour
            </button>
          </div>
        )}

        {/* 4. MENU SALONS */}
        {view === 'salon-menu' && (
          <div className="space-y-3.5 w-full">
            <h2 className="text-lg sm:text-xl font-semibold text-indigo-300 text-center mb-2">Salons & Multijoueur</h2>
            <button onClick={createSalon} className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-xl font-bold shadow-lg text-sm box-border">
              ➕ Créer un salon privé
            </button>
            <div className="pt-2 border-t border-slate-700 space-y-2">
              <label className="block text-xs sm:text-sm font-medium">Rejoindre un salon :</label>
              <div className="flex gap-2 w-full box-border">
                <input
                  type="text"
                  placeholder="Code ex: ABC123"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  className="w-0 flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 uppercase font-mono text-sm box-border min-w-0"
                />
                <button onClick={joinSalon} className="bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 rounded-lg font-bold text-xs sm:text-sm whitespace-nowrap box-border">
                  Rejoindre
                </button>
              </div>
            </div>
            <button onClick={() => { playSound('click'); setView('home'); }} className="w-full bg-slate-700 hover:bg-slate-600 py-2.5 rounded-xl font-bold text-sm mt-3 box-border">
              Retour
            </button>
          </div>
        )}

        {/* 5. LOBBY AVEC OPTIONS DE VALIDATION ET CHRONO */}
        {view === 'lobby' && (
          <div className="space-y-2.5 text-center w-full">
            <div className="bg-slate-700/50 p-2.5 rounded-xl border border-slate-600">
              <p className="text-[11px] text-slate-400">Code du salon :</p>
              <span className="text-xl sm:text-2xl font-mono font-bold text-yellow-400">{salonCode}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-left">
              <div>
                <label className="block text-[11px] font-medium mb-1">Manches :</label>
                <input 
                  type="number" 
                  min="1" 
                  max="10" 
                  value={totalRounds} 
                  onChange={(e) => setTotalRounds(Number(e.target.value))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm box-border"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1">Lettres :</label>
                <select 
                  value={gameMode} 
                  onChange={(e) => setGameMode(e.target.value as GameMode)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-2 py-1.5 text-xs sm:text-sm box-border"
                >
                  <option value="alphabetical">Ordre (A, B, C)</option>
                  <option value="random">Aléatoire</option>
                </select>
              </div>
            </div>

            <div className="space-y-1 text-left">
              <label className="block text-[11px] font-medium">Variante de jeu :</label>
              <select 
                value={variantMode} 
                onChange={(e) => setVariantMode(e.target.value as VariantMode)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm box-border"
              >
                <option value="classic">Classique (Commence par...)</option>
                <option value="reversed">Inversé (Se termine par...) 🔄</option>
                <option value="frenzy">Frénétique (Chrono 25s) ⚡</option>
              </select>
            </div>

            {/* Options de validation manuelle (Juge de ligne) et Chronomètre */}
            <div className="space-y-2 text-left bg-slate-700/30 p-2.5 rounded-xl border border-slate-700 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-medium">Chronomètre :</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={useTimer} onChange={(e) => setUseTimer(e.target.checked)} className="sr-only peer" />
                  <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              
              <div className="flex justify-between items-center pt-1 border-t border-slate-700/50">
                <span className="font-medium">Juge de ligne (Valider les réponses) :</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={enableVoting} onChange={(e) => setEnableVoting(e.target.checked)} className="sr-only peer" />
                  <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>

              {useTimer && variantMode !== 'frenzy' && (
                <select 
                  value={roundTime} 
                  onChange={(e) => setRoundTime(Number(e.target.value))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-xs mt-1 box-border"
                >
                  <option value={30}>30 secondes</option>
                  <option value={60}>60 secondes</option>
                  <option value={90}>90 secondes</option>
                </select>
              )}
            </div>

            <button onClick={startGame} className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 py-2.5 rounded-xl font-bold shadow-lg text-sm mt-1 box-border">
              Suivant : Choisir les catégories ➡️
            </button>
            <button onClick={() => { playSound('click'); setView('salon-menu'); }} className="w-full bg-slate-700 py-2 rounded-xl text-xs box-border">
              Quitter
            </button>
          </div>
        )}

        {/* 6. CHOIX DES CATÉGORIES */}
        {view === 'category-select' && (
          <div className="space-y-3.5 w-full">
            <h2 className="text-lg sm:text-xl font-semibold text-indigo-300 text-center">Catégories de la partie</h2>
            
            <div className="flex gap-2 w-full box-border">
              <input 
                type="text"
                placeholder="Nouvelle catégorie..."
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                className="w-0 flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs sm:text-sm box-border min-w-0"
              />
              <button onClick={addCategory} className="bg-green-600 hover:bg-green-700 px-3.5 py-2 rounded-lg font-bold text-xs sm:text-sm whitespace-nowrap box-border">
                Ajouter
              </button>
            </div>

            <div className="bg-slate-700/40 p-2.5 rounded-xl border border-slate-600 max-h-40 overflow-y-auto space-y-1.5">
              {categories.map(cat => (
                <div key={cat} className="flex justify-between items-center bg-slate-700 px-3 py-1.5 rounded-lg text-xs sm:text-sm">
                  <span>{cat}</span>
                  {categories.length > 1 && (
                    <button onClick={() => removeCategory(cat)} className="text-red-400 hover:text-red-300 font-bold px-2">✕</button>
                  )}
                </div>
              ))}
            </div>

            <button onClick={confirmCategoriesAndPlay} className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-xl font-bold shadow-lg text-sm box-border">
              Lancer la partie 🚀
            </button>
            <button onClick={() => { playSound('click'); setView('lobby'); }} className="w-full bg-slate-700 py-2 rounded-xl text-xs sm:text-sm box-border">
              Retour
            </button>
          </div>
        )}

        {/* 7. PHASE DE JEU */}
        {view === 'playing' && (
          <div className="space-y-3 w-full">
            <div className="flex justify-between items-center text-indigo-300 font-bold border-b border-slate-700 pb-2 text-xs sm:text-sm">
              <span>Manche {currentRound}/{totalRounds}</span>
              {useTimer ? (
                <span className={`px-2 py-0.5 rounded text-xs ${timeLeft <= 10 ? 'bg-red-600 animate-pulse text-white' : 'bg-slate-700 text-yellow-400'}`}>
                  ⏱️ {timeLeft}s
                </span>
              ) : (
                <span className="text-xs text-slate-400">Sans chrono</span>
              )}
              <span className="text-sm sm:text-lg text-yellow-400 font-mono">Lettre : {currentLetter}</span>
            </div>

            <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-700 text-xs space-y-1.5">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Activité en direct :</p>
              <div className="flex items-center gap-2">
                <span className="w-16 truncate font-medium">🤖 Alex</span>
                <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-cyan-500 h-full transition-all duration-500" style={{ width: `${simulatedBotsProgress.Bot_Alex}%` }}></div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-16 truncate font-medium">🦊 Sarah</span>
                <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-pink-500 h-full transition-all duration-500" style={{ width: `${simulatedBotsProgress.Bot_Sarah}%` }}></div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2 max-h-[36vh] overflow-y-auto pr-1">
              {categories.map(cat => (
                <div key={cat}>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-0.5">{cat}</label>
                  <input 
                    type="text" 
                    placeholder={variantMode === 'reversed' ? `Fini par ${currentLetter}...` : `Commence par ${currentLetter}...`}
                    value={answers[cat] || ''}
                    onChange={(e) => handleAnswerChange(cat, e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 box-border"
                  />
                </div>
              ))}
            </div>

            <button onClick={handleRoundEndTransition} className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-xl font-bold shadow-lg text-sm mt-1 box-border">
              Terminer la manche ➡️
            </button>
          </div>
        )}

        {/* 8. PHASE DE VOTE (JUGE DE LIGNE) */}
        {view === 'voting' && (
          <div className="space-y-3 w-full">
            <h2 className="text-base sm:text-lg font-bold text-center text-yellow-400">🗳️ Juge de ligne (Votes)</h2>
            <p className="text-[11px] text-slate-300 text-center">Vérifiez les mots et validez ou refusez les points :</p>

            <div className="bg-slate-700/40 p-2.5 rounded-xl border border-slate-700 max-h-56 overflow-y-auto space-y-2">
              {votingData.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-700 p-2 rounded-lg text-xs">
                  <div className="min-w-0 flex-1 mr-2">
                    <span className="font-bold text-indigo-300">{item.player}</span> <span className="text-slate-400">({item.category})</span> :
                    <div className="text-yellow-200 font-semibold truncate">{item.word || <span className="text-slate-500 italic">Vide</span>}</div>
                  </div>
                  {item.word && (
                    <div className="flex gap-1 shrink-0">
                      <button 
                        onClick={() => toggleVote(idx, true)}
                        className={`px-2 py-1 rounded font-bold text-xs ${item.valid ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                      >
                        👍
                      </button>
                      <button 
                        onClick={() => toggleVote(idx, false)}
                        className={`px-2 py-1 rounded font-bold text-xs ${!item.valid ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                      >
                        ❌
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button onClick={finishRoundFromVoting} className="w-full bg-indigo-600 hover:bg-indigo-700 py-3 rounded-xl font-bold shadow-lg text-sm box-border">
              Valider les scores ➡️
            </button>
          </div>
        )}

        {/* 9. RÉSULTATS DE LA MANCHE */}
        {view === 'round-results' && (
          <div className="space-y-3.5 w-full">
            <h2 className="text-lg sm:text-xl font-bold text-center text-green-400">Manche {currentRound} Validée !</h2>
            <p className="text-center text-xs sm:text-sm text-yellow-300 font-bold">Points gagnés : +{scores[currentRound] || 0} pts</p>
            
            <div className="bg-slate-700/50 p-3 rounded-xl space-y-2 border border-slate-600 max-h-44 overflow-y-auto text-xs sm:text-sm">
              {categories.map(cat => {
                const latestRound = currentRoundDetails[currentRoundDetails.length - 1];
                const item = latestRound?.details[cat];
                return (
                  <div key={cat} className="flex justify-between items-center border-b border-slate-700/50 pb-1">
                    <span className="text-slate-400">{cat} :</span>
                    <div className="text-right">
                      <span className="text-yellow-200 font-medium mr-2">{item?.word || <span className="text-slate-500 italic">Vide</span>}</span>
                      <span className="text-[11px] bg-indigo-900 text-indigo-200 px-1.5 py-0.5 rounded font-bold">+{item?.pts || 0}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={nextRoundOrPodium} className="w-full bg-indigo-600 hover:bg-indigo-700 py-3 rounded-xl font-bold shadow-lg text-sm box-border">
              {currentRound < totalRounds ? 'Manche Suivante ➡️' : 'Voir le Podium final 🏆'}
            </button>
          </div>
        )}

        {/* 10. PODIUM FINAL GOTY */}
        {view === 'podium' && (
          <div className="text-center space-y-3.5 relative w-full">
            <h2 className="text-xl sm:text-2xl font-extrabold text-yellow-400 animate-pulse">🏆 Podium GOTY 🏆</h2>
            
            <div className="p-4 bg-slate-700/50 rounded-2xl border border-slate-600 my-1 relative overflow-hidden flex flex-col items-center justify-center">
              
              {finalPodium[0]?.isUser && profile.celebration.includes('Pluie de confettis') && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="confetti-particle" style={{ left: '15%', backgroundColor: '#f43f5e', animationDelay: '0s' }}></div>
                  <div className="confetti-particle" style={{ left: '35%', backgroundColor: '#eab308', animationDelay: '0.3s' }}></div>
                  <div className="confetti-particle" style={{ left: '55%', backgroundColor: '#3b82f6', animationDelay: '0.6s' }}></div>
                </div>
              )}

              {finalPodium[0]?.isUser && profile.celebration.includes('Feu d\'artifice réaliste') && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                  <div className="firework-center" style={{ left: '30%', top: '40%' }}></div>
                  <div className="firework-center" style={{ left: '70%', top: '60%', animationDelay: '0.6s' }}></div>
                </div>
              )}

              <div className="w-full space-y-2 z-10 my-1">
                {finalPodium.map((player, index) => {
                  let badge = '🥉';
                  let bgCard = 'bg-slate-800/80 border-slate-700';
                  if (index === 0) {
                    badge = '👑';
                    bgCard = 'bg-amber-900/40 border-amber-500/60 ring-2 ring-amber-400';
                  } else if (index === 1) {
                    badge = '🥈';
                    bgCard = 'bg-slate-700/80 border-slate-500';
                  }

                  return (
                    <div key={player.name} className={`flex items-center justify-between p-2 rounded-xl border ${bgCard}`}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base font-bold w-5 text-center">{badge}</span>
                        <span className="text-xl">{player.avatar}</span>
                        <span className={`font-bold text-xs sm:text-sm truncate ${player.isUser ? 'text-yellow-300 underline' : 'text-slate-200'}`}>
                          {player.name} {player.isUser ? '(Toi)' : ''}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-yellow-400 text-xs sm:text-sm shrink-0">{player.score} pts</span>
                    </div>
                  );
                })}
              </div>

              <p className="text-[11px] sm:text-xs text-indigo-300 mt-2 font-medium z-10">
                {finalPodium[0]?.isUser ? 'Victoire magistrale ! La Couronne est à toi 👑' : 'Belle partie !'}
              </p>
            </div>

            <button onClick={() => { playSound('click'); setView('salon-menu'); }} className="w-full bg-indigo-600 hover:bg-indigo-700 py-3 rounded-xl font-bold shadow-lg text-sm box-border">
              Retour au menu principal
            </button>
          </div>
        )}

      </div>
    </div>
  );
}