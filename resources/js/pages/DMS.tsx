import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';

import {
    Archive,
    Briefcase,
    Building,
    Calendar,
    Check,
    ChevronDown,
    ChevronRight,
    Copy,
    CreditCard,
    Database,
    Download,
    Edit,
    Eye,
    File,
    FileBarChart,
    FileSpreadsheet,
    FileText,
    Filter,
    Folder,
    FolderOpen,
    FolderPlus,
    Globe,
    Grid3X3,
    HardDrive,
    Heart,
    Home,
    Image,
    List,
    Mail,
    Menu,
    Move,
    PieChart,
    Plus,
    Receipt,
    RotateCcw,
    Scale,
    Search,
    Settings,
    Star,
    Target,
    Trash2,
    Truck,
    Upload,
    Users,
    X,
} from 'lucide-react';
import React, { useCallback, useRef, useState } from 'react';

interface FileItem {
    id: string;
    name: string;
    type: 'pdf' | 'docx' | 'xlsx' | 'jpg' | 'png' | 'other';
    size: number;
    uploadDate: Date;
    uploadedBy: string;
    folderId: string;
    tags?: string[];
    policyId?: string;
    isDeleted?: boolean;
    deletedDate?: Date;
}

interface FolderItem {
    id: string;
    name: string;
    parentId: string | null;
    isExpanded: boolean;
    children: FolderItem[];
    icon?: string;
    isDeleted?: boolean;
    deletedDate?: Date;
}

