import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import * as cheerio from 'cheerio';
import { generateSVG } from './svg-generator.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GITHUB_USERNAME = process.env.GITHUB_USERNAME;

const LIGHT_THEME_STR = process.env.LIGHT_THEME || '#ebedf0,#9be9a8,#40c463,#30a14e,#216e39';
const DARK_THEME_STR = process.env.DARK_THEME || '#161b22,#0e4429,#006d32,#26a641,#39d353';

const lightColors = LIGHT_THEME_STR.split(',').map(c => c.trim());
const darkColors = DARK_THEME_STR.split(',').map(c => c.trim());

async function fetchContributionsFromHTML(username) {
  const url = `https://github.com/users/${username}/contributions`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch GitHub profile for ${username} (HTTP ${response.status})`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const weeks = [];
  
  $('td.ContributionCalendar-day').each((i, el) => {
    const date = $(el).attr('data-date');
    const levelAttr = $(el).attr('data-level');
    const ixAttr = $(el).attr('data-ix');

    if (date && ixAttr !== undefined && levelAttr !== undefined) {
      const weekIndex = parseInt(ixAttr, 10);
      const level = parseInt(levelAttr, 10);
      
      if (!weeks[weekIndex]) {
        weeks[weekIndex] = { contributionDays: [] };
      }
      
      weeks[weekIndex].contributionDays.push({
        date,
        level
      });
    }
  });
  
  return weeks.filter(Boolean);
}

async function main() {
  if (!GITHUB_USERNAME) {
    console.error('Error: GITHUB_USERNAME must be set in .env or environment variables.');
    process.exit(1);
  }

  if (lightColors.length < 5 || darkColors.length < 5) {
    console.error('Error: LIGHT_THEME and DARK_THEME must contain at least 5 comma-separated hex colors.');
    process.exit(1);
  }

  console.log(`Fetching contribution HTML for ${GITHUB_USERNAME}...`);
  try {
    const weeks = await fetchContributionsFromHTML(GITHUB_USERNAME);
    console.log(`Successfully fetched data for ${weeks.length} weeks.`);

    console.log(`Generating adaptive SVG with custom themes...`);
    const svg = generateSVG(weeks, lightColors, darkColors);

    const outputPath = path.join(__dirname, 'activity-graph.svg');
    fs.writeFileSync(outputPath, svg);
    console.log(`Saved customized graph to ${outputPath}`);
    
  } catch (err) {
    console.error('Failed to generate graph:', err.message);
    process.exit(1);
  }
}

main();
