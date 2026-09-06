import React, { useState } from "react";
import { AlertTriangle, Mail, Phone, UserRound } from "lucide-react";

import Card from "../../components/common/card/Card";
import Input from "../../components/common/input/Input";
import Button from "../../components/common/button/Button";
import { useToast } from "../../context/ToastContext";

import "./LegalPages.css";

export default function DeleteAccount() {
  const toast = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+971 ");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !phone.trim()) {
      toast.error("Please complete all required fields");
      return;
    }

    toast.success("Account deletion request submitted successfully");

    setName("");
    setEmail("");
    setPhone("+971 ");
  };

  return (
    <div className="legal-page">
      <div className="legal-hero">
        <div>
          <span className="legal-eyebrow">Account & Privacy</span>
          <h1 className="page-title">Delete Account</h1>
          <p className="page-subtitle">
            Submit a request to permanently close your account.
          </p>
        </div>
      </div>

      <Card>
        <div className="delete-account-layout">
          <div className="delete-warning">
            <div className="delete-warning-icon">
              <AlertTriangle size={22} />
            </div>

            <div>
              <h2>Before you submit</h2>
              <p>
                This page submits an account deletion request only. Your data is
                not automatically removed from the backend after submission.
              </p>
            </div>
          </div>

          <form onSubmit={submit} className="delete-form">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              icon={<UserRound size={18} />}
              required
            />

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              icon={<Mail size={18} />}
              required
            />

            <div className="full">
              <Input
                label="Phone Number (UAE)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+971 50 123 4567"
                icon={<Phone size={18} />}
                required
              />
            </div>

            <div className="full delete-form-footer">
              <div className="delete-form-note">
                <strong>Important:</strong>
                <span>
                  Your request may require manual verification by an
                  administrator before any action is taken.
                </span>
              </div>

              <Button type="submit" variant="primary">
                Submit Request
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}