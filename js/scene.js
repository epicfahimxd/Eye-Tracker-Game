/**
 * Scene renderer — draws procedural crowd scenes on a <canvas>.
 * Each level theme (beach / fair / parade) is drawn deterministically
 * using a seeded RNG so Waldo always ends up in the same spot.
 */
const Scene = (() => {

  /* ── Seeded RNG (mulberry32) ────────────────────────────── */
  function rngFactory(seed) {
    let s = seed >>> 0;
    return () => {
      s += 0x6d2b79f5;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ── Colour palettes ────────────────────────────────────── */
  const SKIN    = ['#FDBCB4','#F1C27D','#E0AC69','#C68642','#8D5524','#FFCBA4','#D4A76A'];
  const SHIRTS  = ['#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD','#98D8C8',
                   '#FF8C94','#A8E6CF','#FFD3A5','#B8E1FF','#C3A6FF','#FF6B9D',
                   '#6BCB77','#4D96FF','#FFD93D','#C77DFF','#A3C4BC','#F9C784'];
  const PANTS   = ['#2C3E50','#34495E','#7F8C8D','#BDC3C7','#1A252F','#4a4e69',
                   '#22223b','#EDE0D4','#6b705c','#a5a58d','#B2D8B2','#5C7AEA'];
  const HAIR    = ['#2C1810','#5C3317','#8B4513','#D2691E','#DAA520','#F4A460',
                   '#C0C0C0','#1C1C1C','#4A0000'];

  function pick(arr, rng) { return arr[Math.floor(rng() * arr.length)]; }

  /* ── Draw a generic person ──────────────────────────────── */
  function drawPerson(ctx, x, y, scale, rng, opts = {}) {
    const skin  = opts.skin  || pick(SKIN,   rng);
    const shirt = opts.shirt || pick(SHIRTS, rng);
    const pants = opts.pants || pick(PANTS,  rng);
    const hair  = opts.hair  || pick(HAIR,   rng);

    const hR  = scale * 0.22;   // head radius
    const bW  = scale * 0.38;   // body width
    const bH  = scale * 0.38;   // body height
    const lH  = scale * 0.34;   // leg height
    const top = y - scale * 0.5;

    /* shadow */
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.07)';
    ctx.beginPath();
    ctx.ellipse(x, y + lH * 0.1, bW * 0.65, scale * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    /* legs */
    ctx.fillStyle = pants;
    ctx.fillRect(x - bW * 0.42, top + bH, bW * 0.4,  lH);
    ctx.fillRect(x + bW * 0.02, top + bH, bW * 0.4,  lH);

    /* shoes */
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x - bW * 0.42 - 2, top + bH + lH - 4, bW * 0.42 + 2, 5);
    ctx.fillRect(x + bW * 0.02 - 2, top + bH + lH - 4, bW * 0.42 + 4, 5);

    /* shirt */
    ctx.fillStyle = shirt;
    ctx.fillRect(x - bW * 0.5, top, bW, bH + 2);

    /* arms */
    ctx.fillStyle = skin;
    ctx.fillRect(x - bW * 0.5 - scale * 0.1, top + 3, scale * 0.1, bH * 0.68);
    ctx.fillRect(x + bW * 0.5,               top + 3, scale * 0.1, bH * 0.68);

    /* neck */
    ctx.fillStyle = skin;
    ctx.fillRect(x - scale * 0.07, top - scale * 0.09, scale * 0.14, scale * 0.12);

    /* head */
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(x, top - hR, hR, 0, Math.PI * 2);
    ctx.fill();

    /* hair */
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.arc(x, top - hR, hR, Math.PI, 0);
    ctx.fill();

    /* optional accessories */
    const acc = rng();
    if (acc < 0.12) {
      /* simple hat */
      ctx.fillStyle = pick(SHIRTS, rng);
      ctx.fillRect(x - hR * 1.1, top - hR * 1.75, hR * 2.2, hR * 0.4);
      ctx.fillRect(x - hR * 0.82, top - hR * 2.5, hR * 1.64, hR * 0.82);
    } else if (acc < 0.22) {
      /* sunglasses */
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(x - hR * 0.88, top - hR * 0.92, hR * 0.76, hR * 0.45);
      ctx.fillRect(x + hR * 0.12, top - hR * 0.92, hR * 0.76, hR * 0.45);
    }
  }

  /* ── Draw Waldo ─────────────────────────────────────────── */
  function drawWaldo(ctx, x, y, scale) {
    const hR  = scale * 0.22;
    const bW  = scale * 0.38;
    const bH  = scale * 0.38;
    const lH  = scale * 0.34;
    const top = y - scale * 0.5;

    /* shadow */
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.ellipse(x, y + lH * 0.12, bW * 0.75, scale * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    /* legs — blue jeans */
    ctx.fillStyle = '#2A52BE';
    ctx.fillRect(x - bW * 0.42, top + bH, bW * 0.4, lH);
    ctx.fillRect(x + bW * 0.02, top + bH, bW * 0.4, lH);
    /* crease */
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(x - 1, top + bH, 2, lH);

    /* shoes — brown */
    ctx.fillStyle = '#5C3317';
    ctx.fillRect(x - bW * 0.42 - 3, top + bH + lH - 5, bW * 0.42 + 3, 6);
    ctx.fillRect(x + bW * 0.02 - 3, top + bH + lH - 5, bW * 0.42 + 6, 6);

    /* striped shirt — red & white horizontal stripes */
    const strH = Math.max(2, Math.floor(bH / 5));
    for (let i = 0; i <= Math.ceil((bH + 2) / strH); i++) {
      ctx.fillStyle = i % 2 === 0 ? '#E63030' : '#FFFFFF';
      ctx.fillRect(x - bW * 0.5, top + i * strH, bW, Math.min(strH, bH + 2 - i * strH));
    }

    /* striped arms */
    const armH = bH * 0.68;
    const aStrH = Math.max(2, Math.floor(armH / 3));
    for (let i = 0; i <= Math.ceil(armH / aStrH); i++) {
      ctx.fillStyle = i % 2 === 0 ? '#E63030' : '#FFFFFF';
      const segH = Math.min(aStrH, armH - i * aStrH);
      if (segH <= 0) break;
      ctx.fillRect(x - bW * 0.5 - scale * 0.1, top + 3 + i * aStrH, scale * 0.1, segH);
      ctx.fillRect(x + bW * 0.5,               top + 3 + i * aStrH, scale * 0.1, segH);
    }

    /* neck */
    ctx.fillStyle = '#F1C27D';
    ctx.fillRect(x - scale * 0.07, top - scale * 0.09, scale * 0.14, scale * 0.12);

    /* head */
    ctx.fillStyle = '#F1C27D';
    ctx.beginPath();
    ctx.arc(x, top - hR, hR, 0, Math.PI * 2);
    ctx.fill();

    /* brown hair */
    ctx.fillStyle = '#5C3317';
    ctx.beginPath();
    ctx.arc(x, top - hR, hR, Math.PI, 0);
    ctx.fill();

    /* ── Hat ── */
    const hatBase = top - hR * 1.72;
    /* brim */
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x - hR * 1.25, hatBase, hR * 2.5, hR * 0.38);
    /* crown — red */
    ctx.fillStyle = '#E63030';
    ctx.fillRect(x - hR * 0.92, hatBase - hR * 0.95, hR * 1.84, hR * 0.95);
    /* white stripe on crown */
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x - hR * 0.92, hatBase - hR * 0.57, hR * 1.84, hR * 0.22);
    /* bobble */
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x, hatBase - hR * 1.02, hR * 0.23, 0, Math.PI * 2);
    ctx.fill();

    /* ── Glasses ── */
    ctx.strokeStyle = '#111';
    ctx.lineWidth = Math.max(1, scale * 0.025);
    /* left lens */
    ctx.beginPath();
    ctx.arc(x - hR * 0.38, top - hR * 0.92, hR * 0.28, 0, Math.PI * 2);
    ctx.stroke();
    /* right lens */
    ctx.beginPath();
    ctx.arc(x + hR * 0.38, top - hR * 0.92, hR * 0.28, 0, Math.PI * 2);
    ctx.stroke();
    /* bridge */
    ctx.beginPath();
    ctx.moveTo(x - hR * 0.1, top - hR * 0.92);
    ctx.lineTo(x + hR * 0.1, top - hR * 0.92);
    ctx.stroke();
    /* arms */
    ctx.beginPath();
    ctx.moveTo(x - hR * 0.66, top - hR * 0.92);
    ctx.lineTo(x - hR * 1.02, top - hR * 0.87);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + hR * 0.66, top - hR * 0.92);
    ctx.lineTo(x + hR * 1.02, top - hR * 0.87);
    ctx.stroke();

    /* smile */
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = Math.max(1, scale * 0.022);
    ctx.beginPath();
    ctx.arc(x, top - hR * 0.6, hR * 0.22, 0.15, Math.PI - 0.15);
    ctx.stroke();
  }

  /* ── Populate + sort crowd ──────────────────────────────── */
  function buildCrowd(count, minX, maxX, minY, maxY, waldoX, waldoY, scale, rng) {
    const people = [];
    for (let i = 0; i < count; i++) {
      let px, py, attempts = 0;
      do {
        px = minX + rng() * (maxX - minX);
        py = minY + rng() * (maxY - minY);
        attempts++;
      } while (
        attempts < 20 &&
        Math.abs(px - waldoX) < scale * 2.5 &&
        Math.abs(py - waldoY) < scale * 2.5
      );
      people.push({ x: px, y: py, waldo: false });
    }
    people.push({ x: waldoX, y: waldoY, waldo: true });
    people.sort((a, b) => a.y - b.y);
    return people;
  }

  /* ════════════════════════════════════════════════════════
     LEVEL 1 — BEACH
  ════════════════════════════════════════════════════════ */
  function drawBeach(ctx, W, H, level) {
    const rng = rngFactory(0xBEAC01);
    const wX  = level.waldoX * W;
    const wY  = level.waldoY * H;
    const sc  = level.waldoScale;

    /* sky */
    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.48);
    sky.addColorStop(0, '#87CEEB');
    sky.addColorStop(1, '#D6EFFF');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H * 0.48);

    /* clouds */
    [[0.1,0.09,85],[0.38,0.13,110],[0.67,0.07,95],[0.86,0.16,75]].forEach(([cx,cy,cr]) => {
      ctx.fillStyle = 'rgba(255,255,255,0.82)';
      [0,-cr*0.55,cr*0.55].forEach(dx => {
        ctx.beginPath();
        ctx.arc(W*cx+dx, H*cy+(Math.abs(dx)*0.08), cr*(1-Math.abs(dx/cr)*0.3), 0, Math.PI*2);
        ctx.fill();
      });
    });

    /* ocean */
    const ocean = ctx.createLinearGradient(0, H*0.48, 0, H*0.64);
    ocean.addColorStop(0, '#1E90FF');
    ocean.addColorStop(1, '#00BFFF');
    ctx.fillStyle = ocean;
    ctx.fillRect(0, H*0.48, W, H*0.16);

    /* waves */
    for (let i = 0; i < 5; i++) {
      const wy = H*(0.5 + i*0.025);
      ctx.strokeStyle = `rgba(255,255,255,${0.3 + i*0.05})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, wy);
      for (let wx = 0; wx < W; wx += 50) {
        ctx.quadraticCurveTo(wx+25, wy-7, wx+50, wy);
      }
      ctx.stroke();
    }

    /* sand */
    const sand = ctx.createLinearGradient(0, H*0.64, 0, H);
    sand.addColorStop(0, '#F5DEB3');
    sand.addColorStop(1, '#DEB887');
    ctx.fillStyle = sand;
    ctx.fillRect(0, H*0.64, W, H*0.36);

    /* beach umbrellas */
    const umbColors = ['#FF6B6B','#4ECDC4','#FFEAA7','#96CEB4','#DDA0DD','#FF8C94','#45B7D1'];
    for (let i = 0; i < 14; i++) {
      const ux = rng() * W;
      const uy = H*(0.66 + rng()*0.24);
      const ur = 28 + rng()*18;
      const uc = umbColors[i % umbColors.length];
      /* pole */
      ctx.strokeStyle = '#8B4513'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(ux, uy); ctx.lineTo(ux, uy + ur*1.5); ctx.stroke();
      /* canopy */
      ctx.fillStyle = uc;
      ctx.beginPath(); ctx.arc(ux, uy, ur, Math.PI, 0); ctx.fill();
      /* stripes */
      ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1;
      for (let j = -1; j <= 1; j++) {
        ctx.beginPath();
        ctx.moveTo(ux + j*ur*0.35, uy);
        ctx.lineTo(ux + j*ur*0.55, uy - ur);
        ctx.stroke();
      }
    }

    /* beach towels */
    const towelColors = ['#FF6B6B','#4ECDC4','#FFEAA7','#DDA0DD','#96CEB4','#45B7D1'];
    for (let i = 0; i < 10; i++) {
      ctx.save();
      ctx.translate(rng()*W*0.92+W*0.04, H*(0.7+rng()*0.22));
      ctx.rotate((rng()-0.5)*0.6);
      ctx.fillStyle = towelColors[i%towelColors.length];
      ctx.fillRect(-26, -9, 52, 18);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      for (let j=0; j<3; j++) ctx.fillRect(-26+j*18, -9, 7, 18);
      ctx.restore();
    }

    /* crowd */
    const crowd = buildCrowd(level.crowdCount, W*0.02, W*0.98, H*0.67, H*0.92, wX, wY, sc, rng);
    const beachShirts = ['#FF6B6B','#4ECDC4','#FFEAA7','#DDA0DD','#FF8C94','#45B7D1','#F7DC6F','#A8E6CF'];
    const swimPants   = ['#FF6B6B','#4ECDC4','#45B7D1','#FFEAA7','#DDA0DD','#FF8C94','#6BCB77','#C77DFF'];
    crowd.forEach(p => {
      const depth = (p.y - H*0.67) / (H*0.92 - H*0.67);
      const s = sc * (0.65 + depth * 0.5);
      if (p.waldo) {
        drawWaldo(ctx, p.x, p.y, sc);
      } else {
        drawPerson(ctx, p.x, p.y, s, rng, {
          shirt: pick(beachShirts, rng),
          pants: pick(swimPants, rng),
        });
      }
    });

    /* foreground pebbles */
    ctx.fillStyle = 'rgba(210,180,140,0.45)';
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      ctx.arc(rng()*W, H*(0.93+rng()*0.07), rng()*4+1, 0, Math.PI*2);
      ctx.fill();
    }
  }

  /* ════════════════════════════════════════════════════════
     LEVEL 2 — COUNTY FAIR
  ════════════════════════════════════════════════════════ */
  function drawFair(ctx, W, H, level) {
    const rng = rngFactory(0xFA1700);
    const wX  = level.waldoX * W;
    const wY  = level.waldoY * H;
    const sc  = level.waldoScale;

    /* sunset sky */
    const sky = ctx.createLinearGradient(0, 0, 0, H*0.44);
    sky.addColorStop(0, '#FF5722');
    sky.addColorStop(0.5,'#FF8A65');
    sky.addColorStop(1, '#FFCC80');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H*0.44);

    /* golden clouds */
    [[0.18,0.08,72],[0.52,0.13,105],[0.82,0.06,82]].forEach(([cx,cy,cr])=>{
      ctx.fillStyle='rgba(255,225,160,0.55)';
      [0,-cr*0.55,cr*0.55].forEach(dx=>{
        ctx.beginPath();
        ctx.arc(W*cx+dx, H*cy+(Math.abs(dx)*0.08), cr*(1-Math.abs(dx/cr)*0.3),0,Math.PI*2);
        ctx.fill();
      });
    });

    /* grass */
    const grass = ctx.createLinearGradient(0,H*0.44,0,H);
    grass.addColorStop(0,'#4CAF50');
    grass.addColorStop(1,'#388E3C');
    ctx.fillStyle=grass; ctx.fillRect(0,H*0.44,W,H*0.56);

    /* dirt path */
    ctx.fillStyle='#A1887F';
    ctx.beginPath();
    ctx.moveTo(W*0.3,H*0.44); ctx.lineTo(W*0.7,H*0.44);
    ctx.lineTo(W*0.85,H); ctx.lineTo(W*0.15,H); ctx.closePath();
    ctx.fill();

    /* ferris wheel */
    const fwX=W*0.84, fwY=H*0.28, fwR=Math.min(W*0.08, 90);
    ctx.strokeStyle='#90A4AE'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.arc(fwX,fwY,fwR,0,Math.PI*2); ctx.stroke();
    for (let a=0; a<Math.PI*2; a+=Math.PI/4) {
      ctx.beginPath(); ctx.moveTo(fwX,fwY);
      ctx.lineTo(fwX+Math.cos(a)*fwR, fwY+Math.sin(a)*fwR); ctx.stroke();
    }
    const carColors=['#E53935','#1E88E5','#43A047','#FDD835','#8E24AA','#F57C00','#00ACC1','#D81B60'];
    for (let a=0; a<Math.PI*2; a+=Math.PI/4) {
      const k=Math.floor(a/(Math.PI/4));
      ctx.fillStyle=carColors[k%carColors.length];
      const cx=fwX+Math.cos(a)*fwR, cy=fwY+Math.sin(a)*fwR;
      ctx.fillRect(cx-9,cy-7,18,14);
      ctx.strokeStyle='#333'; ctx.lineWidth=1; ctx.strokeRect(cx-9,cy-7,18,14);
    }
    /* support */
    ctx.strokeStyle='#78909C'; ctx.lineWidth=5;
    ctx.beginPath(); ctx.moveTo(fwX-8,fwY); ctx.lineTo(fwX-28,H*0.48); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(fwX+8,fwY); ctx.lineTo(fwX+28,H*0.48); ctx.stroke();

    /* stalls / tents */
    const stallDefs=[
      {x:0.03,w:0.11},{x:0.17,w:0.12},{x:0.32,w:0.13},{x:0.49,w:0.12},{x:0.64,w:0.11}
    ];
    const tentPairs=[['#E53935','#FFF'],['#1E88E5','#FFF'],['#43A047','#FFD700'],
                     ['#FDD835','#FF5722'],['#8E24AA','#FFF']];
    stallDefs.forEach((s,i)=>{
      const [c1,c2]=tentPairs[i%tentPairs.length];
      const sx=s.x*W, sy=H*0.46, sw=s.w*W, sh=H*0.12;
      /* body */
      ctx.fillStyle='#F5F5DC';
      ctx.fillRect(sx, sy+sh*0.42, sw, sh*0.58);
      /* striped awning */
      const sn=8;
      for (let j=0; j<sn; j++) {
        ctx.fillStyle=j%2===0?c1:c2;
        const x0=sx+j*(sw/sn), x1=sx+(j+1)*(sw/sn);
        ctx.beginPath();
        ctx.moveTo(x0,sy); ctx.lineTo(x1,sy);
        ctx.lineTo(x1+4,sy+sh*0.46); ctx.lineTo(x0-4,sy+sh*0.46);
        ctx.closePath(); ctx.fill();
      }
      /* sign */
      ctx.fillStyle=c1;
      ctx.fillRect(sx+sw*0.1, sy-14, sw*0.8, 14);
    });

    /* balloons */
    const ballColors=['#E53935','#1E88E5','#43A047','#FDD835','#8E24AA','#FF8C00','#00BCD4'];
    for (let i=0; i<22; i++) {
      const bx=rng()*W*0.8+W*0.1, by=H*(0.28+rng()*0.2), br=7+rng()*5;
      ctx.fillStyle=ballColors[i%ballColors.length];
      ctx.beginPath(); ctx.arc(bx,by,br,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.28)';
      ctx.beginPath(); ctx.arc(bx-br*0.3,by-br*0.35,br*0.32,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='#555'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(bx,by+br); ctx.lineTo(bx+(rng()-0.5)*12,by+br+22); ctx.stroke();
    }

    /* crowd */
    const crowd = buildCrowd(level.crowdCount, W*0.01, W*0.99, H*0.52, H*0.9, wX, wY, sc, rng);
    crowd.forEach(p => {
      const depth=(p.y-H*0.52)/(H*0.9-H*0.52);
      const s=sc*(0.6+depth*0.55);
      p.waldo ? drawWaldo(ctx,p.x,p.y,sc) : drawPerson(ctx,p.x,p.y,s,rng);
    });
  }

  /* ════════════════════════════════════════════════════════
     LEVEL 3 — CITY PARADE
  ════════════════════════════════════════════════════════ */
  function drawParade(ctx, W, H, level) {
    const rng = rngFactory(0xC17ADE);
    const wX  = level.waldoX * W;
    const wY  = level.waldoY * H;
    const sc  = level.waldoScale;

    /* deep blue sky */
    const sky=ctx.createLinearGradient(0,0,0,H*0.32);
    sky.addColorStop(0,'#0D47A1');
    sky.addColorStop(1,'#1565C0');
    ctx.fillStyle=sky; ctx.fillRect(0,0,W,H*0.32);

    /* buildings */
    const bldColors=['#37474F','#455A64','#546E7A','#263238','#1A237E','#311B92','#4A148C'];
    let bx2=0;
    while(bx2<W) {
      const bw=55+rng()*90, bh=H*(0.12+rng()*0.22);
      ctx.fillStyle=pick(bldColors,rng);
      ctx.fillRect(bx2, H*0.32-bh, bw, bh);
      ctx.fillStyle='rgba(255,235,59,0.35)';
      for(let wy=H*0.32-bh+8; wy<H*0.32-8; wy+=14)
        for(let wx=bx2+7; wx<bx2+bw-7; wx+=13)
          if(rng()>0.28) ctx.fillRect(wx,wy,7,9);
      bx2+=bw+1;
    }

    /* street & sidewalks */
    const street=ctx.createLinearGradient(0,H*0.32,0,H);
    street.addColorStop(0,'#607D8B'); street.addColorStop(1,'#455A64');
    ctx.fillStyle=street; ctx.fillRect(0,H*0.32,W,H*0.68);
    /* curbs */
    ctx.fillStyle='#B0BEC5';
    ctx.fillRect(0,H*0.32,W,H*0.07);
    ctx.fillRect(0,H*0.84,W,H*0.16);
    /* road center line */
    ctx.setLineDash([28,18]); ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(0,H*0.6); ctx.lineTo(W,H*0.6); ctx.stroke();
    ctx.setLineDash([]);

    /* confetti */
    const cfColors=['#E53935','#1E88E5','#43A047','#FDD835','#8E24AA','#FF8C00','#00BCD4'];
    for(let i=0; i<180; i++){
      ctx.save();
      ctx.fillStyle=cfColors[i%cfColors.length];
      ctx.translate(rng()*W, rng()*H*0.65);
      ctx.rotate(rng()*Math.PI*2);
      ctx.fillRect(-4,-2,8,4);
      ctx.restore();
    }

    /* streamers / banners */
    for(let i=0; i<7; i++){
      const sx=W*(0.04+i*0.14);
      ctx.strokeStyle=cfColors[i%cfColors.length]; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(sx,0);
      for(let wy=0; wy<H*0.35; wy+=20)
        ctx.lineTo(sx+Math.sin(wy*0.09)*14, wy);
      ctx.stroke();
    }

    /* parade float */
    ctx.fillStyle='#FDD835';
    ctx.fillRect(W*0.08,H*0.62,W*0.2,H*0.11);
    ctx.fillStyle='#E53935';
    ctx.beginPath(); ctx.arc(W*0.18,H*0.62,20,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#1a1a1a';
    ctx.beginPath(); ctx.arc(W*0.1,H*0.73,10,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(W*0.26,H*0.73,10,0,Math.PI*2); ctx.fill();

    /* dense crowd — upper sidewalk + street + lower sidewalk */
    const crowd = [];
    const zones = [
      {minY: H*0.33, maxY: H*0.39, weight: 0.35},
      {minY: H*0.41, maxY: H*0.80, weight: 0.45},
      {minY: H*0.84, maxY: H*0.95, weight: 0.20},
    ];
    for(let i=0; i<level.crowdCount; i++){
      let px, py, attempts=0;
      /* pick zone by weight */
      const r=rng(), zone=r<0.35?zones[0]:r<0.80?zones[1]:zones[2];
      do {
        px=rng()*W;
        py=zone.minY+rng()*(zone.maxY-zone.minY);
        attempts++;
      } while(
        attempts<20 &&
        Math.abs(px-wX)<sc*2.5 && Math.abs(py-wY)<sc*2.5
      );
      crowd.push({x:px,y:py,waldo:false});
    }
    crowd.push({x:wX,y:wY,waldo:true});
    crowd.sort((a,b)=>a.y-b.y);
    crowd.forEach(p=>{
      const depth=(p.y-H*0.33)/(H*0.95-H*0.33);
      const s=sc*(0.45+depth*0.8);
      p.waldo ? drawWaldo(ctx,p.x,p.y,sc) : drawPerson(ctx,p.x,p.y,s,rng);
    });
  }

  /* ─── Public API ─────────────────────────────────────────── */

  /**
   * Draw the complete scene for the given level onto a canvas.
   * The canvas width/height should already be set by the caller.
   */
  function drawScene(canvas, level) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    switch (level.theme) {
      case 'beach':   drawBeach(ctx,   canvas.width, canvas.height, level); break;
      case 'fair':    drawFair(ctx,    canvas.width, canvas.height, level); break;
      case 'parade':  drawParade(ctx,  canvas.width, canvas.height, level); break;
    }
  }

  /**
   * Return Waldo's pixel coordinates + detection radius for a rendered canvas.
   */
  function waldoBounds(canvas, level) {
    const W = canvas.width, H = canvas.height;
    return {
      x: level.waldoX * W,
      y: level.waldoY * H,
      r: level.detectRadius * W,
    };
  }

  /**
   * Draw a gold highlight circle around Waldo (called on found).
   */
  function highlightWaldo(canvas, level) {
    const ctx = canvas.getContext('2d');
    const b   = waldoBounds(canvas, level);
    ctx.save();
    ctx.shadowColor  = '#FFD700'; ctx.shadowBlur = 24;
    ctx.strokeStyle  = '#FFD700'; ctx.lineWidth  = 4;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 1.6, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle  = 'rgba(255,215,0,0.35)'; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 2.2, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  return { drawScene, waldoBounds, highlightWaldo };
})();
