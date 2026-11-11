# Manual backup of a Supabase project (schema, data, roles). Requires Docker Desktop running.
# Usage: .\scripts\backup-db.ps1 [-ProjectRef dbxfqxewaavrmjtnewjm] [-Keep 14]
# Optional B2 upload: add -RcloneRemote 'b2:bucket-name' -AgeRecipient 'age1...'
param(
  [string]$ProjectRef = 'dbxfqxewaavrmjtnewjm',
  [int]$Keep = 14,
  [string]$RcloneRemote = '',
  [string]$AgeRecipient = '',
  [switch]$TestNotification
)

function Send-BackupFailureNotification {
  param([switch]$Test)

  $dsn = $env:VITE_SENTRY_DSN
  if ([string]::IsNullOrWhiteSpace($dsn)) {
    $envFile = Join-Path $PSScriptRoot '..\.env.local'
    if (Test-Path -LiteralPath $envFile) {
      $dsnLine = Get-Content -LiteralPath $envFile |
        Where-Object { $_ -match '^\s*VITE_SENTRY_DSN\s*=' } |
        Select-Object -First 1
      if ($dsnLine -match '^\s*VITE_SENTRY_DSN\s*=\s*(.*?)\s*$') {
        $dsn = $Matches[1].Trim().Trim('"').Trim("'")
      }
    }
  }
  if ([string]::IsNullOrWhiteSpace($dsn)) {
    throw 'Sentry notification is not configured; set VITE_SENTRY_DSN or add it to the project .env.local file.'
  }

  try {
    $dsnUri = [Uri]$dsn
  } catch {
    throw 'Sentry notification is not configured; VITE_SENTRY_DSN is not a valid URL.'
  }
  if ($dsnUri.Scheme -notin @('http', 'https') -or
      [string]::IsNullOrWhiteSpace($dsnUri.UserInfo) -or
      [string]::IsNullOrWhiteSpace($dsnUri.AbsolutePath.Trim('/'))) {
    throw 'Sentry notification is not configured; VITE_SENTRY_DSN is missing required project information.'
  }

  $pathParts = @($dsnUri.AbsolutePath.Trim('/').Split('/'))
  $projectId = $pathParts[-1]
  if ($projectId -notmatch '^[A-Za-z0-9_-]+$') {
    throw 'Sentry notification is not configured; the project identifier in VITE_SENTRY_DSN is invalid.'
  }
  $pathPrefix = ''
  if ($pathParts.Count -gt 1) {
    $pathPrefix = $pathParts[0..($pathParts.Count - 2)] -join '/'
  }
  $envelopePath = if ($pathPrefix) {
    "/$pathPrefix/api/$projectId/envelope/"
  } else {
    "/api/$projectId/envelope/"
  }
  $endpoint = [UriBuilder]::new($dsnUri.Scheme, $dsnUri.Host, $dsnUri.Port, $envelopePath).Uri

  $eventId = [Guid]::NewGuid().ToString('N')
  $event = [ordered]@{
    event_id   = $eventId
    fingerprint = @('workforceai-backup', $eventId)
    timestamp  = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    platform   = 'other'
    level      = 'fatal'
    environment = 'production'
    logger     = 'workforceai.backup'
    message    = if ($Test) {
      'Test notification from the WorkforceAI database backup task.'
    } else {
      'Scheduled database backup failed. Review the local backup task log.'
    }
    tags       = [ordered]@{
      component = 'scheduled-backup'
      test      = [string]([bool]$Test)
    }
  }
  $envelopeHeader = [ordered]@{
    event_id = $eventId
    sent_at  = [DateTimeOffset]::UtcNow.ToString('o')
    dsn      = $dsn
  }
  $body = ($envelopeHeader | ConvertTo-Json -Compress) + "`n" +
    '{"type":"event"}' + "`n" +
    ($event | ConvertTo-Json -Compress -Depth 5) + "`n"

  Invoke-RestMethod -Uri $endpoint -Method Post -ContentType 'application/x-sentry-envelope' -Body $body -TimeoutSec 15 | Out-Null
  Write-Host 'Backup failure notification sent to Sentry.'
}

trap {
  $backupErrorRecord = $_
  try {
    Send-BackupFailureNotification
  } catch {
    Write-Warning ("Backup failure notification could not be sent: {0}" -f $_.Exception.Message)
  }
  throw $backupErrorRecord
}

if ($TestNotification) {
  Send-BackupFailureNotification -Test
  exit 0
}

$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

$uploadEnabled = -not [string]::IsNullOrWhiteSpace($RcloneRemote) -or
  -not [string]::IsNullOrWhiteSpace($AgeRecipient)
