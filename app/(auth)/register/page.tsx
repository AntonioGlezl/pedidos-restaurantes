import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-6 text-2xl font-bold">Crea la página de tu restaurante</h1>
      <RegisterForm />
    </main>
  );
}