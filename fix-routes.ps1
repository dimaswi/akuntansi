# PowerShell script to fix route names in frontend files

# Get all tsx files in kas directory
$files = Get-ChildItem -Path "resources\js\pages\kas" -Filter "*.tsx" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Replace route names
    $content = $content -replace 'kas\.bank-account\.', 'kas.bank-accounts.'
    $content = $content -replace 'kas\.cash-transaction\.', 'kas.cash-transactions.'
    $content = $content -replace 'kas\.bank-transaction\.', 'kas.bank-transactions.'
    $content = $content -replace 'kas\.giro-transaction\.', 'kas.giro-transactions.'
    
    # Write back to file
    Set-Content -Path $file.FullName -Value $content -NoNewline
    
    Write-Host "Fixed: $($file.FullName)"
}

Write-Host "All route names fixed!"
