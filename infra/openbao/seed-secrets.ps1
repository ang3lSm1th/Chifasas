# Script de inicialización de secretos en OpenBao (PowerShell)
param(
    [string]$BaoAddress = $env:OPENBAO_ADDR,
    [string]$BaoToken   = $env:OPENBAO_TOKEN,
    [string]$DbUser     = $env:DB_USER,
    [string]$DbPassword = $env:DB_PASS,
    [string]$AuthSecret = $env:AUTH_SECRET,
    [string]$JwtKey     = $env:JWT_KEY
)

if (-not $BaoAddress) { $BaoAddress = "http://localhost:8200" }
if (-not $BaoToken)   { $BaoToken   = "chifa_root_token" }
if (-not $DbUser)     { $DbUser     = "chifa_app" }

$headers = @{
    "X-Vault-Token" = $BaoToken
    "Content-Type"  = "application/json"
}

Write-Host ">>> Conectando a OpenBao en $BaoAddress..." -ForegroundColor Cyan

# 1. Guardar configuraciones de base de datos
$mysqlSecret = @{
    data = @{
        host     = "localhost"
        port     = 3306
        database = "chifa_saas"
        user     = $DbUser
        pass     = ($DbPassword ? $DbPassword : "")
    }
} | ConvertTo-Json

try {
    $resDb = Invoke-RestMethod -Uri "$BaoAddress/v1/secret/data/chifa/mysql" -Method Post -Headers $headers -Body $mysqlSecret
    Write-Host "[OK] Metadatos de MySQL enviados a OpenBao" -ForegroundColor Green
} catch {
    Write-Host "[AVISO] OpenBao aun no esta activo en $BaoAddress. Iniciar con: npm run infra:up" -ForegroundColor Yellow
}

# 2. Guardar configuraciones de Better Auth
$authSecret = @{
    data = @{
        auth_key     = ($AuthSecret ? $AuthSecret : "")
        jwt_key      = ($JwtKey ? $JwtKey : "")
        session_name = "chifa_session"
    }
} | ConvertTo-Json

try {
    $resAuth = Invoke-RestMethod -Uri "$BaoAddress/v1/secret/data/chifa/better-auth" -Method Post -Headers $headers -Body $authSecret
    Write-Host "[OK] Metadatos de Better Auth enviados a OpenBao" -ForegroundColor Green
} catch {
    Write-Host "[AVISO] OpenBao aun no esta activo en $BaoAddress. Iniciar con: npm run infra:up" -ForegroundColor Yellow
}

Write-Host ">>> Script finalizado." -ForegroundColor Cyan
