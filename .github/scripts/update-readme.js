const fs = require("fs");
const axios = require("axios");
const dayjs = require("dayjs");
const path = require("path");
require('dayjs/locale/th');

// Load config
const config = {
  timezone: 'Asia/Bangkok',
  utc: '+7',
  waka_activity: 'https://wakatime.com/share/@896383b6-c21d-4862-8145-207435563b89/e0758256-17da-4c6d-bcec-4d87a784e127.json',
  waka_languages: 'https://wakatime.com/share/@896383b6-c21d-4862-8145-207435563b89/8e3156ee-acfd-41a7-9207-52919551d3ca.json',
  waka_useeditor: 'https://wakatime.com/share/@896383b6-c21d-4862-8145-207435563b89/13b15f50-5984-4c14-a42e-587c46ae57a2.json',
  waka_os: 'https://wakatime.com/share/@896383b6-c21d-4862-8145-207435563b89/40444d97-4a40-47ce-8cc1-561642a6baca.json',
  empty: "░",
  use: "█",
  techStack: 'https://skillicons.dev/icons?i=',
  lang: "html,css,js,ts,react,nextjs,nodejs,vue,php,laravel,dotnet,django,tailwind,bootstrap,express,arduino,mysql,sqlite,mongodb,nginx,docker,git,linux,figma,postman,astro,bash,bun,cloudflare,discord,discordjs"
};

const readmePath = path.resolve(__dirname, "../../README.md");

if (!fs.existsSync(readmePath)) {
  throw new Error(`README.md not found at ${readmePath}`);
}


// Create progress bar
function createProgressBar(percentage, length = 25) {
  const filled = Math.round((percentage / 100) * length);
  const empty = length - filled;
  return config.use.repeat(filled) + config.empty.repeat(empty);
}

// Format time
function formatTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours} hr${hours > 1 ? 's' : ''} ${minutes} min${minutes !== 1 ? 's' : ''}`;
  } else {
    return `${minutes} min${minutes !== 1 ? 's' : ''}`;
  }
}

// Fetch WakaTime data
async function fetchWakaTimeData() {
  try {
    const [languagesRes, editorsRes, osRes] = await Promise.all([
      axios.get(config.waka_languages),
      axios.get(config.waka_useeditor),
      axios.get(config.waka_os)
    ]);

    return {
      languages: languagesRes.data.data || [],
      editors: editorsRes.data.data || [],
      os: osRes.data.data || []
    };
  } catch (error) {
    console.error('Error fetching WakaTime data:', error);
    return { languages: [], editors: [], os: [] };
  }
}

// Generate stats sections
function generateLanguagesSection(languages) {
  if (!languages.length) return '';
  
  const total = languages.reduce((sum, lang) => sum + lang.total_seconds, 0);
  
  return languages.slice(0, 5).map(lang => {
    const percentage = total > 0 ? (lang.total_seconds / total * 100) : 0;
    const progressBar = createProgressBar(percentage);
    const timeText = formatTime(lang.total_seconds);
    
    return `${lang.name} ${timeText} ${progressBar} ${percentage.toFixed(2)} %`;
  }).join('\n');
}

function generateEditorsSection(editors) {
  if (!editors.length) return '';
  
  const total = editors.reduce((sum, editor) => sum + editor.total_seconds, 0);
  
  return editors.slice(0, 3).map(editor => {
    const percentage = total > 0 ? (editor.total_seconds / total * 100) : 0;
    const progressBar = createProgressBar(percentage);
    const timeText = formatTime(editor.total_seconds);
    
    return `${editor.name} ${timeText} ${progressBar} ${percentage.toFixed(2)} %`;
  }).join('\n');
}

function generateOSSection(osData) {
  if (!osData.length) return '';
  
  const total = osData.reduce((sum, os) => sum + os.total_seconds, 0);
  
  return osData.map(os => {
    const percentage = total > 0 ? (os.total_seconds / total * 100) : 0;
    const progressBar = createProgressBar(percentage);
    const timeText = formatTime(os.total_seconds);
    
    return `${os.name} ${timeText} ${progressBar} ${percentage.toFixed(2)} %`;
  }).join('\n');
}

// Generate complete WakaTime stats
async function generateWakaTimeStats() {
  const data = await fetchWakaTimeData();
  
  const languagesSection = generateLanguagesSection(data.languages);
  const editorsSection = generateEditorsSection(data.editors);
  const osSection = generateOSSection(data.os);
  
  let stats = '';
  
  if (languagesSection) {
    stats += `💬 Programming Languages:\n${languagesSection}\n`;
  }
  
  if (editorsSection) {
    stats += `\n🔥 Editors:\n${editorsSection}\n`;
  }
  
  if (osSection) {
    stats += `\n💻 Operating System:\n${osSection}`;
  }
  
  return stats;
}

// Generate tech stack section
function generateTechStack() {
  const techStackUrl = `${config.techStack}${config.lang}`;
  return `\n<p align="center">\n  <img src="${techStackUrl}" alt="Tech Stack" />\n</p>`;
}

function incrementUpdateCount(content) {
  const match = content.match(/<!--UPDATE_COUNT-->(\d+)<!--END_UPDATE_COUNT-->/);
  const currentCount = match ? parseInt(match[1]) : 0;
  return content.replace(
    /<!--UPDATE_COUNT-->.*<!--END_UPDATE_COUNT-->/,
    `<!--UPDATE_COUNT-->${currentCount + 1}<!--END_UPDATE_COUNT-->`
  );
}

function insertTimestamp(content) {
  const now = new Date();
  const thaiTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  const timestamp = dayjs(thaiTime).format("DD MMMM YYYY HH:mm:ss");
  return content.replace(
    /<!--LAST_UPDATED-->.*<!--END_LAST_UPDATED-->/,
    `<!--LAST_UPDATED-->${timestamp} (UTC${config.utc})<!--END_LAST_UPDATED-->`
  );
}

// Main function
(async () => {
  try {
    let readme = fs.readFileSync(readmePath, "utf8");
    
    // Generate WakaTime stats
    const wakaStats = await generateWakaTimeStats();
    
    // Generate tech stack
    const techStack = generateTechStack();
    
    // Update sections
    readme = readme.replace(
      /<!--START_SECTION:waka-->[\s\S]*<!--END_SECTION:waka-->/,
      `<!--START_SECTION:waka-->\n\`\`\`text\n${wakaStats}\n\`\`\`\n<!--END_SECTION:waka-->`
    );
    
    readme = readme.replace(
      /<!--START_SECTION:tech-->[\s\S]*<!--END_SECTION:tech-->/,
      `<!--START_SECTION:tech-->${techStack}\n<!--END_SECTION:tech-->`
    );
    
    // Update metadata
    readme = incrementUpdateCount(readme);
    readme = insertTimestamp(readme);
    
    // Write updated README
    fs.writeFileSync(readmePath, readme);
    
    // Git operations
    const exec = require("child_process").execSync;
    exec("git config user.name bbwny");
    exec("git config user.email bbwny@users.noreply.github.com");
    exec("git remote set-url origin https://x-access-token:" + process.env.GITHUB_TOKEN + "@github.com/brownyrollz-studio/brownyroll.git");
    exec("git add README.md");
    exec('git commit -m "📊 Update README stats" || echo "No changes to commit"');
    exec("git push");
    
    console.log('✅ README updated successfully!');
  } catch (error) {
    console.error('❌ Error updating README:', error);
    process.exit(1);
  }
})();