import React from "react";
import Login from "./Login";

interface Props {
	children: JSX.Element;
}

function AuthorizedPage({ children }: Props) {
	const loggedIn = true;

	return loggedIn ? children : <Login />;
}

export default AuthorizedPage;
