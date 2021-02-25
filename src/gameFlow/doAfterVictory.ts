import { Clog, LOGLEVEL } from '@fdebijl/clog';
import moment from 'moment-timezone';

import { games } from '../domain/Game';
import { Result } from '../domain/Result';
import { stopGame } from './stopGame';
import { findTweets } from '../twitter/findTweets';
import { cleanStatus } from '../util/cleanStatus';
import { removeDuplicatesFrom } from '../util/removeDuplicatesFrom';
import { sendUncompiledTweet } from '../twitter/sendUncompiledTweet';
import { CONFIG } from '../config';

const clog = new Clog();

export const doAfterVictory = async (): Promise<void> => {
  if (!games.current) {
    clog.log('Tried to run after loss procedure but no game was running!', LOGLEVEL.ERROR);
    return;
  }

  clog.log('Game won', LOGLEVEL.INFO);

  const lastStatus = games.current.statuses[games.current.statuses.length - 1].id_str;
  const tweets = await findTweets(lastStatus);
  const nextGameTime = moment().tz('Europe/Amsterdam').add(CONFIG.GAME_INTERVAL, 'minutes').format('HH:mm');

  if (!tweets || tweets?.length === 0) {
    // Fallback if no tweets are found for whatever reason
    sendUncompiledTweet(`Gewonnen :D\n\nHet woord was: '${games.current?.word.join('')}'\n\nDe volgende ronde start om ${nextGameTime}`, lastStatus);
    return;
  }

  const contributingTweets: ExtendedTweet[] = tweets.filter(tweet => {
    // Only count tweets that added the last correct letter, or the entire word
    return (cleanStatus(tweet.full_text ?? tweet.text as string).substr(0, 1) == games.current?.guessed.letters[games.current.guessed.letters.length - 1] ||
            cleanStatus(tweet.full_text ?? tweet.text as string) == games.current?.guessed.words[games.current?.guessed.words.length - 1]) &&
            tweet.user.screen_name != 'galgjebot';
  });

  // Make sure every user is only counted once
  let users: string[] = [];
  contributingTweets.forEach(tweet => {
    users.push(tweet.user.screen_name);
  });

  users = removeDuplicatesFrom(users);

  let winningPlayers = '';
  users.forEach(user => {
    winningPlayers += `@${user} `;
  })

  sendUncompiledTweet(`Gewonnen :D\n\nHet woord was: '${games.current?.word.join('')}' en is geraden door ${winningPlayers}\n\nDe volgende ronde start om ${nextGameTime}`, lastStatus);

  games.current.result = Result.LOSS

  stopGame();
  return;
}
