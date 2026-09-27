# Backup de la base de prod/local antes de un deploy.
# Uso (desde la raíz del repo):
#   powershell -File scripts/backup-db.ps1
#   powershell -File scripts/backup-db.ps1 -DbPath backend/data/menu-qa.db

param(
  [string]$DbPath = "backend/data/menu.db"
)

$ErrorActionPreference = "Stop"
if (-not (Test-Path $DbPath)) {
  Write-Error "No existe $DbPath"
}

$dir = Join-Path (Split-Path $DbPath -Parent) "backups"
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$name = [IO.Path]::GetFileNameWithoutExtension($DbPath)
$dest = Join-Path $dir "$name-$stamp.db"
Copy-Item $DbPath $dest
Write-Host "Backup: $dest"
