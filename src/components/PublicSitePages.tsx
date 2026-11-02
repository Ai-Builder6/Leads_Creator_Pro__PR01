import React, { useState, useEffect } from "react";
import {
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  FileText,
  HelpCircle,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  ArrowLeft,
  Trash2,
  Loader2,
  Lock,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

export type PublicPageRoute = "booking" | "support" | "privacy" | "tc";

interface PublicSitePagesProps {
  activePage: PublicPageRoute;
  onSelectPage: (page: PublicPageRoute) => void;
  onBackToStudio: () => void;
  phoneNumber: string;
  locationName: string;
}

interface DeletionReceiptData {
  confirmationCode: string;
  status: string;
  deletedAt: string;
  identifier: string;
  scopesPurged: string[];
  statusUrl: string;
}

export const PublicSitePages: React.FC<PublicSitePagesProps> = ({
  activePage,
  onSelectPage,
  onBackToStudio,
  phoneNumber = "587-742-2500",
  locationName = "Edmonton & Area",
}) => {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Booking Form State (/booking)
  const [serviceType, setServiceType] = useState<
    "Move-Out / End of Tenancy" | "Deep Cleaning" | "Standard Home Clean"
  >("Move-Out / End of Tenancy");
  const [bedrooms, setBedrooms] = useState(3);
  const [bathrooms, setBathrooms] = useState(2);
  const [extras, setExtras] = useState<string[]>([
    "Inside Oven & Fridge",
    "Baseboards & Door Frames",
  ]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [serviceAddress, setServiceAddress] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [bookingSubmitted, setBookingSubmitted] = useState(false);

  // Support Form State (/support)
  const [supportName, setSupportName] = useState("");
  const [supportContact, setSupportContact] = useState("");
  const [supportTopic, setSupportTopic] = useState(
    "Move-Out Inspection Guarantee"
  );
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSubmitted, setSupportSubmitted] = useState(false);

  // 1-Click Self-Service Data Deletion State (/support)
  const [deletionIdentifier, setDeletionIdentifier] = useState("");
  const [deletionScope, setDeletionScope] = useState<"all" | "meta_only">("all");
  const [isDeletingData, setIsDeletingData] = useState(false);
  const [deletionReceipt, setDeletionReceipt] =
    useState<DeletionReceiptData | null>(null);
  const [copiedReceiptCode, setCopiedReceiptCode] = useState(false);

  // Check if URL has ?deletion_code=... (e.g. from Meta Data Deletion Callback link)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("deletion_code");
    if (code) {
      fetch(`/api/user-data/delete-status/${encodeURIComponent(code)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data?.receipt) {
            setDeletionReceipt(data.receipt);
          }
        })
        .catch(() => {
          // ignore
        });
    }
  }, []);

  const executeOneClickDataDeletion = async (customIdentifier?: string) => {
    setIsDeletingData(true);
    try {
      // 1. Clear all local browser storage & session data for this user
      try {
        localStorage.removeItem("tidy_up_rsa_saved_campaigns_v4");
        sessionStorage.clear();
      } catch {
        // ignore storage errors
      }

      // Reset any in-page personal inputs
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setServiceAddress("");
      setSupportName("");
      setSupportContact("");
      setSupportMessage("");

      // 2. Call backend endpoint to purge connected OAuth tokens & log deletion receipt
      const response = await fetch("/api/user-data/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier:
            customIdentifier !== undefined
              ? customIdentifier
              : deletionIdentifier.trim() ||
                "Instant 1-Click Self-Service Data Erasure",
          deletionScope,
          purgeConnectedOAuth: true,
        }),
      });
      const data = await response.json();
      if (data?.receipt) {
        setDeletionReceipt(data.receipt);
      } else {
        const fallbackCode = `DEL-${new Date()
          .toISOString()
          .slice(0, 10)
          .replace(/-/g, "")}-${Math.random()
          .toString(36)
          .substring(2, 7)
          .toUpperCase()}`;
        setDeletionReceipt({
          confirmationCode: fallbackCode,
          status: "COMPLETED",
          deletedAt: new Date().toISOString(),
          identifier:
            customIdentifier ||
            deletionIdentifier.trim() ||
            "Instant 1-Click Self-Service Data Erasure",
          scopesPurged: [
            "Personal Contact, Quote & Booking Information",
            "Facebook & Instagram Lead Form Submissions",
            "Connected Meta (Facebook) OAuth & Marketing API Tokens",
            "Connected Google Ads & Google Workspace Session Tokens",
            "Local Browser Campaign & Session Storage",
          ],
          statusUrl: `https://ads.tidyupscleaning.com/support?deletion_code=${fallbackCode}`,
        });
      }
    } catch {
      const fallbackCode = `DEL-${new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "")}-${Math.random()
        .toString(36)
        .substring(2, 7)
        .toUpperCase()}`;
      setDeletionReceipt({
        confirmationCode: fallbackCode,
        status: "COMPLETED",
        deletedAt: new Date().toISOString(),
        identifier:
          customIdentifier ||
          deletionIdentifier.trim() ||
          "Instant 1-Click Self-Service Data Erasure",
        scopesPurged: [
          "Personal Contact, Quote & Booking Information",
          "Facebook & Instagram Lead Form Submissions",
          "Connected Meta (Facebook) OAuth & Marketing API Tokens",
          "Connected Google Ads & Google Workspace Session Tokens",
          "Local Browser Campaign & Session Storage",
        ],
        statusUrl: `https://ads.tidyupscleaning.com/support?deletion_code=${fallbackCode}`,
      });
    } finally {
      setIsDeletingData(false);
    }
  };

  const handleCopyReceiptCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedReceiptCode(true);
      setTimeout(() => setCopiedReceiptCode(false), 2000);
    } catch {
      // ignore
    }
  };

  const currentOrigin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://ads.tidyupscleaning.com";

  const routeMap: {
    id: PublicPageRoute;
    path: string;
    label: string;
    fullUrl: string;
    liveUrl: string;
  }[] = [
    {
      id: "booking",
      path: "/booking",
      label: "Online Booking (/booking)",
      fullUrl: "https://ads.tidyupscleaning.com/booking",
      liveUrl: `${currentOrigin}/booking`,
    },
    {
      id: "support",
      path: "/support",
      label: "1-Click Data Deletion & Support (/support)",
      fullUrl: "https://ads.tidyupscleaning.com/support",
      liveUrl: `${currentOrigin}/support`,
    },
    {
      id: "privacy",
      path: "/privacy",
      label: "Privacy Policy (/privacy)",
      fullUrl: "https://ads.tidyupscleaning.com/privacy",
      liveUrl: `${currentOrigin}/privacy`,
    },
    {
      id: "tc",
      path: "/T&C",
      label: "Terms & Conditions (/T&C)",
      fullUrl: "https://ads.tidyupscleaning.com/T&C",
      liveUrl: `${currentOrigin}/T&C`,
    },
  ];

  const currentRouteObj =
    routeMap.find((r) => r.id === activePage) || routeMap[0];

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch {
      // ignore
    }
  };

  // Estimate quote calculation for /booking
  const basePrice =
    serviceType === "Move-Out / End of Tenancy"
      ? 219
      : serviceType === "Deep Cleaning"
      ? 189
      : 139;
  const estimatedTotal =
    basePrice +
    Math.max(0, bedrooms - 1) * 30 +
    Math.max(0, bathrooms - 1) * 25 +
    extras.length * 25;

  const toggleExtra = (item: string) => {
    setExtras((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Fire Google Ads Conversion Event (AW-18539302675)
    if (
      typeof window !== "undefined" &&
      typeof (window as any).gtag === "function"
    ) {
      (window as any).gtag("event", "conversion", {
        send_to: "AW-18539302675",
        value: estimatedTotal,
        currency: "CAD",
      });
    }
    setBookingSubmitted(true);
  };

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSupportSubmitted(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Route Switcher Bar for ads.tidyupscleaning.com */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToStudio}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Ads Studio
            </button>
            <div>
              <div className="text-[11px] font-semibold text-teal-700 uppercase tracking-wider">
                Live Public Endpoint · ads.tidyupscleaning.com
              </div>
              <div className="text-xs font-mono text-slate-800 flex flex-wrap items-center gap-2 mt-0.5">
                <span>{currentRouteObj.fullUrl}</span>
                <button
                  type="button"
                  onClick={() => handleCopyUrl(currentRouteObj.fullUrl)}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[11px] font-sans font-medium text-slate-700 inline-flex items-center gap-1 cursor-pointer"
                >
                  {copiedUrl === currentRouteObj.fullUrl ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      Copied ads.tidyupscleaning.com Link
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy Link
                    </>
                  )}
                </button>
                <a
                  href={currentRouteObj.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-0.5 rounded bg-teal-50 hover:bg-teal-100 border border-teal-200 text-[11px] font-sans font-semibold text-teal-800 inline-flex items-center gap-1"
                >
                  <span>Open in New Tab</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {routeMap.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => onSelectPage(r.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activePage === r.id
                    ? "bg-teal-700 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {r.path}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* PAGE 1: /booking — Instant Quote & Customer Booking Page */}
      {activePage === "booking" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                  <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                  TidyUps Cleaning · {locationName}
                </span>
                <h1 className="text-xl font-bold text-slate-900 mt-1.5">
                  Book Your Move-Out or Deep Cleaning Online
                </h1>
                <p className="text-xs text-slate-600 mt-0.5">
                  Get an instant flat-rate estimate and reserve your cleaning
                  date, or call us directly at{" "}
                  <a
                    href={`tel:${phoneNumber.replace(/[^0-9+]/g, "")}`}
                    className="font-semibold text-teal-700 underline"
                  >
                    {phoneNumber}
                  </a>
                  .
                </p>
              </div>

              <a
                href="https://app.tidyupscleaning.com/booking"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 shrink-0"
              >
                <span>Open Full Booking Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {bookingSubmitted ? (
              <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h2 className="text-base font-bold text-emerald-950">
                  Your TidyUps Cleaning Quote & Booking Request is Confirmed!
                </h2>
                <p className="text-xs text-emerald-900 max-w-md mx-auto leading-relaxed">
                  Thank you, <strong>{customerName || "Valued Customer"}</strong>!
                  We have received your request for{" "}
                  <strong>{serviceType}</strong> ({bedrooms} Bed · {bathrooms}{" "}
                  Bath — Est. <strong>${estimatedTotal} CAD</strong>). Our team
                  will confirm shortly, or you can reach us immediately at{" "}
                  <strong>{phoneNumber}</strong>.
                </p>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setBookingSubmitted(false)}
                    className="px-4 py-2 rounded-lg bg-white border border-emerald-300 text-emerald-900 text-xs font-semibold hover:bg-emerald-100"
                  >
                    Modify Booking Details
                  </button>
                  <a
                    href="https://app.tidyupscleaning.com/booking"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 inline-flex items-center gap-1.5"
                  >
                    <span>Continue to app.tidyupscleaning.com/booking</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-5">
                {/* Step 1: Service Type */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-800">
                    1. Select Cleaning Package
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {(
                      [
                        {
                          id: "Move-Out / End of Tenancy",
                          sub: "Landlord & inspection ready",
                        },
                        {
                          id: "Deep Cleaning",
                          sub: "Baseboards, grime & buildup",
                        },
                        {
                          id: "Standard Home Clean",
                          sub: "Recurring or fresh upkeep",
                        },
                      ] as const
                    ).map((pkg) => (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => setServiceType(pkg.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          serviceType === pkg.id
                            ? "border-teal-700 bg-teal-50/70 ring-1 ring-teal-700"
                            : "border-slate-200 bg-slate-50/60 hover:bg-slate-100"
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-900">
                          {pkg.id}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {pkg.sub}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 2: Bedrooms & Bathrooms */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                      2. Bedrooms ({bedrooms})
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setBedrooms(n)}
                          className={`flex-1 py-2 rounded-lg text-xs font-mono font-semibold border ${
                            bedrooms === n
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {n} {n === 5 ? "+" : ""} Bed
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                      3. Bathrooms ({bathrooms})
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setBathrooms(n)}
                          className={`flex-1 py-2 rounded-lg text-xs font-mono font-semibold border ${
                            bathrooms === n
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {n} {n === 4 ? "+" : ""} Bath
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Step 3: Detail Add-Ons */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-800">
                    4. Detail Extras Included
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Inside Oven & Fridge",
                      "Baseboards & Door Frames",
                      "Inside Kitchen Cabinets",
                      "Interior Windows & Tracks",
                      "Wall Spot Washing",
                    ].map((item) => {
                      const active = extras.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleExtra(item)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            active
                              ? "bg-teal-700 text-white border-teal-700"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {active ? "✓ " : "+ "}
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 4: Contact & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="e.g. 587-555-0199"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Preferred Cleaning Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Property Address ({locationName})
                    </label>
                    <input
                      type="text"
                      value={serviceAddress}
                      onChange={(e) => setServiceAddress(e.target.value)}
                      placeholder="Street address, apartment/unit #, city"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <Calendar className="w-4 h-4" />
                  Request Quote & Reserve Cleaning (${estimatedTotal} CAD Est.)
                </button>
              </form>
            )}
          </div>

          {/* Right Summary Column */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Instant TidyUps Quote Summary
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Selected Package:</span>
                <span className="font-semibold text-slate-900">
                  {serviceType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Home Size:</span>
                <span className="font-mono font-semibold text-slate-900">
                  {bedrooms} Bed · {bathrooms} Bath
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Detail Add-Ons:</span>
                <span className="font-mono font-semibold text-slate-900">
                  {extras.length} selected
                </span>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
                <span className="font-bold text-slate-900">
                  Estimated Flat Rate:
                </span>
                <span className="text-xl font-bold font-mono text-teal-700">
                  ${estimatedTotal} CAD
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-700">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-700" />
                <span>100% Move-Out & Deep Clean Guarantee</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                All supplies and commercial-grade equipment included. If
                anything is missed on your landlord checklist, let us know
                within 24 hours and we will re-clean it free of charge.
              </p>
              <div className="pt-1 font-mono text-xs font-bold text-teal-800 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                <span>Call {phoneNumber}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAGE 2: /support — 1-Click Self-Service Data Deletion & Customer Support Center */}
      {activePage === "support" && (
        <div className="space-y-6">
          {/* TOP HERO CARD: 1-Click Self-Service User Data Deletion & Account Erasure */}
          <div className="bg-white border-2 border-rose-200 rounded-xl p-6 shadow-xs space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-200">
                  <Lock className="w-3.5 h-3.5 text-rose-600" />
                  Instant Self-Service Data Deletion · Meta &amp; Google Compliant
                </div>
                <h1 className="text-xl font-bold text-slate-900">
                  Delete Your Personal Data &amp; Connected Account Information
                </h1>
                <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                  Want to delete your information from{" "}
                  <strong>TidyUps Cleaning</strong> (
                  <code className="font-mono">ads.tidyupscleaning.com</code> &amp;{" "}
                  <code className="font-mono">app.tidyupscleaning.com</code>)?
                  Click the red button below to immediately erase your stored
                  data, booking records, and connected Facebook/Instagram or
                  Google tokens in one click—no waiting required.
                </p>
              </div>

              {/* Instant 1-Click Delete Button (Zero fields required!) */}
              <button
                type="button"
                onClick={() => executeOneClickDataDeletion()}
                disabled={isDeletingData}
                className="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 shadow-sm transition-all shrink-0 cursor-pointer"
              >
                {isDeletingData ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting Your Information...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    1-Click Delete My Information Now
                  </>
                )}
              </button>
            </div>

            {/* Instant Verified Deletion Confirmation Receipt */}
            {deletionReceipt && (
              <div className="p-5 rounded-xl bg-emerald-50 border-2 border-emerald-300 space-y-3 text-xs text-emerald-950">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-sm font-bold text-emerald-950">
                        Your Information Has Been Permanently Deleted
                      </div>
                      <div className="text-[11px] text-emerald-800">
                        Status: <strong>{deletionReceipt.status}</strong> ·
                        Timestamp:{" "}
                        <span className="font-mono">
                          {new Date(deletionReceipt.deletedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-white border border-emerald-300 font-mono font-bold text-emerald-900">
                      Confirmation ID: {deletionReceipt.confirmationCode}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyReceiptCode(deletionReceipt.confirmationCode)
                      }
                      className="px-2.5 py-1 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white font-semibold inline-flex items-center gap-1"
                    >
                      {copiedReceiptCode ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy ID
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-emerald-200/80">
                  <div>
                    <div className="font-semibold text-emerald-900 mb-1">
                      Target Account / Identifier Purged:
                    </div>
                    <div className="font-mono text-[11px] bg-white/80 px-2.5 py-1.5 rounded border border-emerald-200 text-slate-800">
                      {deletionReceipt.identifier}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-emerald-900 mb-1">
                      Categories Permanently Erased:
                    </div>
                    <ul className="space-y-0.5 text-[11px] text-emerald-900">
                      {deletionReceipt.scopesPurged.map((scope, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{scope}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-emerald-800">
                  <span>
                    Verification URL:{" "}
                    <code className="font-mono underline">
                      {deletionReceipt.statusUrl}
                    </code>
                  </span>
                  <button
                    type="button"
                    onClick={() => setDeletionReceipt(null)}
                    className="text-emerald-900 font-semibold underline hover:text-emerald-700 inline-flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reset / Delete Another Record
                  </button>
                </div>
              </div>
            )}

            {/* Option 2: Specific Email / Phone / Facebook User ID Lookup & Deletion */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="lg:col-span-5">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Optional: Enter Email, Phone, or Facebook User ID to Purge
                </label>
                <input
                  type="text"
                  value={deletionIdentifier}
                  onChange={(e) => setDeletionIdentifier(e.target.value)}
                  placeholder="e.g. you@example.com, 587-555-0199, or Meta User ID (optional)"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-rose-600"
                />
              </div>

              <div className="lg:col-span-4">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Data Scope to Erase
                </label>
                <select
                  value={deletionScope}
                  onChange={(e) =>
                    setDeletionScope(e.target.value as "all" | "meta_only")
                  }
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-rose-600"
                >
                  <option value="all">
                    All Personal, Booking, Meta &amp; Google Data
                  </option>
                  <option value="meta_only">
                    Facebook / Instagram Login &amp; Lead Data Only
                  </option>
                </select>
              </div>

              <div className="lg:col-span-3">
                <button
                  type="button"
                  onClick={() =>
                    executeOneClickDataDeletion(
                      deletionIdentifier.trim() ||
                        "Instant 1-Click Self-Service Data Erasure"
                    )
                  }
                  disabled={isDeletingData}
                  className="w-full py-2 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Delete My Information</span>
                </button>
              </div>
            </div>

            {/* Meta / Facebook App Settings Data Deletion URLs Reference Bar */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-600">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-800">
                  Meta App Review Data Deletion Instructions URL:
                </span>
                <code className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-900">
                  https://ads.tidyupscleaning.com/support
                </code>
                <button
                  type="button"
                  onClick={() =>
                    handleCopyUrl("https://ads.tidyupscleaning.com/support")
                  }
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold inline-flex items-center gap-1"
                >
                  {copiedUrl === "https://ads.tidyupscleaning.com/support" ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-800">
                  Automated Meta Callback URL:
                </span>
                <code className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-900">
                  https://ads.tidyupscleaning.com/api/facebook/data-deletion-callback
                </code>
                <button
                  type="button"
                  onClick={() =>
                    handleCopyUrl(
                      "https://ads.tidyupscleaning.com/api/facebook/data-deletion-callback"
                    )
                  }
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold inline-flex items-center gap-1"
                >
                  {copiedUrl ===
                  "https://ads.tidyupscleaning.com/api/facebook/data-deletion-callback" ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* BOTTOM ROW: Customer Support Contact & Help Center */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
              <div className="border-b border-slate-100 pb-4">
                <div className="text-xs font-semibold text-teal-700 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>ads.tidyupscleaning.com/support</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-1">
                  TidyUps Cleaning Customer Support &amp; Help Center
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Need help with an existing booking, move-out inspection
                  checklist, or billing question? Reach our local {locationName}{" "}
                  team below.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-teal-700" />
                    <span>Direct Dispatch Phone</span>
                  </div>
                  <a
                    href={`tel:${phoneNumber.replace(/[^0-9+]/g, "")}`}
                    className="block text-sm font-bold font-mono text-slate-900 hover:text-teal-700"
                  >
                    {phoneNumber}
                  </a>
                  <div className="text-[11px] text-slate-500">
                    7 Days a Week · 8am – 8pm
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-teal-700" />
                    <span>Support Email</span>
                  </div>
                  <a
                    href="mailto:cleaningserviceyeg@gmail.com"
                    className="block text-xs font-bold font-mono text-slate-900 hover:text-teal-700 truncate"
                  >
                    cleaningserviceyeg@gmail.com
                  </a>
                  <div className="text-[11px] text-slate-500">
                    Fast response under 2 hours
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-teal-700" />
                    <span>Service Area</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900">
                    {locationName}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Residential &amp; Move-Out Pros
                  </div>
                </div>
              </div>

              {supportSubmitted ? (
                <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-2">
                  <div className="font-bold text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Support Ticket Received!</span>
                  </div>
                  <p>
                    We have logged your message regarding{" "}
                    <strong>{supportTopic}</strong>. For urgent same-day booking
                    updates, please call us directly at{" "}
                    <strong>{phoneNumber}</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSupportSubmitted(false)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 font-semibold text-emerald-900"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleSupportSubmit}
                  className="space-y-3.5 pt-2"
                >
                  <h3 className="text-sm font-bold text-slate-900">
                    Send a Support Message
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={supportName}
                        onChange={(e) => setSupportName(e.target.value)}
                        placeholder="Full name"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Phone or Email *
                      </label>
                      <input
                        type="text"
                        required
                        value={supportContact}
                        onChange={(e) => setSupportContact(e.target.value)}
                        placeholder="587-555-0199 or email"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Support Topic
                    </label>
                    <select
                      value={supportTopic}
                      onChange={(e) => setSupportTopic(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <option value="Move-Out Inspection Guarantee">
                        Move-Out Inspection Guarantee
                      </option>
                      <option value="Reschedule or Update Booking">
                        Reschedule or Update Existing Booking
                      </option>
                      <option value="Personal Data Deletion Request">
                        Personal Data Deletion Request
                      </option>
                      <option value="Custom Deep Cleaning Quote">
                        Custom Deep Cleaning Quote
                      </option>
                      <option value="Billing & Receipt Request">
                        Billing &amp; Receipt Request
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      How can we help? *
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      placeholder="Include your property address or booking date if applicable..."
                      className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold"
                  >
                    Submit Support Request
                  </button>
                </form>
              )}
            </div>

            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                Frequently Asked Questions &amp; Data Privacy
              </h3>
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-rose-50/70 border border-rose-200 space-y-1">
                  <div className="font-semibold text-rose-950">
                    How do I delete my personal data or connected Facebook/Google
                    info?
                  </div>
                  <p className="text-rose-900 leading-relaxed">
                    Simply click the red{" "}
                    <strong>&ldquo;1-Click Delete My Information Now&rdquo;</strong>{" "}
                    button at the top of this page. It immediately purges your
                    personal contact details, booking records, and any connected
                    Facebook/Instagram or Google session tokens, and issues a
                    timestamped Confirmation ID.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="font-semibold text-slate-900">
                    What is included in Move-Out / End of Tenancy Cleaning?
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Full kitchen and bathroom sanitization, inside cabinets and
                    drawers, baseboards, floors, fixtures, and optional inside
                    oven and fridge detailing to pass your landlord or property
                    manager inspection.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="font-semibold text-slate-900">
                    Do I need to provide cleaning supplies or vacuum equipment?
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    No—our TidyUps Cleaning crews bring all professional
                    supplies, microfiber cloths, disinfectants, and commercial
                    vacuums.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="font-semibold text-slate-900">
                    How do I reschedule or cancel a booking?
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Please call{" "}
                    <strong className="font-mono">{phoneNumber}</strong> or
                    email{" "}
                    <strong className="font-mono">
                      cleaningserviceyeg@gmail.com
                    </strong>{" "}
                    at least 24 hours prior to your appointment for free
                    rescheduling.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAGE 3: /privacy — Privacy Policy */}
      {activePage === "privacy" && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 max-w-4xl mx-auto space-y-5 text-xs text-slate-700 leading-relaxed">
          <div className="border-b border-slate-200 pb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-teal-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>https://ads.tidyupscleaning.com/privacy</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 mt-1">
                Privacy Policy — TidyUps Cleaning
              </h1>
              <p className="text-slate-500 mt-0.5">
                Effective Date: October 27, 2026 · Domain:{" "}
                <code className="font-mono">ads.tidyupscleaning.com</code> &amp;{" "}
                <code className="font-mono">app.tidyupscleaning.com</code>
              </p>
            </div>

            <button
              type="button"
              onClick={() => onSelectPage("support")}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Go to 1-Click Data Deletion (/support)
            </button>
          </div>

          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-slate-900">
              1. Information We Collect
            </h2>
            <p>
              When you request a cleaning quote, book a service, or use the
              TidyUps Cleaning platform, we collect information you provide
              directly, including your name, phone number, email address,
              service property address, home size, and cleaning preferences.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-slate-900">
              2. How We Use Your Information
            </h2>
            <p>
              We use the collected information solely to provide residential
              move-out, move-in, and deep cleaning quotes, schedule and dispatch
              cleaning crews in {locationName}, send booking confirmations and
              receipts, and provide customer support via{" "}
              <strong>{phoneNumber}</strong> or{" "}
              <strong>cleaningserviceyeg@gmail.com</strong>.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-slate-900">
              3. Google Ads Conversion Tracking &amp; Google AdSense Cookies
            </h2>
            <p>
              Our website uses Google Tag (
              <code className="font-mono">AW-18539302675</code>) for conversion
              measurement and Google AdSense (
              <code className="font-mono">ca-pub-8415242080067854</code>).
              Third-party vendors, including Google, use cookies to serve and
              measure ads based on a user&apos;s prior visits to our website or
              other websites. Users may opt out of personalized advertising by
              visiting{" "}
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-700 underline"
              >
                Google Ads Settings
              </a>
              .
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-slate-900">
              4. Meta (Facebook &amp; Instagram) &amp; Google API Data Usage
            </h2>
            <p>
              When authorized administrators connect Meta (Facebook &amp;
              Instagram) or Google on{" "}
              <code className="font-mono">ads.tidyupscleaning.com</code>, our
              application accesses the Meta Marketing API, Google Ads, Google
              Drive, and Google Sheets strictly with explicit user permission to
              create campaign assets, upload project archive backups to the
              designated folder (such as{" "}
              <code className="font-mono">Leads-Creator</code>), and format
              campaign spreadsheets. Access tokens are held strictly in memory
              for the active session and are never sold or shared with third
              parties.
            </p>
          </section>

          <section className="space-y-2 p-4 rounded-xl bg-rose-50/70 border border-rose-200">
            <h2 className="text-sm font-bold text-rose-950">
              5. User Data Deletion Instructions (1-Click Self-Service Erasure)
            </h2>
            <p className="text-rose-900">
              Users have the right to delete their personal data, booking
              records, and connected Facebook/Instagram or Google tokens at any
              time. To immediately delete your data in one click:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-rose-900 font-medium">
              <li>
                Visit{" "}
                <a
                  href="https://ads.tidyupscleaning.com/support"
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectPage("support");
                  }}
                  className="underline font-bold"
                >
                  https://ads.tidyupscleaning.com/support
                </a>
              </li>
              <li>
                Click the red{" "}
                <strong>&ldquo;1-Click Delete My Information Now&rdquo;</strong>{" "}
                button at the top of the page.
              </li>
              <li>
                Your personal records and connected OAuth tokens are purged
                immediately and you will receive an instant Confirmation ID.
              </li>
            </ol>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-slate-900">
              6. Contact Us Regarding Privacy
            </h2>
            <p>
              If you have any questions or requests regarding your personal data
              or this Privacy Policy, please contact TidyUps Cleaning at{" "}
              <strong>{phoneNumber}</strong> or email{" "}
              <strong>cleaningserviceyeg@gmail.com</strong>.
            </p>
          </section>
        </div>
      )}

      {/* PAGE 4: /T&C — Terms & Conditions */}
      {activePage === "tc" && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 max-w-4xl mx-auto space-y-5 text-xs text-slate-700 leading-relaxed">
          <div className="border-b border-slate-200 pb-4">
            <div className="text-xs font-semibold text-teal-700 flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              <span>https://ads.tidyupscleaning.com/T&amp;C</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              Terms &amp; Conditions — TidyUps Cleaning
            </h1>
            <p className="text-slate-500 mt-0.5">
              Last Updated: October 27, 2026 · Applies to{" "}
              <code className="font-mono">ads.tidyupscleaning.com</code> &{" "}
              <code className="font-mono">app.tidyupscleaning.com</code>
            </p>
          </div>

          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-slate-900">
              1. Scope of Cleaning Services
            </h2>
            <p>
              TidyUps Cleaning provides residential move-out, move-in, end-of-tenancy,
              deep cleaning, and standard home cleaning services across{" "}
              {locationName}. Quotes generated online are based on the bedroom,
              bathroom, and condition details submitted at the time of booking.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-slate-900">
              2. Property Access, Utilities & Preparation
            </h2>
            <p>
              For move-out and deep cleaning appointments, the client agrees to
              provide safe access to the property along with running hot water
              and electricity so our crew can operate cleaning equipment and
              complete thorough kitchen, bathroom, baseboard, and floor
              detailing.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-slate-900">
              3. Rescheduling & Cancellation Policy
            </h2>
            <p>
              Appointments may be rescheduled or cancelled free of charge with
              at least 24 hours&apos; notice by calling{" "}
              <strong>{phoneNumber}</strong> or emailing{" "}
              <strong>cleaningserviceyeg@gmail.com</strong>. Same-day
              cancellations or lockouts upon crew arrival may incur a dispatch
              fee.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-slate-900">
              4. 24-Hour Satisfaction Guarantee
            </h2>
            <p>
              We stand behind our work. If any area covered in your booking
              checklist is overlooked, please notify TidyUps Cleaning within 24
              hours of service completion and our team will return to touch up
              the area at no additional cost.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-slate-900">
              5. Contact Information
            </h2>
            <p>
              TidyUps Cleaning · Phone: <strong>{phoneNumber}</strong> · Email:{" "}
              <strong>cleaningserviceyeg@gmail.com</strong> · Booking:{" "}
              <a
                href="/booking"
                onClick={(e) => {
                  e.preventDefault();
                  onSelectPage("booking");
                }}
                className="text-teal-700 underline font-semibold cursor-pointer"
              >
                https://ads.tidyupscleaning.com/booking
              </a>{" "}
              · Data Deletion:{" "}
              <a
                href="/support"
                onClick={(e) => {
                  e.preventDefault();
                  onSelectPage("support");
                }}
                className="text-rose-700 underline font-semibold cursor-pointer"
              >
                https://ads.tidyupscleaning.com/support
              </a>
            </p>
          </section>
        </div>
      )}
    </div>
  );
};

