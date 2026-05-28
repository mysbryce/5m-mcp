#requires -version 5
<#
.SYNOPSIS
  Create a `.agents` symlink that points at `.claude`, so non-Claude agent
  runtimes (Codex, Cursor, ...) pick up the same skills / settings / commands.

.DESCRIPTION
  `.agents` is gitignored, so each clone re-creates the link with this script:
      pwsh scripts/claude-link.ps1
  Idempotent: if `.agents` is already the symlink, it just reports and exits 0.
  Creating a directory symlink on Windows needs Developer Mode or an elevated shell.
#>
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$source = Join-Path $repoRoot '.claude'
$link = Join-Path $repoRoot '.agents'

if (-not (Test-Path -LiteralPath $source)) {
  Write-Error ".claude not found at $source"
  exit 1
}

if (Test-Path -LiteralPath $link) {
  $item = Get-Item -LiteralPath $link -Force
  if ($item.LinkType -eq 'SymbolicLink') {
    Write-Host ".agents already linked -> $($item.Target)" -ForegroundColor Green
    exit 0
  }
  Write-Error ".agents exists and is not a symlink - remove it first."
  exit 1
}

# Relative target so the link stays valid no matter where the repo is cloned.
New-Item -ItemType SymbolicLink -Path $link -Target '.claude' | Out-Null
Write-Host "Linked .agents -> .claude" -ForegroundColor Green