if ($uploadEnabled) {
  if ([string]::IsNullOrWhiteSpace($RcloneRemote) -or [string]::IsNullOrWhiteSpace($AgeRecipient)) {
    throw 'Remote backup requires both -RcloneRemote and -AgeRecipient'
  }
  if ($RcloneRemote -notmatch '^[A-Za-z0-9_-]+:[A-Za-z0-9][A-Za-z0-9._/-]*$') {
    throw 'Invalid -RcloneRemote; use a configured remote and bucket path such as b2:bucket-name'
  }
  if ($AgeRecipient -notmatch '^age1[0-9a-z]{58}$') {
    throw 'Invalid -AgeRecipient; use the public age1 recipient, never the private identity'
  }

  $ageExe = (Get-Command age.exe -ErrorAction SilentlyContinue).Source
  if (-not $ageExe) {
    $ageExe = Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages\FiloSottile.age_Microsoft.Winget.Source_8wekyb3d8bbwe\age\age.exe'
  }
  if (-not (Test-Path $ageExe)) { throw "Remote backup requires age.exe; not found at $ageExe" }

  $rcloneExe = (Get-Command rclone.exe -ErrorAction SilentlyContinue).Source
  if (-not $rcloneExe) {
    $rcloneMatches = Get-ChildItem -Path (Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages\Rclone.Rclone_*\rclone-v*\rclone.exe') -File -ErrorAction SilentlyContinue
    if ($rcloneMatches) { $rcloneExe = $rcloneMatches[0].FullName }
  }
  if (-not $rcloneExe -or -not (Test-Path $rcloneExe)) {
    throw 'Remote backup requires rclone.exe; install rclone or add it to PATH'
  }

  $remoteName = $RcloneRemote.Split(':')[0] + ':'
  $configuredRemotes = & $rcloneExe listremotes
  if ($LASTEXITCODE -ne 0) { throw 'Remote backup failed: rclone could not read its configuration' }
  if ($configuredRemotes -notcontains $remoteName) {
    throw "Remote backup failed: rclone remote '$remoteName' is not configured"
  }
}

function Test-Docker { docker info *> $null; return ($LASTEXITCODE -eq 0) }
if (-not (Test-Docker)) {
  $desktop = Join-Path $env:LOCALAPPDATA 'Programs\DockerDesktop\Docker Desktop.exe'
  if (Test-Path $desktop) { Start-Process $desktop }
  $deadline = (Get-Date).AddMinutes(5)
  while (-not (Test-Docker) -and (Get-Date) -lt $deadline) { Start-Sleep 5 }
  if (-not (Test-Docker)) { throw 'Backup failed: Docker Desktop is not running and could not be started' }
}

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
  & npx --no-install supabase db dump --remote=$ProjectRef -f $out @($j.args) 2>&1 | Out-Null
  $ErrorActionPreference = 'Stop'
  if ($LASTEXITCODE -ne 0) { throw "Backup failed: Supabase dump command failed for $($j.file)" }
  if (-not (Test-Path $out) -or (Get-Item $out).Length -eq 0) {
    throw "Backup failed: $($j.file) is missing or empty"
  }
  Write-Host ("OK  {0} ({1:N0} bytes)" -f $j.file, (Get-Item $out).Length)
}

