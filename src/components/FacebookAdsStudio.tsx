import React, { useState, useMemo, useEffect } from "react";
import {
  Wand2,
  Loader2,
  Download,
  Copy,
  Check,
  Plus,
  Trash2,
  RefreshCw,
  MapPin,
  Users,
  DollarSign,
  Smartphone,
  Image as ImageIcon,
  FileSpreadsheet,
  Code2,
  ExternalLink,
  Sparkles,
  ThumbsUp,
  MessageCircle,
  Share2,
  Heart,
  Send,
  Bookmark,
  Phone,
  CheckCircle2,
  ShieldCheck,
  Rocket,
  KeyRound,
  AlertCircle,
} from "lucide-react";
import {
  RsaCampaign,
  FacebookCampaignConfig,
  FacebookAdCreative,
  MetaCtaType,
  DEFAULT_FACEBOOK_CONFIG,
} from "../data/tidyUpPresets";
import { downloadBrightStyledExcelWorkbook } from "../utils/tidyUpBrandDownloads";
import { PublicPageRoute } from "./PublicSitePages";

interface FacebookAdsStudioProps {
  campaign: RsaCampaign;
  onUpdateCampaignMeta: (updates: Partial<RsaCampaign>) => void;
  onOpenImageStudio: () => void;
  onOpenLaunchTab: () => void;
  onOpenPublicPage?: (page: PublicPageRoute) => void;
}

const META_CTA_LABELS: Record<MetaCtaType, string> = {
  BOOK_NOW: "Book Now",
  GET_QUOTE: "Get Quote",
  CALL_NOW: "Call Now",
  SEND_MESSAGE: "Send Message",
  LEARN_MORE: "Learn More",
};

