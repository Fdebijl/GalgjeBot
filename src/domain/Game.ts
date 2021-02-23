import { db } from '../db/connect';

export class Game {
  /** The word that players have to guess this game. The letters in this word are split into an array for easy processing. */
  public word: string[];
  /** Current phase of the game. For each wrong guess this is incremented by one, effectively building the gallow. */
  public phase: number;
  /** Previously guessed letters and words this game. */
  public guessed: {
    letters: string[];
    words: string[];
  } = {letters: [], words: []}
  /** Display of blank slots or correctly guessed letters */
  public out: string[];
  /** Difficulty for this game (i.e. the maximal word length - shorter words are generally harder). */
  public difficulty: number;
  /** Whether the game is currently in progress. No game should be started while one is already in progress. */
  public inProgress: boolean;
  /** Number for this game */
  public gameNumber: number;

  constructor(word: string, difficulty: number, restoredGame?: Game) {
    if (restoredGame) {
      this.word = word.split('');
      this.phase = restoredGame.phase;
      this.guessed = restoredGame.guessed;
      this.out = restoredGame.out;
      this.difficulty = restoredGame.difficulty;
      this.inProgress = restoredGame.inProgress;
      this.gameNumber = restoredGame.gameNumber;
    } else {
      this.word = word.split('');
      this.phase = 0;
      this.guessed.letters = [];
      this.guessed.words = [];
      this.out = [];
      this.difficulty = difficulty;
      this.inProgress = true;

      // Start with underscores for the word display in the tweet
      for (let i = 0; i < this.word.length; i++) {
        this.out.push('_');
      }

      // Fallback game number
      this.gameNumber = 1;
      db.collection('games').find({}).sort({'gameNumber': -1}).toArray().then(games => {
        if (games && games.length > 0) {
          this.gameNumber = (games[0] as Game).gameNumber + 1;
        }
      });
    }
  }

  async persist(): Promise<void> {
    const query = { gameNumber: this.gameNumber };
    const update = { $set: {
      word: this.word,
      phase: this.phase,
      guessed: this.guessed,
      out: this.out,
      difficulty: this.difficulty,
      inProgress: this.inProgress,
      gameNumber: this.gameNumber
    }};
    const options = { upsert: true };

    await db.collection('games').updateOne(query, update, options);
    return;
  }

  static mock(): Game {
    return new Game('sjon', 6);
  }
}

// We use this object as a namespaces, since top-level exports cant be mutated - this way we can overwrite games.current
export const games: {
  current: Game | undefined;
  previous: Game | undefined;
} = {
  current: undefined,
  previous: undefined
}
