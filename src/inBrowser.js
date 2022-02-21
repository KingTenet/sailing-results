const inBrowser = new Function("try {return this===window;}catch(e){ return false;}");
export default inBrowser();