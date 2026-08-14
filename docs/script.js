(function() {
  'use strict';

  function hexToHSL(H) {
    let r = 0, g = 0, b = 0;
    if (H.length === 4) {
      r = "0x" + H[1] + H[1];
      g = "0x" + H[2] + H[2];
      b = "0x" + H[3] + H[3];
    } else if (H.length === 7) {
      r = "0x" + H[1] + H[2];
      g = "0x" + H[3] + H[4];
      b = "0x" + H[5] + H[6];
    }
    r /= 255; g /= 255; b /= 255;
    let cmin = Math.min(r,g,b),
        cmax = Math.max(r,g,b),
        delta = cmax - cmin,
        h = 0, s = 0, l = 0;

    if (delta === 0) h = 0;
    else if (cmax === r) h = ((g - b) / delta) % 6;
    else if (cmax === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;

    h = Math.round(h * 60);
    if (h < 0) h += 360;
    l = (cmax + cmin) / 2;
    s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);

    return { h, s, l };
  }

  function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    let c = (1 - Math.abs(2 * l - 1)) * s,
        x = c * (1 - Math.abs((h / 60) % 2 - 1)),
        m = l - c/2,
        r = 0, g = 0, b = 0;
    
    if (0 <= h && h < 60) { r = c; g = x; b = 0; }
    else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
    else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
    else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
    else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
    else if (300 <= h && h < 360) { r = c; g = 0; b = x; }
    
    r = Math.round((r + m) * 255).toString(16);
    g = Math.round((g + m) * 255).toString(16);
    b = Math.round((b + m) * 255).toString(16);
    
    if (r.length === 1) r = "0" + r;
    if (g.length === 1) g = "0" + g;
    if (b.length === 1) b = "0" + b;
    
    return "#" + r + g + b;
  }

  function generateColorScales(hex) {
    const { h, s, l } = hexToHSL(hex);
    const lightColors = [
      '#ebedf0',
      hslToHex(h, s, Math.min(l + 30, 90)),
      hslToHex(h, s, Math.min(l + 15, 75)),
      hslToHex(h, s, l),
      hslToHex(h, s, Math.max(l - 15, 20))
    ];
    const darkColors = [
      '#161b22',
      hslToHex(h, Math.max(s - 20, 0), Math.max(l - 30, 15)),
      hslToHex(h, Math.max(s - 10, 0), Math.max(l - 15, 25)),
      hslToHex(h, s, l),
      hslToHex(h, Math.min(s + 10, 100), Math.min(l + 15, 85))
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
    
    const solidControls = document.getElementById('solidControls');
    const gradientControls = document.getElementById('gradientControls');

    // Solid
    const colorPicker = document.getElementById('primaryColor');
    
    // Gradient
    const gradStartColor = document.getElementById('gradStartColor');
    const gradEndColor = document.getElementById('gradEndColor');

    let currentMode = 'solid'; // 'solid', 'gradient'
    let gradX1 = 0;
    let gradY1 = 0;
    let gradX2 = 100;
    let gradY2 = 100;

    // Grid constants
    const cellSize = 10;
    const cellGap = 4;
    const paddingX = 30;
    const paddingY = 20;
    const width = 53 * (cellSize + cellGap) + paddingX + 10;
    const height = 7 * (cellSize + cellGap) + paddingY + 10;

    function setMode(mode) {
      currentMode = mode;
      
      const activeBtnClass = ['bg-brandYellow', 'text-bgDark'];
      const inactiveBtnClass = ['bg-zinc-800', 'text-textSoft', 'border', 'border-zinc-700'];

      modeSolidBtn.classList.remove(...activeBtnClass, ...inactiveBtnClass);
      modeGradientBtn.classList.remove(...activeBtnClass, ...inactiveBtnClass);

      if (mode === 'solid') {
        modeSolidBtn.classList.add(...activeBtnClass);
        modeGradientBtn.classList.add(...inactiveBtnClass);
        
        solidControls.classList.remove('hidden');
        gradientControls.classList.add('hidden');
      } else if (mode === 'gradient') {
        modeGradientBtn.classList.add(...activeBtnClass);
        modeSolidBtn.classList.add(...inactiveBtnClass);
        
        gradientControls.classList.remove('hidden');
        solidControls.classList.add('hidden');
      }
      renderAll();
    }

    modeSolidBtn.addEventListener('click', () => setMode('solid'));
    modeGradientBtn.addEventListener('click', () => setMode('gradient'));

    colorPicker.addEventListener('input', renderAll);
    gradStartColor.addEventListener('input', renderAll);
    gradEndColor.addEventListener('input', renderAll);
    usernameInput.addEventListener('input', updateProfileCode);

    function updateProfileCode() {
      const username = usernameInput.value.trim() || 'your-username';
      exportProfileCode.textContent = `[![${username}'s Activity Graph](https://github-readme-activity-graph.vercel.app/graph?username=${username}&theme=pastime)](https://github.com/Liyfez/Pastime)`;
    }

    // Single global binding flag for window mouse events
    let isEditorBound = false;

    // Generate realistic static activity graph once
    let streak = 0;
    const fakeWeeks = Array.from({ length: 53 }, (_, wIndex) => ({
      contributionDays: Array.from({ length: 7 }, (_, dIndex) => {
        // Weekends have lower probability
        const isWeekend = (dIndex === 0 || dIndex === 6);
        const baseProb = isWeekend ? 0.3 : 0.7;
        
        let level = 0;
        if (Math.random() < baseProb) {
          streak++;
          // Higher levels are more likely during a streak
          if (streak > 5 && Math.random() < 0.4) level = 4;
          else if (streak > 2 && Math.random() < 0.6) level = 3;
          else if (Math.random() < 0.5) level = 2;
          else level = 1;
        } else {
          streak = 0;
          if (Math.random() < 0.1) level = 1; // occasional tiny commit
        }
        
        return { level, date: `2026-01-01` };
      })
    }));

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let monthLabels = '';
    let rects = '';
    
    for (let i = 0; i < 12; i++) {
      monthLabels += `<text class="label" x="${i * 50}" y="-8">${months[i]}</text>\n`;
    }

    fakeWeeks.forEach((week, w) => {
      const x = w * (cellSize + cellGap);
      week.contributionDays.forEach((day, d) => {
        const y = d * (cellSize + cellGap);
        rects += `<rect class="day level-${day.level}" x="${x}" y="${y}" width="${cellSize}" height="${cellSize}"></rect>\n`;
      });
    });

    function renderAll() {

      const dayLabels = `
        <text class="label" x="-25" y="${1 * (cellSize + cellGap) + 9}">Mon</text>
        <text class="label" x="-25" y="${3 * (cellSize + cellGap) + 9}">Wed</text>
        <text class="label" x="-25" y="${5 * (cellSize + cellGap) + 9}">Fri</text>
      `;

      let svgHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%">\n`;

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

        const lightList = lightColors.join(',');
        const darkList = darkColors.join(',');
        exportActionCode.textContent = `env:\n  GITHUB_TOKEN: \${{ secrets.GH_TOKEN_FOR_GRAPH }}\n  GITHUB_USERNAME: \${{ github.repository_owner }}\n  THEME_MODE: 'solid'\n  LIGHT_THEME: '${lightList}'\n  DARK_THEME: '${darkList}'`;

      } else if (currentMode === 'gradient') {
        const startColor = gradStartColor.value || '#fbbf24';
        const endColor = gradEndColor.value || '#34d399';

        svgHTML += `
          <defs>
            <linearGradient id="heatmap-grad" gradientUnits="userSpaceOnUse" x1="${gradX1}%" y1="${gradY1}%" x2="${gradX2}%" y2="${gradY2}%">
              <stop offset="0%" stop-color="${startColor}" />
              <stop offset="100%" stop-color="${endColor}" />
            </linearGradient>
          </defs>
          <style>
            .day { rx: 2; ry: 2; shape-rendering: geometricPrecision; }
            .label { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 10px; fill: #57606a; }
            .level-0 { fill: #ebedf0; }
            .level-1 { fill: url(#heatmap-grad); opacity: 0.3; }
            .level-2 { fill: url(#heatmap-grad); opacity: 0.55; }
            .level-3 { fill: url(#heatmap-grad); opacity: 0.8; }
            .level-4 { fill: url(#heatmap-grad); opacity: 1.0; }
            @media (prefers-color-scheme: dark) {
              .label { fill: #768390; }
              .level-0 { fill: #161b22; }
            }
          </style>`;

        exportActionCode.textContent = `env:\n  GITHUB_TOKEN: \${{ secrets.GH_TOKEN_FOR_GRAPH }}\n  GITHUB_USERNAME: \${{ github.repository_owner }}\n  THEME_MODE: 'gradient'\n  GRADIENT_START: '${startColor}'\n  GRADIENT_END: '${endColor}'\n  GRADIENT_X1: '${gradX1}%'\n  GRADIENT_Y1: '${gradY1}%'\n  GRADIENT_X2: '${gradX2}%'\n  GRADIENT_Y2: '${gradY2}%'`;
      }

      svgHTML += `
          <g transform="translate(${paddingX}, ${paddingY})">
            ${monthLabels}
            ${dayLabels}
            ${rects}
          </g>
        </svg>
      `;

      // Interactive Editor Layer (Only in Gradient Mode)
      if (currentMode === 'gradient') {
        const startColor = gradStartColor.value || '#fbbf24';
        const endColor = gradEndColor.value || '#34d399';

        svgHTML += `
          <svg id="interactiveOverlay" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:10; pointer-events:none;" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line id="editorLine" x1="${gradX1}" y1="${gradY1}" x2="${gradX2}" y2="${gradY2}" stroke="rgba(255,255,255,0.5)" stroke-width="0.5" stroke-dasharray="2,1" />
            
            <!-- Visible Nodes (No pointer events) -->
            <circle id="visNode1" cx="${gradX1}" cy="${gradY1}" r="3" fill="${startColor}" stroke="#fff" stroke-width="0.5" style="pointer-events:none;" />
            <circle id="visNode2" cx="${gradX2}" cy="${gradY2}" r="3" fill="${endColor}" stroke="#fff" stroke-width="0.5" style="pointer-events:none;" />
            
            <!-- Invisible hit areas for grabbing (Much larger) -->
            <circle id="node1" cx="${gradX1}" cy="${gradY1}" r="15" fill="transparent" style="pointer-events:all; cursor:grab;" />
            <circle id="node2" cx="${gradX2}" cy="${gradY2}" r="15" fill="transparent" style="pointer-events:all; cursor:grab;" />
          </svg>
        `;
      }

      svgContainer.innerHTML = `<div style="position:relative; width:${width}px; height:${height}px;">${svgHTML}</div>`;
      updateProfileCode();

      if (currentMode === 'gradient') {
        bindInteractiveEditorNodes();
        if (!isEditorBound) {
          bindInteractiveEditorGlobal();
          isEditorBound = true;
        }
      }
    }

    let draggingNode = null;

    function bindInteractiveEditorNodes() {
      const node1 = document.getElementById('node1');
      const node2 = document.getElementById('node2');
      if (!node1 || !node2) return;

      function onPointerDown(e, nodeStr) {
        draggingNode = nodeStr;
        e.target.style.cursor = 'grabbing';
        e.preventDefault();
      }

      node1.addEventListener('mousedown', (e) => onPointerDown(e, 'node1'));
      node2.addEventListener('mousedown', (e) => onPointerDown(e, 'node2'));
      node1.addEventListener('touchstart', (e) => onPointerDown(e.touches[0], 'node1'), {passive: false});
      node2.addEventListener('touchstart', (e) => onPointerDown(e.touches[0], 'node2'), {passive: false});
    }

    function bindInteractiveEditorGlobal() {
      function onPointerMove(e) {
        if (!draggingNode) return;
        const overlay = document.getElementById('interactiveOverlay');
        if (!overlay) return;

        const rect = overlay.getBoundingClientRect();
        
        let x = ((e.clientX - rect.left) / rect.width) * 100;
        let y = ((e.clientY - rect.top) / rect.height) * 100;
        
        x = Math.round(Math.max(0, Math.min(100, x)));
        y = Math.round(Math.max(0, Math.min(100, y)));

        if (draggingNode === 'node1') {
          gradX1 = x;
          gradY1 = y;
        } else {
          gradX2 = x;
          gradY2 = y;
        }
        
        // Fast UI update for both hit areas and visual nodes
        document.getElementById(draggingNode).setAttribute('cx', x);
        document.getElementById(draggingNode).setAttribute('cy', y);
        
        const visId = 'vis' + draggingNode.charAt(0).toUpperCase() + draggingNode.slice(1);
        document.getElementById(visId).setAttribute('cx', x);
        document.getElementById(visId).setAttribute('cy', y);
        
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
          grad.setAttribute('x1', gradX1 + '%');
          grad.setAttribute('y1', gradY1 + '%');
          grad.setAttribute('x2', gradX2 + '%');
          grad.setAttribute('y2', gradY2 + '%');
        }

        // Fast YAML update without full re-render
        const startColor = gradStartColor.value || '#fbbf24';
        const endColor = gradEndColor.value || '#34d399';
        exportActionCode.textContent = `env:\n  GITHUB_TOKEN: \${{ secrets.GH_TOKEN_FOR_GRAPH }}\n  GITHUB_USERNAME: \${{ github.repository_owner }}\n  THEME_MODE: 'gradient'\n  GRADIENT_START: '${startColor}'\n  GRADIENT_END: '${endColor}'\n  GRADIENT_X1: '${gradX1}%'\n  GRADIENT_Y1: '${gradY1}%'\n  GRADIENT_X2: '${gradX2}%'\n  GRADIENT_Y2: '${gradY2}%'`;
      }

      function onPointerUp(e) {
        if (draggingNode) {
          const node = document.getElementById(draggingNode);
          if (node) node.style.cursor = 'grab';
          draggingNode = null;
        }
      }

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

    setMode('solid');
  });
})();
