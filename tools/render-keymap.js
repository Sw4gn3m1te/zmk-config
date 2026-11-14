#!/usr/bin/env node
// Renders config/splitkb_aurora_sofle.keymap to keymap.svg (all layers, true Sofle key positions).
// Usage: node tools/render-keymap.js [keymap] [out.svg]
"use strict";
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const src = process.argv[2] || path.join(root, "config", "splitkb_aurora_sofle.keymap");
const out = process.argv[3] || path.join(root, "keymap.svg");
const text = fs.readFileSync(src, "utf8");

// --- Physical layout: zmk/app/dts/layouts/josefadamcik/sofle.dtsi  [w, h, x, y, rot(centideg), rx, ry]
const P = [
  [100,100,0,37,0,0,0],[100,100,100,37,0,0,0],[100,100,200,12,0,0,0],[100,100,300,0,0,0,0],[100,100,400,12,0,0,0],[100,100,500,24,0,0,0],
  [100,100,900,24,0,0,0],[100,100,1000,12,0,0,0],[100,100,1100,0,0,0,0],[100,100,1200,12,0,0,0],[100,100,1300,37,0,0,0],[100,100,1400,37,0,0,0],
  [100,100,0,137,0,0,0],[100,100,100,137,0,0,0],[100,100,200,112,0,0,0],[100,100,300,100,0,0,0],[100,100,400,112,0,0,0],[100,100,500,124,0,0,0],
  [100,100,900,124,0,0,0],[100,100,1000,112,0,0,0],[100,100,1100,100,0,0,0],[100,100,1200,112,0,0,0],[100,100,1300,137,0,0,0],[100,100,1400,137,0,0,0],
  [100,100,0,237,0,0,0],[100,100,100,237,0,0,0],[100,100,200,212,0,0,0],[100,100,300,200,0,0,0],[100,100,400,212,0,0,0],[100,100,500,224,0,0,0],
  [100,100,900,224,0,0,0],[100,100,1000,212,0,0,0],[100,100,1100,200,0,0,0],[100,100,1200,212,0,0,0],[100,100,1300,237,0,0,0],[100,100,1400,237,0,0,0],
  [100,100,0,337,0,0,0],[100,100,100,337,0,0,0],[100,100,200,312,0,0,0],[100,100,300,300,0,0,0],[100,100,400,312,0,0,0],[100,100,500,324,0,0,0],
  [100,100,600,274,0,0,0],[100,100,800,274,0,0,0],
  [100,100,900,324,0,0,0],[100,100,1000,312,0,0,0],[100,100,1100,300,0,0,0],[100,100,1200,312,0,0,0],[100,100,1300,337,0,0,0],[100,100,1400,337,0,0,0],
  [100,100,175,437,0,0,0],[100,100,275,412,0,0,0],[100,100,375,412,0,0,0],[100,100,490,412,1200,490,412],[100,150,600,383,2400,600,433],
  [100,150,800,383,-2400,900,433],[100,100,910,412,-1200,1010,412],[100,100,1025,412,0,0,0],[100,100,1125,412,0,0,0],[100,100,1225,437,0,0,0]
];
const ENC = { 42: 0, 43: 1 }; // key index -> encoder index

