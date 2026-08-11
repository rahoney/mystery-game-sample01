import "./styles/main.css";
import { CaseEngine } from "./core/case/CaseEngine";
import { validateCase } from "./core/case/CaseValidator";
import { SaveManager } from "./core/save/SaveManager";
import { case001 } from "./data/cases/case-001";
import { AppShell } from "./ui/AppShell";

const report = validateCase(case001);
if (!report.valid) throw new Error(`Invalid case data:\n${report.errors.join("\n")}`);

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("App root not found");

const save = new SaveManager();
const engine = new CaseEngine(case001, save.load());
new AppShell(root, engine, save).mount();
