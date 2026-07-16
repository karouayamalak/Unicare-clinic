import { Request, Response, NextFunction } from "express";
import { Appointment } from "../models/appointment.model";
import { Doctor } from "../models/doctor.model";
import { User } from "../models/user.model";
import { AppError } from "../middleware/error";
import { Dependent } from "../models/dependent.model";
import {
  sendAppointmentConfirmationEmail,
  sendDoctorAppointmentNotification,
  sendAppointmentCancellationEmail,
  sendAppointmentCompletionEmail,
} from "../utils/email";
import { validateAppointmentBooking } from "../utils/appointmentRules";
import { serializeAppointmentForClient } from "../utils/appointmentView";
import { logAction } from "../utils/log";

// GET /api/v1/appointments
export const listAppointments = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) return next(new AppError("Not authenticated.", 401));

    let filter: Record<string, unknown> = {};

    if (user.role === "Patient") {
      filter = { patientId: user._id };
    } else if (user.role === "Doctor") {
      let doc = await Doctor.findOne({ userId: user._id });
      if (!doc) {
        doc = await Doctor.findOne({ email: user.email.toLowerCase().trim() });
        if (doc && !doc.userId) {
          doc.userId = user._id as any;
          await doc.save();
        }
      }
      if (doc) {
        filter = { doctorId: doc._id };
      } else {
        filter = { doctorId: "000000000000000000000000" };
      }
    }

    const { status, date } = req.query as Record<string, string>;
    if (status) filter.status = status;
    if (date) filter.date = date;

    const appointments = await Appointment.find(filter)
      .populate("dependentId")
      .sort({ date: 1, time: 1 })
      .lean();

    res.status(200).json({
      status: "success",
      results: appointments.length,
      data: {
        appointments: appointments.map((appointment) =>
          serializeAppointmentForClient(appointment),
        ),
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/appointments
export const createAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) return next(new AppError("Not authenticated.", 401));

    let { doctorId, date, time, reason, mode, patientEmail, dependentId } = req.body;

    if (!date || !time || !reason) {
      return next(new AppError("date, time, reason are required.", 400));
    }

    let targetPatientId = user._id;
    let targetPatientName = `${user.firstName} ${user.lastName}`;
    let targetPatientEmail = user.email;
    let targetDependentId: string | undefined;

    if (dependentId && user.role === "Patient") {
      const dependent = await Dependent.findById(dependentId);
      if (!dependent) {
        return next(new AppError("Dependent not found.", 404));
      }
      if (dependent.parentEmail !== user.email.toLowerCase().trim()) {
        return next(new AppError("Not authorized to book for this dependent.", 403));
      }
      targetPatientName = `${dependent.firstName} ${dependent.lastName}`;
      targetDependentId = dependentId;
    }

    if (user.role === "Doctor" || user.role === "Admin") {
      if (!patientEmail) {
        return next(new AppError("patientEmail is required when booking on behalf of a patient.", 400));
      }
      const patientUser = await User.findOne({
        email: patientEmail.toLowerCase().trim(),
        role: "Patient",
      });
      if (!patientUser) {
        return next(new AppError("Patient non trouvé avec cette adresse email.", 404));
      }
      targetPatientId = patientUser._id;
      targetPatientName = `${patientUser.firstName} ${patientUser.lastName}`;
      targetPatientEmail = patientUser.email;

      if (user.role === "Doctor" && !doctorId) {
        let docProfile = await Doctor.findOne({ userId: user._id });
        if (!docProfile) {
          docProfile = await Doctor.findOne({ email: user.email.toLowerCase().trim() });
          if (docProfile && !docProfile.userId) {
            docProfile.userId = user._id as any;
            await docProfile.save();
          }
        }
        if (docProfile) doctorId = docProfile._id;
      }
    }

    if (!doctorId) {
      return next(new AppError("doctorId is required.", 400));
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return next(new AppError("Doctor not found.", 404));

    if (user.role === "Patient") {
      // No 24-hour restriction — clinic is 24/7, allow same-day booking
    }

    const existingAppointments = await Appointment.find({
      doctorId,
      date,
      status: { $nin: ["Annulé", "Terminé"] },
    }).lean();

    const validation = validateAppointmentBooking({
      doctor: {
        _id: doctor._id?.toString(),
        id: doctor._id?.toString(),
        status: doctor.status,
        availableDays: doctor.availableDays ?? [],
        availableHours: doctor.availableHours ?? { start: "08:00", end: "17:00" },
        breaks: doctor.breaks ?? [],
        vacationDays: doctor.vacationDays ?? [],
        dailyAppointmentLimit: doctor.dailyAppointmentLimit ?? 20,
      },
      doctorId: doctor._id?.toString() ?? doctorId,
      date,
      time,
      patientId: targetPatientId.toString(),
      existingAppointments: existingAppointments.map((a) => ({
        doctorId: a.doctorId.toString(),
        patientId: a.patientId.toString(),
        date: a.date,
        time: a.time,
        status: a.status,
      })),
    });

    if (!validation.isValid) {
      return next(
        new AppError(
          validation.errorMessage ?? "Appointment could not be booked.",
          validation.statusCode ?? 400,
        ),
      );
    }

    if (user.role !== "Doctor") {
      const isBlocked = doctor.blockedSlots.some((s) => {
        const matchDate = s.date === date;
        const matchHour = !s.hour || time.startsWith(s.hour);
        return matchDate && matchHour;
      });
      if (isBlocked) {
        return next(new AppError("Ce créneau horaire est bloqué par le médecin.", 400));
      }
    }

    let appointment;
    try {
      appointment = await Appointment.create({
        patientId: targetPatientId,
        patientName: targetPatientName,
        patientEmail: targetPatientEmail,
        dependentId: targetDependentId,
        doctorId,
        doctorName: doctor.name,
        speciality: doctor.speciality,
        date,
        time,
        reason,
        mode: mode ?? "In-clinic",
        // Patients must wait for doctor confirmation; doctors/admins create confirmed directly
        status: user.role === "Patient" ? "En attente" : "Confirmé",
      });
    } catch (error: any) {
      if (error?.code === 11000) {
        return next(new AppError("Ce créneau horaire est déjà réservé.", 409));
      }
      throw error;
    }

    await Doctor.findByIdAndUpdate(doctorId, { $inc: { patients: 1 } });

    const appointmentPayload = serializeAppointmentForClient(
      await Appointment.findById(appointment._id).populate("dependentId").lean(),
    );

    await logAction(
      user,
      `Réservation de rendez-vous pour ${targetPatientName}`,
      "Appointment",
      appointment._id?.toString() ?? "",
      `Médecin: ${doctor.name} • Statut: ${appointment.status}`,
    );

    sendAppointmentConfirmationEmail(targetPatientEmail, {
      patientName: targetPatientName,
      doctorName: doctor.name,
      date,
      time,
      location: doctor.location,
    }).catch(console.error);

    if (doctor.email) {
      sendDoctorAppointmentNotification(doctor.email, {
        patientName: targetPatientName,
        doctorName: doctor.name,
        date,
        time,
        reason,
        action: "créé",
      }).catch(console.error);
    }

    res.status(201).json({
      status: "success",
      message: "Appointment booked successfully.",
      data: { appointment: appointmentPayload },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/appointments/:id/status
export const updateStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) return next(new AppError("Not authenticated.", 401));

    const { status, arrivedAt, notes, prescription, price } = req.body;

    const validStatuses = ["Confirmé", "En attente", "En consultation", "Terminé", "Annulé"];
    if (!status || !validStatuses.includes(status)) {
      return next(new AppError(`Status must be one of: ${validStatuses.join(", ")}`, 400));
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return next(new AppError("Appointment not found.", 404));

    const currentStatus = appointment.status;
    const allowedTransitions: Record<string, string[]> = {
      "En attente": ["Confirmé", "En consultation", "Terminé", "Annulé"],
      Confirmé: ["En attente", "En consultation", "Terminé", "Annulé"],
      "En consultation": ["Terminé", "Annulé"],
      Terminé: [],
      Annulé: [],
    };

    if (!allowedTransitions[currentStatus]?.includes(status)) {
      return next(new AppError("Transition de statut invalide.", 400));
    }

    if (user.role === "Patient") {
      // Patients can cancel their own appointment or mark themselves as arrived ("En attente" / "Confirmé")
      const isAllowedStatus = status === "Annulé" || status === "En attente" || status === "Confirmé";
      if (!isAllowedStatus) {
        return next(new AppError("Les patients peuvent seulement annuler leur rendez-vous ou signaler leur arrivée.", 403));
      }
      if (appointment.patientId.toString() !== user._id.toString()) {
        return next(new AppError("Not authorized.", 403));
      }
    }

    appointment.status = status as any;
    if (arrivedAt !== undefined) appointment.arrivedAt = arrivedAt;
    if (notes !== undefined) appointment.notes = notes;
    if (prescription !== undefined) appointment.prescription = prescription;
    if (price !== undefined) appointment.price = price;

    if (status === "Terminé" && !appointment.receiptNumber) {
      appointment.receiptNumber = `REC-${Date.now()}`;
    }

    await appointment.save();

    await logAction(
      user,
      `Mise à jour du statut: ${status}`,
      "Appointment",
      appointment._id?.toString() ?? "",
      `Ancien statut: ${currentStatus} • Nouveau statut: ${status}`,
    );

    if (appointment.patientEmail && status === "Terminé") {
      sendAppointmentCompletionEmail(appointment.patientEmail, {
        patientName: appointment.patientName,
        doctorName: appointment.doctorName,
        date: appointment.date,
        time: appointment.time,
        prescription: appointment.prescription,
        price: appointment.price ?? 0,
        receiptNumber: appointment.receiptNumber,
      }).catch(console.error);
    }

    // Notify patient when doctor confirms their pending appointment
    if (appointment.patientEmail && status === "Confirmé" && currentStatus === "En attente") {
      sendAppointmentConfirmationEmail(appointment.patientEmail, {
        patientName: appointment.patientName,
        doctorName: appointment.doctorName,
        date: appointment.date,
        time: appointment.time,
        location: "UniCare Béjaïa",
      }).catch(console.error);
    }

    // Notify patient when their appointment is cancelled by doctor/admin
    if (appointment.patientEmail && status === "Annulé" && user.role !== "Patient") {
      sendAppointmentCancellationEmail(appointment.patientEmail, {
        patientName: appointment.patientName,
        doctorName: appointment.doctorName,
        date: appointment.date,
        time: appointment.time,
        cancelledBy: `le médecin (${appointment.doctorName})`,
      }).catch(console.error);
    }

    res.status(200).json({
      status: "success",
      message: "Status updated.",
      data: { appointment },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/appointments/:id
export const deleteAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) return next(new AppError("Not authenticated.", 401));

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return next(new AppError("Appointment not found.", 404));

    if (user.role !== "Admin" && appointment.patientId.toString() !== user._id.toString()) {
      return next(new AppError("Not authorized.", 403));
    }

    const cancelledBy = user.role === "Admin" ? "l'administration" : `le patient (${appointment.patientName})`;

    if (appointment.patientEmail) {
      sendAppointmentCancellationEmail(appointment.patientEmail, {
        patientName: appointment.patientName,
        doctorName: appointment.doctorName,
        date: appointment.date,
        time: appointment.time,
        cancelledBy,
      }).catch(console.error);
    }

    await logAction(
      user,
      `Annulation de rendez-vous`,
      "Appointment",
      appointment._id?.toString() ?? "",
      `Patient: ${appointment.patientName} • Médecin: ${appointment.doctorName}`,
    );

    await appointment.deleteOne();

    res.status(200).json({ status: "success", message: "Appointment deleted." });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/appointments/:id/prescription
export const updatePrescription = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) return next(new AppError("Not authenticated.", 401));
    if (user.role === "Patient") return next(new AppError("Not authorized.", 403));

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return next(new AppError("Appointment not found.", 404));

    if (user.role === "Doctor") {
      let doc = await Doctor.findOne({ userId: user._id });
      if (!doc) {
        doc = await Doctor.findOne({ email: user.email.toLowerCase().trim() });
        if (doc && !doc.userId) {
          doc.userId = user._id as any;
          await doc.save();
        }
      }
      if (!doc || appointment.doctorId.toString() !== doc._id.toString()) {
        return next(new AppError("Not authorized.", 403));
      }
    }

    const { prescription } = req.body;
    if (!prescription) {
      return next(new AppError("prescription payload is required.", 400));
    }

    appointment.prescription = prescription;
    await appointment.save();

    await logAction(
      user,
      "Prescription mise à jour",
      "Appointment",
      appointment._id?.toString() ?? "",
      `Rendez-vous ${appointment._id}`,
    );

    res.status(200).json({
      status: "success",
      message: "Prescription updated.",
      data: { appointment },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/appointments/patients
export const listPatients = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user;
    if (!user || user.role === "Patient") {
      return next(new AppError("Not authorized.", 403));
    }

    let filter: Record<string, unknown> = {};
    if (user.role === "Doctor") {
      let doc = await Doctor.findOne({ userId: user._id });
      if (!doc) {
        doc = await Doctor.findOne({ email: user.email.toLowerCase().trim() });
        if (doc && !doc.userId) {
          doc.userId = user._id as any;
          await doc.save();
        }
      }
      if (doc) {
        filter = { doctorId: doc._id };
      } else {
        filter = { doctorId: "000000000000000000000000" };
      }
    }

    const appointments = await Appointment.find(filter);

    const patientMap = new Map<
      string,
      {
        id: string;
        name: string;
        email: string;
        visitCount: number;
        lastStatus: string;
        speciality: string;
      }
    >();

    appointments.forEach((a) => {
      const key = a.patientId.toString();
      if (!patientMap.has(key)) {
        patientMap.set(key, {
          id: key,
          name: a.patientName,
          email: a.patientEmail,
          visitCount: 0,
          lastStatus: a.status,
          speciality: a.speciality,
        });
      }
      const p = patientMap.get(key)!;
      p.visitCount += 1;
      p.lastStatus = a.status;
    });

    const patients = Array.from(patientMap.values());

    res.status(200).json({
      status: "success",
      results: patients.length,
      data: { patients },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/appointments/booked-slots?doctorId=...&date=...
// Public: returns booked time slots for a doctor on a given date (no patient data exposed)
export const getBookedSlots = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { doctorId, date } = req.query as Record<string, string>;
    if (!doctorId || !date) {
      return next(new AppError("doctorId and date are required.", 400));
    }

    const appointments = await Appointment.find({
      doctorId,
      date,
      status: { $nin: ["Annulé", "Terminé"] },
    })
      .select("time")
      .lean();

    const bookedTimes = appointments.map((a) => a.time);

    res.status(200).json({
      status: "success",
      data: { bookedTimes },
    });
  } catch (error) {
    next(error);
  }
};
