import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Download, Maximize2, Sparkles, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Redefine locally for simplicity
type HistoryDetail = {
    id: string;
    taskId: string;
    outputUrls: Array<{ type: 'image' | 'video'; url: string }>;
    modelName: string;
    pageName: string;
    status: string;
    generationTimeMs: number | null;
    settings: {
        style?: string | null;
        mode?: string | null;
        transformationStrength?: number | null;
        skinTextureSize?: number | null;
        detailLevel?: number | null;
        failure_reason?: string;
    };
    createdAt: string;
};

interface HistoryDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: HistoryDetail | null;
}

export function HistoryDetailModal({ isOpen, onClose, item }: HistoryDetailModalProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [meta, setMeta] = useState<{ width?: number; height?: number; size?: string }>({});

    // Reset index when item opens
    useEffect(() => {
        if (isOpen) setSelectedIndex(0);
    }, [isOpen, item]);

    const currentOutput = item?.outputUrls?.[selectedIndex];
    const isVideo = currentOutput?.type === 'video';

    useEffect(() => {
        if (!currentOutput) return;


        setMeta({}); // Reset

        // Get Dimensions
        if (currentOutput.type === 'image') {
            const img = new Image();
            img.src = currentOutput.url;
            img.onload = () => {
                setMeta(prev => ({ ...prev, width: img.naturalWidth, height: img.naturalHeight }));
            };
        } else {
            // Video dimensions via hidden element or just metadata? 
            // Without loading the full video, hard to get dimensions immediately unless we use a hidden video element.
            // For now, let's leave video dimensions or try element.
            const video = document.createElement('video');
            video.src = currentOutput.url;
            video.onloadedmetadata = () => {
                setMeta(prev => ({ ...prev, width: video.videoWidth, height: video.videoHeight }));
            };
        }

        // Get File Size (approx via HEAD)
        fetch(currentOutput.url, { method: 'HEAD' })
            .then(res => {
                const size = res.headers.get('content-length');
                if (size) {
                    const bytes = parseInt(size, 10);
                    const k = 1024;
                    const sizes = ['B', 'KB', 'MB', 'GB'];
                    const i = Math.floor(Math.log(bytes) / Math.log(k));
                    const formatted = parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
                    setMeta(prev => ({ ...prev, size: formatted }));
                }
            })
            .catch(() => { });

    }, [currentOutput]);

    if (!item) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-7xl h-[85vh] bg-[#0c0c0e] border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col lg:flex-row"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-white/10 rounded-full border border-white/10 transition-colors"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>

                        {/* LEFT: Main Preview Area */}
                        <div className="flex-1 relative bg-black/50 flex flex-col">

                            {/* Main Image/Video */}
                            <div className="flex-1 flex items-center justify-center p-8 overflow-hidden relative group">
                                {currentOutput ? (
                                    isVideo ? (
                                        <video
                                            src={currentOutput.url}
                                            controls
                                            autoPlay
                                            loop
                                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                                            playsInline
                                            muted
                                        />
                                    ) : (
                                        <img
                                            src={currentOutput.url}
                                            alt="Output"
                                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-transform duration-500 hover:scale-[1.02]"
                                        />
                                    )
                                ) : (
                                    <div className="text-white/30">No output available</div>
                                )}

                                {/* Navigation Arrows (if multiple) */}
                                {item.outputUrls?.length > 1 && (
                                    <>
                                        <button
                                            onClick={() => setSelectedIndex((prev) => (prev - 1 + item.outputUrls.length) % item.outputUrls.length)}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-white/10 rounded-full border border-white/10 backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <ChevronLeft className="w-6 h-6 text-white" />
                                        </button>
                                        <button
                                            onClick={() => setSelectedIndex((prev) => (prev + 1) % item.outputUrls.length)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-white/10 rounded-full border border-white/10 backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <ChevronRight className="w-6 h-6 text-white" />
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Thumbnails Dock (Bottom) */}
                            <div className="h-24 border-t border-white/10 bg-[#09090b] flex items-center gap-3 px-6 overflow-x-auto custom-scrollbar">
                                {item.outputUrls?.map((output, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedIndex(idx)}
                                        className={cn(
                                            "relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer",
                                            selectedIndex === idx ? "border-[#FFFF00] opacity-100" : "border-transparent opacity-50 hover:opacity-80"
                                        )}
                                    >
                                        {output.type === 'video' ? (
                                            <video src={output.url} className="w-full h-full object-cover pointer-events-none" />
                                        ) : (
                                            <img src={output.url} alt="Thumbnail" className="w-full h-full object-cover" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* RIGHT: Sidebar Details */}
                        <div className="w-full lg:w-[320px] border-t lg:border-t-0 lg:border-l border-white/10 bg-[#0c0c0e] flex flex-col lg:h-full h-1/2 overflow-hidden">
                            <div className="p-6 border-b border-white/5 space-y-4">
                                <div>
                                    <h2 className="text-xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">{item.modelName || "Enhancement"}</h2>
                                    <div className="flex items-center gap-2 mt-2 text-xs text-white/50">
                                        <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5">{new Date(item.createdAt).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span className="uppercase tracking-wider">{item.status}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 w-full">
                                    {item.status !== 'failed' && currentOutput && (
                                        <button
                                            onClick={() => {
                                                if (!currentOutput) return;
                                                const link = document.createElement('a');
                                                link.href = currentOutput.url;
                                                link.download = `sharpii-${item.id}`;
                                                link.target = "_blank";
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                            }}
                                            className="flex-1 bg-white text-black font-semibold h-10 rounded-md hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-sm"
                                        >
                                            <Download className="w-4 h-4" /> Download
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                {item.status === 'failed' && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                        <h3 className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                            <AlertCircle className="w-3 h-3" /> Failed
                                        </h3>
                                        <p className="text-xs text-red-200/80 leading-relaxed">
                                            {item.settings?.failure_reason || "Unknown error occurred during processing."}
                                        </p>
                                    </div>
                                )}
                                {/* Settings Group */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest flex items-center gap-2">
                                        <Sparkles className="w-3 h-3" /> configuration
                                    </h3>
                                    <div className="grid gap-3">
                                        <DetailRow label="Style" value={item.settings?.style} />
                                        <DetailRow label="Mode" value={item.settings?.mode} />
                                        <DetailRow label="Texture Size" value={item.settings?.skinTextureSize} />
                                        <DetailRow label="Detail Level" value={item.settings?.detailLevel} />
                                        <DetailRow label="Strength" value={item.settings?.transformationStrength} />
                                    </div>
                                </div>

                                {/* Metadata Group */}
                                <div className="space-y-3 pt-4 border-t border-white/5">
                                    <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest">Metadata</h3>
                                    <div className="grid gap-3">
                                        <div className="grid gap-3">
                                            <DetailRow label="Task ID" value={item.taskId} mono />
                                            <DetailRow label="Time" value={item.generationTimeMs ? `${(item.generationTimeMs / 1000).toFixed(2)}s` : null} />
                                            <DetailRow label="Source" value={item.pageName} />
                                            {meta.width && meta.height && (
                                                <DetailRow label="Dimensions" value={`${meta.width} x ${meta.height}`} mono />
                                            )}
                                            {meta.size && (
                                                <DetailRow label="File Size" value={meta.size} mono />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

function DetailRow({ label, value, mono = false }: { label: string, value: any, mono?: boolean }) {
    if (!value) return null;
    return (
        <div className="flex justify-between items-start group">
            <span className="text-sm text-white/50 group-hover:text-white/70 transition-colors">{label}</span>
            <span className={cn(
                "text-sm text-white/90 font-medium text-right max-w-[180px] break-words",
                mono && "font-mono text-xs text-white/70"
            )}>
                {value}
            </span>
        </div>
    )
}
