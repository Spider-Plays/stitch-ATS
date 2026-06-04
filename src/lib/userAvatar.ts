/** Default profile image when the user has not uploaded one. */
export function getUserAvatarUrl(name: string, avatar?: string | null): string {
  if (avatar?.trim()) return avatar.trim()
  const encoded = encodeURIComponent((name || 'User').trim())
  return `https://ui-avatars.com/api/?name=${encoded}&background=0e7490&color=fff&size=128&bold=true`
}
