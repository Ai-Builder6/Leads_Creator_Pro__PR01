import JSZip from "jszip";
import { RsaCampaign, DEFAULT_FACEBOOK_CONFIG } from "../data/tidyUpPresets";
import { buildMetaAdsManagerCsv } from "../components/FacebookAdsStudio";

export interface BrandAdVisualPreset {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  dimensionsLabel: string;
  width: number;
  height: number;
  aspectRatio: "1:1" | "16:9" | "4:3" | "9:16";
  themeGradient: [string, string, string];
  accentColor: string;
  checklist: string[];
  fileName: string;
}

export const MOVE_OUT_MEDIA_KIT_PRESETS: BrandAdVisualPreset[] = [
  {
    id: "app_icon_1024",
    title: "TidyUps Cleaning",
    subtitle: "tidyupscleaning.com · 587-742-2500",
    badge: "OFFICIAL APP ICON (1024 × 1024)",
    dimensionsLabel: "1024 × 1024 px (Meta App Icon & Brand Logo)",
    width: 1024,
    height: 1024,
    aspectRatio: "1:1",
    themeGradient: ["#160d1f", "#4a1259", "#ec4899"],
    accentColor: "#f472b6",
    checklist: [
      "Meta App Review Ready (1024 × 1024 PNG)",
      "Facebook Page & Instagram Profile Logo",
      "Google Ads Square Logo Asset",
    ],
    fileName: "TidyUps-App-Icon-1024x1024.png",
  },
  {
    id: "fb_move_out_square",
    title: "Edmonton Move-Out Cleaning",
    subtitle: "Pass Your Landlord Inspection — 100% Guaranteed",
    badge: "MOVE-OUT & END OF TENANCY SPECIAL",
    dimensionsLabel: "1080 × 1080 px (Facebook & Instagram Feed Ad)",
    width: 1080,
    height: 1080,
    aspectRatio: "1:1",
    themeGradient: ["#110918", "#581c87", "#db2777"],
    accentColor: "#34d399",
    checklist: [
      "Inside Oven, Fridge & Kitchen Cabinets",
      "Baseboards, Door Frames & Window Tracks",
      "Full Bathroom & Floor Sanitization",
      "Book Online: app.tidyupscleaning.com/booking",
    ],
    fileName: "TidyUps-Facebook-Ad-Move-Out-1080x1080.png",
  },
  {
    id: "fb_deep_clean_square",
    title: "Deep Home Cleaning Edmonton",
    subtitle: "Top-to-Bottom Scrubbing by Vetted Local Pros",
    badge: "FLAT-RATE DEEP CLEAN PACKAGE",
    dimensionsLabel: "1080 × 1080 px (Facebook & Google Square Ad)",
    width: 1080,
    height: 1080,
    aspectRatio: "1:1",
    themeGradient: ["#0f172a", "#0f766e", "#0d9488"],
    accentColor: "#fbbf24",
    checklist: [
      "Kitchen Grease, Tile Grout & Tubs",
      "All Supplies & Commercial Equipment Included",
      "Serving Edmonton & Surrounding Areas",
      "Call 587-742-2500 or Book in 60 Seconds",
    ],
    fileName: "TidyUps-Facebook-Ad-Deep-Clean-1080x1080.png",
  },
  {
    id: "ig_story_move_out",
    title: "Moving Out in Edmonton?",
    subtitle: "Leave the Scrubbing to TidyUps Cleaning!",
    badge: "24-HOUR RE-CLEAN GUARANTEE",
    dimensionsLabel: "1080 × 1920 px (Instagram & FB Story / Reel)",
    width: 1080,
    height: 1920,
    aspectRatio: "9:16",
    themeGradient: ["#180b20", "#6b21a8", "#ec4899"],
    accentColor: "#38bdf8",
    checklist: [
      "Landlord Checklist Approved",
      "Inside Appliances & Cabinets",
      "Instant Flat-Rate Online Quote",
      "Tap 'Book Now' → app.tidyupscleaning.com",
    ],
    fileName: "TidyUps-Story-Reel-Move-Out-1080x1920.png",
  },
];

function drawSparkleStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  fillStyle: string
) {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();
  ctx.restore();
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Generates an exact 1024x1024 PNG data URL for the official TidyUps Cleaning App Icon / Logo.
 */
export function generate1024AppIconPngDataUrl(
  customSize = 1024
): string {
  const canvas = document.createElement("canvas");
  canvas.width = customSize;
  canvas.height = customSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const s = customSize / 1024;

  // 1. Rich luxury background gradient (matching bookmycleaning.net & app.tidyupscleaning.com)
  const bgGrad = ctx.createLinearGradient(0, 0, customSize, customSize);
  bgGrad.addColorStop(0, "#140b1d");
  bgGrad.addColorStop(0.45, "#4c1d95");
  bgGrad.addColorStop(1, "#db2777");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, customSize, customSize);

  // 2. Subtle glowing radial aura in center
  const aura = ctx.createRadialGradient(
    512 * s,
    430 * s,
    60 * s,
    512 * s,
    430 * s,
    460 * s
  );
  aura.addColorStop(0, "rgba(244, 114, 182, 0.38)");
  aura.addColorStop(0.6, "rgba(168, 85, 247, 0.14)");
  aura.addColorStop(1, "rgba(20, 11, 29, 0)");
  ctx.fillStyle = aura;
  ctx.fillRect(0, 0, customSize, customSize);

  // 3. Outer glossy badge border
  ctx.save();
  drawRoundedRect(ctx, 56 * s, 56 * s, 912 * s, 912 * s, 180 * s);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
  ctx.lineWidth = 6 * s;
  ctx.stroke();
  ctx.restore();

  // 4. Center Emblem Circle / Shield
  ctx.save();
  const shieldGrad = ctx.createLinearGradient(
    300 * s,
    160 * s,
    724 * s,
    560 * s
  );
  shieldGrad.addColorStop(0, "#ec4899");
  shieldGrad.addColorStop(1, "#7c3aed");
  drawRoundedRect(ctx, 312 * s, 145 * s, 400 * s, 360 * s, 96 * s);
  ctx.fillStyle = shieldGrad;
  ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
  ctx.shadowBlur = 36 * s;
  ctx.shadowOffsetY = 14 * s;
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
  ctx.lineWidth = 5 * s;
  ctx.stroke();
  ctx.restore();

  // 5. Crisp White House Roof & Window inside the Emblem
  ctx.save();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 24 * s;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  // Roof
  ctx.beginPath();
  ctx.moveTo(372 * s, 325 * s);
  ctx.lineTo(512 * s, 205 * s);
  ctx.lineTo(652 * s, 325 * s);
  ctx.stroke();

  // House body
  ctx.lineWidth = 20 * s;
  ctx.beginPath();
  ctx.moveTo(408 * s, 305 * s);
  ctx.lineTo(408 * s, 445 * s);
  ctx.lineTo(616 * s, 445 * s);
  ctx.lineTo(616 * s, 305 * s);
  ctx.stroke();

  // 4-pane window inside house
  ctx.fillStyle = "#fde047";
  const winSize = 34 * s;
  const gap = 10 * s;
  const wx = 512 * s - winSize - gap / 2;
  const wy = 328 * s;
  ctx.fillRect(wx, wy, winSize, winSize);
  ctx.fillRect(wx + winSize + gap, wy, winSize, winSize);
  ctx.fillRect(wx, wy + winSize + gap, winSize, winSize);
  ctx.fillRect(wx + winSize + gap, wy + winSize + gap, winSize, winSize);
  ctx.restore();

  // 6. Sparkling Cleaning Stars around the House
  drawSparkleStar(ctx, 646 * s, 212 * s, 34 * s, 10 * s, "#fde047");
  drawSparkleStar(ctx, 382 * s, 222 * s, 24 * s, 7 * s, "#ffffff");
  drawSparkleStar(ctx, 668 * s, 415 * s, 20 * s, 6 * s, "#5eead4");

  // 7. Bold Brand Title: "TidyUps"
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.font = `900 ${122 * s}px "Plus Jakarta Sans", "Inter", system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 18 * s;
  ctx.fillText("TidyUps", 512 * s, 650 * s);

  // Subtitle: "CLEANING"
  ctx.fillStyle = "#f9a8d4";
  ctx.font = `800 ${54 * s}px "Plus Jakarta Sans", "Inter", system-ui, sans-serif`;
  ctx.fillText("CLEANING", 512 * s, 725 * s);
  ctx.restore();

  // 8. Bottom Domain Pill ("tidyupscleaning.com")
  ctx.save();
  drawRoundedRect(ctx, 182 * s, 780 * s, 660 * s, 88 * s, 44 * s);
  ctx.fillStyle = "rgba(15, 23, 42, 0.72)";
  ctx.fill();
  ctx.strokeStyle = "rgba(244, 114, 182, 0.65)";
  ctx.lineWidth = 3 * s;
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = `700 ${34 * s}px "JetBrains Mono", monospace`;
  ctx.textAlign = "center";
  ctx.fillText("tidyupscleaning.com", 512 * s, 836 * s);

  ctx.fillStyle = "#5eead4";
  ctx.font = `700 ${28 * s}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillText("EDMONTON MOVE-OUT & DEEP CLEAN · 587-742-2500", 512 * s, 918 * s);
  ctx.restore();

  return canvas.toDataURL("image/png");
}

