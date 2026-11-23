import os
import sys
import hashlib
from datetime import datetime

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from bson import ObjectId
from database import get_db
from models.schemas import (
    EMPLOYEES_COL, BRANDS_COL, PROCESSES_COL, PODS_COL,
    ASSIGNMENTS_COL, AVAILABILITY_COL, HOLIDAYS_COL,
    ROSTERS_COL, CONFLICTS_COL, AUDIT_LOGS_COL, USERS_COL
)

def hash_password(password: str) -> str:
    # Deterministic SHA-256 with salt for demonstration and test consistency
    salt = "datastraw_roster_salt_2026"
    return hashlib.sha256((salt + password).encode('utf-8')).hexdigest()

def seed_database():
    db = get_db()
    print("Starting database seeding...")

    # Clear existing data to ensure idempotency
    for col in [EMPLOYEES_COL, BRANDS_COL, PROCESSES_COL, PODS_COL,
                ASSIGNMENTS_COL, AVAILABILITY_COL, HOLIDAYS_COL,
                ROSTERS_COL, CONFLICTS_COL, AUDIT_LOGS_COL, USERS_COL]:
        db[col].delete_many({})

    # 1. Create Operational Pods
    pod_alpha_id = ObjectId()
    pod_beta_id = ObjectId()
    pod_gamma_id = ObjectId()
    pod_delta_id = ObjectId()

    # 2. Employees (32 Employees)
    # Define IDs for key individuals
    emp_priya_id = ObjectId()    # Pod Lead Alpha
    emp_amit_id = ObjectId()     # Pod Lead Beta
    emp_sneha_id = ObjectId()    # Pod Lead Gamma
    emp_rahul_id = ObjectId()    # Pod Lead Delta & Brand 1 dedicated
    emp_rohan_id = ObjectId()
    emp_ananya_id = ObjectId()
    emp_vikram_id = ObjectId()
    emp_pooja_id = ObjectId()
    emp_kunal_id = ObjectId()
    emp_neha_id = ObjectId()
    emp_aditya_id = ObjectId()
    emp_divya_id = ObjectId()
    emp_harsh_id = ObjectId()
    emp_tarun_id = ObjectId()
    emp_ritu_id = ObjectId()
    emp_manish_id = ObjectId()

    employees_data = [
        # Pod Leads
        {
            "_id": emp_priya_id,
            "employee_id": "EMP-001",
            "full_name": "Priya Sharma",
            "email": "priya.sharma@datastraw.in",
            "phone": "+91 98201 11223",
            "designation": "Team Lead & Senior Operations Specialist",
            "pod_id": pod_alpha_id,
            "role": "POD_LEAD",
            "employment_status": "Full-time",
            "date_of_joining": "2024-01-15",
            "skills": ["Customer Support", "Abandoned Cart", "NDR", "Escalations"],
            "preferred_weekly_off": ["Sunday"],
            "is_active": True,
            "created_at": datetime.now()
        },
        {
            "_id": emp_amit_id,
            "employee_id": "EMP-002",
            "full_name": "Amit Patel",
            "email": "amit.patel@datastraw.in",
            "phone": "+91 98201 22334",
            "designation": "Team Lead & E-commerce Operations Lead",
            "pod_id": pod_beta_id,
            "role": "POD_LEAD",
            "employment_status": "Full-time",
            "date_of_joining": "2024-02-01",
            "skills": ["Abandoned Cart", "Retention", "NDR", "Analytics"],
            "preferred_weekly_off": ["Sunday"],
            "is_active": True,
            "created_at": datetime.now()
        },
        {
            "_id": emp_sneha_id,
            "employee_id": "EMP-003",
            "full_name": "Sneha Rao",
            "email": "sneha.rao@datastraw.in",
            "phone": "+91 98201 33445",
            "designation": "Team Lead & CX Operations",
            "pod_id": pod_gamma_id,
            "role": "POD_LEAD",
            "employment_status": "Full-time",
            "date_of_joining": "2024-03-10",
            "skills": ["Customer Support", "Retention", "Logistics NDR"],
            "preferred_weekly_off": ["Sunday"],
            "is_active": True,
            "created_at": datetime.now()
        },
        {
            "_id": emp_rahul_id,
            "employee_id": "EMP-004",
            "full_name": "Rahul Verma",
            "email": "rahul.verma@datastraw.in",
            "phone": "+91 98201 44556",
            "designation": "Operations Specialist (Dedicated D2C)",
            "pod_id": pod_delta_id,
            "role": "POD_LEAD",
            "employment_status": "Full-time",
            "date_of_joining": "2024-01-20",
            "skills": ["Customer Support", "Abandoned Cart", "NDR", "Retention"],
            "preferred_weekly_off": ["Sunday"],
            "is_active": True,
            "created_at": datetime.now()
        },
        # Dedicated Brand Managers (Single Resource Brands - approx 80%)
        {
            "_id": emp_rohan_id,
            "employee_id": "EMP-005",
            "full_name": "Rohan Mehta",
            "email": "rohan.mehta@datastraw.in",
            "phone": "+91 98201 55667",
            "designation": "Operations Associate",
            "pod_id": pod_alpha_id,
            "role": "OPERATIONS_ASSOCIATE",
            "employment_status": "Full-time",
            "date_of_joining": "2024-04-01",
            "skills": ["Customer Support", "Abandoned Cart", "NDR"],
            "preferred_weekly_off": ["Sunday"],
            "is_active": True,
            "created_at": datetime.now()
        },
        {
            "_id": emp_ananya_id,
            "employee_id": "EMP-006",
            "full_name": "Ananya Iyer",
            "email": "ananya.iyer@datastraw.in",
            "phone": "+91 98201 66778",
            "designation": "Operations Associate",
            "pod_id": pod_gamma_id,
            "role": "OPERATIONS_ASSOCIATE",
            "employment_status": "Full-time",
            "date_of_joining": "2024-05-15",
            "skills": ["Customer Support", "Abandoned Cart", "Retention"],
            "preferred_weekly_off": ["Sunday"],
            "is_active": True,
            "created_at": datetime.now()
        },
        {
            "_id": emp_vikram_id,
            "employee_id": "EMP-007",
            "full_name": "Vikram Malhotra",
            "email": "vikram.malhotra@datastraw.in",
            "phone": "+91 98201 77889",
            "designation": "Operations Associate",
            "pod_id": pod_gamma_id,
            "role": "OPERATIONS_ASSOCIATE",
            "employment_status": "Full-time",
            "date_of_joining": "2024-06-01",
            "skills": ["Customer Support", "NDR", "Logistics"],
            "preferred_weekly_off": ["Sunday"],
            "is_active": True,
            "created_at": datetime.now()
        },
        {
            "_id": emp_pooja_id,
            "employee_id": "EMP-008",
            "full_name": "Pooja Desai",
            "email": "pooja.desai@datastraw.in",
            "phone": "+91 98201 88990",
            "designation": "Senior Operations Associate",
            "pod_id": pod_delta_id,
            "role": "OPERATIONS_ASSOCIATE",
            "employment_status": "Full-time",
            "date_of_joining": "2024-03-01",
            "skills": ["Customer Support", "Abandoned Cart", "NDR"],
            "preferred_weekly_off": ["Sunday"],
            "is_active": True,
            "created_at": datetime.now()
        },
        {
            "_id": emp_kunal_id,
            "employee_id": "EMP-009",
            "full_name": "Kunal Kapoor",
            "email": "kunal.kapoor@datastraw.in",
            "phone": "+91 98201 99001",
            "designation": "Operations Associate",
            "pod_id": pod_delta_id,
            "role": "OPERATIONS_ASSOCIATE",
            "employment_status": "Full-time",
            "date_of_joining": "2024-07-15",
            "skills": ["Customer Support", "Abandoned Cart", "Retention"],
            "preferred_weekly_off": ["Sunday"],
            "is_active": True,
            "created_at": datetime.now()
        },
        {
            "_id": emp_neha_id,
            "employee_id": "EMP-010",
            "full_name": "Neha Joshi",
            "email": "neha.joshi@datastraw.in",
            "phone": "+91 98201 00112",
            "designation": "Operations Associate",
            "pod_id": pod_beta_id,
            "role": "OPERATIONS_ASSOCIATE",
            "employment_status": "Full-time",
            "date_of_joining": "2024-05-01",
            "skills": ["Customer Support", "Abandoned Cart", "NDR"],
            "preferred_weekly_off": ["Sunday"],
            "is_active": True,
            "created_at": datetime.now()
        },
        {
            "_id": emp_aditya_id,
            "employee_id": "EMP-011",
            "full_name": "Aditya Roy",
            "email": "aditya.roy@datastraw.in",
            "phone": "+91 98201 11335",
            "designation": "Operations Associate",
            "pod_id": pod_beta_id,
            "role": "OPERATIONS_ASSOCIATE",
            "employment_status": "Full-time",
            "date_of_joining": "2024-08-01",
            "skills": ["Customer Support", "NDR", "Escalations"],
            "preferred_weekly_off": ["Sunday"],
            "is_active": True,
            "created_at": datetime.now()
        },
        {
            "_id": emp_divya_id,
            "employee_id": "EMP-012",
            "full_name": "Divya Nair",
            "email": "divya.nair@datastraw.in",
            "phone": "+91 98201 22446",
            "designation": "Senior Operations Associate",
            "pod_id": pod_alpha_id,
            "role": "OPERATIONS_ASSOCIATE",
            "employment_status": "Full-time",
            "date_of_joining": "2024-02-15",
            "skills": ["Customer Support", "Abandoned Cart", "NDR"],
            "preferred_weekly_off": ["Sunday"],
            "is_active": True,
            "created_at": datetime.now()
        },
        {
            "_id": emp_harsh_id,
            "employee_id": "EMP-013",
            "full_name": "Harshvardhan Singh",
            "email": "harsh.singh@datastraw.in",
            "phone": "+91 98201 33557",
            "designation": "Operations Associate",
            "pod_id": pod_gamma_id,
            "role": "OPERATIONS_ASSOCIATE",
            "employment_status": "Full-time",
            "date_of_joining": "2024-06-20",
            "skills": ["Customer Support", "Retention"],
            "preferred_weekly_off": ["Sunday"],
            "is_active": True,
            "created_at": datetime.now()
        },
        # Multi-employee Brand Specialists
        {
            "_id": emp_tarun_id,
            "employee_id": "EMP-014",
            "full_name": "Tarun Khanna",
            "email": "tarun.khanna@datastraw.in",
            "phone": "+91 98201 44668",
            "designation": "Customer Support Specialist",
            "pod_id": pod_gamma_id,
            "role": "OPERATIONS_ASSOCIATE",
            "employment_status": "Full-time",
            "date_of_joining": "2024-04-10",
            "skills": ["Customer Support", "Live Chat", "Email Support"],
            "preferred_weekly_off": ["Sunday"],
            "is_active": True,
            "created_at": datetime.now()
        },
        {
            "_id": emp_ritu_id,
            "employee_id": "EMP-015",
            "full_name": "Ritu Sen",
            "email": "ritu.sen@datastraw.in",
            "phone": "+91 98201 55779",
            "designation": "Customer Support Specialist",
            "pod_id": pod_gamma_id,
            "role": "OPERATIONS_ASSOCIATE",
            "employment_status": "Full-time",
            "date_of_joining": "2024-07-01",
            "skills": ["Customer Support", "Ticket Resolution"],
            "preferred_weekly_off": ["Saturday"],
            "is_active": True,
            "created_at": datetime.now()
        },
        {
            "_id": emp_manish_id,
            "employee_id": "EMP-016",
            "full_name": "Manish Reddy",
            "email": "manish.reddy@datastraw.in",
            "phone": "+91 98201 66880",
            "designation": "Retention Specialist",
            "pod_id": pod_gamma_id,
            "role": "OPERATIONS_ASSOCIATE",
            "employment_status": "Full-time",
            "date_of_joining": "2024-03-25",
            "skills": ["Retention", "Customer Loyalty", "Abandoned Cart"],
            "preferred_weekly_off": ["Sunday"],
            "is_active": True,
            "created_at": datetime.now()
        }
    ]

    # Add employees EMP-017 through EMP-032 (total 32 employees)
    additional_names = [
        ("Kavita Menon", "kavita.menon", pod_alpha_id, ["Customer Support", "NDR"]),
        ("Deepak Chawla", "deepak.chawla", pod_alpha_id, ["Abandoned Cart", "Retention"]),
        ("Sunita Bansal", "sunita.bansal", pod_alpha_id, ["Customer Support", "Abandoned Cart"]),
        ("Arjun Singhania", "arjun.singhania", pod_beta_id, ["Customer Support", "NDR"]),
        ("Meera Nambiar", "meera.nambiar", pod_beta_id, ["Abandoned Cart", "Customer Support"]),
        ("Nikhil Bhatia", "nikhil.bhatia", pod_beta_id, ["NDR", "Retention"]),
        ("Shreya Mukherjee", "shreya.mukherjee", pod_beta_id, ["Customer Support", "Retention"]),
        ("Gaurav Saxena", "gaurav.saxena", pod_gamma_id, ["Customer Support", "NDR"]),
        ("Ishita Goswami", "ishita.goswami", pod_gamma_id, ["Abandoned Cart", "Customer Support"]),
        ("Varun Chopra", "varun.chopra", pod_delta_id, ["Customer Support", "Abandoned Cart", "NDR"]),
        ("Payal Agarwal", "payal.agarwal", pod_delta_id, ["Customer Support", "Retention"]),
        ("Siddharth Jain", "siddharth.jain", pod_delta_id, ["NDR", "Customer Support"]),
        ("Tanvi Kulkarni", "tanvi.kulkarni", pod_alpha_id, ["Customer Support", "Retention"]),
        ("Abhishek Tiwari", "abhishek.tiwari", pod_beta_id, ["Abandoned Cart", "NDR"]),
        ("Zoya Khan", "zoya.khan", pod_gamma_id, ["Customer Support", "Abandoned Cart"]),
        ("Ramesh Kulkarni", "ramesh.kulkarni", pod_delta_id, ["Customer Support", "NDR"])
    ]

    for idx, (name, email_prefix, pod_id, skills) in enumerate(additional_names, start=17):
        emp_id = ObjectId()
        employees_data.append({
            "_id": emp_id,
            "employee_id": f"EMP-{idx:03d}",
            "full_name": name,
            "email": f"{email_prefix}@datastraw.in",
            "phone": f"+91 98201 {idx:02d}999",
            "designation": "Operations Associate",
            "pod_id": pod_id,
            "role": "OPERATIONS_ASSOCIATE",
            "employment_status": "Full-time",
            "date_of_joining": "2024-05-10",
            "skills": skills,
            "preferred_weekly_off": ["Sunday"] if idx % 2 == 0 else ["Saturday"],
            "is_active": True,
            "created_at": datetime.now()
        })

    db[EMPLOYEES_COL].insert_many(employees_data)
    print(f"Inserted {len(employees_data)} employees.")

    # 3. Create Pods
    pods_data = [
        {
            "_id": pod_alpha_id,
            "pod_id": "POD-001",
            "name": "Alpha Pod - D2C Beauty & Personal Care",
            "pod_lead_id": emp_priya_id,
            "assigned_employees": [emp_priya_id, emp_rohan_id, emp_divya_id],
            "assigned_brands": [],
            "is_active": True
        },
        {
            "_id": pod_beta_id,
            "pod_id": "POD-002",
            "name": "Beta Pod - D2C Electronics & Gadgets",
            "pod_lead_id": emp_amit_id,
            "assigned_employees": [emp_amit_id, emp_neha_id, emp_aditya_id],
            "assigned_brands": [],
            "is_active": True
        },
        {
            "_id": pod_gamma_id,
            "pod_id": "POD-003",
            "name": "Gamma Pod - D2C Fashion & Apparel",
            "pod_lead_id": emp_sneha_id,
            "assigned_employees": [emp_sneha_id, emp_ananya_id, emp_vikram_id, emp_harsh_id, emp_tarun_id, emp_ritu_id, emp_manish_id],
            "assigned_brands": [],
            "is_active": True
        },
        {
            "_id": pod_delta_id,
            "pod_id": "POD-004",
            "name": "Delta Pod - D2C Health & Gourmet Food",
            "pod_lead_id": emp_rahul_id,
            "assigned_employees": [emp_rahul_id, emp_pooja_id, emp_kunal_id],
            "assigned_brands": [],
            "is_active": True
        }
    ]
    db[PODS_COL].insert_many(pods_data)
    print(f"Inserted {len(pods_data)} pods.")

    # 4. Brands (12 Brands)
    # 80% single-resource, 20% multi-resource
    brd_ecoglow_id = ObjectId()
    brd_pureskin_id = ObjectId()
    brd_velvet_id = ObjectId()
    brd_urban_id = ObjectId()
    brd_nutrifuel_id = ObjectId()
    brd_ketobites_id = ObjectId()
    brd_audiopulse_id = ObjectId()
    brd_smartcharge_id = ObjectId()
    brd_luxehome_id = ObjectId()
    brd_glowjewel_id = ObjectId()
    brd_volttech_id = ObjectId()   # Multi-resource (3 employees)
    brd_zenith_id = ObjectId()     # Multi-resource (3 employees)

    brands_data = [
        # Brand 1: EcoGlow (Dedicated single employee: Rahul Verma, 365 days)
        {
            "_id": brd_ecoglow_id,
            "brand_id": "BRD-001",
            "name": "EcoGlow Skincare",
            "description": "Premium organic skincare D2C brand requiring 24/7 client coverage.",
            "client_status": "Active",
            "pod_id": pod_delta_id,
            "operating_calendar": "365_DAYS",
            "public_holiday_policy": "WORK_ON_HOLIDAYS",
            "minimum_coverage_requirements": 1,
            "is_active": True
        },
        # Brand 2: PureSkin Naturals (Dedicated: Rohan Mehta, Daily ex holidays)
        {
            "_id": brd_pureskin_id,
            "brand_id": "BRD-002",
            "name": "PureSkin Naturals",
            "description": "Clean beauty and cosmetics brand with daily operations.",
            "client_status": "Active",
            "pod_id": pod_alpha_id,
            "operating_calendar": "DAILY_EXCLUDING_HOLIDAYS",
            "public_holiday_policy": "OFF_ON_HOLIDAYS",
            "minimum_coverage_requirements": 1,
            "is_active": True
        },
        # Brand 3: Velvet Thread (Dedicated: Ananya Iyer, Mon-Sat ex holidays)
        {
            "_id": brd_velvet_id,
            "brand_id": "BRD-003",
            "name": "Velvet Thread Apparel",
            "description": "Sustainable ethnic fashion brand. Closed on Sundays & public holidays.",
            "client_status": "Active",
            "pod_id": pod_gamma_id,
            "operating_calendar": "MON_SAT_EXCLUDING_HOLIDAYS",
            "public_holiday_policy": "OFF_ON_HOLIDAYS",
            "minimum_coverage_requirements": 1,
            "is_active": True
        },
        # Brand 4: UrbanStyle Footwear (Dedicated: Vikram Malhotra, Mon-Sat)
        {
            "_id": brd_urban_id,
            "brand_id": "BRD-004",
            "name": "UrbanStyle Footwear",
            "description": "Footwear D2C brand operating six days a week.",
            "client_status": "Active",
            "pod_id": pod_gamma_id,
            "operating_calendar": "MON_SAT_EXCLUDING_HOLIDAYS",
            "public_holiday_policy": "OFF_ON_HOLIDAYS",
            "minimum_coverage_requirements": 1,
            "is_active": True
        },
        # Brand 5: NutriFuel Organics (Dedicated: Pooja Desai, 365 days)
        {
            "_id": brd_nutrifuel_id,
            "brand_id": "BRD-005",
            "name": "NutriFuel Organics",
            "description": "Plant-based supplements with high weekend order volumes.",
            "client_status": "Active",
            "pod_id": pod_delta_id,
            "operating_calendar": "365_DAYS",
            "public_holiday_policy": "WORK_ON_HOLIDAYS",
            "minimum_coverage_requirements": 1,
            "is_active": True
        },
        # Brand 6: KetoBites Gourmet (Dedicated: Kunal Kapoor, Daily ex holidays)
        {
            "_id": brd_ketobites_id,
            "brand_id": "BRD-006",
            "name": "KetoBites Gourmet",
            "description": "Artisan keto snacks and pantry staples.",
            "client_status": "Active",
            "pod_id": pod_delta_id,
            "operating_calendar": "DAILY_EXCLUDING_HOLIDAYS",
            "public_holiday_policy": "OFF_ON_HOLIDAYS",
            "minimum_coverage_requirements": 1,
            "is_active": True
        },
        # Brand 7: AudioPulse Acoustics (Dedicated: Neha Joshi, Daily ex holidays)
        {
            "_id": brd_audiopulse_id,
            "brand_id": "BRD-007",
            "name": "AudioPulse Acoustics",
            "description": "Wireless earbuds and audio equipment with daily customer support.",
            "client_status": "Active",
            "pod_id": pod_beta_id,
            "operating_calendar": "DAILY_EXCLUDING_HOLIDAYS",
            "public_holiday_policy": "OFF_ON_HOLIDAYS",
            "minimum_coverage_requirements": 1,
            "is_active": True
        },
        # Brand 8: SmartCharge Electronics (Dedicated: Aditya Roy, Mon-Sat)
        {
            "_id": brd_smartcharge_id,
            "brand_id": "BRD-008",
            "name": "SmartCharge Tech",
            "description": "GaN chargers and mobile power accessories.",
            "client_status": "Active",
            "pod_id": pod_beta_id,
            "operating_calendar": "MON_SAT_EXCLUDING_HOLIDAYS",
            "public_holiday_policy": "OFF_ON_HOLIDAYS",
            "minimum_coverage_requirements": 1,
            "is_active": True
        },
        # Brand 9: LuxeHome Decor (Dedicated: Divya Nair, 365 days)
        {
            "_id": brd_luxehome_id,
            "brand_id": "BRD-009",
            "name": "LuxeHome Decor",
            "description": "Modern home furnishings with continuous live chat requirements.",
            "client_status": "Active",
            "pod_id": pod_alpha_id,
            "operating_calendar": "365_DAYS",
            "public_holiday_policy": "WORK_ON_HOLIDAYS",
            "minimum_coverage_requirements": 1,
            "is_active": True
        },
        # Brand 10: GlowBoutique Jewelry (Dedicated: Harshvardhan Singh, Mon-Sat)
        {
            "_id": brd_glowjewel_id,
            "brand_id": "BRD-010",
            "name": "GlowBoutique Fine Jewelry",
            "description": "D2C fine silver and imitation jewelry.",
            "client_status": "Active",
            "pod_id": pod_gamma_id,
            "operating_calendar": "MON_SAT_EXCLUDING_HOLIDAYS",
            "public_holiday_policy": "OFF_ON_HOLIDAYS",
            "minimum_coverage_requirements": 1,
            "is_active": True
        },
        # Multi-Resource Brand 11: VoltTech Mobile (3 Employees: Priya CS, Amit ACC, Sneha NDR)
        {
            "_id": brd_volttech_id,
            "brand_id": "BRD-011",
            "name": "VoltTech Mobile & Gadgets",
            "description": "Tier-1 consumer electronics brand with specialized separate process teams.",
            "client_status": "Active",
            "pod_id": pod_beta_id,
            "operating_calendar": "365_DAYS",
            "public_holiday_policy": "WORK_ON_HOLIDAYS",
            "minimum_coverage_requirements": 3,
            "is_active": True
        },
        # Multi-Resource Brand 12: Zenith Activewear (3 Employees: Tarun & Ritu share CS, Manish Retention)
        {
            "_id": brd_zenith_id,
            "brand_id": "BRD-012",
            "name": "Zenith Activewear",
            "description": "High-volume fitness apparel brand with shared CS shift coverage and retention.",
            "client_status": "Active",
            "pod_id": pod_gamma_id,
            "operating_calendar": "DAILY_EXCLUDING_HOLIDAYS",
            "public_holiday_policy": "OFF_ON_HOLIDAYS",
            "minimum_coverage_requirements": 2,
            "is_active": True
        }
    ]
    db[BRANDS_COL].insert_many(brands_data)
    print(f"Inserted {len(brands_data)} brands.")

    # 5. Processes for Brands
    processes_data = []
    
    # Helper to add standard processes for a single-resource brand
    def create_single_brand_processes(b_id, prefix):
        return [
            {
                "_id": ObjectId(),
                "process_id": f"{prefix}-CS",
                "name": "Customer Support (CS)",
                "description": "Omnichannel customer support via email and chat.",
                "brand_id": b_id,
                "operating_calendar": "INHERIT_BRAND",
                "min_employees": 1,
                "max_staffing": 2,
                "working_day_rules": {},
                "is_active": True
            },
            {
                "_id": ObjectId(),
                "process_id": f"{prefix}-ACC",
                "name": "Abandoned Cart Conversion (ACC)",
                "description": "Proactive WhatsApp and tele-calling cart recovery.",
                "brand_id": b_id,
                "operating_calendar": "INHERIT_BRAND",
                "min_employees": 1,
                "max_staffing": 1,
                "working_day_rules": {},
                "is_active": True
            },
            {
                "_id": ObjectId(),
                "process_id": f"{prefix}-NDR",
                "name": "Non-Delivery Report Management (NDR)",
                "description": "RTO reduction and address re-verification.",
                "brand_id": b_id,
                "operating_calendar": "INHERIT_BRAND",
                "min_employees": 1,
                "max_staffing": 1,
                "working_day_rules": {},
                "is_active": True
            }
        ]

    # Generate single brand processes
    processes_data.extend(create_single_brand_processes(brd_ecoglow_id, "ECO"))
    processes_data.extend(create_single_brand_processes(brd_pureskin_id, "PUR"))
    processes_data.extend(create_single_brand_processes(brd_velvet_id, "VEL"))
    processes_data.extend(create_single_brand_processes(brd_urban_id, "URB"))
    processes_data.extend(create_single_brand_processes(brd_nutrifuel_id, "NUT"))
    processes_data.extend(create_single_brand_processes(brd_ketobites_id, "KET"))
    processes_data.extend(create_single_brand_processes(brd_audiopulse_id, "AUD"))
    processes_data.extend(create_single_brand_processes(brd_smartcharge_id, "SMA"))
    processes_data.extend(create_single_brand_processes(brd_luxehome_id, "LUX"))
    processes_data.extend(create_single_brand_processes(brd_glowjewel_id, "GLO"))

    # Multi-resource Brand 11: VoltTech (3 distinct processes with custom calendars)
    prc_volt_cs_id = ObjectId()
    prc_volt_acc_id = ObjectId()
    prc_volt_ndr_id = ObjectId()
    processes_data.extend([
        {
            "_id": prc_volt_cs_id,
            "process_id": "VOLT-CS",
            "name": "Customer Support (CS)",
            "description": "24/7 technical customer support for VoltTech electronics.",
            "brand_id": brd_volttech_id,
            "operating_calendar": "365_DAYS",
            "min_employees": 1,
            "max_staffing": 2,
            "working_day_rules": {},
            "is_active": True
        },
        {
            "_id": prc_volt_acc_id,
            "process_id": "VOLT-ACC",
            "name": "Abandoned Cart Conversion (ACC)",
            "description": "High ticket cart conversion team.",
            "brand_id": brd_volttech_id,
            "operating_calendar": "DAILY_EXCLUDING_HOLIDAYS",
            "min_employees": 1,
            "max_staffing": 1,
            "working_day_rules": {},
            "is_active": True
        },
        {
            "_id": prc_volt_ndr_id,
            "process_id": "VOLT-NDR",
            "name": "Non-Delivery Report Management (NDR)",
            "description": "Courier NDR resolutions, active Monday to Saturday.",
            "brand_id": brd_volttech_id,
            "operating_calendar": "MON_SAT_EXCLUDING_HOLIDAYS",
            "min_employees": 1,
            "max_staffing": 1,
            "working_day_rules": {},
            "is_active": True
        }
    ])

    # Multi-resource Brand 12: Zenith Activewear (Shared CS + Retention)
    prc_zen_cs_id = ObjectId()
    prc_zen_ret_id = ObjectId()
    processes_data.extend([
        {
            "_id": prc_zen_cs_id,
            "process_id": "ZEN-CS",
            "name": "Customer Support (CS)",
            "description": "High-volume chat support (Requires 2 employees minimum on active days).",
            "brand_id": brd_zenith_id,
            "operating_calendar": "DAILY_EXCLUDING_HOLIDAYS",
            "min_employees": 2,
            "max_staffing": 3,
            "working_day_rules": {},
            "is_active": True
        },
        {
            "_id": prc_zen_ret_id,
            "process_id": "ZEN-RET",
            "name": "Customer Retention (RET)",
            "description": "VIP loyalty program and re-engagement campaigns.",
            "brand_id": brd_zenith_id,
            "operating_calendar": "MON_SAT_EXCLUDING_HOLIDAYS",
            "min_employees": 1,
            "max_staffing": 1,
            "working_day_rules": {},
            "is_active": True
        }
    ])

    db[PROCESSES_COL].insert_many(processes_data)
    print(f"Inserted {len(processes_data)} processes.")

    # 6. Assignments
    # We assign:
    # Single-resource brands: 1 employee assigned to ALL processes of that brand.
    assignments_data = []

    def assign_employee_to_brand_all_processes(emp_id, b_id):
        b_procs = [p for p in processes_data if str(p["brand_id"]) == str(b_id)]
        for p in b_procs:
            assignments_data.append({
                "_id": ObjectId(),
                "employee_id": emp_id,
                "brand_id": b_id,
                "process_id": p["_id"],
                "effective_start_date": "2024-01-01",
                "effective_end_date": None,
                "status": "Active",
                "allocation_percentage": 100,
                "is_primary": True
            })

    # Dedicated brand assignments
    assign_employee_to_brand_all_processes(emp_rahul_id, brd_ecoglow_id)     # Rahul -> EcoGlow (365 days)
    assign_employee_to_brand_all_processes(emp_rohan_id, brd_pureskin_id)     # Rohan -> PureSkin
    assign_employee_to_brand_all_processes(emp_ananya_id, brd_velvet_id)      # Ananya -> Velvet Thread
    assign_employee_to_brand_all_processes(emp_vikram_id, brd_urban_id)       # Vikram -> UrbanStyle
    assign_employee_to_brand_all_processes(emp_pooja_id, brd_nutrifuel_id)    # Pooja -> NutriFuel
    assign_employee_to_brand_all_processes(emp_kunal_id, brd_ketobites_id)    # Kunal -> KetoBites
    assign_employee_to_brand_all_processes(emp_neha_id, brd_audiopulse_id)    # Neha -> AudioPulse
    assign_employee_to_brand_all_processes(emp_aditya_id, brd_smartcharge_id) # Aditya -> SmartCharge
    assign_employee_to_brand_all_processes(emp_divya_id, brd_luxehome_id)     # Divya -> LuxeHome
    assign_employee_to_brand_all_processes(emp_harsh_id, brd_glowjewel_id)    # Harsh -> GlowJewel

    # Multi-resource Brand 11: VoltTech Mobile
    # Priya -> CS, Amit -> ACC, Sneha -> NDR
    assignments_data.append({
        "_id": ObjectId(),
        "employee_id": emp_priya_id,
        "brand_id": brd_volttech_id,
        "process_id": prc_volt_cs_id,
        "effective_start_date": "2024-01-01",
        "effective_end_date": None,
        "status": "Active",
        "allocation_percentage": 100,
        "is_primary": True
    })
    assignments_data.append({
        "_id": ObjectId(),
        "employee_id": emp_amit_id,
        "brand_id": brd_volttech_id,
        "process_id": prc_volt_acc_id,
        "effective_start_date": "2024-01-01",
        "effective_end_date": None,
        "status": "Active",
        "allocation_percentage": 100,
        "is_primary": True
    })
    assignments_data.append({
        "_id": ObjectId(),
        "employee_id": emp_sneha_id,
        "brand_id": brd_volttech_id,
        "process_id": prc_volt_ndr_id,
        "effective_start_date": "2024-01-01",
        "effective_end_date": None,
        "status": "Active",
        "allocation_percentage": 100,
        "is_primary": True
    })

    # Multi-resource Brand 12: Zenith Activewear
    # Tarun Khanna & Ritu Sen both assigned to CS (Shared process)
    # Manish Reddy assigned to Retention
    assignments_data.append({
        "_id": ObjectId(),
        "employee_id": emp_tarun_id,
        "brand_id": brd_zenith_id,
        "process_id": prc_zen_cs_id,
        "effective_start_date": "2024-01-01",
        "effective_end_date": None,
        "status": "Active",
        "allocation_percentage": 100,
        "is_primary": True
    })
    assignments_data.append({
        "_id": ObjectId(),
        "employee_id": emp_ritu_id,
        "brand_id": brd_zenith_id,
        "process_id": prc_zen_cs_id,
        "effective_start_date": "2024-01-01",
        "effective_end_date": None,
        "status": "Active",
        "allocation_percentage": 100,
        "is_primary": True
    })
    assignments_data.append({
        "_id": ObjectId(),
        "employee_id": emp_manish_id,
        "brand_id": brd_zenith_id,
        "process_id": prc_zen_ret_id,
        "effective_start_date": "2024-01-01",
        "effective_end_date": None,
        "status": "Active",
        "allocation_percentage": 100,
        "is_primary": True
    })

    # Assign reserve specialists EMP-017 through EMP-032 to active brand shifts within their pods
    emp_map_by_code = {e["employee_id"]: e["_id"] for e in employees_data}
    proc_map_by_code = {p["process_id"]: (p["_id"], p["brand_id"]) for p in processes_data}

    additional_assignments = [
        ("EMP-017", "VEL-CS"),
        ("EMP-018", "PUR-ACC"),
        ("EMP-019", "VEL-NDR"),
        ("EMP-020", "URB-CS"),
        ("EMP-021", "NUT-ACC"),
        ("EMP-022", "KET-NDR"),
        ("EMP-023", "URB-NDR"),
        ("EMP-024", "AUD-CS"),
        ("EMP-025", "SMA-ACC"),
        ("EMP-026", "LUX-CS"),
        ("EMP-027", "GLO-ACC"),
        ("EMP-028", "VOLT-CS"),
        ("EMP-029", "LUX-NDR"),
        ("EMP-030", "PUR-CS"),
        ("EMP-031", "NUT-CS"),
        ("EMP-032", "ZEN-CS"),
    ]

    for emp_code, proc_code in additional_assignments:
        e_id = emp_map_by_code.get(emp_code)
        if e_id and proc_code in proc_map_by_code:
            pr_id, b_id = proc_map_by_code[proc_code]
            assignments_data.append({
                "_id": ObjectId(),
                "employee_id": e_id,
                "brand_id": b_id,
                "process_id": pr_id,
                "effective_start_date": "2024-01-01",
                "effective_end_date": None,
                "status": "Active",
                "allocation_percentage": 100,
                "is_primary": False
            })

    db[ASSIGNMENTS_COL].insert_many(assignments_data)
    print(f"Inserted {len(assignments_data)} assignments.")

    # 7. Public Holidays (2026 Calendar)
    holidays_data = [
        {"_id": ObjectId(), "name": "New Year's Day", "date": "2026-01-01", "description": "National Public Holiday", "location": "National", "is_active": True},
        {"_id": ObjectId(), "name": "Republic Day", "date": "2026-01-26", "description": "Indian Republic Day Celebration", "location": "National", "is_active": True},
        {"_id": ObjectId(), "name": "Maha Shivratri", "date": "2026-02-16", "description": "Religious Public Holiday", "location": "National", "is_active": True},
        {"_id": ObjectId(), "name": "Holi", "date": "2026-03-04", "description": "Festival of Colors", "location": "National", "is_active": True},
        {"_id": ObjectId(), "name": "Eid ul-Fitr", "date": "2026-03-20", "description": "Religious Holiday", "location": "National", "is_active": True},
        {"_id": ObjectId(), "name": "Good Friday", "date": "2026-04-03", "description": "Christian Holiday", "location": "National", "is_active": True},
        {"_id": ObjectId(), "name": "Labor Day", "date": "2026-05-01", "description": "International Workers' Day", "location": "National", "is_active": True},
        {"_id": ObjectId(), "name": "Independence Day", "date": "2026-08-15", "description": "Indian Independence Day", "location": "National", "is_active": True},
        {"_id": ObjectId(), "name": "Mahatma Gandhi Jayanti", "date": "2026-10-02", "description": "National Holiday", "location": "National", "is_active": True},
        {"_id": ObjectId(), "name": "Dussehra", "date": "2026-10-20", "description": "Vijayadashami", "location": "National", "is_active": True},
        {"_id": ObjectId(), "name": "Diwali", "date": "2026-11-08", "description": "Deepavali Festival", "location": "National", "is_active": True},
        {"_id": ObjectId(), "name": "Christmas Day", "date": "2026-12-25", "description": "Christian Holiday", "location": "National", "is_active": True}
    ]
    db[HOLIDAYS_COL].insert_many(holidays_data)
    print(f"Inserted {len(holidays_data)} public holidays.")

    # 8. Availability and Leaves
    # Sample leaves for demonstrations:
    # 1. Rahul Verma (EcoGlow dedicated) has approved leave on Dec 15, 2026 (triggers coverage gap scenario!)
    # 2. Amit Patel (VoltTech ACC) has approved leave on Dec 10, 2026 (demonstrates multi-employee brand where only ACC is affected)
    # 3. Sneha Rao has pending leave request on Dec 18, 2026 (demonstrates pending leave does NOT block roster generation)
    # 4. Ananya Iyer has approved comp-off on Dec 22, 2026
    # 5. Rohan Mehta has casual leave on Dec 05, 2026
    availability_data = [
        {
            "_id": ObjectId(),
            "employee_id": emp_rahul_id,
            "start_date": "2026-12-15",
            "end_date": "2026-12-15",
            "type": "CASUAL_LEAVE",
            "status": "APPROVED",
            "reason": "Family emergency and personal commitment",
            "approved_by": emp_priya_id,
            "approval_date": "2026-12-01",
            "created_at": datetime.now()
        },
        {
            "_id": ObjectId(),
            "employee_id": emp_amit_id,
            "start_date": "2026-12-10",
            "end_date": "2026-12-10",
            "type": "PLANNED_LEAVE",
            "status": "APPROVED",
            "reason": "Annual medical checkup",
            "approved_by": emp_priya_id,
            "approval_date": "2026-12-02",
            "created_at": datetime.now()
        },
        {
            "_id": ObjectId(),
            "employee_id": emp_sneha_id,
            "start_date": "2026-12-18",
            "end_date": "2026-12-18",
            "type": "PLANNED_LEAVE",
            "status": "PENDING",
            "reason": "Travel to hometown",
            "approved_by": None,
            "approval_date": None,
            "created_at": datetime.now()
        },
        {
            "_id": ObjectId(),
            "employee_id": emp_ananya_id,
            "start_date": "2026-12-22",
            "end_date": "2026-12-22",
            "type": "COMP_OFF",
            "status": "APPROVED",
            "reason": "Compensatory off for weekend overtime deployment",
            "approved_by": emp_priya_id,
            "approval_date": "2026-12-03",
            "created_at": datetime.now()
        },
        {
            "_id": ObjectId(),
            "employee_id": emp_rohan_id,
            "start_date": "2026-12-05",
            "end_date": "2026-12-05",
            "type": "SICK_LEAVE",
            "status": "APPROVED",
            "reason": "Viral fever recovery",
            "approved_by": emp_priya_id,
            "approval_date": "2026-12-04",
            "created_at": datetime.now()
        }
    ]
    db[AVAILABILITY_COL].insert_many(availability_data)
    print(f"Inserted {len(availability_data)} availability and leave records.")

    # 9. Application Users & RBAC
    users_data = [
        {
            "_id": ObjectId(),
            "email": "admin@datastraw.com",
            "password_hash": hash_password("admin123"),
            "full_name": "Senior Operations Director (Admin)",
            "role": "ADMIN",
            "employee_id": None,
            "created_at": datetime.now()
        },
        {
            "_id": ObjectId(),
            "email": "manager@datastraw.com",
            "password_hash": hash_password("manager123"),
            "full_name": "Operations Manager",
            "role": "OPERATIONS_MANAGER",
            "employee_id": None,
            "created_at": datetime.now()
        },
        {
            "_id": ObjectId(),
            "email": "podlead@datastraw.com",
            "password_hash": hash_password("lead123"),
            "full_name": "Priya Sharma (Alpha Pod Lead)",
            "role": "POD_LEAD",
            "employee_id": emp_priya_id,
            "pod_id": pod_alpha_id,
            "created_at": datetime.now()
        }
    ]
    db[USERS_COL].insert_many(users_data)
    print(f"Inserted {len(users_data)} initial users.")

    print("Seed process completed successfully!")

if __name__ == "__main__":
    seed_database()
