import CategoriesTable from "@/components/CategoriesTable";

export default function CategoriesPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Categorie</h1>
          <div className="page-subtitle">Attiva/disattiva e modifica le categorie di servizio della app e di jobby-web.</div>
        </div>
      </div>

      <CategoriesTable />
    </div>
  );
}
