/**
 * Pastime - Theme Engine & UI Controller
 */

// Math utilities for color conversion
const ColorMath = {
  hexToHSL(hex) {
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
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0; 
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100, r: Math.round(r*255), g: Math.round(g*255), b: Math.round(b*255) };
  },

  hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  },

  generateScales(hex) {
    const hsl = this.hexToHSL(hex);
    
    // Light Theme Quartiles (0 -> 4)
    const lightBg = '#ebedf0';
    const lightColors = [
      lightBg,
      this.hslToHex(hsl.h, hsl.s, Math.max(hsl.l, 80)),
      this.hslToHex(hsl.h, hsl.s, Math.max(hsl.l - 10, 65)),
      this.hslToHex(hsl.h, hsl.s, Math.max(hsl.l - 20, 50)),
      this.hslToHex(hsl.h, hsl.s, Math.max(hsl.l - 35, 35)),
    ];

    // Dark Theme Quartiles (0 -> 4)
    const darkBg = '#161b22';
    const darkColors = [
      darkBg,
      this.hslToHex(hsl.h, hsl.s, Math.min(hsl.l - 20, 20)),
      this.hslToHex(hsl.h, hsl.s, Math.min(hsl.l, 35)),
      this.hslToHex(hsl.h, hsl.s, Math.min(hsl.l + 15, 50)),
      this.hslToHex(hsl.h, hsl.s, Math.min(hsl.l + 30, 65)),
    ];

    return { lightColors, darkColors, rawHSL: hsl };
  }
};

// UI and DOM Management
class UIManager {
  constructor() {
    this.colorPicker = document.getElementById('primaryColor');
    this.usernameInput = document.getElementById('usernameInput');
    this.svgContainer = document.getElementById('svgContainer');
    this.exportActionCode = document.getElementById('exportActionCode');
    this.exportProfileCode = document.getElementById('exportProfileCode');
    this.toastContainer = document.getElementById('toast-container');
    
    this.fakeData = this.generateFakeData();
    this.init();
  }

  init() {
    this.colorPicker.addEventListener('input', () => this.renderAll());
    this.usernameInput.addEventListener('input', () => this.renderProfileCode());
    
    this.setupCopyButton('copyActionBtn', this.exportActionCode, 'Workflow YAML Copied!');
    this.setupCopyButton('copyProfileBtn', this.exportProfileCode, 'Markdown Link Copied!');
    
    // Initial Render
    this.renderAll();
  }

  generateFakeData() {
    const fakeWeeks = [];
    for (let i = 0; i < 53; i++) {
      const days = [];
      for (let j = 0; j < 7; j++) {
        let level = 0;
        const rand = Math.random();
        // Skew towards lower levels for realism
        if (rand > 0.6) level = 1;
        if (rand > 0.8) level = 2;
        if (rand > 0.9) level = 3;
        if (rand > 0.95) level = 4;
        days.push({ level });
      }
      fakeWeeks.push({ contributionDays: days });
    }
    return fakeWeeks;
  }

  updateCSSVariables(hex, r, g, b) {
    document.documentElement.style.setProperty('--brand', hex);
    document.documentElement.style.setProperty('--brand-rgb', `${r}, ${g}, ${b}`);
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      ${message}
    `;
    this.toastContainer.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  setupCopyButton(btnId, targetElement, successMsg) {
    document.getElementById(btnId).addEventListener('click', () => {
      navigator.clipboard.writeText(targetElement.textContent);
      this.showToast(successMsg);
    });
  }

  renderProfileCode() {
    const username = this.usernameInput.value.trim() || 'your-username';
    this.exportProfileCode.textContent = `![My Custom Activity Graph](https://raw.githubusercontent.com/${username}/Pastime/main/activity-graph.svg)`;
  }

  renderAll() {
    let hex = this.colorPicker.value;
    if (!hex) hex = '#fbbf24';
    
    const { lightColors, darkColors, rawHSL } = ColorMath.generateScales(hex);
    this.updateCSSVariables(hex, rawHSL.r, rawHSL.g, rawHSL.b);

    this.renderSVG(lightColors, darkColors);
    
    this.exportActionCode.textContent = 
`env:
  GITHUB_TOKEN: \${{ secrets.GH_TOKEN_FOR_GRAPH }}
  GITHUB_USERNAME: \${{ github.repository_owner }}
  LIGHT_THEME: '${lightColors.join(',')}'
  DARK_THEME: '${darkColors.join(',')}'`;

    this.renderProfileCode();
  }

  renderSVG(lightColors, darkColors) {
    const cellSize = 11;
    const cellGap = 4;
    const paddingX = 30;
    const paddingY = 20;
    const width = 53 * (cellSize + cellGap) + paddingX + 10;
    const height = 7 * (cellSize + cellGap) + paddingY + 10;

    let rects = '';
    this.fakeData.forEach((week, weekIndex) => {
      const x = weekIndex * (cellSize + cellGap);
      week.contributionDays.forEach((day, dayOfWeek) => {
        const y = dayOfWeek * (cellSize + cellGap);
        rects += `<rect class="day level-${day.level}" x="${x}" y="${y}" width="${cellSize}" height="${cellSize}"></rect>\n`;
      });
    });

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let monthLabels = '';
    for(let i=0; i<12; i++) {
      monthLabels += `<text class="label" x="${i*64}" y="-8">${months[i]}</text>\n`;
    }

    const dayLabels = `
      <text class="label" x="-25" y="${1 * (cellSize + cellGap) + 9}">Mon</text>
      <text class="label" x="-25" y="${3 * (cellSize + cellGap) + 9}">Wed</text>
      <text class="label" x="-25" y="${5 * (cellSize + cellGap) + 9}">Fri</text>
    `;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n`;
    svg += `<style>\n`;
    svg += `  .day { rx: 3; ry: 3; shape-rendering: geometricPrecision; transition: fill 0.3s ease; }\n`;
    svg += `  .label { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 10px; fill: #57606a; }\n`;
    
    svg += `  .level-0 { fill: ${lightColors[0]}; }\n`;
    svg += `  .level-1 { fill: ${lightColors[1]}; }\n`;
    svg += `  .level-2 { fill: ${lightColors[2]}; }\n`;
    svg += `  .level-3 { fill: ${lightColors[3]}; }\n`;
    svg += `  .level-4 { fill: ${lightColors[4]}; }\n`;

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

    this.svgContainer.innerHTML = svg;
  }
}

// Bootstrap application
document.addEventListener('DOMContentLoaded', () => {
  new UIManager();
});
