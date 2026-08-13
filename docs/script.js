document.addEventListener('DOMContentLoaded', () => {
  // Base GitHub layout logic
  const cellSize = 10;
  const cellGap = 4;
  const paddingX = 30;
  const paddingY = 20;
  const width = 53 * (cellSize + cellGap) + paddingX + 10;
  const height = 7 * (cellSize + cellGap) + paddingY + 10;

  const svgContainer = document.getElementById('svgContainer');
  const exportCode = document.getElementById('exportCode');
  
  // Theme Toggle
  let currentPreviewMode = 'dark'; // 'light' or 'dark'
  const btnLight = document.getElementById('previewLight');
  const btnDark = document.getElementById('previewDark');
  
  btnLight.addEventListener('click', () => {
    currentPreviewMode = 'light';
    btnLight.classList.add('active');
    btnDark.classList.remove('active');
    svgContainer.className = 'svg-container light-preview';
    render();
  });
  
  btnDark.addEventListener('click', () => {
    currentPreviewMode = 'dark';
    btnDark.classList.add('active');
    btnLight.classList.remove('active');
    svgContainer.className = 'svg-container dark-preview';
    render();
  });

  // Pickers
  const pickers = {
    light: [
      document.getElementById('l0'),
      document.getElementById('l1'),
      document.getElementById('l2'),
      document.getElementById('l3'),
      document.getElementById('l4')
    ],
    dark: [
      document.getElementById('d0'),
      document.getElementById('d1'),
      document.getElementById('d2'),
      document.getElementById('d3'),
      document.getElementById('d4')
    ]
  };

  // Add listeners
  [...pickers.light, ...pickers.dark].forEach(input => {
    input.addEventListener('input', render);
  });

  // Generate fake data for preview
  function generateFakeWeeks() {
    const weeks = [];
    for (let i = 0; i < 53; i++) {
      const days = [];
      for (let j = 0; j < 7; j++) {
        // Random level 0-4 heavily skewed to 0
        let level = 0;
        const rand = Math.random();
        if (rand > 0.6) level = 1;
        if (rand > 0.8) level = 2;
        if (rand > 0.9) level = 3;
        if (rand > 0.95) level = 4;
        days.push({ level });
      }
      weeks.push({ contributionDays: days });
    }
    return weeks;
  }

  const fakeWeeks = generateFakeWeeks();

  function render() {
    const lColors = pickers.light.map(p => p.value);
    const dColors = pickers.dark.map(p => p.value);
    
    // Choose which palette to render based on toggle
    // Because we are simulating `@media (prefers-color-scheme)`, we just inject the correct active colors
    const activeColors = currentPreviewMode === 'dark' ? dColors : lColors;
    const textFill = currentPreviewMode === 'dark' ? '#768390' : '#57606a';

    let rects = '';
    fakeWeeks.forEach((week, weekIndex) => {
      const x = weekIndex * (cellSize + cellGap);
      week.contributionDays.forEach((day, dayOfWeek) => {
        const y = dayOfWeek * (cellSize + cellGap);
        const level = day.level;
        rects += `<rect class="day level-${level}" x="${x}" y="${y}" width="${cellSize}" height="${cellSize}"></rect>\n`;
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

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n`;
    svg += `<style>\n`;
    svg += `  .day { rx: 2; ry: 2; shape-rendering: geometricPrecision; }\n`;
    svg += `  .label { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 10px; fill: ${textFill}; }\n`;
    svg += `  .level-0 { fill: ${activeColors[0]}; }\n`;
    svg += `  .level-1 { fill: ${activeColors[1]}; }\n`;
    svg += `  .level-2 { fill: ${activeColors[2]}; }\n`;
    svg += `  .level-3 { fill: ${activeColors[3]}; }\n`;
    svg += `  .level-4 { fill: ${activeColors[4]}; }\n`;
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
  LIGHT_THEME: '${lColors.join(',')}'
  DARK_THEME: '${dColors.join(',')}'`;
  }

  // Copy button
  document.getElementById('copyBtn').addEventListener('click', (e) => {
    navigator.clipboard.writeText(exportCode.textContent);
    const btn = e.target;
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = 'Copy Code'; }, 2000);
  });

  // Init
  btnDark.click(); // Set initial to dark
});
