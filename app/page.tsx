import { redirect } from "next/navigation";

// La home del pannello non ha contenuti propri: si entra sempre dalla
// prima schermata vera (Utenti). AuthProvider (nel layout del gruppo
// "(app)") si occupa di rimandare a /login se non c'è una sessione valida.
export default function RootPage() {
  redirect("/users");
}