// --- Labels taken from the keymap itself
const DE = {}; // "#define DE_X  ...  // glyph"
for (const m of text.matchAll(/^#define\s+(DE_\w+)\s+\S+[ \t]*(?:\/\/[ \t]*(.+?))?[ \t\r]*$/gm)) {
  const label = m[2] || m[1].slice(3); // no comment: DE_Z -> Z
  DE[m[1]] = label === "backslash" ? "\\" : label;
}
const UC = {}; // "UNICODE(name, h1, h2, h3, h4)"
const hexDigit = t => (t.match(/^KP_N(\d)$/) || [null, t])[1];
for (const m of text.matchAll(/UNICODE\((\w+),\s*(\w+),\s*(\w+),\s*(\w+),\s*(\w+)\)/g)) {
  const hex = m.slice(2, 6).map(hexDigit).join("");
  if (/^[0-9A-F]{4}$/i.test(hex)) UC[m[1]] = [String.fromCodePoint(parseInt(hex, 16)), "U+" + hex.toUpperCase()];
}

// --- Layers
const kmStart = text.indexOf('compatible = "zmk,keymap"');
const km = text.slice(kmStart);
const layers = [];
for (const m of km.matchAll(/(\w+)\s*\{\s*(?:\/\/[^\n]*\n\s*)*bindings\s*=\s*<([\s\S]*?)>;([\s\S]*?)\};/g)) {
  const binds = m[2].replace(/\/\/[^\n]*/g, "").split("&").slice(1).map(s => {
    const t = s.trim().split(/\s+/);
    return { raw: "&" + s.trim(), beh: t[0], args: t.slice(1) };
  });
  const sm = /sensor-bindings\s*=\s*<([^>]*)>/.exec(m[3]);
  const sensors = sm ? sm[1].split("&").slice(1).map(s => s.trim().split(/\s+/).slice(1)) : [];
  layers.push({ node: m[1], binds, sensors });
}
const NICE = { base_layer: "Base", symbol_layer: "Symbols", nav_num_layer: "Nav & Numbers", system_layer: "System" };
const layerName = i => NICE[layers[i].node] || layers[i].node.replace(/_layer$/, "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
const held = {}; // layer index -> key position of its &mo key on Base
layers[0].binds.forEach((b, i) => { if (b.beh === "mo" || b.beh === "lt") held[+b.args[0]] = i; });

const KEY = {
  GRAVE:"`", BSPC:"Bksp", ESC:"Esc", TAB:"Tab", BSLH:"\\", SEMI:";", SQT:"'", COMMA:",", DOT:".", FSLH:"/",
  SPACE:"Space", RET:"Enter", LBKT:"[", RBKT:"]", MINUS:"-", EQUAL:"=",
  LSHFT:"Shift", RSHFT:"Shift", LCTRL:"Ctrl", RCTRL:"Ctrl", LALT:"Alt", RALT:"AltGr", LGUI:"Win", RGUI:"Win",
  CLCK:"Caps\nLock", CAPS:"Caps\nLock", NUBS:"< > |",
  C_PP:"Play\nPause", C_NEXT:"Next", C_PREV:"Prev", C_MUTE:"Mute", C_VOL_UP:"Vol+", C_VOL_DN:"Vol−",
  PG_UP:"PgUp", PG_DN:"PgDn", HOME:"Home", END:"End", INS:"Ins", DEL:"Del", UP:"↑", DOWN:"↓", LEFT:"←", RIGHT:"→",
  SLCK:"Scroll\nLock", PSCRN:"PrtSc"
};
const RGB = { RGB_TOG:"RGB\non/off", RGB_BRI:"Bright\n+", RGB_BRD:"Bright\n−", RGB_EFF:"Effect\nnext", RGB_EFR:"Effect\nprev",
  RGB_SAI:"Sat\n+", RGB_SAD:"Sat\n−", RGB_HUI:"Hue\n+", RGB_HUD:"Hue\n−", RGB_SPI:"Speed\n+", RGB_SPD:"Speed\n−" };
const MODS = /^(L|R)(SHFT|CTRL|ALT|GUI)$|^(CLCK|CAPS)$/;
const NAV = /^(PG_UP|PG_DN|HOME|END|INS|DEL|UP|DOWN|LEFT|RIGHT|BSPC|ESC|TAB|RET|SPACE)$/;

function keyLabel(c) {
  if (KEY[c] !== undefined) return KEY[c];
  if (DE[c] !== undefined) { const u = DE[c].toUpperCase(); return [...u].length === 1 ? u : DE[c]; } // keeps ß as ß
  const n = /^N(\d)$/.exec(c); if (n) return n[1];
  return c;
}
function keyClass(c) {
  if (MODS.test(c)) return "mod";
  if (NAV.test(c)) return "nav";
  if (/^F\d+$/.test(c)) return "fn";
  if (/^C_/.test(c) || c === "PSCRN" || c === "SLCK") return "media";
  return "";
}
function describe(b) {
  const a = b.args;
  switch (b.beh) {
    case "kp": return { tap: keyLabel(a[0]), cls: keyClass(a[0]) };
    case "mt": return { tap: keyLabel(a[1]), hold: keyLabel(a[0]), cls: "mod" };
    case "lt": return { tap: keyLabel(a[1]), hold: "hold " + layerName(+a[0]).split(" ")[0], cls: "layer" };
    case "mo": return { tap: "L" + a[0], hold: "hold " + layerName(+a[0]).split(" ")[0], cls: "layer" };
    case "trans": return { trans: true, cls: "trans" };
    case "none": return { tap: "", cls: "none" };
    case "ext_power": return { tap: a[0] === "EP_ON" ? "Ext pwr\non" : "Ext pwr\ntoggle", cls: "sys" };
    case "bt":
      if (a[0] === "BT_CLR") return { tap: "BT\nclear", cls: "sys" };
      if (a[0] === "BT_CLR_ALL") return { tap: "BT clear\nall", cls: "sys" };
      return { tap: "BT " + a[1], hold: "profile", cls: "sys" };
    case "out": return { tap: "USB\n⇄ BT", hold: "output", cls: "sys" };
    case "sys_reset": return { tap: "Reset", hold: "this half", cls: "sys" };
    case "bootloader": return { tap: "Boot", hold: "this half", cls: "sys" };
    case "soft_off": return { tap: "Off", hold: "both halves", cls: "sys" };
    case "rgb_ug": return { tap: RGB[a[0]] || a[0], cls: "rgb" };
    case "de_caret": return { tap: "^", hold: "macro", cls: "" };
    case "de_grave": return { tap: "`", hold: "macro", cls: "" };
  }
  if (UC[b.beh]) return { tap: UC[b.beh][0], hold: UC[b.beh][1], cls: "uc" };
  return { tap: b.beh, cls: "" };
}

// --- SVG
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const fontSize = lines => {
  const n = Math.max(...lines.map(l => [...l].length));
  if (lines.length > 1) return n <= 4 ? 20 : n <= 6 ? 17 : 15;
  return n === 1 ? 32 : n <= 3 ? 24 : n <= 5 ? 19 : 15;
};
function textBlock(label, cx, cy, cls) {
  const lines = String(label).split("\n");
  const fs = fontSize(lines), lh = fs * 1.15, start = cy - (lines.length - 1) * lh / 2;
  return lines.map((ln, i) =>
    `<text class="${cls || "lbl"}" x="${cx}" y="${(start + i * lh).toFixed(1)}" font-size="${fs}"${lines.length === 1 && [...ln].length <= 2 ? ' font-weight="600"' : ""}>${esc(ln)}</text>`
  ).join("");
}

const base = layers[0].binds.map(describe);
const BOARD_H = 640, TITLE_H = 70, PAD = 40, W = 1500 + PAD * 2;
let y0 = PAD + 60;
let body = "";

layers.forEach((L, li) => {
  const name = layerName(li);
  const holdPos = held[li];
  body += `<text class="layer-title" x="${PAD}" y="${y0}">${esc(name)}</text>`;
  body += `<text class="layer-sub" x="${PAD + name.length * 17 + 24}" y="${y0}">${li === 0 ? "Layer 0 · default" : `Layer ${li} · hold L${li}`}</text>`;
  body += `<g transform="translate(${PAD} ${y0 + 30})">`;
  body += `<text class="half" x="300" y="600">LEFT HALF</text><text class="half" x="1200" y="600">RIGHT HALF</text>`;
  L.binds.forEach((b, i) => {
    const [w, h, x, y, rot, rx, ry] = P[i];
    const d = describe(b);
    const isHeld = holdPos === i;
    const cls = ["cap", d.cls, isHeld ? "held" : ""].filter(Boolean).join(" ");
    const tf = rot ? ` transform="rotate(${rot / 100} ${rx} ${ry})"` : "";
    const cx = x + w / 2, cy = y + h / 2;
    let g = `<g class="${cls}"${tf}>`;
    if (ENC[i] !== undefined) {
      g += `<circle class="knob" cx="${cx}" cy="${cy}" r="46"/><circle class="ridge" cx="${cx}" cy="${cy}" r="38"/>`;
      const lbl = d.trans ? base[i].tap : d.tap;
      if (lbl) g += textBlock(lbl, cx, cy);
      g += `</g>`;
      const s = L.sensors[ENC[i]];
      if (s) {
        g += `<text class="enc" x="${cx}" y="${y - 34}">↺ ${esc(keyLabel(s[0]))}</text>`;
        g += `<text class="enc" x="${cx}" y="${y - 12}">↻ ${esc(keyLabel(s[1]))}</text>`;
      }
      body += g;
      return;
    }
    g += `<rect class="body" x="${x + 4}" y="${y + 4}" width="${w - 8}" height="${h - 8}" rx="12"/>`;
    if (!d.trans && d.cls !== "none" && !isHeld) g += `<rect class="face" x="${x + 13}" y="${y + 10}" width="${w - 26}" height="${h - 28}" rx="8"/>`;
    const faceCy = y + 10 + (h - 28) / 2;
    const tap = isHeld ? "L" + li : d.trans ? (base[i].tap || "") : d.tap;
    const hold = isHeld ? "held" : d.trans ? "" : d.hold;
    if (tap) g += textBlock(tap, cx, hold ? faceCy - 6 : faceCy);
    if (hold) g += `<text class="hold" x="${cx}" y="${y + h - 22}">${esc(hold)}</text>`;
    body += g + `</g>`;
  });
  body += `</g>`;
  y0 += BOARD_H + TITLE_H;
});

// Legend
const legend = [["", "Characters"], ["mod", "Modifiers"], ["layer", "Layer keys"], ["nav", "Navigation & editing"],
  ["fn", "Function keys"], ["media", "Media"], ["sys", "Bluetooth, output & power"], ["rgb", "RGB"], ["uc", "Unicode (Windows hex input)"]];
let lx = PAD, ly = y0 - 20;
legend.forEach(([c, t]) => {
  const wItem = 30 + t.length * 9.2 + 30;
  if (lx + wItem > W - PAD) { lx = PAD; ly += 34; }
  body += `<g class="cap ${c}"><rect class="body" x="${lx}" y="${ly - 14}" width="22" height="22" rx="5"/></g><text class="legend" x="${lx + 30}" y="${ly}">${esc(t)}</text>`;
  lx += wItem;
});
body += `<text class="legend note" x="${PAD}" y="${ly + 36}">Dashed keys fall through to Base (shown faintly). Blank keys do nothing. Filled key = the one held for that layer. Generated by tools/render-keymap.js from config/splitkb_aurora_sofle.keymap.</text>`;

const H = ly + 70;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<title>Aurora Sofle keymap</title>
<style>
  .bg { fill: #f6f7f9; }
  text { font-family: "Segoe UI", "Helvetica Neue", "DejaVu Sans", Arial, sans-serif; }
  .lbl { fill: #1b1f27; font-family: Consolas, "DejaVu Sans Mono", "Menlo", monospace; text-anchor: middle; dominant-baseline: central; }
  .hold { fill: #5f6675; font-size: 13px; font-weight: 600; text-anchor: middle; dominant-baseline: central; letter-spacing: .04em; }
  .layer-title { fill: #1b1f27; font-size: 30px; font-weight: 600; }
  .layer-sub { fill: #5f6675; font-size: 17px; }
  .half { fill: #a4aab5; font-size: 15px; letter-spacing: .14em; text-anchor: middle; }
  .enc { fill: #5f6675; font-size: 15px; text-anchor: middle; font-family: Consolas, "DejaVu Sans Mono", monospace; }
  .legend { fill: #3d4350; font-size: 16px; dominant-baseline: central; }
  .legend.note { fill: #6b7280; font-size: 14px; }
  .cap .body, .cap .knob { fill: #fbfbfc; stroke: #c3c8d1; stroke-width: 2; }
  .cap .face { fill: none; stroke: #c3c8d1; stroke-opacity: .45; stroke-width: 1.5; }
  .cap .ridge { fill: none; stroke: #c3c8d1; stroke-width: 2; stroke-dasharray: 3 6; }
  .mod .body { fill: #ece6f8; stroke: #b8a6dd; }
  .nav .body { fill: #e1f1ea; stroke: #93c7ad; }
  .fn .body { fill: #eef0f3; stroke: #b9bfc9; }
  .media .body, .media .knob { fill: #fbeedd; stroke: #e0b37a; }
  .sys .body { fill: #def0f7; stroke: #86bfd6; }
  .rgb .body { fill: #f8e3ec; stroke: #d896b2; }
  .uc .body { fill: #fbf7dc; stroke: #c9b955; }
  .uc .lbl { font-family: "Cambria Math", "Segoe UI Symbol", "DejaVu Sans", sans-serif; }
  .uc .hold { font-size: 11px; letter-spacing: 0; font-family: Consolas, "DejaVu Sans Mono", monospace; font-weight: 400; }
  .layer .body { fill: #e2e8fd; stroke: #3355d6; stroke-width: 2.5; }
  .layer .hold { fill: #3355d6; font-size: 11px; letter-spacing: 0; }
  .trans .body, .trans .knob { fill: none; stroke-dasharray: 6 5; }
  .trans .lbl { fill: #a4aab5; }
  .none .body, .none .knob { fill: none; stroke: #dde0e6; }
  .held .body { fill: #3355d6; stroke: #3355d6; stroke-dasharray: none; }
  .held .lbl, .held .hold { fill: #ffffff; }
</style>
<rect class="bg" x="0" y="0" width="${W}" height="${H}" rx="18"/>
${body}
</svg>
`;
fs.writeFileSync(out, svg);
console.log(`Wrote ${path.relative(process.cwd(), out)}: ${layers.length} layers, ${layers.map(l => l.binds.length).join("/")} bindings`);
