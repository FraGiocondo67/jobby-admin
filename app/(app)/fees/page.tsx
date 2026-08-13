import FeeSettings from "@/components/FeeSettings";

export default function FeesPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Commissione JOBBY</h1>
          <div className="page-subtitle">
            Configurazione mostrata al provider in "La commissione JOBBY" durante l&apos;onboarding, articolata per tipo
            di attività.
          </div>
        </div>
      </div>

      <FeeSettings />
    </div>
  );
}
