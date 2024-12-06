import { cn } from "@/lib/utils";

interface ShadCNWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export function ShadCNWrapper({
    children,
    className,
    ...props
}: ShadCNWrapperProps) {
    return (
        <div className={cn("shadcn-root", className)} {...props}>
            {children}
        </div>
    );
}
