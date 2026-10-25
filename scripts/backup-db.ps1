# Manual backup of a Supabase project (schema, data, roles). Requires Docker Desktop running.
# Usage: .\scripts\backup-db.ps1 [-ProjectRef dbxfqxewaavrmjtnewjm] [-Keep 14]
param(
  [string]$ProjectRef = 'dbxfqxewaavrmjtnewjm',
  [int]$Keep = 14
)

$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$dir = Join-Path 'backups' "$ProjectRef-$stamp"
New-Item -ItemType Directory -Force $dir | Out-Null

$jobs = @(
  @{ file = 'schema.sql'; args = @() },
  @{ file = 'data.sql';   args = @('--data-only', '--use-copy') },
  @{ file = 'roles.sql';  args = @('--role-only') }
)

foreach ($j in $jobs) {
  $out = Join-Path $dir $j.file
  $ErrorActionPreference = 'Continue' # the CLI writes progress to stderr
  & npx --no-install supabase db dump --linked --project-ref $ProjectRef -f $out @($j.args) 2>&1 | Out-Null
  $ErrorActionPreference = 'Stop'
  if (-not (Test-Path $out) -or (Get-Item $out).Length -eq 0) {
    throw "Backup failed: $($j.file) is missing or empty"
  }
  Write-Host ("OK  {0} ({1:N0} bytes)" -f $j.file, (Get-Item $out).Length)
}

# Prune older backups of this project
Get-ChildItem backups -Directory -Filter "$ProjectRef-*" |
  Sort-Object Name -Descending | Select-Object -Skip $Keep |
  Remove-Item -Recurse -Force

Write-Host "Backup written to $dir"
