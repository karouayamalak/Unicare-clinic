export interface DoctorBookingInfo {
  _id?: string;
  id?: string;
  status: "Actif" | "Inactif" | "Congé";
  availableDays: string[];
  availableHours: { start: string; end: string };
  breaks?: Array<{ start: string; end: string }>;
  vacationDays?: string[];
  dailyAppointmentLimit?: number;
}

export interface ExistingAppointmentInfo {
  doctorId: string;
  patientId: string;
  date: string;
  time: string;
  status: string;
}

export interface AppointmentValidationResult {
  isValid: boolean;
  errorMessage?: string;
  statusCode?: number;
}

export const DEFAULT_APPOINTMENT_DURATION_MINUTES = 30;

const toMinutes = (value: string): number => {
  const [hoursText, minutesText] = value.split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText);
  return hours * 60 + (minutes || 0);
};

const getDayName = (date: Date): string => {
  const days = [
    "Dimanche",
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
  ];
  return days[date.getDay()] ?? "Lundi";
};

const overlaps = (
  start1: number,
  end1: number,
  start2: number,
  end2: number,
): boolean => {
  return start1 < end2 && start2 < end1;
};

const parseHolidayList = (value?: string): string[] => {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
};

export const validateAppointmentBooking = ({
  doctor,
  doctorId,
  date,
  time,
  patientId,
  existingAppointments,
  now = new Date(),
  appointmentDurationMinutes = DEFAULT_APPOINTMENT_DURATION_MINUTES,
  maxFutureDays = 90,
  clinicHolidays = [],
  bypassStrictChecks = false,
}: {
  doctor: DoctorBookingInfo;
  doctorId: string;
  date: string;
  time: string;
  patientId: string;
  existingAppointments: ExistingAppointmentInfo[];
  now?: Date;
  appointmentDurationMinutes?: number;
  maxFutureDays?: number;
  clinicHolidays?: string[];
  /** When true (Doctor/Admin booking), skips past-time, working-hours, vacation and break checks */
  bypassStrictChecks?: boolean;
}): AppointmentValidationResult => {
  if (!date || !time) {
    return {
      isValid: false,
      errorMessage: "date and time are required.",
      statusCode: 400,
    };
  }

  const slotDateTime = new Date(`${date}T${time}`);
  if (Number.isNaN(slotDateTime.getTime())) {
    return {
      isValid: false,
      errorMessage: "Invalid appointment date/time.",
      statusCode: 400,
    };
  }

  const slotStartMinutes = toMinutes(time);
  const slotEndMinutes = slotStartMinutes + appointmentDurationMinutes;

  if (!bypassStrictChecks) {
    if (slotDateTime.getTime() <= now.getTime()) {
      return {
        isValid: false,
        errorMessage: "Appointments cannot be booked in the past.",
        statusCode: 400,
      };
    }

    const futureLimit = maxFutureDays * 24 * 60 * 60 * 1000;
    if (slotDateTime.getTime() - now.getTime() > futureLimit) {
      return {
        isValid: false,
        errorMessage: "Appointments cannot be booked that far in the future.",
        statusCode: 400,
      };
    }

    if (doctor.status !== "Actif") {
      return {
        isValid: false,
        errorMessage:
          "Ce médecin n'accepte pas de nouveaux rendez-vous pour le moment.",
        statusCode: 400,
      };
    }

    const dayName = getDayName(slotDateTime);
    if (!doctor.availableDays.includes(dayName)) {
      return {
        isValid: false,
        errorMessage: "Ce médecin n'est pas disponible ce jour-là.",
        statusCode: 400,
      };
    }

    const clinicHoliday = clinicHolidays.includes(date);
    if (clinicHoliday) {
      return {
        isValid: false,
        errorMessage: "La clinique est fermée ce jour-là.",
        statusCode: 400,
      };
    }

    const vacationDays = doctor.vacationDays ?? [];
    if (vacationDays.includes(date)) {
      return {
        isValid: false,
        errorMessage: "Le médecin est en congé ce jour-là.",
        statusCode: 400,
      };
    }

    const openingMinutes = toMinutes(doctor.availableHours.start);
    const closingMinutes = toMinutes(doctor.availableHours.end);

    let isWithinHours = false;
    if (openingMinutes <= closingMinutes) {
      isWithinHours = slotStartMinutes >= openingMinutes && slotEndMinutes <= closingMinutes;
    } else {
      isWithinHours = slotStartMinutes >= openingMinutes || slotEndMinutes <= closingMinutes;
    }

    if (!isWithinHours) {
      return {
        isValid: false,
        errorMessage:
          "Le créneau est en dehors des heures de disponibilité du médecin.",
        statusCode: 400,
      };
    }

    for (const breakWindow of doctor.breaks ?? []) {
      const breakStart = toMinutes(breakWindow.start);
      const breakEnd = toMinutes(breakWindow.end);
      if (overlaps(slotStartMinutes, slotEndMinutes, breakStart, breakEnd)) {
        return {
          isValid: false,
          errorMessage: "Le médecin est en pause à cette heure-ci.",
          statusCode: 400,
        };
      }
    }
  }

  const activeAppointments = existingAppointments.filter(
    (appointment) =>
      appointment.status !== "Annulé" && appointment.status !== "Terminé",
  );

  const duplicateAppointment = activeAppointments.find(
    (appointment) =>
      appointment.doctorId === doctorId &&
      appointment.date === date &&
      appointment.time === time &&
      appointment.patientId === patientId,
  );
  if (duplicateAppointment) {
    return {
      isValid: false,
      errorMessage: "Vous avez déjà un rendez-vous pour ce créneau.",
      statusCode: 409,
    };
  }

  const sameSlotConflict = activeAppointments.find(
    (appointment) =>
      appointment.doctorId === doctorId &&
      appointment.date === date &&
      appointment.time === time,
  );
  if (sameSlotConflict) {
    return {
      isValid: false,
      errorMessage: "Ce créneau horaire est déjà réservé.",
      statusCode: 409,
    };
  }

  const overlapConflict = activeAppointments.find((appointment) => {
    if (appointment.doctorId !== doctorId || appointment.date !== date)
      return false;
    const existingStart = toMinutes(appointment.time);
    const existingEnd = existingStart + appointmentDurationMinutes;
    return overlaps(
      slotStartMinutes,
      slotEndMinutes,
      existingStart,
      existingEnd,
    );
  });
  if (overlapConflict) {
    return {
      isValid: false,
      errorMessage: "Ce créneau chevauche un rendez-vous déjà planifié.",
      statusCode: 409,
    };
  }

  const dailyCount = activeAppointments.filter(
    (appointment) =>
      appointment.doctorId === doctorId && appointment.date === date,
  ).length;

  const limit = doctor.dailyAppointmentLimit ?? 20;
  if (dailyCount >= limit) {
    return {
      isValid: false,
      errorMessage:
        "La limite quotidienne de rendez-vous est atteinte pour ce médecin.",
      statusCode: 400,
    };
  }

  return { isValid: true };
};
