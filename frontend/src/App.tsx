import "./App.css";
import { Provider as JotaiProvider } from "jotai";
import { BrowserRouter as Router } from "react-router-dom";

import dayjs from "dayjs";
import weekofyear from "dayjs/plugin/weekOfYear";
import AppContentWrapper from "./AppContentWrapper";

// @ts-ignore
dayjs.extend(window.dayjs_plugin_weekOfYear);

function App() {
	return (
		<Router>
			<JotaiProvider>
				<AppContentWrapper />
			</JotaiProvider>
		</Router>
	);
}

export default App;
