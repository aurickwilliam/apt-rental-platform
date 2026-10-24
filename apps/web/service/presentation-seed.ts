/** Fresh request-owned presentation only; never a cache or mutation authority. */
export interface PresentationSeed<T> {
  authUserId: string;
  profileId: string;
  resourceId?: string;
  data: T;
  error: string | null;
  renderedAt: string;
}

export function matchesPresentationSeed<T>(seed: PresentationSeed<T> | undefined, identity: { authUserId: string | null | undefined; generation: number }, resourceId?: string) {
  return !!seed && identity.authUserId === seed.authUserId && identity.generation === 0 && seed.resourceId === resourceId;
}
