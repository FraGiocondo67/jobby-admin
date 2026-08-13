import FeeSettings from "@/components/FeeSettings";
import VerticalFees from "@/components/VerticalFees";

export default function FeesPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Commissioni</h1>
          <div className="page-subtitle">
            Markup reale per verticale (addebitato ad ogni prestazione) e testo informativo "La commissione JOBBY"
            mostrato in onboarding.
          </div>
        </div>
      </div>

      <VerticalFees />
      <div style={{ marginTop: 20 }}>
        <FeeSettings />
      </div>
    </div>
  );
}
