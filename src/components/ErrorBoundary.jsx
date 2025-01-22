import React from "react";
import ErrorDisplay from "./ErrorDisplay";
import { useServices } from "@/useAppState";

class ErrorBoundary extends React.Component {
    constructor({ props }) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error: error };
    }

    componentDidCatch(error, errorInfo) {
        // Log the error to an error reporting service here
        console.error("Error caught by boundary:", error, errorInfo);
        this.props.services.logError(error);
    }

    render() {
        if (this.state.hasError) {
            return (
                <ErrorDisplay
                    title={this.state.error.message}
                    description={this.state.error.message}
                    error={this.state.error}
                />
            );
        }

        return this.props.children;
    }
}

function WrappedErrorBoundary({ children }) {
    const services = useServices();

    return <ErrorBoundary services={services}>{children}</ErrorBoundary>;
}

export default WrappedErrorBoundary;
