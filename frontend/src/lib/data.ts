import {
  Activity,
  Baby,
  Bone,
  Brain,
  Ear,
  Eye,
  Heart,
  Microscope,
  Pill,
  Radiation,
  ScanLine,
  Scissors,
  Shield,
  Smile,
  Sparkles,
  Stethoscope,
  Syringe,
  Users,
  Waves,
  Wind,
  type LucideIcon,
} from "lucide-react";

export interface Speciality {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  doctors: number;
  color: string;
}

export const specialities: Speciality[] = [
  {
    slug: "general-medicine",
    name: "General Medicine",
    tagline: "Everyday care, expertly delivered",
    description:
      "Comprehensive primary care for adults across preventive, acute and chronic conditions.",
    icon: Stethoscope,
    doctors: 24,
    color: "bg-slate-50",
  },
  {
    slug: "cardiology",
    name: "Cardiology",
    tagline: "Heart care that never skips a beat",
    description: "Diagnosis and treatment of heart conditions with world-class cardiologists.",
    icon: Heart,
    doctors: 18,
    color: "bg-sky-50/40",
  },
  {
    slug: "neurology",
    name: "Neurology",
    tagline: "Precision for the nervous system",
    description: "Expert care for the brain, spine and nervous system disorders.",
    icon: Brain,
    doctors: 12,
    color: "bg-slate-50",
  },
  {
    slug: "dermatology",
    name: "Dermatology",
    tagline: "Skin, hair & confidence",
    description: "Medical and cosmetic dermatology backed by modern diagnostics.",
    icon: Sparkles,
    doctors: 15,
    color: "bg-sky-50/40",
  },
  {
    slug: "dentistry",
    name: "Dentistry",
    tagline: "Smiles worth showing",
    description: "From routine hygiene to advanced restorative and cosmetic dentistry.",
    icon: Smile,
    doctors: 20,
    color: "bg-slate-50",
  },
  {
    slug: "orthopedics",
    name: "Orthopedics",
    tagline: "Movement, restored",
    description: "Bone, joint and sports medicine specialists for every stage of life.",
    icon: Bone,
    doctors: 14,
    color: "bg-sky-50/40",
  },
  {
    slug: "psychiatry",
    name: "Psychiatry",
    tagline: "Mental health, without stigma",
    description: "Confidential mental health care with licensed psychiatrists and therapists.",
    icon: Shield,
    doctors: 10,
    color: "bg-slate-50",
  },
  {
    slug: "ophthalmology",
    name: "Ophthalmology",
    tagline: "See the world clearly",
    description: "Comprehensive eye care from routine exams to advanced surgical procedures.",
    icon: Eye,
    doctors: 9,
    color: "bg-slate-50",
  },
  {
    slug: "pediatrics",
    name: "Pediatrics",
    tagline: "Little patients, big care",
    description: "Warm, evidence-based care for infants, children and adolescents.",
    icon: Baby,
    doctors: 22,
    color: "bg-sky-50/40",
  },
  {
    slug: "gynecology",
    name: "Gynecology",
    tagline: "Women's health, prioritised",
    description: "Reproductive and gynecologic health across every life stage.",
    icon: Users,
    doctors: 16,
    color: "bg-slate-50",
  },
  {
    slug: "urology",
    name: "Urology",
    tagline: "Discreet and dignified",
    description: "Urinary tract, kidney and men's health specialists.",
    icon: Waves,
    doctors: 8,
    color: "bg-slate-50",
  },
  {
    slug: "ent",
    name: "ENT",
    tagline: "Ear, nose & throat",
    description: "Diagnosis and treatment for hearing, sinus and voice disorders.",
    icon: Ear,
    doctors: 11,
    color: "bg-slate-50",
  },
  {
    slug: "pulmonology",
    name: "Pulmonology",
    tagline: "Breathe deeply",
    description: "Respiratory specialists for asthma, COPD, sleep apnea and more.",
    icon: Wind,
    doctors: 9,
    color: "bg-sky-50/40",
  },
  {
    slug: "gastroenterology",
    name: "Gastroenterology",
    tagline: "Digestive health, refined",
    description: "Advanced diagnostics and treatment for digestive system health.",
    icon: Activity,
    doctors: 13,
    color: "bg-slate-50",
  },
  {
    slug: "radiology",
    name: "Radiology",
    tagline: "Images that reveal answers",
    description: "State-of-the-art imaging with rapid, expert interpretation.",
    icon: ScanLine,
    doctors: 12,
    color: "bg-slate-50",
  },
  {
    slug: "endocrinology",
    name: "Endocrinology",
    tagline: "Hormones in harmony",
    description: "Diabetes, thyroid and hormonal health specialists.",
    icon: Pill,
    doctors: 7,
    color: "bg-sky-50/40",
  },
  {
    slug: "oncology",
    name: "Oncology",
    tagline: "Compassionate cancer care",
    description: "Multidisciplinary cancer care with modern therapies and clinical trials.",
    icon: Radiation,
    doctors: 15,
    color: "bg-sky-50/40",
  },
  {
    slug: "nephrology",
    name: "Nephrology",
    tagline: "Kidney health specialists",
    description: "Comprehensive kidney disease diagnosis and treatment.",
    icon: Microscope,
    doctors: 6,
    color: "bg-slate-50",
  },
  {
    slug: "physiotherapy",
    name: "Physiotherapy",
    tagline: "Rehabilitation, reimagined",
    description: "Guided physical therapy for injury, recovery and performance.",
    icon: Scissors,
    doctors: 18,
    color: "bg-slate-50",
  },
  {
    slug: "emergency",
    name: "Emergency",
    tagline: "Ready when it matters most",
    description: "24/7 emergency care staffed by experienced physicians.",
    icon: Syringe,
    doctors: 30,
    color: "bg-sky-50/40",
  },
];

