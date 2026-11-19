/** Lifecycle support is separate from the full selection/protection product port. */
export type NativeOwnerSessionPort = {
  begin(namespace: string, userID: string): Promise<string>;
  end(token: string): Promise<void>;
};
export const nativeOwnerSession: NativeOwnerSessionPort | null = null;
