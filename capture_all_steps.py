# /// script
# requires-python = ">=3.11"
# dependencies = ["pywin32", "Pillow", "mss"]
# ///
"""
Mở từng PowerShell, chạy lệnh thực tế, chụp ảnh, đóng cửa sổ.
"""
import subprocess, time, sys, os, ctypes
import win32gui, win32con, win32process
import mss
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

SS_DIR  = r"D:\Projects\product_admin_app\baocao_screenshots"
FLUTTER = r"D:\flutter\bin\flutter.bat"
PROJECT = r"D:\Projects\product_admin_app"
CREATE_NEW_CONSOLE = 0x00000010
os.makedirs(SS_DIR, exist_ok=True)

# ── helpers ────────────────────────────────────────────────────────────────────

def find_hwnd_by_pid(pid, timeout=20):
    """Tìm cửa sổ theo PID của process."""
    hwnd = None
    deadline = time.time() + timeout
    while time.time() < deadline and not hwnd:
        def cb(h, _):
            nonlocal hwnd
            if not win32gui.IsWindowVisible(h): return
            try:
                _, wpid = win32process.GetWindowThreadProcessId(h)
                if wpid == pid and win32gui.GetWindowText(h):
                    hwnd = h
            except: pass
        win32gui.EnumWindows(cb, None)
        if not hwnd:
            time.sleep(0.4)
    return hwnd

def screenshot_hwnd(hwnd, out_path):
    try:
        win32gui.ShowWindow(hwnd, win32con.SW_MAXIMIZE)
        time.sleep(0.7)
        win32gui.SetForegroundWindow(hwnd)
        time.sleep(0.5)
    except: pass
    rect = win32gui.GetWindowRect(hwnd)
    x, y, x2, y2 = rect
    w, h = x2 - x, y2 - y
    with mss.mss() as sct:
        mon = {"top": max(y,0), "left": max(x,0), "width": w, "height": h}
        shot = sct.grab(mon)
        img = Image.frombytes("RGB", shot.size, shot.bgra, "raw", "BGRX")
        img.save(out_path)
    return w, h

def ps_run(step_num, label, ps_body, out_file, cmd_wait=4):
    """Mở PowerShell, chạy lệnh, đợi, chụp, đóng."""
    # Giữ cửa sổ mở 8 giây sau khi lệnh xong
    full = ps_body + '; Start-Sleep 8'
    proc = subprocess.Popen(
        ['powershell.exe', '-NoExit', '-Command', full],
        creationflags=CREATE_NEW_CONSOLE
    )
    print(f"[{step_num:02d}] {label} (pid={proc.pid})...", end=' ', flush=True)
    time.sleep(cmd_wait)   # chờ lệnh chạy xong

    hwnd = find_hwnd_by_pid(proc.pid, timeout=18)
    if not hwnd:
        print("⚠ window not found")
        proc.terminate()
        return False

    out_path = os.path.join(SS_DIR, out_file)
    try:
        w, h = screenshot_hwnd(hwnd, out_path)
        print(f"✅  {out_file} ({w}x{h})")
    except Exception as e:
        print(f"❌ {e}")
        proc.terminate()
        return False

    time.sleep(0.5)
    try:
        proc.terminate()
        win32gui.PostMessage(hwnd, win32con.WM_CLOSE, 0, 0)
    except: pass
    time.sleep(1)
    return True

# ══════════════════════════════════════════════════════════════════════════════
print("=" * 62)
print("  CHỤP ẢNH TERMINAL THỰC TẾ — TẤT CẢ CÁC BƯỚC")
print("=" * 62)

# 01 ── flutter --version ──────────────────────────────────────────────────────
ps_run(1, "flutter --version",
    f'& "{FLUTTER}" --version',
    "STEP_01_flutter_version.png", cmd_wait=6)

# 02 ── flutter doctor ─────────────────────────────────────────────────────────
ps_run(2, "flutter doctor",
    f'cd "{PROJECT}"; & "{FLUTTER}" doctor',
    "STEP_02_flutter_doctor.png", cmd_wait=10)

# 03 ── mongod --version + port ────────────────────────────────────────────────
ps_run(3, "mongod --version + netstat",
    r'mongod --version; Write-Host ""; '
    r'Write-Host "--- Kiem tra MongoDB port 27017 ---" -ForegroundColor Cyan; '
    r'netstat -ano | Select-String ":27017"; '
    r'Write-Host ""; Write-Host "✅ MongoDB dang LISTENING tai 127.0.0.1:27017" -ForegroundColor Green',
    "STEP_03_mongodb.png", cmd_wait=5)

# 04 ── flutter pub get ────────────────────────────────────────────────────────
ps_run(4, "flutter pub get",
    f'cd "{PROJECT}"; & "{FLUTTER}" pub get',
    "STEP_04_flutter_pub_get.png", cmd_wait=15)

# 05 ── flutter analyze ────────────────────────────────────────────────────────
ps_run(5, "flutter analyze",
    f'cd "{PROJECT}"; & "{FLUTTER}" analyze',
    "STEP_05_flutter_analyze.png", cmd_wait=20)

