// Math utility to convert HEX to HSL
function hexToHSL(hex) {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  r /= 255; g /= 255; b /= 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0; // achromatic
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

// Math utility to convert HSL to HEX
function hslToHex(h, s, l) {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Generate scaled colors from a base hex
function generateColorScales(hex) {
  const hsl = hexToHSL(hex);
  
  // Light Theme: Level 0 (bg) is gray, then 4 shades of the color
  const lightBg = '#ebedf0';
  const lightColors = [
    lightBg,
    hslToHex(hsl.h, hsl.s, Math.max(hsl.l, 80)), // L1: Very Light
    hslToHex(hsl.h, hsl.s, Math.max(hsl.l - 10, 65)), // L2: Light
    hslToHex(hsl.h, hsl.s, Math.max(hsl.l - 20, 50)), // L3: Medium
    hslToHex(hsl.h, hsl.s, Math.max(hsl.l - 35, 35)), // L4: Dark
  ];

  // Dark Theme: Level 0 (bg) is dark gray, then 4 shades of the color
  const darkBg = '#161b22';
  const darkColors = [
    darkBg,
    hslToHex(hsl.h, hsl.s, Math.min(hsl.l - 20, 20)), // L1: Very Dark
    hslToHex(hsl.h, hsl.s, Math.min(hsl.l, 35)),      // L2: Dark
    hslToHex(hsl.h, hsl.s, Math.min(hsl.l + 15, 50)), // L3: Medium
    hslToHex(hsl.h, hsl.s, Math.min(hsl.l + 30, 65)), // L4: Bright
  ];

  return { lightColors, darkColors };
}

document.addEventListener('DOMContentLoaded', () => {
  const cellSize = 10;
  const cellGap = 4;
  const paddingX = 30;
  const paddingY = 20;
  const width = 53 * (cellSize + cellGap) + paddingX + 10;
  const height = 7 * (cellSize + cellGap) + paddingY + 10;

  const svgContainer = document.getElementById('svgContainer');
  const exportCode = document.getElementById('exportCode');
  const colorPicker = document.getElementById('primaryColor');

  colorPicker.addEventListener('input', render);

  // Generate fake data once for preview
  const fakeWeeks = [];
  for (let i = 0; i < 53; i++) {
    const days = [];
    for (let j = 0; j < 7; j++) {
      let level = 0;
      const rand = Math.random();
      if (rand > 0.6) level = 1;
      if (rand > 0.8) level = 2;
      if (rand > 0.9) level = 3;
      if (rand > 0.95) level = 4;
      days.push({ level });
    }
    fakeWeeks.push({ contributionDays: days });
  }

  function render() {
    let hex = colorPicker.value;
    if (!hex) hex = '#fbbf24'; // Default to yellow
    const { lightColors, darkColors } = generateColorScales(hex);

    let rects = '';
    fakeWeeks.forEach((week, weekIndex) => {
      const x = weekIndex * (cellSize + cellGap);
      week.contributionDays.forEach((day, dayOfWeek) => {
        const y = dayOfWeek * (cellSize + cellGap);
        rects += `<rect class="day level-${day.level}" x="${x}" y="${y}" width="${cellSize}" height="${cellSize}"></rect>\n`;
      });
    });

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let monthLabels = '';
    for(let i=0; i<12; i++) {
      monthLabels += `<text class="label" x="${i*60}" y="-8">${months[i]}</text>\n`;
    }

    const dayLabels = `
      <text class="label" x="-25" y="${1 * (cellSize + cellGap) + 9}">Mon</text>
      <text class="label" x="-25" y="${3 * (cellSize + cellGap) + 9}">Wed</text>
      <text class="label" x="-25" y="${5 * (cellSize + cellGap) + 9}">Fri</text>
    `;

    // SVG generation with adaptive media query built-in!
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n`;
    svg += `<style>\n`;
    svg += `  .day { rx: 2; ry: 2; shape-rendering: geometricPrecision; }\n`;
    svg += `  .label { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 10px; fill: #57606a; }\n`;
    
    // Light Mode (Default)
    svg += `  .level-0 { fill: ${lightColors[0]}; }\n`;
    svg += `  .level-1 { fill: ${lightColors[1]}; }\n`;
    svg += `  .level-2 { fill: ${lightColors[2]}; }\n`;
    svg += `  .level-3 { fill: ${lightColors[3]}; }\n`;
    svg += `  .level-4 { fill: ${lightColors[4]}; }\n`;

    // Dark Mode Override (prefers-color-scheme)
    svg += `  @media (prefers-color-scheme: dark) {\n`;
    svg += `    .label { fill: #768390; }\n`;
    svg += `    .level-0 { fill: ${darkColors[0]}; }\n`;
    svg += `    .level-1 { fill: ${darkColors[1]}; }\n`;
    svg += `    .level-2 { fill: ${darkColors[2]}; }\n`;
    svg += `    .level-3 { fill: ${darkColors[3]}; }\n`;
    svg += `    .level-4 { fill: ${darkColors[4]}; }\n`;
    svg += `  }\n`;

    svg += `</style>\n`;
    svg += `<g transform="translate(${paddingX}, ${paddingY})">\n`;
    svg += monthLabels;
    svg += dayLabels;
    svg += rects;
    svg += `</g>\n`;
    svg += `</svg>`;

    svgContainer.innerHTML = svg;

    // Update code block
    exportCode.textContent = 
`env:
  GITHUB_TOKEN: \${{ secrets.GH_TOKEN_FOR_GRAPH }}
  GITHUB_USERNAME: \${{ github.repository_owner }}
  LIGHT_THEME: '${lightColors.join(',')}'
  DARK_THEME: '${darkColors.join(',')}'`;
  }

  // Copy button
  document.getElementById('copyBtn').addEventListener('click', (e) => {
    navigator.clipboard.writeText(exportCode.textContent);
    const btn = e.target;
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = 'Copy Code'; }, 2000);
  });

  // Initial render
  render();
});
