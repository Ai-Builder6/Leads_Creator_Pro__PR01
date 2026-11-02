import React, { useState, useEffect } from "react";
import {
  Download,
  Sparkles,
  Database,
  FileSpreadsheet,
  Bell,
  Check,
  Plus,
  Trash2,
  RefreshCw,
  ExternalLink,
  Image as ImageIcon,
  FolderArchive,
  CheckCircle2,
  Calendar,
  Copy,
  Loader2,
} from "lucide-react";
import {
  RsaCampaign,
  DEFAULT_FACEBOOK_CONFIG,
  GeneratedCleaningImage,
} from "../data/tidyUpPresets";
import {
  MOVE_OUT_MEDIA_KIT_PRESETS,
  BrandAdVisualPreset,
  generate1024AppIconPngDataUrl,
  generateBrandAdPresetPngDataUrl,
  triggerDataUrlDownload,
  downloadBrightStyledExcelWorkbook,
  downloadCompleteMoveOutMediaKitZip,
} from "../utils/tidyUpBrandDownloads";
import {
  auth,
  googleSignIn,
  getAccessToken,
  SavedAdAssetRecord,
  LinkedSheetRecord,
  AdReminderRecord,
  saveAdAssetToFirestore,
  deleteAdAssetFromFirestore,
  subscribeToSavedAdAssets,
  saveLinkedSheetToFirestore,
  subscribeToLinkedSheets,
  saveReminderToFirestore,
  completeReminderInFirestore,
  deleteReminderFromFirestore,
  subscribeToAdReminders,
} from "../lib/googleAuth";
import { PublicPageRoute } from "./PublicSitePages";

interface BrandKitVaultAndSyncBarProps {
  campaign: RsaCampaign;
  onUpdateCampaignMeta: (updates: Partial<RsaCampaign>) => void;
  onOpenPublicPage?: (page: PublicPageRoute) => void;
}

const LOCAL_VAULT_KEY = "tidyups_saved_ad_vault_v1";
const LOCAL_REMINDERS_KEY = "tidyups_ad_creator_reminders_v1";
const LOCAL_LINKED_SHEET_KEY = "tidyups_linked_google_sheet_v1";

export const BrandKitVaultAndSyncBar: React.FC<
  BrandKitVaultAndSyncBarProps
