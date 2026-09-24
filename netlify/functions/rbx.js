const UA = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0", "Accept": "application/json" };

async function jget(url) {
  const r = await fetch(url, { headers: UA });
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}
async function jpost(url, payload) {
  const r = await fetch(url, {
    method: "POST",
    headers: Object.assign({}, UA, { "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}

async function robloxProfile(username) {
  const lookup = await jpost("https://users.roblox.com/v1/usernames/users", { usernames: [username] });
  const data = lookup.data || [];
  if (!data.length) return { ok: false, message: "User '" + username + "' not found!" };
  const userId = data[0].id;

  const [profile, thumbR, primaryR, friendsR, followersR, followingR, badgesR, avatarR] = await Promise.allSettled([
    jget("https://users.roblox.com/v1/users/" + userId),
    jget("https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=" + userId + "&size=150x150&format=Png&isCircular=false"),
    jget("https://groups.roblox.com/v1/users/" + userId + "/groups/primary/role"),
    jget("https://friends.roblox.com/v1/users/" + userId + "/friends/count"),
    jget("https://friends.roblox.com/v1/users/" + userId + "/followers/count"),
    jget("https://friends.roblox.com/v1/users/" + userId + "/following/count"),
    jget("https://accountinformation.roblox.com/v1/users/" + userId + "/roblox-badges"),
    jget("https://avatar.roblox.com/v2/avatar/users/" + userId + "/avatar"),
  ]);

  const p = profile.status === "fulfilled" ? profile.value : {};
  const thumbItems = thumbR.status === "fulfilled" ? (thumbR.value.data || []) : [];
  const primary = primaryR.status === "fulfilled" ? primaryR.value : null;
  const badgesRaw = badgesR.status === "fulfilled" ? badgesR.value : [];
  const badges = Array.isArray(badgesRaw) ? badgesRaw : (badgesRaw.robloxBadges || []);
  const avatar = avatarR.status === "fulfilled" ? avatarR.value : {};

  return {
    ok: true,
    userId,
    username: p.name,
    displayName: p.displayName,
    description: p.description || "None",
    created: (p.created || "").slice(0, 10),
    isBanned: !!p.isBanned,
    hasVerifiedBadge: !!p.hasVerifiedBadge,
    thumbnail: thumbItems.length ? thumbItems[0].imageUrl : null,
    primaryGroup: primary && primary.group ? primary.group.name : null,
    friends: friendsR.status === "fulfilled" ? friendsR.value.count : 0,
    followers: followersR.status === "fulfilled" ? followersR.value.count : 0,
    following: followingR.status === "fulfilled" ? followingR.value.count : 0,
    avatarType: avatar.playerAvatarType || null,
    badges: badges.slice(0, 5).map((b) => b.name),
    badgeTotal: badges.length,
    profileUrl: "https://www.roblox.com/users/" + userId + "/profile",
  };
}

exports.handler = async function (event) {
  const username = ((event.queryStringParameters || {}).username || "").trim();
  if (!username) {
    return { statusCode: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ok: false, message: "username required" }) };
  }
  try {
    const result = await robloxProfile(username);
    return { statusCode: 200, headers: { "Content-Type": "application/json; charset=utf-8" }, body: JSON.stringify(result) };
  } catch (e) {
    return { statusCode: 502, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ok: false, message: String(e) }) };
  }
};
