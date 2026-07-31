import fs from "node:fs";
import path from "node:path";
import satori from "satori";
import { h } from "./h.mjs";

const USERNAME = process.env.GH_USERNAME;
const TOKEN = process.env.GH_TOKEN;
const OUT_DIR = process.env.OUT_DIR || "assets";

if (!USERNAME) throw new Error("Missing GH_USERNAME env var");
if (!TOKEN) throw new Error("Missing GH_TOKEN env var");

const API = "https://api.github.com";
const headers = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: "application/vnd.github+json",
  "User-Agent": `${USERNAME}-readme-aura-lite`,
};

// ---------- Catppuccin Mocha palette (same as ilyamiro's card) ----------
const palette = {
  base: "#1e1e2e",
  mantle: "#181825",
  crust: "#11111b",
  surface: "#313244",
  text: "#cdd6f4",
  blue: "#89b4fa",
  mauve: "#cba6f7",
  red: "#f38ba8",
  green: "#a6e3a1",
  yellow: "#f9e2af",
  teal: "#94e2d5",
  rosewater: "#f5e0dc",
};

// ---------- GitHub data fetching ----------
async function ghJson(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GitHub API ${res.status} for ${url}`);
  return res.json();
}

async function getAllRepos(username) {
  let page = 1;
  const repos = [];
  for (;;) {
    const batch = await ghJson(`${API}/users/${username}/repos?per_page=100&page=${page}`);
    repos.push(...batch);
    if (batch.length < 100) break;
    page += 1;
  }
  return repos;
}

async function searchCount(query) {
  try {
    const data = await ghJson(`${API}/search/issues?q=${encodeURIComponent(query)}&per_page=1`);
    return data.total_count ?? 0;
  } catch {
    return null;
  }
}

async function getCommitsLastYear(username) {
  const since = new Date();
  since.setFullYear(since.getFullYear() - 1);
  try {
    const data = await ghJson(
      `${API}/search/commits?q=${encodeURIComponent(
        `author:${username} author-date:>=${since.toISOString().slice(0, 10)}`
      )}&per_page=1`
    );
    return data.total_count ?? null;
  } catch {
    return null;
  }
}

async function fetchStats(username) {
  const [user, repos, prs, issues, commits] = await Promise.all([
    ghJson(`${API}/users/${username}`),
    getAllRepos(username),
    searchCount(`author:${username} type:pr`),
    searchCount(`author:${username} type:issue`),
    getCommitsLastYear(username),
  ]);
  const stars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
  return {
    name: user.name || username,
    avatar: user.avatar_url,
    followers: user.followers,
    publicRepos: user.public_repos,
    stars,
    prs,
    issues,
    commits,
  };
}

// ---------- UI building blocks ----------
const fmt = (n) => (n === null || n === undefined ? "—" : n.toLocaleString("en-US"));

function ProfileCard({ username, tagline, avatar, tags }) {
  return h(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "560px",
        height: "230px",
        background: `linear-gradient(135deg, ${palette.base} 0%, ${palette.mantle} 60%, ${palette.crust} 100%)`,
        borderRadius: "16px",
        border: `1px solid ${palette.surface}`,
        gap: "18px",
        position: "relative",
      },
    },
    h("div", {
      style: {
        display: "flex",
        position: "absolute",
        top: "0",
        left: "0",
        right: "0",
        height: "3px",
        background: `linear-gradient(90deg, ${palette.blue} 0%, ${palette.mauve} 50%, ${palette.red} 100%)`,
      },
    }),
    h(
      "div",
      { style: { display: "flex", alignItems: "center", gap: "20px" } },
      h(
        "div",
        {
          style: {
            display: "flex",
            width: "76px",
            height: "76px",
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${palette.blue}, ${palette.mauve}, ${palette.red})`,
            alignItems: "center",
            justifyContent: "center",
          },
        },
        h(
          "div",
          {
            style: {
              display: "flex",
              width: "70px",
              height: "70px",
              borderRadius: "50%",
              overflow: "hidden",
              border: `2px solid ${palette.base}`,
              background: palette.surface,
            },
          },
          avatar ? h("img", { src: avatar, width: 70, height: 70 }) : null
        )
      ),
      h(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: "5px" } },
        h(
          "span",
          {
            style: {
              fontSize: "34px",
              fontWeight: 700,
              color: palette.text,
              letterSpacing: "-1px",
            },
          },
          username
        ),
        h(
          "span",
          {
            style: {
              fontSize: "13px",
              color: palette.blue,
              fontWeight: 500,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
            },
          },
          tagline
        )
      )
    ),
    h(
      "div",
      { style: { display: "flex", gap: "8px" } },
      ...tags.map(({ tag, color }) =>
        h(
          "div",
          {
            key: tag,
            style: {
              display: "flex",
              padding: "4px 14px",
              borderRadius: "999px",
              background: `${color}1F`,
              border: `1px solid ${color}`,
              color,
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.8px",
              textTransform: "uppercase",
            },
          },
          tag
        )
      )
    )
  );
}

