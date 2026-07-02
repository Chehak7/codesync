"use client"

import * as React from "react"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

interface Step {
    target: string
    title: string
    content: string
    side?: "top" | "bottom" | "left" | "right"
}

const steps: Step[] = [
    {
        target: "[data-tour='file-explorer']",
        title: "File Explorer",
        content: "Manage your project files here. You can create, delete, and organize your code.",
        side: "right"
    },
    {
        target: "[data-tour='editor']",
        title: "Code Editor",
        content: "Write and edit code in real-time with your team. Changes are synced instantly.",
        side: "bottom"
    },
    {
        target: "[data-tour='chat']",
        title: "Real-time Chat",
        content: "Communicate with your collaborators without leaving the editor.",
        side: "left"
    },
    {
        target: "[data-tour='vcs']",
        title: "Version Control",
        content: "Track changes, create versions, and restore previous states easily.",
        side: "left"
    }
]

export function OnboardingTour() {
    const [currentStep, setCurrentStep] = React.useState(0)
    const [open, setOpen] = React.useState(false)
    const [targetElement, setTargetElement] = React.useState<HTMLElement | null>(null)

    React.useEffect(() => {
        const hasSeenTour = localStorage.getItem("has-seen-onboarding")
        if (!hasSeenTour) {
            setTimeout(() => setOpen(true), 2000)
        }
    }, [])

    React.useEffect(() => {
        if (open) {
            const el = document.querySelector(steps[currentStep].target) as HTMLElement
            setTargetElement(el)
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" })
            }
        } else {
            setTargetElement(null)
        }
    }, [open, currentStep])

    const next = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1)
        } else {
            finish()
        }
    }

    const prev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1)
        }
    }

    const finish = () => {
        setOpen(false)
        localStorage.setItem("has-seen-onboarding", "true")
    }

    if (!targetElement && open) {
        // If target not found, try next or just wait
        return null
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div className="fixed inset-0 pointer-events-none z-50">
                    {targetElement && open && (
                        <div
                            className="absolute rounded-md ring-2 ring-primary ring-offset-2 transition-all duration-300"
                            style={{
                                top: targetElement.getBoundingClientRect().top,
                                left: targetElement.getBoundingClientRect().left,
                                width: targetElement.getBoundingClientRect().width,
                                height: targetElement.getBoundingClientRect().height,
                            }}
                        />
                    )}
                </div>
            </PopoverTrigger>
            <PopoverContent
                className="w-80 z-50"
                side={steps[currentStep].side}
                style={{
                    position: 'fixed',
                    top: targetElement ? targetElement.getBoundingClientRect().bottom + 10 : '50%',
                    left: targetElement ? targetElement.getBoundingClientRect().left : '50%',
                }}
            >
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{steps[currentStep].title}</h4>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={finish} aria-label="Close tour">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {steps[currentStep].content}
                    </p>
                    <div className="flex items-center justify-between pt-2">
                        <div className="text-xs text-muted-foreground font-medium">
                            Step {currentStep + 1} of {steps.length}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={prev}
                                disabled={currentStep === 0}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Prev
                            </Button>
                            <Button size="sm" onClick={next}>
                                {currentStep === steps.length - 1 ? "Finish" : "Next"}
                                {currentStep < steps.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
