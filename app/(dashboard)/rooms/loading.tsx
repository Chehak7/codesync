import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export default function Loading() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <Skeleton className="h-9 w-[150px]" />
                <div className="flex items-center space-x-2">
                    <Skeleton className="h-10 w-[100px]" />
                    <Skeleton className="h-10 w-[120px]" />
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center space-x-2">
                    <Skeleton className="h-10 w-full max-w-sm" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Card key={i} className="flex flex-col h-full">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-[150px]" />
                                    <Skeleton className="h-4 w-[80px]" />
                                </div>
                                <Skeleton className="h-8 w-8 rounded-full" />
                            </CardHeader>
                            <CardContent className="flex-1 mt-4">
                                <Skeleton className="h-4 w-[120px]" />
                            </CardContent>
                            <CardFooter className="flex justify-between items-center border-t pt-4">
                                <Skeleton className="h-4 w-[50px]" />
                                <Skeleton className="h-9 w-[100px]" />
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
