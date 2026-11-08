from __future__ import annotations

from frappe.model.document import Document

from tax_audit_ph.domain import validate_case_stage


class AuditCase(Document):
    def validate(self) -> None:
        validate_case_stage(self.current_stage)

