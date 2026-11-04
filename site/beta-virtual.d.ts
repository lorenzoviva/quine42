// The modules `server/betaGuide.ts` makes when the site is built (T244, ADR-0131).

declare module 'virtual:quine-istruzioni' {
  export const parts: { id: string; md: string }[];
}

declare module 'virtual:quine-istruzioni-presenti' {
  export const guidePresent: boolean;
}
