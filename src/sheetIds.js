import { getSheetIdFromURL } from "./common";
const resultsSheetURL = import.meta.env.VITE_RESULTS_SHEET_URL;
export const SHEET_ID = getSheetIdFromURL(resultsSheetURL);
