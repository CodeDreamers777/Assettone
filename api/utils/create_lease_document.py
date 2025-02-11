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

    # Define lease clauses as class constant
    LEASE_CLAUSES = [
        {
            "title": "1. Term of Lease",
            "content": "The lease term begins on the start date and ends on the end date specified above. This lease cannot be terminated before the end date unless agreed upon in writing by both parties.",
        },
        {
            "title": "2. Rent Payment",
            "content": "Tenant agrees to pay the monthly rent on or before the first day of each month. Late payments may incur additional fees as specified in the payment terms.",
        },
        {
            "title": "3. Security Deposit",
            "content": "The security deposit will be held in accordance with state law and returned within 30 days of move-out, less any deductions for damages or unpaid rent.",
        },
        {
            "title": "4. Utilities",
            "content": "Tenant is responsible for all utility payments including electricity, water, gas, and internet unless otherwise specified in writing.",
        },
        {
            "title": "5. Maintenance and Repairs",
            "content": "Tenant must maintain the unit in good condition and report any necessary repairs promptly. Landlord will handle all major repairs not caused by tenant negligence.",
        },
        {
            "title": "6. Property Use",
            "content": "The property shall be used as a residential dwelling only. Any business use must be approved in writing by the landlord.",
        },
        {
            "title": "7. Occupancy",
            "content": "Only those listed on the lease may occupy the unit. Guests staying longer than 14 days require landlord approval.",
        },
        {
            "title": "8. Pets",
            "content": "No pets are allowed without explicit written permission from the landlord and additional pet deposits if required.",
        },
        {
            "title": "9. Alterations",
            "content": "No alterations, additions, or improvements shall be made to the property without prior written consent from the landlord.",
        },
        {
            "title": "10. Insurance",
            "content": "Tenant is required to maintain renter's insurance throughout the lease term and provide proof of coverage to landlord.",
        },
    ]

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
        # Add lease clauses
        story.extend(cls._generate_lease_clauses(styles))
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
    def _generate_lease_clauses(cls, styles):
        """Generate the lease clauses section"""
        content = []

        # Add clauses heading
        content.append(Paragraph("LEASE TERMS AND CONDITIONS", styles["Heading1"]))
        content.append(Spacer(1, 12))

        # Add each clause
        for clause in cls.LEASE_CLAUSES:
            content.append(Paragraph(clause["title"], styles["Heading2"]))
            content.append(Paragraph(clause["content"], styles["Normal"]))
            content.append(Spacer(1, 12))

        content.append(Spacer(1, 20))

        # Add acknowledgment paragraph
        acknowledgment = (
            "By signing below, I acknowledge that I have read, understand, and agree to "
            "all terms and conditions outlined in this lease agreement, including all "
            "clauses listed above."
        )
        content.append(Paragraph(acknowledgment, styles["Normal"]))
        content.append(Spacer(1, 20))

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
