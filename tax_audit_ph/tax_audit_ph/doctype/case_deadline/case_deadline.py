from __future__ import annotations

import frappe
from frappe.model.document import Document

from tax_audit_ph.domain import DomainValidationError, validate_deadline_confirmation


class CaseDeadline(Document):
    def validate(self) -> None:
        try:
            validate_deadline_confirmation(
                verification_status=self.verification_status,
                due_at=self.due_at,
                basis_reference=self.basis_reference,
                verified_by=self.verified_by,
                verified_at=self.verified_at,
            )
        except DomainValidationError as exc:
            frappe.throw(str(exc))

