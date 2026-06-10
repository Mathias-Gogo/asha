import { useOutletContext } from "react-router-dom";
import Asha from "../Asha";

export default function Chat() {
    const context = useOutletContext();
    return <Asha shellContext={context} />;
}