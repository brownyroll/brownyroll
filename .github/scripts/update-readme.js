const fs = require("fs");
const axios = require("axios");
const dayjs = require("dayjs");

const readmePath = "README.md";

// Load README
let readme = fs.readFileSync(readmePath, "utf8");

async function fetchWakaTime() {
  const apiKey = process.env.WAKATIME_API_KEY;
  const res = await axios.get(`https://wakatime.com/api/v1/users/current/stats/last_7_days`, {
    headers: { Authorization: `Basic ${Buffer.from(apiKey).toString("base64")}` }
  });

  const data = res.data.data.languages
    .slice(0, 5)
    .map((lang) => `- **${lang.name}**: ${lang.text}`)
    .join("\n");

  return `\n\n📊 **WakaTime stats (last 7 days)**\n\n${data}`;
}

function incrementUpdateCount(content) {
  const match = content.match(/<!--UPDATE_COUNT-->(\d+)<!--END_UPDATE_COUNT-->/);
  const currentCount = match ? parseInt(match[1]) : 0;
  return content.replace(/<!--UPDATE_COUNT-->.*<!--END_UPDATE_COUNT-->/, `<!--UPDATE_COUNT-->${currentCount + 1}<!--END_UPDATE_COUNT-->`);
}

function insertTimestamp(content) {
  const timestamp = dayjs().format("DD MMMM YYYY HH:mm:ss");
  return content.replace(/<!--LAST_UPDATED-->.*<!--END_LAST_UPDATED-->/, `<!--LAST_UPDATED-->${timestamp}<!--END_LAST_UPDATED-->`);
}

(async () => {
  const waka = await fetchWakaTime();

  readme = readme.replace(
    /<!--START_SECTION:waka-->[\s\S]*<!--END_SECTION:waka-->/,
    `<!--START_SECTION:waka-->${waka}\n<!--END_SECTION:waka-->`
  );

  readme = incrementUpdateCount(readme);
  readme = insertTimestamp(readme);

  fs.writeFileSync(readmePath, readme);

  const exec = require("child_process").execSync;
  exec("git config user.name github-actions");
  exec("git config user.email github-actions@github.com");
  exec("git remote set-url origin https://x-access-token:" + process.env.GITHUB_TOKEN + "@github.com/brownyroll/brownyroll.git");
  exec("git add README.md");
  exec('git commit -m "Update README stats" || echo "No changes to commit"');
  exec("git push");
})();
