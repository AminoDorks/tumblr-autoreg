import { file } from 'bun';

import { PATHS, START_TOR_PORT } from '../constants';

export const delay = async (seconds: number): Promise<void> =>
  await new Promise((resolve) => setTimeout(resolve, seconds * 1000));

export const findProxies = async (): Promise<string[]> => {
  const matches = (await file(PATHS.torrc).text())
    .match(/SOCKSPort\s+(\d+)/g)
    ?.filter((port) => Number(port.split(' ')[1]) >= START_TOR_PORT);

  return matches
    ? matches.map((match) => `socks5://127.0.0.1:${match.split(' ')[1]}`)
    : [];
};

export const generateRandomString = (): string =>
  Math.random().toString(36).slice(2);

export const randomMail = (domains: string[]): string =>
  `${generateRandomString()}@${domains[Math.floor(Math.random() * domains.length)]}`;

export const parseChallengeUrl = (text: string): string =>
  text.match(/https?:\/\/[^\s]+/g)![0]!;
