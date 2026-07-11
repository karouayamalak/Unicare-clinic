export interface AppointmentDependentInfo {
  isDependent: boolean;
  label: string;
  childName: string;
  parentEmail?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodType?: string;
  allergies?: string;
  chronicConditions?: string;
  weight?: number;
  height?: number;
  notes?: string;
  relationship?: string;
}

export function serializeAppointmentForClient(appointment: any) {
  const dependent = appointment?.dependentId ?? null;
  const childName = [dependent?.firstName ?? "", dependent?.lastName ?? ""]
    .filter(Boolean)
    .join(" ")
    .trim();

  const dependentInfo: AppointmentDependentInfo = {
    isDependent: Boolean(dependent),
    label:
      childName && dependent?.parentEmail
        ? `Enfant de ${dependent.parentEmail}`
        : "",
    childName,
    parentEmail: dependent?.parentEmail?.trim() || undefined,
    dateOfBirth: dependent?.dateOfBirth || undefined,
    gender: dependent?.gender || undefined,
    bloodType: dependent?.bloodType || undefined,
    allergies: dependent?.allergies || undefined,
    chronicConditions: dependent?.chronicConditions || undefined,
    weight: dependent?.weight || undefined,
    height: dependent?.height || undefined,
    notes: dependent?.notes || undefined,
    relationship: dependent?.relationship || undefined,
  };

  return {
    ...appointment,
    dependentInfo,
  };
}
