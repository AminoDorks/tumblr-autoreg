import { Tumblr } from '@celt_is_god/tumblr';

import { delay } from './helpers';
import { pool } from './tasks';

export const poolProxies = async (rawProxies: string[]): Promise<Tumblr[]> => {
  const contexts: Tumblr[] = [];

  console.log(`got ${rawProxies.length} proxies`);

  await pool<string>(
    rawProxies,
    async (proxy: string) => {
      const tumblr = new Tumblr();
      tumblr.proxy = proxy;

      if (await tumblr.healthcheck()) {
        contexts.push(tumblr);
        console.log(`connected: ${proxy}`);

        return;
      }

      console.log(`connection failed: ${proxy}`);
    },
    Math.floor(rawProxies.length / 2),
  );

  if (!contexts.length) {
    console.log('no proxies connected');
    await delay(1);
  }

  console.log(`connected proxies length: ${contexts.length}`);

  return contexts;
};
