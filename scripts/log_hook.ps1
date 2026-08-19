param(
    [string]$Tool = "codex",
    [string]$ExpectedRepoRoot = ""
)

# Windows-native Codex hook logger. This intentionally has no Python
# dependency because IDE hooks may run with a minimal PATH.
$ErrorActionPreference = "Stop"

function Invoke-GitValue {
    param([string[]]$Arguments)

    try {
        return ((& git @Arguments 2>$null) | Out-String).Trim()
    }
    catch {
        return ""
    }
}

function Limit-Text {
    param($Value, [int]$Length)

    if ($null -eq $Value) {
        return ""
    }
    $text = [string]$Value
    if ($text.Length -le $Length) {
        return $text
    }
    return $text.Substring(0, $Length)
}

try {
    $stdinStream = [Console]::OpenStandardInput()
    $utf8Reader = New-Object IO.StreamReader(
        $stdinStream,
        (New-Object Text.UTF8Encoding($false)),
        $true
    )
    $raw = $utf8Reader.ReadToEnd()
    if ([string]::IsNullOrWhiteSpace($raw)) {
        exit 0
    }

    $data = $raw | ConvertFrom-Json
    $eventName = if ($data.hook_event_name) {
        [string]$data.hook_event_name
    }
    elseif ($data.event) {
        [string]$data.event
    }
    else {
        ""
    }

    $origin = Invoke-GitValue @("remote", "get-url", "origin")
    if ([string]::IsNullOrWhiteSpace($origin)) {
        exit 0
    }

    $repo = ($origin.TrimEnd("/") -split "[/\\]")[-1]
    if ($repo.EndsWith(".git")) {
        $repo = $repo.Substring(0, $repo.Length - 4)
    }

    $entry = [ordered]@{
        ts              = [DateTimeOffset]::UtcNow.ToOffset([TimeSpan]::FromHours(7)).ToString("o")
        tool            = $Tool.ToLowerInvariant()
        event           = $eventName
        session_id      = Limit-Text $data.session_id 200
        model           = Limit-Text $data.model 200
        repo            = $repo
        branch          = Invoke-GitValue @("rev-parse", "--abbrev-ref", "HEAD")
        commit          = Invoke-GitValue @("rev-parse", "--short", "HEAD")
        student         = Invoke-GitValue @("config", "user.email")
        prompt          = Limit-Text $data.prompt 1000
        turn_id         = Limit-Text $data.turn_id 200
        transcript_path = Limit-Text $data.transcript_path 1000
    }

    if ([string]::IsNullOrWhiteSpace($entry.prompt) -and
        $eventName -notin @("Stop", "SessionEnd")) {
        exit 0
    }

    $repoRoot = Invoke-GitValue @("rev-parse", "--show-toplevel")
    if ([string]::IsNullOrWhiteSpace($repoRoot)) {
        exit 0
    }

    if (-not [string]::IsNullOrWhiteSpace($ExpectedRepoRoot)) {
        $trimChars = [char[]]@("\", "/")
        $actualRoot = [IO.Path]::GetFullPath($repoRoot).TrimEnd($trimChars)
        $requiredRoot = [IO.Path]::GetFullPath($ExpectedRepoRoot).TrimEnd($trimChars)
        if (-not $actualRoot.Equals($requiredRoot, [StringComparison]::OrdinalIgnoreCase)) {
            exit 0
        }
    }

    $entry.entry_id = "codex-$($entry.session_id)-$($entry.turn_id)-$eventName"

    $logDir = if ($env:AI_LOG_DIR) {
        $env:AI_LOG_DIR
    }
    else {
        Join-Path $repoRoot ".ai-log"
    }
    [IO.Directory]::CreateDirectory($logDir) | Out-Null

    $logFile = Join-Path $logDir "session.jsonl"
    $lockFile = Join-Path $logDir ".session-jsonl.lock"
    $lockStream = $null
    for ($attempt = 0; $attempt -lt 40 -and $null -eq $lockStream; $attempt++) {
        try {
            $lockStream = [IO.File]::Open(
                $lockFile,
                [IO.FileMode]::OpenOrCreate,
                [IO.FileAccess]::ReadWrite,
                [IO.FileShare]::None
            )
        }
        catch {
            Start-Sleep -Milliseconds 50
        }
    }
    if ($null -eq $lockStream) {
        exit 0
    }

    try {
        $duplicate = $false
        if (Test-Path -LiteralPath $logFile) {
            foreach ($existingLine in (Get-Content -LiteralPath $logFile -Tail 200 -Encoding UTF8)) {
                try {
                    $existing = $existingLine | ConvertFrom-Json
                    if ($existing.entry_id -eq $entry.entry_id -or
                        ($existing.tool -eq $entry.tool -and
                         $existing.event -eq $entry.event -and
                         $existing.session_id -eq $entry.session_id -and
                         $existing.turn_id -eq $entry.turn_id)) {
                        $duplicate = $true
                        break
                    }
                }
                catch {
                    continue
                }
            }
        }

        if (-not $duplicate) {
            $line = ($entry | ConvertTo-Json -Compress -Depth 5) + [Environment]::NewLine
            $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
            [IO.File]::AppendAllText($logFile, $line, $utf8NoBom)
        }
    }
    finally {
        $lockStream.Dispose()
    }
}
catch {
    # Logging must never block or alter a Codex turn.
    exit 0
}

exit 0
