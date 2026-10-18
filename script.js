const modal = document.getElementById("bookingModal");
const selectedServiceText = document.getElementById("selectedServiceText");
const depositSummary = document.getElementById("depositSummary");
const bookingForm = document.getElementById("bookingForm");
const feedback = document.getElementById("formFeedback");
const serviceButtons = document.querySelectorAll(".service-button");
const closeTargets = document.querySelectorAll("[data-close-modal]");
const scrollButtons = document.querySelectorAll("[data-scroll-target]");
 
let activeService = {
name: "",
duration: "",
price: "",
deposit: ""
};
 
function openModal(service) {
activeService = service;
selectedServiceText.textContent = `${service.name} • ${service.duration} • ${service.price}`;
depositSummary.textContent = `${service.deposit}. A booking coordinator will confirm payment details and your final appointment window after review.`;
feedback.textContent = "";
modal.classList.add("is-open");
modal.setAttribute("aria-hidden", "false");
document.body.classList.add("modal-open");
}
 
function closeModal() {
modal.classList.remove("is-open");
modal.setAttribute("aria-hidden", "true");
document.body.classList.remove("modal-open");
}
 
function getServiceDetails(card) {
return {
name: card.dataset.service,
duration: card.dataset.duration,
price: card.dataset.price,
deposit: card.dataset.deposit
};
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
 
// bookingForm.addEventListener("submit", (event) => {
// event.preventDefault();
 
// const formData = new FormData(bookingForm);
// const fullName = formData.get("fullName");
// const date = formData.get("date");
// const time = formData.get("time");
 
// feedback.textContent = `Thanks ${fullName}. Your request for ${activeService.name} on ${date} at ${time} has been captured. We will contact you shortly with deposit payment instructions.`;
// bookingForm.reset();
 
// window.setTimeout(() => {
// closeModal();
// }, 3000);
// });


bookingForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  // 1. Reference feedback element & submit button
  const feedback = document.getElementById("formFeedback") || document.querySelector(".form-feedback");
  const submitBtn = bookingForm.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  // 2. Extract values matching your form's exact input names
  const formData = new FormData(bookingForm);
  const fullName = formData.get("fullName");
  const date = formData.get("date");
  const time = formData.get("time");
  const phone = formData.get("phone");
  const email = formData.get("email");
  const street = formData.get("street");
  const city = formData.get("city");
  const region = formData.get("region");
  const notes = formData.get("notes") || "None";

  // Full formatted location string
  const fullAddress = `${street}, ${city}, ${region}`;

  // Show progress message
  if (feedback) feedback.textContent = "Submitting your booking request...";

  try {
    // 3. Save to Firebase Firestore
    const docRef = await window.addDoc(window.collection(window.db, window.APP_CONFIG.bookingCollection), {
      fullName: fullName,
      serviceName: typeof activeService !== "undefined" ? activeService.name : "Massage Therapy",
      date: date,
      time: time,
      phone: phone,
      email: email,
      street: street,
      city: city,
      region: region,
      fullAddress: fullAddress,
      notes: notes,
      status: "pending",
      createdAt: window.serverTimestamp()
    });

    console.log("Booking saved in Firebase ID:", docRef.id);

    // 4. Send Email Notification via Resend API
    const emailPayload = {
      from: "onboarding@resend.dev", // Resend default test sender
      to: [window.APP_CONFIG.therapistEmail],
      subject: `New Booking Request from ${fullName}`,
      html: `
        <h2>New Massage Booking Received!</h2>
        <p><strong>Client Name:</strong> ${fullName}</p>
        <p><strong>Service:</strong> ${typeof activeService !== "undefined" ? activeService.name : "Massage Therapy"}</p>
        <p><strong>Date & Time:</strong> ${date} at ${time}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Email:</strong> ${email}</p>
        <hr />
        <h3>Location / Delivery Address:</h3>
        <p><strong>Street:</strong> ${street}</p>
        <p><strong>City:</strong> ${city}</p>
        <p><strong>State / Region:</strong> ${region}</p>
        <hr />
        <p><strong>Notes / Special Instructions:</strong> ${notes}</p>
      `
    };

    // const resendResponse = await fetch("https://api.resend.com/emails", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     "Authorization": `Bearer ${window.APP_CONFIG.resend.apiKey}`
    //   },
    //   body: JSON.stringify(emailPayload)
    // });


    const resendResponse = await fetch("/api/send-email", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    fullName,
    serviceName: typeof activeService !== "undefined" ? activeService.name : "Massage Therapy",
    date,
    time,
    phone,
    email,
    street,
    city,
    region,
    notes
  })
});

    if (!resendResponse.ok) {
      console.warn("Resend email warning:", await resendResponse.json());
    }

    // 5. Display confirmation feedback
    const serviceTitle = typeof activeService !== "undefined" ? activeService.name : "your service";
    if (feedback) {
      feedback.textContent = `Thanks ${fullName}. Your request for ${serviceTitle} on ${date} at ${time} has been captured. We will contact you shortly with deposit payment instructions.`;
    }

    bookingForm.reset();

    // 6. Automatically close modal after 3 seconds
    window.setTimeout(() => {
      if (typeof closeModal === "function") {
        closeModal();
      }
      if (submitBtn) submitBtn.disabled = false;
    }, 1800);

  } catch (error) {
    console.error("Booking submission error:", error);
    if (feedback) {
      feedback.textContent = "There was an error saving your request. Please try again.";
    }
    if (submitBtn) submitBtn.disabled = false;
  }
});