function StatRow({ icon, label, value, color }) {
  return h(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        padding: "9px 0",
        borderBottom: `1px solid ${palette.surface}`,
      },
    },
    h(
      "div",
      { style: { display: "flex", alignItems: "center", gap: "10px" } },
      h("span", { style: { fontSize: "15px", color } }, icon),
      h("span", { style: { fontSize: "14px", color: palette.text } }, label)
    ),
    h(
      "span",
      { style: { fontSize: "14px", fontWeight: 700, color: palette.rosewater } },
      value
    )
  );
}

function StatsCard({ username, stats }) {
  const rows = [
    { icon: "★", label: "Total Stars Earned", value: fmt(stats.stars), color: palette.yellow },
    { icon: "⟲", label: "Total Commits (last year)", value: fmt(stats.commits), color: palette.teal },
    { icon: "⑂", label: "Total PRs", value: fmt(stats.prs), color: palette.mauve },
    { icon: "●", label: "Total Issues", value: fmt(stats.issues), color: palette.red },
    { icon: "◫", label: "Public Repos", value: fmt(stats.publicRepos), color: palette.blue },
    { icon: "♥", label: "Followers", value: fmt(stats.followers), color: palette.green },
  ];

  return h(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        width: "560px",
        height: "340px",
        background: `linear-gradient(135deg, ${palette.base} 0%, ${palette.mantle} 60%, ${palette.crust} 100%)`,
        borderRadius: "16px",
        border: `1px solid ${palette.surface}`,
        padding: "28px 32px",
        position: "relative",
      },
    },
    h("div", {
      style: {
        display: "flex",
        position: "absolute",
        top: "0",
        left: "0",
        right: "0",
        height: "3px",
        background: `linear-gradient(90deg, ${palette.blue} 0%, ${palette.mauve} 50%, ${palette.red} 100%)`,
      },
    }),
    h(
      "span",
      {
        style: {
          display: "flex",
          fontSize: "19px",
          fontWeight: 700,
          color: palette.text,
          marginBottom: "16px",
        },
      },
      `${username}'s GitHub Stats`
    ),
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", width: "100%" } },
      ...rows.map((r) => StatRow(r))
    )
  );
}

// ---------- main ----------
async function main() {
  console.log(`Fetching GitHub data for ${USERNAME}...`);
  const stats = await fetchStats(USERNAME);

  console.log("Loading fonts...");
  // typeface-roboto ships true static (non-variable) .woff files per weight —
  // satori cannot parse variable-font `fvar` tables reliably, and Google
  // Fonts no longer reliably serves .ttf via the legacy-User-Agent trick,
  // so we bundle a known-good static font via npm instead of fetching one
  // over the network at build time.
  const fontDir = path.join(
    path.dirname(new URL(import.meta.url).pathname),
    "..",
    "node_modules",
    "typeface-roboto",
    "files"
  );
  const regular = fs.readFileSync(path.join(fontDir, "roboto-latin-400.woff"));
  const bold = fs.readFileSync(path.join(fontDir, "roboto-latin-700.woff"));

  const fonts = [
    { name: "Inter", data: regular, weight: 400, style: "normal" },
    { name: "Inter", data: bold, weight: 700, style: "normal" },
  ];

  const tags = [
    { tag: "JavaScript", color: palette.red },
    { tag: "React", color: palette.mauve },
    { tag: "Python", color: palette.yellow },
    { tag: "Django", color: palette.green },
    { tag: "Docker", color: palette.blue },
    { tag: "Linux", color: palette.teal },
    { tag: "Next.js", color: palette.rosewater},
    { tag: "TypeScript", color: palette.blue },
    { tag: "PostgreSQL", color: palette.green },
  ];

  console.log("Rendering profile card...");
  const profileSvg = await satori(
    ProfileCard({
      username: stats.name,
      tagline: "Software Engineer",
      avatar: stats.avatar,
      tags,
    }),
    { width: 860, height: 230, fonts }
  );

  console.log("Rendering stats card...");
  const statsSvg = await satori(StatsCard({ username: USERNAME, stats }), {
    width: 560,
    height: 340,
    fonts,
  });

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, "profile-card.svg"), profileSvg, "utf8");
  fs.writeFileSync(path.join(OUT_DIR, "stats-card.svg"), statsSvg, "utf8");
  console.log(`Wrote ${OUT_DIR}/profile-card.svg and ${OUT_DIR}/stats-card.svg`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
