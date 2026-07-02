"use client"

import * as React from "react"
import { AlertCircle, RefreshCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert"

interface ErrorBoundaryProps {
    children: React.ReactNode
}

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
                    <Alert variant="destructive" className="max-w-md">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Something went wrong</AlertTitle>
                        <AlertDescription>
                            An unexpected error occurred. Please try refreshing the page.
                        </AlertDescription>
                        <div className="mt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.location.reload()}
                            >
                                <RefreshCcw className="mr-2 h-4 w-4" />
                                Refresh Page
                            </Button>
                        </div>
                    </Alert>
                </div>
            )
        }

        return this.props.children
    }
}
