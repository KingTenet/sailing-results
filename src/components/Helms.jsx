import HelmSummary from "./shadcn/pages/HelmComparisonPage";
// import { HelmSummaryPage } from "./shadcn/pages/HelmSummaryPage";
import { ShadCNWrapper } from "./shadcn/ShadCNWrapper";

export default function Helms() {
    return (
        <>
            <ShadCNWrapper>
                <HelmSummary />
            </ShadCNWrapper>
        </>
    );
}
