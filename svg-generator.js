export function generateSVG(weeks, lightColors, darkColors) {
  const cellSize = 10;
  const cellGap = 4;
  
  // Padding for labels
  const paddingX = 30; // left padding for day labels
  const paddingY = 20; // top padding for month labels

  // GitHub contribution graph has up to 53 weeks, 7 days a week
  const width = 53 * (cellSize + cellGap) + paddingX + 10;
  const height = 7 * (cellSize + cellGap) + paddingY + 10;

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let monthLabels = '';
  let lastMonth = -1;

  let rects = '';

  weeks.forEach((week, weekIndex) => {
    const x = weekIndex * (cellSize + cellGap);
    
    // Check for month change
    if (week.contributionDays.length > 0) {
      const firstDayDate = new Date(week.contributionDays[0].date);
      const currentMonth = firstDayDate.getUTCMonth();
      if (currentMonth !== lastMonth && weekIndex < 52) { // Don't put a label on the very last week if it cuts off
        monthLabels += `<text class="label" x="${x}" y="-8">${months[currentMonth]}</text>\n`;
        lastMonth = currentMonth;
      }
    }

    week.contributionDays.forEach((day) => {
      // GitHub week starts on Sunday (0)
      const dayOfWeek = new Date(day.date).getUTCDay();
      const y = dayOfWeek * (cellSize + cellGap);
      const level = day.level;
      const title = `Level ${level} on ${day.date}`;

      rects += `    <rect class="day level-${level}" x="${x}" y="${y}" width="${cellSize}" height="${cellSize}">\n`;
      rects += `      <title>${title}</title>\n`;
      rects += `    </rect>\n`;
    });
  });

  // Day labels (Mon, Wed, Fri) which correspond to days 1, 3, 5
  // Y position = (dayIndex * 14) + ~9 for text baseline alignment
  const dayLabels = `
    <text class="label" x="-25" y="${1 * (cellSize + cellGap) + 9}">Mon</text>
    <text class="label" x="-25" y="${3 * (cellSize + cellGap) + 9}">Wed</text>
    <text class="label" x="-25" y="${5 * (cellSize + cellGap) + 9}">Fri</text>
  `;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n`;
  svg += `  <style>\n`;
  svg += `    .day { rx: 2; ry: 2; shape-rendering: geometricPrecision; }\n`;
  svg += `    .label { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 10px; fill: #768390; }\n`;
  
  // Default (Light theme)
  svg += `    .level-0 { fill: ${lightColors[0]}; }\n`;
  svg += `    .level-1 { fill: ${lightColors[1]}; }\n`;
  svg += `    .level-2 { fill: ${lightColors[2]}; }\n`;
  svg += `    .level-3 { fill: ${lightColors[3]}; }\n`;
  svg += `    .level-4 { fill: ${lightColors[4]}; }\n`;

  // Dark theme override
  svg += `    @media (prefers-color-scheme: dark) {\n`;
  svg += `      .level-0 { fill: ${darkColors[0]}; }\n`;
  svg += `      .level-1 { fill: ${darkColors[1]}; }\n`;
  svg += `      .level-2 { fill: ${darkColors[2]}; }\n`;
  svg += `      .level-3 { fill: ${darkColors[3]}; }\n`;
  svg += `      .level-4 { fill: ${darkColors[4]}; }\n`;
  svg += `    }\n`;
  
  svg += `  </style>\n`;
  svg += `  <g transform="translate(${paddingX}, ${paddingY})">\n`;
  svg += monthLabels;
  svg += dayLabels;
  svg += rects;
  svg += `  </g>\n`;
  svg += `</svg>`;

  return svg;
}
