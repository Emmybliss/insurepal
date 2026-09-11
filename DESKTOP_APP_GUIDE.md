# InsurePal Offline Desktop Application Guide

This guide covers running, testing, and packaging the **InsurePal Offline-First NativePHP Electron Desktop Application** from development testing to a production Windows executable (`.exe`).

---

## 1. Installation & Prerequisites

To ensure NativePHP Electron dependencies are installed in your Laravel environment, execute:

```bash
# On Windows, set COMPOSER_PROCESS_TIMEOUT to allow downloading the ~370MB NativePHP binary:
$env:COMPOSER_PROCESS_TIMEOUT=2000

# Install NativePHP Electron
composer require nativephp/electron --prefer-dist

# Publish NativePHP assets & providers
php artisan native:install
```

> [!TIP]
> **Windows Installation Troubleshooting**:
> If Composer fails with `curl error 28 timeout` or `Could not delete ... vcs/ ... locked by Windows Search Indexer`:
> 1. Clear locked Composer cache: `Remove-Item -Recurse -Force "$env:LOCALAPPDATA\Composer\vcs"`
> 2. Run with extended timeout: `$env:COMPOSER_PROCESS_TIMEOUT=2000; composer require nativephp/electron --prefer-dist`

---

## 2. Running in Development Mode (`native:run`)

To launch the desktop application locally connected to your Vite dev server and Laravel Herd environment:

```bash
# 1. Ensure Vite dev server is running
npm run dev

# 2. Launch the NativePHP Desktop Application
php artisan native:run
```

This launches the **InsurePal Enterprise Desktop** window ($1280 \times 800$) connected to your local backend (`http://insurepal-ai-saas.test`).

---

## 3. Testing Offline Synchronization in Development

1. **Open DevTools in Desktop App**: Press `F12` or `Ctrl + Shift + I` inside the desktop app window.
2. **Simulate Offline Connection**:
   - Go to the **Network** tab in DevTools.
   - Select **Offline** from the network throttling dropdown.
3. **Perform Offline Operations**:
   - Create a Customer or Quote in the UI.
   - The UI saves the record to local IndexedDB (`idb.ts`) and queues an outbox mutation.
   - The status widget displays **`● Offline Mode (Changes saved locally)`**.
4. **Test Reconnection & Auto-Sync**:
   - Uncheck **Offline** in the DevTools Network tab.
   - Watch the status widget transition to **`↻ Syncing...`** and then **`✓ Synced`** as mutations are sent to `POST /api/v1/sync` and central IDs are assigned.

---

## 4. Building the Production Executable (`.exe`)

To build and package the application into a standalone Windows Installer executable (`.exe`):

### Step 4.1: Compile Production Assets
```bash
npm run build
```

### Step 4.2: Build Windows Installer
```bash
php artisan native:build win
```

> [!NOTE]
> You can build for other target operating systems using `php artisan native:build mac` or `php artisan native:build linux`.

### Step 4.3: Output Executable Location
The final compiled Windows installer will be saved in:
```text
dist/
  └── InsurePal-Setup-1.0.0.exe
```

---

## 5. Production Desktop App Architecture & Security

1. **Central Server Connection**: The installed desktop app connects securely to your central website API (`https://app.insurepal.com/api/v1/sync`).
2. **OS Credential Vault**: User Sanctum tokens are encrypted using **Windows Credential Manager** / **macOS Keychain** via `SecureStorage`.
3. **Multi-Tenant Isolation**: Local IndexedDB database namespaces and tokens are automatically unmounted and purged upon user logout or tenant switching (`TenantIsolationManager`).
