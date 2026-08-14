import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { generateSVG } from './svg-generator.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GITHUB_USERNAME = process.env.GITHUB_USERNAME;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const LIGHT_THEME_STR = process.env.LIGHT_THEME || '#ebedf0,#9be9a8,#40c463,#30a14e,#216e39';
const DARK_THEME_STR = process.env.DARK_THEME || '#161b22,#0e4429,#006d32,#26a641,#39d353';

const lightColors = LIGHT_THEME_STR.split(',').map(c => c.trim());
const darkColors = DARK_THEME_STR.split(',').map(c => c.trim());

function calculatePercentile(sortedArray, percentile) {
  if (sortedArray.length === 0) return 0;
  const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
  return sortedArray[Math.max(0, index)];
}

function assignLevels(weeks) {
  // Extract all non-zero contribution counts
  let counts = [];
  for (const week of weeks) {
    for (const day of week.contributionDays) {
      if (day.contributionCount > 0) {
        counts.push(day.contributionCount);
      }
    }
  }

  // Sort ascending
  counts.sort((a, b) => a - b);

  // Find quartiles (roughly how GitHub buckets them)
  const p25 = calculatePercentile(counts, 25);
  const p50 = calculatePercentile(counts, 50);
  const p75 = calculatePercentile(counts, 75);

  // Assign level based on percentiles
  for (const week of weeks) {
    for (const day of week.contributionDays) {
      const count = day.contributionCount;
      if (count === 0) {
        day.level = 0;
      } else if (count <= p25) {
        day.level = 1;
      } else if (count <= p50) {
        day.level = 2;
      } else if (count <= p75) {
        day.level = 3;
      } else {
        day.level = 4;
      }
    }
  }
}

async function fetchContributionsFromGraphQL(username, token) {
  const currentYear = new Date().getUTCFullYear();
  const from = `${currentYear}-01-01T00:00:00Z`;
  const to = `${currentYear}-12-31T23:59:59Z`;

  const query = `
    query($userName:String!, $from: DateTime, $to: DateTime) {
      user(login: $userName){
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
                date
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: { userName: username, from, to }
    })
  });

  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  if (data.errors) {
    throw new Error(`GraphQL Errors: ${JSON.stringify(data.errors)}`);
  }

  const weeks = data.data.user.contributionsCollection.contributionCalendar.weeks;
  
  // Calculate and attach the custom level to each day
  assignLevels(weeks);
  
  return weeks;
}

async function main() {
  if (!GITHUB_USERNAME || !GITHUB_TOKEN) {
    console.error('Error: GITHUB_USERNAME and GITHUB_TOKEN must be set in .env or environment variables.');
    process.exit(1);
  }

  if (lightColors.length < 5 || darkColors.length < 5) {
    console.error('Error: LIGHT_THEME and DARK_THEME must contain at least 5 comma-separated hex colors.');
    process.exit(1);
  }

  const themeConfig = {
    mode: process.env.THEME_MODE || 'solid',
    start: process.env.GRADIENT_START,
    end: process.env.GRADIENT_END,
    x1: process.env.GRADIENT_X1,
    y1: process.env.GRADIENT_Y1,
    x2: process.env.GRADIENT_X2,
    y2: process.env.GRADIENT_Y2,
    lightBg: process.env.BG_EMPTY_LIGHT,
    darkBg: process.env.BG_EMPTY_DARK
  };

  console.log(`Fetching true contribution data for ${GITHUB_USERNAME} (Current Year)...`);
  try {
    const weeks = await fetchContributionsFromGraphQL(GITHUB_USERNAME, GITHUB_TOKEN);
    console.log(`Successfully fetched data for ${weeks.length} weeks.`);

    console.log(`Generating adaptive SVG with custom themes...`);
    const svg = generateSVG(weeks, lightColors, darkColors, themeConfig);

    const outputPath = path.join(__dirname, 'activity-graph.svg');
    fs.writeFileSync(outputPath, svg);
    console.log(`Saved customized graph to ${outputPath}`);
    
  } catch (err) {
    console.error('Failed to generate graph:', err.message);
    process.exit(1);
  }
}

main();
