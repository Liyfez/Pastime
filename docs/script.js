"use strict";

(function () {
  /**
   * Converts a Hex color to HSL
   * @param {string} hex - Hex color string
   * @returns {{h: number, s: number, l: number}} HSL values
   */
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
    
    r /= 255; 
    g /= 255; 
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
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

  /**
   * Converts HSL to Hex color
   */
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

  /**
   * Generates perfectly scaled light and dark themes from a base hex color
   */
  function generateColorScales(hex) {
    const hsl = hexToHSL(hex);
    
    const lightBg = '#ebedf0';
    const lightColors = [
      lightBg,
      hslToHex(hsl.h, hsl.s, Math.max(hsl.l, 80)),
      hslToHex(hsl.h, hsl.s, Math.max(hsl.l - 10, 65)),
      hslToHex(hsl.h, hsl.s, Math.max(hsl.l - 20, 50)),
      hslToHex(hsl.h, hsl.s, Math.max(hsl.l - 35, 35)),
    ];

    const darkBg = '#161b22';
    const darkColors = [
      darkBg,
      hslToHex(hsl.h, hsl.s, Math.min(hsl.l - 20, 20)),
      hslToHex(hsl.h, hsl.s, Math.min(hsl.l, 35)),
      hslToHex(hsl.h, hsl.s, Math.min(hsl.l + 15, 50)),
      hslToHex(hsl.h, hsl.s, Math.min(hsl.l + 30, 65)),
    ];

    return { lightColors, darkColors };
  }

  // Application initialization
  document.addEventListener('DOMContentLoaded', () => {
    // Cache DOM elements
    const svgContainer = document.getElementById('svgContainer');
    const exportActionCode = document.getElementById('exportActionCode');
    const exportProfileCode = document.getElementById('exportProfileCode');
    const usernameInput = document.getElementById('usernameInput');

    // Mode Toggle Elements
    const modeSolidBtn = document.getElementById('modeSolidBtn');
    const modeGradientBtn = document.getElementById('modeGradientBtn');
    const solidControls = document.getElementById('solidControls');
    const gradientControls = document.getElementById('gradientControls');

    // Control Inputs
    const colorPicker = document.getElementById('primaryColor');
    const gradStartColor = document.getElementById('gradStartColor');
    const gradEndColor = document.getElementById('gradEndColor');
    const gradDirection = document.getElementById('gradDirection');

    let currentMode = 'solid'; // 'solid' or 'gradient'

    if (!svgContainer || !exportActionCode || !exportProfileCode || !colorPicker || !usernameInput) {
      console.error('Pastime Initialization Error: Required DOM elements are missing.');
      return;
    }

    // Grid constants
    const cellSize = 10;
    const cellGap = 4;
    const paddingX = 30;
    const paddingY = 20;
    const width = 53 * (cellSize + cellGap) + paddingX + 10;
    const height = 7 * (cellSize + cellGap) + paddingY + 10;

    // Mode switching logic
    function setMode(mode) {
      currentMode = mode;
      if (mode === 'solid') {
        modeSolidBtn.classList.replace('bg-zinc-800', 'bg-brandYellow');
        modeSolidBtn.classList.replace('text-textSoft', 'text-bgDark');
        modeSolidBtn.classList.remove('border', 'border-zinc-700');
        
        modeGradientBtn.classList.replace('bg-brandYellow', 'bg-zinc-800');
        modeGradientBtn.classList.replace('text-bgDark', 'text-textSoft');
        modeGradientBtn.classList.add('border', 'border-zinc-700');

        solidControls.classList.remove('hidden');
        gradientControls.classList.add('hidden');
      } else {
        modeGradientBtn.classList.replace('bg-zinc-800', 'bg-brandYellow');
        modeGradientBtn.classList.replace('text-textSoft', 'text-bgDark');
        modeGradientBtn.classList.remove('border', 'border-zinc-700');
        
        modeSolidBtn.classList.replace('bg-brandYellow', 'bg-zinc-800');
        modeSolidBtn.classList.replace('text-bgDark', 'text-textSoft');
        modeSolidBtn.classList.add('border', 'border-zinc-700');

        gradientControls.classList.remove('hidden');
        solidControls.classList.add('hidden');
      }
      renderAll();
    }

    modeSolidBtn.addEventListener('click', () => setMode('solid'));
    modeGradientBtn.addEventListener('click', () => setMode('gradient'));

    // Attach Input Listeners
    colorPicker.addEventListener('input', renderAll);
    gradStartColor.addEventListener('input', renderAll);
    gradEndColor.addEventListener('input', renderAll);
    gradDirection.addEventListener('change', renderAll);
    usernameInput.addEventListener('input', updateProfileCode);

    // Generate static fake heat map data
    const fakeWeeks = Array.from({ length: 53 }, () => ({
      contributionDays: Array.from({ length: 7 }, () => {
        const rand = Math.random();
        let level = 0;
        if (rand > 0.6) level = 1;
        if (rand > 0.8) level = 2;
        if (rand > 0.9) level = 3;
        if (rand > 0.95) level = 4;
        return { level };
      })
    }));

    function updateProfileCode() {
      const username = usernameInput.value.trim() || 'your-username';
      exportProfileCode.textContent = `![My Custom Activity Graph](https://raw.githubusercontent.com/${username}/Pastime/main/activity-graph.svg)`;
    }

    function renderAll() {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthLabels = months.map((month, i) => `<text class="label" x="${i * 60}" y="-8">${month}</text>`).join('');

      const dayLabels = `
        <text class="label" x="-25" y="${1 * (cellSize + cellGap) + 9}">Mon</text>
        <text class="label" x="-25" y="${3 * (cellSize + cellGap) + 9}">Wed</text>
        <text class="label" x="-25" y="${5 * (cellSize + cellGap) + 9}">Fri</text>
      `;

      const rects = fakeWeeks.map((week, weekIndex) => {
        const x = weekIndex * (cellSize + cellGap);
        return week.contributionDays.map((day, dayOfWeek) => {
          const y = dayOfWeek * (cellSize + cellGap);
          return `<rect class="day level-${day.level}" x="${x}" y="${y}" width="${cellSize}" height="${cellSize}"></rect>`;
        }).join('');
      }).join('');

      let svgHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`;

      if (currentMode === 'solid') {
        const hex = colorPicker.value || '#fbbf24';
        const { lightColors, darkColors } = generateColorScales(hex);

        svgHTML += `
          <style>
            .day { rx: 2; ry: 2; shape-rendering: geometricPrecision; }
            .label { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 10px; fill: #57606a; }
            .level-0 { fill: ${lightColors[0]}; }
            .level-1 { fill: ${lightColors[1]}; }
            .level-2 { fill: ${lightColors[2]}; }
            .level-3 { fill: ${lightColors[3]}; }
            .level-4 { fill: ${lightColors[4]}; }
            @media (prefers-color-scheme: dark) {
              .label { fill: #768390; }
              .level-0 { fill: ${darkColors[0]}; }
              .level-1 { fill: ${darkColors[1]}; }
              .level-2 { fill: ${darkColors[2]}; }
              .level-3 { fill: ${darkColors[3]}; }
              .level-4 { fill: ${darkColors[4]}; }
            }
          </style>`;

        exportActionCode.textContent = `env:\n  GITHUB_TOKEN: \${{ secrets.GH_TOKEN_FOR_GRAPH }}\n  GITHUB_USERNAME: \${{ github.repository_owner }}\n  LIGHT_THEME: '${lightColors.join(',')}'\n  DARK_THEME: '${darkColors.join(',')}'`;
      } 
      else if (currentMode === 'gradient') {
        const startColor = gradStartColor.value || '#fbbf24';
        const endColor = gradEndColor.value || '#34d399';
        const dir = gradDirection.value || 'left-to-right';
        
        let x1 = '0%', y1 = '0%', x2 = '100%', y2 = '100%';
        switch (dir) {
          case 'left-to-right': x2 = '100%'; y2 = '0%'; break;
          case 'top-to-bottom': x2 = '0%'; y2 = '100%'; break;
          case 'top-left-to-bottom-right': x2 = '100%'; y2 = '100%'; break;
          case 'bottom-left-to-top-right': y1 = '100%'; x2 = '100%'; y2 = '0%'; break;
        }

        const lightBg = '#ebedf0';
        const darkBg = '#161b22';

        svgHTML += `
          <defs>
            <linearGradient id="heatmap-grad" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
              <stop offset="0%" stop-color="${startColor}" />
              <stop offset="100%" stop-color="${endColor}" />
            </linearGradient>
          </defs>
          <style>
            .day { rx: 2; ry: 2; shape-rendering: geometricPrecision; }
            .label { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 10px; fill: #57606a; }
            .level-0 { fill: ${lightBg}; }
            .level-1 { fill: url(#heatmap-grad); opacity: 0.3; }
            .level-2 { fill: url(#heatmap-grad); opacity: 0.55; }
            .level-3 { fill: url(#heatmap-grad); opacity: 0.8; }
            .level-4 { fill: url(#heatmap-grad); opacity: 1.0; }
            @media (prefers-color-scheme: dark) {
              .label { fill: #768390; }
              .level-0 { fill: ${darkBg}; }
            }
          </style>`;

        exportActionCode.textContent = `env:\n  GITHUB_TOKEN: \${{ secrets.GH_TOKEN_FOR_GRAPH }}\n  GITHUB_USERNAME: \${{ github.repository_owner }}\n  THEME_MODE: 'gradient'\n  GRADIENT_START: '${startColor}'\n  GRADIENT_END: '${endColor}'\n  GRADIENT_DIR: '${dir}'\n  BG_EMPTY_LIGHT: '${lightBg}'\n  BG_EMPTY_DARK: '${darkBg}'`;
      }

      svgHTML += `
          <g transform="translate(${paddingX}, ${paddingY})">
            ${monthLabels}
            ${dayLabels}
            ${rects}
          </g>
        </svg>
      `;

      svgContainer.innerHTML = svgHTML.trim();
      updateProfileCode();
    }

    /**
     * Attaches robust copy-to-clipboard functionality to a button
     */
    function attachClipboardHandler(buttonId, targetId) {
      const button = document.getElementById(buttonId);
      const target = document.getElementById(targetId);
      
      if (!button || !target) return;

      button.addEventListener('click', async (e) => {
        try {
          await navigator.clipboard.writeText(target.textContent);
          const originalText = button.textContent;
          button.textContent = 'Copied!';
          button.classList.add('bg-green-500', 'text-white', 'border-green-500');
          button.classList.remove('text-brandYellow', 'bg-zinc-800');
          
          setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('bg-green-500', 'text-white', 'border-green-500');
            button.classList.add('text-brandYellow', 'bg-zinc-800');
          }, 2000);
        } catch (err) {
          console.error('Failed to copy text: ', err);
          button.textContent = 'Failed';
        }
      });
    }

    attachClipboardHandler('copyActionBtn', 'exportActionCode');
    attachClipboardHandler('copyProfileBtn', 'exportProfileCode');

    // Initial render
    setMode('solid');
  });
})();
