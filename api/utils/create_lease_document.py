from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image,
)
from reportlab.lib import colors
from datetime import datetime

from reportlab.lib.enums import TA_CENTER


class LeaseDocumentGenerator:
    """
    Generates lease PDFs on-demand with signature
    """

    @classmethod
    def generate_lease_pdf(cls, lease, signature_image=None):
        """
        Generate PDF with optional signature
        Returns a PDF buffer that can be sent as response
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=18,
        )

        styles = getSampleStyleSheet()
        story = []

        # Add document content
        story.extend(cls._generate_lease_content(lease, styles))

        # Add signature if provided
        if signature_image:
            story.extend(cls._add_signature_section(signature_image, styles))

        # Build PDF
        doc.build(story)
        buffer.seek(0)
        return buffer

    @classmethod
    def _generate_lease_content(cls, lease, styles):
        """Generate the lease content without signature"""
        content = []

        title_style = ParagraphStyle(
            "CustomTitle",
            parent=styles["Title"],
            alignment=TA_CENTER,
            fontSize=16,
            spaceAfter=30,
        )

        # Add title
        content.append(Paragraph("RESIDENTIAL LEASE AGREEMENT", title_style))

        # Add lease details
        details = [
            ["Property", str(lease.unit.property)],
            ["Unit", str(lease.unit)],
            ["Tenant", f"{lease.tenant.first_name} {lease.tenant.last_name}"],
            ["Start Date", lease.start_date.strftime("%B %d, %Y")],
            ["End Date", lease.end_date.strftime("%B %d, %Y")],
            ["Monthly Rent", f"${lease.monthly_rent:,.2f}"],
            ["Security Deposit", f"${lease.security_deposit:,.2f}"],
        ]

        table = Table(details, colWidths=[2 * inch, 4 * inch])
        table.setStyle(
            TableStyle(
                [
                    ("GRID", (0, 0), (-1, -1), 1, colors.black),
                    ("BACKGROUND", (0, 0), (0, -1), colors.lightgrey),
                    ("PADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )

        content.append(table)
        content.append(Spacer(1, 30))

        return content

    @classmethod
    def _add_signature_section(cls, signature_image, styles):
        """Add signature section to the document"""
        content = []

        # Add signature title
        content.append(Paragraph("Signatures", styles["Heading2"]))
        content.append(Spacer(1, 12))

        # Add signature image
        if signature_image:
            img = Image(signature_image)
            img.drawHeight = 1 * inch
            img.drawWidth = 3 * inch
            content.append(img)

        # Add date
        content.append(
            Paragraph(f"Date: {datetime.now().strftime('%B %d, %Y')}", styles["Normal"])
        )

        return content
