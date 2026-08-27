import { Card } from "@/components/ui/card";
import { NewUserForm } from "./new-user-form";

export default function NewUserPage() {
  return (
    <div className="max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New account</h1>
      </div>
      <Card>
        <NewUserForm />
      </Card>
    </div>
  );
}
