import { getSheetIdFromURL, getGoogleSheetDoc } from "../src/common.js";
import Stores from "../src/store/Stores.js";
import Helm from "../src/store/types/Helm.js";
import auth from "./auth.js";
import StoreWrapper from "../src/store/StoreWrapper.js";
import Result from "../src/store/types/Result.js";

async function mapHelms(sourceResultsURL, seriesResultsURL, outputSheetURL) {
    const sourceResultsSheetId = getSheetIdFromURL(sourceResultsURL);
    const seriesResultsSheetId = getSheetIdFromURL(seriesResultsURL);
    // const outputSheetId = getSheetIdFromURL(outputSheetURL);
    const outputDoc = getGoogleSheetDoc(sourceResultsSheetId, auth.clientEmail, auth.privateKey)
    const stores = await Stores.create(auth, sourceResultsSheetId, seriesResultsSheetId);

    stores.results.map((result) => {
        console.log(Helm.getId(result.getHelm()));
    });
    return;

    // NOTE: this will fail if there's existing objects in the store as Result.fromStore is not implemented correctly (as it is in Stores)
    const newHelms = await StoreWrapper.create("Helms New2", outputDoc, this, Helm, undefined, undefined, true);
    const newResults = await StoreWrapper.create("Pursuit Results New", outputDoc, this, Result, undefined, undefined, true);

    stores.helms.map((helm) => {
        helm.name = helm.duplicates;
        if (!newHelms.has(Helm.getId(helm))) {
            newHelms.add(helm);
        }
    });

    stores.results.map((result) => {
        newResults.add(result);
    });

    await newHelms.sync();
    await newResults.sync();
}

mapHelms(...process.argv.slice(2))
    .then(() => console.log("Finished"))
    .catch((err) => console.log(err));