/**
 * Generates high-resolution Move-Out & Deep Cleaning ad graphics for Facebook, Instagram, and Google Ads.
 */
export function generateBrandAdPresetPngDataUrl(
  preset: BrandAdVisualPreset,
  phoneNumber = "587-742-2500"
): string {
  if (preset.id === "app_icon_1024") {
    return generate1024AppIconPngDataUrl(1024);
  }

  const canvas = document.createElement("canvas");
  canvas.width = preset.width;
  canvas.height = preset.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const w = preset.width;
  const h = preset.height;
  const isVertical = h > w;

  // 1. Background gradient
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, preset.themeGradient[0]);
  grad.addColorStop(0.5, preset.themeGradient[1]);
  grad.addColorStop(1, preset.themeGradient[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Decorative sparkle stars
  drawSparkleStar(ctx, w * 0.88, h * 0.14, 42, 12, "#fde047");
  drawSparkleStar(ctx, w * 0.12, h * 0.22, 28, 8, "rgba(255,255,255,0.65)");
  drawSparkleStar(ctx, w * 0.85, h * 0.78, 32, 9, preset.accentColor);

  // 2. Top Brand Header Bar with Mini Logo
  ctx.save();
  drawRoundedRect(ctx, 64, 56, w - 128, 110, 28);
  ctx.fillStyle = "rgba(15, 23, 42, 0.68)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Mini logo badge
  drawRoundedRect(ctx, 88, 76, 70, 70, 18);
  ctx.fillStyle = "#ec4899";
  ctx.fill();
  drawSparkleStar(ctx, 123, 111, 22, 7, "#ffffff");

  ctx.fillStyle = "#ffffff";
  ctx.font = '800 34px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = "left";
  ctx.fillText("TidyUps Cleaning", 178, 108);

  ctx.fillStyle = "#f9a8d4";
  ctx.font = '600 22px "JetBrains Mono", monospace';
  ctx.fillText(`tidyupscleaning.com · ${phoneNumber}`, 178, 140);
  ctx.restore();

  // 3. Promo Badge Pill
  const badgeY = isVertical ? 230 : 210;
  ctx.save();
  drawRoundedRect(ctx, 64, badgeY, w - 128, 66, 33);
  ctx.fillStyle = preset.accentColor;
  ctx.fill();
  ctx.fillStyle = "#0f172a";
  ctx.font = '900 26px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = "center";
  ctx.fillText(`★ ${preset.badge} ★`, w / 2, badgeY + 43);
  ctx.restore();

  // 4. Main Headline & Subtitle
  const titleY = isVertical ? 385 : 345;
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.font = '900 62px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = "center";
  ctx.fillText(preset.title, w / 2, titleY);

  ctx.fillStyle = "#f1f5f9";
  ctx.font = '600 31px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(preset.subtitle, w / 2, titleY + 56);
  ctx.restore();

  // 5. Visual Interior Inspection Checklist Card
  const cardTop = isVertical ? 520 : 445;
  const cardHeight = isVertical ? 760 : 415;
  ctx.save();
  drawRoundedRect(ctx, 64, cardTop, w - 128, cardHeight, 36);
  ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
  ctx.fill();

  ctx.fillStyle = "#0f172a";
  ctx.font = '800 30px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = "left";
  ctx.fillText(
    "✓ INCLUDED IN YOUR TIDYUPS CLEANING:",
    108,
    cardTop + 68
  );

  const rowGap = isVertical ? 145 : 76;
  preset.checklist.forEach((item, idx) => {
    const iy = cardTop + 140 + idx * rowGap;
    // Checkmark circle
    ctx.beginPath();
    ctx.arc(130, iy - 10, 22, 0, Math.PI * 2);
    ctx.fillStyle = "#10b981";
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = '900 24px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("✓", 130, iy - 2);

    ctx.fillStyle = "#1e293b";
    ctx.font = '700 30px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = "left";
    ctx.fillText(item, 172, iy);
  });
  ctx.restore();

  // 6. Bottom Call-To-Action Banner
  const ctaY = h - (isVertical ? 260 : 165);
  ctx.save();
  drawRoundedRect(ctx, 64, ctaY, w - 128, 112, 32);
  ctx.fillStyle = "#0f172a";
  ctx.fill();
  ctx.strokeStyle = preset.accentColor;
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = '800 34px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = "center";
  ctx.fillText(
    `BOOK ONLINE: app.tidyupscleaning.com/booking · ${phoneNumber}`,
    w / 2,
    ctaY + 68
  );
  ctx.restore();

  return canvas.toDataURL("image/png");
}

export function triggerDataUrlDownload(dataUrl: string, fileName: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Generates a Bright, Color-Coded, Branded Excel (.xls) File with Big Headings & TidyUps Logo Banner
 * matching app.tidyupscleaning.com and bookmycleaning.net.
 */
export function buildBrightStyledExcelHtml(campaign: RsaCampaign): string {
  const fb = campaign.facebookConfig || DEFAULT_FACEBOOK_CONFIG;
  const phone = campaign.phoneNumber || "587-742-2500";
  const finalUrl = campaign.finalUrl || "https://app.tidyupscleaning.com/booking";
  const esc = (s: any) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const fbRowsHtml = fb.ads
    .map(
      (ad, i) => `
      <tr style="background-color: ${i % 2 === 0 ? "#fdf2f8" : "#ffffff"};">
        <td style="padding:10px; border:1px solid #f9a8d4; font-weight:bold; color:#831843;">${esc(
          ad.variationName || `Facebook Ad #${i + 1}`
        )}</td>
        <td style="padding:10px; border:1px solid #f9a8d4; color:#701a75; font-weight:bold;">${esc(
          ad.angle
        )}</td>
        <td style="padding:10px; border:1px solid #f9a8d4; font-weight:bold; font-size:13pt; color:#111827;">${esc(
          ad.headline
        )}</td>
        <td style="padding:10px; border:1px solid #f9a8d4; color:#1f2937;">${esc(
          ad.primaryText
        )}</td>
        <td style="padding:10px; border:1px solid #f9a8d4; color:#0f766e; font-weight:bold;">${esc(
          ad.linkDescription
        )}</td>
        <td style="padding:10px; border:1px solid #f9a8d4; background-color:#fce7f3; font-weight:bold; text-align:center; color:#be185d;">${esc(
          ad.ctaType
        )}</td>
        <td style="padding:10px; border:1px solid #f9a8d4; color:#047857; font-weight:bold;">$${esc(
          fb.dailyBudgetCad
        )} CAD/day</td>
        <td style="padding:10px; border:1px solid #f9a8d4; color:#1d4ed8;">${esc(
          ad.destinationUrl || finalUrl
        )}</td>
      </tr>`
    )
    .join("");

  const headlineRowsHtml = campaign.headlines
    .map(
      (h, i) => `
      <tr style="background-color: ${i % 2 === 0 ? "#f5f3ff" : "#ffffff"};">
        <td style="padding:8px; border:1px solid #c4b5fd; font-weight:bold; color:#4c1d95;">Headline #${
          i + 1
        }</td>
        <td style="padding:8px; border:1px solid #c4b5fd; font-weight:bold; font-size:12pt; color:#111827;">${esc(
          h.text
        )}</td>
        <td style="padding:8px; border:1px solid #c4b5fd; text-align:center; font-weight:bold; color:#047857;">${
          h.text.length
        } / 30</td>
        <td style="padding:8px; border:1px solid #c4b5fd; color:#6d28d9; font-weight:bold;">${esc(
          h.category
        )}</td>
        <td style="padding:8px; border:1px solid #c4b5fd; color:#475569;">${esc(
          h.pinnedField
        )}</td>
        <td colspan="3" style="padding:8px; border:1px solid #c4b5fd; color:#0f766e;">Verified Google RSA Asset</td>
      </tr>`
    )
    .join("");

  const descRowsHtml = campaign.descriptions
    .map(
      (d, i) => `
      <tr style="background-color: ${i % 2 === 0 ? "#ecfdf5" : "#ffffff"};">
        <td style="padding:8px; border:1px solid #6ee7b7; font-weight:bold; color:#065f46;">Description #${
          i + 1
        }</td>
        <td colspan="2" style="padding:8px; border:1px solid #6ee7b7; font-weight:bold; font-size:11pt; color:#111827;">${esc(
          d.text
        )}</td>
        <td style="padding:8px; border:1px solid #6ee7b7; text-align:center; font-weight:bold; color:#047857;">${
          d.text.length
        } / 90</td>
        <td style="padding:8px; border:1px solid #6ee7b7; color:#0f766e; font-weight:bold;">${esc(
          d.angle
        )}</td>
        <td colspan="3" style="padding:8px; border:1px solid #6ee7b7; color:#475569;">Pin: ${esc(
          d.pinnedField
        )}</td>
      </tr>`
    )
    .join("");

  const keywordRowsHtml = campaign.targetKeywords
    .map(
      (kw, i) => `
      <tr style="background-color: ${i % 2 === 0 ? "#f0fdfa" : "#ffffff"};">
        <td style="padding:8px; border:1px solid #99f6e4; font-weight:bold; color:#115e59;">KW-${String(
          i + 1
        ).padStart(2, "0")}</td>
        <td colspan="2" style="padding:8px; border:1px solid #99f6e4; font-weight:bold; color:#0f172a;">"${esc(
          kw
        )}"</td>
        <td style="padding:8px; border:1px solid #99f6e4; color:#0d9488; font-weight:bold;">PHRASE / EXACT</td>
        <td colspan="2" style="padding:8px; border:1px solid #99f6e4; color:#334155;">Edmonton Move-Out &amp; Deep Clean</td>
        <td colspan="2" style="padding:8px; border:1px solid #99f6e4; color:#1d4ed8;">${esc(
          finalUrl
        )}</td>
      </tr>`
    )
    .join("");

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="UTF-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>TidyUps Master Ads Hub</x:Name>
              <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
    </head>
    <body style="font-family: 'Plus Jakarta Sans', Calibri, Arial, sans-serif;">
      <table border="1" cellspacing="0" cellpadding="8" style="border-collapse:collapse; width:100%;">
        <!-- BIG BRAND LOGO & HEADER BANNER -->
        <tr>
          <td colspan="8" style="background-color:#4a1259; color:#ffffff; font-size:22pt; font-weight:900; padding:18px; text-align:left;">
            ✨ TIDYUPS CLEANING — MASTER FACEBOOK, INSTAGRAM &amp; GOOGLE ADS STUDIO
          </td>
        </tr>
        <tr>
          <td colspan="8" style="background-color:#db2777; color:#ffffff; font-size:13pt; font-weight:bold; padding:12px;">
            🌐 Website: tidyupscleaning.com | 🚀 Ads Hub: ads.tidyupscleaning.com | 📅 Booking: ${esc(
              finalUrl
            )} | 📞 Direct Phone: ${esc(phone)} | 🛡️ Privacy &amp; Support: ads.tidyupscleaning.com/support
          </td>
        </tr>
        <tr><td colspan="8" style="background-color:#ffffff; height:12px;"></td></tr>

        <!-- SECTION 1: FACEBOOK & INSTAGRAM LEAD ADS (HOT MAGENTA THEME) -->
        <tr>
          <td colspan="8" style="background-color:#be185d; color:#ffffff; font-size:16pt; font-weight:bold; padding:14px;">
            📱 1. FACEBOOK &amp; INSTAGRAM LEAD ADS CAMPAIGN (${esc(
              fb.campaignName
            )} — $${esc(fb.dailyBudgetCad)} CAD/Day)
          </td>
        </tr>
        <tr style="background-color:#ec4899; color:#ffffff; font-weight:bold; font-size:11pt;">
          <td style="padding:10px; border:1px solid #f9a8d4;">Ad Variation</td>
          <td style="padding:10px; border:1px solid #f9a8d4;">Hook / Angle</td>
          <td style="padding:10px; border:1px solid #f9a8d4;">Headline (&lt;=40 chars)</td>
          <td style="padding:10px; border:1px solid #f9a8d4;">Primary Ad Text (Feed, Story &amp; Reels)</td>
          <td style="padding:10px; border:1px solid #f9a8d4;">Link Description</td>
          <td style="padding:10px; border:1px solid #f9a8d4;">CTA Button</td>
          <td style="padding:10px; border:1px solid #f9a8d4;">Daily Budget</td>
          <td style="padding:10px; border:1px solid #f9a8d4;">Booking Destination URL</td>
        </tr>
        ${fbRowsHtml}

        <tr><td colspan="8" style="background-color:#ffffff; height:14px;"></td></tr>

        <!-- SECTION 2: GOOGLE SEARCH RSA HEADLINES (ROYAL PURPLE THEME) -->
        <tr>
          <td colspan="8" style="background-color:#5b21b6; color:#ffffff; font-size:16pt; font-weight:bold; padding:14px;">
            🔍 2. GOOGLE SEARCH RESPONSIVE AD HEADLINES (${
              campaign.headlines.length
            } Headlines — Strictly &lt;= 30 Chars)
          </td>
        </tr>
        <tr style="background-color:#7c3aed; color:#ffffff; font-weight:bold; font-size:11pt;">
          <td style="padding:10px;">Slot #</td>
          <td style="padding:10px;">Headline Copy</td>
          <td style="padding:10px;">Character Count</td>
          <td style="padding:10px;">Angle / Category</td>
          <td style="padding:10px;">Pinning</td>
          <td colspan="3" style="padding:10px;">Status</td>
        </tr>
        ${headlineRowsHtml}

        <tr><td colspan="8" style="background-color:#ffffff; height:14px;"></td></tr>

        <!-- SECTION 3: 5 DESCRIPTIONS (EMERALD GREEN THEME) -->
        <tr>
          <td colspan="8" style="background-color:#065f46; color:#ffffff; font-size:16pt; font-weight:bold; padding:14px;">
            📝 3. TIDYUPS CLEANING AD DESCRIPTIONS (${
              campaign.descriptions.length
            } Descriptions — Strictly &lt;= 90 Chars)
          </td>
        </tr>
        <tr style="background-color:#059669; color:#ffffff; font-weight:bold; font-size:11pt;">
          <td style="padding:10px;">Slot #</td>
          <td colspan="2" style="padding:10px;">Description Text</td>
          <td style="padding:10px;">Character Count</td>
          <td style="padding:10px;">Value Angle</td>
          <td colspan="3" style="padding:10px;">Pinning Position</td>
        </tr>
        ${descRowsHtml}

        <tr><td colspan="8" style="background-color:#ffffff; height:14px;"></td></tr>

        <!-- SECTION 4: POSITIVE TARGET KEYWORDS (DEEP TEAL THEME) -->
        <tr>
          <td colspan="8" style="background-color:#115e59; color:#ffffff; font-size:16pt; font-weight:bold; padding:14px;">
            🎯 4. EDMONTON MOVE-OUT &amp; DEEP CLEANING TARGET KEYWORDS (${
              campaign.targetKeywords.length
            } Keywords)
          </td>
        </tr>
        <tr style="background-color:#0d9488; color:#ffffff; font-weight:bold; font-size:11pt;">
          <td style="padding:10px;">ID</td>
          <td colspan="2" style="padding:10px;">Target Search Keyword</td>
          <td style="padding:10px;">Match Type</td>
          <td colspan="2" style="padding:10px;">Service Cluster</td>
          <td colspan="2" style="padding:10px;">Landing Page URL</td>
        </tr>
        ${keywordRowsHtml}
      </table>
    </body>
    </html>
  `;
}

