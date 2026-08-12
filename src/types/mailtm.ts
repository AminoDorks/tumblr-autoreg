export type Account = {
  id: string;
  address: string;
};

export type Domains = {
  'hydra:member': { domain: string }[];
};

export type Messages = {
  'hydra:member': { subject: string; id: string }[];
};

export type Message = {
  text: string;
};