# supabase db dump skips managed schemas, so capture custom triggers on auth tables separately
$authTriggers = Join-Path $dir 'auth-triggers.sql'
$ErrorActionPreference = 'Continue'
$queryErrorFile = [System.IO.Path]::GetTempFileName()
try {
  $result = & npx --no-install supabase db query --remote=$ProjectRef --read-only "select pg_get_triggerdef(t.oid) || ';' as def from pg_trigger t join pg_class c on c.oid = t.tgrelid where c.relnamespace = 'auth'::regnamespace and not t.tgisinternal" -o json 2> $queryErrorFile
  $queryExitCode = $LASTEXITCODE
  if ($queryExitCode -ne 0) {
    $queryError = (Get-Content -LiteralPath $queryErrorFile -Raw).Trim()
    throw "Backup failed: auth trigger query exited with code $queryExitCode. $queryError"
  }
  try {
    $queryResult = ($result | Out-String | ConvertFrom-Json)
  } catch {
    throw "Backup failed: could not parse auth trigger query output as JSON. $($_.Exception.Message)"
  }
  if ($queryResult -is [System.Array]) {
    $triggerRows = @($queryResult)
  } elseif ($queryResult.PSObject.Properties['rows']) {
    $triggerRows = @($queryResult.rows)
  } elseif ($queryResult.PSObject.Properties['def']) {
    $triggerRows = @($queryResult)
  } else {
    throw 'Backup failed: auth trigger query returned an unexpected JSON shape'
  }
  $defs = @($triggerRows | ForEach-Object { $_.def } | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
} finally {
  Remove-Item -LiteralPath $queryErrorFile -Force
}
$ErrorActionPreference = 'Stop'
if (-not $defs) { throw 'Backup failed: no auth trigger definitions returned' }
$defs | Set-Content $authTriggers
Write-Host ("OK  auth-triggers.sql ({0} trigger(s))" -f @($defs).Count)

if ($uploadEnabled) {
  $stageDir = Join-Path $env:TEMP "workforceai-backup-$ProjectRef-$stamp"
  New-Item -ItemType Directory $stageDir | Out-Null
  try {
    $backupFiles = @('schema.sql', 'data.sql', 'roles.sql', 'auth-triggers.sql')
    $manifestFiles = foreach ($file in $backupFiles) {
      $source = (Resolve-Path -LiteralPath (Join-Path $dir $file)).Path
      $encryptedName = "$file.age"
      $encryptedPath = Join-Path $stageDir $encryptedName
      $ErrorActionPreference = 'Continue'
      # Invoke age through cmd.exe; direct PowerShell invocation can leave age.exe hanging.
      $ageCommand = '"{0}" --encrypt --recipient {1} --output "{2}" "{3}"' -f $ageExe, $AgeRecipient, $encryptedPath, $source
      & $env:ComSpec /d /c $ageCommand
      $ageExitCode = $LASTEXITCODE
      $ErrorActionPreference = 'Stop'
      if ($ageExitCode -ne 0 -or -not (Test-Path $encryptedPath) -or (Get-Item $encryptedPath).Length -eq 0) {
        throw "Remote backup failed: age encryption failed for $file (exit $ageExitCode)"
      }
      $encryptedItem = Get-Item $encryptedPath
      [ordered]@{
        name      = $encryptedName
        sizeBytes = $encryptedItem.Length
        sha256    = (Get-FileHash $encryptedPath -Algorithm SHA256).Hash.ToLowerInvariant()
      }
    }

    $manifest = [ordered]@{
      projectRef = $ProjectRef
      createdUtc = (Get-Date).ToUniversalTime().ToString('o')
      files      = @($manifestFiles)
    }
    $manifestPath = Join-Path $stageDir 'manifest.json'
    $manifest | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $manifestPath -Encoding UTF8

    $runRemote = "$($RcloneRemote.TrimEnd('/'))/$ProjectRef/$stamp"
    Get-ChildItem -LiteralPath $stageDir -File | Where-Object Name -ne 'manifest.json' | ForEach-Object {
      $ErrorActionPreference = 'Continue'
      & $rcloneExe copyto $_.FullName "$runRemote/$($_.Name)" 2>&1 | Out-Null
      $rcloneExitCode = $LASTEXITCODE
      $ErrorActionPreference = 'Stop'
      if ($rcloneExitCode -ne 0) { throw "Remote backup failed: upload did not complete for $($_.Name)" }
    }

    $ErrorActionPreference = 'Continue'
    & $rcloneExe copyto $manifestPath "$runRemote/manifest.json" 2>&1 | Out-Null
    $rcloneExitCode = $LASTEXITCODE
    $ErrorActionPreference = 'Stop'
    if ($rcloneExitCode -ne 0) { throw 'Remote backup failed: manifest upload did not complete' }

    $ErrorActionPreference = 'Continue'
    & $rcloneExe check $stageDir $runRemote --download --one-way 2>&1 | Out-Null
    $rcloneExitCode = $LASTEXITCODE
    $ErrorActionPreference = 'Stop'
    if ($rcloneExitCode -ne 0) { throw 'Remote backup failed: remote content verification did not pass' }

    $expectedNames = @(Get-ChildItem -LiteralPath $stageDir -File | Select-Object -ExpandProperty Name | Sort-Object)
    $remoteNames = @(& $rcloneExe lsf $runRemote --files-only)
    if ($LASTEXITCODE -ne 0) { throw 'Remote backup failed: could not list uploaded objects' }
    $remoteNames = @($remoteNames | Sort-Object)
    if (Compare-Object $expectedNames $remoteNames) {
      throw 'Remote backup failed: uploaded object list differs from the expected set'
    }
    Write-Host "OK  encrypted remote backup verified at $runRemote"
  } finally {
    Remove-Item -LiteralPath $stageDir -Recurse -Force
  }
} else {
  Write-Warning 'Remote upload is not configured; this run will create a local-only backup.'
}

# Prune older backups of this project
Get-ChildItem backups -Directory -Filter "$ProjectRef-*" |
  Sort-Object Name -Descending | Select-Object -Skip $Keep |
  Remove-Item -Recurse -Force

Write-Host "Backup written to $dir"