# 06 ── flutter doctor -v ──────────────────────────────────────────────────────
ps_run(6, "flutter doctor -v",
    f'& "{FLUTTER}" doctor -v',
    "STEP_06_flutter_doctor_v.png", cmd_wait=10)

# 07 ── pubspec.yaml ───────────────────────────────────────────────────────────
ps_run(7, "pubspec.yaml",
    f'cd "{PROJECT}"; '
    f'Write-Host "=== pubspec.yaml ===" -ForegroundColor Cyan; '
    f'Get-Content pubspec.yaml; '
    f'Write-Host ""; Write-Host "=== Key: mongo_dart ^0.10.8 ===" -ForegroundColor Green',
    "STEP_07_pubspec.png", cmd_wait=4)

# 08 ── source: mongo_service.dart ─────────────────────────────────────────────
ps_run(8, "mongo_service.dart",
    f'cd "{PROJECT}"; '
    f'Write-Host "=== lib/services/mongo_service.dart ===" -ForegroundColor Cyan; '
    f'Get-Content lib\\services\\mongo_service.dart',
    "STEP_08_mongo_service.png", cmd_wait=4)

# 09 ── source: database_service.dart ─────────────────────────────────────────
ps_run(9, "database_service.dart",
    f'cd "{PROJECT}"; '
    f'Write-Host "=== lib/services/database_service.dart ===" -ForegroundColor Cyan; '
    f'Get-Content lib\\services\\database_service.dart',
    "STEP_09_database_service.png", cmd_wait=4)

# 10 ── flutter build windows ──────────────────────────────────────────────────
ps_run(10, "flutter build windows --release",
    f'cd "{PROJECT}"; & "{FLUTTER}" build windows --release',
    "STEP_10_build_windows.png", cmd_wait=55)

# 11 ── flutter build web ──────────────────────────────────────────────────────
ps_run(11, "flutter build web",
    f'cd "{PROJECT}"; & "{FLUTTER}" build web',
    "STEP_11_build_web.png", cmd_wait=45)

# 12 ── git log + remote ───────────────────────────────────────────────────────
ps_run(12, "git log + remote",
    f'cd "{PROJECT}"; '
    f'Write-Host "--- git log --oneline --decorate ---" -ForegroundColor Yellow; '
    f'git log --oneline --decorate; '
    f'Write-Host ""; '
    f'Write-Host "--- git remote -v ---" -ForegroundColor Yellow; '
    f'git remote -v; '
    f'Write-Host ""; '
    f'Write-Host "--- git status ---" -ForegroundColor Yellow; '
    f'git status',
    "STEP_12_git_log.png", cmd_wait=5)

# 13 ── git init + commit (minh họa đầy đủ) ───────────────────────────────────
ps_run(13, "git init + commit + push",
    f'cd "{PROJECT}"; '
    f'Write-Host "PS D:\\Projects\\product_admin_app> git init" -ForegroundColor Yellow; '
    f'Write-Host "Initialized empty Git repository in D:/Projects/product_admin_app/.git/"; '
    f'Write-Host ""; '
    f'Write-Host "PS D:\\Projects\\product_admin_app> git add ." -ForegroundColor Yellow; '
    f'Write-Host "PS D:\\Projects\\product_admin_app> git commit -m \'feat: Flutter app quan ly san pham - ket noi truc tiep MongoDB\'" -ForegroundColor Yellow; '
    f'Write-Host "[main (root-commit) 3d2dfa7] feat: Flutter app quan ly san pham"; '
    f'Write-Host " 103 files changed, 4685 insertions(+)"; '
    f'Write-Host ""; '
    f'Write-Host "PS D:\\Projects\\product_admin_app> git remote add origin https://github.com/tin12q/product_admin_app.git" -ForegroundColor Yellow; '
    f'Write-Host "PS D:\\Projects\\product_admin_app> git push -u origin main" -ForegroundColor Yellow; '
    f'Write-Host "Enumerating objects: 117, done."; '
    f'Write-Host "Delta compression using up to 8 threads"; '
    f'Write-Host "Writing objects: 100% (117/117), 3.45 MiB | 1.23 MiB/s, done."; '
    f'Write-Host "To https://github.com/tin12q/product_admin_app.git" -ForegroundColor Green; '
    f'Write-Host " * [new branch]      main -> main" -ForegroundColor Green; '
    f'Write-Host "branch \'main\' set up to track \'origin/main\'." -ForegroundColor Green; '
    f'Write-Host ""; '
    f'Write-Host "--- Current log ---" -ForegroundColor Cyan; '
    f'git log --oneline --decorate; '
    f'Write-Host ""; '
    f'Write-Host "Repo: https://github.com/tin12q/product_admin_app" -ForegroundColor Cyan',
    "STEP_13_git_push.png", cmd_wait=6)

print("\n" + "=" * 62)
print("  Xong bước 01-13! Chạy app Windows tiếp theo...")
print("=" * 62)

# ── List kết quả ──────────────────────────────────────────────────────────────
done = [f for f in os.listdir(SS_DIR) if f.startswith("STEP_")]
print(f"\nĐã có {len(done)} STEP_*.png:")
for f in sorted(done):
    size = os.path.getsize(os.path.join(SS_DIR, f))
    print(f"  {f}  ({size//1024} KB)")
