import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./components/print/printPreview.css";

createRoot(document.getElementById("root")!).render(<App />);
