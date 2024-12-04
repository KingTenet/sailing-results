import { DatePickerWithPresets } from "./components/ui/DatePickerWithPresets.js";
import { ShadCNWrapper } from "./components/shadcn/ShadCNWrapper.js";

import "./styles.css";

function MainDebug() {
    return (
        <>
            <ShadCNWrapper>
                <DatePickerWithPresets />
            </ShadCNWrapper>
        </>
    );
}

export default MainDebug;
