export type BiteonSwitchConfig = {
  apiKey: string;
  appId: string;
  callbackUrl: string;
  hostedLoginUrl: string | null;
  apiBaseUrl: string | null;
  mock: boolean;
};

export type HostedLoginParams = {
  state: string;
  /** Optional hint for mock / analytics — not trusted as identity */
  whatsappHint?: string;
};

export type VerifyCallbackInput = {
  token: string;
  state: string;
};

export type VerifySuccess = {
  ok: true;
  whatsappNumber: string;
  providerRef?: string;
};

export type VerifyFailure = {
  ok: false;
  reason: "invalid" | "unavailable" | "config";
};

export type VerifyResult = VerifySuccess | VerifyFailure;
