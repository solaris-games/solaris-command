export type FrontendConfig = {
  baseUrl: string;
  socketUrl: string;
  googleClientId: string;
  discordClientId: string;
  devAuthEnabled: boolean;
  error: Error | null; // for maintenance etc.
};
