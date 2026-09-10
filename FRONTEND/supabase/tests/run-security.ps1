param([string]$Container = '')
$ErrorActionPreference = 'Stop'
$frontend = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$compose = Join-Path $frontend 'compose.security.yml'
$managed = [string]::IsNullOrEmpty($Container)
if ($managed) {
    docker compose -p couplespace-security -f $compose up -d --wait
    if ($LASTEXITCODE -ne 0) { throw 'Unable to start isolated database' }
    $Container = docker compose -p couplespace-security -f $compose ps -q security-db
}
function Invoke-SqlFile([string]$Path, [bool]$ExpectedFailure = $false) {
    $ErrorActionPreference = 'Continue' # Windows PowerShell wraps native stderr as errors.
    $output = Get-Content -Raw -LiteralPath $Path | docker exec -i $Container psql -X -U postgres -v ON_ERROR_STOP=1 2>&1
    $code = $LASTEXITCODE
    $ErrorActionPreference = 'Stop'
    if ($ExpectedFailure) {
        if ($code -eq 0 -or ($output -join "`n") -notmatch 'ASSERTION FAILED') {
            throw "Baseline did not fail for the intended assertion: $output"
        }
        Write-Host "Baseline regression reproduced: $($output | Select-String 'ASSERTION FAILED')"
    } elseif ($code -ne 0) { throw "SQL failed in ${Path}: $output" }
    else { Write-Host "PASS $(Split-Path -Leaf $Path)" }
}
try {
    Invoke-SqlFile (Join-Path $PSScriptRoot 'bootstrap.sql')
    # Relevant unchanged legacy schema; exclude Spotify/UI unrelated migrations,
    # real pg_cron/pg_net extension setup. HTTP calls are captured by a SQL stub.
    $baseline = @(
        '001_initial_schema.sql', '002_chat_schema.sql',
        '20260725_create_album_photos.sql', '20260725_extend_messages_for_media.sql',
        '20260727_create_moods_and_random_photo.sql',
        '20260728_add_pairs_delete_policy.sql', '20260728_fix_cascade_delete.sql',
        '20260728_fix_security_and_profiles_rls.sql',
        '20260728_create_shared_reminders_table.sql',
        '20260729_add_status_and_push_subscriptions.sql',
        '20260804_dedup_push_subscriptions.sql',
        '20260805_trigger_chat_push_notifications.sql'
    )
    foreach ($file in $baseline) { Invoke-SqlFile (Join-Path $frontend "supabase/migrations/$file") }
    Invoke-SqlFile (Join-Path $PSScriptRoot 'security_behavior.sql') $true
    Invoke-SqlFile (Join-Path $frontend 'supabase/migrations/20260908125710_security_identity_and_private_media.sql')
    Invoke-SqlFile (Join-Path $PSScriptRoot 'security_behavior.sql')
    Invoke-SqlFile (Join-Path $PSScriptRoot 'security_concurrency.sql')
    Invoke-SqlFile (Join-Path $PSScriptRoot 'security_dispatch.sql')
} finally {
    if ($managed) { docker compose -p couplespace-security -f $compose down }
}
