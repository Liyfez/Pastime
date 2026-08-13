import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { generateSVG } from './svg-generator.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_USERNAME = process.env.GITHUB_USERNAME;
const COLOR_THEME_STR = process.env.COLOR_THEME || '#ebedf0,#9be9a8,#40c463,#30a14e,#216e39';
const COLORS = COLOR_THEME_STR.split(',').map(c => c.trim());

async function fetchContributions(username, token) {
  const query = `
    query($userName:String!) {
      user(login: $userName){
        contributionsCollection {
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
      variables: { userName: username }
    })
  });

  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  if (data.errors) {
    throw new Error(`GraphQL Errors: ${JSON.stringify(data.errors)}`);
  }

  return data.data.user.contributionsCollection.contributionCalendar.weeks;
}

async function main() {
  if (!GITHUB_TOKEN || !GITHUB_USERNAME) {
    console.error('Error: GITHUB_TOKEN and GITHUB_USERNAME must be set in .env or environment variables.');
    process.exit(1);
  }

  if (COLORS.length < 5) {
    console.error('Error: COLOR_THEME must contain at least 5 comma-separated hex colors.');
    process.exit(1);
  }

  console.log(`Fetching contribution data for ${GITHUB_USERNAME}...`);
  try {
    const weeks = await fetchContributions(GITHUB_USERNAME, GITHUB_TOKEN);
    console.log(`Successfully fetched data for ${weeks.length} weeks.`);

    console.log(`Generating SVG with custom colors...`);
    const svg = generateSVG(weeks, COLORS);

    const outputPath = path.join(__dirname, 'activity-graph.svg');
    fs.writeFileSync(outputPath, svg);
    console.log(`Saved customized graph to ${outputPath}`);
    
  } catch (err) {
    console.error('Failed to generate graph:', err.message);
    process.exit(1);
  }
}

main();
