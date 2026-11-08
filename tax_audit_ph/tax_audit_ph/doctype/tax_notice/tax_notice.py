from __future__ import annotations

import frappe
from frappe import _
from frappe.model.document import Document

from tax_audit_ph.domain import validate_notice_type


class TaxNotice(Document):
    def validate(self) -> None:
        validate_notice_type(self.notice_type)
        self._require_private_file()

    def _require_private_file(self) -> None:
        if not self.notice_file:
            return

        is_private = frappe.db.get_value("File", {"file_url": self.notice_file}, "is_private")
        if not is_private:
            frappe.throw(_("Tax notices must be stored as private files."))

