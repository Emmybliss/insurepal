import React, { useEffect, useState } from 'react';
import { syncEngine, SyncState } from '../offline/sync/SyncEngine';
import { RefreshCw, Wifi, WifiOff, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const SyncStatusWidget: React.FC = () => {
    const [state, setState] = useState<SyncState>('online');
    const [details, setDetails] = useState<any>({});

    useEffect(() => {
        const unsubscribe = syncEngine.subscribe((newState, newDetails) => {
            setState(newState);
            setDetails(newDetails);
        });

        // Trigger initial sync check
        syncEngine.triggerSync();

        return () => unsubscribe();
    }, []);

    const handleManualSync = () => {
        syncEngine.triggerSync();
    };

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-xs transition-all">
            {state === 'online' && (
                <>
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-slate-700 dark:text-slate-300">Online</span>
                    {details.lastSyncTime && (
                        <span className="text-slate-400 dark:text-slate-500 text-[10px]">({details.lastSyncTime})</span>
                    )}
                </>
            )}

            {state === 'synced' && (
                <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-700 dark:text-emerald-400">Synced</span>
                    {details.lastSyncTime && (
                        <span className="text-slate-400 dark:text-slate-500 text-[10px]">{details.lastSyncTime}</span>
                    )}
                </>
            )}

            {state === 'syncing' && (
                <>
                    <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                    <span className="text-blue-600 dark:text-blue-400">Syncing...</span>
                </>
            )}

            {state === 'offline' && (
                <>
                    <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-amber-700 dark:text-amber-400">Offline Mode</span>
                    <span className="text-slate-400 dark:text-slate-500 text-[10px]">(Changes saved locally)</span>
                </>
            )}

            {state === 'error' && (
                <>
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                    <span className="text-rose-600 dark:text-rose-400">Sync Warning</span>
                    <button
                        onClick={handleManualSync}
                        className="ml-1 text-slate-500 hover:text-slate-900 dark:hover:text-white underline cursor-pointer"
                    >
                        Retry
                    </button>
                </>
            )}
        </div>
    );
};

export default SyncStatusWidget;
