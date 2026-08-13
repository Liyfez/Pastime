export function generateSVG(weeks, colors) {
  // SVG dimensions and padding
  const cellSize = 10;
  const cellGap = 4;
  const padding = 20;

  // GitHub contribution graph has up to 53 weeks, 7 days a week
  const width = 53 * (cellSize + cellGap) + padding * 2 - cellGap;
  const height = 7 * (cellSize + cellGap) + padding * 2 - cellGap;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n`;
  svg += `  <style>\n`;
  svg += `    .day { rx: 2; ry: 2; shape-rendering: geometricPrecision; }\n`;
  svg += `    text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 10px; fill: #768390; }\n`;
  svg += `  </style>\n`;

  svg += `  <g transform="translate(${padding}, ${padding})">\n`;

  weeks.forEach((week, weekIndex) => {
    const x = weekIndex * (cellSize + cellGap);

    week.contributionDays.forEach((day) => {
      // GitHub week starts on Sunday (0)
      const dayOfWeek = new Date(day.date).getUTCDay();
      const y = dayOfWeek * (cellSize + cellGap);

      // We use the level (0-4) extracted directly from GitHub's HTML!
      const level = day.level;
      const fill = colors[level] || colors[0];
      const title = `Level ${level} on ${day.date}`;

      svg += `    <rect class="day" x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${fill}">\n`;
      svg += `      <title>${title}</title>\n`;
      svg += `    </rect>\n`;
    });
  });

  svg += `  </g>\n`;
  svg += `</svg>`;

  return svg;
}
