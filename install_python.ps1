$url = "https://www.python.org/ftp/python/3.12.3/python-3.12.3-amd64.exe"
$outpath = "$env:TEMP\python-3.12.3-installer.exe"

Write-Host "Downloading Python 3.12 installer..."
if (-not (Test-Path $outpath)) {
    Invoke-WebRequest -Uri $url -OutFile $outpath
}

Write-Host "Starting Python installation (User Only, no admin prompt needed)..."
# Arguments: /quiet (silent), PrependPath=1 (Add to PATH for user), InstallAllUsers=0 (Current user profile)
$proc = Start-Process -FilePath $outpath -ArgumentList "/quiet PrependPath=1 InstallAllUsers=0" -Wait -PassThru

if ($proc.ExitCode -eq 0) {
    Write-Host "Python 3.12 has been successfully installed!"
} else {
    Write-Error "Python installation exited with error code: $($proc.ExitCode)"
}