> = ({ campaign, onUpdateCampaignMeta, onOpenPublicPage }) => {
  const [activeSubTab, setActiveSubTab] = useState<
    "logo_media_kit" | "database_vault" | "sheets_sync" | "reminders"
  >("logo_media_kit");

  const [generatedPreviews, setGeneratedPreviews] = useState<
    Record<string, string>
  >({});
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [appliedPresetId, setAppliedPresetId] = useState<string | null>(null);
  const [copiedIconLink, setCopiedIconLink] = useState(false);

  // Database Vault State (Firestore + Local Storage sync)
  const [vaultAssets, setVaultAssets] = useState<SavedAdAssetRecord[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_VAULT_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return [];
  });
  const [isSavingToDb, setIsSavingToDb] = useState(false);
  const [dbSaveFeedback, setDbSaveFeedback] = useState<string | null>(null);
  const [reusedId, setReusedId] = useState<string | null>(null);

  // Linked Google Sheet 2-Way Sync State
  const [linkedSheets, setLinkedSheets] = useState<LinkedSheetRecord[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_LINKED_SHEET_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return [];
  });
  const [sheetUrlInput, setSheetUrlInput] = useState("");
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [sheetSyncStatus, setSheetSyncStatus] = useState<string | null>(null);
  const [showConfirmOverwriteModal, setShowConfirmOverwriteModal] =
    useState(false);

  // Ads Creator Reminders State
  const [reminders, setReminders] = useState<AdReminderRecord[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_REMINDERS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    const tomorrow9am = new Date();
    tomorrow9am.setDate(tomorrow9am.getDate() + 1);
    tomorrow9am.setHours(9, 0, 0, 0);
    return [
      {
        id: "rem_default_1",
        ownerId: "local",
        title:
          "Ads Creator Check-In: Review Facebook & Google Daily Budgets + Sync Master Sheet",
        notes:
          "Check Meta Lead Ads & Google Search RSA performance at ads.tidyupscleaning.com and rotate Move-Out cleaning images.",
        dueAtIso: tomorrow9am.toISOString().slice(0, 16),
        frequency: "daily",
        status: "active",
      },
    ];
  });
  const [newReminderTitle, setNewReminderTitle] = useState(
    "Rotate Facebook Move-Out Cleaning Ad Images & Sync Google Sheet"
  );
  const [newReminderDue, setNewReminderDue] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [newReminderFreq, setNewReminderFreq] = useState<
    "once" | "daily" | "weekly"
  >("daily");

  // Render high-res canvas previews on mount
  useEffect(() => {
    const map: Record<string, string> = {};
    for (const preset of MOVE_OUT_MEDIA_KIT_PRESETS) {
      map[preset.id] = generateBrandAdPresetPngDataUrl(
        preset,
        campaign.phoneNumber || "587-742-2500"
      );
    }
    setGeneratedPreviews(map);
  }, [campaign.phoneNumber]);

  // Seed default vault items once previews are ready if vault is empty
  useEffect(() => {
    if (
      Object.keys(generatedPreviews).length > 0 &&
      vaultAssets.length === 0
    ) {
      const fb = campaign.facebookConfig || DEFAULT_FACEBOOK_CONFIG;
      const seeded: SavedAdAssetRecord[] = [
        {
          id: "vault_logo_1024",
          ownerId: "local",
          assetType: "logo",
          title: "TidyUps Cleaning Official 1024×1024 App Icon & Logo",
          primaryText: "tidyupscleaning.com · Call 587-742-2500",
          secondaryText: "1024×1024 PNG — Meta App Review & Brand Logo",
          aspectRatio: "1:1",
          imageDataUrl: generatedPreviews["app_icon_1024"] || "",
          category: "Brand Logo (1024x1024)",
          createdAtIso: new Date().toISOString(),
        },
        {
          id: "vault_fb_move_out",
          ownerId: "local",
          assetType: "facebook_ad",
          title:
            fb.ads[0]?.headline || "Edmonton Move-Out Cleaning — Pass Inspection",
          primaryText:
            fb.ads[0]?.primaryText ||
            "Moving out in Edmonton? Leave the scrubbing to TidyUps Cleaning! Inside oven, fridge, cabinets & baseboards included.",
          secondaryText: `Call ${
            campaign.phoneNumber || "587-742-2500"
          } · Book at app.tidyupscleaning.com/booking`,
          aspectRatio: "1:1",
          imageDataUrl: generatedPreviews["fb_move_out_square"] || "",
          category: "Move-Out Cleaning Ad",
          createdAtIso: new Date().toISOString(),
        },
        {
          id: "vault_fb_deep_clean",
          ownerId: "local",
          assetType: "image",
          title: "Deep Home Cleaning Edmonton (1080×1080 Ad Visual)",
          primaryText:
            "Flat-rate residential deep cleaning in Edmonton & surrounding areas.",
          secondaryText: "1080×1080 Square Ad Creative",
          aspectRatio: "1:1",
          imageDataUrl: generatedPreviews["fb_deep_clean_square"] || "",
          category: "Deep Cleaning Ad",
          createdAtIso: new Date().toISOString(),
        },
      ];
      setVaultAssets(seeded);
      try {
        localStorage.setItem(LOCAL_VAULT_KEY, JSON.stringify(seeded));
      } catch {
        // ignore
      }
    }
  }, [generatedPreviews]);

  // Subscribe to Firestore collections when user is signed in
  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (!user) return;
      const unsubAssets = subscribeToSavedAdAssets((remoteAssets) => {
        if (remoteAssets.length > 0) {
          setVaultAssets(remoteAssets);
          try {
            localStorage.setItem(LOCAL_VAULT_KEY, JSON.stringify(remoteAssets));
          } catch {
            // ignore
          }
        }
      });
      const unsubSheets = subscribeToLinkedSheets((remoteSheets) => {
        if (remoteSheets.length > 0) {
          setLinkedSheets(remoteSheets);
          try {
            localStorage.setItem(
              LOCAL_LINKED_SHEET_KEY,
              JSON.stringify(remoteSheets)
            );
          } catch {
            // ignore
          }
        }
      });
      const unsubRems = subscribeToAdReminders((remoteRems) => {
        if (remoteRems.length > 0) {
          setReminders(remoteRems);
          try {
            localStorage.setItem(
              LOCAL_REMINDERS_KEY,
              JSON.stringify(remoteRems)
            );
          } catch {
            // ignore
          }
        }
      });
      return () => {
        unsubAssets();
        unsubSheets();
        unsubRems();
      };
    });
    return () => unsubAuth();
  }, []);

  const handleUsePresetInAds = (preset: BrandAdVisualPreset) => {
    const dataUrl =
      generatedPreviews[preset.id] ||
      generateBrandAdPresetPngDataUrl(preset, campaign.phoneNumber);
    if (!dataUrl) return;

    const newImg: GeneratedCleaningImage = {
      id: `kit-${preset.id}-${Date.now()}`,
      sceneTitle: `${preset.title} (${preset.dimensionsLabel})`,
      prompt: preset.subtitle,
      aspectRatio: preset.aspectRatio,
      imageUrl: dataUrl,
      attachedToAd: true,
      createdAt: new Date().toISOString(),
    };

    const existingImgs = campaign.generatedImages || [];
    const fb = campaign.facebookConfig || DEFAULT_FACEBOOK_CONFIG;

    onUpdateCampaignMeta({
      attachedImageUrl: dataUrl,
      generatedImages: [
        newImg,
        ...existingImgs.map((i) => ({ ...i, attachedToAd: false })),
      ],
      facebookConfig: {
        ...fb,
        ads: fb.ads.map((ad, idx) =>
          idx === 0 ? { ...ad, imageUrl: dataUrl } : ad
        ),
      },
    });

    setAppliedPresetId(preset.id);
    setTimeout(() => setAppliedPresetId(null), 2200);
  };

  // Compress dataUrl so it is well below Firestore's 1MB document limit (< 220KB JPEG)
  const compressImageForFirestore = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      if (!dataUrl || !dataUrl.startsWith("data:image/")) {
        resolve(dataUrl || "");
        return;
      }
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 640;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl.slice(0, 700000));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => resolve("");
      img.src = dataUrl;
    });
  };

  const handleSaveCurrentCampaignAssetsToDatabase = async () => {
    setIsSavingToDb(true);
    setDbSaveFeedback(null);
    try {
      const fb = campaign.facebookConfig || DEFAULT_FACEBOOK_CONFIG;
      const newRecords: SavedAdAssetRecord[] = [];

      // 1. Save 1024x1024 Logo
      const logoThumb = await compressImageForFirestore(
        generatedPreviews["app_icon_1024"] || generate1024AppIconPngDataUrl(512)
      );
      newRecords.push({
        id: `logo_1024_${Date.now()}`,
        ownerId: auth.currentUser?.uid || "local",
        assetType: "logo",
        title: "TidyUps Cleaning 1024×1024 Official App Icon & Logo",
        primaryText: "tidyupscleaning.com · 587-742-2500",
        secondaryText: "Meta App Icon (1024x1024) & Google Brand Logo",
        aspectRatio: "1:1",
        imageDataUrl: logoThumb,
        category: "Brand Logo",
        createdAtIso: new Date().toISOString(),
      });

      // 2. Save all Facebook & Instagram Ads with their images & headlines
      for (let i = 0; i < fb.ads.length; i++) {
        const ad = fb.ads[i];
        const rawImg =
          ad.imageUrl ||
          campaign.attachedImageUrl ||
          generatedPreviews["fb_move_out_square"] ||
          "";
        const compressedImg = await compressImageForFirestore(rawImg);
        newRecords.push({
          id: `fbad_${Date.now()}_${i}`,
          ownerId: auth.currentUser?.uid || "local",
          assetType: "facebook_ad",
          title: ad.headline || `Facebook Ad #${i + 1}`,
          primaryText: ad.primaryText,
          secondaryText: `${ad.variationName} · CTA: ${ad.ctaType}`,
          aspectRatio: "1:1",
          imageDataUrl: compressedImg,
          category: ad.angle || "Facebook Lead Ad",
          createdAtIso: new Date().toISOString(),
        });
      }

      // 3. Save Top RSA Headlines & 5 Descriptions bundle
      newRecords.push({
        id: `rsa_copy_${Date.now()}`,
        ownerId: auth.currentUser?.uid || "local",
        assetType: "headline",
        title: `${campaign.campaignName} (${campaign.headlines.length} Headlines + 5 Descriptions)`,
        primaryText: campaign.headlines.map((h) => h.text).join(" | "),
        secondaryText: campaign.descriptions.map((d) => d.text).join(" || "),
        aspectRatio: "1:1",
        imageDataUrl: "",
        category: "Google RSA Copy Bundle",
        createdAtIso: new Date().toISOString(),
      });

      const merged = [...newRecords, ...vaultAssets].slice(0, 30);
      setVaultAssets(merged);
      try {
        localStorage.setItem(LOCAL_VAULT_KEY, JSON.stringify(merged));
      } catch {
        // ignore
      }

      if (auth.currentUser) {
        for (const rec of newRecords) {
          await saveAdAssetToFirestore(rec);
        }
        setDbSaveFeedback(
          `Saved ${newRecords.length} images, headlines & Facebook ads to your Firestore Database (${auth.currentUser.email})!`
        );
      } else {
        setDbSaveFeedback(
          `Saved ${newRecords.length} images, headlines & Facebook ads to your Vault! (Sign in with Google anytime to sync across devices in Firestore).`
        );
      }
    } catch (err: any) {
      setDbSaveFeedback(
        err?.message || "Saved assets locally to your reusable Ad Vault."
      );
    } finally {
      setIsSavingToDb(false);
    }
  };

  const handleReuseVaultAsset = (item: SavedAdAssetRecord) => {
    const fb = campaign.facebookConfig || DEFAULT_FACEBOOK_CONFIG;

    if (item.assetType === "facebook_ad") {
      onUpdateCampaignMeta({
        ...(item.imageDataUrl ? { attachedImageUrl: item.imageDataUrl } : {}),
        facebookConfig: {
          ...fb,
          ads: fb.ads.map((ad, idx) =>
            idx === 0
              ? {
                  ...ad,
                  headline: item.title.slice(0, 40),
                  primaryText: item.primaryText,
                  ...(item.imageDataUrl ? { imageUrl: item.imageDataUrl } : {}),
                }
              : ad
          ),
        },
      });
    } else if (item.assetType === "image" || item.assetType === "logo") {
      if (item.imageDataUrl) {
        onUpdateCampaignMeta({
          attachedImageUrl: item.imageDataUrl,
          facebookConfig: {
            ...fb,
            ads: fb.ads.map((ad) => ({ ...ad, imageUrl: item.imageDataUrl })),
          },
        });
      }
    } else if (item.assetType === "headline") {
      const headlineParts = item.primaryText
        .split("|")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && s.length <= 30);
      if (headlineParts.length > 0) {
        onUpdateCampaignMeta({
          headlines: headlineParts.slice(0, 15).map((text, idx) => ({
            id: `reused-h-${Date.now()}-${idx}`,
            text,
            pinnedField: "UNSPECIFIED",
            category: "Keyword",
          })),
        });
      }
    }

    setReusedId(item.id);
    setTimeout(() => setReusedId(null), 2000);
  };

  const handleDeleteVaultAsset = async (id: string) => {
    const next = vaultAssets.filter((a) => a.id !== id);
    setVaultAssets(next);
    try {
      localStorage.setItem(LOCAL_VAULT_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    if (auth.currentUser) {
      await deleteAdAssetFromFirestore(id);
    }
  };

  // Create or Sync Connected Google Sheet
  const handleCreateAndLinkBrightGoogleSheet = async () => {
    setIsSyncingSheet(true);
    setSheetSyncStatus(null);
    try {
      let token = await getAccessToken();
      if (!token) {
        const res = await googleSignIn();
        token = res?.accessToken || null;
      }
      if (!token) {
        throw new Error(
          "Please sign in with Google to create & link a live Google Sheet."
        );
      }

      const response = await fetch("/api/sheets/create-master-sheet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          campaign,
          dailyBudgetCad:
            campaign.facebookConfig?.dailyBudgetCad || 25,
          folderName: "Leads-Creator",
          sheetTitle: `TidyUps Cleaning — Connected Master Ads Sheet (${new Date()
            .toISOString()
            .slice(0, 10)})`,
        }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || "Could not create Google Sheet.");
      }

      const newSheet: LinkedSheetRecord = {
        id: `sheet_${ data.spreadsheetId }`,
        ownerId: auth.currentUser?.uid || "local",
        spreadsheetId: data.spreadsheetId,
        sheetTitle: data.sheetTitle,
        spreadsheetUrl: data.spreadsheetUrl,
        autoSyncEnabled: true,
        updatedAtIso: new Date().toISOString(),
      };

      const nextList = [
        newSheet,
        ...linkedSheets.filter((s) => s.spreadsheetId !== data.spreadsheetId),
      ];
      setLinkedSheets(nextList);
      localStorage.setItem(LOCAL_LINKED_SHEET_KEY, JSON.stringify(nextList));
      if (auth.currentUser) {
        await saveLinkedSheetToFirestore(newSheet);
      }
      setSheetSyncStatus(
        `Created & linked "${data.sheetTitle}" in your Google Drive 'Leads-Creator' folder!`
      );
    } catch (err: any) {
      setSheetSyncStatus(
        err?.message || "Failed to create & link Google Sheet."
      );
    } finally {
      setIsSyncingSheet(false);
    }
  };

  const handleLinkExistingSheetUrl = async () => {
    const raw = sheetUrlInput.trim();
    if (!raw) return;
    const match = raw.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    const spreadsheetId = match ? match[1] : raw;

    const newSheet: LinkedSheetRecord = {
      id: `sheet_${spreadsheetId}`,
      ownerId: auth.currentUser?.uid || "local",
      spreadsheetId,
      sheetTitle: `Connected TidyUps Sheet (${spreadsheetId.slice(0, 8)}...)`,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
      autoSyncEnabled: true,
      updatedAtIso: new Date().toISOString(),
    };

    const nextList = [
      newSheet,
      ...linkedSheets.filter((s) => s.spreadsheetId !== spreadsheetId),
    ];
    setLinkedSheets(nextList);
    localStorage.setItem(LOCAL_LINKED_SHEET_KEY, JSON.stringify(nextList));
    setSheetUrlInput("");
    if (auth.currentUser) {
      await saveLinkedSheetToFirestore(newSheet);
    }
    setSheetSyncStatus(
      "Linked Google Sheet! You can now Pull from or Push updates to this Sheet."
    );
  };

  const handlePullFromLinkedSheet = async (sheet: LinkedSheetRecord) => {
    setIsSyncingSheet(true);
    setSheetSyncStatus(null);
    try {
      let token = await getAccessToken();
      if (!token) {
        const res = await googleSignIn();
        token = res?.accessToken || null;
      }
      if (!token) {
        throw new Error("Please sign in with Google to read your linked Sheet.");
      }

      const res = await fetch("/api/sheets/import-from-sheet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ spreadsheetIdOrUrl: sheet.spreadsheetId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Could not read linked Google Sheet.");
      }
      setSheetSyncStatus(
        `Synced ${data.rowCount} rows from "${data.sheetTitle}" (${(
          data.discoveredTabs || []
        ).join(", ")})!`
      );
    } catch (err: any) {
      setSheetSyncStatus(err?.message || "Failed to pull from Google Sheet.");
    } finally {
      setIsSyncingSheet(false);
    }
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderTitle.trim()) return;
    const rem: AdReminderRecord = {
      id: `rem_${Date.now()}`,
      ownerId: auth.currentUser?.uid || "local",
      title: newReminderTitle.trim(),
      notes:
        "Open ads.tidyupscleaning.com or creator.tidyupscleaning.com to review Facebook & Google Ads.",
      dueAtIso: newReminderDue,
      frequency: newReminderFreq,
      status: "active",
    };
    const next = [rem, ...reminders];
    setReminders(next);
    localStorage.setItem(LOCAL_REMINDERS_KEY, JSON.stringify(next));
    if (auth.currentUser) {
      await saveReminderToFirestore(rem);
    }
    setNewReminderTitle("");
  };

  const handleCompleteReminder = async (rem: AdReminderRecord) => {
    const next = reminders.map((r) =>
      r.id === rem.id ? { ...r, status: "completed" as const } : r
    );
    setReminders(next);
    localStorage.setItem(LOCAL_REMINDERS_KEY, JSON.stringify(next));
    if (auth.currentUser) {
      await completeReminderInFirestore(rem);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    const next = reminders.filter((r) => r.id !== id);
    setReminders(next);
    localStorage.setItem(LOCAL_REMINDERS_KEY, JSON.stringify(next));
    if (auth.currentUser) {
      await deleteReminderFromFirestore(id);
    }
  };

  const buildGoogleCalendarReminderUrl = (rem: AdReminderRecord) => {
    const start = new Date(rem.dueAtIso || Date.now());
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    const fmt = (d: Date) =>
      d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: rem.title,
      details: `${rem.notes}\n\nManage Ads: https://ads.tidyupscleaning.com\nCreator Portal: https://creator.tidyupscleaning.com`,
      dates: `${fmt(start)}/${fmt(end)}`,
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  return (
    <div className="bg-white border-2 border-pink-200 rounded-2xl p-5 shadow-xs space-y-5">
      {/* Top Bar: Easy Navigation for Logo, Downloads, Database Vault, Sheets Sync & Reminders */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-pink-50 text-pink-800 border border-pink-200">
            <Sparkles className="w-3.5 h-3.5 text-[#ec4899]" />
            TidyUps Cleaning · Easy Download Hub, Database Vault &amp; Live Sheets Sync
          </div>
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-1">
            1024×1024 App Icon, Move-Out Ad Kit, Bright Excel Sheet &amp; Saved Ad Database
          </h3>
        </div>

        {/* 1-Click Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const iconUrl =
                generatedPreviews["app_icon_1024"] ||
                generate1024AppIconPngDataUrl(1024);
              triggerDataUrlDownload(
                iconUrl,
                "TidyUps-App-Icon-1024x1024.png"
              );
            }}
            className="px-3.5 py-2 rounded-xl bg-[#ec4899] hover:bg-[#db2777] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download 1024×1024 App Icon
          </button>

          <button
            type="button"
            onClick={() => downloadBrightStyledExcelWorkbook(campaign)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Download Bright Colored Excel (.xls)
          </button>

          <button
            type="button"
            disabled={isDownloadingZip}
            onClick={async () => {
              setIsDownloadingZip(true);
              try {
                await downloadCompleteMoveOutMediaKitZip(campaign);
              } finally {
                setIsDownloadingZip(false);
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-60"
          >
            {isDownloadingZip ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Packing ZIP...
              </>
            ) : (
              <>
                <FolderArchive className="w-3.5 h-3.5 text-pink-400" />
                Download All (Logo + Move-Out Images + Excel ZIP)
              </>
            )}
          </button>

          {onOpenPublicPage && (
            <button
              type="button"
              onClick={() => onOpenPublicPage("support")}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Open 1-Click Data Deletion (/support)
            </button>
          )}
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveSubTab("logo_media_kit")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${
            activeSubTab === "logo_media_kit"
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5 text-[#ec4899]" />
          1. 1024×1024 Logo &amp; Move-Out Ad Images (4)
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("database_vault")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${
            activeSubTab === "database_vault"
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <Database className="w-3.5 h-3.5 text-purple-400" />
          2. Saved Ad &amp; Image Database ({vaultAssets.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("sheets_sync")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${
            activeSubTab === "sheets_sync"
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
          3. Connected Google Sheets Sync ({linkedSheets.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("reminders")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${
            activeSubTab === "reminders"
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <Bell className="w-3.5 h-3.5 text-amber-400" />
          4. Ads Creator Reminders (
          {reminders.filter((r) => r.status === "active").length})
        </button>
      </div>

      {/* TAB 1: 1024x1024 Logo & Downloadable Move-Out Cleaning Media Kit */}
      {activeSubTab === "logo_media_kit" && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-pink-50/70 border border-pink-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <div className="font-bold text-slate-900">
                Direct Downloadable Link for Meta App Icon (1024 × 1024 px) &amp;
                tidyupscleaning.com Logo:
              </div>
              <div className="text-slate-600">
                Upload the first image below directly into{" "}
                <strong>Meta App Settings → Basic → App Icon (1024 x 1024)</strong>{" "}
                or click any Move-Out / Deep Clean graphic to attach it to your
                Facebook &amp; Google Ads.
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="/app-icon-1024.svg"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg bg-pink-600 hover:bg-pink-700 text-white font-semibold inline-flex items-center gap-1"
              >
                <span>Open Live 1024×1024 Icon</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                type="button"
                onClick={() => {
                  const iconUrl =
                    generatedPreviews["app_icon_1024"] ||
                    generate1024AppIconPngDataUrl(1024);
                  triggerDataUrlDownload(
                    iconUrl,
                    "TidyUps-App-Icon-1024x1024.png"
                  );
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3 text-pink-400" />
                <span>Download PNG</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    "https://ads.tidyupscleaning.com/app-icon-1024.svg"
                  );
                  setCopiedIconLink(true);
                  setTimeout(() => setCopiedIconLink(false), 2000);
                }}
                className="px-2.5 py-1 rounded-lg bg-white border border-pink-300 text-pink-900 font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                {copiedIconLink ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    Copied Link
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy Logo URL
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MOVE_OUT_MEDIA_KIT_PRESETS.map((preset) => {
              const previewUrl = generatedPreviews[preset.id];
              const isApplied = appliedPresetId === preset.id;
              return (
                <div
                  key={preset.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="bg-slate-900 h-48 flex items-center justify-center p-2 relative">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt={preset.title}
                          referrerPolicy="no-referrer"
                          className="max-h-44 w-auto object-contain rounded-lg shadow-md"
                        />
                      ) : (
                        <div className="text-xs text-slate-400">
                          Rendering HD Graphic...
                        </div>
                      )}
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 text-white font-mono text-[10px] font-bold">
                        {preset.width}×{preset.height} PNG
                      </span>
                    </div>

                    <div className="p-3.5 space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#ec4899]">
                        {preset.badge}
                      </div>
                      <div className="text-xs font-bold text-slate-900">
                        {preset.title}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {preset.dimensionsLabel}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 pt-0 flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const url =
                          previewUrl ||
                          generateBrandAdPresetPngDataUrl(
                            preset,
                            campaign.phoneNumber
                          );
                        triggerDataUrlDownload(url, preset.fileName);
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-pink-400" />
                      Download PNG ({preset.width}×{preset.height})
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUsePresetInAds(preset)}
                      className={`w-full py-1.5 px-3 rounded-lg border text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                        isApplied
                          ? "bg-emerald-50 border-emerald-600 text-emerald-800"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {isApplied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Attached to Facebook &amp; Google Ads!
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-[#ec4899]" />
                          Use in Facebook &amp; Google Ads
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Firestore & Local Reusable Ad Asset Database */}
      {activeSubTab === "database_vault" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-purple-600" />
                <span>
                  Reusable Facebook &amp; Google Ad Database (Images, 1024×1024
                  Logos, Headlines &amp; Descriptions)
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Save everything you create so you can reuse your favorite
                Move-Out &amp; Deep Cleaning images, headlines, and Facebook ad
                variations anytime with 1 click.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSaveCurrentCampaignAssetsToDatabase}
              disabled={isSavingToDb}
              className="px-4 py-2.5 rounded-xl brand-gradient text-white text-xs font-bold inline-flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-60"
            >
              {isSavingToDb ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving to Database...
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Save Current Images, Headlines &amp; FB Ads to Database
                </>
              )}
            </button>
          </div>

          {dbSaveFeedback && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{dbSaveFeedback}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {vaultAssets.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-white flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-50 text-purple-800 border border-purple-200">
                      {item.assetType.replace("_", " ")} · {item.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteVaultAsset(item.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Delete from Vault"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {item.imageDataUrl && (
                    <div className="bg-slate-900 rounded-lg h-32 flex items-center justify-center overflow-hidden p-1">
                      <img
                        src={item.imageDataUrl}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="max-h-28 w-auto object-contain rounded"
                      />
                    </div>
                  )}

                  <div className="text-xs font-bold text-slate-900">
                    {item.title}
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-3">
                    {item.primaryText}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleReuseVaultAsset(item)}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                      reusedId === item.id
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-900 hover:bg-slate-800 text-white"
                    }`}
                  >
                    {reusedId === item.id ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Applied to Campaign!
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 text-pink-400" />
                        Reuse in Campaign
                      </>
                    )}
                  </button>

                  {item.imageDataUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        triggerDataUrlDownload(
                          item.imageDataUrl,
                          `${item.title
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, "-")}.png`
                        )
                      }
                      className="py-1.5 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
                      title="Download Image"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Connected Google Sheets 2-Way Sync */}
      {activeSubTab === "sheets_sync" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1 max-w-2xl">
              <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>
                  Direct Google Sheets Connection &amp; Bright Styled Export (Like
                  app.tidyupscleaning.com)
                </span>
              </div>
              <p className="text-[11px] text-emerald-900">
                Create a bright, color-coded 6-Tab Google Sheet in your{" "}
                <code className="font-mono font-bold">Leads-Creator</code>{" "}
                folder or link an existing Google Sheet URL so your Facebook Ads,
                Google RSA Headlines, and Keywords stay synced together.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => downloadBrightStyledExcelWorkbook(campaign)}
                className="px-3.5 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-950 hover:bg-emerald-100 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-700" />
                Download Bright Excel (.xls)
              </button>

              <button
                type="button"
                onClick={() => setShowConfirmOverwriteModal(true)}
                disabled={isSyncingSheet}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {isSyncingSheet ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Syncing Google Sheet...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Create &amp; Link Bright 6-Tab Google Sheet
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Explicit Confirmation Dialog before writing to Google Drive/Sheets (Workspace Skill compliance) */}
          {showConfirmOverwriteModal && (
            <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <div className="font-bold text-pink-300">
                  Confirm Google Drive &amp; Sheets Sync
                </div>
                <div className="text-slate-300 mt-0.5">
                  Create and populate a new color-coded 6-Tab TidyUps Cleaning
                  Master Google Sheet inside your{" "}
                  <code className="font-mono">Leads-Creator</code> Drive folder?
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmOverwriteModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmOverwriteModal(false);
                    handleCreateAndLinkBrightGoogleSheet();
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Confirm &amp; Sync Sheet
                </button>
              </div>
            </div>
          )}

          {/* Link Existing Google Sheet URL */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={sheetUrlInput}
              onChange={(e) => setSheetUrlInput(e.target.value)}
              placeholder="Paste any Google Sheet URL or Spreadsheet ID from app.tidyupscleaning.com to link it here..."
              className="flex-1 min-w-[260px] px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
            <button
              type="button"
              onClick={handleLinkExistingSheetUrl}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
            >
              Link Google Sheet for 2-Way Sync
            </button>
          </div>

          {sheetSyncStatus && (
            <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-950 font-medium">
              {sheetSyncStatus}
            </div>
          )}

          {linkedSheets.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-800">
                Connected Google Sheets ({linkedSheets.length})
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {linkedSheets.map((s) => (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">
                        {s.sheetTitle}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono truncate">
                        ID: {s.spreadsheetId}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePullFromLinkedSheet(s)}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-semibold inline-flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3 text-teal-700" />
                        Sync / Pull Rows
                      </button>
                      <a
                        href={s.spreadsheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-700 text-white font-semibold inline-flex items-center gap-1"
                      >
                        <span>Open Sheet</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Ads Creator Reminders */}
      {activeSubTab === "reminders" && (
        <div className="space-y-4">
          <form
            onSubmit={handleAddReminder}
            className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-4 rounded-xl bg-amber-50/70 border border-amber-200"
          >
            <div className="md:col-span-5">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Ads Creator Reminder Task
              </label>
              <input
                type="text"
                required
                value={newReminderTitle}
                onChange={(e) => setNewReminderTitle(e.target.value)}
                placeholder="e.g. Check Facebook Lead Ads budget & sync Google Sheet"
                className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-lg"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Scheduled Date &amp; Time
              </label>
              <input
                type="datetime-local"
                required
                value={newReminderDue}
                onChange={(e) => setNewReminderDue(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-lg"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Repeat
              </label>
              <select
                value={newReminderFreq}
                onChange={(e) =>
                  setNewReminderFreq(
                    e.target.value as "once" | "daily" | "weekly"
                  )
                }
                className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-lg"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="once">One-Time</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                Set Reminder
              </button>
            </div>
          </form>

          <div className="space-y-2">
            {reminders.map((rem) => (
              <div
                key={rem.id}
                className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
                  rem.status === "completed"
                    ? "bg-slate-50 border-slate-200 text-slate-400"
                    : "bg-white border-amber-200 text-slate-900"
                }`}
              >
                <div className="space-y-0.5">
                  <div className="font-bold flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-[#ec4899]" />
                    <span
                      className={
                        rem.status === "completed" ? "line-through" : ""
                      }
                    >
                      {rem.title}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-mono uppercase">
                      {rem.frequency}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Scheduled:{" "}
                    <span className="font-mono">
                      {rem.dueAtIso.replace("T", " ")}
                    </span>{" "}
                    · {rem.notes}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={buildGoogleCalendarReminderUrl(rem)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold inline-flex items-center gap-1"
                  >
                    <Calendar className="w-3.5 h-3.5 text-teal-700" />
                    Add to Google Calendar
                  </a>

                  {rem.status !== "completed" && (
                    <button
                      type="button"
                      onClick={() => handleCompleteReminder(rem)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold inline-flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Done
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteReminder(rem.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
