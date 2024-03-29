import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
// import App from './DND';
import { ChakraProvider, extendTheme, withDefaultColorScheme } from "@chakra-ui/react";
import * as serviceWorker from './serviceWorkerRegistration';
import initArrayAtPolyfill from "./polyfills.js";
import version from "./version.js";
serviceWorker.register();
initArrayAtPolyfill();


const rootElement = document.getElementById("root");
console.log(`Version ${version()}`);

const colors = {
    brand: {
        50: "#ecefff",
        100: "#cbceeb",
        200: "#a9aed6",
        300: "#888ec5",
        400: "#666db3",
        500: "#4d5499",
        600: "#3c4178",
        700: "#2a2f57",
        800: "#181c37",
        900: "#080819"
    }
};

const config = {
    initialColorMode: "light",
    useSystemColorMode: false
};
const theme = extendTheme({ colors, config });
// const theme = extendTheme(withDefaultColorScheme({ colorScheme: 'red' }))

ReactDOM.render(
    <ChakraProvider theme={theme}>
        <App />
    </ChakraProvider>,
    rootElement
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals(console.log);
