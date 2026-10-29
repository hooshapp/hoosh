declare module '*.svg' {
  // Metro resolves a bundled asset ID; the isolated Vite preview resolves a local URL.
  const source: number | string;
  export default source;
}
