Add-Type -AssemblyName System.Drawing

$srcFile = Resolve-Path "apps/web/public/brand/ttrc-logo.png"
$srcImg = [System.Drawing.Bitmap]::FromFile($srcFile)

# Content bounding box
$cropX = 36
$cropY = 260
$cropW = 1634
$cropH = 484

function CreateSquareIcon([int]$size, [string]$outPath) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    # Scale to fit width with small margin
    $margin = [Math]::Max(1, [int]($size * 0.04))
    $destW = $size - ($margin * 2)
    $destH = [int]([Math]::Round($destW * ($cropH / $cropW)))
    if ($destH -gt ($size - $margin * 2)) {
        $destH = $size - ($margin * 2)
        $destW = [int]([Math]::Round($destH * ($cropW / $cropH)))
    }
    $destX = [int](($size - $destW) / 2)
    $destY = [int](($size - $destH) / 2)

    $srcRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)
    $destRect = New-Object System.Drawing.Rectangle($destX, $destY, $destW, $destH)

    $g.DrawImage($srcImg, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Created $outPath ($size x $size)"
}

# Also create tightly trimmed logo
function CreateTrimmedLogo([string]$outPath) {
    $bmp = New-Object System.Drawing.Bitmap($cropW, $cropH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    $srcRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)
    $destRect = New-Object System.Drawing.Rectangle(0, 0, $cropW, $cropH)

    $g.DrawImage($srcImg, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Created trimmed logo at $outPath"
}

# Generate PNGs
CreateSquareIcon 16 "apps/web/public/brand/favicon-16x16.png"
CreateSquareIcon 32 "apps/web/public/brand/favicon-32x32.png"
CreateSquareIcon 48 "apps/web/public/brand/favicon-48x48.png"
CreateSquareIcon 180 "apps/web/public/brand/apple-touch-icon.png"
CreateSquareIcon 192 "apps/web/public/brand/pwa-icon-192.png"
CreateSquareIcon 512 "apps/web/public/brand/pwa-icon-512.png"

# App router icons
CreateSquareIcon 32 "apps/web/src/app/icon.png"
CreateSquareIcon 180 "apps/web/src/app/apple-icon.png"

# Create ICO file with 16, 32, 48
$sizes = @(16, 32, 48)
$pngBytesList = @()
foreach ($sz in $sizes) {
    $p = "apps/web/public/brand/favicon-$sz`x$sz.png"
    $pngBytesList += ,([System.IO.File]::ReadAllBytes((Resolve-Path $p)))
}

function BuildIco([string]$icoPath) {
    $ms = New-Object System.IO.MemoryStream
    $bw = New-Object System.IO.BinaryWriter($ms)

    # ICONDIR
    $bw.Write([uint16]0) # Reserved
    $bw.Write([uint16]1) # Type (1 = ICO)
    $bw.Write([uint16]$sizes.Count) # Count

    $offset = 6 + (16 * $sizes.Count)
    for ($i = 0; $i -lt $sizes.Count; $i++) {
        $sz = $sizes[$i]
        $bytes = $pngBytesList[$i]
        $bw.Write([byte]($sz -band 0xFF))
        $bw.Write([byte]($sz -band 0xFF))
        $bw.Write([byte]0) # Color palette count
        $bw.Write([byte]0) # Reserved
        $bw.Write([uint16]1) # Color planes
        $bw.Write([uint16]32) # Bits per pixel
        $bw.Write([uint32]$bytes.Length) # Image size
        $bw.Write([uint32]$offset) # Offset
        $offset += $bytes.Length
    }

    for ($i = 0; $i -lt $sizes.Count; $i++) {
        $bw.Write($pngBytesList[$i])
    }

    $bw.Flush()
    [System.IO.File]::WriteAllBytes($icoPath, $ms.ToArray())
    $bw.Dispose()
    $ms.Dispose()
    Write-Host "Created ICO at $icoPath"
}

BuildIco "apps/web/public/brand/favicon.ico"
BuildIco "apps/web/public/favicon.ico"
BuildIco "apps/web/src/app/favicon.ico"

$srcImg.Dispose()
Write-Host "All icons generated successfully!"
