import React, { useState, useEffect } from "react";
import {
  GitBranch,
  GitCommit,
  GitPullRequest,
  Check,
  AlertCircle,
  ExternalLink,
  Copy,
  RefreshCw,
  Loader2,
  FolderGit2,
  Lock,
  Globe,
  UploadCloud,
  CheckCircle2,
  Terminal,
  ShieldCheck,
  Trash2,
  ArrowRight,
  Eye,
  EyeOff,
  Code,
  Sparkles,
} from "lucide-react";

interface GitStatusResponse {
  success: boolean;
  isGitRepo: boolean;
  branch: string;
  commitCount: number;
  lastCommit: {
    hash: string;
    author: string;
    date: string;
    message: string;
  } | null;
  recentCommits: Array<{
    hash: string;
    author: string;
    date: string;
    message: string;
  }>;
  remoteUrl: string;
  hasRemote: boolean;
  repoWebUrl: string | null;
  isDirty: boolean;
  dirtyFiles: string[];
  connectedUser: {
    login: string;
    name?: string;
    avatar_url?: string;
    html_url?: string;
    public_repos?: number;
  } | null;
  connectedRepo: {
    owner: string;
    name: string;
  } | null;
  lastSyncedAt: string | null;
}

interface GitHubRepoItem {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  default_branch: string;
  description: string | null;
}

