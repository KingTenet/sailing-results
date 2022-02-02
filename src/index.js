import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { ChakraProvider, extendTheme } from "@chakra-ui/react";

const rootElement = document.getElementById("root");

/**
 * Supress tab behaviour
 */
document.addEventListener('keydown', function (event) {
    if (event.keyCode === 9 && event.target.nodeName === 'INPUT') {
        event.preventDefault();
    }
});

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

ReactDOM.render(
    <ChakraProvider theme={theme}>
        <React.StrictMode>
            <App />
        </React.StrictMode>
    </ChakraProvider>,
    rootElement
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals(console.log);
