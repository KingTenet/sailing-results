import { cn } from "@/lib/utils";

export function ShadCNWrapper({
    children,
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("shadcn-root", className)} {...props}>
            {children}
        </div>
    );
}
