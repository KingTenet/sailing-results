import CryptoJS from "crypto-js";

const passphrase = "V2R0a2tZaFRjT2Z0MDlYV0Q5OWJGYlV0czM5TmpRbFBURVFUcmJTazNQRm5VamJLWU1NUGdzdnhEWmsxczVWYWd2M3JXZ1dkWnAxWUZheUFqSnExS3VxTjRRZDRWUmhYOFVSdktrMU9JdkFhQ25lelZWNWlJYTBnTjcyUlFVekR1OEFEQmFZeXhLdmxCWjBIbzJXU1ZVcFNFdDA2SklXWUhXbkJIajdlY0gzTURGeFB"

function encrypt(text) {
    return CryptoJS.AES.encrypt(text, passphrase).toString();
}

function decrypt(ciphertext) {
    const bytes = CryptoJS.AES.decrypt(ciphertext, passphrase);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText;
}

function base64encode(text) {
    return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(text));
}
  
function base64decode(data) {
    return CryptoJS.enc.Base64.parse(data).toString(CryptoJS.enc.Utf8);
}

export function tokenGenerator(object, passphrase) {
    return base64encode(encrypt(JSON.stringify(object)));
}

export function tokenParser(token) {
    return JSON.parse(decrypt(base64decode(token)))
}