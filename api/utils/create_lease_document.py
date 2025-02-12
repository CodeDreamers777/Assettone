from io import BytesIO
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image,
)
from reportlab.lib.colors import Color, HexColor


class LeaseDocumentGenerator:
    """
    Generates beautifully styled lease PDFs on-demand with signature
    """

    # Define brand colors
    PRIMARY_COLOR = HexColor("#4CAF50")  # Green
    SECONDARY_COLOR = HexColor("#E8F5E9")  # Light green
    TEXT_COLOR = HexColor("#333333")  # Dark gray
    SUBTEXT_COLOR = HexColor("#666666")  # Medium gray

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
        Generate modern styled PDF with optional signature
        """
        buffer = BytesIO()

        # Create document with custom settings
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=36,
        )

        # Create custom styles
        styles = cls._create_custom_styles()

        # Generate content
        story = []

        # Add header with logo placeholder
        story.extend(cls._generate_header(styles))

        # Add lease content
        story.extend(cls._generate_lease_content(lease, styles))

        # Add lease clauses
        story.extend(cls._generate_lease_clauses(styles))

        # Add signature if provided
        if signature_image:
            story.extend(cls._add_signature_section(signature_image, styles))

        # Add footer
        story.extend(cls._generate_footer(styles))

        # Build PDF
        doc.build(story)
        buffer.seek(0)
        return buffer

    @classmethod
    def _create_custom_styles(cls):
        """Create custom styles for the document"""
        styles = getSampleStyleSheet()

        # Main Title style
        styles.add(
            ParagraphStyle(
                name="MainTitle",
                parent=styles["Title"],
                fontSize=24,
                textColor=cls.PRIMARY_COLOR,
                spaceAfter=30,
                alignment=TA_CENTER,
            )
        )

        # Section Title style
        styles.add(
            ParagraphStyle(
                name="SectionTitle",
                parent=styles["Heading1"],
                fontSize=16,
                textColor=cls.PRIMARY_COLOR,
                spaceBefore=20,
                spaceAfter=10,
            )
        )

        # Clause Title style
        styles.add(
            ParagraphStyle(
                name="ClauseTitle",
                parent=styles["Heading2"],
                fontSize=12,
                textColor=cls.TEXT_COLOR,
                spaceBefore=15,
                spaceAfter=8,
                bold=True,
            )
        )

        # Normal text style
        styles.add(
            ParagraphStyle(
                name="CustomNormal",
                parent=styles["Normal"],
                fontSize=10,
                textColor=cls.TEXT_COLOR,
                alignment=TA_JUSTIFY,
                spaceAfter=12,
            )
        )

        return styles

    @classmethod
    def _generate_header(cls, styles):
        """Generate document header"""
        content = []

        # Add company name/logo
        content.append(Paragraph("ASSETTONE ESTATES", styles["MainTitle"]))

        # Add document title
        content.append(
            Paragraph(
                "RESIDENTIAL LEASE AGREEMENT",
                ParagraphStyle(
                    name="DocumentTitle",
                    parent=styles["MainTitle"],
                    fontSize=18,
                    textColor=cls.TEXT_COLOR,
                    spaceAfter=20,
                ),
            )
        )
        return content

    @classmethod
    def _generate_lease_content(cls, lease, styles):
        """Generate the lease content with modern styling"""
        content = []

        # Create lease details
        details = [
            ["Property", str(lease.unit.property)],
            ["Unit", str(lease.unit)],
            ["Tenant", f"{lease.tenant.first_name} {lease.tenant.last_name}"],
            ["Start Date", lease.start_date.strftime("%B %d, %Y")],
            ["End Date", lease.end_date.strftime("%B %d, %Y")],
            ["Monthly Rent", f"${lease.monthly_rent:,.2f}"],
            ["Security Deposit", f"${lease.security_deposit:,.2f}"],
        ]

        # Create styled table
        table = Table(details, colWidths=[2.5 * inch, 3.5 * inch])
        table.setStyle(
            TableStyle(
                [
                    # Alternate row colors
                    ("BACKGROUND", (0, 0), (0, -1), cls.SECONDARY_COLOR),
                    ("BACKGROUND", (1, 0), (1, -1), colors.white),
                    # Borders
                    ("GRID", (0, 0), (-1, -1), 0.5, cls.PRIMARY_COLOR),
                    # Text styling
                    ("TEXTCOLOR", (0, 0), (-1, -1), cls.TEXT_COLOR),
                    ("FONT", (0, 0), (0, -1), "Helvetica-Bold"),
                    ("FONT", (1, 0), (1, -1), "Helvetica"),
                    # Padding
                    ("PADDING", (0, 0), (-1, -1), 12),
                    # Alignment
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ]
            )
        )

        content.append(table)
        content.append(Spacer(1, 30))
        return content

    @classmethod
    def _generate_lease_clauses(cls, styles):
        """Generate the lease clauses with modern styling"""
        content = []

        content.append(Paragraph("TERMS AND CONDITIONS", styles["SectionTitle"]))
        content.append(Spacer(1, 15))

        for clause in cls.LEASE_CLAUSES:
            content.append(Paragraph(clause["title"], styles["ClauseTitle"]))
            content.append(Paragraph(clause["content"], styles["CustomNormal"]))

        content.append(Spacer(1, 20))

        # Add styled acknowledgment
        acknowledgment = (
            "By signing below, I acknowledge that I have read, understand, and agree to "
            "all terms and conditions outlined in this lease agreement."
        )
        content.append(
            Paragraph(
                acknowledgment,
                ParagraphStyle(
                    name="Acknowledgment",
                    parent=styles["CustomNormal"],
                    textColor=cls.SUBTEXT_COLOR,
                    fontSize=9,
                    alignment=TA_CENTER,
                ),
            )
        )
        content.append(Spacer(1, 30))
        return content

    @classmethod
    def _add_signature_section(cls, signature_image, styles):
        """Add signature section with modern styling"""
        content = []

        content.append(Paragraph("SIGNATURES", styles["SectionTitle"]))
        content.append(Spacer(1, 15))

        # Create signature table
        if signature_image:
            img = Image(signature_image)
            img.drawHeight = 1 * inch
            img.drawWidth = 3 * inch

            signature_data = [
                [Paragraph("Tenant Signature:", styles["CustomNormal"]), img],
                [
                    Paragraph("Date:", styles["CustomNormal"]),
                    Paragraph(
                        datetime.now().strftime("%B %d, %Y"), styles["CustomNormal"]
                    ),
                ],
            ]

            sig_table = Table(signature_data, colWidths=[2 * inch, 4 * inch])
            sig_table.setStyle(
                TableStyle(
                    [
                        ("ALIGN", (0, 0), (0, -1), "RIGHT"),
                        ("ALIGN", (1, 0), (1, -1), "LEFT"),
                        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                        ("PADDING", (0, 0), (-1, -1), 6),
                    ]
                )
            )
            content.append(sig_table)

        return content

    @classmethod
    def _generate_footer(cls, styles):
        """Generate document footer"""
        content = []
        content.append(Spacer(1, 30))

        footer_text = (
            "Assettone Estates | Professional Property Management<br/>"
            "Generated on: " + datetime.now().strftime("%B %d, %Y at %I:%M %p")
        )

        content.append(
            Paragraph(
                footer_text,
                ParagraphStyle(
                    name="Footer",
                    parent=styles["CustomNormal"],
                    textColor=cls.SUBTEXT_COLOR,
                    fontSize=8,
                    alignment=TA_CENTER,
                ),
            )
        )

        return content
