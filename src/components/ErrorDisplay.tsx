import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShadCNWrapper } from "./shadcn/ShadCNWrapper";

const ErrorDisplay = ({
    title,
    description,
    error,
    action,
    actionText = "Try Again",
    severity = "",
    className,
    ...props
}: {
    title: string;
    description: string;
    error: Error;
    action: () => void;
    actionText?: string;
    severity?: string;
    className: string;
}) => {
    const Icon = severity === "error" ? XCircle : AlertCircle;

    return (
        <ShadCNWrapper>
            <div className="flex h-screen w-full items-start justify-center bg-slate-100">
                <div className="flex flex-col items-center justify-center p-20">
                    <div className="flex w-full flex-col items-start">
                        <h1 className="mb-3 text-4xl font-semibold xl:text-5xl">
                            Whoops..
                        </h1>
                        <h2 className="mb-10 text-4xl font-semibold xl:text-5xl">
                            something went wrong..
                        </h2>
                    </div>

                    <Alert
                        variant={
                            severity === "error" ? "destructive" : "default"
                        }
                        className={`w-full max-w-xl bg-white pt-4 ${className}`}
                        {...props}
                    >
                        <Icon className="h-5 w-5 -translate-y-[0.2rem]" />
                        <div className="flex w-full flex-col gap-2">
                            {/* <AlertTitle className="font-medium tracking-tight">
                                {title ||
                                    (severity === "error"
                                        ? "Error"
                                        : "Warning")}
                            </AlertTitle> */}

                            {error && (
                                <AlertDescription className="text-sm font-medium tracking-tight">
                                    {error.message || String(error)}
                                </AlertDescription>
                            )}

                            {action && (
                                <div className="mt-2 flex justify-end">
                                    <Button
                                        variant={
                                            severity === "error"
                                                ? "destructive"
                                                : "default"
                                        }
                                        size="sm"
                                        onClick={action}
                                    >
                                        {actionText}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Alert>
                </div>
            </div>
        </ShadCNWrapper>
    );
};

export default ErrorDisplay;
