// Game variables
// Exported via this module so we can share the state of the game with multiple files
var WORD, PHASE, GUESSED, OUT, DIFFICULTY;
WORD = "";
PHASE= 0;
GUESSED = {
  LETTERS: [],
  WORDS: []
};
OUT = [];
DIFFICULTY = 0;

module.exports = {
  WORD: WORD,
  PHASE: PHASE,
  GUESSED: GUESSED,
  OUT: OUT,
  DIFFICULTY: DIFFICULTY
}