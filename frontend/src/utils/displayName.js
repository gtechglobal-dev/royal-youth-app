export function displayName(user) {
  if (!user) return "";
  if (user.nickname) return user.nickname;
  return [user.firstname, user.surname].filter(Boolean).join(" ");
}

export function displayNameFull(user) {
  if (!user) return "";
  const name = [user.firstname, user.surname].filter(Boolean).join(" ");
  if (user.nickname) return `${name} (${user.nickname})`;
  return name;
}

export function displayNameShort(user) {
  if (!user) return "";
  return user.firstname || "";
}
