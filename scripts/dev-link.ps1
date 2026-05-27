<#
.SYNOPSIS
  Junction-link this repo into a FiveM server's resources/[agent] folder.
  Uses NTFS junctions (no admin required).

.EXAMPLE
  pwsh -File scripts/dev-link.ps1 -ServerRoot "D:\Sure\txData\ESXLegacy_004D5F.base"
#>
param(
  [Parameter(Mandatory = $true)][string]$ServerRoot,
  [string]$Category = '[agent]',
  [string]$Name = 'agent_api'
)

$ErrorActionPreference = 'Stop'

$source = (Resolve-Path "$PSScriptRoot/..").Path
$target = Join-Path $ServerRoot "resources/$Category/$Name"
$parent = Split-Path -Parent $target

if (-not (Test-Path $parent)) {
  New-Item -ItemType Directory -Path $parent | Out-Null
}

if (Test-Path $target) {
  $item = Get-Item $target -Force
  if ($item.LinkType -eq 'SymbolicLink' -or $item.LinkType -eq 'Junction') {
    Write-Host "Replacing existing link at $target"
    Remove-Item $target -Force
  } else {
    throw "Target exists and is not a symlink: $target"
  }
}

New-Item -ItemType Junction -Path $target -Target $source | Out-Null
Write-Host "Linked $target -> $source"
Write-Host "Now run in FiveM console:  refresh; ensure $Name"
