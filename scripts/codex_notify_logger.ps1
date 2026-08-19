param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]] $NotifyArguments
)

$ErrorActionPreference = 'SilentlyContinue'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$PythonScript = Join-Path $PSScriptRoot 'log_codex_notify.py'
$Payload = if ($NotifyArguments.Count -gt 0) { $NotifyArguments[-1] } else { '' }

if ([string]::IsNullOrWhiteSpace($Payload)) {
    exit 0
}

$Python = Get-Command python.exe -ErrorAction SilentlyContinue
if (-not $Python) {
    $Python = Get-Command py.exe -ErrorAction SilentlyContinue
}
if (-not $Python) {
    exit 0
}

Push-Location $ProjectRoot
try {
    if ($Python.Name -eq 'py.exe') {
        $Payload | & $Python.Source -3 $PythonScript
    } else {
        $Payload | & $Python.Source $PythonScript
    }
} finally {
    Pop-Location
}

exit 0
