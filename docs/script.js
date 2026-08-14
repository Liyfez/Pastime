"use strict";

(function () {
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

  document.addEventListener('DOMContentLoaded', () => {
    const svgContainer = document.getElementById('svgContainer');
    const exportActionCode = document.getElementById('exportActionCode');
    const exportProfileCode = document.getElementById('exportProfileCode');
    const usernameInput = document.getElementById('usernameInput');

    const modeSolidBtn = document.getElementById('modeSolidBtn');
    const modeGradientBtn = document.getElementById('modeGradientBtn');
    const modeCustomBtn = document.getElementById('modeCustomBtn');
    
    const solidControls = document.getElementById('solidControls');
    const gradientControls = document.getElementById('gradientControls');
    const customControls = document.getElementById('customControls');

    // Solid
    const colorPicker = document.getElementById('primaryColor');
    
    // Gradient (Simple)
    const gradStartColor = document.getElementById('gradStartColor');
    const gradEndColor = document.getElementById('gradEndColor');
    const gradDirection = document.getElementById('gradDirection');

    // Custom
    const stopsContainer = document.getElementById('stopsContainer');
    const addStopBtn = document.getElementById('addStopBtn');
    const customX1 = document.getElementById('customX1');
    const customY1 = document.getElementById('customY1');
    const customX2 = document.getElementById('customX2');
    const customY2 = document.getElementById('customY2');
    const bgLight = document.getElementById('bgLight');
    const bgDark = document.getElementById('bgDark');

    let currentMode = 'solid'; // 'solid', 'gradient', 'custom'
    let customStops = [
      { color: '#fbbf24', offset: 0 },
      { color: '#34d399', offset: 100 }
    ];

    // Grid constants
    const cellSize = 10;
    const cellGap = 4;
    const paddingX = 30;
    const paddingY = 20;
    const width = 53 * (cellSize + cellGap) + paddingX + 10;
    const height = 7 * (cellSize + cellGap) + paddingY + 10;

    function renderStopsUI() {
      stopsContainer.innerHTML = '';
      customStops.forEach((stop, index) => {
        const row = document.createElement('div');
        row.className = 'flex items-center gap-3';
        row.innerHTML = `
          <input type="color" value="${stop.color}" class="stop-color w-8 h-8 rounded border-none cursor-pointer" data-index="${index}">
          <input type="range" value="${stop.offset}" min="0" max="100" class="stop-offset flex-1" data-index="${index}">
          <span class="text-xs text-textSoft w-8 text-right">${stop.offset}%</span>
          <button class="remove-stop text-red-500 hover:text-red-400 font-bold px-2" data-index="${index}">×</button>
        `;
        stopsContainer.appendChild(row);
      });

      // Bind stop events
      document.querySelectorAll('.stop-color').forEach(el => {
        el.addEventListener('input', (e) => {
          customStops[e.target.dataset.index].color = e.target.value;
          renderAll();
        });
      });
      document.querySelectorAll('.stop-offset').forEach(el => {
        el.addEventListener('input', (e) => {
          customStops[e.target.dataset.index].offset = parseInt(e.target.value, 10);
          e.target.nextElementSibling.textContent = e.target.value + '%';
          renderAll();
        });
      });
      document.querySelectorAll('.remove-stop').forEach(el => {
        el.addEventListener('click', (e) => {
          if (customStops.length > 2) {
            customStops.splice(e.target.dataset.index, 1);
            renderStopsUI();
            renderAll();
          } else {
            alert('You need at least 2 color stops for a gradient.');
          }
        });
      });
    }

    addStopBtn.addEventListener('click', () => {
      customStops.push({ color: '#ffffff', offset: 50 });
      customStops.sort((a, b) => a.offset - b.offset);
      renderStopsUI();
      renderAll();
    });

    // Custom XY Input Binds
    [customX1, customY1, customX2, customY2, bgLight, bgDark].forEach(el => {
      el.addEventListener('input', renderAll);
    });

    function setMode(mode) {
      currentMode = mode;
      
      const activeBtnClass = ['bg-brandYellow', 'text-bgDark'];
      const inactiveBtnClass = ['bg-zinc-800', 'text-textSoft', 'border', 'border-zinc-700'];

      modeSolidBtn.classList.remove(...activeBtnClass, ...inactiveBtnClass);
      modeGradientBtn.classList.remove(...activeBtnClass, ...inactiveBtnClass);
      modeCustomBtn.classList.remove(...activeBtnClass, ...inactiveBtnClass);

      if (mode === 'solid') {
        modeSolidBtn.classList.add(...activeBtnClass);
        modeGradientBtn.classList.add(...inactiveBtnClass);
        modeCustomBtn.classList.add(...inactiveBtnClass);
        
        solidControls.classList.remove('hidden');
        gradientControls.classList.add('hidden');
        customControls.classList.add('hidden');
      } else if (mode === 'gradient') {
        modeGradientBtn.classList.add(...activeBtnClass);
        modeSolidBtn.classList.add(...inactiveBtnClass);
        modeCustomBtn.classList.add(...inactiveBtnClass);
        
        gradientControls.classList.remove('hidden');
        solidControls.classList.add('hidden');
        customControls.classList.add('hidden');
      } else {
        modeCustomBtn.classList.add(...activeBtnClass);
        modeSolidBtn.classList.add(...inactiveBtnClass);
        modeGradientBtn.classList.add(...inactiveBtnClass);
        
        customControls.classList.remove('hidden');
        solidControls.classList.add('hidden');
        gradientControls.classList.add('hidden');
      }
      renderAll();
    }

    modeSolidBtn.addEventListener('click', () => setMode('solid'));
    modeGradientBtn.addEventListener('click', () => setMode('gradient'));
    modeCustomBtn.addEventListener('click', () => setMode('custom'));

    colorPicker.addEventListener('input', renderAll);
    gradStartColor.addEventListener('input', renderAll);
    gradEndColor.addEventListener('input', renderAll);
    gradDirection.addEventListener('change', renderAll);
    usernameInput.addEventListener('input', updateProfileCode);

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

      let svgHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="position:relative; z-index:1;">`;

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
      else if (currentMode === 'custom') {
        // Advanced Custom Theme
        const x1 = Math.max(0, Math.min(100, customX1.value || 0));
        const y1 = Math.max(0, Math.min(100, customY1.value || 0));
        const x2 = Math.max(0, Math.min(100, customX2.value || 100));
        const y2 = Math.max(0, Math.min(100, customY2.value || 100));
        const lBg = bgLight.value || '#ebedf0';
        const dBg = bgDark.value || '#161b22';

        // Sort stops correctly before rendering
        const sortedStops = [...customStops].sort((a,b) => a.offset - b.offset);
        const stopsStr = sortedStops.map(s => `${s.color}:${s.offset}%`).join(',');
        
        let stopsSVG = '';
        for (const s of sortedStops) {
          stopsSVG += `<stop offset="${s.offset}%" stop-color="${s.color}" />\n`;
        }

        svgHTML += `
          <defs>
            <linearGradient id="heatmap-grad" gradientUnits="userSpaceOnUse" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
              ${stopsSVG}
            </linearGradient>
          </defs>
          <style>
            .day { rx: 2; ry: 2; shape-rendering: geometricPrecision; }
            .label { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 10px; fill: #57606a; }
            .level-0 { fill: ${lBg}; }
            .level-1 { fill: url(#heatmap-grad); opacity: 0.3; }
            .level-2 { fill: url(#heatmap-grad); opacity: 0.55; }
            .level-3 { fill: url(#heatmap-grad); opacity: 0.8; }
            .level-4 { fill: url(#heatmap-grad); opacity: 1.0; }
            @media (prefers-color-scheme: dark) {
              .label { fill: #768390; }
              .level-0 { fill: ${dBg}; }
            }
          </style>`;

        exportActionCode.textContent = `env:\n  GITHUB_TOKEN: \${{ secrets.GH_TOKEN_FOR_GRAPH }}\n  GITHUB_USERNAME: \${{ github.repository_owner }}\n  THEME_MODE: 'custom'\n  GRADIENT_STOPS: '${stopsStr}'\n  GRADIENT_X1: '${x1}%'\n  GRADIENT_Y1: '${y1}%'\n  GRADIENT_X2: '${x2}%'\n  GRADIENT_Y2: '${y2}%'\n  BG_EMPTY_LIGHT: '${lBg}'\n  BG_EMPTY_DARK: '${dBg}'`;
      }

      svgHTML += `
          <g transform="translate(${paddingX}, ${paddingY})">
            ${monthLabels}
            ${dayLabels}
            ${rects}
          </g>
        </svg>
      `;

      // Interactive Editor Layer (Only in Custom Mode)
      if (currentMode === 'custom') {
        const x1 = customX1.value || 0;
        const y1 = customY1.value || 0;
        const x2 = customX2.value || 100;
        const y2 = customY2.value || 100;
        const startColor = customStops[0]?.color || '#ffffff';
        const endColor = customStops[customStops.length-1]?.color || '#ffffff';

        svgHTML += `
          <svg id="interactiveOverlay" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:10; pointer-events:none;" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line id="editorLine" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgba(255,255,255,0.5)" stroke-width="0.5" stroke-dasharray="2,1" />
            <circle id="node1" cx="${x1}" cy="${y1}" r="3" fill="${startColor}" stroke="#fff" stroke-width="0.5" style="pointer-events:all; cursor:grab;" />
            <circle id="node2" cx="${x2}" cy="${y2}" r="3" fill="${endColor}" stroke="#fff" stroke-width="0.5" style="pointer-events:all; cursor:grab;" />
          </svg>
        `;
      }

      svgContainer.innerHTML = `<div style="position:relative; width:${width}px; height:${height}px;">${svgHTML}</div>`;
      updateProfileCode();

      if (currentMode === 'custom') bindInteractiveEditor();
    }

    function bindInteractiveEditor() {
      const overlay = document.getElementById('interactiveOverlay');
      const node1 = document.getElementById('node1');
      const node2 = document.getElementById('node2');
      let draggingNode = null;

      function onPointerDown(e, nodeStr) {
        draggingNode = nodeStr;
        e.target.style.cursor = 'grabbing';
        e.preventDefault();
      }

      function onPointerMove(e) {
        if (!draggingNode) return;
        const rect = overlay.getBoundingClientRect();
        
        let x = ((e.clientX - rect.left) / rect.width) * 100;
        let y = ((e.clientY - rect.top) / rect.height) * 100;
        
        x = Math.round(Math.max(0, Math.min(100, x)));
        y = Math.round(Math.max(0, Math.min(100, y)));

        if (draggingNode === 'node1') {
          customX1.value = x;
          customY1.value = y;
        } else {
          customX2.value = x;
          customY2.value = y;
        }
        
        // Fast UI update
        document.getElementById(draggingNode).setAttribute('cx', x);
        document.getElementById(draggingNode).setAttribute('cy', y);
        
        const line = document.getElementById('editorLine');
        if (draggingNode === 'node1') {
          line.setAttribute('x1', x);
          line.setAttribute('y1', y);
        } else {
          line.setAttribute('x2', x);
          line.setAttribute('y2', y);
        }

        const grad = document.getElementById('heatmap-grad');
        if (grad) {
          grad.setAttribute('x1', customX1.value + '%');
          grad.setAttribute('y1', customY1.value + '%');
          grad.setAttribute('x2', customX2.value + '%');
          grad.setAttribute('y2', customY2.value + '%');
        }

        // Fast YAML update without full re-render
        const sortedStops = [...customStops].sort((a,b) => a.offset - b.offset);
        const stopsStr = sortedStops.map(s => `${s.color}:${s.offset}%`).join(',');
        const lBg = bgLight.value || '#ebedf0';
        const dBg = bgDark.value || '#161b22';
        exportActionCode.textContent = `env:\n  GITHUB_TOKEN: \${{ secrets.GH_TOKEN_FOR_GRAPH }}\n  GITHUB_USERNAME: \${{ github.repository_owner }}\n  THEME_MODE: 'custom'\n  GRADIENT_STOPS: '${stopsStr}'\n  GRADIENT_X1: '${customX1.value}%'\n  GRADIENT_Y1: '${customY1.value}%'\n  GRADIENT_X2: '${customX2.value}%'\n  GRADIENT_Y2: '${customY2.value}%'\n  BG_EMPTY_LIGHT: '${lBg}'\n  BG_EMPTY_DARK: '${dBg}'`;
      }

      function onPointerUp(e) {
        if (draggingNode) {
          const node = document.getElementById(draggingNode);
          if (node) node.style.cursor = 'grab';
          draggingNode = null;
        }
      }

      node1.addEventListener('mousedown', (e) => onPointerDown(e, 'node1'));
      node2.addEventListener('mousedown', (e) => onPointerDown(e, 'node2'));
      node1.addEventListener('touchstart', (e) => onPointerDown(e.touches[0], 'node1'), {passive: false});
      node2.addEventListener('touchstart', (e) => onPointerDown(e.touches[0], 'node2'), {passive: false});

      window.addEventListener('mousemove', onPointerMove);
      window.addEventListener('touchmove', (e) => onPointerMove(e.touches[0]), {passive: false});

      window.addEventListener('mouseup', onPointerUp);
      window.addEventListener('touchend', onPointerUp);
    }

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

    renderStopsUI();
    setMode('solid');
  });
})();
