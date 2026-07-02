"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface EditorSettingsProps {
    fontSize: number;
    minimap: boolean;
    lineNumbers: "on" | "off" | "relative" | "interval";
    onChange: (settings: { fontSize?: number; minimap?: boolean; lineNumbers?: "on" | "off" }) => void;
}

export function EditorSettings({ fontSize, minimap, lineNumbers, onChange }: EditorSettingsProps) {

    const handleChange = (key: string, value: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        onChange({
            [key]: value
        });
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                    <span className="sr-only">Editor Settings</span>
                </Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Editor Settings</SheetTitle>
                    <SheetDescription>
                        Customize your coding environment.
                    </SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="fontSize" className="text-right">
                            Font Size
                        </Label>
                        <Input
                            id="fontSize"
                            type="number"
                            value={fontSize}
                            onChange={(e) => handleChange("fontSize", parseInt(e.target.value))}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <div className="col-start-2 col-span-3 flex items-center space-x-2">
                            {/* Checkbox primitive expects boolean 'checked' and onCheckedChange */}
                            <Checkbox
                                id="minimap"
                                checked={minimap}
                                onCheckedChange={(checked) => handleChange("minimap", checked)}
                            />
                            <Label htmlFor="minimap">Show Minimap</Label>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="lineNumbers" className="text-right">
                            Line Numbers
                        </Label>
                        <div className="col-span-3">
                            <Select value={lineNumbers} onValueChange={(val) => handleChange("lineNumbers", val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="on">On</SelectItem>
                                    <SelectItem value="off">Off</SelectItem>
                                    <SelectItem value="relative">Relative</SelectItem>
                                    <SelectItem value="interval">Interval</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                <SheetFooter>
                    <SheetClose asChild>
                        <Button type="submit">Close</Button>
                    </SheetClose>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
