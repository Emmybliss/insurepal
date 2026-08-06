import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Bot, Sliders, Volume2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface AISettingsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AISettingsModal({ open, onOpenChange }: AISettingsModalProps) {
    const [persona, setPersona] = useState('underwriting');
    const [temperature, setTemperature] = useState('0.7');
    const [autoScroll, setAutoScroll] = useState(true);
    const [soundEffects, setSoundEffects] = useState(false);

    const handleSave = () => {
        toast.success('AI preferences saved successfully');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sliders className="h-5 w-5 text-primary" />
                        AI Copilot Preferences
                    </DialogTitle>
                    <DialogDescription>
                        Customize how InsurePal AI behaves and responds to your queries.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2 text-xs">
                    {/* Persona Selector */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">AI Assistant Persona</Label>
                        <Select value={persona} onValueChange={setPersona}>
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="Select persona" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="underwriting">Underwriting Specialist</SelectItem>
                                <SelectItem value="claims">Claims Assessor & Examiner</SelectItem>
                                <SelectItem value="compliance">NAICOM Compliance Auditor</SelectItem>
                                <SelectItem value="reinsurance">Reinsurance & Risk Strategist</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Response Creativity / Temperature */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between">
                            <Label className="text-xs font-semibold">Response Creativity (Temperature)</Label>
                            <span className="font-mono text-muted-foreground">{temperature}</span>
                        </div>
                        <input
                            type="range"
                            min="0.1"
                            max="1.0"
                            step="0.1"
                            value={temperature}
                            onChange={(e) => setTemperature(e.target.value)}
                            className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>Precise & Factual</span>
                            <span>Balanced</span>
                            <span>Creative</span>
                        </div>
                    </div>

                    {/* Auto-Scroll Toggle */}
                    <div className="flex items-center justify-between py-1">
                        <div className="space-y-0.5">
                            <Label className="text-xs font-semibold">Auto-scroll during streaming</Label>
                            <p className="text-[11px] text-muted-foreground">Automatically keep viewport scrolled to latest text</p>
                        </div>
                        <Switch checked={autoScroll} onCheckedChange={setAutoScroll} />
                    </div>

                    {/* Sound Effects */}
                    <div className="flex items-center justify-between py-1">
                        <div className="space-y-0.5">
                            <Label className="text-xs font-semibold flex items-center gap-1">
                                <Volume2 className="h-3.5 w-3.5" />
                                Audio feedback
                            </Label>
                            <p className="text-[11px] text-muted-foreground">Play subtle sound chime when AI completes generation</p>
                        </div>
                        <Switch checked={soundEffects} onCheckedChange={setSoundEffects} />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave}>
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
