import React from "react";
import {
  Database,
  FileLock2,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";

import Card from "../../components/common/card/Card";
import "./LegalPages.css";

export default function PrivacyPolicy() {
  return (
    <div className="legal-page">
      <div className="legal-hero">
        <div>
          <span className="legal-eyebrow">Legal & Privacy</span>
          <h1 className="page-title">Privacy Policy</h1>
          <p className="page-subtitle">
            How business and account information is processed and protected.
          </p>
        </div>
      </div>

      <Card>
        <div className="legal-content">
          <div className="legal-section">
            <div className="legal-section-icon">
              <Database size={20} />
            </div>

            <div>
              <h2>Information processed</h2>
              <p>
                The application may process account details, customer and
                supplier information, product data, uploaded documents,
                quotations, invoices, receipts and operational reports required
                to provide the service.
              </p>
            </div>
          </div>

          <div className="legal-section">
            <div className="legal-section-icon">
              <UserRoundCheck size={20} />
            </div>

            <div>
              <h2>Purpose</h2>
              <p>
                Information is used to operate the CRM, authenticate users,
                apply permissions, maintain business records, generate
                documents and support authorised import/export workflows.
              </p>
            </div>
          </div>

          <div className="legal-section">
            <div className="legal-section-icon">
              <ShieldCheck size={20} />
            </div>

            <div>
              <h2>Storage and security</h2>
              <p>
                Access is protected through authenticated sessions and role
                permissions. Product images may be stored through the configured
                Cloudinary account, while supported business documents may be
                stored by the configured backend storage system.
              </p>
            </div>
          </div>

          <div className="legal-section">
            <div className="legal-section-icon">
              <FileLock2 size={20} />
            </div>

            <div>
              <h2>Requests</h2>
              <p>
                Users may contact the organisation regarding account
                information. The Delete Account page in this application is
                currently a request-form interface only and does not
                automatically delete backend data.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}