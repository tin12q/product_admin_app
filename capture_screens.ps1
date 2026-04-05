<#
.SYNOPSIS
  Auto-capture VS Code + Terminal (Windows Terminal) screenshots
#>
param(
    [string]$SS   = "D:\Projects\product_admin_app\baocao_screenshots",
    [string]$PROJ = "D:\Projects\product_admin_app"
)
$ErrorActionPreference = 'Continue'
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

# ── C# helpers ────────────────────────────────────────────────────────────────
Add-Type @'
using System;using System.Runtime.InteropServices;
using System.Collections.Generic;using System.Text;
public class WH {
    // EnumWindows
    public delegate bool WEP(IntPtr h, IntPtr l);
    [DllImport("user32.dll")] public static extern bool EnumWindows(WEP p, IntPtr l);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint p);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
    [DllImport("user32.dll",CharSet=CharSet.Auto)]
    public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
    // Window manipulation
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int c);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
    public struct RECT { public int L, T, R, B; }

    static uint _tpid; static List<IntPtr> _lst;
    static bool CB(IntPtr h, IntPtr l) {
        uint p = 0; GetWindowThreadProcessId(h, out p);
        if (p == _tpid && IsWindowVisible(h)) _lst.Add(h);
        return true;
    }
    public static IntPtr[] GetHwnds(uint pid) {
        _tpid = pid; _lst = new List<IntPtr>();
        EnumWindows(CB, IntPtr.Zero);
        return _lst.ToArray();
    }
    public static string GetTitle(IntPtr h) {
        var sb = new StringBuilder(512); GetWindowText(h, sb, 512); return sb.ToString();
    }
}
'@

# ── Capture a known HWND ──────────────────────────────────────────────────────
function Cap-Hwnd {
    param([IntPtr]$hwnd, [string]$outFile, [int]$delay = 2)
    if ($hwnd -eq [IntPtr]::Zero) { return "zero_hwnd" }
    [WH]::ShowWindow($hwnd, 3) | Out-Null    # SW_MAXIMIZE
    [WH]::SetForegroundWindow($hwnd) | Out-Null
    Start-Sleep -Seconds $delay
    $r = New-Object WH+RECT
    [WH]::GetWindowRect($hwnd, [ref]$r) | Out-Null
    $w = $r.R - $r.L; $h = $r.B - $r.T
    if ($w -lt 200 -or $h -lt 200) { return "too_small:${w}x${h}" }
    try {
        $bmp = New-Object System.Drawing.Bitmap($w, $h)
        $g   = [System.Drawing.Graphics]::FromImage($bmp)
        $g.CopyFromScreen($r.L, $r.T, 0, 0, (New-Object System.Drawing.Size($w, $h)))
        $bmp.Save($outFile)
        $g.Dispose(); $bmp.Dispose()
        return "ok:${w}x${h}"
    } catch { return "draw_err:" + $_.Exception.Message }
}

# ─────────────────────────────────────────────────────────────────────────────
# VS Code captures
# ─────────────────────────────────────────────────────────────────────────────
Write-Host "`n=== VS CODE ===" -ForegroundColor Cyan
Get-Process "Code" -EA SilentlyContinue | Stop-Process -Force -EA SilentlyContinue
Start-Sleep -Seconds 2

$vsItems = @(
  [pscustomobject]@{ f="lib\main.dart";                        line=1;  o="VSCODE_01_main.png"    },
  [pscustomobject]@{ f="lib\models\san_pham.dart";             line=1;  o="VSCODE_02_model.png"   },
  [pscustomobject]@{ f="lib\services\mongo_service.dart";      line=1;  o="VSCODE_03_service.png" },
  [pscustomobject]@{ f="lib\screens\product_list_screen.dart"; line=1;  o="VSCODE_04_screen1.png" },
  [pscustomobject]@{ f="lib\screens\product_list_screen.dart"; line=60; o="VSCODE_05_screen2.png" },
  [pscustomobject]@{ f="pubspec.yaml";                         line=1;  o="VSCODE_06_pubspec.png" }
)

foreach ($item in $vsItems) {
    $fp = Join-Path $PROJ $item.f
    $op = Join-Path $SS   $item.o
    Write-Host ">> $($item.f) :$($item.line)" -ForegroundColor Yellow

    Start-Process "code" -ArgumentList "--new-window", "--goto", "${fp}:$($item.line)"

    $proc = $null
    for ($i = 0; $i -lt 15; $i++) {
        Start-Sleep -Seconds 1
        $found = Get-Process "Code" -EA SilentlyContinue |
                 Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero -and $_.MainWindowTitle -ne "" } |
                 Sort-Object StartTime -Descending | Select-Object -First 1
        if ($found) { $proc = $found; break }
    }

    if ($proc) {
        $res = Cap-Hwnd -hwnd $proc.MainWindowHandle -outFile $op -delay 2
        Write-Host "   $res" -ForegroundColor $(if ($res -like "ok:*") {"Green"} else {"Red"})
    } else {
        Write-Host "   ERR: VS Code window not found" -ForegroundColor Red
    }

    Get-Process "Code" -EA SilentlyContinue | Stop-Process -Force -EA SilentlyContinue
    Start-Sleep -Seconds 2
}

