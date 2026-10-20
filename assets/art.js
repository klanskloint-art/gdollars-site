window.GD_ART = (function () {
  function rgb(hex) {
    let c = String(hex || "#cccccc").replace("#", "");
    if (c.length === 3) c = c.split("").map(x => x + x).join("");
    const n = parseInt(c, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function isLight(hex) {
    const [r, g, b] = rgb(hex);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b > 150;
  }

  function shade(hex, amount) {
    const [r0, g0, b0] = rgb(hex);
    const target = amount < 0 ? 0 : 255;
    const a = Math.abs(amount);
    const mix = v => Math.round(v + (target - v) * a);
    const r = mix(r0), g = mix(g0), b = mix(b0);
    return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }

  let uid = 0;
  const S = 'stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';
  const SOLE = "#F3F3EE";

  const draw = {
    shoes: (c, d) => {
      const light = isLight(c);
      const line = shade(c, light ? -0.5 : -0.55);
      const panel = light ? shade(c, -0.05) : shade(c, 0.12);
      return `
      <g transform="translate(-4 44) scale(0.58)">
        <ellipse cx="182" cy="160" rx="160" ry="7" fill="rgba(0,0,0,.08)"/>
        <path d="M30 118 C28 98 40 86 62 82 L118 74 C132 58 150 44 176 40 L206 40 C214 60 234 74 262 82 C298 92 328 100 334 118 L334 126 L30 126 Z" fill="${c}" stroke="${line}" stroke-width="2.6" stroke-linejoin="round"/>
        <path d="M30 118 C30 100 42 90 64 86 L96 82 C88 96 86 110 90 124 L30 126 Z" fill="${panel}" stroke="${line}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M262 82 C292 90 324 98 334 116 L334 126 L270 126 C262 112 258 96 262 82 Z" fill="${panel}" stroke="${line}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M112 112 C150 100 200 96 252 104" fill="none" stroke="${d}" stroke-width="7" stroke-linecap="round"/>
        <path d="M150 52 C166 74 196 86 232 90" fill="none" stroke="${line}" stroke-width="2"/>
        <g stroke="${light ? line : "#F4F4EF"}" stroke-width="3.4" stroke-linecap="round"><path d="M146 66 L164 56"/><path d="M156 76 L176 66"/><path d="M168 84 L190 74"/><path d="M182 90 L204 80"/></g>
        <g fill="${light ? "#B8BAB5" : "rgba(255,255,255,.35)"}"><circle cx="48" cy="104" r="1.5"/><circle cx="56" cy="100" r="1.5"/><circle cx="64" cy="97" r="1.5"/><circle cx="52" cy="110" r="1.5"/><circle cx="60" cy="106" r="1.5"/><circle cx="68" cy="103" r="1.5"/><circle cx="76" cy="100" r="1.5"/></g>
        <path d="M176 40 C172 30 182 24 196 26 C206 28 210 34 206 40 Z" fill="${panel}" stroke="${line}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M22 126 H342 Q350 126 348 136 Q346 150 332 150 H34 Q18 150 18 138 Q18 126 22 126 Z" fill="#F6F4EE" stroke="${line}" stroke-width="2.6" stroke-linejoin="round"/>
        <path d="M26 134 H342" fill="none" stroke="#B8BAB5" stroke-width="1.3"/>
      </g>`;
    },


    tshirts: (c, d) => `
      <path d="M62 42 L86 32 Q100 46 114 32 L138 42 L172 68 L152 92 L140 84 L140 170 L60 170 L60 84 L48 92 L28 68 Z" fill="${c}" ${S}/>
      <path d="M86 32 Q100 54 114 32" fill="${d}" ${S}/>
      <path d="M62 160 H138" fill="none" ${S} opacity=".45"/>`,

    hoodies: (c, d) => `
      <path d="M64 44 Q70 22 100 20 Q130 22 136 44 L162 62 L176 150 L154 156 L144 98 L144 172 L56 172 L56 98 L46 156 L24 150 L38 62 Z" fill="${c}" ${S}/>
      <path d="M74 48 Q78 28 100 28 Q122 28 126 48 Q114 62 100 62 Q86 62 74 48 Z" fill="${d}" ${S}/>
      <path d="M94 62 V82 M106 62 V82" fill="none" ${S}/>
      <path d="M74 122 H126 L120 146 H80 Z" fill="none" ${S} opacity=".55"/>
      <path d="M56 162 H144" fill="none" ${S} opacity=".45"/>`,

    shorts: (c, d) => `
      <path d="M56 54 H144 L156 140 H110 L100 96 L90 140 H44 Z" fill="${c}" ${S}/>
      <path d="M56 54 H144 L145 70 H55 Z" fill="${d}" ${S}/>
      <path d="M100 70 V96 M92 70 L90 84 M108 70 L110 84" fill="none" ${S} opacity=".55"/>
      <path d="M48 128 H90 M110 128 H153" fill="none" ${S} opacity=".45"/>`,

    accessories: (c, d) => `
      <path d="M72 76 Q72 44 100 44 Q128 44 128 76" fill="none" ${S} stroke-width="6" stroke="${d}"/>
      <path d="M72 76 Q72 44 100 44 Q128 44 128 76" fill="none" ${S}/>
      <path d="M46 76 H154 L146 166 Q145 174 137 174 H63 Q55 174 54 166 Z" fill="${c}" ${S}/>
      <path d="M50 102 H150" fill="none" ${S} opacity=".45"/>
      <rect x="90" y="96" width="20" height="14" rx="3" fill="${d}" ${S}/>`,

    watches: (c, d) => `
      <path d="M84 20 H116 L120 62 H80 Z" fill="${d}" ${S}/>
      <path d="M80 138 H120 L116 180 H84 Z" fill="${d}" ${S}/>
      <path d="M86 30 H114 M86 42 H114 M84 52 H116 M84 150 H116 M86 160 H114 M86 170 H114" fill="none" ${S} opacity=".35"/>
      <rect x="146" y="92" width="10" height="16" rx="3" fill="${c}" ${S}/>
      <circle cx="100" cy="100" r="46" fill="${c}" ${S}/>
      <circle cx="100" cy="100" r="36" fill="#F7F7F2" ${S}/>
      <path d="M100 70 V75 M100 125 V130 M70 100 H75 M125 100 H130" fill="none" ${S}/>
      <path d="M100 100 L100 80 M100 100 L114 108" fill="none" ${S}/>
      <circle cx="100" cy="100" r="3" fill="currentColor"/>`,

    eyewear: (c, d) => `
      <path d="M22 92 Q22 80 34 80 H88 Q98 80 96 92 L92 116 Q90 128 76 128 H44 Q30 128 27 116 Z" fill="${c}" ${S}/>
      <path d="M178 92 Q178 80 166 80 H112 Q102 80 104 92 L108 116 Q110 128 124 128 H156 Q170 128 173 116 Z" fill="${c}" ${S}/>
      <path d="M96 90 Q100 84 104 90" fill="none" ${S}/>
      <path d="M22 86 L10 80 M178 86 L190 80" fill="none" ${S}/>
      <path d="M38 92 L52 92 M120 92 L134 92" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".5"/>`,

    belts: (c, d) => `
      <path d="M20 86 H150 V114 H20 Z" fill="${c}" ${S}/>
      <rect x="150" y="78" width="34" height="44" rx="6" fill="none" ${S} stroke-width="5"/>
      <path d="M150 100 H176" fill="none" ${S} stroke-width="4"/>
      <g fill="currentColor" opacity=".5"><circle cx="60" cy="100" r="3"/><circle cx="80" cy="100" r="3"/><circle cx="100" cy="100" r="3"/><circle cx="120" cy="100" r="3"/></g>`,

    caps: (c, d) => `
      <path d="M44 118 Q42 66 100 62 Q156 64 158 118 Z" fill="${c}" ${S}/>
      <path d="M100 62 V118 M72 68 Q66 92 68 118 M128 68 Q134 92 132 118" fill="none" ${S} opacity=".45"/>
      <circle cx="100" cy="60" r="5" fill="${d}" ${S}/>
      <path d="M150 112 Q186 112 190 128 Q160 134 132 124 Z" fill="${d}" ${S}/>
      <path d="M44 118 H158" fill="none" ${S}/>`,

    pants: (c, d) => `
      <path d="M64 30 H136 L148 176 H112 L100 74 L88 176 H52 Z" fill="${c}" ${S}/>
      <path d="M64 30 H136 L137 44 H63 Z" fill="${d}" ${S}/>
      <path d="M100 44 V74" fill="none" ${S}/>
      <path d="M70 50 Q80 62 92 54 M130 50 Q120 62 108 54" fill="none" ${S} opacity=".55"/>`,

    jackets: (c, d) => `
      <path d="M64 36 L86 28 Q100 38 114 28 L136 36 Q156 44 160 70 L172 150 L150 156 L142 96 L142 172 L58 172 L58 96 L50 156 L28 150 L40 70 Q44 44 64 36 Z" fill="${c}" ${S}/>
      <path d="M86 28 Q100 44 114 28 L110 20 Q100 26 90 20 Z" fill="${d}" ${S}/>
      <path d="M100 36 V172" fill="none" ${S}/>
      <path d="M58 104 H142 M58 136 H142 M40 96 L50 100 M160 96 L150 100" fill="none" ${S} opacity=".5"/>`,

    coats: (c, d) => `
      <path d="M66 32 L88 24 L100 60 L112 24 L134 32 Q154 40 158 66 L168 168 L148 172 L142 96 L142 186 L58 186 L58 96 L52 172 L32 168 L42 66 Q46 40 66 32 Z" fill="${c}" ${S}/>
      <path d="M88 24 L78 52 L100 96 L122 52 L112 24 L100 60 Z" fill="${d}" ${S}/>
      <path d="M100 96 V186" fill="none" ${S}/>
      <circle cx="110" cy="118" r="4" fill="${d}" ${S}/>
      <circle cx="110" cy="144" r="4" fill="${d}" ${S}/>
      <circle cx="110" cy="170" r="4" fill="${d}" ${S}/>`,

    beanies: (c, d) => {
      let ribs = "";
      for (let x = 56; x <= 144; x += 11) ribs += `M${x} 117 V147 `;
      return `
      <path d="M50 122 Q50 50 100 48 Q150 50 150 122 Z" fill="${c}" ${S}/>
      <rect x="44" y="112" width="112" height="40" rx="10" fill="${d}" ${S}/>
      <path d="${ribs}" fill="none" ${S} opacity=".4"/>`;
    },

    socks: (c, d) => {
      const sock = fill => `<path d="M84 26 H120 V110 Q120 120 128 126 L158 148 Q172 158 162 172 Q152 184 136 172 L94 140 Q84 132 84 118 Z" fill="${fill}" ${S}/>`;
      return `
      <g transform="translate(-24 10)" opacity=".6">${sock(d)}</g>
      ${sock(c)}
      <path d="M84 38 H120 M84 46 H120" fill="none" ${S} opacity=".5"/>
      <path d="M128 126 Q138 142 156 146" fill="none" ${S} opacity=".5"/>`;
    },

    underwear: (c, d) => `
      <path d="M40 62 H160 L158 140 L116 146 Q100 120 84 146 L42 140 Z" fill="${c}" ${S}/>
      <path d="M40 62 H160 V82 H40 Z" fill="${d}" ${S}/>
      <path d="M100 82 V118" fill="none" ${S} opacity=".45"/>`,

    bras: (c, d) => `
      <path d="M68 78 L72 40 M132 78 L128 40" fill="none" ${S}/>
      <path d="M42 124 Q44 80 76 74 Q96 78 100 120 Z" fill="${c}" ${S}/>
      <path d="M158 124 Q156 80 124 74 Q104 78 100 120 Z" fill="${c}" ${S}/>
      <path d="M36 120 H164 V140 H36 Z" fill="${d}" ${S}/>`
  };

  return function art(category, color) {
    const c = color || "#cccccc";
    const d = shade(c, isLight(c) ? -0.18 : 0.22);
    const alias = { bags: "accessories", luggage: "accessories" };
    let body = (draw[category] || draw[alias[category]] || draw.tshirts)(c, d);
    const light = isLight(c);
    const ink = shade(c, light ? -0.5 : -0.55);
    const id = "g" + (++uid);
    // soft volume: lighter on top, deeper at the bottom; thin outlines in the item's own tone
    body = body
      .split(`fill="${c}"`).join(`fill="url(#${id}a)"`)
      .split(`fill="${d}"`).join(`fill="url(#${id}b)"`)
      .replace(/stroke="currentColor"/g, `stroke="${ink}"`)
      .replace(/fill="currentColor"/g, `fill="${ink}"`)
      .replace(/stroke-width="2\.5"/g, 'stroke-width="1.6"')
      .replace(/stroke-width="2\.6"/g, 'stroke-width="1.8"');
    const grad = (gid, base) => `<linearGradient id="${gid}" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="${shade(base, 0.16)}"/><stop offset=".55" stop-color="${base}"/><stop offset="1" stop-color="${shade(base, -0.14)}"/></linearGradient>`;
    const ground = category === "shoes" ? "" : `<ellipse cx="100" cy="188" rx="58" ry="4.5" fill="rgba(0,0,0,.07)"/>`;
    return `<svg viewBox="0 0 200 200" aria-hidden="true" focusable="false"><defs>${grad(id + "a", c)}${grad(id + "b", d)}</defs>${ground}${body}</svg>`;
  };
})();