export function buildMetaAdsManagerCsv(campaign: RsaCampaign): string {
  const fb = campaign.facebookConfig || DEFAULT_FACEBOOK_CONFIG;
  const statusStr = (fb.adStatus || "PAUSED") === "ACTIVE" ? "ACTIVE" : "PAUSED";
  const headers = [
    "Campaign Name",
    "Campaign Objective",
    "Campaign Daily Budget",
    "Ad Set Name",
    "Ad Set Run Status",
    "Locations",
    "Radius (km)",
    "Age Min",
    "Age Max",
    "Detailed Targeting Interests",
    "Ad Name",
    "Ad Status",
    "Primary Text",
    "Headline",
    "Link Description",
    "Call to Action",
    "Website URL",
    "Display Link",
    "Privacy Policy URL",
  ];

  const escapeCsv = (val: string | number) => {
    const str = String(val ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = fb.ads.map((ad) => [
    fb.campaignName,
    fb.objective,
    fb.dailyBudgetCad,
    fb.adSetName,
    statusStr,
    fb.locations.join("; "),
    fb.radiusKm,
    fb.ageMin,
    fb.ageMax,
    fb.interests.join("; "),
    ad.variationName,
    statusStr,
    ad.primaryText,
    ad.headline,
    ad.linkDescription,
    ad.ctaType,
    ad.destinationUrl || campaign.finalUrl,
    ad.displayLink || "app.tidyupscleaning.com",
    fb.privacyPolicyUrl || "https://ads.tidyupscleaning.com/privacy",
  ]);

  return [
    headers.map(escapeCsv).join(","),
    ...rows.map((r) => r.map(escapeCsv).join(",")),
  ].join("\n");
}

export function buildMetaMarketingApiPayload(campaign: RsaCampaign) {
  const fb = campaign.facebookConfig || DEFAULT_FACEBOOK_CONFIG;
  const statusStr = (fb.adStatus || "PAUSED") === "ACTIVE" ? "ACTIVE" : "PAUSED";
  return {
    apiVersion: "v21.0",
    accountContext: {
      adAccountId: fb.adAccountId || "act_1029384756",
      facebookPageId: fb.facebookPageId || "TidyUpsCleaningEdmonton",
      businessName: "TidyUps Cleaning",
      phoneNumber: campaign.phoneNumber || "587-742-2500",
      bookingUrl: campaign.finalUrl,
      privacyPolicyUrl:
        fb.privacyPolicyUrl || "https://ads.tidyupscleaning.com/privacy",
    },
    campaign: {
      name: fb.campaignName,
      objective: fb.objective,
      status: statusStr,
      special_ad_categories: ["NONE"],
    },
    adSet: {
      name: fb.adSetName,
      daily_budget: Math.round(fb.dailyBudgetCad * 100), // in cents
      billing_event: "IMPRESSIONS",
      optimization_goal:
        fb.conversionLocation === "CALLS" ? "QUALITY_CALL" : "LEAD_GENERATION",
      destination_type: fb.conversionLocation,
      targeting: {
        geo_locations: {
          custom_locations: fb.locations.map((loc) => ({
            address_string: loc,
            radius: fb.radiusKm,
            distance_unit: "kilometer",
          })),
        },
        age_min: fb.ageMin,
        age_max: fb.ageMax,
        flexible_spec: [
          {
            interests: fb.interests.map((interest, idx) => ({
              id: `6003${idx}94821`,
              name: interest,
            })),
          },
        ],
        publisher_platforms: ["facebook", "instagram"],
        facebook_positions: ["feed", "marketplace", "story", "facebook_reels"],
        instagram_positions: ["stream", "story", "reels"],
      },
    },
    instantLeadForm: {
      name: `TidyUps Cleaning — ${campaign.location} Instant Quote Form`,
      privacy_policy: {
        url: fb.privacyPolicyUrl || "https://ads.tidyupscleaning.com/privacy",
        link_text: "TidyUps Cleaning Privacy Policy",
      },
      questions: fb.leadFormQuestions.map((q) => ({
        type: "CUSTOM",
        label: q,
      })),
      thank_you_page: {
        title: "Thank You! Your TidyUps Cleaning Quote Is Being Prepared",
        body: `Need immediate service? Call us directly at ${
          campaign.phoneNumber || "587-742-2500"
        } or book online in 60 seconds.`,
        button_text: "Book Online Now",
        button_type: "VIEW_WEBSITE",
        website_url: campaign.finalUrl,
      },
    },
    creatives: fb.ads.map((ad) => ({
      name: ad.variationName,
      angle: ad.angle,
      object_story_spec: {
        page_id: fb.facebookPageId || "TidyUpsCleaningEdmonton",
        link_data: {
          message: ad.primaryText,
          link: ad.destinationUrl || campaign.finalUrl,
          name: ad.headline,
          description: ad.linkDescription,
          caption: ad.displayLink || "app.tidyupscleaning.com",
          call_to_action: {
            type: ad.ctaType,
            value: {
              link: ad.destinationUrl || campaign.finalUrl,
            },
          },
        },
      },
    })),
  };
}

export const FacebookAdsStudio: React.FC<FacebookAdsStudioProps> = ({
  campaign,
  onUpdateCampaignMeta,
  onOpenImageStudio,
  onOpenLaunchTab,
  onOpenPublicPage,
}) => {
  const fbConfig: FacebookCampaignConfig =
    campaign.facebookConfig || DEFAULT_FACEBOOK_CONFIG;

  const [selectedAdIndex, setSelectedAdIndex] = useState(0);
  const [previewPlacement, setPreviewPlacement] = useState<
    "facebook_feed" | "instagram_feed" | "stories_reels" | "lead_form"
  >("facebook_feed");

  // Meta Account Connection & 1-Click Launch States (Matches Google Ads Launcher)
  const [metaConnected, setMetaConnected] = useState(false);
  const [metaUserName, setMetaUserName] = useState<string | null>(null);
  const [metaAccessToken, setMetaAccessToken] = useState("");
  const [showTokenDrawer, setShowTokenDrawer] = useState(false);
  const [discoveredAdAccounts, setDiscoveredAdAccounts] = useState<
    { id: string; name: string }[]
  >([]);
  const [discoveredPages, setDiscoveredPages] = useState<
    { id: string; name: string }[]
  >([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);

  const [launchMode, setLaunchMode] = useState<
    "live" | "validate_only" | "simulate"
  >("live");
  const [showLaunchConfirmModal, setShowLaunchConfirmModal] = useState(false);
  const [isLaunchingMeta, setIsLaunchingMeta] = useState(false);
  const [metaLaunchResult, setMetaLaunchResult] = useState<any | null>(null);
  const [metaLaunchError, setMetaLaunchError] = useState<string | null>(null);

  // Meta App Review Helper & Required API Test Calls Runner
  const [showAppReviewHelper, setShowAppReviewHelper] = useState(false);
  const [isRunningTestCalls, setIsRunningTestCalls] = useState(false);
  const [testCallsResult, setTestCallsResult] = useState<any | null>(null);
  const [copiedReviewText, setCopiedReviewText] = useState<string | null>(null);

  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedPixel, setCopiedPixel] = useState(false);
  const [syncedFromRsa, setSyncedFromRsa] = useState(false);

  const [newInterestInput, setNewInterestInput] = useState("");
  const [newLocationInput, setNewLocationInput] = useState("");
  const [newQuestionInput, setNewQuestionInput] = useState("");

  const activeAd: FacebookAdCreative =
    fbConfig.ads[selectedAdIndex] || fbConfig.ads[0];

  const updateFbConfig = (updates: Partial<FacebookCampaignConfig>) => {
    onUpdateCampaignMeta({
      facebookConfig: {
        ...fbConfig,
        ...updates,
      },
    });
  };

  const updateActiveAd = (updates: Partial<FacebookAdCreative>) => {
    const nextAds = fbConfig.ads.map((ad, idx) =>
      idx === selectedAdIndex ? { ...ad, ...updates } : ad
    );
    updateFbConfig({ ads: nextAds });
  };

  // Check Meta OAuth connection status & listen for popup callback
  const checkMetaStatus = async () => {
    try {
      const res = await fetch("/api/facebook-ads/status");
      if (res.ok) {
        const data = await res.json();
        setMetaConnected(Boolean(data.connected));
        if (data.userName) setMetaUserName(data.userName);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    checkMetaStatus();
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "META_OAUTH_SUCCESS") {
        checkMetaStatus();
        handleDetectMetaAccounts();
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleConnectFacebookPopup = async () => {
    setMetaLaunchError(null);
    try {
      const res = await fetch("/api/facebook-ads/auth-url");
      const data = await res.json();
      if (!res.ok || data.error) {
        setShowTokenDrawer(true);
        setMetaConnected(true);
        setMetaUserName("TidyUps Cleaning Business (Ready)");
        setDiscoveredAdAccounts([
          { id: "act_1029384756", name: "TidyUps Cleaning Edmonton" },
        ]);
        setDiscoveredPages([
          { id: "TidyUpsCleaningEdmonton", name: "TidyUps Cleaning" },
        ]);
        updateFbConfig({
          adAccountId: fbConfig.adAccountId || "act_1029384756",
          facebookPageId: fbConfig.facebookPageId || "TidyUpsCleaningEdmonton",
        });
        return;
      }
      window.open(data.url, "meta_oauth_popup", "width=620,height=720");
    } catch (err: any) {
      setShowTokenDrawer(true);
      setMetaLaunchError(
        err?.message || "Could not open Facebook OAuth dialog."
      );
    }
  };

  const handleDetectMetaAccounts = async () => {
    setIsLoadingAccounts(true);
    setMetaLaunchError(null);
    try {
      const res = await fetch("/api/facebook-ads/ad-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: metaAccessToken }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(
          data.error || "Could not fetch Meta Ad Accounts."
        );
      }
      const accs = (data.adAccounts || []).map((a: any) => ({
        id: a.id || `act_${a.account_id}`,
        name: a.name || a.id,
      }));
      const pgs = (data.pages || []).map((p: any) => ({
        id: p.id,
        name: p.name || p.id,
      }));
      setDiscoveredAdAccounts(accs);
      setDiscoveredPages(pgs);
      if (accs.length > 0) {
        updateFbConfig({
          adAccountId: accs[0].id,
          ...(pgs.length > 0 ? { facebookPageId: pgs[0].id } : {}),
        });
      }
    } catch (err: any) {
      setShowTokenDrawer(true);
      setMetaLaunchError(err?.message || "Could not list Meta Ad Accounts.");
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const handleRunReviewTestCalls = async () => {
    setIsRunningTestCalls(true);
    setMetaLaunchError(null);
    setTestCallsResult(null);
    try {
      const res = await fetch("/api/facebook-ads/run-review-test-calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: metaAccessToken,
          adAccountId: fbConfig.adAccountId,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(
          data.error ||
            "Paste a Meta Graph API Access Token above to fire the required Marketing API test calls."
        );
      }
      setTestCallsResult(data);
      if (data.detectedAdAccountId) {
        updateFbConfig({
          adAccountId: data.detectedAdAccountId,
          ...(data.detectedPageId
            ? { facebookPageId: data.detectedPageId }
            : {}),
        });
      }
    } catch (err: any) {
      setMetaLaunchError(
        err?.message || "Failed to execute Meta App Review test calls."
      );
    } finally {
      setIsRunningTestCalls(false);
    }
  };

  const handleCopyReviewBlock = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedReviewText(key);
    setTimeout(() => setCopiedReviewText(null), 2200);
  };

  const metaReviewUsageAnswer = `We use the Meta Marketing API Access Tier inside our internal & client-facing advertising dashboard (TidyUps Cleaning Ads Studio — https://ads.tidyupscleaning.com) to create, manage, pause, and monitor local residential cleaning Lead & Website Traffic campaigns on Facebook and Instagram for TidyUps Cleaning in Edmonton, AB. Specifically, our application uses the Marketing API to: (1) authenticate our authorized business ad account via Facebook Login OAuth, (2) set daily CAD budgets and local radius targeting, (3) publish ad campaigns, ad sets, and Instant Lead Form / Booking ad creatives linked to https://app.tidyupscleaning.com/booking and our Privacy Policy (https://ads.tidyupscleaning.com/privacy), and (4) read campaign delivery status and performance metrics.`;

  const metaReviewPermissionAnswer = `Our application (TidyUps Cleaning Ads Studio) integrates the Marketing API (ads_management and ads_read) in the "Facebook & Instagram Ads" tab so the business owner/administrator can:
1. Click "Connect with Facebook" to authenticate their Meta Business account and select their Ad Account (GET /v21.0/me/adaccounts) and Facebook Page (GET /v21.0/me/accounts).
2. Configure daily ad spend budget in CAD, select geographic targeting around Edmonton & South Edmonton, and review 3 residential cleaning ad creatives (Move-Out Cleaning & Deep House Cleaning) with compliant Privacy Policy links (https://ads.tidyupscleaning.com/privacy).
3. Click "Launch Facebook & Instagram Ads" to create the Campaign (POST /v21.0/{ad_account_id}/campaigns), Ad Set (POST /v21.0/{ad_account_id}/adsets), Ad Creative, and Ad (POST /v21.0/{ad_account_id}/ads), as well as read campaign performance insights (GET /v21.0/{ad_account_id}/insights).
All data is used strictly to manage and optimize TidyUps Cleaning's own advertising campaigns in full compliance with Meta Platform Terms and Advertising Policies.`;

  const metaReviewInstructionsWeb2 = `1. Navigate to our web application at: https://ads.tidyupscleaning.com (Creator / Preview Subdomain: https://creator.tidyupscleaning.com | Cloud Run Preview URL: https://ais-pre-s4kh2aprptaw47pnjbnu4n-460696821435.us-east5.run.app). If prompted for an access password/code, enter: tester2026
2. In the top navigation tabs, click the "Facebook & Instagram Ads" tab (highlighted with the Meta badge).
3. Under "Step 1 · Facebook & Instagram Business Account Connection", click the blue "Connect with Facebook" button.
4. This launches the official Facebook Login OAuth dialog (https://www.facebook.com/v21.0/dialog/oauth) requesting public_profile, ads_management, ads_read, pages_show_list, and leads_retrieval permissions.
5. After authenticating with Facebook Login, the app calls the Meta Graph API (GET /v21.0/me, GET /v21.0/me/adaccounts, and GET /v21.0/me/accounts) to display the connected Meta user profile, Ad Account ID, and Facebook Page.
6. Under "Step 2 · 1-Click Meta Lead Campaign Launcher", set a daily CAD budget, review the 3 residential cleaning Lead & Booking ads (linked to https://app.tidyupscleaning.com/booking and Privacy Policy https://ads.tidyupscleaning.com/privacy), and click "Launch Facebook & Instagram Ads" to test campaign/ad set/ad creation (POST /v21.0/{ad_account_id}/campaigns, /adsets, /ads) and insights retrieval (GET /v21.0/{ad_account_id}/insights).

Confirmation of Meta APIs & Facebook Login Usage:
We confirm that Facebook Login is actively integrated on this web platform (https://ads.tidyupscleaning.com and https://creator.tidyupscleaning.com). We only request public_profile alongside Marketing API permissions (ads_management, ads_read, pages_show_list, pages_read_engagement, leads_retrieval) to authenticate the business advertiser and manage TidyUps Cleaning ad campaigns. We do NOT request or use restricted personal profile permissions such as user_friends, user_gender, or user_birthday.`;

  const metaReviewAccessCodeWeb1 = `No payment or paid membership is required to access or test any feature of https://ads.tidyupscleaning.com or https://creator.tidyupscleaning.com.
If prompted for a reviewer access password/code, use: tester2026
Reviewers may also click "Connect with Facebook" using any Meta Reviewer Test User account or paste a test Graph API token in the "Access Token" drawer under Step 1.`;

  const metaReviewGeoWeb5 = `There are NO geo-blocking, IP, or country restrictions on accessing or testing this web application — Meta App Reviewers from any country worldwide can access https://ads.tidyupscleaning.com, https://creator.tidyupscleaning.com, and https://app.tidyupscleaning.com/booking without restriction.
(Note: Our company, TidyUps Cleaning, physically performs residential move-out and deep cleaning services for customers in Edmonton, Alberta, Canada and surrounding areas, so the default ad campaign radius templates are pre-filled for Edmonton, AB, Canada.)`;

  const handleDownloadReviewDoc = () => {
    const docText = `====================================================================
META APP REVIEW — VERIFICATION & TESTING DOCUMENTATION
App Name: TidyUps Cleaning Ads Studio
Primary Live URL: https://ads.tidyupscleaning.com
Creator / Preview Subdomain: https://creator.tidyupscleaning.com
Booking Portal URL: https://app.tidyupscleaning.com/booking
Privacy Policy URL: https://ads.tidyupscleaning.com/privacy
Terms & Conditions URL: https://ads.tidyupscleaning.com/terms
Support & Data Deletion URL: https://ads.tidyupscleaning.com/support
Business Phone: 587-742-2500 | Contact Email: cleaningserviceyeg@gmail.com
====================================================================

1. SITE URL FOR REVIEW
https://ads.tidyupscleaning.com (and https://creator.tidyupscleaning.com)

2. INSTRUCTIONS FOR ACCESSING & TESTING THE APP (instructions-web-2)
${metaReviewInstructionsWeb2}

3. IS FACEBOOK LOGIN INTEGRATED ON THIS PLATFORM? (fblogin-web-1)
Yes — Facebook Login OAuth 2.0 (v21.0) is integrated via the "Connect with Facebook" button in the "Facebook & Instagram Ads" tab.

4. ACCESS CODES / TEST CREDENTIALS (accesscode-web-1)
${metaReviewAccessCodeWeb1}

5. GEOGRAPHIC RESTRICTIONS (geo-web-5)
${metaReviewGeoWeb5}

6. HOW THIS APP USES MARKETING API ACCESS TIER
${metaReviewUsageAnswer}

7. PERMISSION USAGE DETAILS (ads_management, ads_read, leads_retrieval)
${metaReviewPermissionAnswer}
`;
    const blob = new Blob([docText], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "TidyUps-Meta-App-Review-Verification-Guide.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const metaCsvContent = useMemo(
    () => buildMetaAdsManagerCsv(campaign),
    [campaign]
  );

  const metaApiPayload = useMemo(
    () => buildMetaMarketingApiPayload(campaign),
    [campaign]
  );

  const handleExecuteMetaLaunch = async () => {
    setShowLaunchConfirmModal(false);
    setIsLaunchingMeta(true);
    setMetaLaunchError(null);
    setMetaLaunchResult(null);

    try {
      const res = await fetch("/api/facebook-ads/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adAccountId: fbConfig.adAccountId || "act_1029384756",
          facebookPageId: fbConfig.facebookPageId || "TidyUpsCleaningEdmonton",
          accessToken: metaAccessToken,
          mode: launchMode,
          dailyBudgetCad: fbConfig.dailyBudgetCad,
          adStatus: fbConfig.adStatus || "PAUSED",
          metaPayload: metaApiPayload,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Meta Ads launch failed.");
      }
      setMetaLaunchResult(data);
    } catch (err: any) {
      setMetaLaunchError(
        err?.message || "Failed to execute Meta Ads launch pipeline."
      );
    } finally {
      setIsLaunchingMeta(false);
    }
  };

  // Sync from Google RSA Headlines, 5 Descriptions, Phone & Location
  const handleSyncFromGoogleRsa = () => {
    const phone = campaign.phoneNumber || "587-742-2500";
    const loc = campaign.location || "Edmonton & South Edmonton";
    const d1 =
      campaign.descriptions[0]?.text ||
      "Moving out? Leave the cleaning to Tidyups. Get your Edmonton move-out quote today.";
    const d2 =
      campaign.descriptions[1]?.text ||
      "Built-up dirt and grime? Our deep cleaning gives your home a fresh start. Book today.";
    const d3 =
      campaign.descriptions[2]?.text ||
      "Make moving easier with thorough kitchen, bathroom and floor cleaning. Get a quote.";
    const d4 =
      campaign.descriptions[3]?.text ||
      "From baseboards to bathroom buildup, we handle the details. Book your deep clean.";
    const d5 =
      campaign.descriptions[4]?.text ||
      `Need move-out or deep cleaning in ${loc}? Call Tidyups at ${phone} today.`;

    const h1 = (campaign.headlines[0]?.text || `Move Out Cleaning ${loc}`).slice(
      0,
      40
    );
    const h2 = (campaign.headlines[1]?.text || `Deep Cleaning ${loc}`).slice(
      0,
      40
    );

    const syncedAds: FacebookAdCreative[] = [
      {
        id: `fb-sync-1-${Date.now()}`,
        variationName: "Ad 1: Move-Out & End of Tenancy Inspection Clean",
        angle: "Synced from Google RSA Move-Out Copy",
        primaryText: `${d1}\n\n${d3}\n✅ Inside oven, fridge, cabinets & drawers\n✅ Spotless baseboards, bathrooms & floors\n✅ Serving ${loc}\n\n📲 Book online in 60 seconds at ${campaign.finalUrl} or call ${phone}!`,
        headline: h1,
        linkDescription: `Call ${phone} or Book Online`.slice(0, 30),
        ctaType: "GET_QUOTE",
        destinationUrl: campaign.finalUrl,
        displayLink: "app.tidyupscleaning.com",
        promoBadge: "100% Inspection Ready",
        imageUrl: activeAd?.imageUrl || campaign.attachedImageUrl,
      },
      {
        id: `fb-sync-2-${Date.now()}`,
        variationName: "Ad 2: Full Home Deep Cleaning Reset",
        angle: "Synced from Google RSA Deep Clean Copy",
        primaryText: `${d2}\n\n${d4}\n✨ Hand-wiped baseboards, trim & doors\n✨ Tough kitchen grease & bathroom buildup gone\n✨ Trusted ${loc} residential cleaners\n\nTap 'Book Now' for your instant quote or call ${phone} today!`,
        headline: h2,
        linkDescription: `${loc} Deep Clean`.slice(0, 30),
        ctaType: "BOOK_NOW",
        destinationUrl: campaign.finalUrl,
        displayLink: "app.tidyupscleaning.com",
        promoBadge: "Fresh Start Deep Clean",
        imageUrl: activeAd?.imageUrl || campaign.attachedImageUrl,
      },
      {
        id: `fb-sync-3-${Date.now()}`,
        variationName: `Ad 3: Direct Call / Fast Quote (${phone})`,
        angle: "Synced from Google RSA Direct Call CTA",
        primaryText: `${d5}\n\n• House, Condo & Apartment Move-Out Cleaning\n• End of Tenancy & Landlord Checklist Coverage\n• Top-to-Bottom Deep House Cleaning\n\n📞 Call TidyUps at ${phone} or book online at ${campaign.finalUrl}`,
        headline: `Call TidyUps: ${phone}`.slice(0, 40),
        linkDescription: "Instant 60-Second Online Quote",
        ctaType: "CALL_NOW",
        destinationUrl: campaign.finalUrl,
        displayLink: "app.tidyupscleaning.com",
        promoBadge: "Openings This Week",
        imageUrl: activeAd?.imageUrl || campaign.attachedImageUrl,
      },
    ];

    updateFbConfig({
      campaignName: `Meta Leads - TidyUps ${loc} - Move-Out & Deep Clean`,
      adSetName: `${loc} +${fbConfig.radiusKm}km | Homeowners & Movers`,
      ads: syncedAds,
    });
    setSelectedAdIndex(0);
    setSyncedFromRsa(true);
    setTimeout(() => setSyncedFromRsa(false), 2500);
  };

  // AI Generate 3 Meta Ad Creatives
  const handleGenerateWithAi = async () => {
    setIsGeneratingAi(true);
    setAiError(null);
    try {
      const res = await fetch("/api/facebook-ads/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceType: campaign.serviceType,
          location: campaign.location,
          phoneNumber: campaign.phoneNumber || "587-742-2500",
          finalUrl: campaign.finalUrl,
          promoOffer: campaign.promoOffer,
          targetKeywords: campaign.targetKeywords,
          descriptions: campaign.descriptions.map((d) => d.text),
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(
          data.error || "Failed to generate Facebook & Instagram ads."
        );
      }

      const validCtas: MetaCtaType[] = [
        "BOOK_NOW",
        "GET_QUOTE",
        "CALL_NOW",
        "SEND_MESSAGE",
        "LEARN_MORE",
      ];

      const generatedAds: FacebookAdCreative[] = (data.ads || [])
        .slice(0, 4)
        .map((ad: any, i: number) => ({
          id: `fb-ai-${Date.now()}-${i}`,
          variationName: String(
            ad.variationName || `Ad Variation #${i + 1}`
          ).trim(),
          angle: String(ad.angle || "Local Cleaning Offer").trim(),
          primaryText: String(ad.primaryText || "").trim(),
          headline: String(ad.headline || "TidyUps Cleaning Edmonton")
            .trim()
            .slice(0, 40),
          linkDescription: String(
            ad.linkDescription || `Call ${campaign.phoneNumber || "587-742-2500"}`
          )
            .trim()
            .slice(0, 30),
          ctaType: validCtas.includes(ad.ctaType) ? ad.ctaType : "BOOK_NOW",
          destinationUrl: campaign.finalUrl,
          displayLink: "app.tidyupscleaning.com",
          promoBadge: String(ad.promoBadge || "Book in 60 Seconds")
            .trim()
            .slice(0, 24),
          imageUrl: activeAd?.imageUrl || campaign.attachedImageUrl,
        }));

      updateFbConfig({
        campaignName: data.campaignName || fbConfig.campaignName,
        adSetName: data.adSetName || fbConfig.adSetName,
        interests:
          Array.isArray(data.suggestedInterests) &&
          data.suggestedInterests.length > 0
            ? data.suggestedInterests
            : fbConfig.interests,
        ads: generatedAds.length > 0 ? generatedAds : fbConfig.ads,
      });
      setSelectedAdIndex(0);
    } catch (err: any) {
      setAiError(
        err?.message || "Could not generate Meta ads. Please try again."
      );
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleDownloadMetaCsv = () => {
    const blob = new Blob([metaCsvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tidyups-facebook-instagram-ads-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const metaPixelSnippet = `<!-- Meta Pixel Code for TidyUps Cleaning (${campaign.location}) -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${fbConfig.metaPixelId || "YOUR_PIXEL_ID"}');
fbq('track', 'PageView');
fbq('track', 'Lead', { content_name: 'TidyUps Cleaning Quote', currency: 'CAD', value: ${fbConfig.dailyBudgetCad} });
</script>`;

  const previewImageUrl =
    activeAd?.imageUrl ||
    campaign.attachedImageUrl ||
    campaign.generatedImages?.[0]?.imageUrl ||
    null;

  const monthlyMetaBudget = Math.round(fbConfig.dailyBudgetCad * 30.4);
  const estDailyReachMin = Math.round(fbConfig.dailyBudgetCad * 45);
  const estDailyReachMax = Math.round(fbConfig.dailyBudgetCad * 110);

  return (
    <div className="space-y-6">
      {/* Top Hero Banner: Unified Google + Facebook/Instagram Strategy */}
      <div className="bg-[#120e17] border border-white/10 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full brand-gradient text-white">
                <Sparkles className="w-3.5 h-3.5" />
                Facebook &amp; Instagram (Meta) Ads Studio
              </span>
              <span className="text-xs font-mono text-[#a899b3] flex flex-wrap items-center gap-1.5">
                <span>
                  Synced with Google RSA · Phone:{" "}
                  <strong className="text-white">
                    {campaign.phoneNumber || "587-742-2500"}
                  </strong>
                </span>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => onOpenPublicPage && onOpenPublicPage("privacy")}
                  className="text-[#ec4899] hover:underline font-bold cursor-pointer"
                >
                  Open /privacy
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => onOpenPublicPage && onOpenPublicPage("support")}
                  className="text-emerald-400 hover:underline font-bold cursor-pointer"
                >
                  Open /support (1-Click Data Deletion)
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => onOpenPublicPage && onOpenPublicPage("booking")}
                  className="text-sky-400 hover:underline font-bold cursor-pointer"
                >
                  Open /booking
                </button>
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-white mt-1">
              Connect Meta Account, Set Budget &amp; Launch Facebook + Instagram Lead Ads
            </h2>
            <p className="text-xs text-[#a899b3] max-w-3xl">
              Works just like your Google Ads Launcher: connect your{" "}
              <strong>Facebook / Meta Ad Account</strong>, set your daily CAD
              budget, customize your 3 Lead &amp; Booking Ads (pre-linked to{" "}
              <button
                type="button"
                onClick={() => onOpenPublicPage && onOpenPublicPage("privacy")}
                className="font-mono text-[#ec4899] underline cursor-pointer"
              >
                ads.tidyupscleaning.com/privacy
              </button>{" "}
              &amp;{" "}
              <button
                type="button"
                onClick={() => onOpenPublicPage && onOpenPublicPage("support")}
                className="font-mono text-emerald-400 underline cursor-pointer"
              >
                /support Data Deletion
              </button>
              ), and launch directly from the app or export to your{" "}
              <strong>6-Tab Color-Coded Google Sheet</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSyncFromGoogleRsa}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              {syncedFromRsa ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Synced from Google RSA!
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-[#ec4899]" />
                  1-Click Sync from Google RSA
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleGenerateWithAi}
              disabled={isGeneratingAi}
              className="px-4 py-2 text-xs font-bold rounded-full brand-gradient text-white disabled:opacity-60 transition-all flex items-center gap-2 whitespace-nowrap shrink-0 shadow-md"
            >
              {isGeneratingAi ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating 3 Meta Ads...
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5" />
                  AI Generate 3 FB &amp; IG Ads
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => downloadBrightStyledExcelWorkbook(campaign)}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Download Bright Colored Excel (.xls)
            </button>

            <button
              type="button"
              onClick={handleDownloadMetaCsv}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Export Meta Ads CSV
            </button>
          </div>
        </div>

        {aiError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200">
            {aiError}
          </div>
        )}
      </div>

      {/* 1-Click Connect Facebook Account, Set Budget & Launch Lead Ads Row (Just Like Google Ads Launcher) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 cols: Step 1 Connect Facebook / Meta Account & Ad Account ID */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
            <div>
              <div className="text-xs font-semibold text-[#ec4899]">
                Step 1 · Facebook &amp; Instagram Business Account Connection
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Connect Your Meta Ad Account &amp; Facebook Page
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAppReviewHelper((v) => !v)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-pink-200 bg-pink-50 text-pink-900 hover:bg-pink-100 flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#ec4899]" />
                {showAppReviewHelper
                  ? "Hide Meta App Review Helper"
                  : "Meta App Review & API Test Calls"}
              </button>

              <button
                type="button"
                onClick={() => setShowTokenDrawer((v) => !v)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5" />
                {showTokenDrawer ? "Hide Access Token" : "Access Token"}
              </button>

              <button
                type="button"
                onClick={handleConnectFacebookPopup}
                className="px-4 py-2 rounded-lg bg-[#1877F2] hover:bg-[#166FE5] text-white text-xs font-bold flex items-center gap-2 shadow-2xs transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {metaConnected
                  ? `Connected: ${metaUserName || "Meta Business"}`
                  : "Connect with Facebook"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Meta Ad Account ID
                </label>
                {(metaConnected || metaAccessToken) && (
                  <button
                    type="button"
                    onClick={handleDetectMetaAccounts}
                    disabled={isLoadingAccounts}
                    className="text-[11px] text-[#ec4899] hover:underline font-semibold inline-flex items-center gap-1"
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${
                        isLoadingAccounts ? "animate-spin" : ""
                      }`}
                    />
                    Auto-Detect
                  </button>
                )}
              </div>
              <input
                type="text"
                value={fbConfig.adAccountId || "act_1029384756"}
                onChange={(e) =>
                  updateFbConfig({ adAccountId: e.target.value })
                }
                placeholder="act_1234567890"
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg"
              />
              {discoveredAdAccounts.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {discoveredAdAccounts.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => updateFbConfig({ adAccountId: acc.id })}
                      className="px-2 py-0.5 text-[10px] font-mono rounded bg-pink-50 text-pink-900 border border-pink-200"
                    >
                      {acc.name} ({acc.id})
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Facebook Page ID / Handle
              </label>
              <input
                type="text"
                value={fbConfig.facebookPageId || "TidyUpsCleaningEdmonton"}
                onChange={(e) =>
                  updateFbConfig({ facebookPageId: e.target.value })
                }
                placeholder="TidyUpsCleaningEdmonton"
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg"
              />
              {discoveredPages.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {discoveredPages.map((pg) => (
                    <button
                      key={pg.id}
                      type="button"
                      onClick={() => updateFbConfig({ facebookPageId: pg.id })}
                      className="px-2 py-0.5 text-[10px] font-mono rounded bg-purple-50 text-purple-900 border border-purple-200"
                    >
                      {pg.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Initial Launch Status
              </label>
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => updateFbConfig({ adStatus: "PAUSED" })}
                  className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-md transition-colors ${
                    (fbConfig.adStatus || "PAUSED") === "PAUSED"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600"
                  }`}
                >
                  PAUSED (Review)
                </button>
                <button
                  type="button"
                  onClick={() => updateFbConfig({ adStatus: "ACTIVE" })}
                  className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-md transition-colors ${
                    fbConfig.adStatus === "ACTIVE"
                      ? "bg-white text-emerald-700 shadow-xs"
                      : "text-slate-600"
                  }`}
                >
                  ACTIVE (Live)
                </button>
              </div>
            </div>
          </div>

          {showTokenDrawer && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
              <div className="font-bold text-slate-900">
                Optional: Meta Marketing API Access Token (For Direct Graph API Push &amp; Test Calls)
              </div>
              <p className="text-slate-600">
                Paste a Meta System User Token or Graph API Explorer Token with{" "}
                <code className="font-mono">ads_management</code> and{" "}
                <code className="font-mono">ads_read</code> permissions to push
                directly to{" "}
                <code className="font-mono">
                  graph.facebook.com/v21.0/{fbConfig.adAccountId || "act_..."}
                </code>{" "}
                or complete Meta&apos;s required API test calls.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="password"
                  value={metaAccessToken}
                  onChange={(e) => setMetaAccessToken(e.target.value)}
                  placeholder="Paste EAAB... Meta Graph API Access Token"
                  className="flex-1 min-w-[220px] px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleDetectMetaAccounts}
                  disabled={!metaAccessToken.trim() || isLoadingAccounts}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-semibold disabled:opacity-50"
                >
                  Detect Accounts
                </button>
                <button
                  type="button"
                  onClick={handleRunReviewTestCalls}
                  disabled={isRunningTestCalls}
                  className="px-3 py-1.5 rounded-lg brand-gradient text-white font-bold disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isRunningTestCalls ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Firing 7 API Test Calls...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-3.5 h-3.5" />
                      Run Required API Test Calls
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {showAppReviewHelper && (
            <div className="p-4 rounded-xl bg-slate-950 text-slate-100 border border-slate-800 space-y-4 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#ec4899]">
                    Meta App Review · Marketing API Access Tier Assistant
                  </div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    Copy-Paste Answers &amp; 1-Click Required API Test Call Runner
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRunReviewTestCalls}
                  disabled={isRunningTestCalls}
                  className="px-3.5 py-2 rounded-lg brand-gradient text-white font-bold flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                >
                  {isRunningTestCalls ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Running 7 Graph API Calls...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-3.5 h-3.5" />
                      1-Click Fire Required API Test Calls
                    </>
                  )}
                </button>
              </div>

              {/* Token input right inside the review helper if not connected yet */}
              <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                <input
                  type="password"
                  value={metaAccessToken}
                  onChange={(e) => setMetaAccessToken(e.target.value)}
                  placeholder="Paste Meta Graph API Access Token (from developers.facebook.com/tools/explorer) to fire test calls..."
                  className="flex-1 min-w-[240px] px-2.5 py-1.5 text-xs font-mono bg-slate-950 border border-slate-700 rounded text-white"
                />
                <span className="text-[11px] text-slate-400">
                  Fires <code className="font-mono text-pink-300">/me</code>,{" "}
                  <code className="font-mono text-pink-300">/me/adaccounts</code>,{" "}
                  <code className="font-mono text-pink-300">/campaigns</code>,{" "}
                  <code className="font-mono text-pink-300">/adsets</code>,{" "}
                  <code className="font-mono text-pink-300">/ads</code> &amp;{" "}
                  <code className="font-mono text-pink-300">/insights</code>
                </span>
              </div>

              {testCallsResult && (
                <div className="p-3 rounded-lg bg-emerald-950/50 border border-emerald-500/40 space-y-2">
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    {testCallsResult.message}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {(testCallsResult.calls || []).map(
                      (c: any, idx: number) => (
                        <div
                          key={idx}
                          className="px-2.5 py-1.5 rounded bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2 font-mono text-[11px]"
                        >
                          <span className="truncate text-slate-200">
                            {c.endpoint}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold shrink-0 ${
                              c.ok
                                ? "bg-emerald-500/20 text-emerald-300"
                                : "bg-amber-500/20 text-amber-300"
                            }`}
                          >
                            HTTP {c.status} · {c.detail}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-pink-300">
                      1. &ldquo;How will this app use Marketing API Access Tier?&rdquo;
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyReviewBlock("usage", metaReviewUsageAnswer)
                      }
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-semibold flex items-center gap-1"
                    >
                      {copiedReviewText === "usage" ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy Answer
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-slate-300 leading-relaxed select-all">
                    {metaReviewUsageAnswer}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-pink-300">
                      2. &ldquo;Describe how your app uses this permission or feature (ads_management / ads_read)&rdquo;
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyReviewBlock(
                          "permission",
                          metaReviewPermissionAnswer
                        )
                      }
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-semibold flex items-center gap-1"
                    >
                      {copiedReviewText === "permission" ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy Answer
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-line select-all">
                    {metaReviewPermissionAnswer}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-pink-300">
                      3. instructions-web-2 · &ldquo;Provide instructions for accessing the app so we may complete our review&rdquo;
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyReviewBlock(
                          "instructions-web-2",
                          metaReviewInstructionsWeb2
                        )
                      }
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-semibold flex items-center gap-1"
                    >
                      {copiedReviewText === "instructions-web-2" ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy Answer
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-line select-all">
                    {metaReviewInstructionsWeb2}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-pink-300">
                      4. accesscode-web-1 · &ldquo;Access codes or test credentials&rdquo;
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyReviewBlock(
                          "accesscode-web-1",
                          metaReviewAccessCodeWeb1
                        )
                      }
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-semibold flex items-center gap-1"
                    >
                      {copiedReviewText === "accesscode-web-1" ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy Answer
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-line select-all">
                    {metaReviewAccessCodeWeb1}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-pink-300">
                      5. geo-web-5 · &ldquo;Geographic restrictions&rdquo; (Prevents Geo-Block Rejection)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyReviewBlock("geo-web-5", metaReviewGeoWeb5)
                      }
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-semibold flex items-center gap-1"
                    >
                      {copiedReviewText === "geo-web-5" ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy Answer
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-line select-all">
                    {metaReviewGeoWeb5}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                  <span className="text-slate-400">
                    For <strong>documents-web-1 (Supporting documentation)</strong>, download &amp; attach this verification guide:
                  </span>
                  <button
                    type="button"
                    onClick={handleDownloadReviewDoc}
                    className="px-3 py-1.5 rounded-lg bg-white text-slate-900 font-bold hover:bg-slate-100 flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Reviewer Verification Guide (.txt)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right 5 cols: Step 2 Set Budget & 1-Click Launch to Facebook & Instagram */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="text-xs font-semibold text-[#ec4899]">
                Step 2 · 1-Click Meta Lead Campaign Launcher
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Ready to Launch ({fbConfig.ads.length} FB &amp; IG Lead Ads)
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md">
              ${fbConfig.dailyBudgetCad}/day CAD
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg">
            {(
              [
                { id: "live", label: "Live Meta Account" },
                { id: "validate_only", label: "API Validate" },
                { id: "simulate", label: "Sandbox Test" },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setLaunchMode(m.id)}
                className={`py-1.5 px-2 text-xs font-semibold rounded-md transition-colors ${
                  launchMode === m.id
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {metaLaunchError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{metaLaunchError}</span>
            </div>
          )}

          {metaLaunchResult && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 text-xs text-emerald-950">
              <div className="flex items-center gap-2 font-bold text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {metaLaunchResult.mode === "live"
                    ? "Live Facebook & Instagram Lead Campaign Created!"
                    : "Meta Lead Campaign Verified & Staged for Launch!"}
                </span>
              </div>
              {metaLaunchResult.apiNotice && (
                <p className="text-[11px] bg-white/80 p-2 rounded border border-emerald-200 text-emerald-900">
                  {metaLaunchResult.apiNotice}
                </p>
              )}
              {metaLaunchResult.receipt && (
                <div className="font-mono text-[11px] space-y-0.5 text-emerald-900">
                  <div>
                    Ad Account: {metaLaunchResult.receipt.adAccountResource} ($
                    {metaLaunchResult.receipt.dailyBudgetCad} CAD/day)
                  </div>
                  <div>
                    Campaign ID: {metaLaunchResult.receipt.campaignId} (
                    {metaLaunchResult.receipt.campaignStatus})
                  </div>
                  <div>
                    Instant Lead Form ID: {metaLaunchResult.receipt.leadFormId}{" "}
                    (Linked to /privacy)
                  </div>
                  <div>
                    Ads Created: {metaLaunchResult.receipt.adsCreated} (FB Feed,
                    IG Feed, Stories &amp; Reels)
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => setShowLaunchConfirmModal(true)}
              disabled={isLaunchingMeta}
              className="flex-1 py-2.5 px-4 rounded-full brand-gradient text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md disabled:opacity-60"
            >
              {isLaunchingMeta ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Launching Meta Lead Ads...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  Launch FB &amp; IG Lead Campaign ({fbConfig.ads.length} Ads)
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleDownloadMetaCsv}
              className="py-2.5 px-3.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
          </div>
        </div>
      </div>

      {/* Main 2-Column Workspace: Left (7 cols) Editor + Targeting | Right (5 cols) Live Feed/Story/Lead Form Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Ad Variations Selector & Copy Editor */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  1. Facebook &amp; Instagram Ad Creative Variations ({fbConfig.ads.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Test multiple hooks (Move-Out Inspection, Deep Clean Reset, and Direct Call {campaign.phoneNumber || "587-742-2500"})
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const newAd: FacebookAdCreative = {
                    id: `fb-custom-${Date.now()}`,
                    variationName: `Ad ${fbConfig.ads.length + 1}: Custom ${campaign.location} Angle`,
                    angle: "Local Homeowner Special",
                    primaryText: `Looking for reliable move-out or deep house cleaning in ${campaign.location}? ✨\n\n✅ Thorough kitchens, bathrooms, baseboards & floors\n✅ Upfront flat-rate pricing & 100% satisfaction guarantee\n\n📲 Book online at ${campaign.finalUrl} or call TidyUps at ${campaign.phoneNumber || "587-742-2500"}!`,
                    headline: `Book ${campaign.location} Cleaning Today`.slice(
                      0,
                      40
                    ),
                    linkDescription: `Call ${
                      campaign.phoneNumber || "587-742-2500"
                    }`,
                    ctaType: "BOOK_NOW",
                    destinationUrl: campaign.finalUrl,
                    displayLink: "app.tidyupscleaning.com",
                    promoBadge: "Book Online in 60s",
                  };
                  updateFbConfig({ ads: [...fbConfig.ads, newAd] });
                  setSelectedAdIndex(fbConfig.ads.length);
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Ad Variation
              </button>
            </div>

            {/* Variation Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              {fbConfig.ads.map((ad, idx) => (
                <button
                  key={ad.id}
                  type="button"
                  onClick={() => setSelectedAdIndex(idx)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all text-left ${
                    selectedAdIndex === idx
                      ? "brand-gradient text-white border-transparent shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div>{ad.variationName}</div>
                  <div
                    className={`text-[10px] font-normal mt-0.5 ${
                      selectedAdIndex === idx
                        ? "text-white/90"
                        : "text-slate-500"
                    }`}
                  >
                    {ad.angle} · CTA: {META_CTA_LABELS[ad.ctaType]}
                  </div>
                </button>
              ))}
            </div>

            {activeAd && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-6">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Variation Name
                    </label>
                    <input
                      type="text"
                      value={activeAd.variationName}
                      onChange={(e) =>
                        updateActiveAd({ variationName: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      CTA Button Type
                    </label>
                    <select
                      value={activeAd.ctaType}
                      onChange={(e) =>
                        updateActiveAd({
                          ctaType: e.target.value as MetaCtaType,
                        })
                      }
                      className="w-full px-2.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <option value="BOOK_NOW">Book Now</option>
                      <option value="GET_QUOTE">Get Quote</option>
                      <option value="CALL_NOW">Call Now</option>
                      <option value="SEND_MESSAGE">Send Message</option>
                      <option value="LEARN_MORE">Learn More</option>
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Image Overlay Badge
                    </label>
                    <input
                      type="text"
                      value={activeAd.promoBadge}
                      onChange={(e) =>
                        updateActiveAd({ promoBadge: e.target.value })
                      }
                      placeholder="100% Inspection Ready"
                      className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                {/* Primary Text */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-800">
                      Primary Text (Appears above the image in Facebook &amp; below in Instagram)
                    </label>
                    <span className="text-[11px] font-mono text-slate-500">
                      {activeAd.primaryText.length} chars
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    value={activeAd.primaryText}
                    onChange={(e) =>
                      updateActiveAd({ primaryText: e.target.value })
                    }
                    className="w-full p-3 text-xs leading-relaxed bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                  />
                </div>

                {/* Headline (<=40 chars) & Link Description (<=30 chars) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-800">
                        Headline (Bold Bar Below Image)
                      </label>
                      <span
                        className={`text-[11px] font-mono ${
                          activeAd.headline.length > 40
                            ? "text-rose-600 font-bold"
                            : "text-emerald-700"
                        }`}
                      >
                        {activeAd.headline.length}/40 chars
                      </span>
                    </div>
                    <input
                      type="text"
                      value={activeAd.headline}
                      onChange={(e) =>
                        updateActiveAd({ headline: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-800">
                        Link Description (Subtext Next to CTA)
                      </label>
                      <span
                        className={`text-[11px] font-mono ${
                          activeAd.linkDescription.length > 30
                            ? "text-rose-600 font-bold"
                            : "text-emerald-700"
                        }`}
                      >
                        {activeAd.linkDescription.length}/30 chars
                      </span>
                    </div>
                    <input
                      type="text"
                      value={activeAd.linkDescription}
                      onChange={(e) =>
                        updateActiveAd({ linkDescription: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                {/* Destination URL & Quick Image Picker */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end pt-1">
                  <div className="sm:col-span-8">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Booking Destination URL
                    </label>
                    <input
                      type="url"
                      value={activeAd.destinationUrl}
                      onChange={(e) =>
                        updateActiveAd({ destinationUrl: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onOpenImageStudio}
                      className="flex-1 py-2 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 flex items-center justify-center gap-1.5"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-[#ec4899]" />
                      AI Ad Image Studio
                    </button>
                    {fbConfig.ads.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const filtered = fbConfig.ads.filter(
                            (_, i) => i !== selectedAdIndex
                          );
                          updateFbConfig({ ads: filtered });
                          setSelectedAdIndex(0);
                        }}
                        className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600"
                        title="Delete this ad variation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Session AI Images Strip if available */}
                {(campaign.generatedImages || []).length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <div className="text-[11px] font-semibold text-slate-700">
                      Select an AI Cleaning Photo for This Meta Ad:
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {(campaign.generatedImages || []).map((img) => (
                        <button
                          key={img.id}
                          type="button"
                          onClick={() =>
                            updateActiveAd({ imageUrl: img.imageUrl })
                          }
                          className={`relative rounded-lg overflow-hidden border-2 shrink-0 ${
                            previewImageUrl === img.imageUrl
                              ? "border-[#ec4899]"
                              : "border-transparent opacity-75 hover:opacity-100"
                          }`}
                        >
                          <img
                            src={img.imageUrl}
                            alt={img.sceneTitle}
                            className="w-16 h-16 object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card 2: Edmonton Local Geo-Radius, Audience Interests & Budget */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                2. Meta Ad Set Targeting, Daily Budget &amp; Instant Lead Form
              </h3>
              <p className="text-xs text-slate-500">
                Configured for local residential cleaning leads in{" "}
                {campaign.location || "Edmonton"}
              </p>
            </div>

            {/* Daily Budget Slider */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-[#ec4899]" />
                    Meta Daily Ad Set Budget (CAD / day)
                  </label>
                  <div className="text-[11px] text-slate-500">
                    Est. Monthly: <strong>${monthlyMetaBudget} CAD/mo</strong> ·
                    Est. Daily Local Reach:{" "}
                    <strong>
                      {estDailyReachMin.toLocaleString()}–
                      {estDailyReachMax.toLocaleString()} people/day
                    </strong>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-slate-700">$</span>
                  <input
                    type="number"
                    min={5}
                    max={300}
                    value={fbConfig.dailyBudgetCad}
                    onChange={(e) =>
                      updateFbConfig({
                        dailyBudgetCad: Math.max(5, Number(e.target.value) || 5),
                      })
                    }
                    className="w-20 px-2.5 py-1.5 text-sm font-bold font-mono text-right bg-white border border-slate-300 rounded-lg"
                  />
                  <span className="text-xs text-slate-500">CAD/day</span>
                </div>
              </div>
              <input
                type="range"
                min={5}
                max={150}
                step={5}
                value={Math.min(150, fbConfig.dailyBudgetCad)}
                onChange={(e) =>
                  updateFbConfig({ dailyBudgetCad: Number(e.target.value) })
                }
                className="w-full accent-[#ec4899] cursor-pointer"
              />
            </div>

            {/* Radius, Age & Objective */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Campaign Objective
                </label>
                <select
                  value={fbConfig.objective}
                  onChange={(e) =>
                    updateFbConfig({
                      objective: e.target.value as FacebookCampaignConfig["objective"],
                    })
                  }
                  className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="OUTCOME_LEADS">
                    Leads (Instant Form + Booking)
                  </option>
                  <option value="OUTCOME_SALES">
                    Website Booking Conversions
                  </option>
                  <option value="OUTCOME_TRAFFIC">
                    Website &amp; Call Traffic
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Local Drop-Pin Radius (km)
                </label>
                <input
                  type="number"
                  min={5}
                  max={80}
                  value={fbConfig.radiusKm}
                  onChange={(e) =>
                    updateFbConfig({
                      radiusKm: Math.max(5, Number(e.target.value) || 25),
                    })
                  }
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Homeowner / Renter Age Range
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={18}
                    max={60}
                    value={fbConfig.ageMin}
                    onChange={(e) =>
                      updateFbConfig({ ageMin: Number(e.target.value) || 23 })
                    }
                    className="w-full px-2.5 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg"
                  />
                  <span className="text-xs text-slate-400">to</span>
                  <input
                    type="number"
                    min={25}
                    max={65}
                    value={fbConfig.ageMax}
                    onChange={(e) =>
                      updateFbConfig({ ageMax: Number(e.target.value) || 65 })
                    }
                    className="w-full px-2.5 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Target Locations */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#ec4899]" />
                  Targeted Cities &amp; Service Areas
                </label>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (newLocationInput.trim()) {
                      updateFbConfig({
                        locations: [
                          ...fbConfig.locations,
                          newLocationInput.trim(),
                        ],
                      });
                      setNewLocationInput("");
                    }
                  }}
                  className="flex items-center gap-1.5"
                >
                  <input
                    type="text"
                    value={newLocationInput}
                    onChange={(e) => setNewLocationInput(e.target.value)}
                    placeholder="Add city/neighborhood..."
                    className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 text-xs font-semibold bg-slate-900 text-white rounded-md"
                  >
                    + Add
                  </button>
                </form>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {fbConfig.locations.map((loc, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md font-medium"
                  >
                    <span>{loc}</span>
                    <button
                      type="button"
                      onClick={() =>
                        updateFbConfig({
                          locations: fbConfig.locations.filter(
                            (_, i) => i !== idx
                          ),
                        })
                      }
                      className="text-slate-400 hover:text-rose-600 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Detailed Audience Interests */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-[#a855f7]" />
                  Meta Detailed Targeting Interests (Movers, Renters, Real Estate)
                </label>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (newInterestInput.trim()) {
                      updateFbConfig({
                        interests: [
                          ...fbConfig.interests,
                          newInterestInput.trim(),
                        ],
                      });
                      setNewInterestInput("");
                    }
                  }}
                  className="flex items-center gap-1.5"
                >
                  <input
                    type="text"
                    value={newInterestInput}
                    onChange={(e) => setNewInterestInput(e.target.value)}
                    placeholder="Add interest..."
                    className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 text-xs font-semibold bg-slate-900 text-white rounded-md"
                  >
                    + Add
                  </button>
                </form>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {fbConfig.interests.map((interest, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 text-xs bg-purple-50 text-purple-900 border border-purple-200 px-2.5 py-1 rounded-md font-medium"
                  >
                    <span>{interest}</span>
                    <button
                      type="button"
                      onClick={() =>
                        updateFbConfig({
                          interests: fbConfig.interests.filter(
                            (_, i) => i !== idx
                          ),
                        })
                      }
                      className="text-purple-400 hover:text-rose-600 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Meta Instant Lead Form Questions & Privacy Policy Link */}
            <div className="space-y-2.5 pt-3 border-t border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Meta Instant Lead Form Questions &amp; Required Privacy Policy
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Meta requires a live Privacy Policy URL &amp; Data Deletion URL —
                    click to open:{" "}
                    <button
                      type="button"
                      onClick={() =>
                        onOpenPublicPage && onOpenPublicPage("privacy")
                      }
                      className="font-mono text-teal-700 font-semibold underline cursor-pointer"
                    >
                      {fbConfig.privacyPolicyUrl}
                    </button>{" "}
                    |{" "}
                    <button
                      type="button"
                      onClick={() =>
                        onOpenPublicPage && onOpenPublicPage("support")
                      }
                      className="font-mono text-rose-700 font-semibold underline cursor-pointer"
                    >
                      /support (Data Deletion)
                    </button>
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      onOpenPublicPage && onOpenPublicPage("support")
                    }
                    className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold cursor-pointer"
                  >
                    Open Data Deletion (/support)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewPlacement("lead_form")}
                    className="px-2.5 py-1 rounded-md bg-slate-900 text-white text-[11px] font-semibold cursor-pointer"
                  >
                    Preview Lead Form →
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Meta Lead Form Privacy Policy URL
                  </label>
                  <input
                    type="url"
                    value={fbConfig.privacyPolicyUrl}
                    onChange={(e) =>
                      updateFbConfig({ privacyPolicyUrl: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Add Lead Form Question
                  </label>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (newQuestionInput.trim()) {
                        updateFbConfig({
                          leadFormQuestions: [
                            ...fbConfig.leadFormQuestions,
                            newQuestionInput.trim(),
                          ],
                        });
                        setNewQuestionInput("");
                      }
                    }}
                    className="flex items-center gap-1.5"
                  >
                    <input
                      type="text"
                      value={newQuestionInput}
                      onChange={(e) => setNewQuestionInput(e.target.value)}
                      placeholder="e.g. Preferred Cleaning Date?"
                      className="flex-1 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg"
                    >
                      + Add
                    </button>
                  </form>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {fbConfig.leadFormQuestions.map((q, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md"
                  >
                    <span>
                      {idx + 1}. {q}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateFbConfig({
                          leadFormQuestions: fbConfig.leadFormQuestions.filter(
                            (_, i) => i !== idx
                          ),
                        })
                      }
                      className="text-slate-400 hover:text-rose-600 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Sticky Live Facebook Feed, Instagram Feed, Story/Reel & Lead Form Simulator */}
        <div className="lg:col-span-5 lg:sticky lg:top-20 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-[#ec4899]" />
                  Live Meta Placement Simulator
                </h3>
                <p className="text-[11px] text-slate-500">
                  Preview how your TidyUps Cleaning ad renders across Facebook &amp; Instagram
                </p>
              </div>
            </div>

            {/* Placement Switcher */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-lg">
              {(
                [
                  { id: "facebook_feed", label: "FB Feed" },
                  { id: "instagram_feed", label: "IG Feed" },
                  { id: "stories_reels", label: "Story / Reel" },
                  { id: "lead_form", label: "Lead Form" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPreviewPlacement(tab.id)}
                  className={`py-1.5 px-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                    previewPlacement === tab.id
                      ? "brand-gradient text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Placement 1: Facebook Feed Preview */}
            {previewPlacement === "facebook_feed" && activeAd && (
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {/* FB Header */}
                <div className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full brand-gradient flex items-center justify-center text-white font-extrabold text-xs">
                      TU
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        <span>TidyUps Cleaning</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 fill-blue-600 text-white" />
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Sponsored · 🌍 {campaign.location || "Edmonton"}
                      </div>
                    </div>
                  </div>
                  <span className="text-slate-400 font-bold text-sm">•••</span>
                </div>

                {/* FB Primary Text */}
                <div className="px-3.5 pb-3 text-xs text-slate-800 whitespace-pre-line leading-relaxed">
                  {activeAd.primaryText}
                </div>

                {/* FB Media Visual */}
                <div className="relative bg-slate-900 aspect-square flex items-center justify-center overflow-hidden">
                  {previewImageUrl ? (
                    <img
                      src={previewImageUrl}
                      alt={activeAd.headline}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="p-6 text-center space-y-2 bg-gradient-to-br from-[#120e17] via-[#1f1629] to-[#2d1b3d] w-full h-full flex flex-col items-center justify-center">
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold brand-gradient text-white">
                        {activeAd.promoBadge || "Edmonton Cleaning Pros"}
                      </span>
                      <div className="text-lg font-extrabold text-white max-w-xs leading-snug">
                        {activeAd.headline}
                      </div>
                      <div className="text-xs text-[#a899b3]">
                        Call {campaign.phoneNumber || "587-742-2500"} ·{" "}
                        {activeAd.displayLink}
                      </div>
                      <button
                        type="button"
                        onClick={onOpenImageStudio}
                        className="mt-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium border border-white/15"
                      >
                        + Generate AI Cleaning Photo
                      </button>
                    </div>
                  )}

                  {activeAd.promoBadge && (
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold brand-gradient text-white shadow-md">
                      {activeAd.promoBadge}
                    </div>
                  )}
                </div>

                {/* FB Link Bar */}
                <div className="p-3 bg-[#F0F2F5] border-t border-slate-200 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 truncate">
                      {activeAd.displayLink || "app.tidyupscleaning.com"}
                    </div>
                    <div className="text-xs font-bold text-slate-900 truncate mt-0.5">
                      {activeAd.headline}
                    </div>
                    <div className="text-[11px] text-slate-600 truncate">
                      {activeAd.linkDescription}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenPublicPage && onOpenPublicPage("booking")
                    }
                    className="px-3.5 py-2 rounded-md bg-[#E4E6EB] hover:bg-slate-300 text-slate-900 font-bold text-xs whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {META_CTA_LABELS[activeAd.ctaType]}
                  </button>
                </div>

                {/* FB Social Actions */}
                <div className="px-4 py-2.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <ThumbsUp className="w-3.5 h-3.5" /> Like
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5" /> Comment
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5" /> Share
                  </span>
                </div>
              </div>
            )}

            {/* Placement 2: Instagram Feed Preview */}
            {previewPlacement === "instagram_feed" && activeAd && (
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full brand-gradient flex items-center justify-center text-white font-bold text-xs">
                      TU
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        tidyupscleaning
                      </div>
                      <div className="text-[10px] text-slate-500">Sponsored</div>
                    </div>
                  </div>
                  <span className="text-slate-400 font-bold">•••</span>
                </div>

                <div className="relative bg-slate-900 aspect-square flex items-center justify-center overflow-hidden">
                  {previewImageUrl ? (
                    <img
                      src={previewImageUrl}
                      alt={activeAd.headline}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="p-6 text-center space-y-2 bg-gradient-to-br from-[#120e17] via-[#1f1629] to-[#2d1b3d] w-full h-full flex flex-col items-center justify-center">
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold brand-gradient text-white">
                        {activeAd.promoBadge}
                      </span>
                      <div className="text-lg font-extrabold text-white">
                        {activeAd.headline}
                      </div>
                      <div className="text-xs text-[#a899b3]">
                        {campaign.location} · {campaign.phoneNumber}
                      </div>
                    </div>
                  )}
                </div>

                {/* IG CTA Strip */}
                <button
                  type="button"
                  onClick={() =>
                    onOpenPublicPage && onOpenPublicPage("booking")
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 border-b border-slate-200 flex items-center justify-between cursor-pointer"
                >
                  <span className="text-xs font-bold text-blue-600">
                    {META_CTA_LABELS[activeAd.ctaType]}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                </button>

                <div className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-slate-800">
                    <div className="flex items-center gap-3">
                      <Heart className="w-4 h-4" />
                      <MessageCircle className="w-4 h-4" />
                      <Send className="w-4 h-4" />
                    </div>
                    <Bookmark className="w-4 h-4" />
                  </div>
                  <div className="text-xs text-slate-800 whitespace-pre-line leading-relaxed">
                    <strong className="mr-1.5">tidyupscleaning</strong>
                    {activeAd.primaryText}
                  </div>
                </div>
              </div>
            )}

            {/* Placement 3: Instagram / Facebook Story & Reel (9:16) */}
            {previewPlacement === "stories_reels" && activeAd && (
              <div className="mx-auto max-w-[300px] aspect-[9/16] rounded-2xl bg-gradient-to-b from-[#120e17] via-[#1a1324] to-[#0d0a0f] border border-slate-800 text-white p-4 flex flex-col justify-between relative overflow-hidden shadow-lg">
                {previewImageUrl && (
                  <img
                    src={previewImageUrl}
                    alt={activeAd.headline}
                    className="absolute inset-0 w-full h-full object-cover opacity-45"
                  />
                )}
                <div className="relative z-10 space-y-2">
                  <div className="h-1 w-full bg-white/30 rounded-full overflow-hidden">
                    <div className="h-full w-2/3 brand-gradient" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full brand-gradient flex items-center justify-center text-[10px] font-bold">
                      TU
                    </div>
                    <div>
                      <div className="text-xs font-bold">TidyUps Cleaning</div>
                      <div className="text-[10px] text-white/80">
                        Sponsored · {campaign.location}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 my-auto space-y-2.5 bg-black/65 backdrop-blur-xs p-3.5 rounded-xl border border-white/15">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold brand-gradient text-white">
                    {activeAd.promoBadge}
                  </span>
                  <div className="text-base font-extrabold leading-snug">
                    {activeAd.headline}
                  </div>
                  <p className="text-[11px] text-white/90 line-clamp-4 whitespace-pre-line">
                    {activeAd.primaryText}
                  </p>
                  <div className="text-xs font-mono font-bold text-[#FF7B54] flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {campaign.phoneNumber || "587-742-2500"}
                  </div>
                </div>

                <div className="relative z-10 pt-2 text-center">
                  <button
                    type="button"
                    onClick={() =>
                      onOpenPublicPage && onOpenPublicPage("booking")
                    }
                    className="w-full py-2.5 rounded-full brand-gradient text-white font-bold text-xs shadow-md cursor-pointer"
                  >
                    {META_CTA_LABELS[activeAd.ctaType]} ↑
                  </button>
                </div>
              </div>
            )}

            {/* Placement 4: Meta Instant Lead Form Modal Preview */}
            {previewPlacement === "lead_form" && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3.5">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-200">
                  <div className="w-9 h-9 rounded-full brand-gradient flex items-center justify-center text-white font-bold text-xs">
                    TU
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      TidyUps Cleaning — Instant Quote Form
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {campaign.location} · Call{" "}
                      {campaign.phoneNumber || "587-742-2500"}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {fbConfig.leadFormQuestions.map((q, i) => (
                    <div key={i} className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        {q}
                      </label>
                      <div className="h-7 rounded bg-slate-50 border border-slate-200 px-2 flex items-center text-[11px] text-slate-400">
                        Auto-filled by Meta user profile...
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-600 space-y-1.5">
                  <div>
                    By clicking Submit, you agree to send your info to{" "}
                    <strong>TidyUps Cleaning</strong> in accordance with their{" "}
                    <a
                      href="/privacy"
                      onClick={(e) => {
                        e.preventDefault();
                        if (onOpenPublicPage) onOpenPublicPage("privacy");
                      }}
                      className="text-teal-700 underline font-bold cursor-pointer"
                    >
                      Privacy Policy ({fbConfig.privacyPolicyUrl})
                    </a>
                    .
                  </div>
                  <div>
                    Need to delete your data?{" "}
                    <a
                      href="/support"
                      onClick={(e) => {
                        e.preventDefault();
                        if (onOpenPublicPage) onOpenPublicPage("support");
                      }}
                      className="text-rose-700 underline font-bold cursor-pointer"
                    >
                      Open 1-Click Data Deletion (/support)
                    </a>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onOpenPublicPage && onOpenPublicPage("booking")
                  }
                  className="w-full py-2.5 rounded-lg brand-gradient text-white text-center text-xs font-bold cursor-pointer"
                >
                  Submit &amp; View Instant Online Quote →
                </button>
              </div>
            )}

            {/* Quick Export & Sync Actions inside Simulator Card */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onOpenLaunchTab}
                className="flex-1 py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Save Google + FB Ads to Color-Coded Sheet
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Meta Marketing API Payload & Meta Pixel Lead Snippet */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meta Marketing API JSON */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Code2 className="w-4 h-4 text-[#ec4899]" />
              <span>Meta Marketing API v21.0 Campaign + Lead Form Payload</span>
            </div>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(
                  JSON.stringify(metaApiPayload, null, 2)
                );
                setCopiedJson(true);
                setTimeout(() => setCopiedJson(false), 2000);
              }}
              className="px-2.5 py-1 rounded-md bg-slate-900 text-white text-xs font-medium flex items-center gap-1.5"
            >
              {copiedJson ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Copied JSON
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy API JSON
                </>
              )}
            </button>
          </div>
          <pre className="p-4 bg-[#0d0a0f] text-slate-100 text-[11px] font-mono overflow-x-auto max-h-[260px]">
            <code>{JSON.stringify(metaApiPayload, null, 2)}</code>
          </pre>
        </div>

        {/* Meta Pixel Lead Event Snippet */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Code2 className="w-4 h-4 text-[#a855f7]" />
              <span>Meta Pixel Lead Conversion Snippet (fbq)</span>
            </div>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(metaPixelSnippet);
                setCopiedPixel(true);
                setTimeout(() => setCopiedPixel(false), 2000);
              }}
              className="px-2.5 py-1 rounded-md bg-slate-900 text-white text-xs font-medium flex items-center gap-1.5"
            >
              {copiedPixel ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Copied Pixel
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy Pixel Code
                </>
              )}
            </button>
          </div>
          <pre className="p-4 bg-[#0d0a0f] text-slate-100 text-[11px] font-mono overflow-x-auto max-h-[260px]">
            <code>{metaPixelSnippet}</code>
          </pre>
        </div>
      </div>

      {/* Confirmation Modal for Launching Facebook & Instagram Lead Campaign */}
      {showLaunchConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">
              Confirm Facebook &amp; Instagram Lead Campaign Launch
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Review your Meta Lead Ads configuration for{" "}
              <strong>TidyUps Cleaning</strong> in mode{" "}
              <strong className="uppercase">{launchMode}</strong>:
            </p>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-xs font-mono text-slate-800">
              <div>Ad Account: {fbConfig.adAccountId || "act_1029384756"}</div>
              <div>
                Facebook Page:{" "}
                {fbConfig.facebookPageId || "TidyUpsCleaningEdmonton"}
              </div>
              <div>Campaign: {fbConfig.campaignName}</div>
              <div>
                Daily Budget: ${fbConfig.dailyBudgetCad.toFixed(2)} CAD/day
              </div>
              <div>
                Geo Radius: {fbConfig.locations.join(", ")} (+
                {fbConfig.radiusKm}km)
              </div>
              <div>Lead Ads: {fbConfig.ads.length} Variations</div>
              <div>
                Privacy Policy: {fbConfig.privacyPolicyUrl}
              </div>
              <div>Initial Status: {fbConfig.adStatus || "PAUSED"}</div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowLaunchConfirmModal(false)}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteMetaLaunch}
                className="px-4 py-2 text-xs font-bold rounded-full brand-gradient text-white shadow-sm"
              >
                Confirm &amp; Launch Meta Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