export const GitHubSyncStudio: React.FC<{
  onClose?: () => void;
}> = ({ onClose }) => {
  const [status, setStatus] = useState<GitStatusResponse | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Auth & Token State
  const [tokenInput, setTokenInput] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [isTestingToken, setIsTestingToken] = useState(false);
  const [tokenFeedback, setTokenFeedback] = useState<string | null>(null);

  // Active Connection Mode Tab
  const [connectionMode, setConnectionMode] = useState<"token" | "manual">("token");

  // Repo Creation & Selection
  const [newRepoName, setNewRepoName] = useState("tidyups-cleaning-google-ads");
  const [newRepoDesc, setNewRepoDesc] = useState(
    "TidyUps Cleaning Google Ads Responsive Search Ad (RSA) Studio, Facebook Ads & Campaign Exports"
  );
  const [isPrivateRepo, setIsPrivateRepo] = useState(false);
  const [isCreatingRepo, setIsCreatingRepo] = useState(false);
  const [userRepos, setUserRepos] = useState<GitHubRepoItem[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [selectedExistingRepo, setSelectedExistingRepo] = useState("");

  // Manual Remote
  const [manualRemoteUrl, setManualRemoteUrl] = useState("");
  const [isSavingManualRemote, setIsSavingManualRemote] = useState(false);

  // Commit & Push
  const [commitMessage, setCommitMessage] = useState(
    "feat: sync TidyUps Google & Meta Ads campaigns to GitHub"
  );
  const [isPushing, setIsPushing] = useState(false);
  const [pushResult, setPushResult] = useState<{
    success: boolean;
    message: string;
    hash?: string;
  } | null>(null);

  // Disconnect
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Copied states
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Fetch status
  const fetchStatus = async () => {
    setIsLoadingStatus(true);
    setStatusError(null);
    try {
      const res = await fetch("/api/github/status");
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to load Git status");
      }
      setStatus(data);
      if (data.remoteUrl && !manualRemoteUrl) {
        setManualRemoteUrl(data.remoteUrl);
      }
    } catch (err: any) {
      setStatusError(err.message || "Failed to load git status");
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Fetch user repos if user profile exists
  const fetchUserRepos = async (token?: string) => {
    setIsLoadingRepos(true);
    try {
      const res = await fetch("/api/github/list-user-repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token || tokenInput }),
      });
      const data = await res.json();
      if (res.ok && data.repos) {
        setUserRepos(data.repos);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingRepos(false);
    }
  };

  // Handle Token Authentication
  const handleTestToken = async () => {
    if (!tokenInput.trim()) {
      setTokenFeedback("Please paste your GitHub Personal Access Token.");
      return;
    }
    setIsTestingToken(true);
    setTokenFeedback(null);
    try {
      const res = await fetch("/api/github/test-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Invalid GitHub token.");
      }
      setTokenFeedback(`Authenticated successfully as @${data.user.login}!`);
      await fetchStatus();
      await fetchUserRepos(tokenInput.trim());
    } catch (err: any) {
      setTokenFeedback(`Error: ${err.message}`);
    } finally {
      setIsTestingToken(false);
    }
  };

  // Handle 1-Click Create Repository & Connect
  const handleCreateAndConnectRepo = async () => {
    setIsCreatingRepo(true);
    setStatusError(null);
    try {
      const res = await fetch("/api/github/create-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: tokenInput.trim(),
          name: newRepoName.trim(),
          description: newRepoDesc.trim(),
          isPrivate: isPrivateRepo,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to create GitHub repository.");
      }

      // Connect git remote to the newly created repo
      const owner = data.repo.owner?.login || status?.connectedUser?.login;
      const connectRes = await fetch("/api/github/connect-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: tokenInput.trim(),
          repoOwner: owner,
          repoName: data.repo.name,
        }),
      });

      const connectData = await connectRes.json();
      if (!connectRes.ok || connectData.error) {
        throw new Error(connectData.error || "Failed to configure Git remote.");
      }

      await fetchStatus();
    } catch (err: any) {
      setStatusError(err.message || "Failed to create repository");
    } finally {
      setIsCreatingRepo(false);
    }
  };

  // Handle Connect to Selected Existing Repo
  const handleConnectExistingRepo = async () => {
    if (!selectedExistingRepo) return;
    const [owner, name] = selectedExistingRepo.split("/");
    setIsCreatingRepo(true);
    setStatusError(null);
    try {
      const res = await fetch("/api/github/connect-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: tokenInput.trim(),
          repoOwner: owner,
          repoName: name,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to connect repository");
      }
      await fetchStatus();
    } catch (err: any) {
      setStatusError(err.message || "Failed to connect repository");
    } finally {
      setIsCreatingRepo(false);
    }
  };

  // Handle Manual Remote URL
  const handleSaveManualRemote = async () => {
    if (!manualRemoteUrl.trim()) return;
    setIsSavingManualRemote(true);
    setStatusError(null);
    try {
      const res = await fetch("/api/github/connect-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manualRemoteUrl: manualRemoteUrl.trim(),
          token: tokenInput.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to set git remote");
      }
      await fetchStatus();
    } catch (err: any) {
      setStatusError(err.message || "Failed to save remote URL");
    } finally {
      setIsSavingManualRemote(false);
    }
  };

  // Handle Push to GitHub
  const handlePushToGitHub = async () => {
    setIsPushing(true);
    setPushResult(null);
    try {
      const res = await fetch("/api/github/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commitMessage: commitMessage.trim() || "feat: update TidyUps Google & Meta Ads campaigns",
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Git push failed.");
      }
      setPushResult({
        success: true,
        message: `Successfully pushed to branch ${status?.branch || "main"}! Commit: ${data.lastCommitHash || ""}`,
        hash: data.lastCommitHash,
      });
      await fetchStatus();
    } catch (err: any) {
      setPushResult({
        success: false,
        message: err.message || "Push failed. Check write permissions on your token.",
      });
    } finally {
      setIsPushing(false);
    }
  };

  // Handle Disconnect
  const handleDisconnect = async () => {
    if (!window.confirm("Are you sure you want to disconnect this GitHub repository?")) return;
    setIsDisconnecting(true);
    try {
      await fetch("/api/github/disconnect", { method: "POST" });
      await fetchStatus();
    } catch {
      // ignore
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
              <FolderGit2 className="w-8 h-8 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                  Git Version Control
                </span>
                {status?.hasRemote ? (
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Remote Connected
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Local Only · Connect Remote
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-black text-white mt-1 tracking-tight">
                Connect GitHub &amp; Continuous Sync
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Keep your complete TidyUps Google Ads campaigns, SERP simulator, Meta marketing exports, and React codebase synchronized with your GitHub repository.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchStatus}
              disabled={isLoadingStatus}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white transition-all flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStatus ? "animate-spin" : ""}`} />
              Refresh Status
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Branch */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400">Current Branch</div>
            <div className="text-sm font-bold text-white font-mono">{status?.branch || "main"}</div>
          </div>
        </div>

        {/* Total Commits */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
            <GitCommit className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400">Total Commits</div>
            <div className="text-sm font-bold text-white font-mono">{status?.commitCount ?? 1} commits</div>
          </div>
        </div>

        {/* Working Directory */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400">Working Tree</div>
            <div className="text-sm font-bold text-white">
              {status?.isDirty ? (
                <span className="text-amber-400">{status.dirtyFiles.length} modified files</span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Clean (Committed)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Connected GitHub User */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10 flex items-center gap-3">
          {status?.connectedUser?.avatar_url ? (
            <img
              src={status.connectedUser.avatar_url}
              alt={status.connectedUser.login}
              className="w-10 h-10 rounded-full border border-white/20"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Globe className="w-5 h-5" />
            </div>
          )}
          <div className="overflow-hidden">
            <div className="text-[11px] font-medium text-slate-400">GitHub Account</div>
            <div className="text-sm font-bold text-white truncate">
              {status?.connectedUser?.login ? (
                <a
                  href={status.connectedUser.html_url || `https://github.com/${status.connectedUser.login}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline text-indigo-300"
                >
                  @{status.connectedUser.login}
                </a>
              ) : (
                <span className="text-slate-500">Not connected</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Connected Remote Banner (If Connected) */}
      {status?.hasRemote && (
        <div className="p-5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-emerald-300 font-semibold uppercase tracking-wider">
                Remote Origin Configured
              </div>
              <div className="text-sm font-mono text-white mt-0.5 break-all">
                {status.remoteUrl}
              </div>
              {status.lastSyncedAt && (
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Last pushed: {new Date(status.lastSyncedAt).toLocaleString()}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {status.repoWebUrl && (
              <a
                href={status.repoWebUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 inline-flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View on GitHub
              </a>
            )}
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-colors inline-flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Disconnect
            </button>
          </div>
        </div>
      )}

      {/* Main Connection & Push Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Connection & Repository Setup */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-white/10 shadow-lg">
            {/* Tab Mode Selector */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-indigo-400" />
                Connect GitHub Repository
              </h3>

              <div className="flex items-center gap-1 p-1 bg-white/5 rounded-lg border border-white/10">
                <button
                  type="button"
                  onClick={() => setConnectionMode("token")}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    connectionMode === "token"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Personal Access Token (PAT)
                </button>
                <button
                  type="button"
                  onClick={() => setConnectionMode("manual")}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    connectionMode === "manual"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Manual Remote / CLI
                </button>
              </div>
            </div>

            {connectionMode === "token" ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-indigo-400" />
                      GitHub Personal Access Token (Classic or Fine-Grained)
                    </label>
                    <a
                      href="https://github.com/settings/tokens/new?scopes=repo&description=TidyUps+Ads+Studio"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-indigo-400 hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      Generate New Token on GitHub
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="relative">
                    <input
                      type={showToken ? "text" : "password"}
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full pl-3 pr-24 py-2.5 text-xs font-mono rounded-xl bg-black/40 border border-white/15 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                    <div className="absolute right-2 top-2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="p-1 rounded-md text-slate-400 hover:text-white"
                      >
                        {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={handleTestToken}
                        disabled={isTestingToken || !tokenInput.trim()}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-all flex items-center gap-1"
                      >
                        {isTestingToken ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                        Verify
                      </button>
                    </div>
                  </div>

                  {tokenFeedback && (
                    <div
                      className={`mt-2 p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                        tokenFeedback.startsWith("Authenticated")
                          ? "bg-emerald-950/40 text-emerald-300 border border-emerald-500/30"
                          : "bg-red-950/40 text-red-300 border border-red-500/30"
                      }`}
                    >
                      {tokenFeedback.startsWith("Authenticated") ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0" />
                      )}
                      <span>{tokenFeedback}</span>
                    </div>
                  )}

                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Requires <code className="text-indigo-300 font-mono">repo</code> scope to allow creating repositories and pushing code commits. Tokens are stored securely in local app configuration.
                  </p>
                </div>

                {/* Sub-section: Create or Select Repository */}
                <div className="pt-4 border-t border-white/10 space-y-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Repository Target
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-white">
                        Create New Repository on GitHub
                      </div>
                      <span className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        Recommended
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">
                          Repository Name
                        </label>
                        <input
                          type="text"
                          value={newRepoName}
                          onChange={(e) => setNewRepoName(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs font-mono rounded-lg bg-black/50 border border-white/15 text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">
                          Visibility
                        </label>
                        <select
                          value={isPrivateRepo ? "private" : "public"}
                          onChange={(e) => setIsPrivateRepo(e.target.value === "private")}
                          className="w-full px-3 py-1.5 text-xs rounded-lg bg-black/50 border border-white/15 text-white focus:outline-none focus:border-indigo-500"
                        >
                          <option value="public">Public Repository</option>
                          <option value="private">Private Repository</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={newRepoDesc}
                        onChange={(e) => setNewRepoDesc(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-black/50 border border-white/15 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleCreateAndConnectRepo}
                      disabled={isCreatingRepo || !newRepoName.trim()}
                      className="w-full py-2 px-3 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30"
                    >
                      {isCreatingRepo ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Creating &amp; Configuring Remote...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          Create &amp; Connect Repository
                        </>
                      )}
                    </button>
                  </div>

                  {/* Or select existing repository */}
                  {userRepos.length > 0 && (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                      <div className="text-xs font-semibold text-white">
                        Or Connect Existing Repository
                      </div>
                      <div className="flex gap-2">
                        <select
                          value={selectedExistingRepo}
                          onChange={(e) => setSelectedExistingRepo(e.target.value)}
                          className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-black/50 border border-white/15 text-white focus:outline-none focus:border-indigo-500"
                        >
                          <option value="">Select a repository...</option>
                          {userRepos.map((repo) => (
                            <option key={repo.id} value={repo.full_name}>
                              {repo.full_name} {repo.private ? "(Private)" : ""}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={handleConnectExistingRepo}
                          disabled={!selectedExistingRepo || isCreatingRepo}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white"
                        >
                          Connect
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Manual Mode */
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Existing GitHub Remote URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualRemoteUrl}
                      onChange={(e) => setManualRemoteUrl(e.target.value)}
                      placeholder="https://github.com/USERNAME/tidyups-cleaning-google-ads.git"
                      className="flex-1 px-3 py-2 text-xs font-mono rounded-xl bg-black/40 border border-white/15 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleSaveManualRemote}
                      disabled={isSavingManualRemote || !manualRemoteUrl.trim()}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-all shrink-0"
                    >
                      {isSavingManualRemote ? <Loader2 className="w-4 h-4 animate-spin" /> : "Set Remote"}
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                      Terminal CLI Instructions
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          "cli_commands",
                          `git remote add origin ${manualRemoteUrl || "https://github.com/YOUR_USERNAME/tidyups-cleaning-google-ads.git"}\ngit branch -M main\ngit push -u origin main`
                        )
                      }
                      className="text-[11px] text-indigo-300 hover:underline flex items-center gap-1"
                    >
                      {copiedKey === "cli_commands" ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copy All
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono text-emerald-300/90 bg-black/80 p-3 rounded-lg overflow-x-auto whitespace-pre leading-relaxed border border-white/5">
{`# 1. Add your GitHub remote origin
git remote add origin ${manualRemoteUrl || "https://github.com/YOUR_USERNAME/tidyups-cleaning-google-ads.git"}

# 2. Ensure main branch
git branch -M main

# 3. Push initial project to GitHub
git push -u origin main`}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Push & Version History */}
        <div className="lg:col-span-5 space-y-6">
          {/* Commit & Push Card */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-white/10 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-emerald-400" />
              Commit &amp; Push to GitHub
            </h3>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Commit Message
              </label>
              <textarea
                rows={2}
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Describe your updates..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/15 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none font-mono"
              />
            </div>

            <button
              type="button"
              onClick={handlePushToGitHub}
              disabled={isPushing || !status?.hasRemote}
              className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40"
            >
              {isPushing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Staging, Committing &amp; Pushing to GitHub...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  Push to GitHub ({status?.branch || "main"})
                </>
              )}
            </button>

            {!status?.hasRemote && (
              <p className="text-[11px] text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Configure a remote repository on the left before pushing.
              </p>
            )}

            {pushResult && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  pushResult.success
                    ? "bg-emerald-950/40 text-emerald-300 border border-emerald-500/30"
                    : "bg-red-950/40 text-red-300 border border-red-500/30"
                }`}
              >
                {pushResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold">{pushResult.message}</div>
                  {pushResult.hash && (
                    <div className="text-[11px] font-mono mt-0.5 text-emerald-400">
                      Commit SHA: {pushResult.hash}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Recent Git Log */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-white/10 shadow-lg space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <GitCommit className="w-3.5 h-3.5 text-indigo-400" />
              Recent Commits in Project
            </h4>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {status?.recentCommits && status.recentCommits.length > 0 ? (
                status.recentCommits.map((c, i) => (
                  <div
                    key={c.hash || i}
                    className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono text-indigo-300 font-bold">{c.hash}</span>
                      <span className="text-slate-500">{c.date}</span>
                    </div>
                    <div className="text-white font-medium line-clamp-1">{c.message}</div>
                    <div className="text-[10px] text-slate-400">{c.author}</div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 italic p-2">No commit history found.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
