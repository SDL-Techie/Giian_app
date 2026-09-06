import React from "react";
import {
  BadgeCheck,
  FileText,
  RefreshCcw,
  Scale,
} from "lucide-react";

import Card from "../../components/common/card/Card";
import "./LegalPages.css";

export default function TermsConditions() {
  return (
    <div className="legal-page">
      <div className="legal-hero">
        <div>
          <span className="legal-eyebrow">Legal Information</span>
          <h1 className="page-title">Terms & Conditions</h1>
          <p className="page-subtitle">
            Terms governing access and use of the GIIAN business application.
          </p>
        </div>
      </div>

      <Card>
        <div className="legal-content">
          <div className="legal-section">
            <div className="legal-section-icon">
              <BadgeCheck size={20} />
            </div>

            <div>
              <h2>Use of the service</h2>
              <p>
                This business application is provided for authorised business
                operations, including customer, product, purchase, quotation,
                invoice and receipt management. Users must keep their
                credentials secure and use the service only for lawful business
                purposes.
              </p>
            </div>
          </div>

          <div className="legal-section">
            <div className="legal-section-icon">
              <FileText size={20} />
            </div>

            <div>
              <h2>Business data</h2>
              <p>
                Users are responsible for the accuracy of information entered or
                imported into the system. Generated quotations, invoices,
                reports and exports should be reviewed before they are issued
                to customers or used for accounting purposes.
              </p>
            </div>
          </div>

          <div className="legal-section">
            <div className="legal-section-icon">
              <RefreshCcw size={20} />
            </div>

            <div>
              <h2>Availability and changes</h2>
              <p>
                Features, security controls and operational workflows may be
                updated to improve reliability, compliance and usability.
                Access may be restricted when an account is inactive or when
                the assigned role does not grant the required permission.
              </p>
            </div>
          </div>

          <div className="legal-section">
            <div className="legal-section-icon">
              <Scale size={20} />
            </div>

            <div>
              <h2>Contact</h2>
              <p>
                For account or service questions, contact GIIAN IMPEX GENERAL
                TRADING L.L.C through the official business contact channels.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}