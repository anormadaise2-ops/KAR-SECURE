$ErrorActionPreference = "Stop"

$Project = Split-Path -Parent $PSScriptRoot
$Destination = Join-Path $Project "KAR-SECURE-Source.zip"
$Temp = Join-Path $env:TEMP ("KAR-SECURE-ZIP-" + [guid]::NewGuid().ToString("N"))

New-Item -ItemType Directory -Path $Temp -Force | Out-Null

try {
    $exclude = @(
        "node_modules",
        "release",
        ".git",
        "KAR-SECURE-Source.zip"
    )

    Get-ChildItem -LiteralPath $Project -Force |
        Where-Object { $exclude -notcontains $_.Name } |
        ForEach-Object {
            Copy-Item -LiteralPath $_.FullName -Destination $Temp -Recurse -Force
        }

    if (Test-Path $Destination) {
        Remove-Item -LiteralPath $Destination -Force
    }

    Compress-Archive -Path (Join-Path $Temp "*") -DestinationPath $Destination -CompressionLevel Optimal
    Write-Host "ZIP cree : $Destination" -ForegroundColor Green
}
finally {
    Remove-Item -LiteralPath $Temp -Recurse -Force -ErrorAction SilentlyContinue
}
