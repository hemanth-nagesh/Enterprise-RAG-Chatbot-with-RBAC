# run: pip install reportlab
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import os

def create_pdf(filename, title, content_lines):
    c = canvas.Canvas(filename, pagesize=letter)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(72, 750, title)
    
    c.setFont("Helvetica", 12)
    y_position = 700
    for line in content_lines:
        c.drawString(72, y_position, line)
        y_position -= 20
        if y_position < 72:
            c.showPage()
            c.setFont("Helvetica", 12)
            y_position = 750
            
    c.save()
    print(f"Created {filename}")

if __name__ == "__main__":
    os.makedirs("data/sample_pdfs", exist_ok=True)
    
    # 1. Public Handbook
    create_pdf(
        "data/sample_pdfs/public_employee_handbook.pdf",
        "Employee Handbook (2024)",
        [
            "Welcome to Acme Corp!",
            "All employees are expected to work core hours of 10 AM to 3 PM.",
            "We offer unlimited PTO, subject to manager approval.",
            "Dress code is smart casual. Dogs are allowed in the office on Fridays.",
            "Free lunch is provided in the cafeteria on Tuesdays and Thursdays."
        ]
    )
    
    # 2. Manager Salary Bands
    create_pdf(
        "data/sample_pdfs/manager_salary_bands.pdf",
        "Manager Reference: Engineering Salary Bands 2024",
        [
            "CONFIDENTIAL: FOR MANAGERS ONLY",
            "Software Engineer I (L1): $90,000 - $120,000",
            "Software Engineer II (L2): $120,000 - $160,000",
            "Senior Engineer (L3): $160,000 - $210,000",
            "Staff Engineer (L4): $210,000 - $280,000",
            "Annual bonuses for L1-L4 target 10% of base salary."
        ]
    )
    
    # 3. Executive Compensation
    create_pdf(
        "data/sample_pdfs/executive_compensation.pdf",
        "Executive Compensation & Board Summary 2024",
        [
            "HIGHLY SENSITIVE: EXECUTIVE BOARD ONLY",
            "CEO Base Salary: $850,000",
            "CEO Target Bonus: 150% of base",
            "CEO Equity Grant: $4,500,000 RSU value vesting over 4 years.",
            "VP of Engineering Base Salary: $450,000",
            "VP of Engineering Target Bonus: 75% of base",
            "Potential merger with Globex Corp is targeted for Q4 2024 at a $1.2B valuation."
        ]
    )
