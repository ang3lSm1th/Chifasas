# Script de Respaldo Local Automatizado (Zero Data Loss) - Servidor Local Chifa Mariana
param(
    [string]$ContainerName = "chifa_saas_mysql",
    [string]$DatabaseName  = "chifa_saas",
    [string]$BackupDir     = "$PSScriptRoot\..\backups",
    [int]$RetentionDays    = 30
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$Timestamp  = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $BackupDir "${DatabaseName}_backup_${Timestamp}.sql"

Write-Host ">>> [Backup Local] Iniciando respaldo no destructivo de '$DatabaseName'..." -ForegroundColor Cyan

# Volcado consistente sin bloqueo de tablas ni sentencias DROP destructivas
docker exec $ContainerName mysqldump `
    -u root `
    "-pRootSecureSuperAdminPass2026!" `
    --single-transaction `
    --routines `
    --triggers `
    --no-create-db `
    --skip-add-drop-table `
    $DatabaseName > $BackupFile

if ((Test-Path $BackupFile) -and ((Get-Item $BackupFile).Length -gt 0)) {
    Compress-Archive -Path $BackupFile -DestinationPath "${BackupFile}.zip" -Force
    Remove-Item -Path $BackupFile -Force
    Write-Host "[OK] Respaldo local generado exitosamente: ${BackupFile}.zip" -ForegroundColor Green
} else {
    throw "El archivo de respaldo se genero vacio o fallo la conexion al contenedor MySQL."
}

# Rotacion de respaldos antiguos (> $RetentionDays dias)
$CutoffDate = (Get-Date).AddDays(-$RetentionDays)
Get-ChildItem -Path $BackupDir -Filter "*.zip" | Where-Object { $_.LastWriteTime -lt $CutoffDate } | ForEach-Object {
    Remove-Item -Path $_.FullName -Force
    Write-Host "[ROTACION] Respaldo antiguo eliminado (> $RetentionDays dias): $($_.Name)" -ForegroundColor Yellow
}
