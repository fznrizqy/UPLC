import os
import sys
import time
import socket
import signal
import subprocess
import threading
from pathlib import Path

# Paths
ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"
BACKEND_PYTHON = BACKEND_DIR / "venv" / "Scripts" / "python.exe"

def get_lan_ip():
    """Detect local LAN IP address."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # doesn't even have to be reachable
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

processes = []
is_shutting_down = False

def print_banner(lan_ip):
    print("\n" + "="*70)
    print("   UPLC : UNIFIED PHARMACY LEARNING CENTER (LAN DEPLOYMENT)")
    print("="*70)
    print(f" [*] Local Server IP     : {lan_ip}")
    print(f" [*] Frontend Web App    : http://{lan_ip}:3000  (or http://localhost:3000)")
    print(f" [*] Backend REST API    : http://{lan_ip}:8000/api/v1")
    print(f" [*] Interactive Docs    : http://{lan_ip}:8000/docs")
    print(f" [*] Administrator       : admin / admin123")
    print(f" [*] Tim Pengembangan    : rnd1 / rnd123")
    print(f" [*] Tim Rutin           : analyst1 / analyst123")
    print("="*70)
    print(" [i] Press Ctrl+C in this terminal to safely stop all services.\n")

def stream_output(pipe, prefix):
    try:
        for line in iter(pipe.readline, b''):
            if is_shutting_down:
                break
            try:
                decoded = line.decode('utf-8', errors='replace').rstrip()
                if decoded:
                    print(f"[{prefix}] {decoded}")
            except Exception:
                pass
    except Exception:
        pass

def cleanup(signum=None, frame=None):
    global is_shutting_down
    if is_shutting_down:
        return
    is_shutting_down = True
    print("\n\n [!] Stopping Lab E-Learning services cleanly...")
    
    for p, name in processes:
        try:
            print(f" [*] Terminating {name} (PID: {p.pid})...")
            # In Windows, terminate process tree cleanly
            subprocess.run(["taskkill", "/F", "/T", "/PID", str(p.pid)], capture_output=True)
        except Exception as e:
            pass
            
    print(" [*] All services stopped. Goodbye!\n")
    sys.exit(0)

def main():
    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)

    lan_ip = get_lan_ip()
    print_banner(lan_ip)

    # 1. Start FastAPI Backend (with --reload for auto-reloading on code changes)
    backend_cmd = [
        str(BACKEND_PYTHON), "-m", "uvicorn", "app.main:app",
        "--host", "0.0.0.0",
        "--port", "8000",
        "--reload"
    ]
    print(" [>] Starting FastAPI backend on 0.0.0.0:8000...")
    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=str(BACKEND_DIR),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT
    )
    processes.append((backend_proc, "Backend"))
    t1 = threading.Thread(target=stream_output, args=(backend_proc.stdout, "BACKEND"), daemon=True)
    t1.start()

    time.sleep(1.5)

    # 2. Start Next.js Frontend
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    frontend_cmd = [npm_cmd, "run", "dev", "--", "-H", "0.0.0.0", "-p", "3000"]
    print(" [>] Starting Next.js frontend on 0.0.0.0:3000...")
    frontend_proc = subprocess.Popen(
        frontend_cmd,
        cwd=str(FRONTEND_DIR),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT
    )
    processes.append((frontend_proc, "Frontend"))
    t2 = threading.Thread(target=stream_output, args=(frontend_proc.stdout, "FRONTEND"), daemon=True)
    t2.start()

    print("\n [+] Both services are live and running! Ready to accept LAN connections.\n")

    # Monitor processes
    while not is_shutting_down:
        time.sleep(1)
        if backend_proc.poll() is not None:
            print(f" [!] Backend process died with returncode {backend_proc.returncode}")
            cleanup()
            break
        if frontend_proc.poll() is not None:
            print(f" [!] Frontend process died with returncode {frontend_proc.returncode}")
            cleanup()
            break

if __name__ == "__main__":
    main()