export interface Doctor {
  id: string;
  name: string;
  speciality: string;
  specialitySlug: string;
  photo: string;
  experience: number;
  rating: number;
  reviews: number;
  education: string[];
  languages: string[];
  location: string;
  fee: number;
  availableDays: string[];
  hours: string;
  bio: string;
  patients: number;
  nextSlot: string;
}


const firstNames = [
  "Sarah",
  "James",
  "Amara",
  "David",
  "Priya",
  "Marcus",
  "Chen",
  "Elena",
  "Noah",
  "Zara",
  "Omar",
  "Ines",
  "Liam",
  "Sofia",
  "Ethan",
  "Aisha",
  "Lucas",
  "Maya",
  "Kai",
  "Nora",
];
const lastNames = [
  "Chen",
  "Okonkwo",
  "Patel",
  "Novak",
  "Silva",
  "Ahmed",
  "Rossi",
  "Kim",
  "Ito",
  "Reyes",
  "Kaur",
  "Sato",
  "Cohen",
  "Nguyen",
  "Yamada",
  "Diaz",
  "Anders",
  "Bloom",
  "Ford",
  "Hale",
];

function rand(seed: number, min: number, max: number) {
  const x = Math.sin(seed) * 10000;
  return min + Math.floor((x - Math.floor(x)) * (max - min + 1));
}



export const stats = [
  { value: "120K+", label: "Patients served" },
  { value: "480+", label: "Verified doctors" },
  { value: "20", label: "Specialities" },
  { value: "4.9", label: "Average rating" },
];



export const faqs = [
  {
    q: "How do I book an appointment?",
    a: "Search by speciality, location or doctor, choose a time slot and confirm. You'll receive an instant confirmation and calendar invite.",
  },
  {
    q: "Can I reschedule or cancel?",
    a: "Yes — free cancellation and rescheduling up to 4 hours before your appointment, from your patient dashboard.",
  },
  {
    q: "Are online consultations available?",
    a: "Most doctors on UniCare offer secure video visits alongside in-person appointments.",
  },
  {
    q: "Is my medical data private?",
    a: "All records are encrypted end-to-end and only visible to you and the clinicians you authorise.",
  },
  {
    q: "Do you accept insurance?",
    a: "We work with all major insurers. You'll see coverage details before you confirm any booking.",
  },
  {
    q: "How are doctors verified?",
    a: "Every physician is background-checked, license-verified and continuously reviewed by our medical board.",
  },
];
