import { FC } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { XCircle } from "lucide-react";

interface ErrorAlertProps {
  error: string;
}

export const ErrorAlert: FC<ErrorAlertProps> = ({ error }) => {
  if (!error) return null;

  return (
    <Alert variant="destructive" className="mx-4 mt-4">
      <XCircle className="h-4 w-4" />
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
};

export default ErrorAlert;
