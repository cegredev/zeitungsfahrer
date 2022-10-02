import { useAtom } from "jotai";
import { authTokenAtom } from "../stores/utility.store";
import Login from "./Login";

interface Props {
	children: JSX.Element;
}

function AuthorizedPage({ children }: Props) {
	const [token] = useAtom(authTokenAtom);

	const loggedIn = token !== undefined;

	return loggedIn ? children : <Login />;
}

export default AuthorizedPage;
