# /// script
# requires-python = ">=3.11"
# dependencies = ["pywin32", "Pillow", "mss"]
# ///
"""Launch the Flutter Windows app and screenshot it."""
import subprocess, time, os, ctypes
import win32gui, win32con, win32process, win32api
import mss
from PIL import Image

EXE = r"D:\Projects\product_admin_app\build\windows\x64\runner\Release\product_admin_app.exe"
SS  = r"D:\Projects\product_admin_app\baocao_screenshots"
os.makedirs(SS, exist_ok=True)

def find_window_by_title_contains(substr, timeout=30):
    hwnd = None
    deadline = time.time() + timeout
    while time.time() < deadline and not hwnd:
        def cb(h, _):
            nonlocal hwnd
            if not win32gui.IsWindowVisible(h): return
            t = win32gui.GetWindowText(h)
            if substr.lower() in t.lower():
                hwnd = h
        win32gui.EnumWindows(cb, None)
        if not hwnd:
            time.sleep(0.5)
    return hwnd

def screenshot_window(hwnd, out_path, maximize=True):
    if maximize:
        win32gui.ShowWindow(hwnd, win32con.SW_MAXIMIZE)
        time.sleep(0.8)
    win32gui.SetForegroundWindow(hwnd)
    time.sleep(0.6)
    rect = win32gui.GetWindowRect(hwnd)
    x, y, x2, y2 = rect
    w, h = x2 - x, y2 - y
    with mss.mss() as sct:
        mon = {"top": max(y, 0), "left": max(x, 0), "width": w, "height": h}
        shot = sct.grab(mon)
        img = Image.frombytes("RGB", shot.size, shot.bgra, "raw", "BGRX")
        img.save(out_path)
    return w, h

print("Launching Flutter app...")
proc = subprocess.Popen([EXE])
print(f"PID: {proc.pid}")

# Wait for login screen
print("Waiting for login window...")
hwnd = find_window_by_title_contains("product", timeout=20)
if not hwnd:
    # try finding by pid
    deadline = time.time() + 15
    while time.time() < deadline and not hwnd:
        def cb2(h, _):
            global hwnd
            if not win32gui.IsWindowVisible(h): return
            try:
                _, wpid = win32process.GetWindowThreadProcessId(h)
                if wpid == proc.pid and win32gui.GetWindowText(h):
                    hwnd = h
            except: pass
        win32gui.EnumWindows(cb2, None)
        time.sleep(0.5)

if not hwnd:
    print("Window not found, listing all windows:")
    def list_cb(h, _):
        if win32gui.IsWindowVisible(h):
            t = win32gui.GetWindowText(h)
            if t: print(f"  [{h}] {t}")
    win32gui.EnumWindows(list_cb, None)
    proc.terminate()
    exit(1)

print(f"Found window: hwnd={hwnd} title='{win32gui.GetWindowText(hwnd)}'")
time.sleep(2)  # let app fully render

# Screenshot 1: Login screen
w, h = screenshot_window(hwnd, os.path.join(SS, "APP_01_login.png"))
print(f"✅ APP_01_login.png ({w}x{h})")

# Simulate typing admin credentials using win32api SendMessage
# Find the username field and type
time.sleep(1)

# Use keyboard simulation to fill login form
import win32con
def send_keys(hwnd, text):
    win32gui.SetForegroundWindow(hwnd)
    time.sleep(0.3)
    import ctypes
    for c in text:
        ctypes.windll.user32.PostMessageW(hwnd, win32con.WM_CHAR, ord(c), 0)
        time.sleep(0.03)

# Actually use subprocess to send keystrokes via PowerShell
def ps_keys(keys):
    subprocess.run([
        'powershell', '-Command',
        f'Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait("{keys}")'
    ], capture_output=True)
    time.sleep(0.3)

# Make sure window is active
win32gui.SetForegroundWindow(hwnd)
time.sleep(0.5)

# Type username
ps_keys("admin")
time.sleep(0.3)
ps_keys("{TAB}")
time.sleep(0.3)
ps_keys("admin123")
time.sleep(0.3)

# Screenshot 2: Login filled
w, h = screenshot_window(hwnd, os.path.join(SS, "APP_02_login_filled.png"), maximize=False)
print(f"✅ APP_02_login_filled.png ({w}x{h})")

# Press Enter to login
ps_keys("{ENTER}")
time.sleep(4)  # wait for MongoDB connect + load

# Screenshot 3: Product list main screen
w, h = screenshot_window(hwnd, os.path.join(SS, "APP_03_product_list.png"))
print(f"✅ APP_03_product_list.png ({w}x{h})")

# Click "Nhóm loại" FilterChip
# We'll use tab navigation or just type in search + take more screenshots
time.sleep(1)

# Type in search box to filter
win32gui.SetForegroundWindow(hwnd)
time.sleep(0.3)
# The search box should be near top - simulate Ctrl+A then type
ps_keys("^a")  # won't work well, just screenshot as-is
time.sleep(0.3)

# Screenshot 4: Search for "điện tử"
win32gui.SetForegroundWindow(hwnd)
ps_keys("Đi")  # type in search
time.sleep(1)
w, h = screenshot_window(hwnd, os.path.join(SS, "APP_04_search.png"), maximize=False)
print(f"✅ APP_04_search.png ({w}x{h})")

time.sleep(1)
proc.terminate()
print("\nDone!")
