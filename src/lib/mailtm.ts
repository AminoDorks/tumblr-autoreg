// fuck this file

import { fetch } from 'netbun';
import { generateRandomString } from '../util/helpers';
import type { Account, Domains, Message, Messages } from '../types/mailtm';

export class Mailtm {
  private url: string = 'https://api.mail.tm';
  private proxy?: string;
  private token?: string;

  constructor(proxy?: string) {
    this.proxy = proxy;
  }

  public domains = async (): Promise<string[]> =>
    (
      (await (
        await fetch(`${this.url}/domains`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      ).json()) as Domains
    )['hydra:member'].map((domain) => domain.domain);

  public create = async (
    address: string,
  ): Promise<{ account: Account; password: string }> => {
    const password = generateRandomString();
    const account = (await (
      await fetch(`${this.url}/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          password,
        }),
        proxy: this.proxy,
      })
    ).json()) as Account;

    this.token = await this.login(account.address, password);
    return { account, password };
  };

  public login = async (address: string, password: string): Promise<string> =>
    (
      (await (
        await fetch(`${this.url}/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            address,
            password,
          }),
          proxy: this.proxy,
        })
      ).json()) as { token: string }
    ).token;

  public messages = async (): Promise<Messages> =>
    (await (
      await fetch(`${this.url}/messages?page=1`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        proxy: this.proxy,
      })
    ).json()) as Messages;

  public message = async (id: string): Promise<Message> =>
    (await (
      await fetch(`${this.url}/messages/${id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        proxy: this.proxy,
      })
    ).json()) as Message;
}
