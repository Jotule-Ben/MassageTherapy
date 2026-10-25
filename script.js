import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  addDoc,
  collection,
  getFirestore,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import emailjs from "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/+esm";
 
const modal = document.getElementById("bookingModal");
const selectedServiceText = document.getElementById("selectedServiceText");
const depositSummary = document.getElementById("depositSummary");
const bookingForm = document.getElementById("bookingForm");
const feedback = document.getElementById("formFeedback");
const successPanel = document.getElementById("bookingSuccess");
const successSummary = document.getElementById("successSummary");
const submitBookingButton = document.getElementById("submitBookingButton");
const therapistEmailLink = document.getElementById("therapistEmail");
const serviceButtons = document.querySelectorAll(".service-button");
const closeTargets = document.querySelectorAll("[data-close-modal]");
const scrollButtons = document.querySelectorAll("[data-scroll-target]");
 
const appConfig = window.APP_CONFIG || {};
const firebaseConfig = appConfig.firebase || {};
const emailjsConfig = appConfig.emailjs || {};
const collectionName = appConfig.bookingCollection || "bookings";
const therapistEmail =
  therapistEmailLink?.dataset.therapistEmail || therapistEmailLink?.textContent?.trim() || "";
 
let activeService = {
  name: "",
  duration: "",
  price: "",
  deposit: ""
};
 
let firestore = null;
 
function isConfigReady() {
  const hasFirebaseConfig = [
    firebaseConfig.apiKey,
    firebaseConfig.authDomain,
    firebaseConfig.projectId,
    firebaseConfig.appId
  ].every(Boolean);
 
  const hasEmailjsConfig = [
    emailjsConfig.publicKey,
    emailjsConfig.serviceId,
    emailjsConfig.templateId
  ].every(Boolean);
 
  return hasFirebaseConfig && hasEmailjsConfig;
}
 
function initIntegrations() {
  if (!isConfigReady()) {
    return;
  }
 
  const firebaseApp = initializeApp(firebaseConfig);
  firestore = getFirestore(firebaseApp);
  emailjs.init({
    publicKey: emailjsConfig.publicKey
  });
}
 
function setFeedback(message, isError = false) {
  feedback.textContent = message;
  feedback.classList.toggle("is-error", isError);
}
 
function setSubmittingState(isSubmitting) {
  submitBookingButton.disabled = isSubmitting;
  submitBookingButton.classList.toggle("submit-loading", isSubmitting);
  submitBookingButton.textContent = isSubmitting
    ? "Saving Booking..."
    : "Submit Booking Request";
}
 
function resetModalState() {
  bookingForm.hidden = false;
  successPanel.hidden = true;
  bookingForm.reset();
  setSubmittingState(false);
  setFeedback("");
}
 
function openModal(service) {
  activeService = service;
  resetModalState();
  selectedServiceText.textContent = `${service.name} • ${service.duration} • ${service.price}`;
  depositSummary.textContent = `${service.deposit}. A booking coordinator will confirm payment details and your final appointment window after review.`;
 modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}
 
function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  window.setTimeout(resetModalState, 180);
}
 
function getServiceDetails(card) {
  return {
    name: card.dataset.service,
    duration: card.dataset.duration,
    price: card.dataset.price,
    deposit: card.dataset.deposit
  };
}
 
function validateForm(values) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phonePattern = /^[+0-9()\-\s]{7,20}$/;
 
  if (!activeService.name) {
    return "Please select a service before submitting your booking.";
  }
 
  if (!values.fullName || values.fullName.length < 2) {
    return "Please enter your full name.";
  }
 
  if (!phonePattern.test(values.phone)) {
    return "Please enter a valid phone number.";
  }
 
  if (!emailPattern.test(values.email)) {
    return "Please enter a valid email address.";
  }
 
  if (!values.street || !values.city || !values.region) {
    return "Please complete the delivery address fields.";
  }
 
  if (!values.date || !values.time) {
    return "Please choose a preferred date and time.";
  }
 
  if (!isConfigReady()) {
    return "Firebase and EmailJS are not configured yet. Add your keys in config.js before accepting bookings.";
  }
 
  return "";
}
 
function collectBookingData(formData) {
  return {
    fullName: formData.get("fullName")?.toString().trim() || "",
    phone: formData.get("phone")?.toString().trim() || "",
    email: formData.get("email")?.toString().trim() || "",
    street: formData.get("street")?.toString().trim() || "",
    city: formData.get("city")?.toString().trim() || "",
    region: formData.get("region")?.toString().trim() || "",
    date: formData.get("date")?.toString().trim() || "",
    time: formData.get("time")?.toString().trim() || "",
    notes: formData.get("notes")?.toString().trim() || ""
  };
}
 
function buildBookingRecord(values) {
  return {
    clientFullName: values.fullName,
    clientPhone: values.phone,
    clientEmail: values.email,
    location: {
      street: values.street,
      city: values.city,
      region: values.region
    },
    addressLine: `${values.street}, ${values.city}, ${values.region}`,
    requestedDate: values.date,
    requestedTime: values.time,
    specialNotes: values.notes,
    service: {
      name: activeService.name,
      duration: activeService.duration,
      price: activeService.price,
      deposit: activeService.deposit
    },
    therapistEmail,
    status: "pending",
    createdAt: serverTimestamp()
  };
}
 
async function sendTherapistEmail(record) {
  const templateParams = {
    therapist_email: String(record.therapistEmail || ""),
    client_name: String(record.clientFullName || ""),
    client_phone: String(record.clientPhone || ""),
    client_email: String(record.clientEmail || ""),
    service_name: String(record.service?.name || ""),
    service_price: String(record.service?.price || ""),
    service_duration: String(record.service?.duration || ""),
    service_deposit: String(record.service?.deposit || ""),
    requested_date: String(record.requestedDate || ""),
    requested_time: String(record.requestedTime || ""),
    full_address: String(record.addressLine || ""),
    notes: String(record.specialNotes || "No notes"),
    booking_status: String(record.status || "pending")
  };

     console.log("Sending templateParams to EmailJS:", templateParams);

 
  return emailjs.send(
    emailjsConfig.serviceId,
    emailjsConfig.templateId,
    templateParams
  );
}
 
serviceButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const card = button.closest(".service-card");

    if (!card) {
      return;
    }
 
    openModal(getServiceDetails(card));
  });
});
 
closeTargets.forEach((target) => {
  target.addEventListener("click", closeModal);
});
 
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal.classList.contains("is-open")) {
    closeModal();
  }
});
 
scrollButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const targetSelector = button.getAttribute("data-scroll-target");
    const target = document.querySelector(targetSelector);
 
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});
 bookingForm.addEventListener("submit", async (event) => {
  event.preventDefault();
 
  const formData = new FormData(bookingForm);
  const values = collectBookingData(formData);
  const validationError = validateForm(values);
   if (validationError) {
    setFeedback(validationError, true);
    return;
  }setSubmittingState(true);
  setFeedback("");
 
  try {
    const record = buildBookingRecord(values);
    await addDoc(collection(firestore, collectionName), record);
    await sendTherapistEmail(record);
 
    bookingForm.hidden = true;
    successPanel.hidden = false;
    successSummary.textContent = `Thanks ${record.clientFullName}. Your ${record.service.name} request for ${record.requestedDate} at ${record.requestedTime} has been saved and the therapist at ${therapistEmail} has been notified.`;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "We could not submit your booking right now. Please try again.";
 
    setFeedback(message, true);
  } finally {
    setSubmittingState(false);
  }
});
 
initIntegrations();