export function downloadBrightStyledExcelWorkbook(campaign: RsaCampaign) {
  const html = buildBrightStyledExcelHtml(campaign);
  const blob = new Blob([html], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `TidyUps-Cleaning-Bright-Master-Ads-Sheet-${new Date()
    .toISOString()
    .slice(0, 10)}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 1-Click Download Complete TidyUps Media & Ads Kit (.ZIP) containing:
 * - 1024x1024 Official App Icon & Brand Logo PNG
 * - All 3 Move-Out & Deep Cleaning Facebook/Instagram Ad Graphics (PNGs)
 * - Bright Color-Coded Excel Workbook (.xls)
 * - Facebook Ads Manager Bulk Import (.csv)
 */
export async function downloadCompleteMoveOutMediaKitZip(
  campaign: RsaCampaign
): Promise<void> {
  const zip = new JSZip();
  const phone = campaign.phoneNumber || "587-742-2500";

  for (const preset of MOVE_OUT_MEDIA_KIT_PRESETS) {
    const dataUrl = generateBrandAdPresetPngDataUrl(preset, phone);
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
    if (base64Data) {
      zip.file(`01-Logos-and-Ad-Images/${preset.fileName}`, base64Data, {
        base64: true,
      });
    }
  }

  // Include any custom AI-generated images from the session
  (campaign.generatedImages || []).forEach((img, idx) => {
    if (img.imageUrl && img.imageUrl.startsWith("data:image/")) {
      const b64 = img.imageUrl.split(",")[1];
      if (b64) {
        zip.file(
          `01-Logos-and-Ad-Images/Custom-Cleaning-Scene-${idx + 1}.png`,
          b64,
          { base64: true }
        );
      }
    }
  });

  // Add the Bright Color-Coded Excel Workbook (.xls)
  const excelHtml = buildBrightStyledExcelHtml(campaign);
  zip.file(
    "02-Bright-Styled-Excel-and-CSV/TidyUps-Cleaning-Bright-Master-Ads-Workbook.xls",
    excelHtml
  );

  // Add the Meta Ads Manager CSV
  const metaCsv = buildMetaAdsManagerCsv(campaign);
  zip.file(
    "02-Bright-Styled-Excel-and-CSV/TidyUps-Facebook-Instagram-Ads-Bulk-Import.csv",
    metaCsv
  );

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `TidyUps-Cleaning-Logo-1024x1024-and-MoveOut-Ads-Kit.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