const DocumentManagementSystem: React.FC = () => {
    const [currentFolder, setCurrentFolder] = useState('root');
    const [currentView, setCurrentView] = useState<'files' | 'recycle'>('files');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showNewFolderModal, setShowNewFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('folder');
    const [sidebarMinimized, setSidebarMinimized] = useState(false);
    const [hoveredFile, setHoveredFile] = useState<string | null>(null);
    const [contextMenu, setContextMenu] = useState<{
        show: boolean;
        x: number;
        y: number;
        folderId: string;
    }>({ show: false, x: 0, y: 0, folderId: '' });
    const [renameFolder, setRenameFolder] = useState<{
        id: string;
        name: string;
    } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Available icons for folders
    const availableIcons = [
        { id: 'folder', name: 'Folder', icon: <Folder className="h-5 w-5" /> },
        {
            id: 'file-text',
            name: 'Documents',
            icon: <FileText className="h-5 w-5" />,
        },
        { id: 'receipt', name: 'Receipts', icon: <Receipt className="h-5 w-5" /> },
        { id: 'users', name: 'People', icon: <Users className="h-5 w-5" /> },
        {
            id: 'file-bar-chart',
            name: 'Reports',
            icon: <FileBarChart className="h-5 w-5" />,
        },
        { id: 'scale', name: 'Legal', icon: <Scale className="h-5 w-5" /> },
        {
            id: 'briefcase',
            name: 'Business',
            icon: <Briefcase className="h-5 w-5" />,
        },
        {
            id: 'building',
            name: 'Building',
            icon: <Building className="h-5 w-5" />,
        },
        {
            id: 'calendar',
            name: 'Calendar',
            icon: <Calendar className="h-5 w-5" />,
        },
        {
            id: 'credit-card',
            name: 'Finance',
            icon: <CreditCard className="h-5 w-5" />,
        },
        {
            id: 'database',
            name: 'Database',
            icon: <Database className="h-5 w-5" />,
        },
        { id: 'globe', name: 'Global', icon: <Globe className="h-5 w-5" /> },
        { id: 'heart', name: 'Health', icon: <Heart className="h-5 w-5" /> },
        { id: 'home', name: 'Home', icon: <Home className="h-5 w-5" /> },
        { id: 'mail', name: 'Mail', icon: <Mail className="h-5 w-5" /> },
        {
            id: 'settings',
            name: 'Settings',
            icon: <Settings className="h-5 w-5" />,
        },
        { id: 'star', name: 'Important', icon: <Star className="h-5 w-5" /> },
        { id: 'target', name: 'Goals', icon: <Target className="h-5 w-5" /> },
        { id: 'truck', name: 'Delivery', icon: <Truck className="h-5 w-5" /> },
        { id: 'archive', name: 'Archive', icon: <Archive className="h-5 w-5" /> },
    ];

    // Sample data
    const [folders, setFolders] = useState<FolderItem[]>([
        {
            id: 'root',
            name: 'Root',
            parentId: null,
            isExpanded: true,
            children: [
                {
                    id: 'policies',
                    name: 'Policies',
                    parentId: 'root',
                    isExpanded: false,
                    children: [],
                    icon: 'file-text',
                },
                {
                    id: 'receipts',
                    name: 'Receipts',
                    parentId: 'root',
                    isExpanded: false,
                    children: [],
                    icon: 'receipt',
                },
                {
                    id: 'kyc',
                    name: 'Customer KYC',
                    parentId: 'root',
                    isExpanded: false,
                    children: [],
                    icon: 'users',
                },
                {
                    id: 'naicom',
                    name: 'NAICOM Reports',
                    parentId: 'root',
                    isExpanded: false,
                    children: [],
                    icon: 'file-bar-chart',
                },
                {
                    id: 'claims',
                    name: 'Claims',
                    parentId: 'root',
                    isExpanded: false,
                    children: [],
                    icon: 'scale',
                },
            ],
        },
    ]);

    const [files, setFiles] = useState<FileItem[]>([
        {
            id: '1',
            name: 'Motor Policy - ABC123.pdf',
            type: 'pdf',
            size: 2456789,
            uploadDate: new Date('2024-01-15'),
            uploadedBy: 'John Doe',
            folderId: 'policies',
            tags: ['motor', 'policy'],
            policyId: 'ABC123',
        },
        {
            id: '2',
            name: 'KYC Document - Jane Smith.jpg',
            type: 'jpg',
            size: 1234567,
            uploadDate: new Date('2024-01-14'),
            uploadedBy: 'Sarah Wilson',
            folderId: 'kyc',
            tags: ['kyc', 'verification'],
        },
        {
            id: '3',
            name: 'Claims Report Q1 2024.xlsx',
            type: 'xlsx',
            size: 987654,
            uploadDate: new Date('2024-01-13'),
            uploadedBy: 'Mike Johnson',
            folderId: 'naicom',
            tags: ['quarterly', 'claims'],
        },
        // Deleted files
        {
            id: '4',
            name: 'Deleted Policy.pdf',
            type: 'pdf',
            size: 1500000,
            uploadDate: new Date('2024-01-10'),
            uploadedBy: 'John Doe',
            folderId: 'policies',
            isDeleted: true,
            deletedDate: new Date('2024-01-16'),
        },
    ]);

    const getFolderIcon = (iconId?: string) => {
        const icon = availableIcons.find((i) => i.id === iconId);
        return icon ? icon.icon : <Folder className="h-5 w-5" />;
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (type: string) => {
        switch (type) {
            case 'pdf':
                return <FileText className="h-8 w-8 text-red-500" />;
            case 'docx':
                return <FileText className="h-8 w-8 text-blue-500" />;
            case 'xlsx':
                return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
            case 'jpg':
            case 'png':
                return <Image className="h-8 w-8 text-purple-500" />;
            default:
                return <File className="h-8 w-8 text-gray-500" />;
        }
    };

    // Calculate analytics
    const analytics = React.useMemo(() => {
        const activeFiles = files.filter((f) => !f.isDeleted);
        const activeFolders = folders.flatMap((f) => f.children).filter((f) => !f.isDeleted);
        const totalUsed = activeFiles.reduce((acc, file) => acc + file.size, 0);
        const totalAvailable = 5 * 1024 * 1024 * 1024; // 5GB

        const typeBreakdown = activeFiles.reduce(
            (acc, file) => {
                const type = file.type;
                acc[type] = (acc[type] || 0) + file.size;
                return acc;
            },
            {} as Record<string, number>,
        );

        return {
            totalFiles: activeFiles.length,
            totalFolders: activeFolders.length,
            totalUsed,
            totalAvailable,
            usagePercentage: (totalUsed / totalAvailable) * 100,
            typeBreakdown,
        };
    }, [files, folders]);

    const toggleFolder = (folderId: string) => {
        const updateFolders = (folders: FolderItem[]): FolderItem[] => {
            return folders.map((folder) => {
                if (folder.id === folderId) {
                    return { ...folder, isExpanded: !folder.isExpanded };
                }
                if (folder.children.length > 0) {
                    return { ...folder, children: updateFolders(folder.children) };
                }
                return folder;
            });
        };
        setFolders(updateFolders(folders));
    };

    const handleFileSelect = (fileId: string) => {
        setSelectedFiles((prev) => (prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]));
    };

    const handleRightClick = (e: React.MouseEvent, folderId: string) => {
        e.preventDefault();
        setContextMenu({
            show: true,
            x: e.clientX,
            y: e.clientY,
            folderId,
        });
    };

    const handleCreateSubfolder = (parentId: string) => {
        setCurrentFolder(parentId);
        setShowNewFolderModal(true);
        setContextMenu({ show: false, x: 0, y: 0, folderId: '' });
    };

    const handleRenameFolder = (folderId: string, currentName: string) => {
        setRenameFolder({ id: folderId, name: currentName });
        setContextMenu({ show: false, x: 0, y: 0, folderId: '' });
    };

    const handleDeleteFolder = (folderId: string) => {
        const updateFolders = (folders: FolderItem[]): FolderItem[] => {
            return folders.map((folder) => {
                if (folder.id === folderId) {
                    return { ...folder, isDeleted: true, deletedDate: new Date() };
                }
                if (folder.children.length > 0) {
                    return { ...folder, children: updateFolders(folder.children) };
                }
                return folder;
            });
        };
        setFolders(updateFolders(folders));
        setContextMenu({ show: false, x: 0, y: 0, folderId: '' });
    };

    const handleFileAction = (action: string, fileId: string) => {
        switch (action) {
            case 'preview': {
                const file = files.find((f) => f.id === fileId);
                if (file) setPreviewFile(file);
                break;
            }
            case 'download':
                console.log('Download file:', fileId);
                break;
            case 'move':
                console.log('Move file:', fileId);
                break;
            case 'copy':
                console.log('Copy file:', fileId);
                break;
            case 'delete':
                setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, isDeleted: true, deletedDate: new Date() } : f)));
                break;
        }
    };

    const handleRestore = (id: string, type: 'file' | 'folder') => {
        if (type === 'file') {
            setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, isDeleted: false, deletedDate: undefined } : f)));
        } else {
            const updateFolders = (folders: FolderItem[]): FolderItem[] => {
                return folders.map((folder) => {
                    if (folder.id === id) {
                        return { ...folder, isDeleted: false, deletedDate: undefined };
                    }
                    if (folder.children.length > 0) {
                        return { ...folder, children: updateFolders(folder.children) };
                    }
                    return folder;
                });
            };
            setFolders(updateFolders(folders));
        }
    };

    const handlePermanentDelete = (id: string, type: 'file' | 'folder') => {
        if (type === 'file') {
            setFiles((prev) => prev.filter((f) => f.id !== id));
        } else {
            const updateFolders = (folders: FolderItem[]): FolderItem[] => {
                return folders.map((folder) => ({
                    ...folder,
                    children: updateFolders(folder.children.filter((f) => f.id !== id)),
                }));
            };
            setFolders(updateFolders(folders));
        }
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        console.log('Files dropped:', droppedFiles);
    }, []);

    const handleCreateFolder = () => {
        if (newFolderName.trim()) {
            const newFolder: FolderItem = {
                id: `folder-${Date.now()}`,
                name: newFolderName.trim(),
                parentId: currentFolder === 'root' ? 'root' : currentFolder,
                isExpanded: false,
                children: [],
                icon: selectedIcon,
            };

            const updateFolders = (folders: FolderItem[]): FolderItem[] => {
                return folders.map((folder) => {
                    if (folder.id === currentFolder || (currentFolder === 'root' && folder.id === 'root')) {
                        return { ...folder, children: [...folder.children, newFolder] };
                    }
                    if (folder.children.length > 0) {
                        return { ...folder, children: updateFolders(folder.children) };
                    }
                    return folder;
                });
            };

            setFolders(updateFolders(folders));
            setNewFolderName('');
            setSelectedIcon('folder');
            setShowNewFolderModal(false);
        }
    };

    const handleRenameSubmit = () => {
        if (renameFolder && renameFolder.name.trim()) {
            const updateFolders = (folders: FolderItem[]): FolderItem[] => {
                return folders.map((folder) => {
                    if (folder.id === renameFolder.id) {
                        return { ...folder, name: renameFolder.name.trim() };
                    }
                    if (folder.children.length > 0) {
                        return { ...folder, children: updateFolders(folder.children) };
                    }
                    return folder;
                });
            };
            setFolders(updateFolders(folders));
            setRenameFolder(null);
        }
    };

    const filteredFiles = files.filter((file) => {
        if (currentView === 'recycle') {
            return file.isDeleted && file.name.toLowerCase().includes(searchTerm.toLowerCase());
        }
        const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFolder = currentFolder === 'root' || file.folderId === currentFolder;
        return matchesSearch && matchesFolder && !file.isDeleted;
    });

    const deletedFolders = folders.flatMap((f) => f.children).filter((f) => f.isDeleted);

    const renderFolderTree = (folders: FolderItem[], level: number = 0) => {
        if (sidebarMinimized) {
            return folders
                .filter((f) => !f.isDeleted)
                .map((folder) => (
                    <div key={folder.id} className="mb-2">
                        <div
                            className={`group relative flex h-full w-full cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-gray-100 ${
                                currentFolder === folder.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                            }`}
                            onClick={() => setCurrentFolder(folder.id)}
                            onContextMenu={(e) => handleRightClick(e, folder.id)}
                        >
                            {getFolderIcon(folder.icon)}
                            <div className="absolute left-full z-10 ml-2 rounded bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100">
                                {folder.name}
                            </div>
                        </div>
                    </div>
                ));
        }

        return folders
            .filter((f) => !f.isDeleted)
            .map((folder) => (
                <div key={folder.id} className={`ml-${level * 4}`}>
                    <div
                        className={`flex cursor-pointer items-center rounded-lg px-3 py-2 transition-colors hover:bg-gray-100 ${
                            currentFolder === folder.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                        }`}
                        onClick={() => setCurrentFolder(folder.id)}
                        onContextMenu={(e) => handleRightClick(e, folder.id)}
                    >
                        {folder.children.length > 0 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFolder(folder.id);
                                }}
                                className="mr-1"
                            >
                                {folder.isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                        )}
                        {folder.isExpanded ? (
                            <FolderOpen className="mr-2 h-4 w-4 text-blue-500" />
                        ) : (
                            <div className="mr-2 text-blue-500">{getFolderIcon(folder.icon)}</div>
                        )}
                        <span className="ml-2 text-sm font-medium">{folder.name}</span>
                    </div>
                    {folder.isExpanded && folder.children.length > 0 && renderFolderTree(folder.children, level + 1)}
                </div>
            ));
    };

    // Close context menu when clicking outside
    React.useEffect(() => {
        const handleClick = () => setContextMenu({ show: false, x: 0, y: 0, folderId: '' });
        if (contextMenu.show) {
            document.addEventListener('click', handleClick);
            return () => document.removeEventListener('click', handleClick);
        }
    }, [contextMenu.show]);

    return (
        <AppLayout>
            <div className="flex h-screen">
                {/* Left Sidebar */}
                <div
                    className={`${
                        sidebarMinimized ? 'w-16' : 'w-52'
                    } flex flex-col border-r border-gray-200 bg-sidebar-primary-foreground transition-all duration-300`}
                >
                    <div className="flex-1 p-4">
                        <div className="mb-6 flex items-center justify-between">
                            {!sidebarMinimized && <h1 className="text-lg font-semibold text-gray-900">DMS</h1>}
                            <button
                                onClick={() => setSidebarMinimized(!sidebarMinimized)}
                                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                            >
                                <Menu className="h-5 w-5" />
                            </button>
                        </div>

                        {!sidebarMinimized && (
                            <div className="mb-6 space-y-2">
                                <button
                                    onClick={() => setCurrentView('files')}
                                    className={`flex w-full items-center rounded-lg px-3 py-2 transition-colors ${
                                        currentView === 'files' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    <Folder className="mr-3 h-5 w-5" />
                                    Files
                                </button>
                                <button
                                    onClick={() => setCurrentView('recycle')}
                                    className={`flex w-full items-center rounded-lg px-3 py-2 transition-colors ${
                                        currentView === 'recycle' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    <Trash2 className="mr-3 h-5 w-5" />
                                    Recycle Bin
                                </button>
                            </div>
                        )}

                        {currentView === 'files' && (
                            <>
                                {!sidebarMinimized && (
                                    <button
                                        onClick={() => setShowNewFolderModal(true)}
                                        className="mb-4 flex w-full items-center justify-center rounded-lg border border-blue-200 px-4 py-2 text-blue-600 transition-colors hover:bg-blue-50"
                                    >
                                        <FolderPlus className="mr-2 h-5 w-5" />
                                        New Folder
                                    </button>
                                )}

                                <div className={sidebarMinimized ? 'space-y-2' : 'space-y-1'}>{renderFolderTree(folders[0].children)}</div>
                            </>
                        )}
                    </div>

                    {!sidebarMinimized && (
                        <div className="border-t border-gray-200 p-4">
                            <div className="rounded-lg border p-4">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">Storage</span>
                                    <HardDrive className="h-4 w-4 text-gray-500" />
                                </div>
                                <div className="mb-2 h-2 w-full rounded-full bg-gray-200">
                                    <div className="h-2 rounded-full bg-blue-500" style={{ width: `${analytics.usagePercentage}%` }}></div>
                                </div>
                                <p className="text-xs text-gray-600">
                                    {formatFileSize(analytics.totalUsed)} of {formatFileSize(analytics.totalAvailable)} used
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <div className="flex flex-1 flex-col">
                    {/* Analytics Cards */}
                    {currentView === 'files' && (
                        <div className="border-b border-gray-200 p-6">
                            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                                <div className="rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-blue-600">Total Files</p>
                                            <p className="text-2xl font-bold text-blue-700">{analytics.totalFiles}</p>
                                        </div>
                                        <File className="h-8 w-8 text-blue-500" />
                                    </div>
                                </div>
                                <div className="rounded-lg bg-gradient-to-r from-green-50 to-green-100 p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-green-600">Total Folders</p>
                                            <p className="text-2xl font-bold text-green-700">{analytics.totalFolders}</p>
                                        </div>
                                        <Folder className="h-8 w-8 text-green-500" />
                                    </div>
                                </div>
                                <div className="rounded-lg bg-gradient-to-r from-purple-50 to-purple-100 p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-purple-600">Storage Used</p>
                                            <p className="text-2xl font-bold text-purple-700">{formatFileSize(analytics.totalUsed)}</p>
                                        </div>
                                        <HardDrive className="h-8 w-8 text-purple-500" />
                                    </div>
                                </div>
                                <div className="rounded-lg bg-gradient-to-r from-orange-50 to-orange-100 p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-orange-600">Available</p>
                                            <p className="text-2xl font-bold text-orange-700">
                                                {formatFileSize(analytics.totalAvailable - analytics.totalUsed)}
                                            </p>
                                        </div>
                                        <PieChart className="h-8 w-8 text-orange-500" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Header */}
                    <div className="border-b border-gray-200 p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {currentView === 'recycle'
                                        ? 'Recycle Bin'
                                        : folders[0].children.find((f) => f.id === currentFolder)?.name || 'All Files'}
                                </h2>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                                    className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                                >
                                    {viewMode === 'grid' ? <List className="h-5 w-5" /> : <Grid3X3 className="h-5 w-5" />}
                                </button>
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                                >
                                    <Filter className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="relative max-w-md flex-1">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Search files..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            {currentView === 'files' && (
                                <div className="ml-4 flex items-center space-x-2">
                                    <button
                                        onClick={() => setShowUploadModal(true)}
                                        className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                                    >
                                        <Upload className="mr-2 h-4 w-4" />
                                        Upload Files
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Files Content */}
                    <div className="flex-1 overflow-auto p-6">
                        {currentView === 'recycle' ? (
                            <div className="space-y-4">
                                {/* Deleted Files */}
                                {files.filter((f) => f.isDeleted).length === 0 && deletedFolders.length === 0 ? (
                                    <div className="py-12 text-center">
                                        <Trash2 className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                                        <h3 className="mb-2 text-lg font-medium text-gray-900">Recycle bin is empty</h3>
                                        <p className="text-gray-500">Deleted files and folders will appear here</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Deleted Folders */}
                                        {deletedFolders.map((folder) => (
                                            <div key={folder.id} className="rounded-lg border border-gray-200 p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <div className="mr-3 text-red-500">{getFolderIcon(folder.icon)}</div>
                                                        <div>
                                                            <h3 className="font-medium text-gray-900">{folder.name}</h3>
                                                            <p className="text-sm text-gray-500">
                                                                Deleted on {folder.deletedDate?.toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            onClick={() => handleRestore(folder.id, 'folder')}
                                                            className="flex items-center rounded-lg bg-green-50 px-3 py-1 text-green-600 transition-colors hover:bg-green-100"
                                                        >
                                                            <RotateCcw className="mr-1 h-4 w-4" />
                                                            Restore
                                                        </button>
                                                        <button
                                                            onClick={() => handlePermanentDelete(folder.id, 'folder')}
                                                            className="flex items-center rounded-lg bg-red-50 px-3 py-1 text-red-600 transition-colors hover:bg-red-100"
                                                        >
                                                            <Trash2 className="mr-1 h-4 w-4" />
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Deleted Files */}
                                        {files
                                            .filter((f) => f.isDeleted)
                                            .map((file) => (
                                                <div key={file.id} className="rounded-lg border border-gray-200 p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center">
                                                            <div className="mr-3 opacity-50">{getFileIcon(file.type)}</div>
                                                            <div>
                                                                <h3 className="font-medium text-gray-900">{file.name}</h3>
                                                                <p className="text-sm text-gray-500">
                                                                    {formatFileSize(file.size)} • Deleted on {file.deletedDate?.toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <button
                                                                onClick={() => handleRestore(file.id, 'file')}
                                                                className="flex items-center rounded-lg bg-green-50 px-3 py-1 text-green-600 transition-colors hover:bg-green-100"
                                                            >
                                                                <RotateCcw className="mr-1 h-4 w-4" />
                                                                Restore
                                                            </button>
                                                            <button
                                                                onClick={() => handlePermanentDelete(file.id, 'file')}
                                                                className="flex items-center rounded-lg bg-red-50 px-3 py-1 text-red-600 transition-colors hover:bg-red-100"
                                                            >
                                                                <Trash2 className="mr-1 h-4 w-4" />
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>
                        ) : filteredFiles.length === 0 ? (
                            <div className="py-12 text-center">
                                <File className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                                <h3 className="mb-2 text-lg font-medium text-gray-900">No files found</h3>
                                <p className="text-gray-500">Upload some files to get started</p>
                            </div>
                        ) : (
                            <div
                                className={viewMode === 'grid' ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'space-y-2'}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                {filteredFiles.map((file) => (
                                    <div
                                        key={file.id}
                                        className={`group relative cursor-pointer rounded-lg border border-gray-200 transition-all hover:shadow-lg ${
                                            selectedFiles.includes(file.id) ? 'ring-2 ring-blue-500' : ''
                                        } ${viewMode === 'list' ? 'flex items-center p-4' : 'p-4'}`}
                                        onClick={() => handleFileSelect(file.id)}
                                        onMouseEnter={() => setHoveredFile(file.id)}
                                        onMouseLeave={() => setHoveredFile(null)}
                                    >
                                        {/* Hover Action Bar */}
                                        {hoveredFile === file.id && (
                                            <div className="absolute top-2 right-2 z-10 flex items-center space-x-1 rounded-lg p-1 shadow-lg">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleFileAction('preview', file.id);
                                                    }}
                                                    className="rounded p-1 text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-600"
                                                    title="Preview"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleFileAction('download', file.id);
                                                    }}
                                                    className="rounded p-1 text-gray-600 transition-colors hover:bg-green-50 hover:text-green-600"
                                                    title="Download"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleFileAction('move', file.id);
                                                    }}
                                                    className="rounded p-1 text-gray-600 transition-colors hover:bg-purple-50 hover:text-purple-600"
                                                    title="Move"
                                                >
                                                    <Move className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleFileAction('copy', file.id);
                                                    }}
                                                    className="rounded p-1 text-gray-600 transition-colors hover:bg-orange-50 hover:text-orange-600"
                                                    title="Copy"
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleFileAction('delete', file.id);
                                                    }}
                                                    className="rounded p-1 text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}

                                        {viewMode === 'grid' ? (
                                            <>
                                                <div className="mb-3 flex items-center justify-between">
                                                    <div className="flex items-center">{getFileIcon(file.type)}</div>
                                                    {selectedFiles.includes(file.id) && (
                                                        <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-500">
                                                            <Check className="h-3 w-3 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <h3 className="mb-1 line-clamp-2 text-sm font-medium text-gray-900">{file.name}</h3>
                                                <div className="space-y-1 text-xs text-gray-500">
                                                    <p>{formatFileSize(file.size)}</p>
                                                    <p>{file.uploadDate.toLocaleDateString()}</p>
                                                    <p>by {file.uploadedBy}</p>
                                                </div>
                                                {file.tags && (
                                                    <div className="mt-2 flex flex-wrap gap-1">
                                                        {file.tags.map((tag) => (
                                                            <span key={tag} className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <div className="mr-4 flex items-center">
                                                    {selectedFiles.includes(file.id) && (
                                                        <div className="mr-3 flex h-5 w-5 items-center justify-center rounded bg-blue-500">
                                                            <Check className="h-3 w-3 text-white" />
                                                        </div>
                                                    )}
                                                    {getFileIcon(file.type)}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="truncate font-medium text-gray-900">{file.name}</h3>
                                                    <p className="text-sm text-gray-500">
                                                        {formatFileSize(file.size)} • {file.uploadDate.toLocaleDateString()} • {file.uploadedBy}
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Context Menu */}
                {contextMenu.show && (
                    <div className="fixed z-50 rounded-lg border border-gray-200 py-1 shadow-lg" style={{ left: contextMenu.x, top: contextMenu.y }}>
                        <button
                            onClick={() => handleCreateSubfolder(contextMenu.folderId)}
                            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Create Folder
                        </button>
                        <button
                            onClick={() => {
                                const folder = folders.flatMap((f) => f.children).find((f) => f.id === contextMenu.folderId);
                                if (folder) handleRenameFolder(contextMenu.folderId, folder.name);
                            }}
                            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                        >
                            <Edit className="mr-2 h-4 w-4" />
                            Rename
                        </button>
                        <button
                            onClick={() => handleDeleteFolder(contextMenu.folderId)}
                            className="flex w-full items-center px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </button>
                    </div>
                )}

                {/* Upload Modal */}
                {showUploadModal && (
                    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
                        <div className="w-full max-w-lg rounded-lg">
                            <div className="flex items-center justify-between border-b border-gray-200 p-6">
                                <h3 className="text-lg font-medium text-gray-900">Upload Files</h3>
                                <button onClick={() => setShowUploadModal(false)} className="rounded-lg p-2 transition-colors hover:bg-gray-100">
                                    <X className="h-5 w-5 text-gray-500" />
                                </button>
                            </div>

                            <div className="p-6">
                                <div
                                    className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                                        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                                    }`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    <Upload className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                                    <h4 className="mb-2 text-lg font-medium text-gray-900">Drag and drop files here</h4>
                                    <p className="mb-4 text-gray-500">or</p>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                                    >
                                        Select Files
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        className="hidden"
                                        onChange={(e) => console.log('Files selected:', e.target.files)}
                                    />
                                </div>
                                <p className="mt-4 text-center text-xs text-gray-500">Supported formats: PDF, DOCX, XLSX, JPG, PNG (Max 10MB each)</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* New Folder Modal */}
                {showNewFolderModal && (
                    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
                        <div className="w-full max-w-md rounded-lg">
                            <div className="flex items-center justify-between border-b border-gray-200 p-6">
                                <h3 className="text-lg font-medium text-gray-900">Create New Folder</h3>
                                <button
                                    onClick={() => {
                                        setShowNewFolderModal(false);
                                        setNewFolderName('');
                                        setSelectedIcon('folder');
                                    }}
                                    className="rounded-lg p-2 transition-colors hover:bg-gray-100"
                                >
                                    <X className="h-5 w-5 text-gray-500" />
                                </button>
                            </div>

                            <div className="space-y-4 p-6">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Folder Name</label>
                                    <Input
                                        type="text"
                                        placeholder="Enter folder name"
                                        value={newFolderName}
                                        onChange={(e) => setNewFolderName(e.target.value)}
                                        className="w-full"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                handleCreateFolder();
                                            }
                                        }}
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Folder Icon</label>
                                    <div className="grid max-h-48 grid-cols-5 gap-2 overflow-y-auto rounded-lg border border-gray-200 p-3">
                                        {availableIcons.map((iconOption) => (
                                            <button
                                                key={iconOption.id}
                                                onClick={() => setSelectedIcon(iconOption.id)}
                                                className={`flex flex-col items-center justify-center rounded-lg p-3 transition-colors ${
                                                    selectedIcon === iconOption.id
                                                        ? 'border-2 border-blue-500 bg-blue-100 text-blue-600'
                                                        : 'border border-gray-200 text-gray-600 hover:bg-gray-100'
                                                }`}
                                                title={iconOption.name}
                                            >
                                                {iconOption.icon}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-center rounded-lg bg-gray-50 p-4">
                                    <div className="flex items-center space-x-2">
                                        <div className="text-blue-500">{getFolderIcon(selectedIcon)}</div>
                                        <span className="text-sm font-medium text-gray-700">{newFolderName || 'Folder Name'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end space-x-3 border-t border-gray-200 p-6">
                                <button
                                    onClick={() => {
                                        setShowNewFolderModal(false);
                                        setNewFolderName('');
                                        setSelectedIcon('folder');
                                    }}
                                    className="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateFolder}
                                    disabled={!newFolderName.trim()}
                                    className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Create Folder
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Rename Folder Modal */}
                {renameFolder && (
                    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
                        <div className="w-full max-w-md rounded-lg">
                            <div className="flex items-center justify-between border-b border-gray-200 p-6">
                                <h3 className="text-lg font-medium text-gray-900">Rename Folder</h3>
                                <button onClick={() => setRenameFolder(null)} className="rounded-lg p-2 transition-colors hover:bg-gray-100">
                                    <X className="h-5 w-5 text-gray-500" />
                                </button>
                            </div>

                            <div className="p-6">
                                <label className="mb-2 block text-sm font-medium text-gray-700">Folder Name</label>
                                <Input
                                    type="text"
                                    value={renameFolder.name}
                                    onChange={(e) => setRenameFolder({ ...renameFolder, name: e.target.value })}
                                    className="w-full"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            handleRenameSubmit();
                                        }
                                    }}
                                />
                            </div>

                            <div className="flex items-center justify-end space-x-3 border-t border-gray-200 p-6">
                                <button
                                    onClick={() => setRenameFolder(null)}
                                    className="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRenameSubmit}
                                    disabled={!renameFolder.name.trim()}
                                    className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Rename
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Preview Modal */}
                {previewFile && (
                    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
                        <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-lg">
                            <div className="flex items-center justify-between border-b border-gray-200 p-6">
                                <h3 className="text-lg font-medium text-gray-900">{previewFile.name}</h3>
                                <button onClick={() => setPreviewFile(null)} className="rounded-lg p-2 transition-colors hover:bg-gray-100">
                                    <X className="h-5 w-5 text-gray-500" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-auto p-6">
                                <div className="flex h-96 items-center justify-center rounded-lg bg-gray-50">
                                    {getFileIcon(previewFile.type)}
                                    <div className="ml-4">
                                        <p className="text-lg font-medium text-gray-700">Preview not available</p>
                                        <p className="text-sm text-gray-500">Click download to view the file</p>
                                    </div>
                                </div>
                                <div className="mt-6 grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">File Size</label>
                                        <p className="text-sm text-gray-900">{formatFileSize(previewFile.size)}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Upload Date</label>
                                        <p className="text-sm text-gray-900">{previewFile.uploadDate.toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Uploaded By</label>
                                        <p className="text-sm text-gray-900">{previewFile.uploadedBy}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">File Type</label>
                                        <p className="text-sm text-gray-900">{previewFile.type.toUpperCase()}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-end space-x-3 border-t border-gray-200 p-6">
                                <button
                                    onClick={() => setPreviewFile(null)}
                                    className="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200"
                                >
                                    Close
                                </button>
                                <button className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700">Download</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
};

export default DocumentManagementSystem;
