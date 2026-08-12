import { Tor } from 'tor-control-ts';
import { Tumblr } from '@celt_is_god/tumblr';

import { findProxies, parseChallengeUrl, randomMail } from '../util/helpers';
import { poolProxies } from '../util/pools';
import { pool } from '../util/tasks';
import { CONCURRENCIES } from '../constants';
import { cacheSet, initCache } from '../util/cache';
import { Mailtm } from '../lib/mailtm';

export class AutoReg {
  private tor: Tor = new Tor({
    host: process.env.HOST,
    port: process.env.TOR_CONTROL_PORT,
    password: process.env.TOR_CONTROL_PASSWORD,
  });

  private contexts: Tumblr[] = [];
  private domains: string[] = [];

  private setupProxies = async (proxies: string[]): Promise<void> => {
    await this.tor.signalNewnym();
    this.contexts = await poolProxies(proxies);
  };

  private register = async (context: Tumblr): Promise<void> => {
    await pool<string>(
      Array.from({ length: 2 }, () => randomMail(this.domains)),
      async (mail) => {
        const mailtm = new Mailtm(context.proxy);

        try {
          try {
            await mailtm.create(mail);
          } catch {
            console.log(`[${mail}]: failed to create`);
            return;
          }
          const tumblelog = (await context.auth.suggest())[0]!;
          const {
            session: { accessToken, accessTokenSecret },
          } = await context.auth.register({
            email: mail,
            birthDate: '2000-01-01',
            tumblelog,
            password: process.env.ACCOUNTS_PASWORD,
          });

          const intervalId = setInterval(async () => {
            const messageId = (await mailtm.messages())['hydra:member'][0]?.id;
            if (messageId) {
              clearInterval(intervalId);
              const message = await mailtm.message(messageId);

              cacheSet(mail, {
                accessToken,
                accessTokenSecret,
                challengeUrl: parseChallengeUrl(message.text),
              });
              console.log(`[${mail}]: registered as ${tumblelog}`);
            } else {
              return;
            }
          }, 3000);
        } catch (e) {
          console.error(`[${Date.now()}]: failed to register`, e);
        }
      },
      CONCURRENCIES.mail,
    );
  };

  public run = async () => {
    await this.tor.connect();
    await initCache();
    console.log('connected to tor');

    this.domains = await new Mailtm().domains();

    await this.setupProxies(await findProxies());

    await pool<Tumblr>(this.contexts, this.register, CONCURRENCIES.register);
    console.log('registered all accounts');
  };
}
