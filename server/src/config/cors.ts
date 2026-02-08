export const ALLOWED_ORIGINS: (string | RegExp)[] = [
  "http://localhost:5173", // Frontend dev local (prototype)
  "https://command.solaris.games",
  /^http:\/\/192\.168\.\d+\.\d+:\d+$/, // Allow local network access for testing
  /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/, // Allow local network access for testing
];
