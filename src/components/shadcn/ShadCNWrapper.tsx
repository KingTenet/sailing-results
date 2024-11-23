import { cn } from "./utils/cn";

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
