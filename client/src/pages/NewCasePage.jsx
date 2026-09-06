import { useMediaQuery } from "../hooks/useMediaQuery.js";
import { useNewCaseForm } from "./useNewCaseForm.js";
import { NewCaseWide } from "./NewCaseWide.jsx";
import { NewCaseNarrow } from "./NewCaseNarrow.jsx";

export function NewCasePage() {
  const isWide = useMediaQuery("(min-width: 900px)");
  const formState = useNewCaseForm();

  return isWide ? <NewCaseWide {...formState} /> : <NewCaseNarrow {...formState} />;
}
