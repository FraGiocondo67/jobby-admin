import PendingQueue from "@/components/PendingQueue";
import UsersTable from "@/components/UsersTable";

export default function UsersPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Utenti</h1>
          <div className="page-subtitle">Approvazione provider e gestione generale degli utenti.</div>
        </div>
      </div>

      <PendingQueue />
      <UsersTable />
    </div>
  );
}