# ─────────────────────────────────────────────────────────────────────────────
# Terminal captures via Windows Terminal (wt.exe -w _new)
# ─────────────────────────────────────────────────────────────────────────────
Write-Host "`n=== TERMINAL (Windows Terminal) ===" -ForegroundColor Cyan

# Đóng cửa sổ cmd/wt dư từ test trước
Get-Process cmd -EA SilentlyContinue | Stop-Process -Force -EA SilentlyContinue
Start-Sleep -Seconds 1

$wtPid = [uint32](Get-Process WindowsTerminal -EA SilentlyContinue | Select-Object -First 1).Id
Write-Host "Windows Terminal pid=$wtPid"

$termItems = @(
  [pscustomobject]@{
    cmd  = "flutter --version && timeout /t 60 /nobreak"
    o    = "TERM_REAL_01_flutter_version.png"; wait = 5
  },
  [pscustomobject]@{
    cmd  = "flutter doctor && timeout /t 60 /nobreak"
    o    = "TERM_REAL_02_flutter_doctor.png"; wait = 14
  },
  [pscustomobject]@{
    cmd  = "mongosh --version && timeout /t 60 /nobreak"
    o    = "TERM_REAL_03_mongo_version.png"; wait = 5
  },
  [pscustomobject]@{
    cmd  = "netstat -an | findstr 27017 && timeout /t 60 /nobreak"
    o    = "TERM_REAL_04_netstat.png"; wait = 5
  },
  [pscustomobject]@{
    cmd  = "cd /d D:\Projects\product_admin_app && flutter pub get && timeout /t 60 /nobreak"
    o    = "TERM_REAL_05_pub_get.png"; wait = 22
  },
  [pscustomobject]@{
    cmd  = "cd /d D:\Projects\product_admin_app && flutter analyze && timeout /t 60 /nobreak"
    o    = "TERM_REAL_06_analyze.png"; wait = 22
  },
  [pscustomobject]@{
    cmd  = "cd /d D:\Projects\product_admin_app && git log --oneline -8 && timeout /t 60 /nobreak"
    o    = "TERM_REAL_07_git_log.png"; wait = 5
  },
  [pscustomobject]@{
    cmd  = "D:\AndroidSDK\platform-tools\adb.exe devices && timeout /t 60 /nobreak"
    o    = "TERM_REAL_08_adb_devices.png"; wait = 5
  }
)

foreach ($item in $termItems) {
    $op = Join-Path $SS $item.o
    Write-Host ">> $($item.o)" -ForegroundColor Yellow

    # Snapshot HWNDs before
    $before = [WH]::GetHwnds($wtPid)
    # Snapshot cmd PIDs before
    $cmdsBefore = @(Get-Process cmd -EA SilentlyContinue | Select-Object -ExpandProperty Id)

    # Open new WT window
    Start-Process wt -ArgumentList "-w", "_new", "cmd", "/k", $item.cmd

    # Wait for command to execute
    Start-Sleep -Seconds ($item.wait + 3)

    # Find new WT HWND
    $after   = [WH]::GetHwnds($wtPid)
    $newHwnd = $after | Where-Object { $before -notcontains $_ } | Select-Object -Last 1
    if (-not $newHwnd) {
        # Fallback: use the window whose title changed / newest
        $newHwnd = $after | Select-Object -Last 1
    }

    if ($newHwnd -and $newHwnd -ne [IntPtr]::Zero) {
        $title = [WH]::GetTitle($newHwnd)
        Write-Host "   Found HWND=$newHwnd title=[$title]" -ForegroundColor DarkGray
        $res = Cap-Hwnd -hwnd $newHwnd -outFile $op -delay 1
        Write-Host "   $res" -ForegroundColor $(if ($res -like "ok:*") {"Green"} else {"Red"})
    } else {
        Write-Host "   ERR: no new WT window found" -ForegroundColor Red
    }

    # Kill the cmd.exe we started (closes the WT tab)
    $newCmds = Get-Process cmd -EA SilentlyContinue |
               Where-Object { $cmdsBefore -notcontains $_.Id }
    $newCmds | Stop-Process -Force -EA SilentlyContinue
    Start-Sleep -Seconds 2
}

Write-Host "`nAll captures complete!" -ForegroundColor Green
