import React, {useState} from 'react';
import ReactDOM from 'react-dom';

/*
Year/Series
-> Date
	-> Race 1
	-> Race 2
	-> Race 3
		-> Race Summary
		-> Update Race
			-> Add Helm
				-> Name -> New Helm
				-> Boat -> New Boat
				-> Finish Time
			-> Submit Race
	- Finish Race Day (update series?)

/Spring-2021/2021-12-11/Race-1/
 */

//"/:series/": ({series}) => series,

const Series = () => {
  return (
    <>

    </>
  )
}

const routes = {
  "/:series/*": ({series}) => <Series series = {series}/>,
}

const match = () => {
  return routes["/:series/*"];
}

const AllSeries = () => {
  const match = match("");
  return (
    <>
      {match}
    </>
  );
}

const App = () => {
  const [appState, updateAppState] = useState({});

  return (
    <>

    </>
  );
};

ReactDOM.render(
  <App />,
  document.getElementById("root")
);
